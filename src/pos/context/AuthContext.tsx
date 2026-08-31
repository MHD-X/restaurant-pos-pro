import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

export type AuthRole = 'admin' | 'cashier';

const PIN_KEY = 'pos.pins.v1';
const SESSION_KEY = 'pos.session.role';
const LOCK_KEY = 'pos.session.lockUntil';
const FAILS_KEY = 'pos.session.fails';

/** عدد المحاولات الخاطئة قبل قفل لوحة الدخول. */
const MAX_ATTEMPTS = 5;
/** مدة القفل بعد استنفاد المحاولات (بالثواني). */
const LOCK_SECONDS = 30;
/** مدة الخمول قبل تسجيل الخروج التلقائي (بالدقائق). */
const IDLE_MINUTES = 15;

const DEFAULT_PINS: Record<AuthRole, string> = {
  admin: '7070',
  cashier: '2020',
};

interface PinMap {
  admin: string;
  cashier: string;
}

interface AuthContextValue {
  role: AuthRole | null;
  pins: PinMap;
  /** عدد الثواني المتبقية على القفل، 0 يعني غير مقفل. */
  lockRemaining: number;
  failedAttempts: number;
  login: (pin: string) => AuthRole | null;
  logout: () => void;
  /** يغيّر رمز الدور المحدد. يتحقق من الرمز الحالي إن طُلب ذلك. */
  changePin: (
    target: AuthRole,
    newPin: string,
    currentPin?: string,
  ) => { ok: boolean; error?: string };
  resetPin: (target: AuthRole) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readNumber(key: string): number {
  if (typeof window === 'undefined') return 0;
  const raw = Number(localStorage.getItem(key));
  return Number.isFinite(raw) ? raw : 0;
}

function loadPins(): PinMap {
  if (typeof window === 'undefined') return { ...DEFAULT_PINS };
  try {
    const raw = localStorage.getItem(PIN_KEY);
    if (!raw) return { ...DEFAULT_PINS };
    const parsed = JSON.parse(raw) as Partial<PinMap>;
    return {
      admin: parsed.admin || DEFAULT_PINS.admin,
      cashier: parsed.cashier || DEFAULT_PINS.cashier,
    };
  } catch {
    return { ...DEFAULT_PINS };
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [pins, setPins] = useState<PinMap>(() => loadPins());
  const [role, setRole] = useState<AuthRole | null>(() => {
    if (typeof window === 'undefined') return null;
    const saved = localStorage.getItem(SESSION_KEY);
    return saved === 'admin' || saved === 'cashier' ? saved : null;
  });
  const [failedAttempts, setFailedAttempts] = useState<number>(() => readNumber(FAILS_KEY));
  const [lockUntil, setLockUntil] = useState<number>(() => readNumber(LOCK_KEY));
  const [now, setNow] = useState(() => Date.now());

  const lockRemaining = Math.max(0, Math.ceil((lockUntil - now) / 1000));

  /* مؤقّت العد التنازلي للقفل */
  useEffect(() => {
    if (lockUntil <= Date.now()) return;
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [lockUntil]);

  useEffect(() => {
    try {
      localStorage.setItem(PIN_KEY, JSON.stringify(pins));
    } catch {
      /* تجاهل */
    }
  }, [pins]);

  useEffect(() => {
    try {
      if (role) localStorage.setItem(SESSION_KEY, role);
      else localStorage.removeItem(SESSION_KEY);
    } catch {
      /* تجاهل */
    }
  }, [role]);

  const logout = useCallback(() => setRole(null), []);

  /* خروج تلقائي عند الخمول لحماية الجهاز المتروك مفتوحًا */
  const logoutRef = useRef(logout);
  logoutRef.current = logout;
  useEffect(() => {
    if (!role || typeof window === 'undefined') return;
    let timer: ReturnType<typeof setTimeout>;
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(() => logoutRef.current(), IDLE_MINUTES * 60_000);
    };
    const events: (keyof WindowEventMap)[] = ['pointerdown', 'keydown', 'wheel', 'touchstart'];
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();
    return () => {
      clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [role]);

  const login = useCallback(
    (pin: string): AuthRole | null => {
      if (lockUntil > Date.now()) return null;
      const value = pin.trim();
      const matched: AuthRole | null =
        value && value === pins.admin
          ? 'admin'
          : value && value === pins.cashier
            ? 'cashier'
            : null;

      if (matched) {
        setRole(matched);
        setFailedAttempts(0);
        try {
          localStorage.removeItem(FAILS_KEY);
          localStorage.removeItem(LOCK_KEY);
        } catch {
          /* تجاهل */
        }
        return matched;
      }

      const fails = failedAttempts + 1;
      setFailedAttempts(fails);
      try {
        localStorage.setItem(FAILS_KEY, String(fails));
      } catch {
        /* تجاهل */
      }
      if (fails >= MAX_ATTEMPTS) {
        const until = Date.now() + LOCK_SECONDS * 1000;
        setLockUntil(until);
        setNow(Date.now());
        setFailedAttempts(0);
        try {
          localStorage.setItem(LOCK_KEY, String(until));
          localStorage.removeItem(FAILS_KEY);
        } catch {
          /* تجاهل */
        }
      }
      return null;
    },
    [pins, failedAttempts, lockUntil],
  );

  const changePin = useCallback(
    (target: AuthRole, newPin: string, currentPin?: string) => {
      if (currentPin !== undefined && currentPin !== pins[target]) {
        return { ok: false, error: 'الرمز الحالي غير صحيح' };
      }
      if (!/^\d{4,6}$/.test(newPin)) {
        return { ok: false, error: 'الرمز يجب أن يكون من 4 إلى 6 أرقام' };
      }
      if (/^(\d)\1+$/.test(newPin)) {
        return { ok: false, error: 'لا يمكن استخدام رقم مكرر بالكامل (مثل 1111)' };
      }
      if (newPin === '1234' || newPin === '0000' || newPin === '123456') {
        return { ok: false, error: 'هذا الرمز ضعيف جدًا، اختر رمزًا آخر' };
      }
      const other: AuthRole = target === 'admin' ? 'cashier' : 'admin';
      if (newPin === pins[other]) {
        return { ok: false, error: 'هذا الرمز مستخدم بالفعل لدور آخر' };
      }
      setPins((prev) => ({ ...prev, [target]: newPin }));
      return { ok: true };
    },
    [pins],
  );

  const resetPin = useCallback((target: AuthRole) => {
    setPins((prev) => ({ ...prev, [target]: DEFAULT_PINS[target] }));
  }, []);

  const value = useMemo(
    () => ({
      role,
      pins,
      lockRemaining,
      failedAttempts,
      login,
      logout,
      changePin,
      resetPin,
    }),
    [role, pins, lockRemaining, failedAttempts, login, logout, changePin, resetPin],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export const AUTH_LIMITS = { MAX_ATTEMPTS, LOCK_SECONDS, IDLE_MINUTES };

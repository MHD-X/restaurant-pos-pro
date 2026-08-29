import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type AuthRole = 'admin' | 'cashier';

const PIN_KEY = 'pos.pins.v1';
const SESSION_KEY = 'pos.session.role';

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

  const login = useCallback(
    (pin: string): AuthRole | null => {
      const value = pin.trim();
      if (value && value === pins.admin) {
        setRole('admin');
        return 'admin';
      }
      if (value && value === pins.cashier) {
        setRole('cashier');
        return 'cashier';
      }
      return null;
    },
    [pins],
  );

  const logout = useCallback(() => setRole(null), []);

  const changePin = useCallback(
    (target: AuthRole, newPin: string, currentPin?: string) => {
      if (currentPin !== undefined && currentPin !== pins[target]) {
        return { ok: false, error: 'الرمز الحالي غير صحيح' };
      }
      if (!/^\d{4,6}$/.test(newPin)) {
        return { ok: false, error: 'الرمز يجب أن يكون من 4 إلى 6 أرقام' };
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
    () => ({ role, pins, login, logout, changePin, resetPin }),
    [role, pins, login, logout, changePin, resetPin],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

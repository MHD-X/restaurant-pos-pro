import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { Settings } from '@/pos/types';
import { loadSettings, saveSettings, STORAGE_KEY } from '@/pos/utils/storage';

interface SettingsContextValue {
  settings: Settings;
  update: (updater: (prev: Settings) => Settings) => void;
  set: (patch: Partial<Settings>) => void;
  /** آخر خطأ حفظ (مثل امتلاء مساحة المتصفح)، أو null. */
  storageError: string | null;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => loadSettings());
  const [storageError, setStorageError] = useState<string | null>(null);
  const writingRef = useRef(false);

  /* حفظ مؤجَّل (debounce) لتقليل الكتابة على القرص أثناء الإدخال السريع */
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        writingRef.current = true;
        saveSettings(settings);
        setStorageError(null);
      } catch {
        setStorageError('تعذّر حفظ البيانات — مساحة التخزين ممتلئة. صدّر نسخة احتياطية وامسح الطلبات القديمة.');
      } finally {
        setTimeout(() => {
          writingRef.current = false;
        }, 0);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [settings]);

  /* حفظ فوري عند إغلاق التبويب حتى لا تضيع آخر التعديلات */
  useEffect(() => {
    const flush = () => {
      try {
        saveSettings(settings);
      } catch {
        /* تجاهل */
      }
    };
    window.addEventListener('beforeunload', flush);
    return () => window.removeEventListener('beforeunload', flush);
  }, [settings]);

  /* مزامنة بين تبويبات/أجهزة الكاشير المفتوحة على نفس المتصفح */
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY || writingRef.current || !e.newValue) return;
      try {
        setSettings(JSON.parse(e.newValue) as Settings);
      } catch {
        /* تجاهل */
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const update = useCallback((updater: (prev: Settings) => Settings) => {
    setSettings((prev) => updater(prev));
  }, []);

  const set = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, update, set, storageError }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}

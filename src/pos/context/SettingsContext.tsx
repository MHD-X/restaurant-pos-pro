import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { Settings } from '@/types';
import { loadSettings, saveSettings } from '@/utils/storage';

interface SettingsContextValue {
  settings: Settings;
  update: (updater: (prev: Settings) => Settings) => void;
  set: (patch: Partial<Settings>) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => loadSettings());

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const update = useCallback((updater: (prev: Settings) => Settings) => {
    setSettings((prev) => updater(prev));
  }, []);

  const set = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, update, set }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}

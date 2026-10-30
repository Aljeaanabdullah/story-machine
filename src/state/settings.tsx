import { getLocales } from 'expo-localization';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useReducedMotion } from 'react-native-reanimated';

import { directionStyles, type Direction } from '@/i18n/direction';
import { t, type Strings } from '@/i18n/strings';
import { DEFAULT_SETTINGS, loadSettings, saveSettings, type Settings } from '@/lib/storage';

type SettingsContextValue = {
  settings: Settings;
  ready: boolean;
  update: (patch: Partial<Settings>) => void;
  s: Strings;
  dir: Direction;
  /** True when either the OS or the in-app toggle asks for less motion. */
  calm: boolean;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

function deviceDefaults(): Settings {
  const code = getLocales()[0]?.languageCode;
  const lang = code === 'ar' ? 'ar' : 'en';
  return { ...DEFAULT_SETTINGS, uiLanguage: lang, storyLanguage: lang };
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(deviceDefaults);
  const [ready, setReady] = useState(false);
  const systemReduced = useReducedMotion();

  useEffect(() => {
    let alive = true;
    loadSettings().then((saved) => {
      if (!alive) return;
      if (saved) setSettings(saved);
      setReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveSettings(next).catch(() => {});
      return next;
    });
  }, []);

  const value = useMemo<SettingsContextValue>(
    () => ({
      settings,
      ready,
      update,
      s: t(settings.uiLanguage),
      dir: directionStyles(settings.uiLanguage === 'ar'),
      calm: settings.reduceMotion || systemReduced,
    }),
    [settings, ready, update, systemReduced],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used inside SettingsProvider');
  return ctx;
}

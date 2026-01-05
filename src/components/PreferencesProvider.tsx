'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type ThemeMode = 'system' | 'light' | 'dark';
export type Language = 'en' | 'zh';
export type TempUnit = 'auto' | 'celsius' | 'fahrenheit';

type Preferences = {
  theme: ThemeMode;
  language: Language;
  tempUnit: TempUnit;
  setTheme: (t: ThemeMode) => void;
  setLanguage: (l: Language) => void;
  setTempUnit: (u: TempUnit) => void;
  resolvedTheme: 'light' | 'dark';
  resolvedTempUnit: 'celsius' | 'fahrenheit';
};

const PreferencesContext = createContext<Preferences | null>(null);

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function guessTempUnitFromLocale(): 'celsius' | 'fahrenheit' {
  const locale =
    (typeof navigator !== 'undefined' && (navigator.language || (navigator.languages && navigator.languages[0]))) ||
    'en-US';

  const region = (locale.split('-')[1] || '').toUpperCase();

  // Countries that commonly use Fahrenheit
  const fahrenheitRegions = new Set(['US', 'BS', 'BZ', 'KY', 'PW']);

  return fahrenheitRegions.has(region) ? 'fahrenheit' : 'celsius';
}

function applyThemeClass(resolved: 'light' | 'dark') {
  const root = document.documentElement;
  root.classList.toggle('dark', resolved === 'dark');
  root.style.colorScheme = resolved;
}

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeMode>('system');
  const [language, setLanguage] = useState<Language>('en');
  const [tempUnit, setTempUnit] = useState<TempUnit>('auto');
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>('light');

  // Load persisted preferences
  useEffect(() => {
    try {
      const raw = localStorage.getItem('mb_prefs');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.theme) setTheme(parsed.theme);
        if (parsed?.language) setLanguage(parsed.language);
        if (parsed?.tempUnit) setTempUnit(parsed.tempUnit);
      }
    } catch {}
  }, []);

  // Track system theme changes
  useEffect(() => {
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const update = () => setSystemTheme(mql.matches ? 'dark' : 'light');
    update();

    mql.addEventListener?.('change', update);
    return () => mql.removeEventListener?.('change', update);
  }, []);

  const resolvedTheme: 'light' | 'dark' = useMemo(() => {
    return theme === 'system' ? systemTheme : theme;
  }, [theme, systemTheme]);

  const resolvedTempUnit: 'celsius' | 'fahrenheit' = useMemo(() => {
    if (tempUnit === 'celsius' || tempUnit === 'fahrenheit') return tempUnit;
    return guessTempUnitFromLocale();
  }, [tempUnit]);

  // Apply theme to <html> and persist
  useEffect(() => {
    applyThemeClass(resolvedTheme);
    try {
      localStorage.setItem('mb_prefs', JSON.stringify({ theme, language, tempUnit }));
    } catch {}
  }, [theme, language, tempUnit, resolvedTheme]);

  const value: Preferences = {
    theme,
    language,
    tempUnit,
    setTheme,
    setLanguage,
    setTempUnit,
    resolvedTheme,
    resolvedTempUnit,
  };

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error('usePreferences must be used within PreferencesProvider');
  return ctx;
}
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { applyTheme } from '../theme';

const KEY = 'scanq_theme';
const Ctx = createContext({ mode: 'dark', isDark: true, setDark: () => {} });
export const useTheme = () => useContext(Ctx);

/** Follows the phone's theme on first launch; the Profile switch overrides it and is remembered. */
export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(null);

  useEffect(() => {
    (async () => {
      let saved = null;
      try { saved = await AsyncStorage.getItem(KEY); } catch (e) { /* ignore */ }
      const system = Appearance.getColorScheme();
      setMode(saved === 'light' || saved === 'dark' ? saved : system === 'light' ? 'light' : 'dark');
    })();
  }, []);

  if (mode === null) return null;
  applyTheme(mode); // swap palette BEFORE children render

  const setDark = (isDark) => {
    const m = isDark ? 'dark' : 'light';
    setMode(m);
    AsyncStorage.setItem(KEY, m).catch(() => {});
  };
  return <Ctx.Provider value={{ mode, isDark: mode === 'dark', setDark }}>{children}</Ctx.Provider>;
}

import * as SystemUI from 'expo-system-ui';
import { createContext, Fragment, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { applyTheme, COLOR, getThemeMode, type ThemeMode } from '../theme';
import type { AppearanceChoice } from './settings';
import { useStore } from './store';

const ModeContext = createContext<ThemeMode>('dark');

/** Dark or light, from Settings › Appearance (System follows the phone). */
export function resolveMode(choice: AppearanceChoice | undefined, system: string | null | undefined): ThemeMode {
  if (choice === 'light' || choice === 'dark') return choice;
  return system === 'light' ? 'light' : 'dark';
}

/**
 * Applies the theme to the live tokens (src/theme.ts) before the tree renders, and remounts the
 * tree when it flips so no screen keeps an old colour. Navigation state lives above this, so the
 * screen you are on stays put.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const { settings } = useStore();
  const system = useColorScheme();
  const mode = resolveMode(settings.appearance, system);
  applyTheme(mode);
  const value = useMemo(() => mode, [mode]);
  // The native root view behind the screens (overscroll, transitions) takes the page colour too.
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(COLOR.surface.bg).catch(() => {});
  }, [mode]);
  return (
    <ModeContext.Provider value={value}>
      <Fragment key={mode}>{children}</Fragment>
    </ModeContext.Provider>
  );
}

/** The mode in use (a hook so a component re-renders if it ever needs to). */
export function useThemeMode(): ThemeMode {
  const m = useContext(ModeContext);
  return m ?? getThemeMode();
}

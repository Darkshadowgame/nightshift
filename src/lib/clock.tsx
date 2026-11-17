import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

/**
 * The ticking clock for countdowns, in its own context so a tick only
 * re-renders the screens that show the time, not everything that reads the
 * store. It ticks every 30 s and when the app comes back to the front.
 */

export const TICK_MS = 30_000;

const Clock = createContext<Date>(new Date());

export function ClockProvider({ children }: { children: ReactNode }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), TICK_MS);
    const sub = AppState.addEventListener('change', (st) => {
      if (st === 'active') setNow(new Date());
    });
    return () => {
      clearInterval(t);
      sub.remove();
    };
  }, []);
  return <Clock.Provider value={now}>{children}</Clock.Provider>;
}

/** The current time, updated every 30 s. Only call it in components that show a time or a phase. */
export function useNow(): Date {
  return useContext(Clock);
}

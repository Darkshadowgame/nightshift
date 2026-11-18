import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import { appNow, onClockChange } from './appClock';

/**
 * The ticking clock for countdowns, in its own context so a tick only
 * re-renders the screens that show the time, not everything that reads the
 * store. It reads the app's clock (appClock.ts: the demo's Friday night, or
 * the real time signed in), ticks every 30 s, when the app comes back to the
 * front, and at once when the demo clock is set or restarted.
 */

export const TICK_MS = 30_000;

const Clock = createContext<Date>(appNow());

export function ClockProvider({ children }: { children: ReactNode }) {
  const [now, setNow] = useState(() => appNow());
  useEffect(() => {
    const t = setInterval(() => setNow(appNow()), TICK_MS);
    const sub = AppState.addEventListener('change', (st) => {
      if (st === 'active') setNow(appNow());
    });
    const off = onClockChange(() => setNow(appNow()));
    return () => {
      clearInterval(t);
      sub.remove();
      off();
    };
  }, []);
  return <Clock.Provider value={now}>{children}</Clock.Provider>;
}

/** The current time on the app's clock, updated every 30 s. Only call it in components that show a time or a phase. */
export function useNow(): Date {
  return useContext(Clock);
}

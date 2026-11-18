/**
 * The app's one clock (Redesign 2, WP-A). Every "now" the app shows or decides on comes from
 * `appNow()`, never `new Date()`: the demo runs on a virtual clock (a scripted Friday night,
 * whatever the real time), which is the real clock plus an offset. Signed-in users have no
 * offset, so for them `appNow()` is the real time.
 *
 *   appNow()                       // a Date on the app's clock
 *   appNowMs()                     // the same in ms
 *   setClockOffset(ms)             // 0 for the real clock
 *   setClockTo(virtualNow)         // move the app's clock so that "now" reads `virtualNow`
 *   onClockChange(fn)              // called when the offset changes (returns an unsubscribe)
 *
 * The offset lives in memory. Whoever owns the demo (demoTime.ts) sets it on start-up and
 * persists whatever it needs; this file holds no policy.
 */

let offset = 0;
const listeners = new Set<(offsetMs: number) => void>();

/** Milliseconds on the app's clock. */
export function appNowMs(): number {
  return Date.now() + offset;
}

/** Now, on the app's clock. Use this instead of `new Date()`. */
export function appNow(): Date {
  return new Date(appNowMs());
}

/** How far the app's clock is from the real one, in ms (0 = real time). */
export function clockOffset(): number {
  return offset;
}

/** Shift the app's clock by `ms` from the real time. 0 puts it back. */
export function setClockOffset(ms: number): void {
  const next = Number.isFinite(ms) ? Math.round(ms) : 0;
  if (next === offset) return;
  offset = next;
  listeners.forEach((fn) => fn(offset));
}

/** Set the offset so that the app's clock reads `virtualNow` at this moment. */
export function setClockTo(virtualNow: Date | number): void {
  setClockOffset((typeof virtualNow === 'number' ? virtualNow : virtualNow.getTime()) - Date.now());
}

/** Listen for offset changes (a clock provider re-renders on them). Returns the unsubscribe. */
export function onClockChange(fn: (offsetMs: number) => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/**
 * `weekday` (0 Sun … 6 Sat) at `hh:mm`, local, on `from`'s day or the next one after it. On that
 * weekday it's the same day even when the time has passed. A helper for setting a virtual clock:
 * `setClockTo(weekdayAt(new Date(), 5, 21, 10))` is "this Friday, 21:10".
 */
export function weekdayAt(from: Date, weekday: number, hh: number, mm = 0): Date {
  const d = new Date(from);
  d.setDate(d.getDate() + ((weekday - d.getDay() + 7) % 7));
  d.setHours(hh, mm, 0, 0);
  return d;
}

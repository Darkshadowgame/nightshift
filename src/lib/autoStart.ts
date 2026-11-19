/**
 * The route preview's auto-start (owner, 18 Nov 2026): with only one route, Start counts down
 * from 5 and then starts by itself, like Waze. Pure, so it's tested without a phone.
 *
 * - Two or more routes: never; you pick.
 * - VoiceOver (or any screen reader) on: never; you press Start.
 * - Any touch on the preview (the map, a card, Not now) cancels it for good; Start stays.
 * - It only starts counting once the route is drawn on the map (Review 18), and says so:
 *   "Starting in 5", with "Tap anywhere to stop" under it.
 */

export const AUTO_START_MS = 5000;

export interface AutoStartInput {
  routes: number;
  screenReader: boolean;
  /** Touched the preview since it opened. */
  touched: boolean;
}

/** Whether this preview counts down at all. */
export function autoStartAllowed(x: AutoStartInput): boolean {
  return x.routes === 1 && !x.screenReader && !x.touched;
}

/** Whole seconds left to show on Start ("Start · 5" … "Start · 1"); 0 when it's time. */
export function secondsLeft(startedAt: number, now: number, total = AUTO_START_MS): number {
  return Math.max(0, Math.ceil((startedAt + total - now) / 1000));
}

/** Time to start by itself. */
export function autoStartDue(startedAt: number | null, now: number, total = AUTO_START_MS): boolean {
  return startedAt != null && now - startedAt >= total;
}

/** "Starting in 5" while counting, else "Start". */
export function startLabel(left: number | null): string {
  return left != null && left > 0 ? `Starting in ${left}` : 'Start';
}

/** Under the countdown: how to stay on the preview. */
export const AUTO_START_HINT = 'Tap anywhere to stop';

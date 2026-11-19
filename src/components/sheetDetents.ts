/** The map sheet's detents and where they sit: plain numbers, so they can be tested without the UI. */

export type Detent = 'min' | 'peek' | 'half' | 'full';
/** The detents a drag or a tap on the grabber moves between (min only by the screen's choice). */
export const ORDER: Detent[] = ['peek', 'half', 'full'];
/** How much of the sheet shows at min: the grabber and a one-line bar. */
export const MIN_SHOWN = 22 + 48;

/** Where the sheet's top edge sits for each detent, in the screen's coordinates. */
export function detentTops(height: number, peek: number, top: number): Record<Detent, number> {
  const full = top;
  const peekY = Math.max(full + 120, height - peek);
  const half = Math.min(peekY - 80, Math.max(full + 80, Math.round(height * 0.5)));
  return { min: Math.max(peekY, height - MIN_SHOWN), peek: peekY, half, full };
}

/** The detent to settle on after a drag: where it's heading (with a flick) and the nearest stop. */
export function settle(y: number, vy: number, tops: Record<Detent, number>, fromMin = false): Detent {
  const aim = y + vy * 160;
  let best: Detent = 'peek';
  // A drag only stays at min when it started there (a small nudge); it never drops to min from above.
  for (const d of fromMin ? (['min', ...ORDER] as Detent[]) : ORDER) if (Math.abs(tops[d] - aim) < Math.abs(tops[best] - aim)) best = d;
  return best;
}

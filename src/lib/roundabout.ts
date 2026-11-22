/**
 * Roundabouts: which exit a step takes, and where to draw it.
 *
 * Apple's directions give each step as words only ("At the roundabout, take the 2nd exit onto
 * A51"), with no exit number or exit angles in the data, so the number is read from the words.
 * It is the reliable fact; where the exit points on the ring is a fixed layout, not the real geometry.
 */

const WORDS: Record<string, number> = { first: 1, second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6, seventh: 7, eighth: 8, ninth: 9, tenth: 10 };
const WORD_RE = Object.keys(WORDS).join('|');
/** More exits than this is not a roundabout we draw; the number is dropped and the plain arrow shows. */
export const MAX_EXIT = 9;

const IS_ROUNDABOUT = /roundabout|rotary|traffic circle/i;

/**
 * The exit a roundabout instruction takes (1 to 9), or null: not a roundabout, or no number said
 * ("Enter the roundabout", "Exit the roundabout", "Take the exit"). Reads "take the second exit",
 * "the 3rd exit", "3 exit"-style numerals and "take exit 2".
 */
export function roundaboutExit(text: string | null | undefined): number | null {
  if (!text || !IS_ROUNDABOUT.test(text)) return null;
  const t = text.toLowerCase();
  let n: number | null = null;
  const word = new RegExp(`\\b(${WORD_RE})\\s+exit\\b`).exec(t);
  if (word) n = WORDS[word[1]];
  else {
    const num = /\b(\d{1,2})(?:st|nd|rd|th)?\s+exit\b/.exec(t) ?? /\bexit\s+(?:number\s+|no\.?\s*)?(\d{1,2})\b/.exec(t);
    if (num) n = Number(num[1]);
  }
  return n !== null && n >= 1 && n <= MAX_EXIT ? n : null;
}

/** 1 → "1st", 2 → "2nd", 11 → "11th". */
export function ordinal(n: number): string {
  const v = n % 100;
  const suffix = v >= 11 && v <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n % 10] ?? 'th';
  return `${n}${suffix}`;
}

const SAID = ['', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth'];

/** For a screen reader: "Roundabout, second exit". */
export function roundaboutLabel(exit: number | null): string {
  return exit ? `Roundabout, ${SAID[exit] ?? ordinal(exit)} exit` : 'Roundabout';
}

/** The short line when the road isn't named: "Take the 3rd exit". */
export function exitLine(exit: number): string {
  return `Take the ${ordinal(exit)} exit`;
}

/**
 * For the lock screen, whose widget draws only fixed arrows: "2nd exit · A51", or just "2nd exit"
 * when no road is named. A title that already says the exit is left as it is.
 */
export function lockScreenRoad(title: string, exit: number | null): string {
  if (!exit || /\bexit\b/i.test(title)) return title;
  return title ? `${ordinal(exit)} exit · ${title}` : `${ordinal(exit)} exit`;
}

/**
 * Where exit `n` leaves the ring, in degrees clockwise from straight up on the screen. You enter
 * from the bottom (180°) and go clockwise, as in the UK: 1st exit left, 2nd straight on, 3rd right,
 * 4th back the way you came (set a little round from the entry so the two don't overlap). From the
 * 5th on, exits are spread evenly round the ring as if it had one exit more than that.
 */
export function exitAngle(n: number): number {
  const fixed = [270, 0, 90, 135];
  if (n >= 1 && n <= 4) return fixed[n - 1];
  const k = Math.max(5, Math.round(n));
  return (180 + (k * 360) / (k + 1)) % 360;
}

/** The angles of the other arms drawn faintly (left, ahead, right), without the taken one. */
export function otherArms(n: number): number[] {
  return [270, 0, 90].filter((a) => a !== exitAngle(n));
}

/** A point on a circle, angle clockwise from up, as screen x/y (y down). */
export function polar(cx: number, cy: number, r: number, deg: number): { x: number; y: number } {
  const a = (deg * Math.PI) / 180;
  return { x: cx + r * Math.sin(a), y: cy - r * Math.cos(a) };
}

/** Degrees travelled clockwise from the entry (180°) to the exit, 0 to 360. */
export function sweepTo(n: number): number {
  return (((exitAngle(n) - 180) % 360) + 360) % 360;
}

/**
 * The first 30 seconds (docs/SPEC.md): Welcome hands Tonight one thing to say
 * once, right after the profile is saved: "here's tonight's meet, say you're
 * going with the car you just added". Kept in memory only: it stays until it's
 * used or dismissed (the screen can mount more than once while the router
 * settles), and never comes back after a restart.
 */
let pending: { buildId?: string } | null = null;

/** Welcome: the profile is saved; Tonight should open with the "I'm going" highlight. */
export function markJustOnboarded(buildId?: string): void {
  pending = { buildId };
}

/** Tonight: the highlight, if there is one. */
export function justOnboarded(): { buildId?: string } | null {
  return pending;
}

/** Tonight: the highlight was used ("I'm going") or dismissed ("Not now"). */
export function clearJustOnboarded(): void {
  pending = null;
}

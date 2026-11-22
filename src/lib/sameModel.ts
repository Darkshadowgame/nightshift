import type { Build, User } from './types';

/**
 * Quiet introductions: people in your region with the same make and model as a vehicle in your garage.
 * Region only. Never a distance, never a place. Opting out hides you from the list and the list from you.
 */

export interface SameModelMatch {
  user: User;
  /** Their vehicle. */
  build: Build;
  /** The one of yours it matches. */
  mine: Build;
}

/** Make and model, compared without case, spaces or punctuation: "MX-5" matches "mx5". */
export function modelKey(b: Pick<Build, 'make' | 'model'>): string {
  return `${b.make}|${b.model}`.toLowerCase().replace(/[^a-z0-9|]/g, '');
}

export const SAME_MODEL_MAX = 6;

export function sameModelNear(opts: {
  me: string;
  users: User[];
  builds: Build[];
  blocked: ReadonlySet<string>;
  /** People who opted out. */
  hidden?: ReadonlySet<string>;
  /** You opted out. */
  meHidden?: boolean;
  /** People you're already connected to need no introduction. */
  skip?: ReadonlySet<string>;
  max?: number;
}): SameModelMatch[] {
  const meUser = opts.users.find((u) => u.id === opts.me);
  if (!meUser || opts.meHidden || !meUser.region) return [];
  const mine = new Map<string, Build>();
  for (const b of opts.builds) if (b.ownerId === opts.me && !mine.has(modelKey(b))) mine.set(modelKey(b), b);
  if (mine.size === 0) return [];
  const region = meUser.region.trim().toLowerCase();
  const out: SameModelMatch[] = [];
  const seen = new Set<string>();
  for (const build of opts.builds) {
    const user = opts.users.find((u) => u.id === build.ownerId);
    const own = mine.get(modelKey(build));
    if (!user || !own || user.id === opts.me || seen.has(user.id)) continue;
    if (opts.blocked.has(user.id) || opts.hidden?.has(user.id) || opts.skip?.has(user.id)) continue;
    if (user.region.trim().toLowerCase() !== region) continue;
    seen.add(user.id);
    out.push({ user, build, mine: own });
  }
  return out.sort((a, b) => a.user.handle.localeCompare(b.user.handle)).slice(0, opts.max ?? SAME_MODEL_MAX);
}

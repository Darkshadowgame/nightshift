import { storagePathOf } from './backend/mapping';
import type { Build } from './types';

/**
 * Profile pictures. The choice lives on the profile (`profiles.avatar_ref`, 20261121150000) so everyone
 * sees it; in the demo it lives on the demo person. A picture is one of:
 *   - a photo picked from the library (uploaded to {uid}/avatar/…),
 *   - one of your own vehicle photos,
 *   - nothing: the default, your main vehicle's photo.
 * Pure rules only: no network, no storage.
 */

/** Where a chosen photo goes when saving. */
export type AvatarPlan =
  /** Go back to the default. */
  | { kind: 'clear' }
  /** Already in Storage and yours: just point the profile at it. */
  | { kind: 'path'; path: string }
  /** A file on the phone (a library pick): upload it first. */
  | { kind: 'upload'; ref: string }
  /** Can't be kept on a profile (a demo sample photo, someone else's file). */
  | { kind: 'refuse' };

/** The photos refs a signed-in profile can point at: Storage paths in your own folder. */
export function ownPath(ref: string, uid: string): string | null {
  const path = storagePathOf(ref);
  return path && path.startsWith(`${uid}/`) ? path : null;
}

/** What to do with a chosen ref when signed in. */
export function planAvatar(ref: string | null | undefined, uid: string): AvatarPlan {
  if (!ref) return { kind: 'clear' };
  if (ref.startsWith('sample:')) return { kind: 'refuse' };
  const path = storagePathOf(ref);
  if (path) return path.startsWith(`${uid}/`) ? { kind: 'path', path } : { kind: 'refuse' };
  if (/^https?:/i.test(ref)) return { kind: 'refuse' };
  return { kind: 'upload', ref };
}

/** The same photo, whatever its signed link says (links change each time they are signed). */
export function samePhoto(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  if (a === b) return true;
  const pa = storagePathOf(a);
  return !!pa && pa === storagePathOf(b);
}

/** Is this one of the photos of the given vehicles? */
export function isVehiclePhoto(ref: string | null | undefined, builds: Pick<Build, 'photos'>[]): boolean {
  return !!ref && builds.some((b) => b.photos.some((p) => samePhoto(p, ref)));
}

/**
 * The old per-phone choice (`settings.avatarRef`) on its way to the profile: 'adopt' (save it, if the
 * profile has none yet), or 'drop' (forget it: nothing to move, or it can't be kept).
 */
export function legacyAvatar(
  legacy: string | null | undefined,
  profileRef: string | null | undefined,
  builds: Pick<Build, 'photos'>[],
  uid: string,
  demo: boolean,
): 'adopt' | 'drop' | 'none' {
  if (!legacy) return 'none';
  if (profileRef) return 'drop';
  // The old choice only counted while that photo was still one of your vehicles'.
  if (!isVehiclePhoto(legacy, builds)) return 'drop';
  if (demo) return 'adopt';
  return planAvatar(legacy, uid).kind === 'path' ? 'adopt' : 'drop';
}

/** The Storage path of an uploaded library picture ({uid}/avatar/…), so an old one can be removed. */
export function avatarUploadPath(path: string | null | undefined, uid: string): string | null {
  return path && new RegExp(`^${uid}/avatar/[A-Za-z0-9._-]+$`).test(path) ? path : null;
}

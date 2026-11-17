/**
 * How photos are kept. Finished photos live in the app's documents folder
 * under `photos/`, and the store keeps only the file name ("ph-abc.jpg").
 * The full path changes when iOS reinstalls the app (new container id), so a
 * name is resolved to a path only when a photo is shown.
 */

export const PHOTO_DIR = 'photos';

/** A bare file name we stored, as opposed to a URI (file://, blob:, data:, https:). */
export function isStoredName(ref: string): boolean {
  return !!ref && !ref.includes('/') && !ref.includes(':');
}

/**
 * Older saves kept full paths. If one points into our photos folder (in any
 * app container), keep just the name. Anything else is returned unchanged.
 */
export function nameFromPath(ref: string): string | null {
  if (isStoredName(ref)) return ref;
  const m = ref.match(/\/Documents\/photos\/([^/?#]+)$/);
  return m ? decodeURIComponent(m[1]) : null;
}

export function newPhotoName(random: () => number = Math.random, now = Date.now()): string {
  return `ph-${now.toString(36)}${Math.floor(random() * 36 ** 6).toString(36).padStart(6, '0')}.jpg`;
}

/**
 * Photos a save no longer uses, so their files can go. Only our stored names,
 * and never one still used elsewhere (e.g. by another build or a spot visit).
 */
export function droppedPhotos(before: string[], after: string[], stillUsed: string[] = []): string[] {
  const keep = new Set([...after, ...stillUsed]);
  return Array.from(new Set(before.filter((ref) => isStoredName(ref) && !keep.has(ref))));
}

import { Directory, File, Paths } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { Platform } from 'react-native';
import { detectPlates, plateRedactorAvailable, redact, type PlateBox } from '../../modules/plate-redactor';
import { isWholeImage, sourceRect, type Box, type Rotation } from './crop';
import { isStoredName, nameFromPath, newPhotoName, PHOTO_DIR } from './photoRefs';

/**
 * Every photo goes through here before it's kept.
 *
 * On iPhone builds the PlateRedactor native module finds UK plates on the phone
 * and pixelates them, then writes a JPEG with no metadata. Elsewhere (web
 * preview, Expo Go) the photo is just re-encoded, which drops GPS and EXIF.
 * expo-image-picker can hand back the original file with GPS, so never keep
 * a picker URI directly.
 *
 * Both write to temp or cache folders that iOS clears, so the finished file is
 * copied into the documents folder and only its name is stored (photoRefs.ts).
 */
const MAX_EDGE = 2048;
const native = Platform.OS !== 'web';

export { plateRedactorAvailable };

export async function findPlates(uri: string): Promise<{ width: number; height: number; boxes: PlateBox[] } | null> {
  try {
    return await detectPlates(uri);
  } catch {
    // No sizes on failure: callers fall back to the picker's own width and height.
    return null;
  }
}

/** Blur the given boxes, save without metadata, and keep it. Returns what to store. */
export async function finishPhoto(uri: string, boxes: PlateBox[], width?: number, height?: number): Promise<string> {
  const redacted = await redact(uri, boxes, 'pixelate', MAX_EDGE);
  const done = redacted ? redacted.uri : await reencode(uri, width, height);
  return keep(done);
}

/**
 * Crop and turn a photo (box drawn on the rotated view, which is viewW x viewH;
 * see crop.ts). Writes a temporary JPEG: it still has to go through
 * finishPhoto before it's kept. The real pixel size is read from the decoded
 * image, so the view's units only need the right shape.
 */
export async function cropPhoto(
  uri: string,
  box: Box,
  rot: Rotation,
  viewW: number,
  viewH: number,
): Promise<{ uri: string; width: number; height: number }> {
  const src = await ImageManipulator.manipulate(uri).renderAsync();
  const ctx = ImageManipulator.manipulate(src);
  if (!isWholeImage(box, viewW, viewH)) ctx.crop(sourceRect(box, rot, viewW, viewH, src.width, src.height));
  if (rot) ctx.rotate(rot);
  const image = await ctx.renderAsync();
  const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.95 });
  return { uri: saved.uri, width: saved.width, height: saved.height };
}

/** Delete a temporary file we made along the way (never a stored photo). Best effort. */
export function discardTemp(uri: string | undefined): void {
  if (!native || !uri || !uri.startsWith('file://') || nameFromPath(uri)) return;
  try {
    const f = new File(uri);
    if (f.exists) f.delete();
  } catch {
    // iOS clears temp and cache folders anyway.
  }
}

function photoDir(): Directory {
  const dir = new Directory(Paths.document, PHOTO_DIR);
  if (!dir.exists) dir.create({ idempotent: true, intermediates: true });
  return dir;
}

/** Copy a finished photo into documents/photos and return its file name. Web keeps the URI. */
function keep(uri: string): string {
  if (!native) return uri;
  const name = newPhotoName();
  const source = new File(uri);
  const target = new File(photoDir(), name);
  source.copySync(target);
  try {
    source.delete();
  } catch {
    // The temp copy goes when iOS clears tmp anyway.
  }
  return name;
}

/** Delete stored photos (file names in our photos folder). Best effort; anything else is left alone. */
export function deletePhotos(refs: string[]): void {
  if (!native) return;
  for (const ref of refs) {
    if (!isStoredName(ref)) continue;
    try {
      const f = new File(Paths.document, PHOTO_DIR, ref);
      if (f.exists) f.delete();
    } catch {
      // A file we can't delete just stays; it isn't shown anywhere.
    }
  }
}

/** The URI to show for a stored photo. */
export function photoUri(ref: string): string {
  if (!native || !isStoredName(ref)) return ref;
  return new File(Paths.document, PHOTO_DIR, ref).uri;
}

/**
 * Older saves kept full file paths, some in temp folders. Best effort: a path
 * into our photos folder becomes its name; a temp file that still exists is
 * rescued into the photos folder. Anything else is left as it was.
 */
export function migratePhotoRef(ref: string): string {
  if (!native) return ref;
  const name = nameFromPath(ref);
  if (name) return name;
  if (!ref.startsWith('file://')) return ref;
  try {
    const source = new File(ref);
    if (!source.exists) return ref;
    const saved = newPhotoName();
    source.copySync(new File(photoDir(), saved));
    return saved;
  } catch {
    return ref;
  }
}

async function reencode(uri: string, width?: number, height?: number): Promise<string> {
  const ctx = ImageManipulator.manipulate(uri);
  if (width && height && Math.max(width, height) > MAX_EDGE) {
    if (width >= height) ctx.resize({ width: MAX_EDGE });
    else ctx.resize({ height: MAX_EDGE });
  }
  const image = await ctx.renderAsync();
  const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.85 });
  return saved.uri;
}

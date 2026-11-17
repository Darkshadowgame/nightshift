import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { detectPlates, plateRedactorAvailable, redact, type PlateBox } from '../../modules/plate-redactor';

/**
 * Every photo goes through here before it's kept.
 *
 * On iPhone builds the PlateRedactor native module finds UK plates on the phone
 * and pixelates them, then writes a JPEG with no metadata. Elsewhere (web
 * preview, Expo Go) the photo is just re-encoded, which drops GPS and EXIF.
 * expo-image-picker can hand back the original file with GPS, so never keep
 * a picker URI directly.
 */
const MAX_EDGE = 2048;

export { plateRedactorAvailable };

export async function findPlates(uri: string): Promise<{ width: number; height: number; boxes: PlateBox[] } | null> {
  try {
    return await detectPlates(uri);
  } catch {
    return { width: 1, height: 1, boxes: [] };
  }
}

/** Blur the given boxes and save without metadata. */
export async function finishPhoto(uri: string, boxes: PlateBox[], width?: number, height?: number): Promise<string> {
  const redacted = await redact(uri, boxes, 'pixelate', MAX_EDGE);
  if (redacted) return redacted.uri;
  return reencode(uri, width, height);
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

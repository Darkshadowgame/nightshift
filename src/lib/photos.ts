import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

/**
 * Every photo goes through here before it's kept.
 * expo-image-picker hands back the original file (with GPS and camera EXIF) when
 * picking from the library, so the image is re-encoded, which drops that metadata,
 * and scaled down to a sensible upload size.
 *
 * Plate redaction plugs in here too (see docs/research/plate-blurring.md): detect
 * plate boxes on the phone, pixelate them, then re-encode. Until the native
 * plate module lands, nothing with a visible plate should leave the phone.
 */
const MAX_EDGE = 2048;

export async function cleanPhoto(uri: string, width?: number, height?: number): Promise<string> {
  const ctx = ImageManipulator.manipulate(uri);
  if (width && height && Math.max(width, height) > MAX_EDGE) {
    if (width >= height) ctx.resize({ width: MAX_EDGE });
    else ctx.resize({ height: MAX_EDGE });
  }
  const image = await ctx.renderAsync();
  const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.85 });
  return saved.uri;
}

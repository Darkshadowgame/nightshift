import { requireOptionalNativeModule } from 'expo';

/**
 * Text from a photo, on the phone (private and free: no AI service, nothing uploaded).
 *
 * Over the air today there's no text recognition in the installed app, so this returns null and
 * the dyno form says "Type the peak figures from your sheet". The iPhone build that adds Apple
 * Vision text recognition (branch `native-dyno-ocr`, build 12) exposes `recognizeText(uri)` on the
 * NavDirections module; this picks it up when it's there, with no JS change.
 */
type Recognizer = { recognizeText?: (uri: string) => Promise<string> };

export async function ocrText(uri: string): Promise<string | null> {
  try {
    const mod = requireOptionalNativeModule<Recognizer>('NavDirections');
    if (!mod?.recognizeText) return null;
    const text = await mod.recognizeText(uri);
    return text && text.trim() ? text : null;
  } catch {
    return null;
  }
}

/** Whether this install can read text from a photo. */
export function ocrAvailable(): boolean {
  try {
    return !!requireOptionalNativeModule<Recognizer>('NavDirections')?.recognizeText;
  } catch {
    return false;
  }
}

import * as ImagePicker from 'expo-image-picker';
import { useRef, useState, type ReactNode } from 'react';
import { Image } from 'react-native';
import { isWholeImage, type AspectKey, type Box, type Rotation } from '../lib/crop';
import { cropPhoto, discardTemp, findPlates, finishPhoto, photoUri, plateRedactorAvailable } from '../lib/photos';
import { CropEditor } from './CropEditor';
import { PlateReview, type PendingPhoto } from './PlateReview';

type Step =
  | { step: 'crop'; uri: string; width?: number; height?: number; saved: boolean; replaces?: string; temps: string[] }
  | { step: 'plates'; photo: PendingPhoto; recheck: boolean; replaces?: string; temps: string[] };

function sizeOf(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => Image.getSize(uri, (width, height) => resolve({ width, height }), reject));
}

/**
 * Every way a photo comes in or gets edited: pick → crop → plate check → save,
 * plus crop again and re-check plates on a saved photo. Saved photos always go
 * through finishPhoto, so they land in documents/photos with no metadata.
 *
 * Render `view` when it isn't null (the crop editor is a full-screen modal; the
 * plate check is a card). `onPhoto` gets the stored name, and the name it
 * replaces when a saved photo was edited.
 */
export function usePhotoFlow({
  onPhoto,
  onError,
  cameraDenied = 'Allow camera access to take a photo.',
  aspect = 'free',
}: {
  onPhoto: (ref: string, replaces?: string) => void;
  onError: (message: string | null) => void;
  cameraDenied?: string;
  aspect?: AspectKey;
}): {
  pick: (camera?: boolean) => Promise<void>;
  recrop: (ref: string) => void;
  recheck: (ref: string) => Promise<void>;
  busy: boolean;
  view: ReactNode | null;
} {
  const [step, setStep] = useState<Step | null>(null);
  const [busy, setBusy] = useState(false);
  // Async steps finish after re-renders: always call the latest handlers.
  const cb = useRef({ onPhoto, onError });
  cb.current = { onPhoto, onError };

  function end(temps: string[]) {
    setStep(null);
    for (const t of temps) discardTemp(t);
  }

  function done(ref: string, temps: string[], replaces?: string) {
    end(temps);
    cb.current.onPhoto(ref, replaces);
  }

  async function pick(camera = false) {
    cb.current.onError(null);
    try {
      if (camera) {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) return cb.current.onError(cameraDenied);
      }
      const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.9, exif: false };
      const res = camera ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
      if (res.canceled) return;
      const a = res.assets[0];
      setStep({ step: 'crop', uri: a.uri, width: a.width, height: a.height, saved: false, temps: [a.uri] });
    } catch {
      cb.current.onError("Couldn't open that photo. Try another one.");
    }
  }

  function recrop(ref: string) {
    cb.current.onError(null);
    setStep({ step: 'crop', uri: photoUri(ref), saved: true, replaces: ref, temps: [] });
  }

  async function recheck(ref: string) {
    cb.current.onError(null);
    setBusy(true);
    try {
      const uri = photoUri(ref);
      const found = await findPlates(uri);
      const size = found?.width && found?.height ? { width: found.width, height: found.height } : await sizeOf(uri);
      setStep({ step: 'plates', photo: { uri, ...size, boxes: found?.boxes ?? [] }, recheck: true, replaces: ref, temps: [] });
    } catch {
      cb.current.onError("Couldn't open that photo.");
    } finally {
      setBusy(false);
    }
  }

  /** After the crop (or skipping it): a new photo gets its plate check; a saved one is kept as it is. */
  async function next(uri: string, width: number | undefined, height: number | undefined, s: Extract<Step, { step: 'crop' }>, temps: string[]) {
    if (!s.saved && plateRedactorAvailable) {
      const found = await findPlates(uri);
      setStep({
        step: 'plates',
        photo: { uri, width: found?.width || width || 0, height: found?.height || height || 0, boxes: found?.boxes ?? [] },
        recheck: false,
        temps,
      });
    } else {
      done(await finishPhoto(uri, [], width, height), temps, s.replaces);
    }
  }

  async function onCrop(box: Box, rot: Rotation, viewW: number, viewH: number) {
    if (step?.step !== 'crop') return;
    const s = step;
    setBusy(true);
    try {
      if (rot === 0 && isWholeImage(box, viewW, viewH)) {
        // Nothing changed: a saved photo stays as it is; a new one goes on as picked.
        if (s.saved) end(s.temps);
        else await next(s.uri, s.width, s.height, s, s.temps);
      } else {
        const out = await cropPhoto(s.uri, box, rot, viewW, viewH);
        await next(out.uri, out.width, out.height, s, [...s.temps, out.uri]);
      }
    } catch {
      cb.current.onError("Couldn't crop that photo. Try again.");
      end(s.temps);
    } finally {
      setBusy(false);
    }
  }

  async function onSkip() {
    if (step?.step !== 'crop') return;
    const s = step;
    setBusy(true);
    try {
      await next(s.uri, s.width, s.height, s, s.temps);
    } catch {
      cb.current.onError("Couldn't prepare that photo. Try another one.");
      end(s.temps);
    } finally {
      setBusy(false);
    }
  }

  async function onPlates(boxes: PendingPhoto['boxes']) {
    if (step?.step !== 'plates') return;
    const s = step;
    // Re-checking with nothing to add leaves the saved photo alone.
    if (s.recheck && boxes.length === 0) return end(s.temps);
    setBusy(true);
    try {
      done(await finishPhoto(s.photo.uri, boxes, s.photo.width, s.photo.height), s.temps, s.replaces);
    } catch {
      cb.current.onError("Couldn't blur that photo. Try again.");
    } finally {
      setBusy(false);
    }
  }

  let view: ReactNode | null = null;
  if (step?.step === 'crop') {
    view = (
      <CropEditor
        uri={step.uri}
        width={step.width}
        height={step.height}
        saved={step.saved}
        busy={busy}
        initialAspect={aspect}
        onDone={onCrop}
        onSkip={step.saved ? undefined : onSkip}
        onCancel={() => end(step.temps)}
      />
    );
  } else if (step?.step === 'plates') {
    view = <PlateReview photo={step.photo} recheck={step.recheck} onDone={onPlates} onCancel={() => end(step.temps)} busy={busy} />;
  }

  return { pick, recrop, recheck, busy, view };
}

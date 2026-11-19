import * as ImagePicker from 'expo-image-picker';
import { useRef, useState, type ReactNode } from 'react';
import { Image, Platform } from 'react-native';
import { pickImagesOnWeb } from '../lib/webImagePicker';
import { isWholeImage, type AspectKey, type Box, type Rotation } from '../lib/crop';
import { cropPhoto, discardTemp, findPlates, finishPhoto, photoUri, plateRedactorAvailable } from '../lib/photos';
import { CropEditor } from './CropEditor';
import { PlateReview, type PendingPhoto } from './PlateReview';

type Picked = { uri: string; width?: number; height?: number };

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
 *
 * `pick(false, n)` with n > 1 picks up to n from the library at once; each one then
 * goes through crop and plate check in turn ("Photo 2 of 5"). Cancel on one skips it
 * and goes on to the next; "Don't add the rest" ends the batch.
 */
export function usePhotoFlow({
  onPhoto,
  onError,
  onFinish,
  cameraDenied = 'Allow camera access to take a photo.',
  aspect = 'free',
  plates = 'always',
}: {
  onPhoto: (ref: string, replaces?: string) => void;
  onError: (message: string | null) => void;
  /** The flow closed: every photo of the pick is done, skipped or cancelled. */
  onFinish?: () => void;
  cameraDenied?: string;
  aspect?: AspectKey;
  /** 'ifFound': skip the plate review when no plate is found (a dyno sheet usually has none). */
  plates?: 'always' | 'ifFound';
}): {
  pick: (camera?: boolean, limit?: number) => Promise<void>;
  recrop: (ref: string) => void;
  recheck: (ref: string) => Promise<void>;
  busy: boolean;
  view: ReactNode | null;
} {
  const [step, setStep] = useState<Step | null>(null);
  const [busy, setBusy] = useState(false);
  // A batch from the library: the ones still to do, and where we are ("Photo 2 of 5").
  const queue = useRef<Picked[]>([]);
  const [count, setCount] = useState({ n: 0, total: 0 });
  // Async steps finish after re-renders: always call the latest handlers.
  const cb = useRef({ onPhoto, onError, onFinish });
  cb.current = { onPhoto, onError, onFinish };

  /** Start the next photo of a batch; false when there's none left. */
  function startNext(): boolean {
    const a = queue.current.shift();
    if (!a) {
      setCount({ n: 0, total: 0 });
      return false;
    }
    setCount((c) => ({ ...c, n: c.n + 1 }));
    setStep({ step: 'crop', uri: a.uri, width: a.width, height: a.height, saved: false, temps: [a.uri] });
    return true;
  }

  function end(temps: string[]) {
    for (const t of temps) discardTemp(t);
    if (!startNext()) {
      setStep(null);
      cb.current.onFinish?.();
    }
  }

  /** Drop this photo and the rest of the batch. */
  function stopAll(temps: string[]) {
    for (const a of queue.current) discardTemp(a.uri);
    queue.current = [];
    end(temps);
  }

  function startBatch(picked: Picked[]) {
    if (!picked.length) return;
    queue.current = picked.slice();
    setCount({ n: 0, total: picked.length });
    startNext();
  }

  function done(ref: string, temps: string[], replaces?: string) {
    cb.current.onPhoto(ref, replaces);
    end(temps);
  }

  async function pick(camera = false, limit = 1) {
    cb.current.onError(null);
    try {
      if (camera) {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) return cb.current.onError(cameraDenied);
      }
      const many = !camera && limit > 1;
      if (Platform.OS === 'web' && !camera) {
        startBatch(await pickImagesOnWeb(Math.max(1, limit)));
        return;
      }
      const opts: ImagePicker.ImagePickerOptions = {
        mediaTypes: ['images'],
        quality: 0.9,
        exif: false,
        ...(many ? { allowsMultipleSelection: true, selectionLimit: limit, orderedSelection: true } : {}),
      };
      const res = camera ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
      if (res.canceled) return;
      startBatch(res.assets.slice(0, Math.max(1, limit)).map((a) => ({ uri: a.uri, width: a.width, height: a.height })));
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
      if (plates === 'ifFound' && !(found?.boxes ?? []).length) {
        done(await finishPhoto(uri, [], width, height), temps, s.replaces);
        return;
      }
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

  const batch = count.total > 1 && step && !(step.step === 'crop' && step.saved) && !(step.step === 'plates' && step.recheck) ? { label: `Photo ${count.n} of ${count.total}`, more: queue.current.length > 0 } : undefined;
  let view: ReactNode | null = null;
  if (step?.step === 'crop') {
    view = (
      <CropEditor
        key={step.uri}
        uri={step.uri}
        width={step.width}
        height={step.height}
        saved={step.saved}
        busy={busy}
        initialAspect={aspect}
        onDone={onCrop}
        onSkip={step.saved ? undefined : onSkip}
        onCancel={() => end(step.temps)}
        progress={batch?.label}
        onStopAll={batch?.more ? () => stopAll(step.temps) : undefined}
      />
    );
  } else if (step?.step === 'plates') {
    view = (
      <PlateReview
        key={step.photo.uri}
        photo={step.photo}
        recheck={step.recheck}
        onDone={onPlates}
        onCancel={() => end(step.temps)}
        busy={busy}
        progress={batch?.label}
        onStopAll={batch?.more ? () => stopAll(step.temps) : undefined}
      />
    );
  }

  return { pick, recrop, recheck, busy, view };
}

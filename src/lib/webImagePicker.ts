export interface WebPicked {
  uri: string;
  width: number;
  height: number;
}

function sizeOf(file: File): Promise<WebPicked | null> {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) return resolve(null);
    const uri = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ uri, width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve(null);
    img.src = uri;
  });
}

/**
 * Picking photos from the library on the web preview. expo-image-picker's web picker removes its
 * hidden <input> on every "change", and Chrome sends "cancel" too, so it could remove the input
 * twice: `NotFoundError: Failed to execute 'removeChild'` in the console (REVIEW-9). This one
 * removes it once, whatever the browser sends. Blob URLs and sizes, up to `limit` (1 = one photo).
 */
export function pickImagesOnWeb(limit = 1): Promise<WebPicked[]> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = limit > 1;
    input.style.display = 'none';
    let done = false;
    const finish = (value: WebPicked[]) => {
      if (done) return;
      done = true;
      input.remove();
      resolve(value);
    };
    input.addEventListener('change', () => {
      const files = Array.from(input.files ?? []).slice(0, Math.max(1, limit));
      Promise.all(files.map(sizeOf)).then((all) => finish(all.filter((x): x is WebPicked => !!x)));
    });
    input.addEventListener('cancel', () => finish([]));
    document.body.appendChild(input);
    input.click();
  });
}

/** One photo (the original single-photo picker). */
export async function pickImageOnWeb(): Promise<WebPicked | null> {
  return (await pickImagesOnWeb(1))[0] ?? null;
}

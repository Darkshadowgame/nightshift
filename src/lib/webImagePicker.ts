/**
 * Picking a photo from the library on the web preview. expo-image-picker's web picker removes its
 * hidden <input> on every "change", and Chrome sends "cancel" too, so it could remove the input
 * twice: `NotFoundError: Failed to execute 'removeChild'` in the console (REVIEW-9). This one
 * removes it once, whatever the browser sends. Same result shape: a blob URL and the size.
 */
export function pickImageOnWeb(): Promise<{ uri: string; width: number; height: number } | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.style.display = 'none';
    let done = false;
    const finish = (value: { uri: string; width: number; height: number } | null) => {
      if (done) return;
      done = true;
      input.remove();
      resolve(value);
    };
    input.addEventListener('change', () => {
      const file = input.files?.[0];
      if (!file || !file.type.startsWith('image/')) return finish(null);
      const uri = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => finish({ uri, width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = () => finish(null);
      img.src = uri;
    });
    input.addEventListener('cancel', () => finish(null));
    document.body.appendChild(input);
    input.click();
  });
}

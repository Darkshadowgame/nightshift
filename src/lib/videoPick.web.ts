import { pickedVideoProblem, videoMime, type VideoDraft } from './videoRules';

export type Picked = { draft: VideoDraft } | { problem: string } | null;

/** The web preview: a file input, the length from a <video>, the cover drawn from a frame about a second in. */
export function pickVideo(_camera = false): Promise<Picked> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'video/mp4,video/quicktime';
    input.style.display = 'none';
    let done = false;
    const finish = (v: Picked) => {
      if (done) return;
      done = true;
      input.remove();
      resolve(v);
    };
    input.addEventListener('change', () => {
      const file = input.files?.[0];
      if (!file || !file.type.startsWith('video/')) return finish(null);
      const uri = URL.createObjectURL(file);
      const video = document.createElement('video');
      video.muted = true;
      video.preload = 'auto';
      video.onloadedmetadata = () => {
        const problem = pickedVideoProblem({ seconds: video.duration, bytes: file.size });
        if (problem) return finish({ problem });
        video.currentTime = Math.min(1, video.duration / 2);
      };
      video.onseeked = () => {
        const canvas = document.createElement('canvas');
        const scale = Math.min(1, 720 / Math.max(1, video.videoWidth));
        canvas.width = Math.round(video.videoWidth * scale);
        canvas.height = Math.round(video.videoHeight * scale);
        canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) =>
            finish(
              blob
                ? { draft: { uri, poster: URL.createObjectURL(blob), seconds: video.duration, bytes: file.size, mime: videoMime(file.type, file.name), noPlates: false } }
                : { problem: "Couldn't read that video. Try another one." },
            ),
          'image/jpeg',
          0.8,
        );
      };
      video.onerror = () => finish({ problem: "Couldn't read that video. Try another one." });
      video.src = uri;
    });
    input.addEventListener('cancel', () => finish(null));
    document.body.appendChild(input);
    input.click();
  });
}

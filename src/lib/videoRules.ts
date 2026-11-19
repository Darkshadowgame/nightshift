/**
 * Video in posts, threads, replies and chat (build 16+; 20261121110100_videos.sql). One clip per
 * post or message, up to 30 seconds, exported at 720p, at most 25 MB, with a cover picture.
 *
 * Number plates can't be blurred in a video, so the poster must tick NO_PLATES before it's
 * shared (the server refuses it otherwise), and anyone can report it as "Shows a number
 * plate": three people hide it until staff look (docs/SPEC.md, confirmed by the owner 18 Nov 2026).
 */

export const VIDEO_LIMITS = { seconds: 30, bytes: 25 * 1024 * 1024 } as const;

export const NO_PLATES = 'No readable number plates in this video (I’ve checked)';

export type VideoMime = 'video/mp4' | 'video/quicktime';

/** A clip picked on the phone, not sent yet. */
export interface VideoDraft {
  uri: string;
  /** The cover: a JPEG from the first second. */
  poster: string;
  seconds: number;
  bytes: number;
  mime: VideoMime;
  /** The NO_PLATES tick. */
  noPlates: boolean;
}

/** A clip on a post or message: a signed link (or the phone's own file in the demo) and its cover. */
export interface VideoRef {
  url: string;
  poster: string;
}

export function videoMime(mime: string | null | undefined, uri: string): VideoMime {
  if (mime === 'video/quicktime' || /\.mov$/i.test(uri)) return 'video/quicktime';
  return 'video/mp4';
}

export const extensionFor = (mime: VideoMime) => (mime === 'video/quicktime' ? 'mov' : 'mp4');

/** Why this clip can't be picked (too long, too big), or null. The tick is checked when sending. */
export function pickedVideoProblem(v: { seconds: number; bytes: number }): string | null {
  if (v.seconds > VIDEO_LIMITS.seconds + 0.5) return 'Videos can be up to 30 seconds. Trim it first.';
  if (v.bytes > VIDEO_LIMITS.bytes) return 'That video is over 25 MB. Try a shorter clip.';
  return null;
}

/** Why this clip can't be sent yet, or null. */
export function videoProblem(v: VideoDraft | null | undefined): string | null {
  if (!v) return null;
  const picked = pickedVideoProblem(v);
  if (picked) return picked;
  if (!v.noPlates) return 'Check the video has no readable number plates, then tick the box.';
  return null;
}

/** "0:27". */
export function clipLength(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** "18.4 MB". */
export function clipSize(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

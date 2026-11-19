import { File } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { createVideoPlayer } from 'expo-video';
import { pickedVideoProblem, VIDEO_LIMITS, videoMime, type VideoDraft } from './videoRules';

export type Picked = { draft: VideoDraft } | { problem: string } | null;

/** The cover: a frame from about a second in, as a 720-wide JPEG. */
async function posterFor(uri: string, seconds: number): Promise<string> {
  const player = createVideoPlayer(uri);
  try {
    const [thumb] = await player.generateThumbnailsAsync(Math.min(1, seconds / 2));
    const ref = await ImageManipulator.manipulate(thumb).resize({ width: 720 }).renderAsync();
    const saved = await ref.saveAsync({ format: SaveFormat.JPEG, compress: 0.8 });
    return saved.uri;
  } finally {
    player.release();
  }
}

/**
 * Pick (or film) one clip: up to 30 seconds, exported at 720p (the iPhone compresses it while
 * picking), then checked for size (25 MB) and given its cover. The NO_PLATES tick comes after.
 */
export async function pickVideo(camera = false): Promise<Picked> {
  if (camera) {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return { problem: 'Allow camera access to film a clip.' };
  }
  const opts: ImagePicker.ImagePickerOptions = {
    mediaTypes: ['videos'],
    videoMaxDuration: VIDEO_LIMITS.seconds,
    // Trimming is offered on iPhone when a clip is longer than 30 seconds.
    allowsEditing: true,
    videoExportPreset: ImagePicker.VideoExportPreset.H264_1280x720,
    videoQuality: ImagePicker.UIImagePickerControllerQualityType.IFrame1280x720,
  };
  const res = camera ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
  if (res.canceled || !res.assets[0]) return null;
  const a = res.assets[0];
  const seconds = (a.duration ?? 0) / 1000;
  const bytes = a.fileSize ?? new File(a.uri).size ?? 0;
  const problem = pickedVideoProblem({ seconds, bytes });
  if (problem) return { problem };
  const poster = await posterFor(a.uri, seconds);
  return { draft: { uri: a.uri, poster, seconds, bytes, mime: videoMime(a.mimeType, a.uri), noPlates: false } };
}

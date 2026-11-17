import { CameraIndex } from './cameras';

/**
 * The bundled camera dataset, loaded on first use: the data module is only
 * evaluated once the camera layer is first drawn, and its tiles are decoded
 * one at a time as they come into view.
 */
let index: CameraIndex | null = null;

export function cameraIndex(): CameraIndex {
  if (!index) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { CAMERA_DATA } = require('../data/cameras') as typeof import('../data/cameras');
    index = new CameraIndex(CAMERA_DATA);
  }
  return index;
}

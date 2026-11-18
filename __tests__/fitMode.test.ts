import { FIT_TOLERANCE, fitMode } from '../src/components/ds/logic';
import { ASPECT } from '../src/theme';

describe('fitMode: a user photo is never cropped so it loses the subject', () => {
  it('fills the frame when the photo is the frame shape', () => {
    expect(fitMode(4 / 3, ASPECT.build)).toBe('cover');
    expect(fitMode(16 / 9, ASPECT.event)).toBe('cover');
    expect(fitMode(4 / 5, ASPECT.post)).toBe('cover');
  });

  it('fills the frame when the shapes are within about 10%', () => {
    expect(fitMode(1.4, ASPECT.build)).toBe('cover'); // 5% off
    expect(fitMode(ASPECT.build * (1 + FIT_TOLERANCE), ASPECT.build)).toBe('cover'); // right on the line
    expect(fitMode(ASPECT.build / (1 + FIT_TOLERANCE), ASPECT.build)).toBe('cover');
    expect(fitMode(1, 0.95)).toBe('cover');
  });

  it('shows the whole photo when the shapes differ by more', () => {
    expect(fitMode(3 / 2, ASPECT.build)).toBe('contain'); // 3:2 in 4:3 is 12.5% wider
    expect(fitMode(600 / 1000, ASPECT.build)).toBe('contain'); // portrait phone photo in a 4:3 card
    expect(fitMode(3 / 4, ASPECT.build)).toBe('contain');
    expect(fitMode(9 / 16, ASPECT.event)).toBe('contain');
    expect(fitMode(1200 / 500, ASPECT.post)).toBe('contain'); // a wide photo in a 4:5 post
    expect(fitMode(16 / 9, ASPECT.build)).toBe('contain'); // 33% wider
    expect(fitMode(1, ASPECT.build)).toBe('contain'); // square in 4:3: 33% off
    expect(fitMode(ASPECT.build * 1.11, ASPECT.build)).toBe('contain');
  });

  it('is the same whichever way round the difference is', () => {
    expect(fitMode(2, 1)).toBe(fitMode(1, 2));
    expect(fitMode(1.05, 1)).toBe(fitMode(1, 1.05));
  });

  it('fills when a shape is unknown or nonsense (nothing to compare)', () => {
    expect(fitMode(undefined, ASPECT.build)).toBe('cover');
    expect(fitMode(null, ASPECT.build)).toBe('cover');
    expect(fitMode(0.6, undefined)).toBe('cover');
    expect(fitMode(0, ASPECT.build)).toBe('cover');
    expect(fitMode(-1, ASPECT.build)).toBe('cover');
    expect(fitMode(Number.NaN, ASPECT.build)).toBe('cover');
    expect(fitMode(Number.POSITIVE_INFINITY, ASPECT.build)).toBe('cover');
  });

  it('takes a tighter or looser tolerance', () => {
    expect(fitMode(1.4, ASPECT.build, 0.01)).toBe('contain');
    expect(fitMode(1, ASPECT.build, 0.5)).toBe('cover');
  });
});

import {
  aspectRatio,
  clampBox,
  COVER_ASPECT,
  dragCorner,
  fitAspect,
  fullBox,
  isWholeImage,
  makeFirst,
  moveBox,
  moveItem,
  nextRotation,
  rotateBoxClockwise,
  rotatedSize,
  scaleBox,
  sourceRect,
  type Box,
  type Rotation,
} from '../src/lib/crop';

const W = 1000;
const H = 600;
const close = (b: Box, e: Box) => {
  expect(b.x).toBeCloseTo(e.x, 6);
  expect(b.y).toBeCloseTo(e.y, 6);
  expect(b.w).toBeCloseTo(e.w, 6);
  expect(b.h).toBeCloseTo(e.h, 6);
};

describe('box clamping and moving', () => {
  test('a box is pushed back inside the image and kept above the minimum size', () => {
    expect(clampBox({ x: -50, y: 580, w: 200, h: 100 }, W, H, 40)).toEqual({ x: 0, y: 500, w: 200, h: 100 });
    expect(clampBox({ x: 10, y: 10, w: 5, h: 5000 }, W, H, 40)).toEqual({ x: 10, y: 0, w: 40, h: 600 });
  });

  test('moving stops at the edges and never changes the size', () => {
    expect(moveBox({ x: 100, y: 100, w: 200, h: 100 }, 5000, -5000, W, H)).toEqual({ x: 800, y: 0, w: 200, h: 100 });
    expect(moveBox({ x: 100, y: 100, w: 200, h: 100 }, 10, 20, W, H)).toEqual({ x: 110, y: 120, w: 200, h: 100 });
  });

  test('the whole image counts as no crop', () => {
    expect(isWholeImage(fullBox(W, H), W, H)).toBe(true);
    expect(isWholeImage({ x: 0, y: 0, w: W, h: H - 10 }, W, H)).toBe(false);
  });
});

describe('aspect fitting', () => {
  test('the biggest square in a landscape photo is full height, centred', () => {
    expect(fitAspect(W, H, 1)).toEqual({ x: 200, y: 0, w: 600, h: 600 });
  });

  test('a wide shape in a landscape photo is full width', () => {
    close(fitAspect(W, H, 16 / 9), { x: 0, y: (600 - 562.5) / 2, w: 1000, h: 562.5 });
  });

  test('a portrait shape is limited by the height', () => {
    close(fitAspect(W, H, 4 / 5), { x: 260, y: 0, w: 480, h: 600 });
  });

  test('it centres on the current box, then stays inside the image', () => {
    const b = fitAspect(W, H, 1, { x: 900, y: 0, w: 100, h: 100 });
    expect(b).toEqual({ x: 400, y: 0, w: 600, h: 600 });
  });

  test('free keeps the current box', () => {
    expect(fitAspect(W, H, null, { x: 10, y: 20, w: 300, h: 200 })).toEqual({ x: 10, y: 20, w: 300, h: 200 });
    expect(fitAspect(W, H, null)).toEqual(fullBox(W, H));
  });

  test('presets', () => {
    expect(aspectRatio('free')).toBeNull();
    expect(aspectRatio('cover')).toBe(COVER_ASPECT);
    expect(aspectRatio('4:5')).toBeCloseTo(0.8);
  });
});

describe('bigger and smaller', () => {
  test('scales about the centre, keeping the shape, inside the image', () => {
    expect(scaleBox({ x: 400, y: 200, w: 200, h: 100 }, 1.5, W, H, 40)).toEqual({ x: 350, y: 175, w: 300, h: 150 });
    const big = scaleBox({ x: 400, y: 200, w: 200, h: 100 }, 100, W, H, 40);
    expect(big).toEqual({ x: 0, y: 0, w: 1000, h: 500 });
    const small = scaleBox({ x: 400, y: 200, w: 200, h: 100 }, 0.01, W, H, 40);
    expect(small.h).toBe(40);
    expect(small.w).toBe(80);
  });
});

describe('dragging a corner', () => {
  const start: Box = { x: 200, y: 100, w: 400, h: 300 };

  test('free: the opposite corner stays put', () => {
    expect(dragCorner(start, 'br', 50, 20, W, H, null, 40)).toEqual({ x: 200, y: 100, w: 450, h: 320 });
    expect(dragCorner(start, 'tl', 50, 20, W, H, null, 40)).toEqual({ x: 250, y: 120, w: 350, h: 280 });
    expect(dragCorner(start, 'tr', 10, -10, W, H, null, 40)).toEqual({ x: 200, y: 90, w: 410, h: 310 });
    expect(dragCorner(start, 'bl', -10, 10, W, H, null, 40)).toEqual({ x: 190, y: 100, w: 410, h: 310 });
  });

  test('free: it stops at the image edge', () => {
    expect(dragCorner(start, 'br', 5000, 5000, W, H, null, 40)).toEqual({ x: 200, y: 100, w: 800, h: 500 });
    expect(dragCorner(start, 'tl', -5000, -5000, W, H, null, 40)).toEqual({ x: 0, y: 0, w: 600, h: 400 });
  });

  test("free: it can't cross over or get smaller than the minimum", () => {
    expect(dragCorner(start, 'br', -5000, -5000, W, H, null, 40)).toEqual({ x: 200, y: 100, w: 40, h: 40 });
    expect(dragCorner(start, 'tl', 5000, 5000, W, H, null, 40)).toEqual({ x: 560, y: 360, w: 40, h: 40 });
  });

  test('with a ratio it keeps its shape and follows the bigger move', () => {
    const sq: Box = { x: 100, y: 100, w: 200, h: 200 };
    const b = dragCorner(sq, 'br', 100, 10, W, H, 1, 40);
    expect(b).toEqual({ x: 100, y: 100, w: 300, h: 300 });
    const c = dragCorner(sq, 'tl', 10, 100, W, H, 1, 40);
    // Shrinks: the finger moved further down, so 100 smaller on both sides.
    expect(c.w).toBe(c.h);
    expect(c.x + c.w).toBe(300);
    expect(c.y + c.h).toBe(300);
  });

  test('with a ratio it stops at whichever edge it meets first', () => {
    const sq: Box = { x: 100, y: 100, w: 200, h: 200 };
    // Room is 900 wide but only 500 tall below the fixed corner.
    expect(dragCorner(sq, 'br', 5000, 5000, W, H, 1, 40)).toEqual({ x: 100, y: 100, w: 500, h: 500 });
    const wide = dragCorner({ x: 0, y: 0, w: 160, h: 90 }, 'br', 5000, 0, W, H, 16 / 9, 40);
    expect(wide.w / wide.h).toBeCloseTo(16 / 9);
    expect(wide.x + wide.w).toBeLessThanOrEqual(W + 1e-9);
    expect(wide.y + wide.h).toBeLessThanOrEqual(H + 1e-9);
  });

  test('with a ratio it never goes below the minimum', () => {
    const b = dragCorner({ x: 100, y: 100, w: 200, h: 200 }, 'br', -5000, -5000, W, H, 1, 40);
    expect(b).toEqual({ x: 100, y: 100, w: 40, h: 40 });
  });
});

describe('rotation', () => {
  test('quarter turns swap the sides and wrap round', () => {
    expect(rotatedSize(1000, 600, 90)).toEqual({ w: 600, h: 1000 });
    expect(rotatedSize(1000, 600, 180)).toEqual({ w: 1000, h: 600 });
    expect(nextRotation(0)).toBe(90);
    expect(nextRotation(270)).toBe(0);
  });

  test('a box follows the image round', () => {
    // Top-left 100x50 of a 1000x600 image ends up top-right of the 600x1000 one.
    expect(rotateBoxClockwise({ x: 0, y: 0, w: 100, h: 50 }, 600)).toEqual({ x: 550, y: 0, w: 50, h: 100 });
    // Four turns bring it home.
    let b: Box = { x: 120, y: 40, w: 300, h: 200 };
    let w = 1000;
    let h = 600;
    for (let i = 0; i < 4; i++) {
      b = rotateBoxClockwise(b, h);
      [w, h] = [h, w];
    }
    expect(b).toEqual({ x: 120, y: 40, w: 300, h: 200 });
  });
});

describe('mapping the crop back to the original pixels', () => {
  /** Turn a pixel of the original clockwise by rot (what the image manipulator does). */
  function turn(px: number, py: number, rot: Rotation, sw: number, sh: number): [number, number] {
    switch (rot) {
      case 90:
        return [sh - py, px];
      case 180:
        return [sw - px, sh - py];
      case 270:
        return [py, sw - px];
      default:
        return [px, py];
    }
  }

  test('no rotation is a straight crop', () => {
    expect(sourceRect({ x: 100, y: 50, w: 200, h: 100 }, 0, 1000, 600, 1000, 600)).toEqual({ originX: 100, originY: 50, width: 200, height: 100 });
  });

  test('it scales when the shown size differs from the real pixels', () => {
    expect(sourceRect({ x: 10, y: 5, w: 20, h: 10 }, 0, 100, 60, 4000, 2400)).toEqual({ originX: 400, originY: 200, width: 800, height: 400 });
  });

  test.each([90, 180, 270] as Rotation[])('rotated %i: the cropped region turns into exactly the box', (rot) => {
    const sw = 1000;
    const sh = 600;
    const { w: RW, h: RH } = rotatedSize(sw, sh, rot);
    const box: Box = { x: 100, y: 200, w: 300, h: 150 };
    const r = sourceRect(box, rot, RW, RH, sw, sh);
    // Turn the region's corners (as edges, so +w and +h) and check they span the box.
    const xs: number[] = [];
    const ys: number[] = [];
    for (const [px, py] of [
      [r.originX, r.originY],
      [r.originX + r.width, r.originY + r.height],
    ]) {
      const [tx, ty] = turn(px, py, rot, sw, sh);
      xs.push(tx);
      ys.push(ty);
    }
    expect(Math.min(...xs)).toBe(box.x);
    expect(Math.max(...xs)).toBe(box.x + box.w);
    expect(Math.min(...ys)).toBe(box.y);
    expect(Math.max(...ys)).toBe(box.y + box.h);
    // Width and height swap on quarter turns.
    expect(rot === 180 ? r.width : r.height).toBe(box.w);
  });

  test('the result is whole pixels inside the image, at least 1 x 1', () => {
    const r = sourceRect({ x: -5, y: 0, w: 2000, h: 0 }, 0, 1000, 600, 333, 211);
    expect(r.originX).toBe(0);
    expect(r.width).toBe(333);
    expect(r.height).toBeGreaterThanOrEqual(1);
    for (const v of Object.values(r)) expect(Number.isInteger(v)).toBe(true);
  });
});

describe('photo order', () => {
  test('move left and right, ignoring the ends', () => {
    expect(moveItem(['a', 'b', 'c'], 1, -1)).toEqual(['b', 'a', 'c']);
    expect(moveItem(['a', 'b', 'c'], 1, 1)).toEqual(['a', 'c', 'b']);
    expect(moveItem(['a', 'b', 'c'], 0, -1)).toEqual(['a', 'b', 'c']);
    expect(moveItem(['a', 'b', 'c'], 2, 1)).toEqual(['a', 'b', 'c']);
  });

  test('set as cover puts it first and keeps the rest in order', () => {
    expect(makeFirst(['a', 'b', 'c', 'd'], 2)).toEqual(['c', 'a', 'b', 'd']);
    expect(makeFirst(['a', 'b'], 0)).toEqual(['a', 'b']);
  });
});

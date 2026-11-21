import { DONE_WORD, mapFocus, openPlacesChange, placeDone, placesCountLine, withDone } from '../src/lib/mapFocus';
import { applyTheme, COLOR, contrast, ART } from '../src/theme';
import type { Spot } from '../src/lib/types';

const spot = (kind: Spot['kind'], users: string[] = []): Spot =>
  ({ id: `s-${kind}`, kind, completions: users.map((userId) => ({ userId, on: '2026-11-01' })), ratings: [] }) as unknown as Spot;

describe('Meets / Things to do', () => {
  it('defaults to Meets and ignores anything unknown', () => {
    expect(mapFocus(undefined)).toBe('meets');
    expect(mapFocus('nonsense')).toBe('meets');
    expect(mapFocus('places')).toBe('places');
  });

  it('opening Things to do the first time turns the three place layers on', () => {
    const change = openPlacesChange({});
    expect(change?.mapLayers).toMatchObject({ drive: true, photo: true, track: true });
  });

  it('keeps the layer choices already made in the combined layout', () => {
    expect(openPlacesChange({ mapLayers: { events: true, photo: true, drive: false, track: false, venue: false } })).toBeNull();
    expect(openPlacesChange({ postsLayer: true })).toBeNull();
    expect(openPlacesChange({ shops: true })).toBeNull();
  });

  it('counts places by kind, singular and plural', () => {
    expect(placesCountLine([{ kind: 'drive' }, { kind: 'drive' }, { kind: 'photo' }])).toBe('2 drives · 1 photo spot');
    expect(placesCountLine([])).toBe('');
  });
});

describe('Done marks', () => {
  it('a drive or photo spot is done once you completed it; someone else finishing it does not count', () => {
    expect(placeDone(spot('drive', ['me']), 'me')).toBe(true);
    expect(placeDone(spot('photo', ['me']), 'me')).toBe(true);
    expect(placeDone(spot('drive', ['you']), 'me')).toBe(false);
    expect(placeDone(spot('drive'), 'me')).toBe(false);
    expect(placeDone(spot('drive', ['me']), null)).toBe(false);
  });

  it('tracks and venues are information only, never done', () => {
    expect(placeDone(spot('track', ['me']), 'me')).toBe(false);
    expect(placeDone(spot('venue', ['me']), 'me')).toBe(false);
  });

  it('says done in words for screen readers, so the tick is never the only signal', () => {
    expect(withDone('Cat and Fiddle', true)).toBe('Cat and Fiddle, done');
    expect(withDone('Cat and Fiddle', false)).toBe('Cat and Fiddle');
    expect(DONE_WORD).toBe('Done');
  });

  it.each(['dark', 'light'] as const)('the tick and the Done text are AA in %s', (mode) => {
    applyTheme(mode);
    const bg = [COLOR.surface.bg, COLOR.surface.card, COLOR.surface.raised];
    for (const b of bg) expect(contrast(COLOR.state.success, b)).toBeGreaterThanOrEqual(4.5);
    // The tick stroke on its success disc (Pin.tsx picks ink or white, whichever reads).
    const ink = contrast(COLOR.state.success, '#0a0a0a') >= 4.5 ? '#0a0a0a' : ART.signWhite;
    expect(contrast(COLOR.state.success, ink)).toBeGreaterThanOrEqual(3);
  });
});

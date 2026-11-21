import { markerPlan, PULSE_Z } from '../src/lib/pinMarkers';

describe('map pin markers (a live pin must stay tappable on iPhone)', () => {
  it('a plain pin is one static, tappable marker', () => {
    expect(markerPlan({ glyph: 'meet' })).toEqual([{ role: 'pin', tracksViewChanges: false, tappable: true, zIndex: 3 }]);
  });

  it('a live pin is a static tappable marker plus a separate, untappable pulse marker behind it', () => {
    const [pulse, pin] = markerPlan({ glyph: 'meet', live: true });
    expect(pin).toMatchObject({ role: 'pin', tracksViewChanges: false, tappable: true });
    expect(pulse).toMatchObject({ role: 'pulse', tracksViewChanges: true, tappable: false, zIndex: PULSE_Z });
    expect(pulse.zIndex).toBeLessThan(pin.zIndex);
    expect(pulse.zIndex).toBeLessThan(0.0001);
  });

  it('only the pulse animates: no tappable marker ever tracks view changes', () => {
    for (const live of [true, false]) for (const m of markerPlan({ glyph: 'cruise', live })) if (m.tappable) expect(m.tracksViewChanges).toBe(false);
  });
});

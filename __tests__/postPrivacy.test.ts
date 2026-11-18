import { communitySample } from '../src/data/communitySeed';
import { DEMO_HOME, ME, seed } from '../src/data/seed';
import { guardMeetPoint, meetAt, placeVisible, postPlace } from '../src/lib/postPrivacy';
import { STAND_IN_PHOTOS } from '../src/data/standInPhotos';
import { samplePhoto } from '../src/lib/photoSource';
import { allVariants } from '../src/data/vehicles';
import { modelLabel } from '../src/lib/vehicles';
import { buildPicture, makeKey, similarSample, STAND_INS } from '../src/lib/similarPhoto';

const NOW = new Date('2026-11-20T21:10:00');

describe('posts never give away a meet point (REVIEW-11 #16)', () => {
  const s = seed(NOW);
  const live = s.events.find((e) => e.id === 'ev-meet-now')!;
  const point = live.stops[0].at!;

  it('a photo posted at a meet point keeps the meet, not the place name', () => {
    const d = guardMeetPoint({ body: 'At Car park meet-up', photos: ['x'], at: point, placeName: live.stops[0].name, visibility: 'public' }, s.events);
    expect(d.placeName).toBeUndefined();
    expect(d.eventId).toBe(live.id);
    expect(d.at).toEqual(point);
  });

  it('a post at a meet says "At {event}" to everyone, the author and people going included, never the place', () => {
    const tied = { at: point, eventId: live.id };
    const legacy = { at: point, placeName: live.stops[0].name }; // made before guardMeetPoint: sits on the meet point
    for (const post of [tied, legacy, { ...tied, placeName: live.stops[0].name }]) {
      expect(postPlace(post, { events: s.events })).toEqual({ kind: 'event', eventId: live.id, text: `At ${live.title}` });
    }
    const stranger = { me: 'nobody', events: s.events, crews: s.crews, now: NOW };
    expect(placeVisible(point, stranger)).toBe(false);
    expect(placeVisible(point, { ...stranger, me: live.going[0] })).toBe(true);
  });

  it('a post tied to a meet the viewer has no sight of says nothing about where', () => {
    expect(postPlace({ at: point, eventId: 'ev-gone', placeName: 'Secret car park' }, { events: s.events })).toBeNull();
  });

  it('a post away from any meet keeps its own place', () => {
    const far = { lat: 53.5, lng: -2.2 };
    expect(meetAt(far, s.events)).toBeNull();
    expect(postPlace({ at: far, placeName: 'Reservoir viewpoint' }, { events: s.events })).toEqual({ kind: 'place', text: 'Reservoir viewpoint' });
  });

  it('no seeded post sits on a meet point', () => {
    const posts = communitySample(NOW, DEMO_HOME, 'Midlands').posts;
    for (const p of posts) expect(meetAt(p.at, s.events)).toBeNull();
  });
});

describe("a demo build with no photo never borrows another sample person's photo (REVIEW-12 #7)", () => {
  const s = seed(NOW);
  const owned = new Set([
    ...s.builds.flatMap((b) => b.photos),
    ...communitySample(NOW, DEMO_HOME, 'Midlands').posts.flatMap((p) => p.photos),
  ]);
  const ownedPages = new Set([...owned].map((r) => samplePhoto(r)?.page).filter(Boolean));

  it('no stand-in photo is one a sample build or post uses', () => {
    expect(STAND_INS.length).toBeGreaterThan(30);
    for (const m of STAND_INS) {
      expect(owned.has(`sample:${m.key}`)).toBe(false);
      // Not the same Commons file under another key either.
      expect(ownedPages.has(samplePhoto(m.key)?.page)).toBe(false);
    }
  });

  it('every stand-in is credited: author, a free licence and its Commons page', () => {
    for (const p of STAND_IN_PHOTOS) {
      expect(p.photo.author.length).toBeGreaterThan(0);
      expect(p.photo.licence).toMatch(/^(CC BY(-SA)? \d\.\d|CC0|Public domain)$/);
      expect(p.photo.page).toMatch(/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
    }
  });
});

describe('stand-in photos for your own build (REVIEW-13 #2, L1)', () => {
  const pic = (make: string, model: string, kind: 'car' | 'bike' = 'car', year?: number) => buildPicture({ photos: [], make, model, kind, year }, true);

  it("the demo's Fiesta ST Mk8 gets a real photo of the same model", () => {
    expect(similarSample('Ford', 'Fiesta ST Mk8', 'car')).toEqual({ key: 'si-fiesta-st-mk8', match: 'model' });
    expect(pic('Ford', 'Fiesta ST Mk8 facelift')).toEqual({ ref: 'sample:si-fiesta-st-mk8', standIn: 'model' });
  });

  it('the same model, another generation, is "similar"; then a car of the same make', () => {
    expect(similarSample('Ford', 'Fiesta ST Mk7 ST180', 'car')?.match).toBe('model');
    expect(similarSample('Ford', 'Fiesta ST Mk6 ST150', 'car')?.match).toBe('generation');
    expect(similarSample('Ford', 'Puma ST', 'car')?.match).toBe('make');
    expect(similarSample('VW', 'Golf R Mk7.5', 'car')).toEqual({ key: 'si-golf-r-mk7', match: 'model' });
    expect(similarSample('Volkswagen', 'Golf GTI Mk8', 'car')).toEqual({ key: 'si-golf-gti-mk8', match: 'model' });
  });

  it('bikes match on make, model and the model years', () => {
    expect(similarSample('Yamaha', 'MT-07', 'bike', 2016)).toEqual({ key: 'si-mt07', match: 'model' });
    expect(similarSample('Yamaha', 'MT-07', 'bike', 2022)).toEqual({ key: 'si-mt07', match: 'generation' });
    expect(similarSample('Yamaha', 'YZF-R6', 'bike', 2012)).toEqual({ key: 'si-r6', match: 'model' });
    expect(similarSample('Yamaha', 'Tracer 9', 'bike')?.match).toBe('make');
  });

  it('a car never stands in for a bike, and nothing from the make means paint', () => {
    expect(similarSample('BMW', 'R nineT', 'bike')).toEqual({ key: 'si-s1000rr', match: 'make' });
    expect(similarSample('BMW', '330i', 'car')?.key).toBe('si-m3-f80');
    expect(pic('Lada', 'Riva')).toBeNull();
  });

  it('every photo in the pool is the exact match for the models it says it fits', () => {
    for (const p of STAND_IN_PHOTOS) {
      for (const f of p.fits) {
        const year = f.years ? f.years[0] : undefined;
        const got = similarSample(f.make, `${f.model} ${f.gens?.[0] ?? ''}`, p.kind, year);
        expect(got).toEqual({ key: p.key, match: 'model' });
      }
    }
  });

  it('the vehicle list\'s own model names find their photo', () => {
    const list = allVariants();
    const missing = [];
    for (const p of STAND_IN_PHOTOS) {
      for (const f of p.fits) {
        const v = list.find((x) => x.kind === p.kind && makeKey(x.make) === f.make && modelLabel(x).toLowerCase().startsWith(f.model));
        if (!v) missing.push(`${f.make} ${f.model}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it('only in the demo, and your own photo always wins', () => {
    expect(buildPicture({ photos: [], make: 'Ford', model: 'Fiesta ST Mk8', kind: 'car' }, false)).toBeNull();
    expect(buildPicture({ photos: ['mine.jpg'], make: 'Ford', model: 'Fiesta ST', kind: 'car' }, true)).toEqual({ ref: 'mine.jpg', standIn: null });
  });
});

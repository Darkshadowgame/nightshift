import { communitySample } from '../src/data/communitySeed';
import { DEMO_HOME, ME, seed } from '../src/data/seed';
import { guardMeetPoint, meetAt, placeVisible, postPlace } from '../src/lib/postPrivacy';
import { buildPicture, similarSampleKey, STAND_INS } from '../src/lib/similarPhoto';

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

  it('no stand-in photo is one a sample build or post uses', () => {
    for (const m of STAND_INS) expect(owned.has(`sample:${m.key}`)).toBe(false);
  });

  it("the demo's Fiesta ST Mk8 (and anything else without a photo) is drawn in its paint", () => {
    for (const [make, model, kind] of [['Ford', 'Fiesta ST Mk8', 'car'], ['VW', 'Golf R', 'car'], ['Yamaha', 'MT-07', 'bike']] as const) {
      expect(similarSampleKey(make, model, kind)).toBeNull();
      expect(buildPicture({ photos: [], make, model, kind }, true)).toBeNull();
    }
  });

  it('your own photo always wins', () => {
    expect(buildPicture({ photos: ['mine.jpg'], make: 'Ford', model: 'Fiesta ST', kind: 'car' }, true)).toEqual({ ref: 'mine.jpg', similar: false });
  });
});

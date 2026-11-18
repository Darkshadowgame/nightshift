import { communitySample } from '../src/data/communitySeed';
import { DEMO_HOME, ME, seed } from '../src/data/seed';
import { guardMeetPoint, meetAt, placeVisible, postPlace } from '../src/lib/postPrivacy';
import { buildPicture, similarSampleKey } from '../src/lib/similarPhoto';

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

  it('says the meet point only to people who can see it, "Around {Area}" to everyone else', () => {
    const post = { at: point, eventId: live.id };
    const stranger = { me: 'nobody', events: s.events, crews: s.crews, now: NOW };
    expect(postPlace(post, stranger)).toBe(`Around ${live.areaName}`);
    expect(placeVisible(point, stranger)).toBe(false);
    const goer = { ...stranger, me: live.going[0] };
    expect(postPlace(post, goer)).toBe(live.stops[0].name);
    expect(placeVisible(point, goer)).toBe(true);
  });

  it('a post away from any meet keeps its own place', () => {
    const far = { lat: 53.5, lng: -2.2 };
    expect(meetAt(far, s.events)).toBeNull();
    expect(postPlace({ at: far, placeName: 'Reservoir viewpoint' }, { me: ME, events: s.events, crews: s.crews, now: NOW })).toBe('Reservoir viewpoint');
  });

  it('no seeded post sits on a meet point', () => {
    const posts = communitySample(NOW, DEMO_HOME, 'Midlands').posts;
    for (const p of posts) expect(meetAt(p.at, s.events)).toBeNull();
  });
});

describe('a demo build with no photo shows a similar licensed photo (L1)', () => {
  it('matches the model, else the same make, else nothing', () => {
    expect(similarSampleKey('Ford', 'Fiesta ST Mk8 facelift', 'car')).toBe('b-jord-0');
    expect(similarSampleKey('Ford', 'Puma ST', 'car')).toBe('b-jord-0');
    expect(similarSampleKey('VW', 'Golf R', 'car')).toBe('b-bex-0');
    expect(similarSampleKey('Yamaha', 'MT-07', 'bike')).toBe('b-deano-0');
    expect(similarSampleKey('Yamaha', 'MT-07', 'car')).toBeNull();
    expect(similarSampleKey('Lada', 'Riva', 'car')).toBeNull();
  });
  it('is only a stand-in: your own photo wins, and outside the demo nothing is borrowed', () => {
    const b = { photos: [] as string[], make: 'Ford', model: 'Fiesta ST', kind: 'car' as const };
    expect(buildPicture(b, true)).toEqual({ ref: 'sample:b-jord-0', similar: true });
    expect(buildPicture(b, false)).toBeNull();
    expect(buildPicture({ ...b, photos: ['mine.jpg'] }, true)).toEqual({ ref: 'mine.jpg', similar: false });
  });
});

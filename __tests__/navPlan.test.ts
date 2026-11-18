import { directionsUrls, shareLocationText } from '../src/lib/directions';
import { DEFAULT_FILTER } from '../src/lib/invites';
import { planForEvent, planForPlace, planForSpot, targetFromParams, targetParams } from '../src/lib/navPlan';
import type { Crew, NightEvent, Spot } from '../src/lib/types';

const NOW = new Date('2026-11-20T22:00:00Z');
const mins = (m: number) => new Date(NOW.getTime() + m * 60_000).toISOString();
const crews: Crew[] = [];

function event(overrides: Partial<NightEvent> = {}): NightEvent {
  return {
    id: 'e1', type: 'cruise', title: 'Cruise', startsAt: mins(-10), endsAt: mins(120),
    area: { lat: 52.6, lng: -1.7 }, areaName: 'Area',
    stops: [
      { id: 's1', name: 'Start car park', at: { lat: 52.6, lng: -1.7 } },
      { id: 's2', name: 'Regroup', at: { lat: 52.65, lng: -1.75 } },
      { id: 's3', name: 'Finish', at: { lat: 52.7, lng: -1.8 } },
    ],
    currentStop: 0, revealMinutesBefore: 60, hostIds: ['host'],
    filter: DEFAULT_FILTER, going: ['me'], checkIns: {}, ...overrides,
  };
}

describe('what navigation routes through', () => {
  test('a cruise: every stop you can see, in order, ending at the last', () => {
    const plan = planForEvent(event(), 'me', crews, NOW)!;
    expect(plan.stops.map((s) => [s.name, s.role, s.eventStop, !!s.checkIn])).toEqual([
      ['Start car park', 'stop', 0, true],
      ['Regroup', 'stop', 1, false],
      ['Finish', 'destination', 2, false],
    ]);
    expect(plan.eventId).toBe('e1');
  });

  test('nothing before the reveal, or for someone not going', () => {
    expect(planForEvent(event({ startsAt: mins(120) }), 'me', crews, NOW)).toBeNull();
    expect(planForEvent(event(), 'stranger', crews, NOW)).toBeNull();
    expect(planForEvent(event({ cancelled: true }), 'me', crews, NOW)).toBeNull();
  });

  test('a rolling meet: only the meet point it is at now, for everyone going', () => {
    const e = event({ type: 'rolling', currentStop: 1, checkIns: { me: ['s1'] } });
    expect(planForEvent(e, 'me', crews, NOW)!.stops.map((s) => [s.name, s.role, s.checkIn])).toEqual([['Regroup', 'destination', true]]);
    // Joined late (no check-in at the one before): still goes to the current one, never further.
    expect(planForEvent({ ...e, checkIns: {} }, 'me', crews, NOW)!.stops.map((s) => s.name)).toEqual(['Regroup']);
    expect(planForEvent({ ...e, going: [] }, 'me', crews, NOW)).toBeNull();
  });

  test('a drive: the start, then every checkpoint', () => {
    const spot: Spot = {
      id: 'd1', kind: 'drive', name: 'Snake Pass', at: { lat: 53.4, lng: -1.8 }, description: '',
      path: [{ lat: 53.4, lng: -1.8 }, { lat: 53.41, lng: -1.81 }, { lat: 53.42, lng: -1.82 }],
      status: 'approved', createdAt: NOW.toISOString(), completions: [], ratings: [],
    };
    const plan = planForSpot(spot)!;
    expect(plan.stops.map((s) => [s.name, s.role])).toEqual([['Start', 'checkpoint'], ['Checkpoint 2', 'checkpoint'], ['Finish', 'checkpoint']]);
    expect(plan.driveId).toBe('d1');
    expect(planForSpot({ ...spot, status: 'pending' })).toBeNull();
    expect(planForSpot({ ...spot, kind: 'track', path: undefined })!.stops).toEqual([{ id: 'place', name: 'Snake Pass', at: spot.at, role: 'destination' }]);
  });

  test('route params round-trip, and bad ones are refused', () => {
    const t = { kind: 'place' as const, name: 'Tyre shop', lat: 52.5, lng: -1.9 };
    expect(targetFromParams(targetParams(t))).toEqual(t);
    expect(targetFromParams(targetParams({ kind: 'event', id: 'e1' }))).toEqual({ kind: 'event', id: 'e1' });
    expect(targetFromParams({ kind: 'place', lat: 'x', lng: '1' })).toBeNull();
    expect(targetFromParams({ kind: 'nope' })).toBeNull();
    expect(planForPlace('Tyre shop', { lat: 52.5, lng: -1.9 }).stops[0].role).toBe('destination');
  });

  test('a searched address goes through to a one-stop plan ("Where to?")', () => {
    const t = { kind: 'place' as const, name: "12 High Street, St Mary's & Co", lat: 50.33, lng: 6.95 };
    const back = targetFromParams(targetParams(t));
    expect(back).toEqual(t);
    const plan = planForPlace(back!.kind === 'place' ? back!.name : '', { lat: 50.33, lng: 6.95 });
    expect(plan.title).toBe("12 High Street, St Mary's & Co");
    expect(plan.stops).toEqual([{ id: 'place', name: "12 High Street, St Mary's & Co", at: { lat: 50.33, lng: 6.95 }, role: 'destination' }]);
    expect(plan.eventId).toBeUndefined();
    expect(plan.driveId).toBeUndefined();
  });
});

describe('other apps', () => {
  const to = { lat: 52.5, lng: -1.9 };

  test('coordinates only, the app first and a web link after', () => {
    expect(directionsUrls('apple', to)).toEqual(['https://maps.apple.com/?daddr=52.500000,-1.900000&dirflg=d']);
    expect(directionsUrls('google', to)).toEqual([
      'comgooglemaps://?daddr=52.500000,-1.900000&directionsmode=driving',
      'https://www.google.com/maps/dir/?api=1&destination=52.500000,-1.900000&travelmode=driving',
    ]);
    expect(directionsUrls('google', to, [{ lat: 52.4, lng: -1.8 }])[1]).toContain('&waypoints=52.400000%2C-1.800000');
    expect(directionsUrls('waze', to)[0]).toBe('waze://?ll=52.500000,-1.900000&navigate=yes');
    expect(directionsUrls('waze', to)[1]).toBe('https://waze.com/ul?ll=52.500000,-1.900000&navigate=yes');
    expect(shareLocationText(to)).toBe('52.500000,-1.900000\nhttps://maps.apple.com/?ll=52.500000,-1.900000');
  });
});

import { liveActivityContent, sameContent, type LiveActivityInput } from '../src/lib/liveActivity';

const driving: LiveActivityInput = {
  phase: 'driving',
  banner: { kind: 'right', distance: 100, title: 'High Street' },
  trip: { eta: '14:32', distance: '12 mi' },
  destination: 'Leisure park car park',
};

describe('what the lock screen says', () => {
  test('driving: arrow, distance, road, then the quiet line and the destination', () => {
    expect(liveActivityContent(driving)).toEqual({
      arrow: 'right',
      distance: '110 yd',
      road: 'High Street',
      remaining: '12 mi',
      eta: '14:32',
      destination: 'Leisure park car park',
    });
  });

  test('nothing before the drive starts or after it fails', () => {
    for (const phase of ['locating', 'routing', 'preview', 'error'] as const) {
      expect(liveActivityContent({ ...driving, phase })).toBeNull();
    }
  });

  test('the last manoeuvre has no distance to turn at', () => {
    const c = liveActivityContent({ ...driving, banner: { kind: 'arrive', distance: 90, title: 'Leisure park car park' } });
    expect(c?.arrow).toBe('arrive');
    expect(c?.distance).toBe('');
  });

  test('driving with no manoeuvre left says to follow the route', () => {
    const c = liveActivityContent({ ...driving, banner: null });
    expect(c).toMatchObject({ arrow: 'straight', road: 'Follow the route', distance: '', remaining: '12 mi' });
  });

  test('no manoeuvre and no trip yet: nothing to show', () => {
    expect(liveActivityContent({ ...driving, banner: null, trip: null })).toBeNull();
  });

  test('arrived: the arrival, with the destination only', () => {
    expect(liveActivityContent({ ...driving, phase: 'arrived', banner: null, trip: null })).toEqual({
      arrow: 'arrive',
      distance: '',
      road: "You've arrived",
      remaining: '',
      eta: '',
      destination: 'Leisure park car park',
    });
  });

  test('only the manoeuvre, distances, time and destination name are in it', () => {
    const c = liveActivityContent(driving)!;
    expect(Object.keys(c).sort()).toEqual(['arrow', 'destination', 'distance', 'eta', 'remaining', 'road']);
  });

  test('sameContent ignores nothing that is shown', () => {
    const a = liveActivityContent(driving)!;
    expect(sameContent(a, { ...a })).toBe(true);
    expect(sameContent(a, { ...a, distance: '100 yd' })).toBe(false);
    expect(sameContent(a, null)).toBe(false);
    expect(sameContent(null, null)).toBe(true);
  });
});

describe('without the native side', () => {
  test('every call is a quiet no-op', () => {
    // In Jest there is no NavLiveActivity module, as on the web, Android and an older install.
    const { pushNavActivity, endNavActivity, liveActivityAvailable } = require('../src/lib/liveActivity');
    expect(liveActivityAvailable).toBe(false);
    expect(() => {
      pushNavActivity(liveActivityContent(driving));
      pushNavActivity(null);
      endNavActivity();
    }).not.toThrow();
  });
});

describe('updates reach the phone only when the words change, and not faster than once a second', () => {
  const calls: string[] = [];
  let mod: typeof import('../src/lib/liveActivity');

  beforeEach(() => {
    calls.length = 0;
    jest.resetModules();
    jest.useFakeTimers();
    jest.doMock('react-native', () => ({ Platform: { OS: 'ios' } }));
    jest.doMock('../modules/nav-live-activity', () => ({
      nativeLiveActivity: {
        isEnabled: () => true,
        start: async (s: { distance: string }) => (calls.push(`start ${s.distance}`), true),
        update: async (s: { distance: string }) => (calls.push(`update ${s.distance}`), true),
        end: async (s: { road: string } | null, linger: number) => (calls.push(`end ${s ? s.road : '-'} ${linger}`), true),
      },
    }));
    mod = require('../src/lib/liveActivity');
  });
  afterEach(() => {
    jest.useRealTimers();
    jest.dontMock('react-native');
    jest.dontMock('../modules/nav-live-activity');
  });

  const at = (distance: string) => ({ arrow: 'left', distance, road: 'A5', remaining: '3 mi', eta: '10:00', destination: 'Home' });
  const flush = async () => {
    for (let i = 0; i < 10; i++) await Promise.resolve();
  };

  test('start, then throttled changes, ignoring repeats', async () => {
    mod.pushNavActivity(at('500 yd'), false, 10_000);
    mod.pushNavActivity(at('500 yd'), false, 10_100); // same words
    mod.pushNavActivity(at('490 yd'), false, 10_400); // too soon: held
    mod.pushNavActivity(at('480 yd'), false, 10_500); // too soon: replaces the held one
    await flush();
    expect(calls).toEqual(['start 500 yd']);
    jest.advanceTimersByTime(700);
    await flush();
    expect(calls).toEqual(['start 500 yd', 'update 480 yd']);
    mod.pushNavActivity(at('470 yd'), false, 1e15);
    await flush();
    expect(calls[calls.length - 1]).toBe('update 470 yd');
  });

  test('stopping ends it at once, and ends nothing if it never started', async () => {
    mod.pushNavActivity(null);
    await flush();
    expect(calls).toEqual([]);
    mod.pushNavActivity(at('500 yd'), false, 20_000);
    mod.pushNavActivity(null);
    await flush();
    expect(calls).toEqual(['start 500 yd', 'end - 0']);
  });

  test('arrival shows for a moment, then ends', async () => {
    mod.pushNavActivity(at('500 yd'), false, 30_000);
    mod.pushNavActivity({ ...at(''), arrow: 'arrive', road: "You've arrived" }, true, 31_000);
    mod.endNavActivity(); // leaving the screen afterwards must not cut the arrival short
    await flush();
    expect(calls).toEqual(['start 500 yd', `end You've arrived ${mod.ARRIVED_LINGER_S}`]);
  });

  test('Live Activities off in iOS: asked once, then left alone', async () => {
    jest.resetModules();
    const start = jest.fn(async () => false);
    jest.doMock('../modules/nav-live-activity', () => ({ nativeLiveActivity: { isEnabled: () => false, start, update: jest.fn(), end: jest.fn() } }));
    const m = require('../src/lib/liveActivity');
    m.pushNavActivity(at('500 yd'), false, 40_000);
    await flush();
    m.pushNavActivity(at('400 yd'), false, 50_000);
    await flush();
    expect(start).toHaveBeenCalledTimes(1);
  });
});

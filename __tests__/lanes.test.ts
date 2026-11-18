import { DEMO_JUNCTIONS, demoJunctionAt, withDemoJunctions } from '../src/data/demoLanes';
import { lanesAtJunction, lanesTag, laneLabel, matchLanes, parseDestinationLanes, parseTurnLanes, roundaboutExit, towardsOf } from '../src/lib/lanes';
import { buildRoute } from '../src/lib/nav';
import { straightRoute } from '../src/lib/driveView';
import type { OsmWay } from '../src/lib/speedLimit';

describe('parsing turn:lanes', () => {
  test('lanes left to right, several arrows in one lane', () => {
    expect(parseTurnLanes('left|through;right|right')).toEqual([['left'], ['through', 'right'], ['right']]);
  });
  test('an empty lane is a lane with no arrow', () => {
    expect(parseTurnLanes('left||right')).toEqual([['left'], ['none'], ['right']]);
    expect(parseTurnLanes('none|through')).toEqual([['none'], ['through']]);
  });
  test('case and spaces are forgiven', () => {
    expect(parseTurnLanes(' Left ; Through | slight_right ')).toEqual([['left', 'through'], ['slight_right']]);
  });
  test('nothing to trust: null', () => {
    expect(parseTurnLanes(undefined)).toBeNull();
    expect(parseTurnLanes('')).toBeNull();
    expect(parseTurnLanes('left|sideways')).toBeNull();
    expect(parseTurnLanes('through|'.repeat(9) + 'through')).toBeNull();
  });
  test('destinations per lane must match the lane count', () => {
    expect(parseDestinationLanes('Tamworth|Tamworth;Lichfield|', 3)).toEqual([['tamworth'], ['tamworth', 'lichfield'], []]);
    expect(parseDestinationLanes('Tamworth|Lichfield', 3)).toBeNull();
  });
});

describe('which tag applies', () => {
  test('one-way and motorways use turn:lanes; two-way roads need :forward or :backward', () => {
    expect(lanesTag({ oneway: 'yes', 'turn:lanes': 'left|through' }, 'forward').turn).toBe('left|through');
    expect(lanesTag({ highway: 'motorway', 'turn:lanes': 'through|through|slight_left' }, 'forward').turn).toBe('through|through|slight_left');
    expect(lanesTag({ 'turn:lanes': 'left|through' }, 'forward').turn).toBeNull();
    expect(lanesTag({ 'turn:lanes:forward': 'left|right', 'turn:lanes:backward': 'through' }, 'backward').turn).toBe('through');
    expect(lanesTag({ oneway: 'yes', 'turn:lanes': 'left' }, 'backward').turn).toBeNull();
  });
});

describe('matching a manoeuvre', () => {
  const lanes = parseTurnLanes('left|through;right|right')!;
  const on = (s: ReturnType<typeof matchLanes>) => s?.lanes?.map((l) => l.on);
  test('turn right: the lanes with a right arrow', () => {
    expect(on(matchLanes(lanes, 'right', 'Turn right onto Mill Lane'))).toEqual([false, true, true]);
  });
  test('turn left and straight on', () => {
    expect(on(matchLanes(lanes, 'left', 'Turn left'))).toEqual([true, false, false]);
    expect(on(matchLanes(lanes, 'straight', 'Continue on A5'))).toEqual([false, true, false]);
  });
  test('a slight turn falls back to the full turn when no lane is marked slight', () => {
    expect(on(matchLanes(lanes, 'slightRight', 'Bear right'))).toEqual([false, true, true]);
  });
  test('motorway exit on the left', () => {
    expect(on(matchLanes(parseTurnLanes('slight_left|through|through')!, 'keepLeft', 'Keep left towards Tamworth'))).toEqual([true, false, false]);
  });
  test('never guesses: no lane fits, nothing shown', () => {
    expect(matchLanes(parseTurnLanes('through|through')!, 'left', 'Turn left')).toBeNull();
    expect(matchLanes(null, 'left', 'Turn left')).toBeNull();
    expect(matchLanes(lanes, 'arrive', 'Arrive at the destination')).toBeNull();
  });
  test('signed destinations narrow the lanes down', () => {
    const l = parseTurnLanes('through|through|slight_left;through')!;
    const d = parseDestinationLanes('Birmingham|Birmingham|Tamworth', 3);
    expect(on(matchLanes(l, 'straight', 'Continue towards Birmingham', d))).toEqual([true, true, false]);
  });
});

describe('roundabouts (UK)', () => {
  test('exit numbers from Apple wording', () => {
    expect(roundaboutExit('At the roundabout, take the 2nd exit onto A5')).toBe(2);
    expect(roundaboutExit('At the roundabout, take the first exit')).toBe(1);
    expect(roundaboutExit('Turn left')).toBeNull();
    expect(towardsOf('Take exit 10 toward Tamworth')).toBe('tamworth');
  });
  test('first exit is the left lane, only when a lane is marked left', () => {
    const s = matchLanes(parseTurnLanes('left;through|right')!, 'roundabout', 'At the roundabout, take the 1st exit');
    expect(s).toEqual({ lanes: [{ arrows: ['left', 'through'], on: true }, { arrows: ['right'], on: false }], exit: 1 });
    expect(matchLanes(parseTurnLanes('through|right')!, 'roundabout', 'At the roundabout, take the first exit')).toEqual({ lanes: null, exit: 1 });
  });
  test('any other exit: the exit number only', () => {
    expect(matchLanes(parseTurnLanes('left|through|right')!, 'roundabout', 'At the roundabout, take the 3rd exit')).toEqual({ lanes: null, exit: 3 });
    expect(laneLabel({ lanes: null, exit: 3 })).toBe('Exit 3');
  });
});

describe('the approach road', () => {
  // A one-way road running east into a junction at lng -1.6990, and a side road.
  const approach: OsmWay = {
    id: 1,
    tags: { highway: 'primary', oneway: 'yes', 'turn:lanes': 'left;through|right' },
    geometry: [
      { lat: 52.62, lon: -1.702 },
      { lat: 52.62, lon: -1.699 },
    ],
  };
  const side: OsmWay = { id: 2, tags: { highway: 'residential' }, geometry: [{ lat: 52.62, lon: -1.699 }, { lat: 52.617, lon: -1.699 }] };
  const junction = { lat: 52.62, lng: -1.699 };
  const before = { at: { lat: 52.62, lng: -1.6995 }, bearing: 90 };
  test('reads the lanes of the road you approach on', () => {
    const s = lanesAtJunction([approach, side], junction, before, 'right', 'Turn right');
    expect(s?.lanes?.map((l) => l.on)).toEqual([false, true]);
    expect(laneLabel(s!)).toBe('2 lanes, use lane 2 from the left');
  });
  test('driving the wrong way along a one-way road: nothing', () => {
    expect(lanesAtJunction([approach], { lat: 52.62, lng: -1.702 }, { at: { lat: 52.62, lng: -1.7015 }, bearing: 270 }, 'right', 'Turn right')).toBeNull();
  });
  test('a road that carries on past the junction is for a later junction: nothing', () => {
    expect(lanesAtJunction([approach], { lat: 52.62, lng: -1.7005 }, { at: { lat: 52.62, lng: -1.701 }, bearing: 90 }, 'right', 'Turn right')).toBeNull();
  });
});

describe('demo junctions', () => {
  test('every baked junction parses', () => {
    for (const j of DEMO_JUNCTIONS) expect(parseTurnLanes(j.turnLanes)).not.toBeNull();
  });
  test('are put into a baked route as steps, in order', () => {
    const j = DEMO_JUNCTIONS[0];
    const points = [
      { lat: j.at.lat, lng: j.at.lng - 0.01 },
      { lat: j.at.lat, lng: j.at.lng },
      { lat: j.at.lat - 0.01, lng: j.at.lng },
    ];
    const raw = withDemoJunctions(straightRoute([points[0], points[2]], ['End'], 60, () => points));
    const route = buildRoute(raw, ['End']);
    expect(route.steps.map((s) => s.text)).toEqual(['Head towards End', 'Turn right', 'Arrive at End']);
    expect(demoJunctionAt(route.steps[1].at)).toBe(j);
  });
});

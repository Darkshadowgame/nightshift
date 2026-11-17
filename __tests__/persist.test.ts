import { changedSlices, joinSlices, needsMigration, SCHEMA_VERSION, SLICE_NAMES, sliceKey, sliceOf, splitState } from '../src/lib/persist';

const state = {
  schemaVersion: SCHEMA_VERSION,
  settings: { cameras: true },
  builds: [{ id: 'b1' }],
  events: [{ id: 'e1' }],
  chat: [],
  votes: [],
  spots: [],
  placeProgress: {},
  users: [{ id: 'me' }],
  crews: [],
  onboarded: true,
  somethingNew: 1,
};

describe('saving the state in slices', () => {
  test('every field lands in one slice; unknown fields go in meta', () => {
    const parts = splitState(state);
    expect(Object.keys(parts)).toEqual([...SLICE_NAMES]);
    expect(parts.settings).toEqual({ settings: state.settings });
    expect(parts.places).toEqual({ spots: [], placeProgress: {} });
    expect(parts.meta).toEqual({ schemaVersion: SCHEMA_VERSION, onboarded: true, somethingNew: 1 });
    expect(sliceOf('chat')).toBe('events');
  });

  test('only the slices that changed are written', () => {
    expect(changedSlices(null, state)).toEqual([...SLICE_NAMES]);
    expect(changedSlices(state, { ...state })).toEqual([]);
    expect(changedSlices(state, { ...state, settings: { cameras: false } })).toEqual(['settings']);
    expect(changedSlices(state, { ...state, chat: [{ id: 'c' }], onboarded: false })).toEqual(['meta', 'events']);
  });

  test('slices join back into the same state', () => {
    const parts = splitState(state);
    const raw = SLICE_NAMES.map((n) => [sliceKey(n), JSON.stringify(parts[n])] as const);
    expect(joinSlices(raw)).toEqual(state);
  });

  test('no meta slice means nothing saved; a broken slice means start again', () => {
    expect(joinSlices([[sliceKey('settings'), '{}']])).toBeNull();
    expect(joinSlices([[sliceKey('meta'), '{}'], [sliceKey('events'), '{not json']])).toBeNull();
  });

  test('older saves need migrating, current ones do not', () => {
    expect(needsMigration({})).toBe(true);
    expect(needsMigration({ schemaVersion: SCHEMA_VERSION })).toBe(false);
  });
});

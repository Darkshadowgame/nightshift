import { CLASH_WORDS, goingClash } from '../src/lib/clash';
import type { NightEvent } from '../src/lib/types';

const NOW = new Date('2026-11-20T21:10:00');
const ev = (id: string, start: string, end: string | null, patch: Partial<NightEvent> = {}): NightEvent =>
  ({
    id,
    type: 'meet',
    title: id,
    startsAt: new Date(start).toISOString(),
    ...(end ? { endsAt: new Date(end).toISOString() } : {}),
    area: { lat: 52.6, lng: -1.7 },
    areaName: 'Tamworth',
    stops: [],
    currentStop: 0,
    revealMinutesBefore: 60,
    hostIds: ['tom'],
    filter: { everyone: true },
    going: ['tom', 'me'],
    checkIns: {},
    ...patch,
  }) as unknown as NightEvent;

describe('goingClash (Review 20 problem 2)', () => {
  const coffee = ev('Sunday coffee and cars', '2026-11-22T10:00', '2026-11-22T13:00');
  test('hosting at a time you are going to something warns, naming it', () => {
    const c = goingClash([coffee], 'me', { start: new Date('2026-11-22T10:00'), end: new Date('2026-11-22T13:00') }, NOW);
    expect(c?.title).toBe('Sunday coffee and cars');
    expect(CLASH_WORDS.message(c!.title)).toBe("You're going to Sunday coffee and cars then. Host anyway?");
  });
  test('an overlap counts; touching ends do not', () => {
    expect(goingClash([coffee], 'me', { start: new Date('2026-11-22T12:00') }, NOW)).toBeDefined();
    expect(goingClash([coffee], 'me', { start: new Date('2026-11-22T13:00'), end: new Date('2026-11-22T15:00') }, NOW)).toBeUndefined();
    expect(goingClash([coffee], 'me', { start: new Date('2026-11-22T07:00'), end: new Date('2026-11-22T10:00') }, NOW)).toBeUndefined();
  });
  test('not going, hosting it, cancelled, or the meet being edited: no clash', () => {
    const at = { start: new Date('2026-11-22T10:00') };
    expect(goingClash([ev('a', '2026-11-22T10:00', null, { going: ['tom'] })], 'me', at, NOW)).toBeUndefined();
    expect(goingClash([ev('b', '2026-11-22T10:00', null, { hostIds: ['me'] })], 'me', at, NOW)).toBeUndefined();
    expect(goingClash([ev('c', '2026-11-22T10:00', null, { cancelled: true })], 'me', at, NOW)).toBeUndefined();
    expect(goingClash([coffee], 'me', { ...at, selfId: coffee.id }, NOW)).toBeUndefined();
  });
});

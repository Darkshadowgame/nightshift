import { startFrom } from '../src/lib/when';

const TONIGHT = { label: 'Tonight', days: 0 };
const at = (h: number, m = 0) => new Date(2026, 10, 17, h, m); // Tue 17 Nov 2026, local time

describe('host form start time', () => {
  test('tonight at a later time is today', () => {
    const r = startFrom(TONIGHT, '22:30', at(20));
    expect(r.ok && r.start).toEqual(new Date(2026, 10, 17, 22, 30));
  });

  test('tonight at a time that has passed is an error, not tomorrow', () => {
    const r = startFrom(TONIGHT, '22:30', at(22, 45));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toContain('22:30 has passed tonight');
  });

  test('tonight with a small-hours time is the early morning after', () => {
    const r = startFrom(TONIGHT, '06:00', at(20));
    expect(r.ok && r.start).toEqual(new Date(2026, 10, 18, 6, 0));
  });

  test('tomorrow and this weekend', () => {
    const t = startFrom({ label: 'Tomorrow', days: 1 }, '09:00', at(20));
    expect(t.ok && t.start).toEqual(new Date(2026, 10, 18, 9, 0));
    const w = startFrom({ label: 'This weekend', days: -1 }, '22:00', at(20));
    expect(w.ok && w.start).toEqual(new Date(2026, 10, 21, 22, 0)); // Saturday
  });

  test('editing keeps the event date', () => {
    const r = startFrom({ label: 'Fri (as planned)', days: 0, date: new Date(2026, 10, 20, 22, 0).toISOString() }, '23:00', at(20));
    expect(r.ok && r.start).toEqual(new Date(2026, 10, 20, 23, 0));
  });
});

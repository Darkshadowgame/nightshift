import { ALL_TIMES, calendarDays, endFrom, orderedTimes, pastLabel, quickDays, startFrom } from '../src/lib/when';

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
    const r = startFrom(TONIGHT, '01:30', at(20));
    expect(r.ok && r.start).toEqual(new Date(2026, 10, 18, 1, 30));
  });

  test('tomorrow and this weekend', () => {
    const t = startFrom({ label: 'Tomorrow', days: 1 }, '09:00', at(20));
    expect(t.ok && t.start).toEqual(new Date(2026, 10, 18, 9, 0));
    const w = startFrom({ label: 'Sat', days: -1 }, '22:00', at(20));
    expect(w.ok && w.start).toEqual(new Date(2026, 10, 21, 22, 0)); // Saturday
    const sun = startFrom({ label: 'Sun', days: -2 }, '10:00', at(20));
    expect(sun.ok && sun.start).toEqual(new Date(2026, 10, 22, 10, 0)); // Sunday 10:00 coffee meet
  });

  test('quick picks are Tonight, Tomorrow, Sat and Sun', () => {
    expect(quickDays(at(20)).map((d) => d.label)).toEqual(['Tonight', 'Tomorrow', 'Sat 21', 'Sun 22']);
  });

  test('any date in the next 60 days, any time in 15-minute steps', () => {
    const days = calendarDays(at(20));
    expect(days).toHaveLength(61);
    const last = startFrom(days[60], '19:45', at(20));
    expect(last.ok && last.start).toEqual(new Date(2026, 0 + 10, 17 + 60, 19, 45));
    expect(ALL_TIMES).toHaveLength(96);
    expect(ALL_TIMES).toContain('10:00');
    expect(ALL_TIMES).toContain('19:30');
    expect(ALL_TIMES[95]).toBe('23:45');
    expect(startFrom({ label: 'x', days: 0, date: new Date(2027, 2, 1).toISOString() }, '20:00', at(20)).ok).toBe(false);
  });

  test('an end time at or before the start is the next morning', () => {
    const start = new Date(2026, 10, 17, 22, 0);
    expect(endFrom(start, null)).toBeNull();
    expect(endFrom(start, '23:30')).toEqual(new Date(2026, 10, 17, 23, 30));
    expect(endFrom(start, '01:00')).toEqual(new Date(2026, 10, 18, 1, 0));
  });

  test('editing keeps the event date', () => {
    const r = startFrom({ label: 'Fri (as planned)', days: 0, date: new Date(2026, 10, 20, 22, 0).toISOString() }, '23:00', at(20));
    expect(r.ok && r.start).toEqual(new Date(2026, 10, 20, 23, 0));
  });
});

describe('orderedTimes (Review 8: chips in the order they happen)', () => {
  const TIMES = ['19:00', '20:30', '22:00', '22:30', '23:00', '23:59', '01:00', '09:00'];
  const afternoon = new Date(2026, 10, 18, 15, 0);
  it('Tonight: evening first, then the small hours, labelled tomorrow', () => {
    const r = orderedTimes({ label: 'Tonight', days: 0 }, TIMES, afternoon);
    // 09:00 has passed today: it sorts first (the form leaves passed times out).
    expect(r.map((x) => x.label)).toEqual(['09:00', '19:00', '20:30', '22:00', '22:30', '23:00', '23:59', '01:00 tomorrow']);
  });
  it('another day: in clock order, morning first, no "tomorrow"', () => {
    const r = orderedTimes({ label: 'Tomorrow', days: 1 }, TIMES, afternoon);
    expect(r.map((x) => x.label)).toEqual(['01:00', '09:00', '19:00', '20:30', '22:00', '22:30', '23:00', '23:59']);
    expect(r.map((x) => x.time)[0]).toBe('01:00');
  });
});

describe('pastLabel (4.10, Review 14: after midnight is still tonight)', () => {
  const now = new Date(2026, 10, 18, 9, 0); // Wed 18 Nov, 09:00
  it('says Tonight for the small hours and the evening, Today in the day', () => {
    expect(pastLabel(new Date(2026, 10, 18, 1, 10), now)).toBe('Tonight 01:10');
    expect(pastLabel(new Date(2026, 10, 18, 8, 0), now)).toBe('Today 08:00');
    expect(pastLabel(new Date(2026, 10, 17, 22, 0), now)).toBe('Yesterday 22:00');
    expect(pastLabel(new Date(2026, 10, 14, 10, 0), now)).toBe('Sat 10:00');
    expect(pastLabel(new Date(2026, 10, 7, 10, 0), now)).toBe('Sat 7 Nov');
  });
});

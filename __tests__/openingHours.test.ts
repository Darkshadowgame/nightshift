import { formatOpeningHours, openState, parseOpeningHours } from '../src/lib/openingHours';

// Local times: 17 Nov 2026 is a Tuesday.
const tue = (h: number, m = 0) => new Date(2026, 10, 17, h, m);
const sat = (h: number, m = 0) => new Date(2026, 10, 21, h, m);
const sun = (h: number, m = 0) => new Date(2026, 10, 22, h, m);

describe('parseOpeningHours', () => {
  test('weekdays, Saturday morning, Sunday off', () => {
    const w = parseOpeningHours('Mo-Fr 08:00-17:30; Sa 09:00-13:00; Su off')!;
    expect(w.days[0]).toEqual([[480, 1050]]);
    expect(w.days[4]).toEqual([[480, 1050]]);
    expect(w.days[5]).toEqual([[540, 780]]);
    expect(w.days[6]).toEqual([]);
    expect(formatOpeningHours(w)).toEqual([
      { days: 'Mon–Fri', hours: '08:00–17:30' },
      { days: 'Sat', hours: '09:00–13:00' },
      { days: 'Sun', hours: 'Closed' },
    ]);
  });

  test('24/7', () => {
    const w = parseOpeningHours('24/7')!;
    expect(w.always).toBe(true);
    expect(openState(w, tue(3)).label).toBe('Open 24 hours');
    expect(formatOpeningHours(w)).toEqual([{ days: 'Every day', hours: 'Open 24 hours' }]);
  });

  test('a lunch break and lists of days', () => {
    const w = parseOpeningHours('Mo,We,Fr 08:30-12:30,13:30-17:00; Tu,Th 08:30-17:00')!;
    expect(w.days[0]).toEqual([[510, 750], [810, 1020]]);
    expect(w.days[1]).toEqual([[510, 1020]]);
    expect(w.days[5]).toEqual([]);
    expect(formatOpeningHours(w)[0]).toEqual({ days: 'Mon', hours: '08:30–12:30, 13:30–17:00' });
  });

  test('comma between rules, as people often write it', () => {
    const w = parseOpeningHours('Mo-Fr 08:00-18:00, Sa 08:00-13:00')!;
    expect(w.days[4]).toEqual([[480, 1080]]);
    expect(w.days[5]).toEqual([[480, 780]]);
    expect(w.days[6]).toEqual([]);
  });

  test('later rules replace earlier ones for the same day', () => {
    const w = parseOpeningHours('Mo-Su 09:00-17:00; Su 10:00-16:00')!;
    expect(w.days[0]).toEqual([[540, 1020]]);
    expect(w.days[6]).toEqual([[600, 960]]);
    expect(formatOpeningHours(w)).toEqual([
      { days: 'Mon–Sat', hours: '09:00–17:00' },
      { days: 'Sun', hours: '10:00–16:00' },
    ]);
  });

  test('times with no days mean every day', () => {
    const w = parseOpeningHours('07:00-19:00')!;
    expect(w.days.every((d) => d.length === 1 && d[0][0] === 420)).toBe(true);
    expect(formatOpeningHours(w)).toEqual([{ days: 'Every day', hours: '07:00–19:00' }]);
  });

  test('long day names, dots and stray colons are read', () => {
    const w = parseOpeningHours('Mon-Fri: 8.00-17.00; Saturday 9:00-12:00')!;
    expect(w.days[0]).toEqual([[480, 1020]]);
    expect(w.days[5]).toEqual([[540, 720]]);
  });

  test('a week that wraps round (Fr-Mo)', () => {
    const w = parseOpeningHours('Fr-Mo 10:00-16:00')!;
    expect([0, 4, 5, 6].every((d) => w.days[d].length === 1)).toBe(true);
    expect([1, 2, 3].every((d) => w.days[d].length === 0)).toBe(true);
  });

  test('bank holidays are noted, never guessed', () => {
    const w = parseOpeningHours('Mo-Fr 08:00-17:00; PH off')!;
    expect(w.holidays).toBe('Bank holidays: closed');
    expect(formatOpeningHours(w).at(-1)).toEqual({ days: 'Bank hols', hours: 'Closed' });
    const both = parseOpeningHours('Mo-Sa 09:00-17:00; Su,PH off')!;
    expect(both.days[6]).toEqual([]);
    expect(both.holidays).toBe('Bank holidays: closed');
  });

  test('formats it can’t read give null', () => {
    for (const raw of [
      'Apr-Oct: Mo-Su 09:00-17:00',
      'sunrise-sunset',
      'Mo-Fr 09:00-17:00 "by appointment"',
      'Mo-Fr 9am-5pm',
      'by appointment',
      'Mo-Fr 25:00-26:00',
      'week 1-53 Mo 09:00-12:00',
      '',
      undefined,
    ])
      expect(parseOpeningHours(raw)).toBeNull();
  });
});

describe('openState', () => {
  const w = parseOpeningHours('Mo-Fr 08:00-17:30; Sa 09:00-13:00; Su off')!;

  test('open, with when it closes', () => {
    expect(openState(w, tue(10))).toEqual({ open: true, label: 'Open now · closes 17:30' });
  });

  test('before opening, after closing, and over the weekend', () => {
    expect(openState(w, tue(7, 15))).toEqual({ open: false, label: 'Closed · opens 08:00' });
    expect(openState(w, tue(17, 30))).toEqual({ open: false, label: 'Closed · opens tomorrow 08:00' });
    expect(openState(w, sat(14))).toEqual({ open: false, label: 'Closed · opens Mon 08:00' });
    expect(openState(w, sun(12))).toEqual({ open: false, label: 'Closed · opens tomorrow 08:00' });
  });

  test('a late night that runs past midnight', () => {
    const late = parseOpeningHours('Fr-Sa 18:00-02:00')!;
    expect(openState(late, sat(1, 30))).toEqual({ open: true, label: 'Open now · closes 02:00' });
    expect(openState(late, sat(23))).toEqual({ open: true, label: 'Open now · closes 02:00' });
    expect(openState(late, sun(1))).toEqual({ open: true, label: 'Open now · closes 02:00' });
    expect(openState(late, sun(3)).open).toBe(false);
    expect(formatOpeningHours(late).find((l) => l.days === 'Fri, Sat')?.hours).toBe('18:00–02:00');
  });

  test('closing at midnight', () => {
    const m = parseOpeningHours('Mo-Su 10:00-24:00')!;
    expect(openState(m, tue(23, 59))).toEqual({ open: true, label: 'Open now · until midnight' });
  });

  test('closed all week', () => {
    expect(openState(parseOpeningHours('Mo-Su off')!, tue(12))).toEqual({ open: false, label: 'Closed' });
  });
});

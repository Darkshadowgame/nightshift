import { draftSummary, restoredDay, worthKeeping, type HostDraft } from '../src/lib/hostDraft';
import { DEFAULT_FILTER } from '../src/lib/invites';
import { defaultStart, EVENING_TIMES, pickedDayChoice, quickDays, startFrom } from '../src/lib/when';

const at = (h: number, m = 0, d = 18) => new Date(2026, 10, d, h, m);

describe('the host draft (REVIEW-10 decision 2)', () => {
  const base: HostDraft = {
    step: 0, type: 'meet', title: '', description: '', areaName: '', day: { label: 'Tonight', days: 0 }, time: '20:00', endTime: null,
    reveal: 60, stops: [{ key: 's0', name: '' }], filter: { ...DEFAULT_FILTER }, crewOwned: false, coHosts: [], savedAt: '',
  };
  it('keeps a draft once anything is typed, placed or a step is passed', () => {
    expect(worthKeeping(base)).toBe(false);
    expect(worthKeeping({ ...base, title: 'Late one' })).toBe(true);
    expect(worthKeeping({ ...base, step: 1 })).toBe(true);
    expect(worthKeeping({ ...base, stops: [{ key: 's0', name: '', at: { lat: 52, lng: -1 } }] })).toBe(true);
  });
  it('says where you got to', () => {
    expect(draftSummary({ ...base, title: 'Late one', step: 2 }, 5)).toBe('Late one · step 3 of 5');
    expect(draftSummary(base, 5)).toBe('No name yet · step 1 of 5');
  });
  it('restores the day; a picked date that has gone falls back to Tonight', () => {
    const now = at(13, 20);
    const quick = quickDays(now);
    expect(restoredDay({ ...base, day: { label: 'Tomorrow', days: 1 } }, quick, now)).toEqual({ picked: null, index: 1 });
    const later = pickedDayChoice('2026-11-27', now);
    expect(restoredDay({ ...base, day: later }, quick, now)).toEqual({ picked: later, index: quick.length });
    expect(restoredDay({ ...base, day: pickedDayChoice('2026-11-17', at(9, 0, 17)) }, quick, now)).toEqual({ picked: null, index: 0 });
  });
});

describe('When defaults (REVIEW-10)', () => {
  it('starts tonight at 20:00 at lunchtime, never 22:30, and never 10:00 from nowhere', () => {
    expect(defaultStart(at(13, 20))).toEqual({ day: 0, time: '20:00' });
    expect(EVENING_TIMES).not.toContain('10:00');
  });
  it('moves to the next evening time, then tomorrow', () => {
    expect(defaultStart(at(19, 50))).toEqual({ day: 0, time: '21:00' });
    expect(defaultStart(at(22, 10))).toEqual({ day: 1, time: '20:00' });
  });
  it('every default is a valid start', () => {
    for (let h = 0; h < 24; h++) {
      const now = at(h, 40);
      const d = defaultStart(now);
      expect(startFrom(quickDays(now)[d.day], d.time, now).ok).toBe(true);
    }
  });
  it('a picked day is a day choice with its date', () => {
    const c = pickedDayChoice('2026-11-27', at(13, 20));
    expect(c.days).toBe(9);
    expect(new Date(c.date!).getDate()).toBe(27);
    expect(startFrom(c, '20:00', at(13, 20)).ok).toBe(true);
  });
});

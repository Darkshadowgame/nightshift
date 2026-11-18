import {
  displayHandle,
  entityA11yLabel,
  initials,
  metaLine,
  normaliseSelection,
  passesFilter,
  segmentLabel,
  selectionSummary,
  statA11yLabel,
  toastDuration,
  toggleSelection,
} from '../src/components/ds/logic';
import { COLOR, RADII, SPACING, TYPE_SCALE, outline, tint, line } from '../src/theme';

describe('initials', () => {
  it('uses first and last name', () => {
    expect(initials('Sam Patel')).toBe('SP');
    expect(initials('  mary  ann  smith ')).toBe('MS');
  });
  it('uses one letter for one name', () => {
    expect(initials('Ana')).toBe('A');
  });
  it('falls back to the handle without the @', () => {
    expect(initials('', '@night_owl')).toBe('N');
    expect(initials(undefined, 'tomtom_gr')).toBe('T');
    expect(initials('ek_fk8', 'ek_fk8')).toBe('E'); // a name that is just the handle
    expect(initials('ek_fk8', '@ek_fk8')).toBe('E');
  });
  it('skips emoji and punctuation', () => {
    expect(initials('🔥 Zed')).toBe('Z');
    expect(initials('"Dee" O\'Neil')).toBe('DO');
  });
  it('handles non-Latin letters', () => {
    expect(initials('Łukasz Żak')).toBe('ŁŻ');
  });
  it('gives ? when there is nothing to use', () => {
    expect(initials(null, null)).toBe('?');
    expect(initials('!!', '@')).toBe('?');
  });
});

describe('displayHandle', () => {
  it('always has exactly one @ and keeps case', () => {
    expect(displayHandle('NightOwl')).toBe('@NightOwl');
    expect(displayHandle('@@x')).toBe('@x');
  });
});

describe('chip selection', () => {
  const all = ['car', 'bike'] as const;
  it('toggles on and off', () => {
    expect(toggleSelection([], 'car')).toEqual(['car']);
    expect(toggleSelection(['car'], 'car')).toEqual([]);
  });
  it('keeps the chips order when given', () => {
    expect(toggleSelection(['bike'], 'car', all)).toEqual(['car', 'bike']);
  });
  it('treats every option selected as no filter', () => {
    expect(normaliseSelection(['bike', 'car'], all)).toEqual([]);
    expect(normaliseSelection(['bike'], all)).toEqual(['bike']);
  });
  it('drops keys that are not options', () => {
    expect(normaliseSelection(['bike', 'boat' as 'car'], all)).toEqual(['bike']);
  });
  it('lets everything through when nothing is selected', () => {
    expect(passesFilter([], 'car')).toBe(true);
    expect(passesFilter(['bike'], 'car')).toBe(false);
    expect(passesFilter(['bike'], ['car', 'bike'])).toBe(true);
  });
  it('summarises a selection', () => {
    expect(selectionSummary([])).toBe('All');
    expect(selectionSummary([], 'Any make')).toBe('Any make');
    expect(selectionSummary(['Cars'])).toBe('Cars');
    expect(selectionSummary(['Cars', 'Bikes'])).toBe('Cars and bikes');
    expect(selectionSummary(['S', 'A', 'B'])).toBe('3 selected');
  });
});

describe('labels', () => {
  it('adds a count to a segment, including zero', () => {
    expect(segmentLabel('Mine')).toBe('Mine');
    expect(segmentLabel('Mine', 0)).toBe('Mine 0');
    expect(segmentLabel('Mine', 3)).toBe('Mine 3');
  });
  it('joins meta lines and skips blanks', () => {
    expect(metaLine(['Tonight 22:30', '7 going', null, '', false, '3.2 mi'])).toBe('Tonight 22:30 · 7 going · 3.2 mi');
  });
  it('reads an entity in order', () => {
    expect(entityA11yLabel({ kind: 'event', title: 'Late one', meta: 'Tonight', tags: ['Going'], sample: true })).toBe(
      'Event, Late one, Tonight, Going, Sample, for the demo',
    );
    expect(entityA11yLabel({ eyebrow: 'Rolling meet', title: 'X' })).toBe('Rolling meet, X');
  });
  it('reads a stat', () => {
    expect(statA11yLabel({ label: 'Power', value: '583', unit: 'bhp' })).toBe('Power 583 bhp');
  });
  it('keeps every toast up for 3.2 s, with or without Undo (4.7)', () => {
    expect(toastDuration('Saved', false)).toBe(3200);
    expect(toastDuration('Saved', true)).toBe(3200);
    expect(toastDuration('x'.repeat(500), true)).toBe(3200);
  });
});

describe('tokens', () => {
  it('spacing is on a 4-pt grid (apart from the hairline step)', () => {
    for (const [k, v] of Object.entries(SPACING)) if (k !== 'xxs') expect(v % 4).toBe(0);
  });
  it('has one radius per job', () => {
    expect(RADII).toEqual({ tag: 4, control: 8, card: 12, sheet: 16, pill: 999 });
  });
  it('uses only the three alphas', () => {
    expect(tint('#ff9a2e')).toBe('#ff9a2e1f');
    expect(line('#ff9a2e')).toBe('#ff9a2e40');
    expect(outline('#ff9a2e')).toBe('#ff9a2e99');
  });
  it('never makes content uppercase', () => {
    for (const k of ['title', 'titleLg', 'body', 'meta', 'secondary', 'caption'] as const) {
      expect((TYPE_SCALE[k] as { caps?: boolean }).caps).toBeFalsy();
    }
  });
  it('keeps avatars off the action colour', () => {
    expect(COLOR.avatar.fg).not.toBe(COLOR.action.primary);
    expect(COLOR.avatar.border).not.toBe(COLOR.action.primary);
  });
  it('has no type size under 11', () => {
    for (const t of Object.values(TYPE_SCALE)) expect(t.fontSize).toBeGreaterThanOrEqual(11);
  });
});

describe('date picker helpers (REVIEW-10 #11)', () => {
  const { localDay, parseLocalDay, monthGrid } = require('../src/components/ds/logic');
  it('round-trips a local day', () => {
    expect(localDay(new Date(2026, 10, 27, 23, 30))).toBe('2026-11-27');
    expect(localDay(parseLocalDay('2026-02-28'))).toBe('2026-02-28');
    expect(parseLocalDay('2026-02-30')).toBeNull();
    expect(parseLocalDay('27/11/2026')).toBeNull();
  });
  it('lays a month out Monday first', () => {
    const nov = monthGrid(2026, 10); // 1 Nov 2026 is a Sunday
    expect(nov[0]).toEqual([null, null, null, null, null, null, '2026-11-01']);
    expect(nov.every((r: unknown[]) => r.length === 7)).toBe(true);
    expect(nov.flat().filter(Boolean)).toHaveLength(30);
  });
});

describe('Redesign 2 tokens (5.6)', () => {
  const theme = require('../src/theme');
  it('adds the hero type: display face, 30/34, not caps', () => {
    expect(TYPE_SCALE.hero).toMatchObject({ fontSize: 30, lineHeight: 34, scale: 'chrome' });
    expect((TYPE_SCALE.hero as { caps?: boolean }).caps).toBeFalsy();
  });
  it('shouts less in chrome', () => {
    expect(TYPE_SCALE.label.letterSpacing).toBe(1.0);
    expect(TYPE_SCALE.eyebrow.letterSpacing).toBe(1.5);
  });
  it('keeps sodium for the primary and "selected" only', () => {
    expect(COLOR.action.primary).toBe(theme.C.sodium);
    expect(COLOR.action.selected).toBe(theme.C.sodium);
    expect(COLOR.action.link).toBe(theme.C.chalk);
    expect(COLOR.badge).toEqual({ bg: COLOR.state.liveDot, fg: '#ffffff' });
  });
  it('has one fade over photos, the bar shadow, morph and stagger timings, and photo shapes', () => {
    expect(COLOR.surface.photoFade).toEqual(['rgba(11,15,23,0)', 'rgba(11,15,23,0.9)']);
    expect(theme.ELEVATION.bar).toEqual({ boxShadow: '0px -2px 12px rgba(0,0,0,0.45)' });
    expect(theme.MOTION.morph).toBe(260);
    expect(theme.MOTION.stagger).toBe(30);
    expect(theme.ASPECT).toEqual({ event: 16 / 9, build: 4 / 3, post: 4 / 5 });
  });
  it('has dropped the deprecated RADIUS and SPACE', () => {
    expect(theme.RADIUS).toBeUndefined();
    expect(theme.SPACE).toBeUndefined();
  });
  it('makes eyebrows fog by default', () => {
    const { typeStyle } = require('../src/components/ds/Text');
    expect(typeStyle('eyebrow').color).toBe(COLOR.text.secondary);
  });
});

describe('new component helpers', () => {
  const { rgba, stripFaces } = require('../src/components/ds/logic');
  it('turns a hex into rgba', () => {
    expect(rgba('#ff9a2e', 0.5)).toBe('rgba(255,154,46,0.5)');
    expect(rgba('#fff', 1)).toBe('rgba(255,255,255,1)');
  });
  it('shows up to six faces and counts the rest', () => {
    expect(stripFaces([1, 2, 3])).toEqual({ shown: [1, 2, 3], more: 0 });
    expect(stripFaces([1, 2, 3, 4, 5, 6, 7, 8, 9])).toEqual({ shown: [1, 2, 3, 4, 5, 6], more: 3 });
  });
});

describe('time wording (4.10, when.ts)', () => {
  const w = require('../src/lib/when');
  // Friday 20 Nov 2026.
  const at = (d: number, h: number, m = 0) => new Date(2026, 10, d, h, m);
  const fri2110 = at(20, 21, 10);
  const fri1230 = at(20, 12, 30);
  it('says Today before 17:00 and Tonight from 17:00 and into the small hours', () => {
    expect(w.whenLabel(at(20, 14), fri1230)).toBe('Today 14:00');
    expect(w.whenLabel(at(20, 22), fri1230)).toBe('Tonight 22:00');
    expect(w.whenLabel(at(21, 0, 30), fri2110)).toBe('Tonight 00:30');
    expect(w.whenLabel(at(21, 1), fri1230)).toBe('Tonight 01:00');
  });
  it('says Tomorrow, a weekday within 6 days, then the date', () => {
    expect(w.whenLabel(at(21, 20), fri2110)).toBe('Tomorrow 20:00');
    expect(w.whenLabel(at(22, 10), fri2110)).toBe('Sun 10:00');
    expect(w.whenLabel(at(26, 10), fri2110)).toBe('Thu 10:00');
    expect(w.whenLabel(at(28, 10), fri2110)).toBe('Sat 28 Nov, 10:00');
  });
  it('says live and ended', () => {
    expect(w.liveLabel(at(20, 23))).toBe('Live · until 23:00');
    expect(w.endedLabel(at(20, 20), fri2110)).toBe('Ended 20:00');
    expect(w.endedLabel(at(18, 23), fri2110)).toBe('Ended Wed');
    expect(w.eventTimeLabel(at(20, 20, 30), at(20, 23), fri2110)).toBe('Live · until 23:00');
    expect(w.eventTimeLabel(at(20, 22), at(21, 0, 30), fri2110)).toBe('Tonight 22:00');
    expect(w.timeRange(at(20, 22), at(21, 0, 30), fri2110)).toBe('Tonight 22:00–00:30');
  });
  it('only counts down under an hour, in brackets', () => {
    expect(w.clockWithCountdown(at(20, 21, 30), fri2110)).toBe('21:30 (in 20 min)');
    expect(w.clockWithCountdown(at(20, 22, 30), fri2110)).toBe('22:30');
    expect(w.countdown(at(20, 21, 0), fri2110)).toBe('');
  });
  it('lists days for the date sheet', () => {
    const days = w.dayOptions(fri2110, 4);
    expect(days.map((d: { label: string }) => d.label)).toEqual(['Today', 'Tomorrow', 'Sun 22', 'Mon 23']);
    expect(days[2].key).toBe('2026-11-22');
    expect(w.dayOptions(fri2110, 3, true).map((d: { label: string }) => d.label)).toEqual(['Today', 'Yesterday', 'Wed 18']);
    expect(w.dayLabelShort(at(28, 9), fri2110)).toBe('Sat 28 Nov');
  });
});

describe('numbers and units (4.9, format.ts)', () => {
  const f = require('../src/lib/format');
  it('says where a distance is from, in whole miles', () => {
    expect(f.distanceText(2)).toBe('2 mi');
    expect(f.distanceText(2.34)).toBe('2 mi');
    expect(f.distanceText(1.2)).toBe('1 mi');
    expect(f.distanceText(0.4)).toBe('under 1 mi');
    expect(f.distanceText(2, 'home')).toBe('2 mi from home');
    expect(f.distanceText(6.2, 'about')).toBe('about 6 mi');
    expect(f.distanceText(14.6)).toBe('15 mi');
  });
  it('gives one distance to a meet from one origin, whether or not its point shows', () => {
    const home = { lat: 52.63, lng: -1.7 };
    const ev = { area: { lat: 52.66, lng: -1.7 } };
    expect(f.distanceOrigin(null, home)).toEqual({ at: home, from: 'home' });
    expect(f.distanceOrigin({ lat: 1, lng: 1 }, home).from).toBe('you');
    expect(f.distanceOrigin(null, { lat: 0, lng: 0 })).toBeNull();
    const o = f.distanceOrigin(null, home);
    expect(f.meetDistance(ev, o)).toBe('2 mi from home');
    expect(f.meetDistance(ev, o, true)).toBe('about 2 mi from home');
    expect(f.meetDistance(ev, f.distanceOrigin(home, home))).toBe('2 mi');
    expect(f.meetDistance(ev, null)).toBeNull();
  });
  it('sums up who is going without class codes', () => {
    expect(f.goingSummary(9, 7, 2)).toBe('9 going · 7 cars, 2 bikes');
    expect(f.goingSummary(4, 4, 0)).toBe('4 going · 4 cars');
    expect(f.goingSummary(1, 0, 1)).toBe('1 going · 1 bike');
    expect(f.goingSummary(0)).toBe('0 going');
  });
});

describe('the app clock', () => {
  const c = require('../src/lib/appClock');
  afterEach(() => c.setClockOffset(0));
  it('is the real clock until shifted', () => {
    expect(Math.abs(c.appNowMs() - Date.now())).toBeLessThan(50);
    c.setClockOffset(3_600_000);
    expect(Math.abs(c.appNow().getTime() - (Date.now() + 3_600_000))).toBeLessThan(50);
  });
  it('can be set to read a given time, and tells listeners', () => {
    const seen: number[] = [];
    const off = c.onClockChange((ms: number) => seen.push(ms));
    const friday = c.weekdayAt(new Date(2026, 10, 18, 9), 5, 21, 10);
    expect(friday.getDay()).toBe(5);
    expect([friday.getHours(), friday.getMinutes()]).toEqual([21, 10]);
    c.setClockTo(friday);
    expect(Math.abs(c.appNowMs() - friday.getTime())).toBeLessThan(50);
    off();
    c.setClockOffset(5);
    expect(seen).toHaveLength(1);
  });
});

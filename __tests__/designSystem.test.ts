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
  it('keeps toasts up longer with an action, capped', () => {
    expect(toastDuration('Saved', false)).toBe(3200);
    expect(toastDuration('Saved', true)).toBe(5200);
    expect(toastDuration('x'.repeat(500), true)).toBe(8000);
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

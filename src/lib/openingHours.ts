/**
 * OpenStreetMap `opening_hours` for the shop screen: the common formats only
 * ("Mo-Fr 08:00-17:30; Sa 09:00-13:00; Su off", "24/7", "Mo-Sa 08:00-12:30,13:30-17:30",
 * past-midnight times, comma-separated rules). Anything else (months, weeks,
 * sunrise, comments) gives null and the app shows the text as it's tagged,
 * without an "open now".
 *
 * Times are the phone's local time (the app is UK only). Bank holidays (PH)
 * can't be known here, so PH rules are kept as a note and never change
 * "open now".
 */

/** Minutes after midnight; an end past 1440 runs into the next morning. */
export type Span = [number, number];

export interface WeekHours {
  /** Monday first: index 0 = Monday … 6 = Sunday. An empty list is closed. */
  days: Span[][];
  /** Open all day, every day. */
  always: boolean;
  /** Bank holiday rule as written ("Bank holidays: closed"), if any. */
  holidays?: string;
}

const DAY_CODES = ['mo', 'tu', 'we', 'th', 'fr', 'sa', 'su'];
export const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

type Tok =
  | { t: 'day'; d: number }
  | { t: 'ph' }
  | { t: 'dash' }
  | { t: 'comma' }
  | { t: 'time'; m: number }
  | { t: 'off' };

function tokenize(raw: string): Tok[] | null {
  const out: Tok[] = [];
  const s = raw.toLowerCase();
  let i = 0;
  while (i < s.length) {
    const rest = s.slice(i);
    let m: RegExpMatchArray | null;
    if (/^[\s:]/.test(rest) && !/^:\d/.test(rest)) {
      i++;
      continue;
    }
    if ((m = rest.match(/^(\d{1,2})[:.](\d{2})/))) {
      const h = Number(m[1]);
      const min = Number(m[2]);
      if (h > 24 || min > 59 || (h === 24 && min > 0)) return null;
      out.push({ t: 'time', m: h * 60 + min });
      i += m[0].length;
      continue;
    }
    if ((m = rest.match(/^(off|closed|close)\b/))) {
      out.push({ t: 'off' });
      i += m[0].length;
      continue;
    }
    if ((m = rest.match(/^ph\b/))) {
      out.push({ t: 'ph' });
      i += m[0].length;
      continue;
    }
    // Mo, Mon, Monday, Tues, Thur…
    if ((m = rest.match(/^(mo|tu|we|th|fr|sa|su)[a-z]*/))) {
      const word = m[0];
      const ok = /^(mo|mon|monday|tu|tue|tues|tuesday|we|wed|weds|wednesday|th|thu|thur|thurs|thursday|fr|fri|friday|sa|sat|saturday|su|sun|sunday)$/.test(word);
      if (!ok) return null;
      out.push({ t: 'day', d: DAY_CODES.indexOf(m[1]) });
      i += word.length;
      continue;
    }
    if (rest[0] === '-' || rest[0] === '–' || rest[0] === '—') {
      out.push({ t: 'dash' });
      i++;
      continue;
    }
    if (rest[0] === ',') {
      out.push({ t: 'comma' });
      i++;
      continue;
    }
    return null;
  }
  return out;
}

interface Rule {
  days: number[] | null; // null: every day
  ph: boolean;
  spans: Span[] | 'off';
}

/** One `;`-separated part: day selectors then times, possibly several pairs joined by commas. */
function parsePart(toks: Tok[]): Rule[] | null {
  const rules: Rule[] = [];
  let i = 0;
  while (i < toks.length) {
    // Days (optional).
    let days: number[] | null = null;
    let ph = false;
    while (i < toks.length && (toks[i].t === 'day' || toks[i].t === 'ph')) {
      const tk = toks[i];
      if (tk.t === 'ph') {
        ph = true;
        i++;
      } else if (tk.t === 'day') {
        const from = tk.d;
        if (toks[i + 1]?.t === 'dash' && toks[i + 2]?.t === 'day') {
          const to = (toks[i + 2] as { d: number }).d;
          days = days ?? [];
          for (let d = from; ; d = (d + 1) % 7) {
            days.push(d);
            if (d === to) break;
          }
          i += 3;
        } else {
          days = [...(days ?? []), from];
          i++;
        }
      }
      if (toks[i]?.t === 'comma' && (toks[i + 1]?.t === 'day' || toks[i + 1]?.t === 'ph')) i++;
    }
    // Times or off.
    if (toks[i]?.t === 'off') {
      rules.push({ days, ph, spans: 'off' });
      i++;
    } else {
      const spans: Span[] = [];
      while (toks[i]?.t === 'time' && toks[i + 1]?.t === 'dash' && toks[i + 2]?.t === 'time') {
        const a = (toks[i] as { m: number }).m;
        let b = (toks[i + 2] as { m: number }).m;
        if (b <= a) b += 1440; // past midnight
        spans.push([a, b]);
        i += 3;
        if (toks[i]?.t === 'comma' && toks[i + 1]?.t === 'time') i++;
      }
      if (!spans.length) return null;
      rules.push({ days, ph, spans });
    }
    // A comma between rules ("Mo-Fr 08:00-17:00, Sa 09:00-12:00").
    if (toks[i]?.t === 'comma') i++;
    if (days === null && !ph && rules.length > 1) return null;
  }
  return rules;
}

/** Parse the common formats; null when it isn't one we can read. */
export function parseOpeningHours(raw: string | undefined): WeekHours | null {
  if (!raw) return null;
  const text = raw.trim();
  if (!text) return null;
  if (/^24\s*\/\s*7$/.test(text) || /^mo-su 00:00-24:00$/i.test(text)) return { days: Array.from({ length: 7 }, () => [[0, 1440]]), always: true };
  const days: Span[][] = Array.from({ length: 7 }, () => []);
  let holidays: string | undefined;
  let any = false;
  for (const part of text.split(';')) {
    if (!part.trim()) continue;
    const toks = tokenize(part);
    if (!toks || !toks.length) return null;
    const rules = parsePart(toks);
    if (!rules) return null;
    for (const r of rules) {
      if (r.ph && !r.days) {
        holidays = r.spans === 'off' ? 'Bank holidays: closed' : `Bank holidays: ${r.spans.map(spanText).join(', ')}`;
        continue;
      }
      if (r.ph) holidays = r.spans === 'off' ? 'Bank holidays: closed' : `Bank holidays: ${r.spans.map(spanText).join(', ')}`;
      // Later rules replace earlier ones for the same days, as in OSM.
      for (const d of r.days ?? [0, 1, 2, 3, 4, 5, 6]) days[d] = r.spans === 'off' ? [] : r.spans.map((s) => [s[0], s[1]] as Span);
      any = true;
    }
  }
  if (!any) return null;
  for (const d of days) d.sort((a, b) => a[0] - b[0]);
  const always = days.every((d) => d.length === 1 && d[0][0] === 0 && d[0][1] >= 1440);
  return { days, always, ...(holidays ? { holidays } : {}) };
}

function hhmm(min: number): string {
  const m = ((min % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

function spanText(s: Span): string {
  if (s[0] === 0 && s[1] >= 1440) return 'Open 24 hours';
  return `${hhmm(s[0])}–${s[1] === 1440 ? '24:00' : hhmm(s[1])}`;
}

/**
 * The week as lines, joining days with the same hours:
 * ["Mon–Fri  08:00–17:30", "Sat  09:00–13:00", "Sun  Closed"].
 */
export function formatOpeningHours(w: WeekHours): { days: string; hours: string }[] {
  if (w.always) return [{ days: 'Every day', hours: 'Open 24 hours' }];
  const text = w.days.map((d) => (d.length ? d.map(spanText).join(', ') : 'Closed'));
  const out: { days: string; hours: string }[] = [];
  let start = 0;
  for (let i = 1; i <= 7; i++) {
    if (i < 7 && text[i] === text[start]) continue;
    const label = i - 1 === start ? DAY_NAMES[start] : i - 1 === start + 1 ? `${DAY_NAMES[start]}, ${DAY_NAMES[i - 1]}` : `${DAY_NAMES[start]}–${DAY_NAMES[i - 1]}`;
    out.push({ days: start === 0 && i === 7 ? 'Every day' : label, hours: text[start] });
    start = i;
  }
  if (w.holidays) out.push({ days: 'Bank hols', hours: w.holidays.replace('Bank holidays: ', '').replace(/^closed$/, 'Closed') });
  return out;
}

/** Monday = 0. */
function weekday(d: Date): number {
  return (d.getDay() + 6) % 7;
}

export interface OpenState {
  open: boolean;
  /** "Open now · closes 17:30", "Closed · opens 08:00", "Closed · opens Mon 08:00", "Open 24 hours". */
  label: string;
}

/** Open now? With when it next closes or opens. Bank holidays are ignored (they can't be known here). */
export function openState(w: WeekHours, now: Date): OpenState {
  if (w.always) return { open: true, label: 'Open 24 hours' };
  const today = weekday(now);
  const min = now.getHours() * 60 + now.getMinutes();
  // Today's spans, and yesterday's that run past midnight.
  const yesterday = (today + 6) % 7;
  for (const [, b] of w.days[yesterday]) {
    if (b > 1440 && min < b - 1440) return { open: true, label: `Open now · closes ${hhmm(b)}` };
  }
  for (const [a, b] of w.days[today]) {
    if (min >= a && min < b) return { open: true, label: b === 1440 ? 'Open now · until midnight' : `Open now · closes ${hhmm(b)}` };
  }
  // Next opening: later today, then the coming days.
  for (let k = 0; k < 7; k++) {
    const d = (today + k) % 7;
    const next = w.days[d].find(([a]) => k > 0 || a > min);
    if (next) {
      const when = k === 0 ? '' : k === 1 ? 'tomorrow ' : `${DAY_NAMES[d]} `;
      return { open: false, label: `Closed · opens ${when}${hhmm(next[0])}` };
    }
  }
  return { open: false, label: 'Closed' };
}

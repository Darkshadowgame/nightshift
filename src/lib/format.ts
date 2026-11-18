const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function hhmm(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** "Tonight 22:30", "Tomorrow 06:00", "Sat 23:00", "Sat 14 Dec 09:00". */
export function formatWhen(iso: string, now: Date): string {
  const d = new Date(iso);
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  if (d.getTime() < now.getTime() && now.getTime() - d.getTime() < 86_400_000) return `Started ${hhmm(d)}`;
  if (sameDay(d, now)) return `${d.getHours() >= 17 || d.getHours() < 5 ? 'Tonight' : 'Today'} ${hhmm(d)}`;
  if (sameDay(d, tomorrow)) return `Tomorrow ${hhmm(d)}`;
  const days = (d.getTime() - now.getTime()) / 86_400_000;
  if (days > 0 && days < 6.5) return `${DAYS[d.getDay()]} ${hhmm(d)}`;
  return `${DAYS[d.getDay()]} ${d.getDate()} ${d.toLocaleString('en-GB', { month: 'short' })} ${hhmm(d)}`;
}

/** "in 25 min", "in 3 h", "12 min ago". */
export function formatRelative(iso: string, now: Date): string {
  const diff = new Date(iso).getTime() - now.getTime();
  const mins = Math.round(Math.abs(diff) / 60_000);
  const text = mins < 60 ? `${mins} min` : mins < 48 * 60 ? `${Math.round(mins / 60)} h` : `${Math.round(mins / 1440)} days`;
  return diff >= 0 ? `in ${text}` : `${text} ago`;
}

export function formatTime(iso: string): string {
  return hhmm(new Date(iso));
}

/** "1 build", "2 builds", "0 trophies" (pass the plural when it isn't just +s). */
export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n.toLocaleString('en-GB')} ${n === 1 ? one : many}`;
}

/** Short age for feeds and lists: "now", "12m", "3h", "2d", then "14 Nov". */
export function shortAgo(iso: string, now: Date): string {
  const mins = Math.max(0, Math.round((now.getTime() - new Date(iso).getTime()) / 60_000));
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  if (mins < 24 * 60) return `${Math.round(mins / 60)}h`;
  if (mins < 7 * 24 * 60) return `${Math.round(mins / 1440)}d`;
  const d = new Date(iso);
  return `${d.getDate()} ${d.toLocaleString('en-GB', { month: 'short' })}`;
}

/**
 * The toast after hosting: "Invites sent to 12 people", "… to 1 person", "… to fewer than 3 people"
 * (signed in, small counts stay vague); a public event is just "Published".
 */
export function sentToast(invited: string, isPublic: boolean): string {
  if (isPublic) return 'Published';
  if (invited === '1') return 'Invites sent to 1 person';
  if (/^\d+$/.test(invited) || invited === 'fewer than 3') return `Invites sent to ${invited} people`;
  return 'Invites sent';
}

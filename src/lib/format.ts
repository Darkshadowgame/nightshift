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

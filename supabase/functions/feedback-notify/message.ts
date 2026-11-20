// Builds the feedback email (pure: no Deno APIs, tested with Jest in
// __tests__/feedbackNotify.test.ts).

export interface FeedbackRow {
  id: string;
  created_at: string;
  user_id: string | null;
  kind: string;
  message: string;
  screen: string | null;
  app_version: string | null;
  update_id: string | null;
  device: string | null;
  photo_path: string | null;
  photo_paths: string[] | null;
  context: Record<string, unknown> | null;
  lat: number | null;
  lng: number | null;
}

export const KIND_LABELS: Record<string, string> = {
  bug: 'Bug',
  idea: 'Idea',
  looks_wrong: 'Something wrong with a place or event',
  other: 'Other',
};

/** Every screenshot path on the row: the old single one, then the list. */
export function screenshotPaths(row: Pick<FeedbackRow, 'photo_path' | 'photo_paths'>): string[] {
  const all = [...(row.photo_path ? [row.photo_path] : []), ...(row.photo_paths ?? [])];
  return Array.from(new Set(all.filter(Boolean)));
}

/** A test report (the smoke test sets context.test): stored, never emailed. */
export function isTestReport(row: Pick<FeedbackRow, 'context'>): boolean {
  return row.context?.test === true;
}

function oneLine(s: string, max: number): string {
  const flat = s.replace(/\s+/g, ' ').trim();
  return flat.length > max ? `${flat.slice(0, max - 1)}…` : flat;
}

function str(v: unknown): string | null {
  return typeof v === 'string' && v.trim() ? v.trim() : typeof v === 'number' || typeof v === 'boolean' ? String(v) : null;
}

export function feedbackEmail(row: FeedbackRow, links: string[]): { subject: string; text: string } {
  const kind = KIND_LABELS[row.kind] ?? row.kind;
  const ctx = row.context ?? {};
  const subject = `[Slipstream feedback] ${kind}: ${oneLine(row.message, 70)}`;
  const facts: [string, string | null][] = [
    ['Type', kind],
    ['Sent', row.created_at],
    ['Signed in', row.user_id ? `yes (user ${row.user_id.slice(0, 8)})` : 'no'],
    ['App version', row.app_version],
    ['Runtime', str(ctx.runtime)],
    ['Update', row.update_id],
    ['Channel', str(ctx.channel)],
    ['Device', str(ctx.model) ?? row.device],
    ['OS', str(ctx.os) ?? (str(ctx.model) ? row.device : null)],
    ['Screen', str(ctx.route) ?? row.screen],
    ['Backend', str(ctx.backend)],
    ['Location', row.lat != null && row.lng != null ? `${row.lat.toFixed(5)}, ${row.lng.toFixed(5)} (https://www.openstreetmap.org/?mlat=${row.lat}&mlon=${row.lng}#map=17/${row.lat}/${row.lng})` : null],
  ];
  const lines = [
    row.message.trim(),
    '',
    '----',
    ...facts.filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`),
    `Id: ${row.id}`,
  ];
  if (links.length) {
    lines.push('', `Screenshots (links work for 7 days):`, ...links.map((l, i) => `${i + 1}. ${l}`));
  }
  lines.push(
    '',
    'Triage: node scripts/feedback-inbox.mjs (docs/FEEDBACK.md).',
    `Mark it: node scripts/feedback-inbox.mjs --mark ${row.id.slice(0, 8)} seen|planned|fixed --version v1.0.NN --note "..."`,
  );
  return { subject, text: lines.join('\n') };
}

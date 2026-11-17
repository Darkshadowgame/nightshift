#!/usr/bin/env node
/**
 * The feedback inbox, for whoever works through feedback (docs/FEEDBACK.md).
 *
 *   node scripts/feedback-inbox.mjs                 open feedback (new and seen), oldest first
 *   node scripts/feedback-inbox.mjs --all           everything from the last 60 days
 *   node scripts/feedback-inbox.mjs --status planned
 *   node scripts/feedback-inbox.mjs --show <id>     one report in full
 *   node scripts/feedback-inbox.mjs --mark <id> seen|planned|fixed|wont_do|new [--version v1.0.NN] [--note "..."]
 *   node scripts/feedback-inbox.mjs --notify <id>   (re)send its email through feedback-notify (under a day old)
 *   node scripts/feedback-inbox.mjs --delete <id>   test or spam rows only, and only when the owner says so
 *
 * <id> can be the first 8 characters. `fixed` is stored as status `done` and
 * needs --version (the OTA or build that has the fix: testers see "Fixed in
 * v1.0.NN"). --note goes in triage_notes, which senders never see.
 *
 * Reads ~/.config/homelab-secrets.env itself (SUPABASE_ACCESS_TOKEN,
 * SUPABASE_PROJECT_REF, SUPABASE_URL) and never prints a key, token or
 * password. Reads and updates go through the Management API's SQL endpoint;
 * screenshots are downloaded with the project's secret key, fetched into
 * memory from the Management API for this run only.
 *
 * Feedback text is private: it's only printed to the terminal and saved under
 * ~/nightshift-feedback/<id>/ (report.json and the screenshots), never in the
 * repo. NIGHTSHIFT_FEEDBACK_DIR changes the folder; it must be outside the repo.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(process.env.NIGHTSHIFT_FEEDBACK_DIR || join(homedir(), 'nightshift-feedback'));
if (!relative(REPO, OUT).startsWith('..')) {
  console.error(`Refusing to save feedback inside the repo (${OUT}). Feedback text never goes in the public repo.`);
  process.exit(2);
}

function loadSecrets() {
  const file = join(homedir(), '.config', 'homelab-secrets.env');
  const out = {};
  let text = '';
  try {
    text = readFileSync(file, 'utf8');
  } catch {
    console.error(`Can't read ${file}.`);
    process.exit(2);
  }
  for (const raw of text.split('\n')) {
    const line = raw.trim().replace(/^export\s+/, '');
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    out[m[1]] = v;
  }
  return out;
}

const env = { ...loadSecrets(), ...Object.fromEntries(Object.entries(process.env).filter(([k]) => k.startsWith('SUPABASE_'))) };
const REF = env.SUPABASE_PROJECT_REF || 'vuftzeianmqjboivqmws';
const URL_BASE = env.SUPABASE_URL || `https://${REF}.supabase.co`;
const TOKEN = env.SUPABASE_ACCESS_TOKEN;
if (!TOKEN) {
  console.error('SUPABASE_ACCESS_TOKEN is missing from ~/.config/homelab-secrets.env.');
  process.exit(2);
}

const lit = (s) => (s == null ? 'null' : `'${String(s).replace(/'/g, "''")}'`);

async function sql(query) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  const body = await res.text();
  if (res.status === 401) throw new Error('The Management API refused the token (401). SUPABASE_ACCESS_TOKEN may have expired: make a new one.');
  if (!res.ok) throw new Error(`SQL failed (${res.status}): ${body.slice(0, 300)}`);
  return JSON.parse(body);
}

let serviceKey = null;
async function storageKey() {
  if (serviceKey) return serviceKey;
  const res = await fetch(`https://api.supabase.com/v1/projects/${REF}/api-keys?reveal=true`, { headers: { Authorization: `Bearer ${TOKEN}` } });
  if (!res.ok) throw new Error(`Couldn't get the project's secret key (${res.status}).`);
  const keys = await res.json();
  const pick = keys.find((k) => k.type === 'legacy' && k.name === 'service_role') ?? keys.find((k) => k.type === 'secret');
  if (!pick?.api_key) throw new Error('No secret key on the project.');
  serviceKey = pick.api_key;
  return serviceKey;
}

async function download(path, dir) {
  const key = await storageKey();
  const headers = { apikey: key };
  if (key.startsWith('eyJ')) headers.Authorization = `Bearer ${key}`;
  const res = await fetch(`${URL_BASE}/storage/v1/object/feedback/${path.split('/').map(encodeURIComponent).join('/')}`, { headers });
  if (!res.ok) return { path, error: `HTTP ${res.status}` };
  const name = path.split('/').pop() || 'screenshot.jpg';
  const file = join(dir, name);
  writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  return { path, file };
}

const COLS = `id, created_at, user_id is not null as signed_in, kind, message, screen, app_version, update_id, device,
  photo_path, photo_paths, context, lat, lng, status, fixed_in, triage_notes, handled_at, notified_at`;
const KIND = { bug: 'Bug', idea: 'Idea', looks_wrong: 'Place/event wrong', other: 'Other' };
const STATUS_IN = { new: 'new', seen: 'seen', planned: 'planned', fixed: 'done', done: 'done', wont_do: 'wont_do', wontfix: 'wont_do' };

async function findOne(idOrPrefix) {
  if (!/^[0-9a-f-]{8,36}$/i.test(idOrPrefix)) throw new Error('Give the feedback id (or its first 8 characters).');
  const rows = await sql(`select ${COLS} from public.feedback where id::text like ${lit(idOrPrefix.toLowerCase() + '%')} limit 2`);
  if (rows.length === 0) throw new Error(`No feedback ${idOrPrefix}.`);
  if (rows.length > 1) throw new Error(`${idOrPrefix} matches more than one report: give more of the id.`);
  return rows[0];
}

function paths(r) {
  return [...new Set([...(r.photo_path ? [r.photo_path] : []), ...(r.photo_paths ?? [])])];
}

async function save(r) {
  const dir = join(OUT, r.id);
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  writeFileSync(join(dir, 'report.json'), JSON.stringify(r, null, 2));
  const shots = [];
  for (const p of paths(r)) shots.push(await download(p, dir).catch((e) => ({ path: p, error: e.message })));
  return { dir, shots };
}

function print(r, saved, full = false) {
  const c = r.context ?? {};
  const head = [
    r.id,
    new Date(r.created_at).toISOString().slice(0, 16).replace('T', ' '),
    KIND[r.kind] ?? r.kind,
    r.status === 'done' && r.fixed_in ? `fixed in ${r.fixed_in}` : r.status,
  ].join('  ·  ');
  console.log(`\n${head}`);
  const facts = [
    ['version', [r.app_version, c.runtime ? `runtime ${c.runtime}` : null, c.channel].filter(Boolean).join(', ')],
    ['screen', c.route ?? r.screen],
    ['device', [c.model, c.os ?? r.device].filter(Boolean).join(', ')],
    ['backend', `${c.backend ?? '?'}${c.backend?.startsWith('signed') ? '' : r.signed_in ? ', signed in' : ', signed out'}`],
    ['location', r.lat != null ? `${r.lat}, ${r.lng}` : null],
    ['update', full ? r.update_id : null],
    ['notes', r.triage_notes],
    ['emailed', full ? r.notified_at ?? 'no' : null],
  ];
  for (const [k, v] of facts) if (v) console.log(`  ${k.padEnd(9)} ${v}`);
  const msg = full ? r.message : r.message.length > 600 ? `${r.message.slice(0, 600)}… (--show for all)` : r.message;
  console.log(msg.split('\n').map((l) => `  │ ${l}`).join('\n'));
  if (saved) {
    console.log(`  folder    ${saved.dir}`);
    for (const s of saved.shots) console.log(`  shot      ${s.file ?? `${s.path} (couldn't download: ${s.error})`}`);
  }
}

function arg(name) {
  const i = process.argv.indexOf(name);
  return i === -1 ? undefined : process.argv[i + 1];
}
const has = (name) => process.argv.includes(name);

async function main() {
  if (has('--help') || has('-h')) {
    console.log(readFileSync(fileURLToPath(import.meta.url), 'utf8').split('*/')[0].replace(/^#!.*\n\/\*\*\n?/, '').replace(/^ \* ?/gm, ''));
    return;
  }
  const mark = arg('--mark');
  if (mark) {
    const statusArg = process.argv[process.argv.indexOf('--mark') + 2];
    const status = STATUS_IN[statusArg];
    if (!status) throw new Error('Status: seen, planned, fixed, wont_do or new.');
    const version = arg('--version');
    const note = arg('--note');
    if (status === 'done' && !version) throw new Error('Marking it fixed needs --version (e.g. --version v1.0.12): testers see "Fixed in v1.0.12".');
    if (version && !/^v?\d+(\.\d+){0,3}([-+][\w.]+)?$/.test(version)) throw new Error('Version like v1.0.12.');
    const r = await findOne(mark);
    const sets = [`status = ${lit(status)}`];
    if (version) sets.push(`fixed_in = ${lit(version.startsWith('v') ? version : `v${version}`)}`);
    else if (status !== 'done') sets.push('fixed_in = null');
    if (note) sets.push(`triage_notes = ${lit(note.slice(0, 4000))}`);
    const [u] = await sql(`update public.feedback set ${sets.join(', ')} where id = ${lit(r.id)} returning id, status, fixed_in, handled_at, triage_notes`);
    console.log(`Marked ${u.id}: ${u.status}${u.fixed_in ? ` (fixed in ${u.fixed_in})` : ''}${u.triage_notes ? ` · note: ${u.triage_notes}` : ''}`);
    return;
  }
  const notify = arg('--notify');
  if (notify) {
    const r = await findOne(notify);
    await sql(`update public.feedback set notified_at = null where id = ${lit(r.id)}`);
    const res = await fetch(`${URL_BASE}/functions/v1/feedback-notify`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: r.id }) });
    console.log(`feedback-notify answered ${res.status}: ${(await res.text()).slice(0, 200)}`);
    return;
  }
  const del = arg('--delete');
  if (del) {
    const r = await findOne(del);
    const ps = paths(r);
    if (ps.length) {
      const key = await storageKey();
      const headers = { apikey: key, 'Content-Type': 'application/json' };
      if (key.startsWith('eyJ')) headers.Authorization = `Bearer ${key}`;
      const res = await fetch(`${URL_BASE}/storage/v1/object/feedback`, { method: 'DELETE', headers, body: JSON.stringify({ prefixes: ps }) });
      if (!res.ok) throw new Error(`Couldn't delete the screenshots (${res.status}); the report is kept.`);
    }
    await sql(`delete from public.feedback where id = ${lit(r.id)}`);
    console.log(`Deleted ${r.id} and ${ps.length} screenshot(s).`);
    return;
  }
  const show = arg('--show');
  if (show) {
    const r = await findOne(show);
    print(r, await save(r), true);
    return;
  }

  const status = arg('--status');
  if (status && !STATUS_IN[status]) throw new Error('Status: new, seen, planned, fixed, wont_do.');
  const where = has('--all')
    ? `created_at > now() - interval '60 days'`
    : status
      ? `status = ${lit(STATUS_IN[status])}`
      : `status in ('new', 'seen')`;
  const rows = await sql(`select ${COLS} from public.feedback where ${where} order by created_at limit 200`);
  const counts = await sql(`select status, count(*)::int n from public.feedback group by status order by status`);
  console.log(`Feedback: ${counts.map((c) => `${c.n} ${c.status}`).join(', ') || 'none yet'}. Showing ${rows.length}${has('--all') ? ' (last 60 days)' : status ? ` ${status}` : ' open (new and seen)'}.`);
  for (const r of rows) print(r, await save(r));
  if (rows.length) console.log(`\nSaved to ${OUT}/<id>/. Mark with --mark <id> seen|planned|fixed --version v1.0.NN --note "..."`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : String(e));
  process.exit(1);
});

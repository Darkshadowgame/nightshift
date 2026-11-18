#!/usr/bin/env node
/**
 * End-to-end smoke test against the HOSTED Supabase project, as real signed-in
 * users talking to the same API the app uses (publishable key + JWT): two for
 * everything, and a third for road reports (two confirmations).
 *
 *   set -a; . ~/.config/homelab-secrets.env; set +a
 *   node scripts/supabase-smoke.mjs
 *
 * Needs SUPABASE_URL, SUPABASE_ANON_KEY (publishable) and SUPABASE_ACCESS_TOKEN
 * (Management API). There is no service role key here, so the two throwaway
 * users are made with SQL through the Management API's query endpoint
 * (auth.users + auth.identities, a random password that only lives in this
 * process, emails on the reserved `.invalid` domain so nothing is ever sent),
 * then signed in with that password. Everything they make is removed at the
 * end, also when a step fails: through the app's own "Delete my account" RPC
 * first, then a SQL sweep for anything left over.
 *
 * It never prints a key, token or password.
 */
import { createClient } from '@supabase/supabase-js';
import { randomBytes, randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';

const REF = 'vuftzeianmqjboivqmws';
const { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_ACCESS_TOKEN } = process.env;
if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_ACCESS_TOKEN) {
  console.error('Set SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_ACCESS_TOKEN (source ~/.config/homelab-secrets.env).');
  process.exit(2);
}

const RUN = randomBytes(3).toString('hex');
const DOMAIN = 'nightshift-smoke.invalid';
const results = [];
function check(name, ok, detail = '') {
  results.push({ name, ok: !!ok });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}
const lit = (s) => `'${String(s).replace(/'/g, "''")}'`;

async function sql(query) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${SUPABASE_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`SQL failed (${res.status}): ${body.slice(0, 300)}`);
  return JSON.parse(body);
}

async function makeUser(label) {
  const id = randomUUID();
  const email = `smoke-${RUN}-${label}@${DOMAIN}`;
  const password = randomBytes(18).toString('base64url');
  await sql(`
    insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token,
      email_change_token_new, email_change, email_change_token_current, phone_change, phone_change_token,
      reauthentication_token, is_sso_user, is_anonymous)
    values ('00000000-0000-0000-0000-000000000000', ${lit(id)}, 'authenticated', 'authenticated', ${lit(email)},
      extensions.crypt(${lit(password)}, extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '', '', '', '', '', false, false);
    insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (${lit(id)}, ${lit(id)}, jsonb_build_object('sub', ${lit(id)}, 'email', ${lit(email)}, 'email_verified', true),
      'email', now(), now(), now());`);
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`sign-in for ${label} failed: ${error.message}`);
  return { id, email, client };
}

/**
 * Send feedback (docs/FEEDBACK.md): signed in and signed out with the phone's own
 * id, "Your feedback" by id, and the team's triage seen by the sender. Marked as a
 * test (context.test), so feedback-notify never emails it.
 */
async function feedbackFlow(B) {
  const ctx = { test: true, runtime: 'smoke', route: '/smoke', backend: 'signed-in' };
  const mine = randomUUID();
  const { error: e1 } = await B.client.from('feedback').insert({ id: mine, kind: 'bug', message: `smoke test ${RUN} signed in`, screen: '/smoke', context: ctx });
  check('feedback: signed in sends with its own id and context', !e1, e1?.message);
  const { error: again } = await B.client.from('feedback').insert({ id: mine, kind: 'bug', message: `smoke test ${RUN} again`, screen: '/smoke' });
  check('feedback: a retry with the same id is refused, not duplicated', again?.code === '23505', again?.code);
  const { data: own } = await B.client.from('feedback').select('id,status,fixed_in');
  check('feedback: the sender reads their own', (own ?? []).some((r) => r.id === mine && r.status === 'new'), `${own?.length} rows`);
  const { error: notes } = await B.client.from('feedback').select('triage_notes');
  check("feedback: but not the team's notes", !!notes, notes?.code);
  const { error: setIt } = await B.client.from('feedback').update({ status: 'done' }).eq('id', mine).select('id');
  const [{ status: still }] = await sql(`select status from public.feedback where id = ${lit(mine)}`);
  check("feedback: the sender can't change the status", still === 'new', setIt?.message ?? 'no error, nothing changed');

  const anon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const theirs = randomUUID();
  const { error: e2 } = await anon.from('feedback').insert({ id: theirs, kind: 'other', message: `smoke test ${RUN} signed out`, screen: '/signin', context: { ...ctx, backend: 'signed-out' } });
  check('feedback: signed out sends (kind other)', !e2, e2?.message);
  const { error: e3 } = await anon.from('feedback').select('id');
  check("feedback: signed out can't read the table", !!e3, e3?.code);
  // The team marks it fixed (the inbox script's service path).
  await sql(`update public.feedback set status = 'done', fixed_in = 'v-smoke', triage_notes = 'smoke' where id = ${lit(theirs)}`);
  const { data: st, error: e4 } = await anon.rpc('feedback_status', { p_ids: [theirs, mine] });
  const byId = Object.fromEntries((st ?? []).map((r) => [r.id, r]));
  check('feedback: the phone sees "Fixed in" by id, signed out', !e4 && byId[theirs]?.status === 'done' && byId[theirs]?.fixed_in === 'v-smoke' && byId[mine]?.status === 'new', e4?.message);
  check('feedback_status: no message or notes in it', st?.[0] && !('message' in st[0]) && !('triage_notes' in st[0]));
  const [{ handled }] = await sql(`select handled_at is not null as handled from public.feedback where id = ${lit(theirs)}`);
  check('feedback: handled_at stamped by the status change', handled === true);
}

/** rpc() that throws with the server's sentence. */
async function rpc(user, name, args) {
  const { data, error } = await user.client.rpc(name, args);
  if (error) throw new Error(error.message);
  return data;
}
async function rpcError(user, name, args) {
  const { error } = await user.client.rpc(name, args);
  return error?.message ?? null;
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function until(fn, ms = 10_000) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    if (fn()) return true;
    await wait(200);
  }
  return fn();
}

const made = { eventId: null, spotId: null, crewId: null, photoPath: null, roadIds: [], dmPhoto: null };
let A;
let B;
let C;

async function main() {
  // --- Users -----------------------------------------------------------------
  A = await makeUser('a');
  B = await makeUser('b');
  check('two throwaway users made with SQL and signed in with the publishable key', A.client && B.client);

  // --- Profiles --------------------------------------------------------------
  const pa = await rpc(A, 'save_profile', { p_handle: `smoke_a_${RUN}`, p_name: 'Smoke A', p_region: 'Midlands', p_home_lat: 52.4862, p_home_lng: -1.8904 });
  await rpc(B, 'save_profile', { p_handle: `smoke_b_${RUN}`, p_name: 'Smoke B', p_region: 'Midlands', p_home_lat: 52.4512, p_home_lng: -1.9312 });
  await rpc(A, 'save_travel_prefs', { p_travel_miles: 50, p_new_event_alerts: 'notify' });
  check('save_profile + save_travel_prefs', pa?.onboarded === true);
  const { data: homeA } = await A.client.from('my_home').select('lat,lng');
  check('my_home: A reads only their own home, fuzzed to ~1 km', homeA?.length === 1 && Math.abs(homeA[0].lat - 52.49) < 1e-6, JSON.stringify(homeA?.map((h) => [h.lat, h.lng])));
  const { data: homeB } = await B.client.from('profile_homes').select('user_id');
  check("profile_homes: B can't read A's home", homeB?.length === 1 && homeB[0].user_id === B.id);

  // --- Builds + photo ---------------------------------------------------------
  const { data: buildA, error: eA } = await A.client.from('builds')
    .insert({ kind: 'car', make: 'Volkswagen', model: 'Golf R', year: 2019, stock_bhp: 296, weight_kg: 1450, vehicle_id: 'smoke-test', tune_stage: 'stage1' })
    .select('id').single();
  const { data: buildB, error: eB } = await B.client.from('builds')
    .insert({ kind: 'bike', make: 'Yamaha', model: 'YZF-R6', stock_bhp: 118, weight_kg: 190 })
    .select('id').single();
  if (eA || eB) throw new Error(`build insert: ${(eA ?? eB).message}`);
  const { error: modErr } = await A.client.from('build_mods').insert([{ build_id: buildA.id, category: 'exhaust', name: 'Cat-back', bhp_gain: 10, position: 0 }]);
  check('builds + build_mods insert (vehicle_id, tune_stage)', !modErr, modErr?.message);
  made.photoPath = `${A.id}/builds/${buildA.id}/${randomUUID()}.png`;
  const png = readFileSync(new URL('../assets/favicon.png', import.meta.url));
  const { error: upErr } = await A.client.storage.from('photos').upload(made.photoPath, png, { contentType: 'image/png' });
  const { error: bpErr } = upErr ? { error: upErr } : await A.client.from('build_photos').insert({ build_id: buildA.id, storage_path: made.photoPath, position: 0 });
  check('photo uploaded to photos/{uid}/builds/… and build_photos row added', !upErr && !bpErr, (upErr ?? bpErr)?.message);
  const { error: badUp } = await B.client.storage.from('photos').upload(`${A.id}/builds/x/${randomUUID()}.png`, png, { contentType: 'image/png' });
  check("B can't upload into A's folder", !!badUp);
  const { data: signed } = await B.client.storage.from('photos').createSignedUrl(made.photoPath, 600);
  const signedOk = signed?.signedUrl ? (await fetch(signed.signedUrl)).ok : false;
  check("B reads A's photo through a signed URL", signedOk);

  // --- Host a rolling meet ----------------------------------------------------
  const startsAt = new Date(Date.now() + 2 * 3600_000).toISOString();
  const saved = await rpc(A, 'save_event', {
    p_event: {
      type: 'rolling', title: `Smoke test ${RUN}`, starts_at: startsAt, reveal_minutes_before: 60,
      area: { lat: 52.5, lng: -1.9 }, area_radius_miles: 4, area_name: 'Birmingham',
      filter: { everyone: true, cars: true, bikes: true, classes: [], min_mods: 0, brands: [], radius_miles: 25 },
    },
    p_stops: [
      { name: 'Smoke stop one', lat: 52.48, lng: -1.88 },
      { name: 'Smoke stop two', lat: 52.52, lng: -1.92 },
      { name: 'Smoke stop three', lat: 52.5, lng: -1.86 },
    ],
    p_cohost_ids: [],
  });
  made.eventId = saved.id;
  check('save_event: A hosts a rolling meet with 3 stops', !!saved.id);
  const { data: evRow } = await B.client.from('events_list').select('id,title,area_lat,area_lng,area_name').eq('id', made.eventId).single();
  check('events_list: B sees the event row with the rough area as lat/lng', evRow?.area_name === 'Birmingham' && typeof evRow?.area_lat === 'number');
  const { data: rawStops } = await B.client.from('event_stops').select('id').eq('event_id', made.eventId);
  check("event_stops: B can't read stops directly", (rawStops ?? []).length === 0);
  const before = await rpc(B, 'get_event_stops', { p_event_ids: [made.eventId] });
  check('get_event_stops: before going, B gets no stop rows at all', before.length === 0);

  // --- B goes ----------------------------------------------------------------
  const going = await rpc(B, 'set_going', { p_event_id: made.eventId, p_going: true, p_build_id: buildB.id });
  check('set_going with the build B is bringing', going === 'going', going);
  const locked = await rpc(B, 'get_event_stops', { p_event_ids: [made.eventId] });
  check('reveal: going but before the reveal time, every stop is locked (no name or place)',
    locked.length === 3 && locked.every((s) => !s.visible && s.lat === null && s.name === null));
  const hostView = await rpc(A, 'get_event_stops', { p_event_ids: [made.eventId] });
  check('reveal: the host sees every stop', hostView.length === 3 && hostView.every((s) => s.visible && s.lat !== null));
  const { data: goingRows } = await A.client.from('event_going').select('user_id,build_id').eq('event_id', made.eventId);
  check('event_going: the host sees B going with their build', goingRows?.some((g) => g.user_id === B.id && g.build_id === buildB.id));

  // Make it live: move the start into the past (a test fixture; the app never does this).
  await sql(`update public.events set starts_at = now() - interval '10 minutes', ends_at = now() + interval '3 hours' where id = ${lit(made.eventId)}`);
  const live = await rpc(B, 'get_event_stops', { p_event_ids: [made.eventId] });
  check('reveal: live, B sees stop 1 only; stops 2 and 3 stay locked',
    live[0]?.visible && live[0]?.lat !== null && !live[1]?.visible && live[1]?.lat === null && !live[2]?.visible, live.map((s) => s.visible).join(','));

  // --- Check in ----------------------------------------------------------------
  const far = await rpcError(B, 'check_in', { p_event_id: made.eventId, p_position: 0, p_lat: live[0].lat + 0.05, p_lng: live[0].lng });
  check('check_in: refused from 3 mi away with the app\'s sentence', far?.startsWith('You need to be within 0.5 mi of'), far ?? 'no error');
  const ahead = await rpcError(B, 'check_in', { p_event_id: made.eventId, p_position: 1, p_lat: 52.52, p_lng: -1.92 });
  check("check_in: can't check in at a stop B can't see", ahead === "You can't see this stop yet.", ahead ?? 'no error');
  await rpc(B, 'check_in', { p_event_id: made.eventId, p_position: 0, p_lat: live[0].lat + 0.001, p_lng: live[0].lng });
  const { data: myCheckIns } = await B.client.from('check_ins').select('stop_id').eq('event_id', made.eventId);
  check('check_in: B checked in at stop 1 (no position stored)', myCheckIns?.length === 1);

  // --- Realtime + move on ----------------------------------------------------------
  const heard = { event: null, chat: null, notice: null };
  const channel = B.client
    .channel(`event:${made.eventId}`)
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'events', filter: `id=eq.${made.eventId}` }, (p) => (heard.event = p.new))
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `event_id=eq.${made.eventId}` }, (p) => (heard.chat = p.new))
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notices', filter: `user_id=eq.${B.id}` }, (p) => (heard.notice = p.new));
  let status = '';
  channel.subscribe((s) => (status = s));
  await until(() => status === 'SUBSCRIBED', 15_000);
  check('realtime: B subscribed to the event, its chat and their notices', status === 'SUBSCRIBED', status);
  await wait(1500); // let the subscription settle on the server

  const { error: chatErr } = await A.client.from('chat_messages').insert({ event_id: made.eventId, body: 'Smoke test: heading off in 5' });
  check('chat: host posts (insert, no select)', !chatErr, chatErr?.message);
  const notHost = await rpcError(B, 'move_on', { p_event_id: made.eventId });
  check("move_on: refused for someone who isn't a host", notHost === 'Only hosts can move the meet on.', notHost ?? 'no error');
  const audience = await rpc(A, 'move_on', { p_event_id: made.eventId });
  check('move_on: returns the people checked in at the stop being left', Array.isArray(audience) && audience.length === 1 && audience[0] === B.id);
  await until(() => heard.event && heard.chat && heard.notice, 15_000);
  check('realtime: B hears the event move on (current_stop 1)', heard.event?.current_stop === 1);
  check('realtime: B hears the chat line', heard.chat?.body === 'Smoke test: heading off in 5');
  check('realtime: B hears the "moved on" notice, which never names the place',
    heard.notice?.kind === 'moved' && !/Smoke stop/.test(`${heard.notice?.title} ${heard.notice?.body}`), heard.notice?.body);
  await B.client.removeChannel(channel);
  const after = await rpc(B, 'get_event_stops', { p_event_ids: [made.eventId] });
  check('move_on visibility: stop 2 unlocks for B (checked in at stop 1); stop 3 stays locked',
    after[1]?.visible && after[1]?.name === 'Smoke stop two' && !after[2]?.visible, after.map((s) => s.visible).join(','));
  const { data: chatB } = await B.client.from('chat_messages').select('body').eq('event_id', made.eventId);
  check('chat: B (going) reads the chat', chatB?.some((m) => m.body.startsWith('Smoke test')));

  // --- Votes -----------------------------------------------------------------------
  await rpc(A, 'check_in', { p_event_id: made.eventId, p_position: 1, p_lat: 52.52, p_lng: -1.92 });
  const own = await rpcError(B, 'cast_vote', { p_event_id: made.eventId, p_category: 'best-in-show', p_build_id: buildB.id });
  check('cast_vote: not for your own build', own === "You can't vote for your own build.", own ?? 'no error');
  await rpc(B, 'cast_vote', { p_event_id: made.eventId, p_category: 'best-in-show', p_build_id: buildA.id });
  await rpc(A, 'cast_vote', { p_event_id: made.eventId, p_category: 'sound', p_build_id: buildB.id });
  const { data: votesB } = await B.client.from('votes').select('category,build_id');
  check('cast_vote: B voted; votes are secret (B reads only their own)', votesB?.length === 1 && votesB[0].build_id === buildA.id);
  const awards = await rpc(B, 'event_awards', { p_event_id: made.eventId });
  check('event_awards: nothing before voting closes', Array.isArray(awards) && awards.length === 0);

  // --- Search, crews, places, notices, feedback ---------------------------------------
  const hits = await rpc(B, 'search_events', { p_max_miles: 50, p_when: 'any' });
  const hit = hits.find((h) => h.event_id === made.eventId);
  check('search_events: B finds the meet with a distance, and only the stop they may see', hit && typeof hit.miles === 'number' && hit.stop_name === 'Smoke stop two',
    hit ? `${hit.miles} mi, shows ${hit.stop_name}` : 'not found');
  made.crewId = await rpc(A, 'create_crew', { p_name: `Smoke ${RUN}`, p_tag: `S${RUN.slice(0, 3).toUpperCase()}` });
  await rpc(B, 'join_crew', { p_crew_id: made.crewId });
  await rpc(A, 'set_crew_role', { p_crew_id: made.crewId, p_user_id: B.id, p_role: 'host' });
  const { data: members } = await B.client.from('crew_members').select('user_id,role').eq('crew_id', made.crewId);
  check('crews: create, join, make a host', members?.length === 2 && members.some((m) => m.user_id === B.id && m.role === 'host'));
  await rpc(B, 'leave_crew', {});
  const spot = await rpc(A, 'suggest_spot', { p_kind: 'photo', p_name: `Smoke spot ${RUN}`, p_description: '', p_points: [{ lat: 52.47, lng: -1.9 }] });
  made.spotId = spot.id;
  const { data: spotA } = await A.client.from('spots_list').select('id,status,lat').eq('id', spot.id);
  const { data: spotB } = await B.client.from('spots_list').select('id').eq('id', spot.id);
  check('suggest_spot: pending; the author sees it, others don\'t', spotA?.[0]?.status === 'pending' && spotB?.length === 0);

  // Nightshift's own places (spots.bundled_id): A drives the Snake Pass, rates it; B sees the same numbers.
  const { data: bundled } = await B.client.from('spots_list').select('id,kind,bundled_id').not('bundled_id', 'is', null).limit(1000);
  check("bundled places: B reads Nightshift's own drives and photo spots by their stable ids",
    (bundled ?? []).filter((r) => r.kind === 'drive').length >= 100 && (bundled ?? []).filter((r) => r.kind === 'photo').length >= 100,
    `${bundled?.length} rows`);
  const { data: snakeRows } = await A.client.from('spots_list').select('id,path,miles').eq('bundled_id', 'dr-snake-pass');
  const snake = snakeRows?.[0];
  const end = Date.now() - 60_000;
  const step = (30 * 60_000) / ((snake?.path?.length ?? 2) - 1);
  const fixes = (snake?.path ?? []).map((p, i, all) => ({ lat: p.lat, lng: p.lng, t: Math.round(end - (all.length - 1 - i) * step) }));
  const done = snake ? await rpc(A, 'complete_drive', { p_spot_id: snake.id, p_fixes: fixes }) : null;
  check('complete_drive: A finishes a bundled drive (judged on the seeded line)', done?.ok === true, JSON.stringify(done));
  if (snake) await rpc(A, 'rate_spot', { p_spot_id: snake.id, p_stars: 5 });
  const stats = snake ? await rpc(B, 'spot_stats', { p_spot_ids: [snake.id] }) : [];
  check('spot_stats: B sees A\'s drive and rating on the bundled place (not who)',
    stats[0]?.people >= 1 && stats[0]?.rating_count >= 1 && stats[0]?.completed_by_me === false, JSON.stringify(stats));
  const placeRep = await rpc(B, 'place_rep_for', { p_user_ids: [A.id] });
  check('place_rep_for: B sees A\'s drive rep (12.7 mi, medium: 100), the same as A\'s own phone',
    placeRep[0]?.drives === 1 && placeRep[0]?.drives_rep === 100, JSON.stringify(placeRep));
  const { data: noticesB } = await B.client.from('notices').select('id,kind,read_at');
  await rpc(B, 'mark_notices_read', {});
  const { data: readB } = await B.client.from('notices').select('read_at');
  check('notices: B has notices and marks them read', (noticesB ?? []).length > 0 && readB.every((n) => n.read_at), `${noticesB?.length} notices`);
  const { error: fbErr } = await B.client.from('feedback').insert({ kind: 'idea', message: `smoke test ${RUN}`, screen: 'smoke', app_version: 'smoke', device: 'node' });
  check('feedback: insert without select', !fbErr, fbErr?.message);
  await feedbackFlow(B);

  await roadReports();
  await community();
}

// --- Road reports ------------------------------------------------------------------
// Off the M6 near Birmingham. A reports a crash, C a police check; B listens on Realtime.
async function roadReports() {
  C = await makeUser('c');
  const at = { lat: 52.5201, lng: -1.8501 };
  const heard = [];
  const ch = B.client
    .channel(`roads:${RUN}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'road_reports' }, (p) => heard.push(p));
  let status = '';
  ch.subscribe((x) => (status = x));
  await until(() => status === 'SUBSCRIBED', 15_000);
  check('road reports: B listens to road_reports on Realtime', status === 'SUBSCRIBED', status);
  await wait(1500);

  const crash = await rpc(A, 'report_road', { p_kind: 'crash', p_lat: at.lat, p_lng: at.lng, p_heading: 90, p_from_lat: at.lat + 0.001, p_from_lng: at.lng });
  made.roadIds.push(crash.id);
  check('report_road: A reports a crash from where they are', !!crash.id && crash.merged === false);
  const again = await rpcError(A, 'report_road', { p_kind: 'hazard', p_lat: at.lat, p_lng: at.lng, p_from_lat: at.lat, p_from_lng: at.lng });
  check('report_road: one report every 2 minutes', again === "You've just sent a report. Try again in a couple of minutes.", again ?? 'no error');
  const far = await rpcError(C, 'report_road', { p_kind: 'hazard', p_lat: at.lat, p_lng: at.lng, p_from_lat: at.lat + 0.05, p_from_lng: at.lng });
  check('report_road: only within half a mile of where you are', far === 'You can only report within half a mile of where you are.', far ?? 'no error');
  const police = await rpc(C, 'report_road', { p_kind: 'police', p_lat: at.lat + 0.004, p_lng: at.lng, p_from_lat: at.lat + 0.004, p_from_lng: at.lng });
  made.roadIds.push(police.id);

  await until(() => heard.some((p) => p.new?.id === crash.id), 15_000);
  await wait(3000);
  const crashEvent = heard.find((p) => p.new?.id === crash.id);
  check('realtime: B hears the crash report', !!crashEvent, `${heard.length} events`);
  check('realtime: the payload never says who reported it', crashEvent && !('created_by' in crashEvent.new), crashEvent ? Object.keys(crashEvent.new).join(',') : '');
  check('realtime: the police report never goes out on Realtime', !heard.some((p) => p.new?.id === police.id || p.new?.kind === 'police'));
  await B.client.removeChannel(ch);

  const mapB = await rpc(B, 'road_reports_near', { p_lat: at.lat, p_lng: at.lng, p_radius_mi: 5, p_context: 'map' });
  const driveB = await rpc(B, 'road_reports_near', { p_lat: at.lat, p_lng: at.lng, p_radius_mi: 5, p_context: 'driving' });
  check('road_reports_near (map): the crash, never police', mapB.some((r) => r.id === crash.id) && !mapB.some((r) => r.kind === 'police'));
  check('road_reports_near (driving): police included', driveB.some((r) => r.id === police.id && r.kind === 'police'));
  const { data: direct } = await B.client.from('road_reports').select('id,kind').in('id', [crash.id, police.id]);
  check('road_reports table: B reads the crash but not the police report', direct?.length === 1 && direct[0].id === crash.id, JSON.stringify(direct));
  const { error: whoErr } = await B.client.from('road_reports').select('created_by').eq('id', crash.id);
  check("road_reports table: nobody reads who reported it", !!whoErr, whoErr?.message);

  const own = await rpcError(A, 'vote_road_report', { p_report_id: crash.id, p_vote: 'still_there', p_lat: at.lat, p_lng: at.lng });
  check('vote_road_report: not on your own report', own === "You can't confirm your own report.", own ?? 'no error');
  const tooFar = await rpcError(B, 'vote_road_report', { p_report_id: crash.id, p_vote: 'still_there', p_lat: at.lat + 0.05, p_lng: at.lng });
  check('vote_road_report: within a mile of the report', tooFar === 'You need to be within a mile of the report to answer.', tooFar ?? 'no error');
  await rpc(B, 'vote_road_report', { p_report_id: crash.id, p_vote: 'still_there', p_lat: at.lat, p_lng: at.lng });
  const twice = await rpcError(B, 'vote_road_report', { p_report_id: crash.id, p_vote: 'gone', p_lat: at.lat, p_lng: at.lng });
  check('vote_road_report: one answer each', twice === "You've already answered for this one.", twice ?? 'no error');
  const repBefore = await rpc(A, 'road_rep_for', { p_user_ids: [A.id] });
  check('rep: nothing for the reporter after one confirmation', repBefore[0]?.rep === 0, JSON.stringify(repBefore));
  const second = await rpc(C, 'vote_road_report', { p_report_id: crash.id, p_vote: 'still_there', p_lat: at.lat, p_lng: at.lng });
  check('vote_road_report: a second driver confirms', second.confirm_count === 2 && second.status === 'active');
  const repAfter = await rpc(B, 'road_rep_for', { p_user_ids: [A.id, B.id, C.id] });
  const byUser = Object.fromEntries(repAfter.map((r) => [r.user_id, r]));
  check('rep: +10 to the reporter once two others confirm, +2 to each who answered',
    byUser[A.id]?.reported_rep === 10 && byUser[A.id]?.reports_confirmed === 1 && byUser[B.id]?.checked_rep === 2 && byUser[C.id]?.checked_rep === 2,
    JSON.stringify(repAfter.map((r) => [r.reports_confirmed, r.reported_rep, r.reports_checked, r.checked_rep])));

  const closures = await rpc(B, 'road_closures_near', { p_lat: 51.5074, p_lng: -0.1278, p_radius_mi: 15 });
  check('road_closures_near: answers (open-data closures in London)', Array.isArray(closures), `${closures.length} in force`);
  const anon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error: anonErr } = await anon.rpc('road_reports_near', { p_lat: at.lat, p_lng: at.lng, p_radius_mi: 5, p_context: 'driving' });
  check('road_reports_near: refused signed out', !!anonErr, anonErr?.message);
}

// --- Community: Cars near you, connections, messages, forum, feed, blocks ----------------
// A and B live in Birmingham; C (set up here) in London. Nothing here is real.
async function community() {
  await rpc(C, 'save_profile', { p_handle: `smoke_c_${RUN}`, p_name: 'Smoke C', p_region: 'London', p_home_lat: 51.5074, p_home_lng: -0.1278 });

  const near = await rpc(B, 'people_near', { p_max_miles: 50 });
  const a = near.find((r) => r.user_id === A.id);
  check('people_near: B sees A with a rough distance and nothing else', a && typeof a.miles === 'number' && Object.keys(a).sort().join(',') === 'miles,user_id', JSON.stringify(a));
  check('people_near: C (London) is not near B', !near.some((r) => r.user_id === C.id));

  // B listens for connection requests and messages.
  const heard = { conn: [], msg: [] };
  const ch = B.client
    .channel(`community:${RUN}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'connections' }, (p) => heard.conn.push(p))
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (p) => heard.msg.push(p));
  let status = '';
  ch.subscribe((x) => (status = x));
  await until(() => status === 'SUBSCRIBED', 15_000);
  check('community: B listens to connections and messages on Realtime', status === 'SUBSCRIBED', status);
  await wait(1500);

  check('request_connection: A asks B', (await rpc(A, 'request_connection', { p_user: B.id })) === 'requested');
  await until(() => heard.conn.length > 0);
  check('realtime: B hears the connection request', heard.conn.length > 0);
  const mine = await rpc(B, 'my_connections', {});
  check('my_connections: B sees the request as incoming', mine.some((r) => r.user_id === A.id && r.state === 'incoming'));
  const early = await rpcError(A, 'start_direct', { p_user: B.id });
  check('start_direct: refused before the request is accepted', early === "You can only message people you're connected with.", early ?? 'no error');
  await rpc(B, 'answer_connection', { p_user: A.id, p_accept: true });
  const conv = await rpc(A, 'start_direct', { p_user: B.id });
  check('start_direct: A opens a chat once B accepts', typeof conv === 'string');

  const sent = await rpc(A, 'send_message', { p_conversation_id: conv, p_body: `smoke message ${RUN}` });
  await until(() => heard.msg.some((p) => p.new?.conversation_id === conv));
  check('realtime: B hears the message', heard.msg.some((p) => p.new?.body === `smoke message ${RUN}`));
  const list = await rpc(B, 'my_conversations', {});
  check('my_conversations: one unread for B', list.find((c) => c.id === conv)?.unread === 1, JSON.stringify(list.map((c) => c.unread)));
  await rpc(B, 'mark_conversation_read', { p_conversation_id: conv });
  const { data: seen } = await A.client.from('conversation_members').select('user_id,last_read_at').eq('conversation_id', conv);
  check('Seen: A reads that B has read it', seen?.some((m) => m.user_id === B.id && new Date(m.last_read_at) >= new Date(sent[0].created_at)));
  const { data: cMsgs } = await C.client.from('messages').select('id').eq('conversation_id', conv);
  check("messages: C can't read A and B's chat", (cMsgs ?? []).length === 0);
  const cSend = await rpcError(C, 'send_message', { p_conversation_id: conv, p_body: 'hi' });
  check("send_message: C can't write in it", !!cSend, cSend ?? 'no error');

  made.dmPhoto = `${A.id}/${conv}/${RUN}.jpg`;
  const jpeg = Buffer.from('/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q==', 'base64');
  const { error: upErr } = await A.client.storage.from('messages').upload(made.dmPhoto, jpeg, { contentType: 'image/jpeg' });
  await rpc(A, 'send_message', { p_conversation_id: conv, p_body: '', p_photo_path: made.dmPhoto });
  const { data: bUrl } = await B.client.storage.from('messages').createSignedUrl(made.dmPhoto, 60);
  const { data: cUrl } = await C.client.storage.from('messages').createSignedUrl(made.dmPhoto, 60);
  check('message photos: A uploads, B can open it, C cannot', !upErr && !!bUrl?.signedUrl && !cUrl?.signedUrl, upErr?.message ?? '');

  // Forum.
  const thread = await rpc(A, 'create_thread', { p_board: 'advice', p_region: null, p_title: `Smoke thread ${RUN}`, p_body: 'Which tyres?', p_photos: [], p_build_id: null });
  const police = await rpcError(A, 'create_thread', { p_board: 'meets', p_region: null, p_title: 'Heads up', p_body: 'Police spotted on the ring road', p_photos: [], p_build_id: null });
  check('forum: no police spotting', police === "Posts about where police or speed checks are aren't allowed on Nightshift.", police ?? 'no error');
  const reply = await rpc(B, 'reply_thread', { p_thread_id: thread, p_body: 'All-seasons', p_photos: [], p_build_id: null });
  await rpc(A, 'mark_solved', { p_thread_id: thread, p_reply_id: reply });
  const frep = await rpc(C, 'forum_rep_for', { p_user_ids: [B.id] });
  check('forum: a reply marked Solved earns +25 rep', frep[0]?.rep === 25 && frep[0]?.solved === 1, JSON.stringify(frep));
  const { data: threadC } = await C.client.from('forum_threads').select('reply_count,solved_reply_id').eq('id', thread).single();
  check('forum: C reads the thread with its reply count and answer', threadC?.reply_count === 1 && threadC?.solved_reply_id === reply);

  // Feed posts.
  const nearHome = await rpcError(A, 'create_post', { p_body: 'From home', p_photos: [], p_lat: 52.487, p_lng: -1.891, p_place_name: null, p_visibility: 'public', p_build_id: null });
  check('create_post: never near your home area', nearHome?.startsWith("That's within about 1 km of your home area"), nearHome ?? 'no error');
  const post = await rpc(A, 'create_post', { p_body: `smoke post ${RUN}`, p_photos: [], p_lat: 52.52, p_lng: -1.85, p_place_name: 'Smoke car park', p_visibility: 'public', p_build_id: null });
  const friends = await rpc(A, 'create_post', { p_body: `smoke friends ${RUN}`, p_photos: [], p_lat: null, p_lng: null, p_place_name: null, p_visibility: 'connections', p_build_id: null });
  const localB = await rpc(B, 'feed_posts', { p_scope: 'local' });
  check('feed_posts: A\'s public post is local to B, with its place', localB.some((p) => p.id === post && Math.abs(p.lat - 52.52) < 1e-6));
  const connB = await rpc(B, 'feed_posts', { p_scope: 'connections' });
  check('feed_posts: B (connected) sees the connections-only post', connB.some((p) => p.id === friends));
  const { data: cPosts } = await C.client.from('posts').select('id').in('id', [post, friends]);
  check('posts: C sees the public post but not the connections-only one', cPosts?.length === 1 && cPosts[0].id === post);
  const box = await rpc(B, 'posts_in_box', { p_south: 52.4, p_west: -2.0, p_north: 52.6, p_east: -1.7 });
  check('posts_in_box: the post is on B\'s map', box.some((p) => p.id === post));
  await rpc(B, 'like_post', { p_post_id: post, p_on: true });
  await rpc(B, 'comment_post', { p_post_id: post, p_body: 'Nice spot' });
  const { data: counted } = await C.client.from('posts').select('like_count,comment_count').eq('id', post).single();
  check('like_post and comment_post: counted', counted?.like_count === 1 && counted?.comment_count === 1, JSON.stringify(counted));

  // Report and block.
  await rpc(B, 'report_content', { p_target: 'message', p_target_id: sent[0].id, p_reason: 'harassment', p_note: 'smoke test' });
  const { data: reports } = await B.client.from('reports').select('id');
  check("reports: B can send one but can't read reports", (reports ?? []).length === 0);
  await rpc(A, 'block_user', { p_user: B.id });
  const blocked = await rpcError(B, 'send_message', { p_conversation_id: conv, p_body: 'still there?' });
  check('block_user: B can no longer message A', blocked === "You can only message people you're connected with.", blocked ?? 'no error');
  const after = await rpc(B, 'my_connections', {});
  check('block_user: the connection is gone', !after.some((r) => r.user_id === A.id));
  const { data: hiddenFromA } = await A.client.from('forum_replies').select('id').eq('id', reply);
  check("block_user: B's replies are hidden from A", (hiddenFromA ?? []).length === 0);
  // Blocks reach event chat: B blocks A, so A's chat lines on the smoke meet are hidden from B.
  await rpc(B, 'block_user', { p_user: A.id });
  const { data: chatAfter } = await B.client.from('chat_messages').select('user_id').eq('event_id', made.eventId);
  check("block_user: A's event chat lines are hidden from B", !(chatAfter ?? []).some((m) => m.user_id === A.id), `${chatAfter?.length} lines`);
  const chatReport = await rpcError(C, 'report_content', { p_target: 'event', p_target_id: made.eventId, p_reason: 'spam', p_note: 'smoke test' });
  check('report_content: events can be reported', !chatReport, chatReport ?? '');

  // A suspension (set with SQL, as staff would through moderate_report) stops posting, not reading.
  await sql(`insert into public.suspensions (user_id, reason) values (${lit(C.id)}, 'smoke test')`);
  const suspended = await rpcError(C, 'create_thread', { p_board: 'cars', p_region: null, p_title: `Smoke thread ${RUN} 2`, p_body: '', p_photos: [], p_build_id: null });
  const modStatus = (await rpc(C, 'my_moderation_status', {}))[0];
  check('suspension: C can no longer post, and the app can tell', suspended?.startsWith('Your account is suspended') && modStatus?.suspended === true, suspended ?? 'no error');
  await sql(`delete from public.suspensions where user_id = ${lit(C.id)}`);

  // Spam and selling (20261118180000): a third copy is refused and the refusal can be recorded;
  // selling is flagged; a Community ban stops posts but says when it ends; member tools are staff only.
  const spamText = `Smoke spam check ${RUN}: follow my detailing page`;
  await rpc(A, 'create_post', { p_body: spamText, p_photos: [], p_lat: null, p_lng: null, p_place_name: null, p_visibility: 'connections', p_build_id: null });
  await rpc(A, 'comment_post', { p_post_id: post, p_body: spamText.toUpperCase() + '!!' });
  const third = await rpcError(A, 'create_post', { p_body: spamText, p_photos: [], p_lat: null, p_lng: null, p_place_name: null, p_visibility: 'connections', p_build_id: null });
  check('duplicates: a third copy across kinds is refused', third === "You've already posted that. Spamming the same message isn't allowed.", third ?? 'no error');
  const noted = await rpc(A, 'record_blocked_duplicate', { p_kind: 'post', p_place: null, p_text: spamText });
  const fresh = await rpc(A, 'record_blocked_duplicate', { p_kind: 'post', p_place: null, p_text: `Something new ${RUN} nobody has seen` });
  check('record_blocked_duplicate: counted only when it really is one', noted === 'noted' && fresh === 'not_duplicate', `${noted} / ${fresh}`);
  const sale = await rpc(B, 'create_post', { p_body: `Smoke test ${RUN}: coilovers £400 ono`, p_photos: [], p_lat: null, p_lng: null, p_place_name: null, p_visibility: 'connections', p_build_id: null });
  const { data: saleRow } = await B.client.from('posts').select('is_selling').eq('id', sale);
  check('selling: the post is flagged is_selling', saleRow?.[0]?.is_selling === true, JSON.stringify(saleRow));
  await sql(`insert into public.suspensions (user_id, reason, until, scope) values (${lit(C.id)}, 'smoke test', now() + interval '1 hour', 'community')`);
  const banned = await rpcError(C, 'create_post', { p_body: `Smoke ${RUN} banned`, p_photos: [], p_lat: null, p_lng: null, p_place_name: null, p_visibility: 'public', p_build_id: null });
  const banStatus = (await rpc(C, 'my_moderation_status', {}))[0];
  check('community ban: no posts, with the end time', banned?.startsWith("You can't post in Community until") && banStatus?.scope === 'community', banned ?? 'no error');
  await sql(`delete from public.suspensions where user_id = ${lit(C.id)}`);
  const notStaff = await rpcError(B, 'member_overview', { p_user: A.id });
  const noLog = await rpcError(B, 'moderation_log', {});
  check('member moderation: staff only', notStaff === 'Only staff can do that.' && noLog === 'Only admins and the owner can read the audit log.', `${notStaff} / ${noLog}`);

  await B.client.removeChannel(ch);

  const anon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error: anonErr } = await anon.rpc('feed_posts', { p_scope: 'local' });
  check('feed_posts: refused signed out', !!anonErr, anonErr?.message);
}

async function cleanup() {
  console.log('\nCleaning up…');
  try {
    if (A && made.photoPath) await A.client.storage.from('photos').remove([made.photoPath]);
    if (A && made.dmPhoto) await A.client.storage.from('messages').remove([made.dmPhoto]);
    const { data: left } = A ? await A.client.storage.from('photos').list(`${A.id}/builds`) : { data: [] };
    if (A) check("storage: A's photos removed before deleting the account", (left ?? []).length === 0 || left.every((f) => !f.id));
  } catch (e) {
    check('storage cleanup', false, e.message);
  }
  for (const [label, u] of [['A', A], ['B', B], ['C', C]]) {
    if (!u) continue;
    const err = await rpcError(u, 'delete_my_account', {});
    check(`delete_my_account (${label})`, !err, err ?? '');
  }
  // Sweep: the event (cancelled when A left, but still a row), the place, the feedback line, the users.
  await sql(`
    delete from public.events where title like 'Smoke test %' or id = ${lit(made.eventId ?? '00000000-0000-0000-0000-000000000000')};
    delete from public.spots where name like 'Smoke spot %';
    delete from public.crews where name like 'Smoke %';
    delete from public.feedback where message like 'smoke test %';
    delete from public.road_reports where id = any (${lit(`{${made.roadIds.join(',')}}`)}::uuid[]);
    delete from auth.users where email like '%@${DOMAIN}';`);
  const ids = lit(`{${[A?.id, B?.id, C?.id].filter(Boolean).join(',')}}`);
  const [left] = await sql(`select
    (select count(*) from auth.users where email like '%@${DOMAIN}') users,
    (select count(*) from public.spot_completions where user_id = any (${ids}::uuid[]))
      + (select count(*) from public.spot_ratings where user_id = any (${ids}::uuid[])) place_progress,
    (select count(*) from public.events where title like 'Smoke test %') events,
    (select count(*) from public.spots where name like 'Smoke spot %') spots,
    (select count(*) from public.feedback where message like 'smoke test %') feedback,
    (select count(*) from storage.objects where bucket_id = 'photos' and name like ${lit(`${A?.id ?? 'none'}/%`)}) files,
    (select count(*) from public.road_reports where id = any (${lit(`{${made.roadIds.join(',')}}`)}::uuid[])) road_reports,
    (select count(*) from public.road_report_votes where report_id = any (${lit(`{${made.roadIds.join(',')}}`)}::uuid[])) road_votes,
    (select count(*) from public.road_rep where report_id = any (${lit(`{${made.roadIds.join(',')}}`)}::uuid[])) road_rep,
    (select count(*) from storage.objects where bucket_id = 'messages' and name like ${lit(`${A?.id ?? 'none'}/%`)}) message_files,
    (select count(*) from public.conversation_members where user_id = any (${ids}::uuid[])) chat_members,
    (select count(*) from public.connections where requester_id = any (${ids}::uuid[]) or addressee_id = any (${ids}::uuid[])) connections,
    (select count(*) from public.forum_threads where title like 'Smoke thread %') threads,
    (select count(*) from public.posts where body like 'smoke %') posts,
    (select count(*) from public.reports where note = 'smoke test') reports`);
  check('cleanup: no test users, events, places, feedback, files, road reports or community rows left', Object.values(left).every((n) => Number(n) === 0), JSON.stringify(left));
}

try {
  await main();
} catch (e) {
  check('smoke run', false, e.message);
} finally {
  await cleanup().catch((e) => check('cleanup', false, e.message));
  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed.`);
  process.exit(failed.length ? 1 : 0);
}

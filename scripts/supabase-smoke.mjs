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

const made = { eventId: null, spotId: null, crewId: null, photoPath: null, roadIds: [] };
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
  const { data: noticesB } = await B.client.from('notices').select('id,kind,read_at');
  await rpc(B, 'mark_notices_read', {});
  const { data: readB } = await B.client.from('notices').select('read_at');
  check('notices: B has notices and marks them read', (noticesB ?? []).length > 0 && readB.every((n) => n.read_at), `${noticesB?.length} notices`);
  const { error: fbErr } = await B.client.from('feedback').insert({ kind: 'idea', message: `smoke test ${RUN}`, screen: 'smoke', app_version: 'smoke', device: 'node' });
  check('feedback: insert without select', !fbErr, fbErr?.message);

  await roadReports();
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

async function cleanup() {
  console.log('\nCleaning up…');
  try {
    if (A && made.photoPath) await A.client.storage.from('photos').remove([made.photoPath]);
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
  const [left] = await sql(`select
    (select count(*) from auth.users where email like '%@${DOMAIN}') users,
    (select count(*) from public.events where title like 'Smoke test %') events,
    (select count(*) from public.spots where name like 'Smoke spot %') spots,
    (select count(*) from public.feedback where message like 'smoke test %') feedback,
    (select count(*) from storage.objects where bucket_id = 'photos' and name like ${lit(`${A?.id ?? 'none'}/%`)}) files,
    (select count(*) from public.road_reports where id = any (${lit(`{${made.roadIds.join(',')}}`)}::uuid[])) road_reports,
    (select count(*) from public.road_report_votes where report_id = any (${lit(`{${made.roadIds.join(',')}}`)}::uuid[])) road_votes,
    (select count(*) from public.road_rep where report_id = any (${lit(`{${made.roadIds.join(',')}}`)}::uuid[])) road_rep`);
  check('cleanup: no test users, events, places, feedback, files or road reports left', Object.values(left).every((n) => Number(n) === 0), JSON.stringify(left));
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

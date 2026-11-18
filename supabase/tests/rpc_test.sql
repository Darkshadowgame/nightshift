-- The RPCs end to end: profile, crews, events, requests, plan changes, places, storage.
-- Run with `npx supabase test db`. plpgsql bodies are only checked when they
-- run, so every RPC is called at least once here.
--
-- Users: H host, M1 crew member (becomes owner), M2 crew member, J joiner (lives nearby), F far away.

begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(63);

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'h@example.test'),
  ('66666666-6666-6666-6666-666666666666', 'm1@example.test'),
  ('77777777-7777-7777-7777-777777777777', 'm2@example.test'),
  ('88888888-8888-8888-8888-888888888888', 'j@example.test'),
  ('99999999-9999-9999-9999-999999999999', 'f@example.test');

insert into public.profile_homes (user_id, home) values
  ('88888888-8888-8888-8888-888888888888', private.pt(53.21, -0.50)),
  ('99999999-9999-9999-9999-999999999999', private.pt(50.37, -4.14));  -- Plymouth
insert into public.builds (owner_id, kind, make, model, stock_bhp, weight_kg) values
  ('88888888-8888-8888-8888-888888888888', 'car', 'Toyota', 'GR Yaris', 257, 1280),
  ('99999999-9999-9999-9999-999999999999', 'car', 'BMW', 'M2', 453, 1700);

-- ---------------------------------------------------------------------------
-- Profile
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);
set local role authenticated;

select is((select handle from public.save_profile('@Host_One ', 'Host', 'East', 53.2333, -0.5401)), 'host_one',
  'save_profile: handle normalised like normaliseHandle()');
select ok((select onboarded from public.profiles where id = '11111111-1111-1111-1111-111111111111'), 'save_profile: marks onboarded');
select throws_ok($$ select public.save_profile('ab', 'Host', 'East', 53.2, -0.5) $$, 'P0001', 'Handles need at least 3 characters.', 'save_profile: short handle');
select throws_ok($$ select public.save_profile('host_two', 'Host', 'Narnia', 53.2, -0.5) $$, 'P0001', 'Pick your region.', 'save_profile: region');
select throws_ok($$ select public.save_profile('host_two', 'Host', 'East', 40.7, -74.0) $$, 'P0001',
  'Nightshift is UK only for now. Pick a home area in the UK.', 'save_profile: UK only');

-- ---------------------------------------------------------------------------
-- Crews
-- ---------------------------------------------------------------------------
select set_config('t.crew', public.create_crew('Night Owls', 'no-1')::text, true);
select is((select tag from public.crews where id = current_setting('t.crew')::uuid), 'NO1', 'create_crew: tag normalised');
select is((select role::text from public.crew_members where user_id = '11111111-1111-1111-1111-111111111111'), 'owner', 'create_crew: you own it');

select set_config('request.jwt.claims', '{"sub":"66666666-6666-6666-6666-666666666666","role":"authenticated"}', true);
select throws_ok($$ select public.create_crew('Other lot', 'NO1') $$, 'P0001', 'Another crew has that tag.', 'create_crew: unique tag');
select lives_ok(format('select public.join_crew(%L)', current_setting('t.crew')), 'join_crew: M1 joins');
select set_config('request.jwt.claims', '{"sub":"77777777-7777-7777-7777-777777777777","role":"authenticated"}', true);
select lives_ok(format('select public.join_crew(%L)', current_setting('t.crew')), 'join_crew: M2 joins');
select throws_ok(format('select public.set_crew_role(%L, %L, %L)', current_setting('t.crew'), '66666666-6666-6666-6666-666666666666', 'host'),
  'P0001', 'Only the crew owner can pick hosts.', 'set_crew_role: owner only');

select set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);
select lives_ok(format('select public.set_crew_role(%L, %L, %L)', current_setting('t.crew'), '66666666-6666-6666-6666-666666666666', 'host'),
  'set_crew_role: owner makes M1 a host');
select lives_ok('select public.leave_crew()', 'leave_crew: owner leaves');
select is((select role::text from public.crew_members where user_id = '66666666-6666-6666-6666-666666666666'), 'owner',
  'leave_crew: a host takes over from an owner who leaves');

-- ---------------------------------------------------------------------------
-- Events
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"66666666-6666-6666-6666-666666666666","role":"authenticated"}', true);

select set_config('t.event', (public.save_event(
  jsonb_build_object(
    'type', 'rolling', 'title', 'Wolds rolling meet', 'starts_at', now() + interval '2 hours',
    'reveal_minutes_before', 60, 'area', jsonb_build_object('lat', 53.22, 'lng', -0.52), 'area_radius_miles', 9,
    'area_name', 'Lincoln', 'crew_id', current_setting('t.crew'),
    'filter', jsonb_build_object('everyone', false, 'cars', true, 'bikes', true, 'classes', jsonb_build_array(),
                                 'min_mods', 0, 'brands', jsonb_build_array(), 'radius_miles', 25)),
  jsonb_build_array(
    jsonb_build_object('name', 'First', 'lat', 53.20, 'lng', -0.50),
    jsonb_build_object('name', 'Second', 'lat', 53.25, 'lng', -0.45),
    jsonb_build_object('name', 'Third', 'lat', 53.30, 'lng', -0.40)),
  null) ->> 'id'), true);
select is((select count(*) from public.event_stops where event_id = current_setting('t.event')::uuid)::int, 3, 'save_event: stops saved in order');
select is((select count(*) from public.plan_changes where event_id = current_setting('t.event')::uuid and kind = 'created')::int, 3,
  'save_event: every stop placed is in the audit log');

select throws_ok($$ select public.save_event(
  jsonb_build_object('type', 'meet', 'title', 'Too close', 'starts_at', now() + interval '1 day',
    'area', jsonb_build_object('lat', 53.2, 'lng', -0.5), 'area_radius_miles', 3, 'area_name', 'Lincoln'),
  jsonb_build_array(jsonb_build_object('name', 'Spot', 'lat', 53.2, 'lng', -0.5))) $$,
  'P0001', 'The rough area is too close to a stop, so it would give the place away.', 'save_event: area may not sit on a stop');

select throws_ok($$ select public.save_event(
  jsonb_build_object('type', 'meet', 'title', 'Too small', 'starts_at', now() + interval '1 day',
    'area', jsonb_build_object('lat', 53.25, 'lng', -0.5), 'area_radius_miles', 3, 'area_name', 'Lincoln'),
  jsonb_build_array(jsonb_build_object('name', 'Spot', 'lat', 53.2, 'lng', -0.5), jsonb_build_object('name', 'Far', 'lat', 53.5, 'lng', -0.5))) $$,
  'P0001', 'The rough area has to contain every stop.', 'save_event: area must hold every stop');

select is(jsonb_array_length(public.save_event(
  jsonb_build_object('type', 'meet', 'title', 'Brum meet', 'starts_at', now() + interval '1 day',
    'area', jsonb_build_object('lat', 52.50, 'lng', -1.92), 'area_radius_miles', 3, 'area_name', 'Birmingham'),
  jsonb_build_array(jsonb_build_object('name', 'City car park', 'lat', 52.48, 'lng', -1.89))) -> 'warnings'), 1,
  'save_event: a stop in a ban zone gives a warning, not a block');

select lives_ok(format($$ select public.save_event(
  jsonb_build_object('id', %L, 'type', 'rolling', 'title', 'Wolds rolling meet (edited)', 'starts_at', now() + interval '2 hours',
    'area', jsonb_build_object('lat', 53.22, 'lng', -0.52), 'area_radius_miles', 9, 'area_name', 'Lincoln', 'crew_id', %L,
    'filter', jsonb_build_object('min_mods', 0, 'radius_miles', 25)),
  (select jsonb_agg(jsonb_build_object('id', id, 'name', name, 'lat', extensions.st_y(location::extensions.geometry), 'lng', extensions.st_x(location::extensions.geometry)) order by position)
     from public.event_stops where event_id = %L)) $$,
  current_setting('t.event'), current_setting('t.crew'), current_setting('t.event')), 'save_event: hosts can edit before the start');
select is((select body from public.chat_messages where event_id = current_setting('t.event')::uuid and system), 'Hosts updated the event details',
  'save_event: an edit posts a system line in chat');

-- Going and requests
select set_config('request.jwt.claims', '{"sub":"88888888-8888-8888-8888-888888888888","role":"authenticated"}', true);
select is(public.event_role(current_setting('t.event')::uuid), 'invited', 'event_role: J is invited (lives nearby, has a car)');
select is(public.set_going(current_setting('t.event')::uuid, true), 'going', 'set_going: invited people go straight in');

select set_config('request.jwt.claims', '{"sub":"99999999-9999-9999-9999-999999999999","role":"authenticated"}', true);
select is(public.set_going(current_setting('t.event')::uuid, true), 'requested', 'set_going: people outside the invite only request');
select set_config('request.jwt.claims', '{"sub":"77777777-7777-7777-7777-777777777777","role":"authenticated"}', true);
select is(public.set_going(current_setting('t.event')::uuid, true), 'requested', 'set_going: plain crew members are not hosts');

select set_config('request.jwt.claims', '{"sub":"66666666-6666-6666-6666-666666666666","role":"authenticated"}', true);
select lives_ok(format('select public.answer_request(%L, %L, false)', current_setting('t.event'), '99999999-9999-9999-9999-999999999999'), 'answer_request: decline');
select lives_ok(format('select public.answer_request(%L, %L, true)', current_setting('t.event'), '77777777-7777-7777-7777-777777777777'), 'answer_request: approve');
select throws_ok(format('select public.answer_request(%L, %L, true)', current_setting('t.event'), '77777777-7777-7777-7777-777777777777'),
  'P0001', 'That request has gone.', 'answer_request: only pending requests');
select is((select count(*) from public.event_going where event_id = current_setting('t.event')::uuid)::int, 2, 'answer_request: approved people are going');

select set_config('request.jwt.claims', '{"sub":"99999999-9999-9999-9999-999999999999","role":"authenticated"}', true);
select throws_ok(format('select public.set_going(%L, true)', current_setting('t.event')), 'P0001', 'A host has already said no to this one.', 'set_going: declined people cannot ask again');

-- Change the plan (rolling meet, crew owner M1)
select set_config('request.jwt.claims', '{"sub":"66666666-6666-6666-6666-666666666666","role":"authenticated"}', true);
select set_config('t.stop2', (select id::text from public.event_stops where event_id = current_setting('t.event')::uuid and position = 1), true);
select lives_ok(format($$ select public.change_plan(%L, 'rename', %L, 'Second, round the back') $$, current_setting('t.event'), current_setting('t.stop2')), 'change_plan: rename');
select throws_ok(format($$ select public.change_plan(%L, 'rename', %L, 'Second, round the back') $$, current_setting('t.event'), current_setting('t.stop2')),
  'P0001', 'That''s the same name.', 'change_plan: same name');
select lives_ok(format($$ select public.change_plan(%L, 'add', null, 'Fourth', 53.28, -0.48, 53.24, -0.53, 9) $$, current_setting('t.event')), 'change_plan: add a stop with a new area');
select lives_ok(format($$ select public.change_plan(%L, 'move', %L, null, 53.255, -0.455) $$, current_setting('t.event'), current_setting('t.stop2')), 'change_plan: move a stop');
select lives_ok(format($$ select public.change_plan(%L, 'remove', %L) $$, current_setting('t.event'), current_setting('t.stop2')), 'change_plan: remove a stop the meet has not reached');
select results_eq(format('select position from public.event_stops where event_id = %L order by position', current_setting('t.event')),
  $$ values (0), (1), (2) $$, 'change_plan: positions close up after a removal');
select throws_ok(format($$ select public.change_plan(%L, 'remove', %L) $$, current_setting('t.event'),
    (select id from public.event_stops where event_id = current_setting('t.event')::uuid and position = 0)),
  'P0001', 'You can only remove meet points the meet hasn''t reached. Move this one instead.', 'change_plan: cannot remove the current stop');
select is((select count(*) from public.chat_messages where event_id = current_setting('t.event')::uuid and body = 'Hosts changed the plan')::int, 4,
  'change_plan: every change posts "Hosts changed the plan" (never where)');
select throws_ok(format('select public.move_on(%L)', current_setting('t.event')), 'P0001', 'The meet hasn''t started yet.', 'move_on: only once the meet is live');

select set_config('request.jwt.claims', '{"sub":"77777777-7777-7777-7777-777777777777","role":"authenticated"}', true);
select throws_ok(format('select public.cancel_event(%L)', current_setting('t.event')), 'P0001', 'Only hosts can cancel this event.', 'cancel_event: hosts only');
select set_config('request.jwt.claims', '{"sub":"66666666-6666-6666-6666-666666666666","role":"authenticated"}', true);
select lives_ok(format('select public.cancel_event(%L)', current_setting('t.event')), 'cancel_event: host cancels');
select set_config('request.jwt.claims', '{"sub":"88888888-8888-8888-8888-888888888888","role":"authenticated"}', true);
select is((select phase from public.events_for_me() where event_id = current_setting('t.event')::uuid), 'cancelled', 'events_for_me: shows the phase');
select ok((public.invite_count('{"radius_miles": 25, "min_mods": 0}'::jsonb, 53.22, -0.52)) ? 'people', 'invite_count: returns counts only');

-- ---------------------------------------------------------------------------
-- Drives and photo spots (J suggests, F drives)
-- ---------------------------------------------------------------------------
select set_config('t.drive', (public.suggest_spot('drive', 'Wolds test road', '',
  '[{"lat":53.10,"lng":-0.30},{"lat":53.11,"lng":-0.30},{"lat":53.12,"lng":-0.30},{"lat":53.125,"lng":-0.30}]'::jsonb) ->> 'id'), true);
select set_config('t.photo', (public.suggest_spot('photo', 'Wolds viewpoint', 'Lay-by with a view', '[{"lat":53.15,"lng":-0.35}]'::jsonb) ->> 'id'), true);
select throws_like($$ select public.suggest_spot('drive', 'Gappy road', '', '[{"lat":53.0,"lng":-0.3},{"lat":53.03,"lng":-0.3}]'::jsonb) $$,
  'Points 1 and 2 are 2.1 mi apart.%', 'suggest_spot: drive points no more than 1.5 mi apart');
select is((select status::text from public.spots where id = current_setting('t.drive')::uuid), 'pending', 'suggest_spot: starts pending and the author sees it');

reset role;
update public.spots set status = 'approved', approved_at = now() where id in (current_setting('t.drive')::uuid, current_setting('t.photo')::uuid);
set local role authenticated;

select set_config('request.jwt.claims', '{"sub":"99999999-9999-9999-9999-999999999999","role":"authenticated"}', true);
-- Checkpoints backwards: fails. 1.73 mi in 20 seconds: far too quick. In 7.5 minutes: fine.
select is(public.complete_drive(current_setting('t.drive')::uuid, (
  select jsonb_agg(jsonb_build_object('lat', lat, 'lng', -0.30, 't', (extract(epoch from now()) * 1000)::bigint - 600000 + ord * 150000) order by ord desc)
  from (values (53.10, 0), (53.11, 1), (53.12, 2), (53.125, 3)) as v(lat, ord))) ->> 'reason',
  'Pass every checkpoint in order to finish.',
  'complete_drive: checkpoints out of order fail');
select is(public.complete_drive(current_setting('t.drive')::uuid, (
  select jsonb_agg(jsonb_build_object('lat', lat, 'lng', -0.30, 't', (extract(epoch from now()) * 1000)::bigint - 20000 + ord * 5000) order by ord)
  from (values (53.10, 0), (53.11, 1), (53.12, 2), (53.125, 3)) as v(lat, ord))) ->> 'reason',
  'That was quicker than these roads allow at the speed limits, so it doesn''t count. Drives are never about speed.',
  'complete_drive: 20 seconds fails');
select is(public.complete_drive(current_setting('t.drive')::uuid, (
  select jsonb_agg(jsonb_build_object('lat', lat, 'lng', -0.30, 't', (extract(epoch from now()) * 1000)::bigint - 600000 + ord * 150000) order by ord)
  from (values (53.10, 0), (53.11, 1), (53.12, 2), (53.125, 3)) as v(lat, ord))), '{"ok": true}'::jsonb,
  'complete_drive: every checkpoint in order at a legal pace passes');
select lives_ok(format('select public.rate_spot(%L, 5)', current_setting('t.drive')), 'rate_spot: after finishing');
select throws_like(format('select public.visit_spot(%L, 53.30, -0.35)', current_setting('t.photo')), 'You need to be within 0.2 mi of %', 'visit_spot: distance checked');
select throws_ok(format('select public.visit_spot(%L, 53.1505, -0.3502, %L)', current_setting('t.photo'), '88888888-8888-8888-8888-888888888888/x.jpg'),
  'P0001', 'That photo isn''t yours.', 'visit_spot: only your own photo');
select lives_ok(format('select public.visit_spot(%L, 53.1505, -0.3502, %L)', current_setting('t.photo'), '99999999-9999-9999-9999-999999999999/x.jpg'), 'visit_spot: within 0.2 mi');
select lives_ok('select public.mark_notices_read()', 'mark_notices_read');
select lives_ok('select count(*) from public.awards', 'awards view: readable');

select set_config('request.jwt.claims', '{"sub":"88888888-8888-8888-8888-888888888888","role":"authenticated"}', true);
select throws_ok(format('select public.rate_spot(%L, 5)', current_setting('t.drive')), 'P0001', 'You can''t rate a place you suggested.', 'rate_spot: never your own');
select is((select count(*) from public.spot_completions)::int, 0, 'spot_completions: other people''s completions are private');
select results_eq(format('select people, rating_average, rating_count from public.spot_stats(array[%L]::uuid[])', current_setting('t.drive')),
  $$ values (1, 5.00::numeric, 1) $$, 'spot_stats: counts and average only');

-- Storage: own folder only
select set_config('request.jwt.claims', '{"sub":"99999999-9999-9999-9999-999999999999","role":"authenticated"}', true);
select lives_ok($$ insert into storage.objects (bucket_id, name) values ('photos', '99999999-9999-9999-9999-999999999999/builds/a.jpg') $$, 'storage: upload to your own folder');
select throws_ok($$ insert into storage.objects (bucket_id, name) values ('photos', '88888888-8888-8888-8888-888888888888/builds/a.jpg') $$,
  '42501', null, 'storage: not into someone else''s folder');

-- Reminders (service role only)
reset role;
insert into public.events (id, type, title, starts_at, reveal_minutes_before, area, area_radius_miles, area_name, invite_min_mods)
  values ('e0000000-0000-0000-0000-0000000000b1', 'meet', 'Soon meet', now() + interval '20 minutes', 60, private.pt(53.22, -0.52), 3, 'Lincoln', 0);
insert into public.event_going (event_id, user_id) values ('e0000000-0000-0000-0000-0000000000b1', '88888888-8888-8888-8888-888888888888');
set local role authenticated;
select throws_ok('select public.queue_due_reminders()', '42501', null, 'reminders: the app cannot run the queue');
set local role service_role;
select is(public.queue_due_reminders(), 1, 'reminders: the 30-minute reminder is queued once');
select is(public.queue_due_reminders(), 0, 'reminders: running again adds nothing');
select is((select body from public.notices where key = 'ns.e0000000-0000-0000-0000-0000000000b1.soon'), 'Check-in is open. Lincoln.',
  'reminders: the text names the rough area, never a stop');

reset role;
select * from finish();
rollback;

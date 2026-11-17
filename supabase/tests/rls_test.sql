-- RLS and RPC rules: stop visibility, votes and home privacy.
-- Run with `npx supabase test db` (pgTAP, inside one transaction, rolled back).
--
-- Places are in Lincolnshire, well away from the sample ban zones.
-- Users: H host, G going (checks in), G2 going (doesn't check in), O outsider, A attendee.

begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(47);

-- ---------------------------------------------------------------------------
-- Setup (as the table owner, so RLS doesn't apply)
-- ---------------------------------------------------------------------------

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'h@example.test'),
  ('22222222-2222-2222-2222-222222222222', 'g@example.test'),
  ('33333333-3333-3333-3333-333333333333', 'g2@example.test'),
  ('44444444-4444-4444-4444-444444444444', 'o@example.test'),
  ('55555555-5555-5555-5555-555555555555', 'a@example.test');

-- Only the test users: the hosted database has real people too.
select is((select count(*) from public.profiles p join auth.users u on u.id = p.id where u.email like '%@example.test')::int, 5,
  'a profile row is made for every new auth user');

update public.profiles set handle = 'host', display_name = 'Host', region = 'East', onboarded = true where id = '11111111-1111-1111-1111-111111111111';
update public.profiles set handle = 'going', display_name = 'Going', region = 'East', onboarded = true where id = '22222222-2222-2222-2222-222222222222';

insert into public.profile_homes (user_id, home) values
  ('11111111-1111-1111-1111-111111111111', private.pt(53.2333, -0.5401)),
  ('22222222-2222-2222-2222-222222222222', private.pt(53.2051, -0.4949)),
  ('33333333-3333-3333-3333-333333333333', private.pt(53.2200, -0.5500)),
  ('44444444-4444-4444-4444-444444444444', private.pt(51.5072, -0.1276)),  -- London: far from everything
  ('55555555-5555-5555-5555-555555555555', private.pt(53.2100, -0.5200));

insert into public.builds (id, owner_id, kind, make, model, stock_bhp, weight_kg) values
  ('b0000000-0000-0000-0000-00000000000a', '55555555-5555-5555-5555-555555555555', 'car', 'Honda', 'Civic Type R', 316, 1430),
  ('b0000000-0000-0000-0000-00000000000b', '22222222-2222-2222-2222-222222222222', 'car', 'Ford', 'Fiesta ST', 197, 1262),
  ('b0000000-0000-0000-0000-00000000000c', '11111111-1111-1111-1111-111111111111', 'bike', 'Yamaha', 'R6', 118, 190),
  ('b0000000-0000-0000-0000-00000000000d', '33333333-3333-3333-3333-333333333333', 'car', 'VW', 'Golf R', 316, 1500);

-- Events. R: rolling meet, live (started 30 min ago). M: meet in 5 h (not revealed).
-- S: show (public). V: finished 2 h ago (voting open). V2: finished 26 h ago (closed).
-- W: finished 30 h ago with votes (results out). I: invite-only meet near G and A.
insert into public.events (id, type, title, starts_at, ends_at, reveal_minutes_before, area, area_radius_miles, area_name, invite_min_mods) values
  ('e0000000-0000-0000-0000-0000000000a1', 'rolling', 'Rolling test', now() - interval '30 minutes', now() + interval '3 hours', 60, private.pt(53.22, -0.52), 9, 'Lincoln', 0),
  ('e0000000-0000-0000-0000-0000000000a2', 'meet', 'Later meet', now() + interval '5 hours', null, 60, private.pt(53.22, -0.52), 3, 'Lincoln', 0),
  ('e0000000-0000-0000-0000-0000000000a3', 'show', 'Show test', now() + interval '2 days', null, 0, private.pt(53.20, -0.50), 3, 'Lincoln', 0),
  ('e0000000-0000-0000-0000-0000000000a4', 'meet', 'Vote test', now() - interval '6 hours', now() - interval '2 hours', 60, private.pt(53.22, -0.52), 3, 'Lincoln', 0),
  ('e0000000-0000-0000-0000-0000000000a5', 'meet', 'Closed vote', now() - interval '30 hours', now() - interval '26 hours', 60, private.pt(53.22, -0.52), 3, 'Lincoln', 0),
  ('e0000000-0000-0000-0000-0000000000a6', 'meet', 'Results', now() - interval '34 hours', now() - interval '30 hours', 60, private.pt(53.22, -0.52), 3, 'Lincoln', 0),
  ('e0000000-0000-0000-0000-0000000000a7', 'meet', 'Invite only', now() + interval '1 day', null, 60, private.pt(53.22, -0.52), 3, 'Lincoln', 0);

insert into public.event_stops (id, event_id, position, name, location) values
  ('50000000-0000-0000-0000-000000000000', 'e0000000-0000-0000-0000-0000000000a1', 0, 'First car park', private.pt(53.20, -0.50)),
  ('50000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-0000000000a1', 1, 'Second car park', private.pt(53.25, -0.45)),
  ('50000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-0000000000a1', 2, 'Third car park', private.pt(53.30, -0.40)),
  ('50000000-0000-0000-0000-000000000010', 'e0000000-0000-0000-0000-0000000000a2', 0, 'Meet spot', private.pt(53.20, -0.50)),
  ('50000000-0000-0000-0000-000000000020', 'e0000000-0000-0000-0000-0000000000a3', 0, 'Showground', private.pt(53.20, -0.50)),
  ('50000000-0000-0000-0000-000000000030', 'e0000000-0000-0000-0000-0000000000a4', 0, 'Vote spot', private.pt(53.20, -0.50)),
  ('50000000-0000-0000-0000-000000000040', 'e0000000-0000-0000-0000-0000000000a5', 0, 'Old spot', private.pt(53.20, -0.50)),
  ('50000000-0000-0000-0000-000000000050', 'e0000000-0000-0000-0000-0000000000a6', 0, 'Results spot', private.pt(53.20, -0.50)),
  ('50000000-0000-0000-0000-000000000060', 'e0000000-0000-0000-0000-0000000000a7', 0, 'Invite spot', private.pt(53.20, -0.50));

insert into public.event_hosts (event_id, user_id)
  select id, '11111111-1111-1111-1111-111111111111' from public.events;

insert into public.event_going (event_id, user_id) values
  ('e0000000-0000-0000-0000-0000000000a1', '22222222-2222-2222-2222-222222222222'),
  ('e0000000-0000-0000-0000-0000000000a1', '33333333-3333-3333-3333-333333333333'),
  ('e0000000-0000-0000-0000-0000000000a2', '22222222-2222-2222-2222-222222222222');

-- Check-ins at finished events (set up directly: those events are over).
insert into public.check_ins (event_id, user_id, stop_id) values
  ('e0000000-0000-0000-0000-0000000000a4', '22222222-2222-2222-2222-222222222222', '50000000-0000-0000-0000-000000000030'),
  ('e0000000-0000-0000-0000-0000000000a4', '55555555-5555-5555-5555-555555555555', '50000000-0000-0000-0000-000000000030'),
  ('e0000000-0000-0000-0000-0000000000a4', '11111111-1111-1111-1111-111111111111', '50000000-0000-0000-0000-000000000030'),
  ('e0000000-0000-0000-0000-0000000000a5', '22222222-2222-2222-2222-222222222222', '50000000-0000-0000-0000-000000000040'),
  ('e0000000-0000-0000-0000-0000000000a5', '55555555-5555-5555-5555-555555555555', '50000000-0000-0000-0000-000000000040'),
  ('e0000000-0000-0000-0000-0000000000a6', '22222222-2222-2222-2222-222222222222', '50000000-0000-0000-0000-000000000050'),
  ('e0000000-0000-0000-0000-0000000000a6', '33333333-3333-3333-3333-333333333333', '50000000-0000-0000-0000-000000000050'),
  ('e0000000-0000-0000-0000-0000000000a6', '44444444-4444-4444-4444-444444444444', '50000000-0000-0000-0000-000000000050'),
  ('e0000000-0000-0000-0000-0000000000a6', '55555555-5555-5555-5555-555555555555', '50000000-0000-0000-0000-000000000050');

-- Three votes for A's build at W: enough for a trophy. G2's is the latest.
insert into public.votes (event_id, voter_id, category, build_id, created_at) values
  ('e0000000-0000-0000-0000-0000000000a6', '22222222-2222-2222-2222-222222222222', 'best-in-show', 'b0000000-0000-0000-0000-00000000000a', now() - interval '29 hours'),
  ('e0000000-0000-0000-0000-0000000000a6', '44444444-4444-4444-4444-444444444444', 'best-in-show', 'b0000000-0000-0000-0000-00000000000a', now() - interval '28 hours'),
  ('e0000000-0000-0000-0000-0000000000a6', '33333333-3333-3333-3333-333333333333', 'best-in-show', 'b0000000-0000-0000-0000-00000000000a', now() - interval '27 hours'),
  ('e0000000-0000-0000-0000-0000000000a6', '55555555-5555-5555-5555-555555555555', 'stance', 'b0000000-0000-0000-0000-00000000000b', now() - interval '27 hours');

insert into public.chat_messages (event_id, user_id, body) values
  ('e0000000-0000-0000-0000-0000000000a1', '11111111-1111-1111-1111-111111111111', 'Far end of the car park');

-- ---------------------------------------------------------------------------
-- Signed out: nothing at all
-- ---------------------------------------------------------------------------

set local role anon;
select throws_ok('select count(*) from public.events', '42501', null, 'anon cannot read events');
select throws_ok($$ select public.get_event_stops(array['e0000000-0000-0000-0000-0000000000a1'::uuid]) $$, '42501', null, 'anon cannot call RPCs');
reset role;

-- ---------------------------------------------------------------------------
-- O: signed in, not going
-- ---------------------------------------------------------------------------

select set_config('request.jwt.claims', '{"sub":"44444444-4444-4444-4444-444444444444","role":"authenticated"}', true);
set local role authenticated;

select is((select count(*) from public.event_stops where event_id = 'e0000000-0000-0000-0000-0000000000a1')::int, 0,
  'outsider: raw event_stops are hidden');
select is((select count(*) from public.get_event_stops(array['e0000000-0000-0000-0000-0000000000a1'::uuid]))::int, 0,
  'outsider: no stop rows for a private event they are not going to');
select isnt((select lat from public.get_event_stops(array['e0000000-0000-0000-0000-0000000000a3'::uuid]) where position = 0), null,
  'outsider: a show is public, so its place is visible');
select throws_ok($$ select public.check_in('e0000000-0000-0000-0000-0000000000a1', 0, 53.2, -0.5) $$,
  'P0001', 'Tap Going first, then check in.', 'outsider: cannot check in');
select is((select count(*) from public.chat_messages where event_id = 'e0000000-0000-0000-0000-0000000000a1')::int, 0,
  'outsider: cannot read the chat');
select throws_ok($$ insert into public.chat_messages (event_id, body) values ('e0000000-0000-0000-0000-0000000000a1', 'hi') $$,
  '42501', null, 'outsider: cannot post in the chat');
select throws_ok($$ select public.cast_vote('e0000000-0000-0000-0000-0000000000a4', 'best-in-show', 'b0000000-0000-0000-0000-00000000000a') $$,
  'P0001', 'Check in at the event to vote.', 'votes: only people who checked in');
select is((select count(*) from public.events_for_me() where event_id = 'e0000000-0000-0000-0000-0000000000a7')::int, 0,
  'invites: someone living far away is not invited');
select is((select count(*) from public.profile_homes)::int, 1, 'home: you see only your own home row');

-- ---------------------------------------------------------------------------
-- G: going to R, before checking in
-- ---------------------------------------------------------------------------

select set_config('request.jwt.claims', '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}', true);

select is((select count(*) from public.event_stops where event_id = 'e0000000-0000-0000-0000-0000000000a1')::int, 0,
  'going: raw event_stops are still hidden (hosts only)');
select ok((select visible from public.get_event_stops(array['e0000000-0000-0000-0000-0000000000a1'::uuid]) where position = 0),
  'rolling: stop 1 is visible to people going after the reveal');
select ok(not (select visible from public.get_event_stops(array['e0000000-0000-0000-0000-0000000000a1'::uuid]) where position = 1),
  'rolling: stop 2 is locked before the host moves on');
select is((select lat from public.get_event_stops(array['e0000000-0000-0000-0000-0000000000a1'::uuid]) where position = 1), null,
  'rolling: a locked stop comes back with no coordinates');
select is((select name from public.get_event_stops(array['e0000000-0000-0000-0000-0000000000a1'::uuid]) where position = 1), null,
  'rolling: a locked stop comes back with no name');
select ok(not (select visible from public.get_event_stops(array['e0000000-0000-0000-0000-0000000000a2'::uuid]) where position = 0),
  'meet: locked before the reveal time even for people going');
select throws_like($$ select public.check_in('e0000000-0000-0000-0000-0000000000a1', 0, 53.30, -0.60) $$,
  'You need to be within 0.5 mi of %', 'check-in: refused when the reported position is far from the stop');
select lives_ok($$ select public.check_in('e0000000-0000-0000-0000-0000000000a1', 0, 53.2030, -0.5010) $$,
  'check-in: accepted within 0.5 mi');
select throws_ok($$ select public.check_in('e0000000-0000-0000-0000-0000000000a1', 1, 53.25, -0.45) $$,
  'P0001', 'You can''t see this stop yet.', 'check-in: not at a stop you cannot see');

-- ---------------------------------------------------------------------------
-- H moves on
-- ---------------------------------------------------------------------------

select set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);

select is((select count(*) from public.event_stops where event_id = 'e0000000-0000-0000-0000-0000000000a1')::int, 3,
  'host: sees every raw stop');
select results_eq($$ select * from public.move_on('e0000000-0000-0000-0000-0000000000a1') $$,
  $$ values ('22222222-2222-2222-2222-222222222222'::uuid) $$,
  'move on: the audience is exactly the people checked in at the stop being left');
select ok((select count(*) from public.plan_changes where event_id = 'e0000000-0000-0000-0000-0000000000a1' and kind = 'move_on') = 1,
  'move on: logged in the plan changes for hosts');

-- ---------------------------------------------------------------------------
-- After the move: G (checked in at stop 1) and G2 (not checked in)
-- ---------------------------------------------------------------------------

select set_config('request.jwt.claims', '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}', true);

select ok((select visible from public.get_event_stops(array['e0000000-0000-0000-0000-0000000000a1'::uuid]) where position = 1),
  'rolling: the next stop unlocks for people checked in at the stop before');
select ok(not (select visible from public.get_event_stops(array['e0000000-0000-0000-0000-0000000000a1'::uuid]) where position = 2),
  'rolling: stops the meet has not reached stay locked');
select is((select count(*) from public.notices where kind = 'moved')::int, 1, 'move on: a "moved on" notice is queued');
select ok((select body not like '%car park%' from public.notices where kind = 'moved'),
  'move on: the notice never names the place');
select throws_ok($$ select public.check_in('e0000000-0000-0000-0000-0000000000a1', 0, 53.2030, -0.5010) $$,
  'P0001', 'The meet has moved on. Check in at the current stop.', 'check-in: not at a stop the meet has left');
select is((select count(*) from public.plan_changes)::int, 0, 'plan changes: hidden from people who are not hosts');
select is((select count(*) from public.chat_messages where event_id = 'e0000000-0000-0000-0000-0000000000a1')::int, 1,
  'chat: readable by people going');

select set_config('request.jwt.claims', '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}', true);

select ok(not (select visible from public.get_event_stops(array['e0000000-0000-0000-0000-0000000000a1'::uuid]) where position = 1),
  'rolling: the next stop stays locked for people who did not check in at the stop before');
select ok((select visible from public.get_event_stops(array['e0000000-0000-0000-0000-0000000000a1'::uuid]) where position = 0),
  'rolling: stop 1 stays visible to people going');

-- ---------------------------------------------------------------------------
-- Votes (G checked in at V and V2)
-- ---------------------------------------------------------------------------

select set_config('request.jwt.claims', '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}', true);

select throws_ok($$ select public.cast_vote('e0000000-0000-0000-0000-0000000000a4', 'best-in-show', 'b0000000-0000-0000-0000-00000000000b') $$,
  'P0001', 'You can''t vote for your own build.', 'votes: never for your own build');
select throws_ok($$ select public.cast_vote('e0000000-0000-0000-0000-0000000000a4', 'best-bike', 'b0000000-0000-0000-0000-00000000000a') $$,
  'P0001', 'That build can''t win this award.', 'votes: only builds that can win the category');
select throws_ok($$ select public.cast_vote('e0000000-0000-0000-0000-0000000000a4', 'best-in-show', 'b0000000-0000-0000-0000-00000000000d') $$,
  'P0001', 'That build can''t win this award.', 'votes: only builds of people who checked in');
select lives_ok($$ select public.cast_vote('e0000000-0000-0000-0000-0000000000a4', 'best-in-show', 'b0000000-0000-0000-0000-00000000000a') $$,
  'votes: a checked-in attendee can vote for someone else''s build');
select throws_ok($$ select public.cast_vote('e0000000-0000-0000-0000-0000000000a5', 'best-in-show', 'b0000000-0000-0000-0000-00000000000a') $$,
  'P0001', 'Voting has closed.', 'votes: closed 24 hours after the end');
select is((select count(*) from public.votes where voter_id <> '22222222-2222-2222-2222-222222222222')::int, 0,
  'votes: you only ever see your own votes');
select is((select count(*) from public.event_awards('e0000000-0000-0000-0000-0000000000a4'))::int, 0,
  'awards: no results while voting is open');
select results_eq(
  $$ select category, build_id, votes from public.event_awards('e0000000-0000-0000-0000-0000000000a6') $$,
  $$ values ('best-in-show'::text, 'b0000000-0000-0000-0000-00000000000a'::uuid, 3) $$,
  'awards: 3 votes win best in show; 1 vote for stance is not enough');

-- ---------------------------------------------------------------------------
-- Home privacy (G)
-- ---------------------------------------------------------------------------

select is((select count(*) from public.profile_homes)::int, 1, 'home: only your own row is readable');
select is((select count(*) from public.profile_homes where user_id = '11111111-1111-1111-1111-111111111111')::int, 0,
  'home: someone else''s home cannot be read');
select is(
  (select array[round(extensions.st_y(home::extensions.geometry)::numeric, 6), round(extensions.st_x(home::extensions.geometry)::numeric, 6)] from public.profile_homes),
  array[53.21, -0.49]::numeric[],
  'home: stored snapped to the ~1 km grid');
select throws_ok($$ update public.profile_homes set home = private.pt(53.0, -0.4) $$,
  '42501', null, 'home: no direct writes (save_profile only)');
select is((select role from public.events_for_me() where event_id = 'e0000000-0000-0000-0000-0000000000a7'), 'invited',
  'invites: matched on the server from the private home, without exposing it');
select throws_ok($$ select public.invite_count('{"radius_miles": 5}'::jsonb, 53.22, -0.52) $$,
  'P0001', 'Invite radius must be at least 10 miles.', 'invites: counts need a wide radius');

reset role;
select * from finish();
rollback;

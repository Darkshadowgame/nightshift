-- Which vehicle you're bringing (20261117130000_event_vehicles.sql, src/lib/bringing.ts):
-- the garage columns, the build on going and request rows, set_going(),
-- answer_request(), check_in() and the awards using the brought builds.
--
-- Places are in Lincolnshire. Users: H host, P has a bike, a car and a daily,
-- O has one bike, F lives far away, V1-V3 voters.

begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(42);

-- ---------------------------------------------------------------------------
-- Setup (as the table owner, so RLS doesn't apply)
-- ---------------------------------------------------------------------------

insert into auth.users (id, email) values
  ('a1111111-1111-1111-1111-111111111111', 'h@example.test'),
  ('a2222222-2222-2222-2222-222222222222', 'p@example.test'),
  ('a3333333-3333-3333-3333-333333333333', 'o@example.test'),
  ('a4444444-4444-4444-4444-444444444444', 'f@example.test'),
  ('a5555555-5555-5555-5555-555555555555', 'v1@example.test'),
  ('a6666666-6666-6666-6666-666666666666', 'v2@example.test'),
  ('a7777777-7777-7777-7777-777777777777', 'v3@example.test');

insert into public.profile_homes (user_id, home) values
  ('a1111111-1111-1111-1111-111111111111', private.pt(53.2333, -0.5401)),
  ('a2222222-2222-2222-2222-222222222222', private.pt(53.2051, -0.4949)),
  ('a3333333-3333-3333-3333-333333333333', private.pt(53.2200, -0.5500)),
  ('a4444444-4444-4444-4444-444444444444', private.pt(50.3700, -4.1400));  -- Plymouth

insert into public.builds (id, owner_id, kind, make, model, stock_bhp, weight_kg) values
  ('bb000000-0000-0000-0000-0000000000b1', 'a2222222-2222-2222-2222-222222222222', 'bike', 'Yamaha', 'R1', 197, 201),
  ('bb000000-0000-0000-0000-0000000000c1', 'a2222222-2222-2222-2222-222222222222', 'car', 'Honda', 'Civic Type R', 316, 1380),
  ('bb000000-0000-0000-0000-0000000000d1', 'a2222222-2222-2222-2222-222222222222', 'car', 'Skoda', 'Octavia', 150, 1350),
  ('bb000000-0000-0000-0000-0000000000b2', 'a3333333-3333-3333-3333-333333333333', 'bike', 'Kawasaki', 'ZX-6R', 128, 196),
  ('bb000000-0000-0000-0000-0000000000b3', 'a4444444-4444-4444-4444-444444444444', 'bike', 'Triumph', 'Speed Triple', 177, 198),
  ('bb000000-0000-0000-0000-0000000000c3', 'a1111111-1111-1111-1111-111111111111', 'car', 'BMW', 'M2', 453, 1700),
  ('bb000000-0000-0000-0000-0000000000b4', 'a1111111-1111-1111-1111-111111111111', 'bike', 'Ducati', 'Panigale', 214, 198);

-- B: bikes-only meet in 5 h. L: everyone-welcome meet, live (started 10 min ago).
-- K: bikes-only meet, live. A: finished 30 h ago (results out). W: finished 2 h ago (voting open).
insert into public.events (id, type, title, starts_at, ends_at, reveal_minutes_before, area, area_radius_miles, area_name,
                           invite_everyone, invite_cars, invite_bikes, invite_min_mods) values
  ('ee000000-0000-0000-0000-0000000000b0', 'meet', 'Bike night', now() + interval '5 hours', null, 60, private.pt(53.22, -0.52), 3, 'Lincoln', false, false, true, 0),
  ('ee000000-0000-0000-0000-0000000000a0', 'meet', 'Live and open', now() - interval '10 minutes', now() + interval '3 hours', 60, private.pt(53.22, -0.52), 3, 'Lincoln', true, true, true, 0),
  ('ee000000-0000-0000-0000-0000000000c0', 'meet', 'Live bikes', now() - interval '10 minutes', now() + interval '3 hours', 60, private.pt(53.22, -0.52), 3, 'Lincoln', false, false, true, 0),
  ('ee000000-0000-0000-0000-0000000000d0', 'meet', 'Awards out', now() - interval '34 hours', now() - interval '30 hours', 60, private.pt(53.22, -0.52), 3, 'Lincoln', true, true, true, 0),
  ('ee000000-0000-0000-0000-0000000000f0', 'meet', 'Voting open', now() - interval '6 hours', now() - interval '2 hours', 60, private.pt(53.22, -0.52), 3, 'Lincoln', true, true, true, 0);

insert into public.event_stops (id, event_id, position, name, location) values
  ('5e000000-0000-0000-0000-0000000000b0', 'ee000000-0000-0000-0000-0000000000b0', 0, 'Bike spot', private.pt(53.20, -0.50)),
  ('5e000000-0000-0000-0000-0000000000a0', 'ee000000-0000-0000-0000-0000000000a0', 0, 'Open spot', private.pt(53.20, -0.50)),
  ('5e000000-0000-0000-0000-0000000000c0', 'ee000000-0000-0000-0000-0000000000c0', 0, 'Live bike spot', private.pt(53.20, -0.50)),
  ('5e000000-0000-0000-0000-0000000000d0', 'ee000000-0000-0000-0000-0000000000d0', 0, 'Awards spot', private.pt(53.20, -0.50)),
  ('5e000000-0000-0000-0000-0000000000f0', 'ee000000-0000-0000-0000-0000000000f0', 0, 'Vote spot', private.pt(53.20, -0.50));

insert into public.event_hosts (event_id, user_id)
  select id, 'a1111111-1111-1111-1111-111111111111' from public.events where id::text like 'ee000000-%';

-- A (finished): P brought the bike, O brought theirs, H (a host, never tapped Going) has no pick.
insert into public.event_going (event_id, user_id, build_id) values
  ('ee000000-0000-0000-0000-0000000000d0', 'a2222222-2222-2222-2222-222222222222', 'bb000000-0000-0000-0000-0000000000b1'),
  ('ee000000-0000-0000-0000-0000000000d0', 'a3333333-3333-3333-3333-333333333333', 'bb000000-0000-0000-0000-0000000000b2'),
  ('ee000000-0000-0000-0000-0000000000f0', 'a2222222-2222-2222-2222-222222222222', 'bb000000-0000-0000-0000-0000000000b1'),
  ('ee000000-0000-0000-0000-0000000000f0', 'a3333333-3333-3333-3333-333333333333', 'bb000000-0000-0000-0000-0000000000b2');
insert into public.check_ins (event_id, user_id, stop_id) values
  ('ee000000-0000-0000-0000-0000000000d0', 'a2222222-2222-2222-2222-222222222222', '5e000000-0000-0000-0000-0000000000d0'),
  ('ee000000-0000-0000-0000-0000000000d0', 'a3333333-3333-3333-3333-333333333333', '5e000000-0000-0000-0000-0000000000d0'),
  ('ee000000-0000-0000-0000-0000000000d0', 'a1111111-1111-1111-1111-111111111111', '5e000000-0000-0000-0000-0000000000d0'),
  ('ee000000-0000-0000-0000-0000000000f0', 'a2222222-2222-2222-2222-222222222222', '5e000000-0000-0000-0000-0000000000f0'),
  ('ee000000-0000-0000-0000-0000000000f0', 'a3333333-3333-3333-3333-333333333333', '5e000000-0000-0000-0000-0000000000f0');

-- A's votes: three for P's car, which stayed at home; three for P's bike, which came.
insert into public.votes (event_id, voter_id, category, build_id, created_at) values
  ('ee000000-0000-0000-0000-0000000000d0', 'a5555555-5555-5555-5555-555555555555', 'best-in-show', 'bb000000-0000-0000-0000-0000000000c1', now() - interval '29 hours'),
  ('ee000000-0000-0000-0000-0000000000d0', 'a6666666-6666-6666-6666-666666666666', 'best-in-show', 'bb000000-0000-0000-0000-0000000000c1', now() - interval '29 hours'),
  ('ee000000-0000-0000-0000-0000000000d0', 'a7777777-7777-7777-7777-777777777777', 'best-in-show', 'bb000000-0000-0000-0000-0000000000c1', now() - interval '29 hours'),
  ('ee000000-0000-0000-0000-0000000000d0', 'a5555555-5555-5555-5555-555555555555', 'stance', 'bb000000-0000-0000-0000-0000000000b1', now() - interval '29 hours'),
  ('ee000000-0000-0000-0000-0000000000d0', 'a6666666-6666-6666-6666-666666666666', 'stance', 'bb000000-0000-0000-0000-0000000000b1', now() - interval '29 hours'),
  ('ee000000-0000-0000-0000-0000000000d0', 'a7777777-7777-7777-7777-777777777777', 'stance', 'bb000000-0000-0000-0000-0000000000b1', now() - interval '29 hours');

-- ---------------------------------------------------------------------------
-- Columns and keys (as the table owner)
-- ---------------------------------------------------------------------------

select has_column('public', 'event_going', 'build_id', 'event_going has build_id');
select has_column('public', 'event_requests', 'build_id', 'event_requests has build_id');
select throws_ok($$ insert into public.event_going (event_id, user_id, build_id)
  values ('ee000000-0000-0000-0000-0000000000b0', 'a3333333-3333-3333-3333-333333333333', 'bb000000-0000-0000-0000-0000000000b1') $$,
  '23503', null, 'the build on a going row must be that person''s own');
select throws_ok($$ insert into public.event_requests (event_id, user_id, build_id)
  values ('ee000000-0000-0000-0000-0000000000b0', 'a3333333-3333-3333-3333-333333333333', 'bb000000-0000-0000-0000-0000000000c1') $$,
  '23503', null, 'the build on a request must be that person''s own');

-- ---------------------------------------------------------------------------
-- P: the garage columns
-- ---------------------------------------------------------------------------

select set_config('request.jwt.claims', '{"sub":"a2222222-2222-2222-2222-222222222222","role":"authenticated"}', true);
set local role authenticated;

select lives_ok($$ update public.builds
  set vehicle_id = 'honda-civic-type-r-fk8', tune_stage = 'stage2',
      engine_swap = '{"donorMake":"Honda","donorModel":"K20A","bhp":220,"weightDeltaKg":-10}'
  where id = 'bb000000-0000-0000-0000-0000000000c1' $$, 'builds: vehicle_id, tune_stage and engine_swap save');
select is((select engine_swap ->> 'donorModel' from public.builds where id = 'bb000000-0000-0000-0000-0000000000c1'), 'K20A',
  'builds: engine_swap reads back');
select throws_ok($$ update public.builds set tune_stage = 'stage9' where id = 'bb000000-0000-0000-0000-0000000000c1' $$,
  '23514', null, 'builds: unknown tune stage refused');
select throws_ok($$ update public.builds set engine_swap = '"K20"' where id = 'bb000000-0000-0000-0000-0000000000c1' $$,
  '23514', null, 'builds: engine_swap must be an object with a donor and bhp');

-- ---------------------------------------------------------------------------
-- P: only through the RPCs, only your own builds
-- ---------------------------------------------------------------------------

select throws_ok($$ update public.event_going set build_id = 'bb000000-0000-0000-0000-0000000000c1'
  where user_id = 'a2222222-2222-2222-2222-222222222222' $$, '42501', null, 'event_going can''t be written directly');
select throws_ok($$ insert into public.event_requests (event_id, user_id, build_id) values
  ('ee000000-0000-0000-0000-0000000000b0', 'a2222222-2222-2222-2222-222222222222', 'bb000000-0000-0000-0000-0000000000b1') $$,
  '42501', null, 'event_requests can''t be written directly');
select throws_ok($$ select public.set_going('ee000000-0000-0000-0000-0000000000b0', true, 'bb000000-0000-0000-0000-0000000000b2') $$,
  'P0001', 'That isn''t one of your builds.', 'set_going: never someone else''s build');

-- ---------------------------------------------------------------------------
-- P: going to the bikes-only meet with each build
-- ---------------------------------------------------------------------------

select is(public.set_going('ee000000-0000-0000-0000-0000000000b0', true, 'bb000000-0000-0000-0000-0000000000b1'), 'going',
  'set_going: a build the invite covers goes straight in');
select is((select build_id from public.event_going where event_id = 'ee000000-0000-0000-0000-0000000000b0' and user_id = 'a2222222-2222-2222-2222-222222222222'),
  'bb000000-0000-0000-0000-0000000000b1'::uuid, 'set_going: the pick is stored');
select is(public.set_going('ee000000-0000-0000-0000-0000000000b0', true), 'going', 'set_going: no build keeps the pick');
select is((select build_id from public.event_going where event_id = 'ee000000-0000-0000-0000-0000000000b0' and user_id = 'a2222222-2222-2222-2222-222222222222'),
  'bb000000-0000-0000-0000-0000000000b1'::uuid, 'set_going: ...still the bike');
select is(public.set_going('ee000000-0000-0000-0000-0000000000b0', true, 'bb000000-0000-0000-0000-0000000000c1'), 'requested',
  'set_going: changing to a build the invite doesn''t cover goes back to asking');
select is((select build_id::text || ':' || status from public.event_requests where event_id = 'ee000000-0000-0000-0000-0000000000b0' and user_id = 'a2222222-2222-2222-2222-222222222222'),
  'bb000000-0000-0000-0000-0000000000c1:pending', 'set_going: the request carries the car');
select is(public.event_role('ee000000-0000-0000-0000-0000000000b0'), 'invited',
  'event_role: still invited (any build counts for invites, alerts and search)');
select is(public.set_going('ee000000-0000-0000-0000-0000000000b0', true, 'bb000000-0000-0000-0000-0000000000b1'), 'going',
  'set_going: a request changed to a build that fits goes straight in');
select is((select count(*) from public.event_requests where event_id = 'ee000000-0000-0000-0000-0000000000b0' and status = 'pending')::int, 0,
  'set_going: ...and the request is gone');
select is(public.set_going('ee000000-0000-0000-0000-0000000000b0', false), 'none', 'set_going: drop out');
select is((select count(*) from public.event_going where event_id = 'ee000000-0000-0000-0000-0000000000b0')::int, 0, 'set_going: ...the row and its pick go');

-- O has one bike: tapping Going without a pick uses it.
select set_config('request.jwt.claims', '{"sub":"a3333333-3333-3333-3333-333333333333","role":"authenticated"}', true);
select is(public.set_going('ee000000-0000-0000-0000-0000000000b0', true), 'going', 'set_going: one build, no pick needed');
select is((select build_id from public.event_going where event_id = 'ee000000-0000-0000-0000-0000000000b0' and user_id = 'a3333333-3333-3333-3333-333333333333'),
  'bb000000-0000-0000-0000-0000000000b2'::uuid, 'set_going: ...and it is the one');

-- F lives too far: a request with the bike; the host approves it and F goes with that bike.
select set_config('request.jwt.claims', '{"sub":"a4444444-4444-4444-4444-444444444444","role":"authenticated"}', true);
select is(public.set_going('ee000000-0000-0000-0000-0000000000b0', true, 'bb000000-0000-0000-0000-0000000000b3'), 'requested',
  'set_going: outside the radius, even a fitting build only asks');
select set_config('request.jwt.claims', '{"sub":"a1111111-1111-1111-1111-111111111111","role":"authenticated"}', true);
select lives_ok($$ select public.answer_request('ee000000-0000-0000-0000-0000000000b0', 'a4444444-4444-4444-4444-444444444444', true) $$,
  'answer_request: approve');
select is((select build_id from public.event_going where event_id = 'ee000000-0000-0000-0000-0000000000b0' and user_id = 'a4444444-4444-4444-4444-444444444444'),
  'bb000000-0000-0000-0000-0000000000b3'::uuid, 'answer_request: going with the build they asked with');

-- ---------------------------------------------------------------------------
-- Changing after the start, and at check-in
-- ---------------------------------------------------------------------------

select set_config('request.jwt.claims', '{"sub":"a2222222-2222-2222-2222-222222222222","role":"authenticated"}', true);
select is(public.set_going('ee000000-0000-0000-0000-0000000000a0', true, 'bb000000-0000-0000-0000-0000000000c1'), 'going',
  'set_going: a first pick is fine after the start');
select throws_ok($$ select public.set_going('ee000000-0000-0000-0000-0000000000a0', true, 'bb000000-0000-0000-0000-0000000000d1') $$,
  'P0001', 'It has started. Change your vehicle when you check in.', 'set_going: no change after the start away from check-in');
select throws_ok($$ select public.check_in('ee000000-0000-0000-0000-0000000000a0', 0, 53.2030, -0.5010, 'bb000000-0000-0000-0000-0000000000b2') $$,
  'P0001', 'That isn''t one of your builds.', 'check_in: never someone else''s build');
select lives_ok($$ select public.check_in('ee000000-0000-0000-0000-0000000000a0', 0, 53.2030, -0.5010, 'bb000000-0000-0000-0000-0000000000d1') $$,
  'check_in: turned up in something else');
select is((select build_id from public.event_going where event_id = 'ee000000-0000-0000-0000-0000000000a0' and user_id = 'a2222222-2222-2222-2222-222222222222'),
  'bb000000-0000-0000-0000-0000000000d1'::uuid, 'check_in: ...and that is now the build');
select throws_ok($$ select public.set_going('ee000000-0000-0000-0000-0000000000a0', true, 'bb000000-0000-0000-0000-0000000000b1') $$,
  'P0001', 'You''ve checked in, so your vehicle is set for this one.', 'set_going: set once checked in');

select is(public.set_going('ee000000-0000-0000-0000-0000000000c0', true, 'bb000000-0000-0000-0000-0000000000b1'), 'going', 'set_going: going to the live bikes meet');
select throws_ok($$ select public.check_in('ee000000-0000-0000-0000-0000000000c0', 0, 53.2030, -0.5010, 'bb000000-0000-0000-0000-0000000000c1') $$,
  'P0001', 'That build doesn''t match the invite. Check in with one that does, or ask a host.', 'check_in: a build the invite doesn''t cover is refused');

-- A host checking in with a build counts as going with it.
select set_config('request.jwt.claims', '{"sub":"a1111111-1111-1111-1111-111111111111","role":"authenticated"}', true);
select lives_ok($$ select public.check_in('ee000000-0000-0000-0000-0000000000a0', 0, 53.2030, -0.5010, 'bb000000-0000-0000-0000-0000000000b4') $$,
  'check_in: a host with a build');
select is((select build_id from public.event_going where event_id = 'ee000000-0000-0000-0000-0000000000a0' and user_id = 'a1111111-1111-1111-1111-111111111111'),
  'bb000000-0000-0000-0000-0000000000b4'::uuid, 'check_in: ...goes in as going with it');

-- ---------------------------------------------------------------------------
-- Awards use the brought builds
-- ---------------------------------------------------------------------------

select set_eq($$ select build_id from private.award_candidates('ee000000-0000-0000-0000-0000000000d0') $$,
  array['bb000000-0000-0000-0000-0000000000b1', 'bb000000-0000-0000-0000-0000000000b2',
        'bb000000-0000-0000-0000-0000000000c3', 'bb000000-0000-0000-0000-0000000000b4']::uuid[],
  'awards: candidates are the brought builds (all builds only for the host with no pick)');
select results_eq(
  $$ select category, build_id from public.event_awards('ee000000-0000-0000-0000-0000000000d0') order by category $$,
  $$ values ('stance'::text, 'bb000000-0000-0000-0000-0000000000b1'::uuid) $$,
  'awards: votes for a build left at home don''t win; the brought bike does');

-- O votes at W: P's car stayed at home, P's bike came.
select set_config('request.jwt.claims', '{"sub":"a3333333-3333-3333-3333-333333333333","role":"authenticated"}', true);
select throws_ok($$ select public.cast_vote('ee000000-0000-0000-0000-0000000000f0', 'best-in-show', 'bb000000-0000-0000-0000-0000000000c1') $$,
  'P0001', 'That build can''t win this award.', 'cast_vote: not for a build that stayed at home');
select lives_ok($$ select public.cast_vote('ee000000-0000-0000-0000-0000000000f0', 'best-in-show', 'bb000000-0000-0000-0000-0000000000b1') $$,
  'cast_vote: for the build they brought');

-- Deleting a build clears the pick but keeps you going.
select set_config('request.jwt.claims', '{"sub":"a2222222-2222-2222-2222-222222222222","role":"authenticated"}', true);
delete from public.builds where id = 'bb000000-0000-0000-0000-0000000000d1';
select is((select count(*)::text || ':' || coalesce(max(build_id::text), 'none') from public.event_going
  where event_id = 'ee000000-0000-0000-0000-0000000000a0' and user_id = 'a2222222-2222-2222-2222-222222222222'), '1:none',
  'deleting the build clears the pick, not the place');

reset role;
select * from finish();
rollback;

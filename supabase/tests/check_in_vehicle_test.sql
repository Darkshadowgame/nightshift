-- check_in() with no vehicle on record (20261118170000_check_in_vehicle_reminder_words.sql,
-- checkIn() in src/lib/events.ts, REVIEW-6-perf.md item 14) and the reminder wording.
--
-- R: a live rolling meet at stop 2 of 2, cars and bikes, 0 mods. P went as a passenger
-- (no build on record) and checked in at stop 1. Q has a build on record and checked in.
-- B: a live bikes-only meet. P checked in there with no build on record too.

begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(10);

insert into auth.users (id, email) values
  ('c1111111-1111-1111-1111-111111111111', 'host@example.test'),
  ('c2222222-2222-2222-2222-222222222222', 'p@example.test'),
  ('c3333333-3333-3333-3333-333333333333', 'q@example.test');

-- Homes inside the invite radius (Lincoln), so the invite covers their builds.
insert into public.profile_homes (user_id, home) values
  ('c2222222-2222-2222-2222-222222222222', private.pt(53.2051, -0.4949)),
  ('c3333333-3333-3333-3333-333333333333', private.pt(53.2200, -0.5500));

insert into public.builds (id, owner_id, kind, make, model, stock_bhp, weight_kg) values
  ('cb000000-0000-0000-0000-0000000000c2', 'c2222222-2222-2222-2222-222222222222', 'car', 'Honda', 'Civic Type R', 316, 1380),
  ('cb000000-0000-0000-0000-0000000000c3', 'c3333333-3333-3333-3333-333333333333', 'car', 'Ford', 'Focus RS', 345, 1530),
  ('cb000000-0000-0000-0000-0000000000d3', 'c3333333-3333-3333-3333-333333333333', 'car', 'VW', 'Golf R', 316, 1500);

insert into public.events (id, type, title, starts_at, ends_at, reveal_minutes_before, area, area_radius_miles, area_name,
                           invite_everyone, invite_cars, invite_bikes, invite_min_mods, current_stop) values
  ('ce000000-0000-0000-0000-0000000000a0', 'rolling', 'Rolling', now() - interval '40 minutes', now() + interval '3 hours', 60, private.pt(53.22, -0.52), 3, 'Lincoln', false, true, true, 0, 1),
  ('ce000000-0000-0000-0000-0000000000b0', 'meet', 'Bikes only', now() - interval '10 minutes', now() + interval '3 hours', 60, private.pt(53.22, -0.52), 3, 'Lincoln', false, false, true, 0, 0);

insert into public.event_stops (id, event_id, position, name, location, revealed_at) values
  ('ce500000-0000-0000-0000-0000000000a1', 'ce000000-0000-0000-0000-0000000000a0', 0, 'First car park', private.pt(53.30, -0.60), now() - interval '100 minutes'),
  ('ce500000-0000-0000-0000-0000000000a2', 'ce000000-0000-0000-0000-0000000000a0', 1, 'Second car park', private.pt(53.20, -0.50), now() - interval '5 minutes'),
  ('ce500000-0000-0000-0000-0000000000b1', 'ce000000-0000-0000-0000-0000000000b0', 0, 'Bike spot', private.pt(53.20, -0.50), null);

insert into public.event_hosts (event_id, user_id) values
  ('ce000000-0000-0000-0000-0000000000a0', 'c1111111-1111-1111-1111-111111111111'),
  ('ce000000-0000-0000-0000-0000000000b0', 'c1111111-1111-1111-1111-111111111111');

insert into public.event_going (event_id, user_id, build_id) values
  ('ce000000-0000-0000-0000-0000000000a0', 'c2222222-2222-2222-2222-222222222222', null),
  ('ce000000-0000-0000-0000-0000000000a0', 'c3333333-3333-3333-3333-333333333333', 'cb000000-0000-0000-0000-0000000000c3'),
  ('ce000000-0000-0000-0000-0000000000b0', 'c2222222-2222-2222-2222-222222222222', null);

insert into public.check_ins (event_id, user_id, stop_id) values
  ('ce000000-0000-0000-0000-0000000000a0', 'c2222222-2222-2222-2222-222222222222', 'ce500000-0000-0000-0000-0000000000a1'),
  ('ce000000-0000-0000-0000-0000000000a0', 'c3333333-3333-3333-3333-333333333333', 'ce500000-0000-0000-0000-0000000000a1'),
  ('ce000000-0000-0000-0000-0000000000b0', 'c2222222-2222-2222-2222-222222222222', 'ce500000-0000-0000-0000-0000000000b1');

set local role authenticated;

-- P: checked in at stop 1 with nothing on record, now at stop 2 in the Civic.
select set_config('request.jwt.claims', '{"sub":"c2222222-2222-2222-2222-222222222222","role":"authenticated"}', true);
select lives_ok($$ select public.check_in('ce000000-0000-0000-0000-0000000000a0', 1, 53.2010, -0.5010, 'cb000000-0000-0000-0000-0000000000c2') $$,
  'check_in: a build with none on record no longer blocks the next stop');
select is((select build_id from public.event_going where event_id = 'ce000000-0000-0000-0000-0000000000a0' and user_id = 'c2222222-2222-2222-2222-222222222222'),
  'cb000000-0000-0000-0000-0000000000c2'::uuid, 'check_in: ...and the build is recorded');
select ok(exists (select 1 from public.check_ins where event_id = 'ce000000-0000-0000-0000-0000000000a0'
  and user_id = 'c2222222-2222-2222-2222-222222222222' and stop_id = 'ce500000-0000-0000-0000-0000000000a2'),
  'check_in: ...and the check-in at stop 2 is saved');

-- P at the bikes-only meet in the Civic: checked in, nothing recorded, never refused for it.
select lives_ok($$ select public.check_in('ce000000-0000-0000-0000-0000000000b0', 0, 53.2010, -0.5010, 'cb000000-0000-0000-0000-0000000000c2') $$,
  'check_in: a build the invite doesn''t cover, with none on record, doesn''t block the check-in');
select is((select build_id from public.event_going where event_id = 'ce000000-0000-0000-0000-0000000000b0' and user_id = 'c2222222-2222-2222-2222-222222222222'),
  null::uuid, 'check_in: ...and isn''t recorded');

-- Someone else's build is still refused.
select throws_ok($$ select public.check_in('ce000000-0000-0000-0000-0000000000a0', 1, 53.2010, -0.5010, 'cb000000-0000-0000-0000-0000000000c3') $$,
  'P0001', 'That isn''t one of your builds.', 'check_in: never someone else''s build');

-- Q has a build on record and has checked in: changing it is still refused.
select set_config('request.jwt.claims', '{"sub":"c3333333-3333-3333-3333-333333333333","role":"authenticated"}', true);
select throws_ok($$ select public.check_in('ce000000-0000-0000-0000-0000000000a0', 1, 53.2010, -0.5010, 'cb000000-0000-0000-0000-0000000000d3') $$,
  'P0001', 'You''ve checked in, so your vehicle is set for this one.', 'check_in: a recorded build is still set once checked in');
select lives_ok($$ select public.check_in('ce000000-0000-0000-0000-0000000000a0', 1, 53.2010, -0.5010, 'cb000000-0000-0000-0000-0000000000c3') $$,
  'check_in: the same build is fine');

-- Reminder wording: the glossary's "stop unlocked", never "location unlocked".
reset role;
insert into public.events (id, type, title, starts_at, reveal_minutes_before, area, area_radius_miles, area_name, invite_everyone)
  values ('ce000000-0000-0000-0000-0000000000c0', 'meet', 'Reveal soon', now() + interval '55 minutes', 60, private.pt(53.22, -0.52), 3, 'Lincoln', true);
insert into public.event_stops (id, event_id, position, name, location) values
  ('ce500000-0000-0000-0000-0000000000c1', 'ce000000-0000-0000-0000-0000000000c0', 0, 'Reveal spot', private.pt(53.20, -0.50));
insert into public.event_going (event_id, user_id) values ('ce000000-0000-0000-0000-0000000000c0', 'c2222222-2222-2222-2222-222222222222');
select public.queue_due_reminders();
select is((select title from public.notices where user_id = 'c2222222-2222-2222-2222-222222222222' and key = 'ns.ce000000-0000-0000-0000-0000000000c0.reveal'),
  'Reveal soon: stop unlocked', 'reminders: the reveal says "stop unlocked"');
select is((select count(*)::int from public.notices where created_at = now() and (title ilike '%location unlocked%' or body ilike '%location unlocked%')), 0,
  'reminders: no "location unlocked" anywhere');

select * from finish();
rollback;

-- Late joiners and plain words (20261118200000_late_joiners_plain_words.sql, REVIEW-7).
-- Same rule as canSeeStop() in src/lib/events.ts.
--
-- R: a live rolling meet with 3 meet points, now at the 2nd (current_stop 1).
-- E (early) checked in at the 1st and was told when it moved on. L (late) said they're
-- going after it moved on and never checked in. O is not going.

begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(16);

insert into auth.users (id, email) values
  ('d1111111-1111-1111-1111-111111111111', 'lj-host@example.test'),
  ('d2222222-2222-2222-2222-222222222222', 'lj-early@example.test'),
  ('d3333333-3333-3333-3333-333333333333', 'lj-late@example.test'),
  ('d4444444-4444-4444-4444-444444444444', 'lj-out@example.test');

insert into public.events (id, type, title, starts_at, ends_at, reveal_minutes_before, area, area_radius_miles, area_name, invite_everyone, current_stop) values
  ('de000000-0000-0000-0000-0000000000a1', 'rolling', 'Late joiner test', now() - interval '1 hour', now() + interval '2 hours', 60, private.pt(53.22, -0.52), 9, 'Lincoln', true, 0);
insert into public.event_stops (id, event_id, position, name, location) values
  ('d5000000-0000-0000-0000-000000000000', 'de000000-0000-0000-0000-0000000000a1', 0, 'First car park', private.pt(53.20, -0.50)),
  ('d5000000-0000-0000-0000-000000000001', 'de000000-0000-0000-0000-0000000000a1', 1, 'Second car park', private.pt(53.25, -0.45)),
  ('d5000000-0000-0000-0000-000000000002', 'de000000-0000-0000-0000-0000000000a1', 2, 'Third car park', private.pt(53.30, -0.40));
insert into public.event_hosts (event_id, user_id) values ('de000000-0000-0000-0000-0000000000a1', 'd1111111-1111-1111-1111-111111111111');
insert into public.event_going (event_id, user_id) values ('de000000-0000-0000-0000-0000000000a1', 'd2222222-2222-2222-2222-222222222222');
insert into public.check_ins (event_id, user_id, stop_id) values
  ('de000000-0000-0000-0000-0000000000a1', 'd2222222-2222-2222-2222-222222222222', 'd5000000-0000-0000-0000-000000000000');

-- The host moves it on.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"d1111111-1111-1111-1111-111111111111","role":"authenticated"}', true);
select results_eq($$ select * from public.move_on('de000000-0000-0000-0000-0000000000a1') $$,
  $$ values ('d2222222-2222-2222-2222-222222222222'::uuid) $$,
  'move on: only people checked in at the meet point being left are told');
reset role;
select is((select body from public.notices where user_id = 'd2222222-2222-2222-2222-222222222222' and kind = 'moved'),
  'Meet point 2 is shown. Open Nightshift to see where.', 'move on: the notice says "meet point … is shown", never the place');
select is((select count(*)::int from public.notices where user_id = 'd3333333-3333-3333-3333-333333333333'), 0,
  'move on: someone who joins later gets no "moved on" notice');
select is((select text from public.plan_changes where event_id = 'de000000-0000-0000-0000-0000000000a1' and kind = 'move_on'),
  'Moved on to meet point 2, Second car park.', 'move on: the hosts'' log says "meet point"');

-- L joins late.
insert into public.event_going (event_id, user_id) values ('de000000-0000-0000-0000-0000000000a1', 'd3333333-3333-3333-3333-333333333333');
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"d3333333-3333-3333-3333-333333333333","role":"authenticated"}', true);
select ok((select visible from public.get_event_stops(array['de000000-0000-0000-0000-0000000000a1'::uuid]) where position = 1),
  'late joiner: sees the meet point it is at now');
select is((select name from public.get_event_stops(array['de000000-0000-0000-0000-0000000000a1'::uuid]) where position = 1),
  'Second car park', 'late joiner: with its name and place');
select ok(not (select visible from public.get_event_stops(array['de000000-0000-0000-0000-0000000000a1'::uuid]) where position = 2),
  'late joiner: never the one after it');
select is((select lat from public.get_event_stops(array['de000000-0000-0000-0000-0000000000a1'::uuid]) where position = 2), null,
  'late joiner: the next one comes back with no place');
select is((select shown_stop from public.events_for_me() where event_id = 'de000000-0000-0000-0000-0000000000a1'), 1,
  'late joiner: events_for_me() shows the current meet point');
select throws_ok($$ select public.check_in('de000000-0000-0000-0000-0000000000a1', 2, 53.30, -0.40) $$,
  'P0001', 'You can''t see this meet point yet.', 'late joiner: cannot check in ahead');
select throws_ok($$ select public.check_in('de000000-0000-0000-0000-0000000000a1', 0, 53.20, -0.50) $$,
  'P0001', 'The meet has moved on. Check in at the meet point it is at now.', 'late joiner: cannot check in where it has left');
select lives_ok($$ select public.check_in('de000000-0000-0000-0000-0000000000a1', 1, 53.2503, -0.4502) $$,
  'late joiner: checks in at the current meet point');

-- Early: still sees where it was and where it is.
select set_config('request.jwt.claims', '{"sub":"d2222222-2222-2222-2222-222222222222","role":"authenticated"}', true);
select ok((select bool_and(visible) from public.get_event_stops(array['de000000-0000-0000-0000-0000000000a1'::uuid]) where position <= 1),
  'early: sees the first and the current meet point');

-- O: not going, sees nothing.
select set_config('request.jwt.claims', '{"sub":"d4444444-4444-4444-4444-444444444444","role":"authenticated"}', true);
select is((select count(*)::int from public.get_event_stops(array['de000000-0000-0000-0000-0000000000a1'::uuid])), 0,
  'not going: no meet point rows at all');
reset role;

-- No minimum mods by default.
select is((select column_default from information_schema.columns where table_schema = 'public' and table_name = 'events' and column_name = 'invite_min_mods'),
  '0', 'invites: no minimum mods unless the host sets one');

-- Reminders say "location shown".
insert into public.events (id, type, title, starts_at, reveal_minutes_before, area, area_radius_miles, area_name, invite_everyone)
  values ('de000000-0000-0000-0000-0000000000b1', 'meet', 'Shows soon', now() + interval '55 minutes', 60, private.pt(53.22, -0.52), 3, 'Lincoln', true);
insert into public.event_stops (id, event_id, position, name, location) values
  ('d5000000-0000-0000-0000-000000000010', 'de000000-0000-0000-0000-0000000000b1', 0, 'Soon spot', private.pt(53.20, -0.50));
insert into public.event_going (event_id, user_id) values ('de000000-0000-0000-0000-0000000000b1', 'd3333333-3333-3333-3333-333333333333');
select public.queue_due_reminders();
select is((select title from public.notices where user_id = 'd3333333-3333-3333-3333-333333333333' and key = 'ns.de000000-0000-0000-0000-0000000000b1.reveal'),
  'Shows soon: location shown', 'reminders: "location shown", not "stop unlocked"');

select * from finish();
rollback;

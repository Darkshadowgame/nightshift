-- Meet level-up (20261122140000_lvl_meets.sql; the app's rules are src/lib/meetExtras.ts).
--
-- M: a future meet open to everyone near Lincoln, capacity 2, hosted by H. A is going. B, C and X
-- have a build and a home near the meet. W: a later "Weekly" meet by H with A going and N going.
-- P1 and P2 are finished "weekly" meets by H: P1 checked in A, B and C; P2 checked in A and B.

begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(30);

insert into auth.users (id, email) values
  ('f1111111-1111-1111-1111-111111111111', 'lm-h@example.test'),
  ('f2222222-2222-2222-2222-222222222222', 'lm-a@example.test'),
  ('f3333333-3333-3333-3333-333333333333', 'lm-b@example.test'),
  ('f4444444-4444-4444-4444-444444444444', 'lm-c@example.test'),
  ('f5555555-5555-5555-5555-555555555555', 'lm-x@example.test'),
  ('f6666666-6666-6666-6666-666666666666', 'lm-n@example.test');
update public.profiles set handle = 'lm_' || right(id::text, 4), display_name = 'Person ' || right(id::text, 4), region = 'East', onboarded = true
  where id::text like 'f_______-____-____-____-____________';
insert into public.profile_homes (user_id, home)
  select u, private.pt(53.21, -0.50) from unnest(array[
    'f2222222-2222-2222-2222-222222222222', 'f3333333-3333-3333-3333-333333333333', 'f4444444-4444-4444-4444-444444444444',
    'f5555555-5555-5555-5555-555555555555', 'f6666666-6666-6666-6666-666666666666']::uuid[]) u;
insert into public.builds (id, owner_id, kind, make, model, stock_bhp, weight_kg)
  select ('fb000000-0000-0000-0000-00000000000' || n)::uuid, u, 'car', 'Make', 'Model ' || n, 150, 1200
  from (values (1, 'f2222222-2222-2222-2222-222222222222'::uuid), (2, 'f3333333-3333-3333-3333-333333333333'::uuid),
               (3, 'f4444444-4444-4444-4444-444444444444'::uuid), (4, 'f5555555-5555-5555-5555-555555555555'::uuid)) v(n, u);

insert into public.events (id, type, title, starts_at, ends_at, reveal_minutes_before, area, area_radius_miles, area_name, invite_everyone, current_stop, capacity) values
  ('fe000000-0000-0000-0000-0000000000a1', 'meet', 'Capacity meet', now() + interval '2 days', now() + interval '2 days 3 hours', 60, private.pt(53.22, -0.52), 25, 'Lincoln', true, 0, 2),
  ('fe000000-0000-0000-0000-0000000000a2', 'meet', 'Weekly', now() + interval '3 days', now() + interval '3 days 3 hours', 60, private.pt(53.22, -0.52), 25, 'Lincoln', true, 0, null),
  ('fe000000-0000-0000-0000-0000000000b1', 'meet', 'Weekly', now() - interval '10 days', now() - interval '10 days' + interval '3 hours', 60, private.pt(53.22, -0.52), 25, 'Lincoln', true, 0, null),
  ('fe000000-0000-0000-0000-0000000000b2', 'meet', 'weekly', now() - interval '3 days', now() - interval '3 days' + interval '3 hours', 60, private.pt(53.22, -0.52), 25, 'Lincoln', true, 0, null);
insert into public.event_stops (id, event_id, position, name, location) values
  ('fe500000-0000-0000-0000-0000000000b1', 'fe000000-0000-0000-0000-0000000000b1', 0, 'Old car park', private.pt(53.22, -0.52)),
  ('fe500000-0000-0000-0000-0000000000b2', 'fe000000-0000-0000-0000-0000000000b2', 0, 'Old car park', private.pt(53.22, -0.52));
insert into public.event_hosts (event_id, user_id)
  select e, 'f1111111-1111-1111-1111-111111111111' from unnest(array[
    'fe000000-0000-0000-0000-0000000000a1', 'fe000000-0000-0000-0000-0000000000a2',
    'fe000000-0000-0000-0000-0000000000b1', 'fe000000-0000-0000-0000-0000000000b2']::uuid[]) e;
insert into public.event_going (event_id, user_id) values
  ('fe000000-0000-0000-0000-0000000000a1', 'f2222222-2222-2222-2222-222222222222'),
  ('fe000000-0000-0000-0000-0000000000a2', 'f2222222-2222-2222-2222-222222222222'),
  ('fe000000-0000-0000-0000-0000000000a2', 'f6666666-6666-6666-6666-666666666666');
insert into public.check_ins (event_id, user_id, stop_id) values
  ('fe000000-0000-0000-0000-0000000000b1', 'f2222222-2222-2222-2222-222222222222', 'fe500000-0000-0000-0000-0000000000b1'),
  ('fe000000-0000-0000-0000-0000000000b1', 'f3333333-3333-3333-3333-333333333333', 'fe500000-0000-0000-0000-0000000000b1'),
  ('fe000000-0000-0000-0000-0000000000b1', 'f4444444-4444-4444-4444-444444444444', 'fe500000-0000-0000-0000-0000000000b1'),
  ('fe000000-0000-0000-0000-0000000000b2', 'f2222222-2222-2222-2222-222222222222', 'fe500000-0000-0000-0000-0000000000b2'),
  ('fe000000-0000-0000-0000-0000000000b2', 'f3333333-3333-3333-3333-333333333333', 'fe500000-0000-0000-0000-0000000000b2');

-- Table.
select has_column('public', 'events', 'capacity', 'table: events has capacity');
select has_column('public', 'events', 'rules', 'table: events has rules');
select throws_ok($$ update public.events set rules = array['not-a-rule'] where id = 'fe000000-0000-0000-0000-0000000000a1' $$,
  '23514', null, 'table: rules must come from the standard list');
select is(has_function_privilege('anon', 'public.set_meet_status(uuid, text)', 'execute'), false, 'privileges: signed-out people can''t set a status');

-- Capacity: B takes the last place, C is turned away and waits.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"f3333333-3333-3333-3333-333333333333","role":"authenticated"}', true);
select is(public.set_going('fe000000-0000-0000-0000-0000000000a1', true), 'going', 'capacity: a place is free, B goes');
select set_config('request.jwt.claims', '{"sub":"f4444444-4444-4444-4444-444444444444","role":"authenticated"}', true);
select throws_ok($$ select public.set_going('fe000000-0000-0000-0000-0000000000a1', true) $$, null, 'This meet is full. Join the waitlist and you move up if someone drops out.', 'capacity: full, so C can''t go');
select lives_ok($$ select public.join_waitlist('fe000000-0000-0000-0000-0000000000a1') $$, 'waitlist: C joins');
select is((select count(*)::int from public.event_waitlist where event_id = 'fe000000-0000-0000-0000-0000000000a1'), 1, 'waitlist: C sees their own place');
select set_config('request.jwt.claims', '{"sub":"f2222222-2222-2222-2222-222222222222","role":"authenticated"}', true);
select is((select count(*)::int from public.event_waitlist where event_id = 'fe000000-0000-0000-0000-0000000000a1'), 0, 'waitlist: people going can''t read it');

-- A drops out: C moves up and is told.
select is(public.set_going('fe000000-0000-0000-0000-0000000000a1', false), 'none', 'drop out: A leaves');
reset role;
select ok(exists (select 1 from public.event_going where event_id = 'fe000000-0000-0000-0000-0000000000a1' and user_id = 'f4444444-4444-4444-4444-444444444444'), 'drop out: C moved up');
select is((select count(*)::int from public.event_waitlist where event_id = 'fe000000-0000-0000-0000-0000000000a1'), 0, 'drop out: the waitlist is empty');
select ok(exists (select 1 from public.notices where user_id = 'f4444444-4444-4444-4444-444444444444' and event_id = 'fe000000-0000-0000-0000-0000000000a1'), 'drop out: C got a notice');

-- Status: B (going) says running late; C (going) and the host see it; X (not going) doesn't.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"f3333333-3333-3333-3333-333333333333","role":"authenticated"}', true);
select lives_ok($$ select public.set_meet_status('fe000000-0000-0000-0000-0000000000a1', 'late') $$, 'status: B says running late');
select set_config('request.jwt.claims', '{"sub":"f4444444-4444-4444-4444-444444444444","role":"authenticated"}', true);
select is((select count(*)::int from public.event_status where event_id = 'fe000000-0000-0000-0000-0000000000a1'), 1, 'status: people going see it');
select set_config('request.jwt.claims', '{"sub":"f5555555-5555-5555-5555-555555555555","role":"authenticated"}', true);
select is((select count(*)::int from public.event_status where event_id = 'fe000000-0000-0000-0000-0000000000a1'), 0, 'status: someone not going doesn''t');
select throws_ok($$ select public.set_meet_status('fe000000-0000-0000-0000-0000000000a1', 'late') $$, null, 'Say you''re going first.', 'status: only people going can set one');
select set_config('request.jwt.claims', '{"sub":"f3333333-3333-3333-3333-333333333333","role":"authenticated"}', true);
select throws_ok($$ select public.set_meet_status('fe000000-0000-0000-0000-0000000000a1', 'asleep') $$, null, 'Pick running late or left.', 'status: only late or left');
select lives_ok($$ select public.set_meet_status('fe000000-0000-0000-0000-0000000000a1', null) $$, 'status: null clears it');

-- Options and co-hosts are for hosts.
select throws_ok($$ select public.set_meet_options('fe000000-0000-0000-0000-0000000000a1', 5, array['litter']) $$, null, 'Only hosts can change that.', 'options: B isn''t a host');
select throws_ok($$ select public.add_cohost('fe000000-0000-0000-0000-0000000000a1', 'f5555555-5555-5555-5555-555555555555') $$, null, 'Only hosts can add a co-host.', 'co-host: B can''t add one');
select set_config('request.jwt.claims', '{"sub":"f1111111-1111-1111-1111-111111111111","role":"authenticated"}', true);
select lives_ok($$ select public.set_meet_options('fe000000-0000-0000-0000-0000000000a1', 5, array['litter', 'no-revving']) $$, 'options: the host sets places and rules');
select throws_ok($$ select public.set_meet_options('fe000000-0000-0000-0000-0000000000a1', 5, array['wear-a-hat']) $$, null, 'Pick rules from the list.', 'options: a rule off the list is refused');
select lives_ok($$ select public.add_cohost('fe000000-0000-0000-0000-0000000000a1', 'f5555555-5555-5555-5555-555555555555') $$, 'co-host: the host adds X');
select throws_ok($$ select public.add_cohost('fe000000-0000-0000-0000-0000000000a1', 'f5555555-5555-5555-5555-555555555555') $$, null, 'They already host this one.', 'co-host: not twice');

-- History: two earlier runs (3 and 2 people), so typical is 2. The host also sees regulars and newcomers.
select is(public.meet_stats('fe000000-0000-0000-0000-0000000000a2'), '{"runs": 2, "typical": 2, "regulars": 1, "newcomers": 1}'::jsonb, 'meet_stats: host sees runs, typical turnout, regulars and newcomers');
select set_config('request.jwt.claims', '{"sub":"f2222222-2222-2222-2222-222222222222","role":"authenticated"}', true);
select is(public.meet_stats('fe000000-0000-0000-0000-0000000000a2')->>'regulars', null, 'meet_stats: people going don''t get the regulars count');
select is((public.meet_stats('fe000000-0000-0000-0000-0000000000a2')->>'runs')::int, 2, 'meet_stats: but they do see how often it has run');

select set_config('request.jwt.claims', '{"sub":"f5555555-5555-5555-5555-555555555555","role":"authenticated"}', true);
select throws_ok($$ select public.meet_stats('fe000000-0000-0000-0000-0000000000a2') $$, null, 'Event not found.', 'meet_stats: someone with no part in the meet gets nothing');
reset role;
select ok(private.is_event_host('fe000000-0000-0000-0000-0000000000a1', 'f5555555-5555-5555-5555-555555555555'), 'co-host: X can now host the meet');

select finish();
rollback;

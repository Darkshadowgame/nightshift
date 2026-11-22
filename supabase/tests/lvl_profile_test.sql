-- Level-up, profile area (20261122170000): quiet alert, "Seen in person", host records.
-- Users (made up): H hosts; A, B, C, D go to meets; O owns the vehicle; X is not at any meet.
-- E1 is a finished meet (A, B, C, D and O checked in). L is a meet on now (A and B going, A checked in).
-- Everything rolls back.

begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(21);

insert into auth.users (id, email) values
  ('f0000000-0000-0000-0000-00000000000a', 'lp-a@example.test'),
  ('f0000000-0000-0000-0000-00000000000b', 'lp-b@example.test'),
  ('f0000000-0000-0000-0000-00000000000c', 'lp-c@example.test'),
  ('f0000000-0000-0000-0000-00000000000d', 'lp-d@example.test'),
  ('f0000000-0000-0000-0000-00000000000e', 'lp-h@example.test'),
  ('f0000000-0000-0000-0000-00000000000f', 'lp-o@example.test'),
  ('f0000000-0000-0000-0000-000000000010', 'lp-x@example.test');
update public.profiles set handle = 'lp_' || right(id::text, 2), display_name = 'Person ' || right(id::text, 2), region = 'East', onboarded = true
  where id::text like 'f0000000-%';

insert into public.builds (id, owner_id, kind, make, model, stock_bhp, weight_kg) values
  ('f1000000-0000-0000-0000-00000000000f', 'f0000000-0000-0000-0000-00000000000f', 'car', 'Mazda', 'MX-5', 158, 1000);

insert into public.events (id, type, title, starts_at, ends_at, reveal_minutes_before, area, area_radius_miles, area_name,
                           invite_everyone, invite_cars, invite_bikes, invite_min_mods) values
  ('f2000000-0000-0000-0000-0000000000e1', 'meet', 'Finished meet', now() - interval '5 hours', null, 60, private.pt(53.22, -0.52), 3, 'Lincoln', true, true, true, 0),
  ('f2000000-0000-0000-0000-0000000000a1', 'meet', 'Live meet', now() - interval '1 hour', now() + interval '3 hours', 60, private.pt(53.22, -0.52), 3, 'Lincoln', true, true, true, 0);
insert into public.event_stops (id, event_id, position, name, location, revealed_at) values
  ('f3000000-0000-0000-0000-0000000000e1', 'f2000000-0000-0000-0000-0000000000e1', 0, 'Car park', private.pt(53.20, -0.50), null),
  ('f3000000-0000-0000-0000-0000000000a1', 'f2000000-0000-0000-0000-0000000000a1', 0, 'Car park', private.pt(53.20, -0.50), null);
insert into public.event_hosts (event_id, user_id) values
  ('f2000000-0000-0000-0000-0000000000e1', 'f0000000-0000-0000-0000-00000000000e'),
  ('f2000000-0000-0000-0000-0000000000a1', 'f0000000-0000-0000-0000-00000000000e');
insert into public.event_going (event_id, user_id) values
  ('f2000000-0000-0000-0000-0000000000a1', 'f0000000-0000-0000-0000-00000000000a'),
  ('f2000000-0000-0000-0000-0000000000a1', 'f0000000-0000-0000-0000-00000000000b');
insert into public.check_ins (event_id, user_id, stop_id) values
  ('f2000000-0000-0000-0000-0000000000e1', 'f0000000-0000-0000-0000-00000000000a', 'f3000000-0000-0000-0000-0000000000e1'),
  ('f2000000-0000-0000-0000-0000000000e1', 'f0000000-0000-0000-0000-00000000000b', 'f3000000-0000-0000-0000-0000000000e1'),
  ('f2000000-0000-0000-0000-0000000000e1', 'f0000000-0000-0000-0000-00000000000c', 'f3000000-0000-0000-0000-0000000000e1'),
  ('f2000000-0000-0000-0000-0000000000e1', 'f0000000-0000-0000-0000-00000000000d', 'f3000000-0000-0000-0000-0000000000e1'),
  ('f2000000-0000-0000-0000-0000000000e1', 'f0000000-0000-0000-0000-00000000000f', 'f3000000-0000-0000-0000-0000000000e1'),
  ('f2000000-0000-0000-0000-0000000000a1', 'f0000000-0000-0000-0000-00000000000a', 'f3000000-0000-0000-0000-0000000000a1');

select is(has_function_privilege('anon', 'public.quiet_alert(uuid)', 'execute'), false, 'privileges: signed-out people can''t send a quiet alert');
select is(has_function_privilege('anon', 'public.host_records(uuid[])', 'execute'), false, 'privileges: signed-out people can''t read host records');

-- Quiet alert.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"f0000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select lives_ok($$ select public.quiet_alert('f2000000-0000-0000-0000-0000000000a1') $$, 'quiet_alert: someone at the meet can send one');
select lives_ok($$ select public.quiet_alert('f2000000-0000-0000-0000-0000000000a1') $$, 'quiet_alert: sending again is fine');
select set_config('request.jwt.claims', '{"sub":"f0000000-0000-0000-0000-00000000000c","role":"authenticated"}', true);
select throws_ok($$ select public.quiet_alert('f2000000-0000-0000-0000-0000000000a1') $$, null, 'Only people going to this meet can do that.', 'quiet_alert: not for a meet you are not going to');
select set_config('request.jwt.claims', '{"sub":"f0000000-0000-0000-0000-000000000010","role":"authenticated"}', true);
select throws_ok($$ select public.quiet_alert('f2000000-0000-0000-0000-0000000000a1') $$, null, 'Only people going to this meet can do that.', 'quiet_alert: a stranger can''t');
select set_config('request.jwt.claims', '{"sub":"f0000000-0000-0000-0000-00000000000e","role":"authenticated"}', true);
select throws_ok($$ select public.quiet_alert('f2000000-0000-0000-0000-0000000000a1') $$, null, 'You''re a host of this meet. Use Cancel or Plan changes.', 'quiet_alert: hosts use the host tools');
select set_config('request.jwt.claims', '{"sub":"f0000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
select throws_ok($$ select count(*) from public.quiet_alerts $$, '42501', null, 'quiet_alert: other people at the meet can''t read who sent one');

reset role;
select is((select count(*)::int from public.notices where user_id = 'f0000000-0000-0000-0000-00000000000e' and key like 'quiet.%'), 1, 'quiet_alert: the host got one notice, not two');
select is((select count(*)::int from public.notices where user_id = 'f0000000-0000-0000-0000-00000000000e' and key like 'quiet.%' and body like '%lp_0a%'), 0, 'quiet_alert: the notice never names the sender');
select is((select count(*)::int from public.reports where target = 'event' and target_id = 'f2000000-0000-0000-0000-0000000000a1' and reporter_id = 'f0000000-0000-0000-0000-00000000000a'), 1, 'quiet_alert: staff get it as a report on the meet');

-- Seen in person.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"f0000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select lives_ok($$ select public.confirm_vehicle_seen('f1000000-0000-0000-0000-00000000000f', 'f2000000-0000-0000-0000-0000000000e1') $$, 'seen: someone who was at the same meet can confirm');
select throws_ok($$ select public.confirm_vehicle_seen('f1000000-0000-0000-0000-00000000000f', 'f2000000-0000-0000-0000-0000000000e1') $$, null, 'You''ve already confirmed this one.', 'seen: once per person');
select is((select mine from public.vehicle_seen(array['f1000000-0000-0000-0000-00000000000f']::uuid[])), true, 'seen: you can see you confirmed it');
select set_config('request.jwt.claims', '{"sub":"f0000000-0000-0000-0000-000000000010","role":"authenticated"}', true);
select throws_ok($$ select public.confirm_vehicle_seen('f1000000-0000-0000-0000-00000000000f', 'f2000000-0000-0000-0000-0000000000e1') $$, null, 'Only people who were both at the same meet can confirm this.', 'seen: not if you weren''t there');
select set_config('request.jwt.claims', '{"sub":"f0000000-0000-0000-0000-00000000000f","role":"authenticated"}', true);
select throws_ok($$ select public.confirm_vehicle_seen('f1000000-0000-0000-0000-00000000000f', 'f2000000-0000-0000-0000-0000000000e1') $$, null, 'You can''t confirm your own vehicle.', 'seen: not your own');
select set_config('request.jwt.claims', '{"sub":"f0000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
select lives_ok($$ select public.confirm_vehicle_seen('f1000000-0000-0000-0000-00000000000f', 'f2000000-0000-0000-0000-0000000000e1') $$, 'seen: a second person');
select set_config('request.jwt.claims', '{"sub":"f0000000-0000-0000-0000-00000000000c","role":"authenticated"}', true);
select lives_ok($$ select public.confirm_vehicle_seen('f1000000-0000-0000-0000-00000000000f', 'f2000000-0000-0000-0000-0000000000e1') $$, 'seen: a third person');
select is((select witnesses from public.vehicle_seen(array['f1000000-0000-0000-0000-00000000000f']::uuid[])), 3, 'seen: three different people, so the mark shows');

-- Host records: the finished meet counts, the live one doesn't; an upheld report shows.
select is((select meets_run from public.host_records(array['f0000000-0000-0000-0000-00000000000e']::uuid[])), 1, 'host_records: only the meet that ran counts');
reset role;
insert into public.reports (reporter_id, target, target_id, target_user, reason, status)
  values ('f0000000-0000-0000-0000-00000000000d', 'event', 'f2000000-0000-0000-0000-0000000000e1', null, 'other', 'actioned');
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"f0000000-0000-0000-0000-00000000000c","role":"authenticated"}', true);
select is((select upheld from public.host_records(array['f0000000-0000-0000-0000-00000000000e']::uuid[])), 1, 'host_records: an upheld report is counted');

select * from finish();
rollback;

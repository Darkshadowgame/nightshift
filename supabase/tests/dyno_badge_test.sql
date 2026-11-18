-- The "Dyno proven" badge (20261119100100): decided by the server from the runs,
-- never settable; staff removal is logged; a fake sheet can be reported.
-- Everything rolls back.
--
-- Users (made up): O owner, X someone else, M a moderator.

begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(16);

insert into auth.users (id, email) values
  ('ea000000-0000-0000-0000-000000000001', 'db-o@example.test'),
  ('ea000000-0000-0000-0000-000000000002', 'db-x@example.test'),
  ('ea000000-0000-0000-0000-000000000003', 'db-m@example.test');
update public.profiles set handle = 'dynob_' || right(id::text, 1), display_name = 'Dyno badge ' || right(id::text, 1), region = 'Midlands', onboarded = true
  where id::text like 'ea000000-0000-0000-0000-00000000000%';
insert into public.staff (user_id, role, note) values ('ea000000-0000-0000-0000-000000000003', 'moderator', 'test');
-- A car (dyno_bhp from a wheel run: 306 / 0.85 = 360) and a car with an old run.
insert into public.builds (id, owner_id, kind, make, model, stock_bhp, weight_kg, dyno_bhp) values
  ('ea000000-0000-0000-0000-0000000000b1', 'ea000000-0000-0000-0000-000000000001', 'car', 'Honda', 'Civic Type R', 316, 1380, 360),
  ('ea000000-0000-0000-0000-0000000000b2', 'ea000000-0000-0000-0000-000000000001', 'car', 'Ford', 'Focus RS', 345, 1599, 400);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"ea000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
insert into public.build_dyno_runs (build_id, run_on, power_bhp, measured_at, storage_path, position) values
  ('ea000000-0000-0000-0000-0000000000b1', current_date - 30, 306, 'wheels', 'ea000000-0000-0000-0000-000000000001/builds/b1/sheet.jpg', 0),
  ('ea000000-0000-0000-0000-0000000000b2', current_date - 900, 400, 'crank', 'ea000000-0000-0000-0000-000000000001/builds/b2/sheet.jpg', 0);

select is((select dyno_verified from public.dyno_badges(array['ea000000-0000-0000-0000-0000000000b1'::uuid])), true, 'rules: a recent wheel run with its sheet, matching within 2%: proven');
select is((select dyno_old::text || ' ' || dyno_year from public.dyno_badges(array['ea000000-0000-0000-0000-0000000000b2'::uuid])),
  'true ' || extract(year from current_date - 900)::int, 'rules: over two years old reads as an old run with its year');
select is((select dyno_verified from public.dyno_badges(array['ea000000-0000-0000-0000-0000000000b2'::uuid])), false, 'rules: an old run isn''t proof');

-- Edit bhp by hand: the badge goes; back within 2%: it's back.
update public.builds set dyno_bhp = 400 where id = 'ea000000-0000-0000-0000-0000000000b1';
select is((select dyno_verified from public.dyno_badges(array['ea000000-0000-0000-0000-0000000000b1'::uuid])), false, 'rules: power edited away from the run loses it');
update public.builds set dyno_bhp = 365 where id = 'ea000000-0000-0000-0000-0000000000b1';
select is((select dyno_verified from public.dyno_badges(array['ea000000-0000-0000-0000-0000000000b1'::uuid])), true, 'rules: within 2% again, it''s back');

-- A newer run without a sheet: no badge (the latest run counts).
insert into public.build_dyno_runs (build_id, run_on, power_bhp, measured_at, position) values ('ea000000-0000-0000-0000-0000000000b1', current_date, 310, 'wheels', 1);
select is((select dyno_verified from public.dyno_badges(array['ea000000-0000-0000-0000-0000000000b1'::uuid])), false, 'rules: the latest run needs its sheet photo');
delete from public.build_dyno_runs where build_id = 'ea000000-0000-0000-0000-0000000000b1' and storage_path is null;

-- Nobody can set it: not a column, and the removals table is closed.
select hasnt_column('public', 'builds', 'dyno_verified', 'builds has no dyno_verified column to set');
select hasnt_column('public', 'build_dyno_runs', 'dyno_verified', 'build_dyno_runs has no dyno_verified column to set');
select throws_ok($$ insert into public.dyno_badge_removals (storage_path) values ('x') $$, '42501', null, 'removals: users can''t write them');
select throws_ok($$ select public.remove_dyno_badge((select id from public.build_dyno_runs where build_id = 'ea000000-0000-0000-0000-0000000000b1' limit 1), 'mine') $$,
  'P0001', 'Only staff can do that.', 'remove: staff only');

-- Someone reports the sheet as fake.
select set_config('request.jwt.claims', '{"sub":"ea000000-0000-0000-0000-000000000002","role":"authenticated"}', true);
select is((select dyno_verified from public.dyno_badges(array['ea000000-0000-0000-0000-0000000000b1'::uuid])), true, 'others: see the same badge');
select lives_ok($$ select public.report_content('build', 'ea000000-0000-0000-0000-0000000000b1', 'fake_dyno', 'The sheet looks edited') $$, 'report: "Fake or edited dyno sheet" on a build');

-- Staff take the badge off; it's logged; saving the runs again doesn't bring it back.
select set_config('request.jwt.claims', '{"sub":"ea000000-0000-0000-0000-000000000003","role":"authenticated"}', true);
select lives_ok($$ select public.remove_dyno_badge((select id from public.build_dyno_runs where build_id = 'ea000000-0000-0000-0000-0000000000b1' limit 1), 'Edited sheet') $$, 'remove: a moderator takes the badge off');
reset role;
select is((select count(*)::int from public.moderation_actions where action = 'remove_dyno' and target_id = 'ea000000-0000-0000-0000-0000000000b1' and actor_id = 'ea000000-0000-0000-0000-000000000003'), 1,
  'remove: in the audit log');
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"ea000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
delete from public.build_dyno_runs where build_id = 'ea000000-0000-0000-0000-0000000000b1';
insert into public.build_dyno_runs (build_id, run_on, power_bhp, measured_at, storage_path, position) values
  ('ea000000-0000-0000-0000-0000000000b1', current_date - 30, 306, 'wheels', 'ea000000-0000-0000-0000-000000000001/builds/b1/sheet.jpg', 0);
select is((select dyno_verified::text || ' ' || removed from public.dyno_badges(array['ea000000-0000-0000-0000-0000000000b1'::uuid])), 'false true', 'remove: saving the same sheet again keeps it off');
select is((select count(*)::int from public.dyno_badges(array['ea000000-0000-0000-0000-0000000000b9'::uuid])), 0, 'no runs: no row');

select * from finish();
rollback;

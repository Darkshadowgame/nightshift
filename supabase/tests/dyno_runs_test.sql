-- Dyno runs (20261119090000): everyone signed in reads, only the build's owner
-- writes, sane figures only, photos in the owner's folder, 20 a build at most.
-- Everything rolls back.
--
-- Users (made up): O owner, X someone else.

begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(12);

insert into auth.users (id, email) values
  ('e9000000-0000-0000-0000-000000000001', 'dy-o@example.test'),
  ('e9000000-0000-0000-0000-000000000002', 'dy-x@example.test');
update public.profiles set handle = 'dyno_' || right(id::text, 1), display_name = 'Dyno ' || right(id::text, 1), region = 'Midlands', onboarded = true
  where id::text like 'e9000000-0000-0000-0000-00000000000%';
insert into public.builds (id, owner_id, kind, make, model, stock_bhp, weight_kg) values
  ('e9000000-0000-0000-0000-0000000000b1', 'e9000000-0000-0000-0000-000000000001', 'car', 'Honda', 'Civic Type R', 316, 1380);

select has_table('public', 'build_dyno_runs', 'the table is there');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"e9000000-0000-0000-0000-000000000001","role":"authenticated"}', true);

select lives_ok($$ insert into public.build_dyno_runs (build_id, run_on, shop, power_bhp, torque_lb_ft, measured_at, power_unit, torque_unit, storage_path)
  values ('e9000000-0000-0000-0000-0000000000b1', '2026-03-12', 'Sample rolling road', 312, 295, 'wheels', 'kW', 'Nm',
          'e9000000-0000-0000-0000-000000000001/builds/e9000000-0000-0000-0000-0000000000b1/sheet.jpg') $$, 'owner: adds a run with its sheet');
select is((select count(*)::int from public.build_dyno_runs where build_id = 'e9000000-0000-0000-0000-0000000000b1'), 1, 'owner: reads it back');
select throws_ok($$ insert into public.build_dyno_runs (build_id, run_on, power_bhp, measured_at) values ('e9000000-0000-0000-0000-0000000000b1', '2026-03-12', 5, 'crank') $$,
  '23514', null, 'figures: no 5 bhp');
select throws_ok($$ insert into public.build_dyno_runs (build_id, run_on, power_bhp, measured_at) values ('e9000000-0000-0000-0000-0000000000b1', '2026-03-12', 300, 'hubs') $$,
  '23514', null, 'figures: wheels or crank only');
select throws_ok($$ insert into public.build_dyno_runs (build_id, run_on, power_bhp, measured_at) values ('e9000000-0000-0000-0000-0000000000b1', current_date + 30, 300, 'crank') $$,
  'P0001', 'The run can''t be in the future.', 'figures: not in the future');
select throws_ok($$ insert into public.build_dyno_runs (build_id, run_on, power_bhp, measured_at, storage_path) values ('e9000000-0000-0000-0000-0000000000b1', '2026-03-12', 300, 'crank', 'someone-else/x.jpg') $$,
  '23514', null, 'photo: only in your own folder');

-- Someone else: reads, can't add, change or remove.
select set_config('request.jwt.claims', '{"sub":"e9000000-0000-0000-0000-000000000002","role":"authenticated"}', true);
select is((select count(*)::int from public.build_dyno_runs where build_id = 'e9000000-0000-0000-0000-0000000000b1'), 1, 'others: read it, like builds');
select throws_ok($$ insert into public.build_dyno_runs (build_id, run_on, power_bhp, measured_at) values ('e9000000-0000-0000-0000-0000000000b1', '2026-03-12', 900, 'crank') $$,
  '42501', null, 'others: can''t add a run to someone''s build');
update public.build_dyno_runs set power_bhp = 900 where build_id = 'e9000000-0000-0000-0000-0000000000b1';
delete from public.build_dyno_runs where build_id = 'e9000000-0000-0000-0000-0000000000b1';
select set_config('request.jwt.claims', '{"sub":"e9000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
select is((select power_bhp::int from public.build_dyno_runs where build_id = 'e9000000-0000-0000-0000-0000000000b1'), 312, 'others: can''t change or remove it');

-- 20 a build at most.
insert into public.build_dyno_runs (build_id, run_on, power_bhp, measured_at)
  select 'e9000000-0000-0000-0000-0000000000b1', '2026-01-01', 300, 'crank' from generate_series(1, 19);
select throws_ok($$ insert into public.build_dyno_runs (build_id, run_on, power_bhp, measured_at) values ('e9000000-0000-0000-0000-0000000000b1', '2026-03-12', 300, 'crank') $$,
  'P0001', 'A build keeps its last 20 dyno runs. Remove an old one first.', 'cap: 20 runs a build');

-- Deleting the build takes its runs.
delete from public.builds where id = 'e9000000-0000-0000-0000-0000000000b1';
select is((select count(*)::int from public.build_dyno_runs where build_id = 'e9000000-0000-0000-0000-0000000000b1'), 0, 'build deleted: runs go too');

select * from finish();
rollback;

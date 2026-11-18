-- REVIEW-10 (20261120090000): mods in the same group count once, and Class only uses a
-- dyno figure a run with its sheet backs. Mirrors __tests__/modGroups.test.ts and
-- __tests__/dyno.test.ts. Everything rolls back.
--
-- Users (made up): O owner.

begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(16);

insert into auth.users (id, email) values ('eb000000-0000-0000-0000-000000000001', 'mg-o@example.test');
update public.profiles set handle = 'modgrp_o', display_name = 'Mod groups O', region = 'Midlands', onboarded = true
  where id = 'eb000000-0000-0000-0000-000000000001';

-- B1: Fiesta ST, Stage 1 tune + ECU remap + cold air intake (2 mods, not 3).
-- B2: Civic Type R (316 bhp, 1380 kg, class A on its own) with a typed 450 bhp figure and no sheet.
insert into public.builds (id, owner_id, kind, make, model, stock_bhp, weight_kg, dyno_bhp) values
  ('eb000000-0000-0000-0000-0000000000b1', 'eb000000-0000-0000-0000-000000000001', 'car', 'Ford', 'Fiesta ST', 197, 1262, null),
  ('eb000000-0000-0000-0000-0000000000b2', 'eb000000-0000-0000-0000-000000000001', 'car', 'Honda', 'Civic Type R', 316, 1380, 450);
insert into public.build_mods (build_id, category, name, position) values
  ('eb000000-0000-0000-0000-0000000000b1', 'engine', 'Stage 1 tune', 0),
  ('eb000000-0000-0000-0000-0000000000b1', 'engine', 'ECU remap', 1),
  ('eb000000-0000-0000-0000-0000000000b1', 'intake', 'Cold air intake', 2);

select is(private.mod_unit('Stage 1 tune'), 'g:tune', 'mod_unit: a Stage 1 tune is an engine tune');
select is(private.mod_unit('  ECU   Remap '), 'g:tune', 'mod_unit: an ECU remap is too (case and spaces ignored)');
select is(private.mod_unit('Stage 2+ ECU remap'), 'g:tune', 'mod_unit: typed stage remaps are too');
select is(private.mod_unit('Induction kit'), private.mod_unit('Panel air filter'), 'mod_unit: induction kit and panel filter are one air intake');
select is(private.mod_unit('Coilovers'), 'g:lowering', 'mod_unit: coilovers are lowering');
select is(private.mod_unit('Forged internals'), 'n:forged internals', 'mod_unit: anything else counts by its name');
select is(private.mod_count('eb000000-0000-0000-0000-0000000000b1'), 2, 'mod_count: Stage 1 + ECU remap + intake is 2 mods');
select is(private.build_matches('eb000000-0000-0000-0000-0000000000b1', false, true, true, '{}', 3, '{}'), false, 'build_matches: minimum mods 3 leaves it out');
select is(private.build_matches('eb000000-0000-0000-0000-0000000000b1', false, true, true, '{}', 2, '{}'), true, 'build_matches: minimum mods 2 lets it in');
insert into public.build_mods (build_id, category, name, position) values ('eb000000-0000-0000-0000-0000000000b1', 'suspension', 'Coilovers', 3);
select is(private.build_matches('eb000000-0000-0000-0000-0000000000b1', false, true, true, '{}', 3, '{}'), true, 'build_matches: a different kind of part makes 3');

-- Class: a typed figure with no sheet never changes it.
select is(private.build_class('eb000000-0000-0000-0000-0000000000b2')::text, 'A', 'build_class: a typed 450 bhp with no run is ignored (316 bhp: A)');
insert into public.build_dyno_runs (owner_id, build_id, run_on, power_bhp, measured_at, storage_path, position) values
  ('eb000000-0000-0000-0000-000000000001', 'eb000000-0000-0000-0000-0000000000b2', current_date - 5, 450, 'crank', null, 0);
select is(private.build_class('eb000000-0000-0000-0000-0000000000b2')::text, 'A', 'build_class: a typed run with no sheet photo is ignored');
insert into public.build_dyno_runs (owner_id, build_id, run_on, power_bhp, measured_at, storage_path, position) values
  ('eb000000-0000-0000-0000-000000000001', 'eb000000-0000-0000-0000-0000000000b2', current_date - 30, 450, 'crank', 'eb000000-0000-0000-0000-000000000001/builds/b2/sheet.jpg', 1);
select is(private.build_class('eb000000-0000-0000-0000-0000000000b2')::text, 'S', 'build_class: a run with its sheet backing the figure counts (450 bhp: S)');
update public.builds set dyno_bhp = 500 where id = 'eb000000-0000-0000-0000-0000000000b2';
select is(private.build_class('eb000000-0000-0000-0000-0000000000b2')::text, 'A', 'build_class: a figure the sheet doesn''t back (over 2% off) is ignored');
update public.builds set dyno_bhp = 450 where id = 'eb000000-0000-0000-0000-0000000000b2';
insert into public.dyno_badge_removals (storage_path, build_id, reason) values ('eb000000-0000-0000-0000-000000000001/builds/b2/sheet.jpg', 'eb000000-0000-0000-0000-0000000000b2', 'test');
select is(private.build_class('eb000000-0000-0000-0000-0000000000b2')::text, 'A', 'build_class: a sheet staff took the badge off no longer counts');

select col_is_null('public', 'build_mods', 'note', 'build_mods.note: optional');

select * from finish();
rollback;

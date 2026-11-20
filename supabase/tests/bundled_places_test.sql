-- Slipstream's own drives and photo spots on the server (20261117190000_bundled_places.sql):
-- the bundled_id and limit_mph columns, nobody but the seed writes them, finishing,
-- visiting and rating one through the same RPCs, stats and rep the same for everyone.
-- Works with or without seed_bundled_places.sql: it makes its own fixture rows.
-- Users: A (drives, visits, rates), B (looks).

begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(30);

insert into auth.users (id, email) values
  ('aaaaaaaa-1111-0000-0000-00000000000a', 'bp-a@example.test'),
  ('bbbbbbbb-1111-0000-0000-00000000000b', 'bp-b@example.test');

-- Fixtures, as the seed would make them (postgres): a 1.4 mi drive with a 30 mph limit,
-- and a photo spot. Three checkpoints about 0.7 mi apart.
insert into public.spots (bundled_id, kind, name, description, location, path, miles, limit_mph, region, author_id, status, approved_at)
values
  ('test-bp-drive', 'drive', 'pgTAP bundled drive', 'Fixture.', private.pt(53.0, -1.0),
   extensions.st_geogfromtext('SRID=4326;LINESTRING(-1.0 53.0, -0.98 53.0, -0.96 53.0)'), 1.4, 30, 'Test', null, 'approved', now()),
  ('test-bp-photo', 'photo', 'pgTAP bundled photo spot', 'Fixture.', private.pt(53.1, -1.1), null, null, null, 'Test', null, 'approved', now());

-- ---------------------------------------------------------------------------
-- Shape and rules on the rows
-- ---------------------------------------------------------------------------
select has_column('public', 'spots', 'bundled_id', 'spots.bundled_id exists');
select has_column('public', 'spots', 'limit_mph', 'spots.limit_mph exists');
select has_column('public', 'spots_list', 'bundled_id', 'spots_list exposes bundled_id');
select throws_ok($$ insert into public.spots (bundled_id, kind, name, location, status) values ('test-bp-drive', 'photo', 'pgTAP dup id', private.pt(53, -1), 'approved') $$,
  '23505', null, 'bundled ids are unique');
select throws_ok($$ insert into public.spots (bundled_id, kind, name, location, author_id, status)
                    values ('test-bp-authored', 'photo', 'pgTAP authored', private.pt(53, -1), 'aaaaaaaa-1111-0000-0000-00000000000a', 'approved') $$,
  '23514', null, 'a bundled place has no author');
select throws_ok($$ insert into public.spots (bundled_id, kind, name, location, status) values ('Bad Id!', 'photo', 'pgTAP bad id', private.pt(53, -1), 'approved') $$,
  '23514', null, 'bundled ids are the app''s lower-case ids');
select is((select count(*)::int from public.spots where bundled_id is not null and (author_id is not null or status <> 'approved')), 0,
  'every bundled row (seeded ones too) is approved with no author');
select is((select count(*)::int from public.spots where bundled_id is not null and kind = 'drive' and path is null), 0,
  'every bundled drive has its line');
select is(private.drive_tier_rep(5), 50, 'drive_tier_rep: short');
select is(private.drive_tier_rep(10), 100, 'drive_tier_rep: medium');
select is(private.drive_tier_rep(25), 175, 'drive_tier_rep: long');
select is(private.drive_tier_rep(50), 250, 'drive_tier_rep: epic');
select is(private.drive_tier_rep(null), 100, 'drive_tier_rep: unknown length counts as medium');

-- ---------------------------------------------------------------------------
-- A, signed in: reads it, can't write it, drives it, visits, rates
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-1111-0000-0000-00000000000a","role":"authenticated"}', true);
set local role authenticated;
select lives_ok($$ select public.save_profile('bp_driver', 'A', 'Midlands', 52.9, -1.1) $$, 'A saves a profile');

select is((select bundled_id from public.spots_list where name = 'pgTAP bundled drive'), 'test-bp-drive', 'spots_list: the stable id');
select is((select jsonb_array_length(path) from public.spots_list where bundled_id = 'test-bp-drive'), 3, 'spots_list: the drive''s checkpoints');
select is((select limit_mph from public.spots_list where bundled_id = 'test-bp-drive'), 30::numeric, 'spots_list: the road''s limit');
select throws_ok($$ insert into public.spots (bundled_id, kind, name, location, status) values ('test-bp-mine', 'photo', 'pgTAP mine', private.pt(53, -1), 'approved') $$,
  '42501', null, 'signed in: can''t add a bundled place');
select throws_ok($$ update public.spots set name = 'pgTAP renamed' where bundled_id = 'test-bp-drive' $$, '42501', null, 'signed in: can''t change one');
select throws_ok($$ delete from public.spots where bundled_id = 'test-bp-drive' $$, '42501', null, 'signed in: can''t delete one');

-- 1.4 mi in one minute is over the road's 30 mph: refused (judgeRun() with Spot.limitMph).
select set_config('t.now', ((extract(epoch from now()) * 1000)::bigint - 60000)::text, true);
select is(public.complete_drive((select id from public.spots where bundled_id = 'test-bp-drive'),
  jsonb_build_array(
    jsonb_build_object('lat', 53.0, 'lng', -1.0, 't', current_setting('t.now')::bigint - 60000),
    jsonb_build_object('lat', 53.0, 'lng', -0.98, 't', current_setting('t.now')::bigint - 30000),
    jsonb_build_object('lat', 53.0, 'lng', -0.96, 't', current_setting('t.now')::bigint))) ->> 'reason',
  'That was quicker than these roads allow at the speed limits, so it doesn''t count. Drives are never about speed.',
  'complete_drive: the bundled road''s own limit applies');
-- Four minutes: about 21 mph. Counts.
select is(public.complete_drive((select id from public.spots where bundled_id = 'test-bp-drive'),
  jsonb_build_array(
    jsonb_build_object('lat', 53.0, 'lng', -1.0, 't', current_setting('t.now')::bigint - 240000),
    jsonb_build_object('lat', 53.0, 'lng', -0.98, 't', current_setting('t.now')::bigint - 120000),
    jsonb_build_object('lat', 53.0, 'lng', -0.96, 't', current_setting('t.now')::bigint))),
  '{"ok": true}'::jsonb, 'complete_drive: a bundled drive counts');
select lives_ok($$ select public.rate_spot((select id from public.spots where bundled_id = 'test-bp-drive'), 4) $$, 'rate_spot: rate the bundled drive');
select lives_ok($$ select public.visit_spot((select id from public.spots where bundled_id = 'test-bp-photo'), 53.1005, -1.1, null) $$,
  'visit_spot: check in at the bundled photo spot');

-- ---------------------------------------------------------------------------
-- B sees the same numbers, but not who or when
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"bbbbbbbb-1111-0000-0000-00000000000b","role":"authenticated"}', true);
select is((select people from public.spot_stats(array[(select id from public.spots where bundled_id = 'test-bp-drive')])), 1,
  'spot_stats: B sees one person drove it');
select is((select rating_average from public.spot_stats(array[(select id from public.spots where bundled_id = 'test-bp-drive')])), 4.00::numeric,
  'spot_stats: and the rating');
select is((select count(*)::int from public.spot_completions where user_id = 'aaaaaaaa-1111-0000-0000-00000000000a'), 0,
  'B can''t read A''s completions');
select results_eq(
  $$ select drives, drives_rep, photo_spots from public.place_rep_for(array['aaaaaaaa-1111-0000-0000-00000000000a'::uuid]) $$,
  $$ values (1, 50, 1) $$,
  'place_rep_for: A''s drives (short tier) and photo spots, the same for B as for A');

-- Signed out: nothing
reset role;
set local role anon;
select throws_ok($$ select * from public.spots_list $$, '42501', null, 'spots_list: refused signed out');
select throws_ok($$ select * from public.place_rep_for(array['aaaaaaaa-1111-0000-0000-00000000000a'::uuid]) $$, '42501', null,
  'place_rep_for: refused signed out');
reset role;

select * from finish();
rollback;

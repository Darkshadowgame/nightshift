-- The app's read views, the realtime publication and delete_my_account().
-- Users: A (deletes their account), B (stays).

begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(20);

insert into auth.users (id, email) values
  ('aaaaaaaa-0000-0000-0000-00000000000a', 'a@example.test'),
  ('bbbbbbbb-0000-0000-0000-00000000000b', 'b@example.test');

-- ---------------------------------------------------------------------------
-- A sets up: profile, build, crew, an event only A hosts, a suggested place
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-00000000000a","role":"authenticated"}', true);
set local role authenticated;

select lives_ok($$ select public.save_profile('acct_a', 'A', 'East', 52.2051, 0.1218) $$, 'A saves a profile');
insert into public.builds (kind, make, model, stock_bhp, weight_kg) values ('car', 'Mazda', 'MX-5', 158, 1000);
select set_config('t.crew', public.create_crew('Deleters', 'DEL')::text, true);
select set_config('t.event', (public.save_event(
  jsonb_build_object('type', 'meet', 'title', 'A only', 'starts_at', now() + interval '2 days',
                     'reveal_minutes_before', 60, 'area', jsonb_build_object('lat', 52.23, 'lng', 0.16),
                     'area_radius_miles', 4, 'area_name', 'Cambridge', 'filter', jsonb_build_object('everyone', true)),
  jsonb_build_array(jsonb_build_object('name', 'Car park', 'lat', 52.205, 'lng', 0.12)))->>'id'), true);
select set_config('t.spot', (public.suggest_spot('photo', 'Deleter spot', '', '[{"lat":52.2,"lng":0.12}]'::jsonb)->>'id'), true);

-- Views
select is((select round(lat::numeric, 2) from public.my_home), 52.21::numeric, 'my_home: your own home, as lat (fuzzed)');
select is((select count(*)::int from public.my_home), 1, 'my_home: one row, yours');
select is((select area_name from public.events_list where id = current_setting('t.event')::uuid), 'Cambridge', 'events_list: the event');
select is((select round(area_lat::numeric, 2) from public.events_list where id = current_setting('t.event')::uuid), 52.23::numeric, 'events_list: area as lat');
select is((select round(lat::numeric, 1) from public.spots_list where id = current_setting('t.spot')::uuid), 52.2::numeric,
  'spots_list: your own pending suggestion, with lat');

-- B: can't see A's home or A's pending place
select set_config('request.jwt.claims', '{"sub":"bbbbbbbb-0000-0000-0000-00000000000b","role":"authenticated"}', true);
select lives_ok($$ select public.save_profile('acct_b', 'B', 'East', 52.21, 0.13) $$, 'B saves a profile');
select is((select count(*)::int from public.my_home), 1, 'my_home: B sees only their own home');
select is((select user_id from public.my_home), 'bbbbbbbb-0000-0000-0000-00000000000b'::uuid, 'my_home: and it is B''s');
select is((select count(*)::int from public.spots_list where id = current_setting('t.spot')::uuid), 0, 'spots_list: someone else''s pending place is hidden');
select lives_ok(format('select public.join_crew(%L)', current_setting('t.crew')), 'B joins A''s crew');
select is(public.set_going(current_setting('t.event')::uuid, true), 'going', 'B is going to A''s event');

-- Signed out: nothing
reset role;
set local role anon;
select throws_ok($$ select * from public.events_list $$, '42501', null, 'events_list: refused signed out');
select throws_ok($$ select public.delete_my_account() $$, '42501', null, 'delete_my_account: refused signed out');
reset role;

-- ---------------------------------------------------------------------------
-- A deletes their account
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-00000000000a","role":"authenticated"}', true);
set local role authenticated;
select lives_ok('select public.delete_my_account()', 'delete_my_account: runs');
reset role;

select is((select count(*)::int from auth.users where id = 'aaaaaaaa-0000-0000-0000-00000000000a'), 0, 'auth user gone');
select is((select count(*)::int from public.profiles where id = 'aaaaaaaa-0000-0000-0000-00000000000a')
        + (select count(*)::int from public.builds where owner_id = 'aaaaaaaa-0000-0000-0000-00000000000a')
        + (select count(*)::int from public.profile_homes where user_id = 'aaaaaaaa-0000-0000-0000-00000000000a'), 0,
  'profile, builds and home gone');
select is((select role::text from public.crew_members where user_id = 'bbbbbbbb-0000-0000-0000-00000000000b'), 'owner',
  'the crew is handed over to B');
select isnt((select cancelled_at from public.events where id = current_setting('t.event')::uuid), null,
  'the event only A hosted is cancelled');
select ok((select author_id is null from public.spots where id = current_setting('t.spot')::uuid), 'the suggested place stays, with no author');

select * from finish();
rollback;

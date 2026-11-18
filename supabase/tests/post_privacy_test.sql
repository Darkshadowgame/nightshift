-- A post never gives away a meet point before it shows
-- (20261120100000_post_meet_point_privacy.sql; the app's rule is src/lib/postPrivacy.ts).
--
-- M: a meet tonight, its meet point hidden for another 2 hours (starts in 3, shows 60 min before).
-- R: a live rolling meet at its 1st meet point (current_stop 0), the 2nd still ahead.
-- H hosts both and posts at their meet points. O is going to M (an outsider until it
-- shows). N isn't going to anything. L joins R late. S is staff.
-- Every path that returns a post's place is tried: direct select (and filters),
-- feed_posts() in each scope, and posts_in_box() (the map's Posts layer).

begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(44);

insert into auth.users (id, email) values
  ('e7000000-0000-0000-0000-00000000000a', 'pp-host@example.test'),
  ('e7000000-0000-0000-0000-00000000000b', 'pp-going@example.test'),
  ('e7000000-0000-0000-0000-00000000000c', 'pp-none@example.test'),
  ('e7000000-0000-0000-0000-00000000000d', 'pp-late@example.test'),
  ('e7000000-0000-0000-0000-00000000000e', 'pp-staff@example.test');
update public.profiles set handle = 'pp_' || right(id::text, 1), display_name = 'Person ' || right(id::text, 1), region = 'East', onboarded = true
  where id::text like 'e7000000-0000-0000-0000-0000000000%';
insert into public.profile_homes (user_id, home) values
  ('e7000000-0000-0000-0000-00000000000a', private.pt(52.50, -1.00)),
  ('e7000000-0000-0000-0000-00000000000b', private.pt(52.96, -0.26)),
  ('e7000000-0000-0000-0000-00000000000c', private.pt(52.97, -0.30)),
  ('e7000000-0000-0000-0000-00000000000d', private.pt(52.70, -0.20)),
  ('e7000000-0000-0000-0000-00000000000e', private.pt(52.60, -0.90));
insert into public.staff (user_id, note) values ('e7000000-0000-0000-0000-00000000000e', 'post privacy test');

insert into public.events (id, type, title, starts_at, ends_at, reveal_minutes_before, area, area_radius_miles, area_name, invite_everyone, current_stop) values
  ('e7e00000-0000-0000-0000-0000000000a1', 'meet', 'Post privacy meet', now() + interval '3 hours', now() + interval '6 hours', 60,
   private.pt(52.95, -0.25), 5, 'Testford', true, 0),
  ('e7e00000-0000-0000-0000-0000000000b1', 'rolling', 'Post privacy roll', now() - interval '1 hour', now() + interval '2 hours', 60,
   private.pt(52.80, -0.10), 5, 'Rollham', true, 0);
insert into public.event_stops (id, event_id, position, name, location) values
  ('e7500000-0000-0000-0000-0000000000a0', 'e7e00000-0000-0000-0000-0000000000a1', 0, 'Secret car park', private.pt(52.93, -0.22)),
  ('e7500000-0000-0000-0000-0000000000b0', 'e7e00000-0000-0000-0000-0000000000b1', 0, 'Roll start', private.pt(52.78, -0.08)),
  ('e7500000-0000-0000-0000-0000000000b1', 'e7e00000-0000-0000-0000-0000000000b1', 1, 'Roll second', private.pt(52.82, -0.05));
insert into public.event_hosts (event_id, user_id) values
  ('e7e00000-0000-0000-0000-0000000000a1', 'e7000000-0000-0000-0000-00000000000a'),
  ('e7e00000-0000-0000-0000-0000000000b1', 'e7000000-0000-0000-0000-00000000000a');
insert into public.event_going (event_id, user_id) values
  ('e7e00000-0000-0000-0000-0000000000a1', 'e7000000-0000-0000-0000-00000000000b'),
  ('e7e00000-0000-0000-0000-0000000000b1', 'e7000000-0000-0000-0000-00000000000d');

-- ---------------------------------------------------------------------------
-- H posts at the meet points (the host can see them)
-- ---------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"e7000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select set_config('t.p1', public.create_post('Cars arriving', '{}', 52.9301, -0.2201, 'Secret car park', 'public')::text, true);
select set_config('t.p3', public.create_post('Second leg', '{}', 52.8201, -0.0502, 'Roll second', 'public')::text, true);
reset role;
-- An older post by H near the same meet point that was never linked (made before the
-- link existed, or before the meet point was added).
insert into public.posts (id, author_id, body, location, place_name)
  values ('e7900000-0000-0000-0000-0000000000a2', 'e7000000-0000-0000-0000-00000000000a', 'Older one', private.pt(52.9310, -0.2190), 'Old name');
select set_config('t.p2', 'e7900000-0000-0000-0000-0000000000a2', true);

select is((select event_id from public.posts where id = current_setting('t.p1')::uuid), 'e7e00000-0000-0000-0000-0000000000a1'::uuid,
  'create_post: a post at a meet point is linked to its meet');
select is((select event_id from public.posts where id = current_setting('t.p3')::uuid), 'e7e00000-0000-0000-0000-0000000000b1'::uuid,
  'create_post: the rolling meet''s next meet point links too (the host can see it)');
select is((select place_name from public.posts where id = current_setting('t.p1')::uuid), 'Secret car park',
  'create_post: the author''s own place name is kept');

-- ---------------------------------------------------------------------------
-- O (going to M) before it shows: no place by any path
-- ---------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"e7000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
select ok(not exists (select 1 from public.get_event_stops(array['e7e00000-0000-0000-0000-0000000000a1'::uuid]) where visible),
  'fixture: O can''t see M''s meet point yet');

select throws_ok($$ select location from public.posts $$, '42501', null, 'direct: location can''t be selected');
select throws_ok($$ select place_name from public.posts $$, '42501', null, 'direct: place_name can''t be selected');
select throws_ok($$ select * from public.posts $$, '42501', null, 'direct: select * is refused (it includes the place)');
select throws_ok($$ select id from public.posts where extensions.st_dwithin(location, private.pt(52.93, -0.22), 500) $$, '42501', null,
  'direct: can''t filter on location either');
select throws_ok($$ select id from public.posts where place_name = 'Secret car park' $$, '42501', null,
  'direct: can''t filter on place_name either');
select is((select body from public.posts where id = current_setting('t.p1')::uuid), 'Cars arriving',
  'direct: the rest of the post still reads');
select is((select event_id from public.posts where id = current_setting('t.p1')::uuid), 'e7e00000-0000-0000-0000-0000000000a1'::uuid,
  'direct: event_id reads (the meet, never the place)');

select results_eq(
  $$ select round(lat::numeric, 4), round(lng::numeric, 4), place_name, event_id from public.feed_posts('author', null, 'e7000000-0000-0000-0000-00000000000a') where id = current_setting('t.p1')::uuid $$,
  $$ values (52.95::numeric, -0.25::numeric, null::text, 'e7e00000-0000-0000-0000-0000000000a1'::uuid) $$,
  'feed_posts author: the meet''s area centre, no place name, the meet''s id');
select results_eq(
  $$ select round(lat::numeric, 4), round(lng::numeric, 4), place_name, event_id from public.feed_posts('author', null, 'e7000000-0000-0000-0000-00000000000a') where id = current_setting('t.p2')::uuid $$,
  $$ values (52.95::numeric, -0.25::numeric, null::text, 'e7e00000-0000-0000-0000-0000000000a1'::uuid) $$,
  'feed_posts author: an unlinked post at the meet point is hidden the same way');
select results_eq(
  $$ select round(lat::numeric, 4), place_name from public.feed_posts('local') where id = current_setting('t.p1')::uuid $$,
  $$ values (52.95::numeric, null::text) $$,
  'feed_posts local: the area centre');
select is((select count(*)::int from public.feed_posts('local') where round(lat::numeric, 2) = 52.93), 0,
  'feed_posts local: nothing at the meet point');
select is((select count(*)::int from public.feed_posts('connections') where id in (current_setting('t.p1')::uuid, current_setting('t.p2')::uuid)), 0,
  'feed_posts connections: not connected, so not listed');
select is((select count(*)::int from public.posts_in_box(52.90, -0.30, 53.00, -0.10)
           where id in (current_setting('t.p1')::uuid, current_setting('t.p2')::uuid)), 0,
  'posts_in_box: hidden posts are left off the map');
select is((select count(*)::int from public.posts_in_box(49.8, -8.7, 60.9, 1.9)
           where round(lat::numeric, 2) = 52.93 and round(lng::numeric, 2) = -0.22), 0,
  'posts_in_box: not anywhere in the UK box either');

-- O posts at the hidden meet point: not linked, so a post can't tell anyone it's a meet point.
select set_config('t.p4', public.create_post('Nice spot', '{}', 52.9302, -0.2202, 'Car park', 'public')::text, true);
select is((select event_id from public.posts where id = current_setting('t.p4')::uuid), null,
  'create_post: someone who can''t see the meet point isn''t linked to it (no probing)');
select results_eq(
  $$ select round(lat::numeric, 4), place_name from public.feed_posts('author', null, auth.uid()) where id = current_setting('t.p4')::uuid $$,
  $$ values (52.9302::numeric, 'Car park'::text) $$,
  'feed_posts: O''s own post comes back exact');

-- N sees O's post as it is (it gives nothing away), so nobody can probe with two accounts.
select set_config('request.jwt.claims', '{"sub":"e7000000-0000-0000-0000-00000000000c","role":"authenticated"}', true);
select is((select round(lat::numeric, 4) from public.feed_posts('author', null, 'e7000000-0000-0000-0000-00000000000b') where id = current_setting('t.p4')::uuid),
  52.9302::numeric, 'feed_posts: an unlinked post by someone who can''t see the meet point isn''t masked');
select is((select round(lat::numeric, 4) from public.feed_posts('author', null, 'e7000000-0000-0000-0000-00000000000a') where id = current_setting('t.p1')::uuid),
  52.95::numeric, 'feed_posts: N (not going) gets the area centre too');

-- ---------------------------------------------------------------------------
-- The author and staff see the exact place
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"e7000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select results_eq(
  $$ select round(lat::numeric, 4), round(lng::numeric, 4), place_name from public.feed_posts('author', null, auth.uid()) where id = current_setting('t.p1')::uuid $$,
  $$ values (52.9301::numeric, -0.2201::numeric, 'Secret car park'::text) $$,
  'author: feed_posts gives the exact place and name');
select is((select count(*)::int from public.posts_in_box(52.90, -0.30, 53.00, -0.10) where id = current_setting('t.p1')::uuid), 1,
  'author: on their own map');
select is((select round(lat::numeric, 4) from public.posts_in_box(52.90, -0.30, 53.00, -0.10) where id = current_setting('t.p1')::uuid), 52.9301::numeric,
  'author: at the exact place');

select set_config('request.jwt.claims', '{"sub":"e7000000-0000-0000-0000-00000000000e","role":"authenticated"}', true);
select results_eq(
  $$ select round(lat::numeric, 4), round(lng::numeric, 4), place_name from public.feed_posts('author', null, 'e7000000-0000-0000-0000-00000000000a') where id = current_setting('t.p1')::uuid $$,
  $$ values (52.9301::numeric, -0.2201::numeric, 'Secret car park'::text) $$,
  'staff: feed_posts gives the exact place and name');
select is((select round(lat::numeric, 4) from public.feed_posts('author', null, 'e7000000-0000-0000-0000-00000000000a') where id = current_setting('t.p2')::uuid), 52.9310::numeric,
  'staff: the unlinked one too');
select is((select count(*)::int from public.posts_in_box(52.90, -0.30, 53.00, -0.10) where id in (current_setting('t.p1')::uuid, current_setting('t.p2')::uuid)), 2,
  'staff: both on the map');

-- ---------------------------------------------------------------------------
-- M shows (60 min before the start): O now sees the exact place; N still doesn't
-- ---------------------------------------------------------------------------
reset role;
update public.events set starts_at = now() + interval '30 minutes' where id = 'e7e00000-0000-0000-0000-0000000000a1';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"e7000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
select ok((select bool_and(visible) from public.get_event_stops(array['e7e00000-0000-0000-0000-0000000000a1'::uuid])),
  'fixture: O can see M''s meet point now');
select results_eq(
  $$ select round(lat::numeric, 4), round(lng::numeric, 4), place_name, event_id from public.feed_posts('author', null, 'e7000000-0000-0000-0000-00000000000a') where id = current_setting('t.p1')::uuid $$,
  $$ values (52.9301::numeric, -0.2201::numeric, 'Secret car park'::text, 'e7e00000-0000-0000-0000-0000000000a1'::uuid) $$,
  'after the reveal: O gets the exact place and name');
select is((select round(lat::numeric, 4) from public.feed_posts('author', null, 'e7000000-0000-0000-0000-00000000000a') where id = current_setting('t.p2')::uuid), 52.9310::numeric,
  'after the reveal: the unlinked one too');
select is((select round(lat::numeric, 4) from public.feed_posts('local') where id = current_setting('t.p1')::uuid), 52.9301::numeric,
  'after the reveal: exact in the Local feed');
select is((select count(*)::int from public.posts_in_box(52.90, -0.30, 53.00, -0.10) where id in (current_setting('t.p1')::uuid, current_setting('t.p2')::uuid)), 2,
  'after the reveal: both on O''s map');
select throws_ok($$ select location from public.posts $$, '42501', null, 'after the reveal: still no direct location (the RPCs carry it)');

select set_config('request.jwt.claims', '{"sub":"e7000000-0000-0000-0000-00000000000c","role":"authenticated"}', true);
select is((select round(lat::numeric, 4) from public.feed_posts('author', null, 'e7000000-0000-0000-0000-00000000000a') where id = current_setting('t.p1')::uuid),
  52.95::numeric, 'after the reveal: N (not going) still gets the area centre');
select is((select count(*)::int from public.posts_in_box(52.90, -0.30, 53.00, -0.10) where id = current_setting('t.p1')::uuid), 0,
  'after the reveal: still not on N''s map');

-- ---------------------------------------------------------------------------
-- Rolling meet: a late joiner sees the CURRENT meet point, never one ahead
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"e7000000-0000-0000-0000-00000000000d","role":"authenticated"}', true);
select results_eq(
  $$ select round(lat::numeric, 4), round(lng::numeric, 4), place_name from public.feed_posts('author', null, 'e7000000-0000-0000-0000-00000000000a') where id = current_setting('t.p3')::uuid $$,
  $$ values (52.80::numeric, -0.10::numeric, null::text) $$,
  'rolling: a post at the meet point ahead is the area centre for a late joiner');
select is((select count(*)::int from public.posts_in_box(52.70, -0.20, 52.90, 0.00) where id = current_setting('t.p3')::uuid), 0,
  'rolling: and not on their map');
select is((select round(lat::numeric, 4) from public.feed_posts('author', null, 'e7000000-0000-0000-0000-00000000000a') where id = current_setting('t.p1')::uuid),
  52.95::numeric, 'rolling: L isn''t going to M, so M''s post stays hidden from L');
reset role;
update public.events set current_stop = 1 where id = 'e7e00000-0000-0000-0000-0000000000b1';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"e7000000-0000-0000-0000-00000000000d","role":"authenticated"}', true);
select results_eq(
  $$ select round(lat::numeric, 4), round(lng::numeric, 4), place_name from public.feed_posts('author', null, 'e7000000-0000-0000-0000-00000000000a') where id = current_setting('t.p3')::uuid $$,
  $$ values (52.8201::numeric, -0.0502::numeric, 'Roll second'::text) $$,
  'rolling: once it moves there, the late joiner gets the exact place');
select is((select count(*)::int from public.posts_in_box(52.70, -0.20, 52.90, 0.00) where id = current_setting('t.p3')::uuid), 1,
  'rolling: and it is on their map');

-- A linked post whose meet point has moved away follows the meet's current meet point.
reset role;
update public.event_stops set location = private.pt(52.85, -0.02) where id = 'e7500000-0000-0000-0000-0000000000b1';
update public.events set current_stop = 0 where id = 'e7e00000-0000-0000-0000-0000000000b1';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"e7000000-0000-0000-0000-00000000000c","role":"authenticated"}', true);
select is((select round(lat::numeric, 4) from public.feed_posts('author', null, 'e7000000-0000-0000-0000-00000000000a') where id = current_setting('t.p3')::uuid),
  52.80::numeric, 'moved meet point: a linked post stays hidden from someone not going');
select set_config('request.jwt.claims', '{"sub":"e7000000-0000-0000-0000-00000000000d","role":"authenticated"}', true);
select is((select round(lat::numeric, 4) from public.feed_posts('author', null, 'e7000000-0000-0000-0000-00000000000a') where id = current_setting('t.p3')::uuid),
  52.8201::numeric, 'moved meet point: someone going who can see the current meet point gets it');

-- Signed out: nothing.
reset role;
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
select throws_ok($$ select * from public.feed_posts('local') $$, '42501', null, 'signed out: no feed_posts');
reset role;

select * from finish();
rollback;

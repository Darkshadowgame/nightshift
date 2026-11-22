-- People, crews and blocking (20261122160000_lvl_people.sql): the crew emblem, Same model near you, and
-- blocking in both directions on forum threads and replies, crew members. Everything rolls back.
-- Users (made up): A owns a crew and drives a Mazda MX-5, B is in A's crew (MX5, same region), C also
-- (MX-5, same region), D drives something else, E is in another region.

begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(25);

insert into auth.users (id, email) values
  ('eb000000-0000-0000-0000-00000000000a', 'pp-a@example.test'),
  ('eb000000-0000-0000-0000-00000000000b', 'pp-b@example.test'),
  ('eb000000-0000-0000-0000-00000000000c', 'pp-c@example.test'),
  ('eb000000-0000-0000-0000-00000000000d', 'pp-d@example.test'),
  ('eb000000-0000-0000-0000-00000000000e', 'pp-e@example.test');
update public.profiles set handle = 'pp_' || right(id::text, 1), display_name = 'Person ' || right(id::text, 1), onboarded = true,
  region = case when right(id::text, 1) = 'e' then 'Scotland' else 'East' end
  where id::text like 'eb000000-%';

insert into public.builds (id, owner_id, kind, make, model, stock_bhp, weight_kg) values
  ('eb100000-0000-0000-0000-00000000000a', 'eb000000-0000-0000-0000-00000000000a', 'car', 'Mazda', 'MX-5', 158, 1000),
  ('eb100000-0000-0000-0000-00000000000b', 'eb000000-0000-0000-0000-00000000000b', 'car', 'mazda', 'mx5', 158, 1000),
  ('eb100000-0000-0000-0000-00000000000c', 'eb000000-0000-0000-0000-00000000000c', 'car', 'Mazda', 'MX-5', 158, 1000),
  ('eb100000-0000-0000-0000-00000000000d', 'eb000000-0000-0000-0000-00000000000d', 'car', 'Honda', 'Civic', 180, 1200),
  ('eb100000-0000-0000-0000-00000000000e', 'eb000000-0000-0000-0000-00000000000e', 'car', 'Mazda', 'MX-5', 158, 1000);

insert into public.crews (id, name, tag, created_by) values
  ('eb200000-0000-0000-0000-00000000000a', 'People Test Crew', 'PTC', 'eb000000-0000-0000-0000-00000000000a');
insert into public.crew_members (crew_id, user_id, role) values
  ('eb200000-0000-0000-0000-00000000000a', 'eb000000-0000-0000-0000-00000000000a', 'owner'),
  ('eb200000-0000-0000-0000-00000000000a', 'eb000000-0000-0000-0000-00000000000b', 'member');

insert into public.forum_threads (id, board, region, author_id, title, body) values
  ('eb300000-0000-0000-0000-00000000000a', 'local', 'East', 'eb000000-0000-0000-0000-00000000000a', 'Thread by A', ''),
  ('eb300000-0000-0000-0000-00000000000b', 'local', 'East', 'eb000000-0000-0000-0000-00000000000b', 'Thread by B', '');
insert into public.forum_replies (thread_id, author_id, body) values
  ('eb300000-0000-0000-0000-00000000000a', 'eb000000-0000-0000-0000-00000000000b', 'Reply by B on A''s thread');

-- Shape.
select has_column('public', 'crews', 'emblem', 'table: crews has emblem');
select has_function('public', 'set_crew_emblem', array['uuid', 'text'], 'function: set_crew_emblem exists');
select has_function('public', 'same_model_near', array[]::text[], 'function: same_model_near exists');
select is(has_function_privilege('anon', 'public.set_crew_emblem(uuid,text)', 'execute'), false, 'privileges: signed-out people can''t set an emblem');
select is(has_function_privilege('anon', 'public.same_model_near()', 'execute'), false, 'privileges: signed-out people can''t list same model');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"eb000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);

-- Emblem: the owner, from the built-in set.
select lives_ok($$ select public.set_crew_emblem('eb200000-0000-0000-0000-00000000000a', 'bolt-2') $$, 'emblem: the owner picks one');
select is((select emblem from public.crews where id = 'eb200000-0000-0000-0000-00000000000a'), 'bolt-2', 'emblem: it is saved');
select throws_ok($$ select public.set_crew_emblem('eb200000-0000-0000-0000-00000000000a', 'logo.png') $$,
  null, 'Pick one of the emblems on the list.', 'emblem: only the built-in set');

select set_config('request.jwt.claims', '{"sub":"eb000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
select throws_ok($$ select public.set_crew_emblem('eb200000-0000-0000-0000-00000000000a', 'star-1') $$,
  null, 'Only the crew owner can change the emblem.', 'emblem: a plain member can''t');

-- Same model near you, as A: B and C match (loosely), D is another model, E another region.
select set_config('request.jwt.claims', '{"sub":"eb000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select is((select count(*)::int from public.same_model_near()), 2, 'same model: B and C, same region and model');
select is((select count(*)::int from public.same_model_near() where user_id = 'eb000000-0000-0000-0000-00000000000e'), 0, 'same model: not another region');
select is((select count(*)::int from public.same_model_near() where user_id = 'eb000000-0000-0000-0000-00000000000d'), 0, 'same model: not another model');

-- C opts out: hidden from A, and C's own list is empty.
select set_config('request.jwt.claims', '{"sub":"eb000000-0000-0000-0000-00000000000c","role":"authenticated"}', true);
select lives_ok($$ select public.set_same_model_hidden(true) $$, 'opt out: C turns it off');
select is((select count(*)::int from public.same_model_near()), 0, 'opt out: C sees nobody either');
select set_config('request.jwt.claims', '{"sub":"eb000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select is((select count(*)::int from public.same_model_near()), 1, 'opt out: A no longer sees C');

-- A blocks B: nobody left, and each is hidden from the other.
select lives_ok($$ select public.block_user('eb000000-0000-0000-0000-00000000000b') $$, 'block: A blocks B');
select is((select count(*)::int from public.same_model_near()), 0, 'block: a blocked person never appears in same model');
select is((select count(*)::int from public.forum_threads where author_id = 'eb000000-0000-0000-0000-00000000000b'), 0, 'block: A no longer sees B''s threads');
select is((select count(*)::int from public.forum_threads where author_id = 'eb000000-0000-0000-0000-00000000000a'), 1, 'block: A still sees their own');
select is((select count(*)::int from public.forum_replies where author_id = 'eb000000-0000-0000-0000-00000000000b'), 0, 'block: A no longer sees B''s replies');
select is((select count(*)::int from public.crew_members where crew_id = 'eb200000-0000-0000-0000-00000000000a'), 1, 'block: A sees only themselves in the crew list');

select set_config('request.jwt.claims', '{"sub":"eb000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
select is((select count(*)::int from public.forum_threads where author_id = 'eb000000-0000-0000-0000-00000000000a'), 0, 'block both ways: B can''t see A''s threads');
select is((select count(*)::int from public.crew_members where crew_id = 'eb200000-0000-0000-0000-00000000000a'), 1, 'block both ways: B sees only themselves in the crew list');

-- Someone with no block sees everything.
select set_config('request.jwt.claims', '{"sub":"eb000000-0000-0000-0000-00000000000d","role":"authenticated"}', true);
select is((select count(*)::int from public.forum_threads where id::text like 'eb300000-%'), 2, 'no block: D sees both threads');
select is((select count(*)::int from public.crew_members where crew_id = 'eb200000-0000-0000-0000-00000000000a'), 2, 'no block: D sees the whole crew');

select * from finish();
rollback;

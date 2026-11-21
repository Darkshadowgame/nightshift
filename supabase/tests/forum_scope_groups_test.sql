-- Forum scope and groups (20261121120000): a region on any board makes a thread Local, a group
-- key tags a make or model, the Local board still needs a region, and bad regions and keys are
-- refused. Everything rolls back. Users (made up): A author.

begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(12);

insert into auth.users (id, email) values ('e9000000-0000-0000-0000-000000000001', 'fg-a@example.test');
update public.profiles set handle = 'scope_a', display_name = 'Scope A', region = 'Midlands', onboarded = true
  where id = 'e9000000-0000-0000-0000-000000000001';

-- Table: a group key is a make or make:model slug; the Local board needs a region.
select throws_ok($$ insert into public.forum_threads (board, author_id, title, group_key) values ('advice', 'e9000000-0000-0000-0000-000000000001', 'Bad key here', 'SEAT Leon') $$,
  '23514', null, 'table: group key is a slug');
select throws_ok($$ insert into public.forum_threads (board, author_id, title) values ('local', 'e9000000-0000-0000-0000-000000000001', 'No region on Local') $$,
  '23514', null, 'table: the Local board needs a region');
select lives_ok($$ insert into public.forum_threads (board, region, group_key, author_id, title) values ('advice', 'Midlands', 'seat:leon', 'e9000000-0000-0000-0000-000000000001', 'Local advice thread') $$,
  'table: a region is allowed on any board');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"e9000000-0000-0000-0000-000000000001","role":"authenticated"}', true);

select set_config('t.everyone', public.create_thread(p_board => 'advice', p_region => null, p_title => 'Cupra gearbox warning', p_body => 'What does it mean?', p_group_key => 'cupra:formentor')::text, true);
select is((select region from public.forum_threads where id = current_setting('t.everyone')::uuid), null, 'create_thread: no region is Everyone');
select is((select group_key from public.forum_threads where id = current_setting('t.everyone')::uuid), 'cupra:formentor', 'create_thread: tagged with the group');

select set_config('t.local', public.create_thread(p_board => 'meets', p_region => 'Midlands', p_title => 'Leon owners coffee run', p_body => 'Sunday.', p_group_key => 'seat')::text, true);
select is((select region from public.forum_threads where id = current_setting('t.local')::uuid), 'Midlands', 'create_thread: a region on Meets is Local');
select is((select group_key from public.forum_threads where id = current_setting('t.local')::uuid), 'seat', 'create_thread: a make group');

select set_config('t.plain', public.create_thread(p_board => 'cars', p_region => null, p_title => 'No group at all', p_body => '')::text, true);
select is((select group_key from public.forum_threads where id = current_setting('t.plain')::uuid), null, 'create_thread: group is optional');

select throws_ok($$ select public.create_thread(p_board => 'advice', p_region => 'Narnia', p_title => 'Odd region here', p_body => '') $$,
  null, 'Pick a region from the list.', 'create_thread: region from the list');
select throws_ok($$ select public.create_thread(p_board => 'advice', p_region => null, p_title => 'Odd group here', p_body => '', p_group_key => 'SEAT Leon') $$,
  null, 'Pick a group from the list.', 'create_thread: group is a key');
select throws_ok($$ select public.create_thread(p_board => 'local', p_region => null, p_title => 'Local with none', p_body => '') $$,
  null, 'Pick a region for the Local board.', 'create_thread: the Local board needs a region');

select * from finish();
rollback;

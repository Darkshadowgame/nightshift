-- Moderation for all user content: reports on event chat, events, crews and
-- suggested places; blocks in event chat; hidden chat lines; suspensions; the
-- staff actions. Users: H host, G going, X going too, S staff, O outsider.
-- Everything rolls back.

begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(36);

insert into auth.users (id, email) values
  ('d0000000-0000-0000-0000-0000000000a1', 'mh@example.test'),
  ('d0000000-0000-0000-0000-0000000000a2', 'mg@example.test'),
  ('d0000000-0000-0000-0000-0000000000a3', 'mx@example.test'),
  ('d0000000-0000-0000-0000-0000000000a4', 'ms@example.test'),
  ('d0000000-0000-0000-0000-0000000000a5', 'mo@example.test');
update public.profiles set handle = 'mod_' || right(id::text, 1), display_name = 'Mod ' || right(id::text, 1), region = 'East', onboarded = true
  where id::text like 'd0000000-0000-0000-0000-0000000000a%';
-- An admin: full suspensions are for admins (20261118140100).
insert into public.staff (user_id, role, note) values ('d0000000-0000-0000-0000-0000000000a4', 'admin', 'test admin');

insert into public.events (id, type, title, starts_at, ends_at, reveal_minutes_before, area, area_radius_miles, area_name, invite_min_mods, created_by) values
  ('de000000-0000-0000-0000-000000000001', 'meet', 'Moderated meet', now() + interval '1 day', null, 60, private.pt(53.22, -0.52), 3, 'Lincoln', 0, 'd0000000-0000-0000-0000-0000000000a1');
insert into public.event_hosts (event_id, user_id) values ('de000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-0000000000a1');
insert into public.event_going (event_id, user_id) values
  ('de000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-0000000000a2'),
  ('de000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-0000000000a3');
insert into public.chat_messages (id, event_id, user_id, body) values
  ('dc000000-0000-0000-0000-000000000001', 'de000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-0000000000a2', 'Rude line'),
  ('dc000000-0000-0000-0000-000000000002', 'de000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-0000000000a3', 'Normal line');
insert into public.crews (id, name, tag, created_by) values ('dd000000-0000-0000-0000-000000000001', 'Mod Crew', 'MOD', 'd0000000-0000-0000-0000-0000000000a3');
insert into public.crew_members (crew_id, user_id, role) values ('dd000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-0000000000a3', 'owner');
insert into public.spots (id, kind, name, description, location, author_id, status) values
  ('df000000-0000-0000-0000-000000000001', 'photo', 'Mod spot', 'A car park', private.pt(53.2, -0.5), 'd0000000-0000-0000-0000-0000000000a3', 'approved');

set local role authenticated;

-- ---------------------------------------------------------------------------
-- Reports on event chat, events, crews and places
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"d0000000-0000-0000-0000-0000000000a5","role":"authenticated"}', true);
select throws_ok($$ select public.report_content('chat', 'dc000000-0000-0000-0000-000000000001', 'harassment') $$, 'P0001',
  'That isn''t there any more.', 'report chat: only lines you can read');
select lives_ok($$ select public.report_content('event', 'de000000-0000-0000-0000-000000000001', 'dangerous_driving') $$, 'report: events');
select lives_ok($$ select public.report_content('crew', 'dd000000-0000-0000-0000-000000000001', 'hate') $$, 'report: crews');
select lives_ok($$ select public.report_content('spot', 'df000000-0000-0000-0000-000000000001', 'personal_info') $$, 'report: suggested places');
select throws_ok($$ select public.report_content('spot', gen_random_uuid(), 'spam') $$, 'P0001', 'That isn''t there any more.', 'report: something that isn''t there');

select set_config('request.jwt.claims', '{"sub":"d0000000-0000-0000-0000-0000000000a3","role":"authenticated"}', true);
select lives_ok($$ select public.report_content('chat', 'dc000000-0000-0000-0000-000000000001', 'harassment', 'Keeps at it') $$, 'report chat: X (going) reports G''s line');
select throws_ok($$ select public.report_content('crew', 'dd000000-0000-0000-0000-000000000001', 'spam') $$, 'P0001', 'You can''t report yourself.', 'report: not your own crew');

-- ---------------------------------------------------------------------------
-- Blocks in event chat
-- ---------------------------------------------------------------------------
select is((select count(*)::int from public.chat_messages where event_id = 'de000000-0000-0000-0000-000000000001'), 2, 'chat: X reads both lines');
select lives_ok($$ select public.block_user('d0000000-0000-0000-0000-0000000000a2') $$, 'block: X blocks G');
select is((select count(*)::int from public.chat_messages where event_id = 'de000000-0000-0000-0000-000000000001'), 1, 'block: G''s chat lines are hidden from X');
select set_config('request.jwt.claims', '{"sub":"d0000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
select is((select count(*)::int from public.chat_messages where event_id = 'de000000-0000-0000-0000-000000000001'), 2, 'block: the host (who didn''t block) still reads both');

-- Three reports hide a chat line.
select lives_ok($$ select public.report_content('chat', 'dc000000-0000-0000-0000-000000000001', 'harassment') $$, 'report chat: H reports it too');
reset role;
insert into public.event_going (event_id, user_id) values ('de000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-0000000000a5');
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"d0000000-0000-0000-0000-0000000000a5","role":"authenticated"}', true);
select lives_ok($$ select public.report_content('chat', 'dc000000-0000-0000-0000-000000000001', 'harassment') $$, 'report chat: a third person');
select is((select count(*)::int from public.chat_messages where id = 'dc000000-0000-0000-0000-000000000001'), 0, 'reports: three people hide a chat line');
select set_config('request.jwt.claims', '{"sub":"d0000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);
select is((select count(*)::int from public.chat_messages where id = 'dc000000-0000-0000-0000-000000000001'), 1, 'reports: the writer still sees their hidden line');

-- ---------------------------------------------------------------------------
-- Staff
-- ---------------------------------------------------------------------------
select is((select is_staff from public.my_moderation_status()), false, 'my_moderation_status: G isn''t staff');
select is((select count(*)::int from public.moderation_queue), 0, 'moderation_queue: nothing for non-staff');
select throws_ok($$ select public.moderate_report((select gen_random_uuid()), 'dismiss') $$, 'P0001', 'Only staff can do that.', 'moderate_report: staff only');

select set_config('request.jwt.claims', '{"sub":"d0000000-0000-0000-0000-0000000000a4","role":"authenticated"}', true);
select is((select is_staff from public.my_moderation_status()), true, 'my_moderation_status: S is staff');
select is((select reports from public.moderation_queue where target = 'chat'), 3, 'moderation_queue: the chat line with three reports');
select is((select excerpt from public.moderation_queue where target = 'chat'), 'Rude line', 'moderation_queue: with a copy of the line');
select is((select count(*)::int from public.chat_messages where id = 'dc000000-0000-0000-0000-000000000001'), 1, 'staff: read hidden chat lines');
select lives_ok($$ select public.moderate_report((select report_id from public.moderation_queue where target = 'spot'), 'hide') $$, 'moderate_report: hide a place');
select is((select status::text from public.spots where id = 'df000000-0000-0000-0000-000000000001'), 'rejected', 'hide: a place is rejected');
select lives_ok($$ select public.moderate_report((select report_id from public.moderation_queue where target = 'event'), 'hide') $$, 'moderate_report: hide an event');
select isnt((select cancelled_at from public.events where id = 'de000000-0000-0000-0000-000000000001'), null, 'hide: an event is cancelled');
select throws_ok($$ select public.moderate_report((select report_id from public.moderation_queue where target = 'crew'), 'hide') $$, 'P0001',
  'Profiles, builds and crews can''t be hidden: suspend the person instead.', 'hide: crews are handled by suspending');
select lives_ok($$ select public.moderate_report((select report_id from public.moderation_queue where target = 'chat'), 'suspend', 7, 'Harassment in event chat') $$,
  'moderate_report: suspend G for 7 days');
select is((select count(*)::int from public.moderation_queue where target = 'chat'), 0, 'moderate_report: the reports are closed');

-- ---------------------------------------------------------------------------
-- Suspended: can't post or message, can still read and report
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"d0000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);
select is((select suspended from public.my_moderation_status()), true, 'my_moderation_status: G sees they''re suspended');
select throws_ok($$ insert into public.chat_messages (event_id, body) values ('de000000-0000-0000-0000-000000000001', 'back again') $$, 'P0001',
  'Your account is suspended, so you can''t post or message right now. You can still read and report.', 'suspended: no event chat');
select throws_ok($$ select public.create_thread('advice', null, 'Help please', '') $$, 'P0001',
  'Your account is suspended, so you can''t post or message right now. You can still read and report.', 'suspended: no forum threads');
select throws_ok($$ select public.request_connection('d0000000-0000-0000-0000-0000000000a5') $$, 'P0001',
  'Your account is suspended, so you can''t post or message right now. You can still read and report.', 'suspended: no connection requests');
select lives_ok($$ select public.report_content('event', 'de000000-0000-0000-0000-000000000001', 'spam') $$, 'suspended: can still report');

select set_config('request.jwt.claims', '{"sub":"d0000000-0000-0000-0000-0000000000a4","role":"authenticated"}', true);
select lives_ok($$ select public.lift_suspension('d0000000-0000-0000-0000-0000000000a2') $$, 'lift_suspension: staff lift it');
select set_config('request.jwt.claims', '{"sub":"d0000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);
select lives_ok($$ insert into public.chat_messages (event_id, body) values ('de000000-0000-0000-0000-000000000001', 'sorry') $$, 'lifted: event chat again');

select * from finish();
rollback;

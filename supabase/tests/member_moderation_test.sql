-- Member moderation and staff roles (20261118180000): warnings, Community bans
-- and full suspensions with their scope and expiry, lifting, notices, roles and
-- who may do what, the append-only audit log, and what staff can read.
-- Everything rolls back (the owner row here is a test fixture).
--
-- Users (made up): O owner, A admin, B admin, M moderator, K moderator,
-- U member (connected to V), V member, W member.

begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(76);

insert into auth.users (id, email) values
  ('e6000000-0000-0000-0000-000000000001', 'mm-o@example.test'),
  ('e6000000-0000-0000-0000-000000000002', 'mm-a@example.test'),
  ('e6000000-0000-0000-0000-000000000003', 'mm-b@example.test'),
  ('e6000000-0000-0000-0000-000000000004', 'mm-m@example.test'),
  ('e6000000-0000-0000-0000-000000000005', 'mm-k@example.test'),
  ('e6000000-0000-0000-0000-000000000006', 'mm-u@example.test'),
  ('e6000000-0000-0000-0000-000000000007', 'mm-v@example.test'),
  ('e6000000-0000-0000-0000-000000000008', 'mm-w@example.test');
update public.profiles set handle = 'mm_' || right(id::text, 1), display_name = 'Member ' || right(id::text, 1), region = 'East', onboarded = true
  where id::text like 'e6000000-0000-0000-0000-00000000000%';
insert into public.staff (user_id, role, note) values
  ('e6000000-0000-0000-0000-000000000001', 'owner', 'test owner'),
  ('e6000000-0000-0000-0000-000000000002', 'admin', 'test'),
  ('e6000000-0000-0000-0000-000000000003', 'admin', 'test'),
  ('e6000000-0000-0000-0000-000000000004', 'moderator', 'test'),
  ('e6000000-0000-0000-0000-000000000005', 'moderator', 'test');
insert into public.connections (requester_id, addressee_id, status) values
  ('e6000000-0000-0000-0000-000000000006', 'e6000000-0000-0000-0000-000000000007', 'accepted');
insert into public.posts (id, author_id, body) values
  ('e6a00000-0000-0000-0000-000000000001', 'e6000000-0000-0000-0000-000000000006', 'U''s post'),
  ('e6a00000-0000-0000-0000-000000000002', 'e6000000-0000-0000-0000-000000000002', 'A''s post');
insert into public.events (id, type, title, starts_at, ends_at, reveal_minutes_before, area, area_radius_miles, area_name, invite_min_mods, created_by) values
  ('e6e00000-0000-0000-0000-000000000001', 'meet', 'Member meet', now() + interval '1 day', null, 60, private.pt(52.2, 0.12), 3, 'Cambridge', 0, 'e6000000-0000-0000-0000-000000000008');
insert into public.event_hosts (event_id, user_id) values ('e6e00000-0000-0000-0000-000000000001', 'e6000000-0000-0000-0000-000000000008');
insert into public.event_going (event_id, user_id) values ('e6e00000-0000-0000-0000-000000000001', 'e6000000-0000-0000-0000-000000000006');

select throws_ok($$ insert into public.staff (user_id, role) values ('e6000000-0000-0000-0000-000000000008', 'owner') $$, '23505', null, 'roles: exactly one owner');

set local role authenticated;

-- ---------------------------------------------------------------------------
-- Only staff, never yourself, never the same or a higher role
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"e6000000-0000-0000-0000-000000000007","role":"authenticated"}', true);
select throws_ok($$ select public.warn_member('e6000000-0000-0000-0000-000000000006', 'Be nice') $$, 'P0001', 'Only staff can do that.', 'warn: staff only');
select throws_ok($$ select public.ban_member('e6000000-0000-0000-0000-000000000006', 'community', 1, 'Spam') $$, 'P0001', 'Only staff can do that.', 'ban: staff only');
select throws_ok($$ select public.member_overview('e6000000-0000-0000-0000-000000000006') $$, 'P0001', 'Only staff can do that.', 'member_overview: staff only');
select throws_ok($$ select * from public.member_history('e6000000-0000-0000-0000-000000000006') $$, 'P0001', 'Only staff can do that.', 'member_history: staff only');
select throws_ok($$ select * from public.moderation_team() $$, 'P0001', 'Only staff can do that.', 'moderation_team: staff only');
select throws_ok($$ select * from public.moderation_log() $$, 'P0001', 'Only admins and the owner can read the audit log.', 'moderation_log: not for members');
select throws_ok($$ select public.set_staff_role('e6000000-0000-0000-0000-000000000008', 'moderator', 'Helpful') $$, 'P0001',
  'Only admins and the owner can change roles.', 'roles: members can''t promote');
select is((select role from public.my_moderation_status()), null, 'my_moderation_status: no role');

select set_config('request.jwt.claims', '{"sub":"e6000000-0000-0000-0000-000000000004","role":"authenticated"}', true);
select is((select role from public.my_moderation_status()), 'moderator', 'my_moderation_status: the role');
select throws_ok($$ select public.warn_member('e6000000-0000-0000-0000-000000000004', 'Test') $$, 'P0001', 'You can''t moderate yourself.', 'warn: not yourself');
select throws_ok($$ select public.warn_member('e6000000-0000-0000-0000-000000000005', 'Test') $$, 'P0001',
  'You can''t act on someone with the same or a higher role.', 'warn: not the same role');
select throws_ok($$ select public.ban_member('e6000000-0000-0000-0000-000000000002', 'community', 1, 'Test') $$, 'P0001',
  'You can''t act on someone with the same or a higher role.', 'ban: not a higher role');
select throws_ok($$ select public.set_staff_role('e6000000-0000-0000-0000-000000000008', 'moderator', 'Helpful') $$, 'P0001',
  'Only admins and the owner can change roles.', 'roles: moderators can''t promote');

-- ---------------------------------------------------------------------------
-- Warnings
-- ---------------------------------------------------------------------------
select throws_ok($$ select public.warn_member('e6000000-0000-0000-0000-000000000006', '') $$, 'P0001', 'Give a reason (3 to 200 characters).', 'warn: needs a reason');
select lives_ok($$ select public.warn_member('e6000000-0000-0000-0000-000000000006', 'Spamming the forum', 'Three threads about the same thing') $$, 'warn: M warns U');
select set_config('request.jwt.claims', '{"sub":"e6000000-0000-0000-0000-000000000006","role":"authenticated"}', true);
select is((select reason from public.my_warnings()), 'Spamming the forum', 'warn: U sees the warning');
select is((select body from public.notices where user_id = auth.uid() and title = 'Moderator warning'), 'A moderator warned you: Spamming the forum', 'warn: and a notice');
select lives_ok($$ select public.acknowledge_warning((select id from public.my_warnings())) $$, 'warn: U acknowledges it');
select is((select count(*)::int from public.my_warnings()), 0, 'warn: gone once acknowledged');
select is((select count(*)::int from public.moderation_warnings where user_id = auth.uid()), 1, 'warn: U can still read their own warnings');
select set_config('request.jwt.claims', '{"sub":"e6000000-0000-0000-0000-000000000007","role":"authenticated"}', true);
select is((select count(*)::int from public.moderation_warnings), 0, 'warn: nobody else sees them');

-- ---------------------------------------------------------------------------
-- Community bans: what they stop and what they don't
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"e6000000-0000-0000-0000-000000000004","role":"authenticated"}', true);
select throws_ok($$ select public.ban_member('e6000000-0000-0000-0000-000000000006', 'community', 30, 'Spam') $$, 'P0001',
  'Moderators can ban from Community for up to 7 days. Ask an admin for longer bans or a full suspension.', 'ban: moderators up to 7 days');
select throws_ok($$ select public.ban_member('e6000000-0000-0000-0000-000000000006', 'community', null, 'Spam') $$, 'P0001',
  'Moderators can ban from Community for up to 7 days. Ask an admin for longer bans or a full suspension.', 'ban: moderators not until lifted');
select throws_ok($$ select public.ban_member('e6000000-0000-0000-0000-000000000006', 'full', 3, 'Spam') $$, 'P0001',
  'Moderators can ban from Community for up to 7 days. Ask an admin for longer bans or a full suspension.', 'ban: moderators no full suspensions');
select throws_ok($$ select public.ban_member('e6000000-0000-0000-0000-000000000006', 'community', 3, '') $$, 'P0001', 'Give a reason (3 to 300 characters).', 'ban: needs a reason');
select lives_ok($$ select public.ban_member('e6000000-0000-0000-0000-000000000006', 'community', 7, 'Spamming the forum') $$, 'ban: M bans U from Community for 7 days');

select set_config('request.jwt.claims', '{"sub":"e6000000-0000-0000-0000-000000000006","role":"authenticated"}', true);
select is((select scope from public.my_moderation_status()), 'community', 'ban: U sees the scope');
select ok((select message from public.my_moderation_status()) like 'You can''t post in Community until % 20__, __:__: Spamming the forum.', 'ban: and the sentence with the end time');
select ok((select body from public.notices where user_id = auth.uid() and title = 'Community ban') like 'You can''t post in Community until %', 'ban: a notice');
select throws_like($$ select public.create_post('Hello again') $$, 'You can''t post in Community until %', 'community ban: no posts');
select throws_like($$ select public.comment_post('e6a00000-0000-0000-0000-000000000002', 'Hello') $$, 'You can''t post in Community until %', 'community ban: no comments');
select throws_like($$ select public.create_thread('cars', null, 'Hello all', '') $$, 'You can''t post in Community until %', 'community ban: no threads');
select throws_like($$ insert into public.chat_messages (event_id, body) values ('e6e00000-0000-0000-0000-000000000001', 'hi') $$, 'You can''t post in Community until %', 'community ban: no event chat');
select throws_like($$ select public.request_connection('e6000000-0000-0000-0000-000000000008') $$, 'You can''t post in Community until %', 'community ban: no connection requests');
select set_config('t.conv', public.start_direct('e6000000-0000-0000-0000-000000000007')::text, true);
select lives_ok(format($$ select public.send_message(%L, 'Still here') $$, current_setting('t.conv')), 'community ban: messages to connections still work');
select lives_ok($$ select public.report_content('post', 'e6a00000-0000-0000-0000-000000000002', 'spam') $$, 'community ban: can still report');

-- Lifting: moderators lift their own kind of ban.
select set_config('request.jwt.claims', '{"sub":"e6000000-0000-0000-0000-000000000004","role":"authenticated"}', true);
select lives_ok($$ select public.lift_suspension('e6000000-0000-0000-0000-000000000006') $$, 'lift: M lifts a 7-day Community ban');
select set_config('request.jwt.claims', '{"sub":"e6000000-0000-0000-0000-000000000006","role":"authenticated"}', true);
select is((select suspended from public.my_moderation_status()), false, 'lift: U isn''t banned');
select lives_ok($$ select public.create_post('Back and behaving') $$, 'lift: U posts again');

-- ---------------------------------------------------------------------------
-- Full suspensions (admins) and expiry
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"e6000000-0000-0000-0000-000000000002","role":"authenticated"}', true);
select lives_ok($$ select public.ban_member('e6000000-0000-0000-0000-000000000006', 'full', 30, 'Harassment') $$, 'full: A suspends U for 30 days');
select set_config('request.jwt.claims', '{"sub":"e6000000-0000-0000-0000-000000000006","role":"authenticated"}', true);
select throws_ok(format($$ select public.send_message(%L, 'Hello?') $$, current_setting('t.conv')), 'P0001',
  'Your account is suspended, so you can''t post or message right now. You can still read and report.', 'full: no messages either');
select set_config('request.jwt.claims', '{"sub":"e6000000-0000-0000-0000-000000000004","role":"authenticated"}', true);
select throws_ok($$ select public.lift_suspension('e6000000-0000-0000-0000-000000000006') $$, 'P0001', 'Only admins can lift that one.', 'lift: moderators can''t lift a full suspension');
select set_config('request.jwt.claims', '{"sub":"e6000000-0000-0000-0000-000000000002","role":"authenticated"}', true);
select lives_ok($$ select public.lift_suspension('e6000000-0000-0000-0000-000000000006') $$, 'lift: A lifts it');
select lives_ok($$ select public.ban_member('e6000000-0000-0000-0000-000000000006', 'community', null, 'Until we talk') $$, 'ban: admins ban until lifted');
reset role;
update public.suspensions set until = now() - interval '1 minute' where user_id = 'e6000000-0000-0000-0000-000000000006';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"e6000000-0000-0000-0000-000000000006","role":"authenticated"}', true);
select lives_ok($$ select public.create_post('Ban ran out, hello') $$, 'expiry: an ended ban stops nothing');

-- ---------------------------------------------------------------------------
-- The report queue respects roles too
-- ---------------------------------------------------------------------------
select lives_ok($$ select public.report_content('post', 'e6a00000-0000-0000-0000-000000000002', 'harassment') $$, 'queue: U reports A''s post (already did: no double)');
select set_config('request.jwt.claims', '{"sub":"e6000000-0000-0000-0000-000000000007","role":"authenticated"}', true);
select lives_ok($$ select public.report_content('post', 'e6a00000-0000-0000-0000-000000000001', 'spam') $$, 'queue: V reports U''s post');
select set_config('request.jwt.claims', '{"sub":"e6000000-0000-0000-0000-000000000004","role":"authenticated"}', true);
select throws_ok($$ select public.moderate_report((select id from public.reports where target_id = 'e6a00000-0000-0000-0000-000000000002' limit 1), 'dismiss') $$, 'P0001',
  'You can''t act on someone with the same or a higher role.', 'queue: M can''t act on reports about an admin');
select throws_ok($$ select public.moderate_report((select id from public.reports where target_id = 'e6a00000-0000-0000-0000-000000000001'), 'suspend', 7) $$, 'P0001',
  'Moderators can ban from Community for up to 7 days. Ask an admin for longer bans or a full suspension.', 'queue: full suspension is for admins');
select lives_ok($$ select public.moderate_report((select id from public.reports where target_id = 'e6a00000-0000-0000-0000-000000000001'), 'hide') $$, 'queue: M hides U''s post');

-- ---------------------------------------------------------------------------
-- Roles
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"e6000000-0000-0000-0000-000000000002","role":"authenticated"}', true);
select throws_ok($$ select public.set_staff_role('e6000000-0000-0000-0000-000000000008', 'admin', 'Trusted') $$, 'P0001', 'Only the owner can make admins.', 'roles: admins can''t make admins');
select throws_ok($$ select public.set_staff_role('e6000000-0000-0000-0000-000000000003', null, 'No') $$, 'P0001',
  'You can''t change the role of someone with the same or a higher role.', 'roles: admins can''t demote admins');
select throws_ok($$ select public.set_staff_role('e6000000-0000-0000-0000-000000000002', null, 'Me') $$, 'P0001', 'You can''t change your own role.', 'roles: not your own');
select throws_ok($$ select public.set_staff_role('e6000000-0000-0000-0000-000000000008', 'moderator', '') $$, 'P0001', 'Give a reason (3 to 300 characters).', 'roles: needs a reason');
select lives_ok($$ select public.set_staff_role('e6000000-0000-0000-0000-000000000008', 'moderator', 'Helpful in the forum') $$, 'roles: A makes W a moderator');
select lives_ok($$ select public.set_staff_role('e6000000-0000-0000-0000-000000000005', null, 'Inactive') $$, 'roles: A removes K''s role');
select is((select count(*)::int from public.moderation_team() where handle in ('mm_8', 'mm_5')), 1, 'team: W is on it, K isn''t');
select is((select actions_7d from public.moderation_team() where handle = 'mm_2'), 5, 'team: A''s actions in 7 days');
select set_config('request.jwt.claims', '{"sub":"e6000000-0000-0000-0000-000000000008","role":"authenticated"}', true);
select is((select body from public.notices where user_id = auth.uid() and title = 'You''re now a moderator'),
  'You''re now a moderator on Slipstream. Settings › Moderation has the tools.', 'roles: W gets a notice');
select set_config('request.jwt.claims', '{"sub":"e6000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
select lives_ok($$ select public.set_staff_role('e6000000-0000-0000-0000-000000000003', 'moderator', 'Stepping back') $$, 'roles: the owner demotes an admin');
select lives_ok($$ select public.set_staff_role('e6000000-0000-0000-0000-000000000008', 'admin', 'Trusted') $$, 'roles: the owner makes an admin');
select throws_ok($$ select public.set_staff_role('e6000000-0000-0000-0000-000000000001', 'admin', 'Me') $$, 'P0001', 'You can''t change your own role.', 'roles: not even the owner''s own');

-- ---------------------------------------------------------------------------
-- The audit log
-- ---------------------------------------------------------------------------
select is((select count(*)::int from public.moderation_log() where target_user::text like 'e6000000-%'), 11, 'log: every action is there');
select is((select array_agg(action order by action) from public.moderation_log(p_actor => 'e6000000-0000-0000-0000-000000000004')),
  array['ban', 'hide', 'lift', 'warn'], 'log: filtered by moderator');
select is((select count(*)::int from public.moderation_log(p_action => 'promote') where target_user::text like 'e6000000-%'), 2, 'log: filtered by action');
select is((select actor_role from public.moderation_log(p_action => 'hide') where target_user::text like 'e6000000-%'), 'moderator', 'log: the role at the time');
select is((select count(*)::int from public.moderation_actions where target_user::text like 'e6000000-%'), 11, 'log: the owner reads the table');
select throws_ok($$ update public.moderation_actions set reason = 'edited' $$, '42501', null, 'log: nobody updates it');
select throws_ok($$ delete from public.moderation_actions $$, '42501', null, 'log: nobody deletes it');
select set_config('request.jwt.claims', '{"sub":"e6000000-0000-0000-0000-000000000004","role":"authenticated"}', true);
select is((select count(*)::int from public.moderation_actions), 0, 'log: moderators can''t read the whole log');
select ok(jsonb_array_length(public.member_overview('e6000000-0000-0000-0000-000000000006')->'log') >= 6, 'member_overview: moderators see that person''s log');
select is((public.member_overview('e6000000-0000-0000-0000-000000000006')->'counts'->>'warnings')::int, 1, 'member_overview: counts warnings');
select is((select count(*)::int from public.member_history('e6000000-0000-0000-0000-000000000006') where kind = 'post'), 3, 'member_history: U''s posts');
reset role;
select throws_ok($$ update public.moderation_actions set reason = 'edited' $$, 'P0001', 'The moderation log can''t be changed or deleted.', 'log: not even the database owner updates it');
select throws_ok($$ delete from public.moderation_actions where target_user::text like 'e6000000-%' $$, 'P0001', 'The moderation log can''t be changed or deleted.', 'log: or deletes it');

select * from finish();
rollback;

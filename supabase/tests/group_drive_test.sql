-- Group drive (20261122180000): only members read positions, only the latest position is kept (no history),
-- it is deleted when a member leaves and everything is deleted when the group ends or expires, blocked people
-- can't join each other's group, and the tables can't be touched directly. Everything rolls back.
-- Users (made up): A leads, B joins, C has a block with A, D hasn't finished setting up, E isn't going to the meet.

begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(34);

insert into auth.users (id, email) values
  ('9d000000-0000-0000-0000-00000000000a', 'gd-a@example.test'),
  ('9d000000-0000-0000-0000-00000000000b', 'gd-b@example.test'),
  ('9d000000-0000-0000-0000-00000000000c', 'gd-c@example.test'),
  ('9d000000-0000-0000-0000-00000000000d', 'gd-d@example.test'),
  ('9d000000-0000-0000-0000-00000000000e', 'gd-e@example.test');
update public.profiles set handle = 'gd_' || right(id::text, 1), display_name = 'Person ' || right(id::text, 1), region = 'East', onboarded = true
  where id::text in ('9d000000-0000-0000-0000-00000000000a', '9d000000-0000-0000-0000-00000000000b', '9d000000-0000-0000-0000-00000000000c', '9d000000-0000-0000-0000-00000000000e');

insert into public.events (id, type, title, starts_at, ends_at, reveal_minutes_before, area, area_radius_miles, area_name, invite_everyone, current_stop) values
  ('9d100000-0000-0000-0000-0000000000a1', 'meet', 'Test cruise', now() + interval '1 hour', now() + interval '4 hours', 60, private.pt(53.22, -0.52), 9, 'Lincoln', true, 0);
insert into public.event_stops (id, event_id, position, name, location) values
  ('9d500000-0000-0000-0000-000000000000', '9d100000-0000-0000-0000-0000000000a1', 0, 'Car park', private.pt(53.20, -0.50));
insert into public.event_going (event_id, user_id) values
  ('9d100000-0000-0000-0000-0000000000a1', '9d000000-0000-0000-0000-00000000000a'),
  ('9d100000-0000-0000-0000-0000000000a1', '9d000000-0000-0000-0000-00000000000b'),
  ('9d100000-0000-0000-0000-0000000000a1', '9d000000-0000-0000-0000-00000000000c');
insert into public.blocks (blocker_id, blocked_id) values ('9d000000-0000-0000-0000-00000000000c', '9d000000-0000-0000-0000-00000000000a');

-- Tables and privileges.
select has_table('public', 'group_drives', 'table: group_drives');
select has_table('public', 'group_drive_members', 'table: group_drive_members, one row per member with the latest position only');
select is(has_function_privilege('anon', 'public.group_drive_start(text, text)', 'execute'), false, 'privileges: signed-out people can''t start a group drive');
select is(has_function_privilege('anon', 'public.group_drive_read()', 'execute'), false, 'privileges: signed-out people can''t read one');
select throws_ok($$ insert into public.group_drives (code, leader_id, title) values ('abc', '9d000000-0000-0000-0000-00000000000a', 'x') $$,
  '23514', null, 'table: a join code has to be 16 random hex characters');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"9d000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);

select throws_ok($$ select * from public.group_drive_members $$, '42501', null, 'privileges: nobody reads the positions table directly');
select throws_ok($$ select * from public.group_drives $$, '42501', null, 'privileges: nor the groups table');

-- A starts it for the meet.
select set_config('t.code', public.group_drive_start('event', '9d100000-0000-0000-0000-0000000000a1')->>'code', false);
select is(length(current_setting('t.code')), 16, 'start: the code is 16 characters');
select is(jsonb_array_length(public.group_drive_read()->'members'), 0, 'read: nobody else yet (you are not in your own list)');

-- Not onboarded, or not going to the meet.
select set_config('request.jwt.claims', '{"sub":"9d000000-0000-0000-0000-00000000000d","role":"authenticated"}', true);
select throws_ok($$ select public.group_drive_start('none', null) $$, null, 'Set up your profile first.', 'start: finish setting up first');
select set_config('request.jwt.claims', '{"sub":"9d000000-0000-0000-0000-00000000000e","role":"authenticated"}', true);
select throws_ok($$ select public.group_drive_start('event', '9d100000-0000-0000-0000-0000000000a1') $$, null, 'You can start a group drive for a meet you are going to.', 'start: only for a meet you are going to');
select is(public.group_drive_for_event('9d100000-0000-0000-0000-0000000000a1'), null::jsonb, 'for_event: not offered to people not going');
select is(public.group_drive_read()->>'active', 'false', 'read: not in a group is not active, and shows nothing');

-- B is going: finds it from the meet, previews it, joins.
select set_config('request.jwt.claims', '{"sub":"9d000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
select is(public.group_drive_for_event('9d100000-0000-0000-0000-0000000000a1')->>'code', current_setting('t.code'), 'for_event: people going to the meet are offered the group drive');
select is(public.group_drive_preview(current_setting('t.code'))->>'leader_handle', 'gd_a', 'preview: who started it, before agreeing to share');
select is(public.group_drive_preview(current_setting('t.code'))->>'title', 'Test cruise', 'preview: the title comes from the meet, not from anyone typing it');
select lives_ok($$ select public.group_drive_join(current_setting('t.code')) $$, 'join: by code');
select is((public.group_drive_read()->'group'->>'member_count')::int, 2, 'join: two in the group');

-- C has a block with A (either way): can't join, can't see them.
select set_config('request.jwt.claims', '{"sub":"9d000000-0000-0000-0000-00000000000c","role":"authenticated"}', true);
select throws_ok($$ select public.group_drive_join(current_setting('t.code')) $$, null, 'You can''t join that group drive.', 'join: not when someone in it has a block with you');
select throws_ok($$ select public.group_drive_preview(current_setting('t.code')) $$, null, 'That group drive has ended, or the link is wrong.', 'preview: not shown to the leader''s block either');

-- Positions: A and B send theirs; each sees the other's and not their own.
select set_config('request.jwt.claims', '{"sub":"9d000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select is(public.group_drive_post_position(52.2, -1.0, 90, 20), true, 'post_position: A sends a UK position');
select throws_ok($$ select public.group_drive_post_position(40.0, -1.0, 90, 20) $$, null, 'Group drives are for UK roads only.', 'post_position: UK roads only');
select set_config('request.jwt.claims', '{"sub":"9d000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
select is(public.group_drive_post_position(52.3, -1.1, null, null), true, 'post_position: B sends theirs');
select is(public.group_drive_post_position(53.0, -1.1, null, null), true, 'post_position: a second one straight away is accepted but ignored');
select set_config('request.jwt.claims', '{"sub":"9d000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select is((public.group_drive_read()->'members'->0->>'lat')::numeric, 52.3, 'read: A sees B''s latest position (the quick second one was ignored, and only one row is kept)');

-- B stops sharing (clears), then leaves.
select set_config('request.jwt.claims', '{"sub":"9d000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
select is(public.group_drive_post_position(null, null), true, 'post_position: null clears your position');
select set_config('request.jwt.claims', '{"sub":"9d000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select is(public.group_drive_read()->'members'->0->>'lat', null::text, 'read: a cleared position isn''t given out');
select set_config('request.jwt.claims', '{"sub":"9d000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
select throws_ok($$ select public.group_drive_end() $$, null, 'Only the person who started the group drive can end it for everyone.', 'end: only the person who started it');
select public.group_drive_leave();
reset role;
select is((select count(*)::int from public.group_drive_members where user_id = '9d000000-0000-0000-0000-00000000000b'), 0, 'leave: their row, and so their position, is gone');

-- The leader ends it: everything goes.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"9d000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select public.group_drive_join(current_setting('t.code'));
select public.group_drive_end();
reset role;
select is((select count(*)::int from public.group_drives) + (select count(*)::int from public.group_drive_members), 0, 'end: the group and every member row are deleted');

-- The last person leaving ends it, and the leader hands over.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"9d000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select set_config('t.code', (select public.group_drive_start('none', null)->>'code'), false);
select set_config('request.jwt.claims', '{"sub":"9d000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
select public.group_drive_join(current_setting('t.code'));
select set_config('request.jwt.claims', '{"sub":"9d000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select public.group_drive_leave();
reset role;
select is((select leader_id::text from public.group_drives), '9d000000-0000-0000-0000-00000000000b', 'leave: when the leader leaves the longest-standing member leads');
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"9d000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
select public.group_drive_leave();
reset role;
select is((select count(*)::int from public.group_drives), 0, 'leave: the last person leaving deletes the group');

-- Six hours.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"9d000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select public.group_drive_start('none', null);
reset role;
update public.group_drives set expires_at = now() - interval '1 minute';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"9d000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select is(public.group_drive_read()->>'active', 'false', 'expiry: a group past 6 hours is gone the next time anyone asks');
reset role;
select is((select count(*)::int from public.group_drives) + (select count(*)::int from public.group_drive_members), 0, 'expiry: its rows are deleted, not just hidden');

select * from finish();
rollback;

-- Community: Cars near you, connections, blocks, messages (1-to-1 and groups),
-- the forum, rate builds, reports and rate limits. Everything rolls back.
--
-- Users (Lincoln, made up): A, B (2-3 mi away), C (about 10 mi north), D (near,
-- hides from Cars near you), E (Plymouth), S staff.

begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(163);

insert into auth.users (id, email) values
  ('c0000000-0000-0000-0000-00000000000a', 'ca@example.test'),
  ('c0000000-0000-0000-0000-00000000000b', 'cb@example.test'),
  ('c0000000-0000-0000-0000-00000000000c', 'cc@example.test'),
  ('c0000000-0000-0000-0000-00000000000d', 'cd@example.test'),
  ('c0000000-0000-0000-0000-00000000000e', 'ce@example.test'),
  ('c0000000-0000-0000-0000-000000000005', 'cs@example.test');

update public.profiles set handle = 'comm_' || right(id::text, 1), display_name = 'Person ' || right(id::text, 1), region = 'East', onboarded = true
  where id::text like 'c0000000-0000-0000-0000-0000000000%';

insert into public.profile_homes (user_id, home) values
  ('c0000000-0000-0000-0000-00000000000a', private.pt(53.23, -0.54)),
  ('c0000000-0000-0000-0000-00000000000b', private.pt(53.21, -0.50)),
  ('c0000000-0000-0000-0000-00000000000c', private.pt(53.40, -0.54)),
  ('c0000000-0000-0000-0000-00000000000d', private.pt(53.24, -0.55)),
  ('c0000000-0000-0000-0000-00000000000e', private.pt(50.37, -4.14));

insert into public.builds (id, owner_id, kind, make, model, stock_bhp, weight_kg) values
  ('cb000000-0000-0000-0000-00000000000a', 'c0000000-0000-0000-0000-00000000000a', 'car', 'Honda', 'Civic Type R', 316, 1430),
  ('cb000000-0000-0000-0000-00000000000b', 'c0000000-0000-0000-0000-00000000000b', 'bike', 'Yamaha', 'R6', 118, 190);

insert into public.staff (user_id, note) values ('c0000000-0000-0000-0000-000000000005', 'moderator');

set local role authenticated;

-- ---------------------------------------------------------------------------
-- Cars near you
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"c0000000-0000-0000-0000-00000000000d","role":"authenticated"}', true);
select lives_ok($$ select public.save_community_prefs(false) $$, 'save_community_prefs: D hides from Cars near you');

select set_config('request.jwt.claims', '{"sub":"c0000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select is((select miles from public.people_near(25) where user_id = 'c0000000-0000-0000-0000-00000000000b'), 5,
  'people_near: B is "under 5 mi" (rounded, never exact)');
select is((select miles from public.people_near(25) where user_id = 'c0000000-0000-0000-0000-00000000000c'), 10,
  'people_near: C is about 10 mi (coarse homes, rounded to 2)');
select is((select count(*)::int from public.people_near(25) where user_id = 'c0000000-0000-0000-0000-00000000000e'), 0,
  'people_near: nobody beyond the distance');
select is((select count(*)::int from public.people_near(25) where user_id = 'c0000000-0000-0000-0000-00000000000a'), 0,
  'people_near: never yourself');
select is((select count(*)::int from public.people_near(25) where user_id = 'c0000000-0000-0000-0000-00000000000d'), 0,
  'people_near: people who hid themselves aren''t listed');
select is((select count(*)::int from public.people_near(5) where user_id = 'c0000000-0000-0000-0000-00000000000c'), 0,
  'people_near: the distance filter applies');
select is((select count(*)::int from public.people_near()), 2, 'people_near: defaults to your travel distance (25 mi)');
select throws_ok($$ select * from public.people_near(301) $$, 'P0001', 'Pick a distance from 1 to 300 miles.', 'people_near: 1 to 300 mi');
select is(private.rough_miles(13.2), 14, 'rough_miles: to the nearest 2 under 20 mi');
select is(private.rough_miles(33), 35, 'rough_miles: to the nearest 5 under 50 mi');
select is(private.rough_miles(87), 90, 'rough_miles: to the nearest 10 beyond');
select is((select count(*)::int from public.profile_settings where user_id = 'c0000000-0000-0000-0000-00000000000d'), 0,
  'profile_settings: someone else''s choice isn''t readable');

-- ---------------------------------------------------------------------------
-- Connections
-- ---------------------------------------------------------------------------
select is(public.request_connection('c0000000-0000-0000-0000-00000000000b'), 'requested', 'request_connection: A asks B');
select is(public.request_connection('c0000000-0000-0000-0000-00000000000b'), 'requested', 'request_connection: asking again changes nothing');
select is((select state from public.my_connections() where user_id = 'c0000000-0000-0000-0000-00000000000b'), 'outgoing', 'my_connections: A sees Requested');
select throws_ok($$ select public.request_connection('c0000000-0000-0000-0000-00000000000a') $$, 'P0001', 'You can''t connect with yourself.', 'request_connection: not yourself');
select throws_ok($$ select public.start_direct('c0000000-0000-0000-0000-00000000000b') $$, 'P0001',
  'You can only message people you''re connected with.', 'start_direct: not before the request is accepted');
select throws_ok($$ insert into public.connections (requester_id, addressee_id, status) values ('c0000000-0000-0000-0000-00000000000a', 'c0000000-0000-0000-0000-00000000000c', 'accepted') $$,
  '42501', null, 'connections: no direct writes');
select throws_ok($$ insert into public.conversations (kind, name) values ('group', 'Sneaky') $$, '42501', null, 'conversations: no direct inserts');
select throws_ok($$ insert into public.conversation_members (conversation_id, user_id) values (gen_random_uuid(), 'c0000000-0000-0000-0000-00000000000a') $$,
  '42501', null, 'conversation_members: no direct inserts');

select set_config('request.jwt.claims', '{"sub":"c0000000-0000-0000-0000-00000000000c","role":"authenticated"}', true);
select is((select count(*)::int from public.connections), 0, 'connections: C can''t see A and B''s request');

select set_config('request.jwt.claims', '{"sub":"c0000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
select is((select state from public.my_connections() where user_id = 'c0000000-0000-0000-0000-00000000000a'), 'incoming', 'my_connections: B sees the request');
select throws_ok($$ select public.answer_connection('c0000000-0000-0000-0000-00000000000c', true) $$, 'P0001',
  'That request isn''t there any more.', 'answer_connection: only requests to you');
select lives_ok($$ select public.answer_connection('c0000000-0000-0000-0000-00000000000a', true) $$, 'answer_connection: B accepts');
select is((select state from public.my_connections() where user_id = 'c0000000-0000-0000-0000-00000000000a'), 'connected', 'my_connections: connected');
select ok(private.are_connected('c0000000-0000-0000-0000-00000000000a', 'c0000000-0000-0000-0000-00000000000b'), 'are_connected: either way round');

-- Decline: B asks C, C declines. B is never told.
select is(public.request_connection('c0000000-0000-0000-0000-00000000000c'), 'requested', 'request_connection: B asks C');
select set_config('request.jwt.claims', '{"sub":"c0000000-0000-0000-0000-00000000000c","role":"authenticated"}', true);
select lives_ok($$ select public.answer_connection('c0000000-0000-0000-0000-00000000000b', false) $$, 'answer_connection: C declines');
select is((select count(*)::int from public.my_connections()), 0, 'decline: C no longer lists it');
select set_config('request.jwt.claims', '{"sub":"c0000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
select is((select state from public.my_connections() where user_id = 'c0000000-0000-0000-0000-00000000000c'), 'outgoing', 'decline: B still sees Requested');
select is((select count(*)::int from public.connections where addressee_id = 'c0000000-0000-0000-0000-00000000000c'), 0,
  'decline: the declined row isn''t readable by the asker');
select is(public.request_connection('c0000000-0000-0000-0000-00000000000c'), 'requested', 'decline: asking again within 30 days changes nothing');
reset role;
select is((select status::text from public.connections where requester_id = 'c0000000-0000-0000-0000-00000000000b' and addressee_id = 'c0000000-0000-0000-0000-00000000000c'),
  'declined', 'decline: the row stays declined (no new request reaches C)');
update public.connections set answered_at = now() - interval '31 days'
  where requester_id = 'c0000000-0000-0000-0000-00000000000b' and addressee_id = 'c0000000-0000-0000-0000-00000000000c';
set local role authenticated;
select is(public.request_connection('c0000000-0000-0000-0000-00000000000c'), 'requested', 'decline: after 30 days B can ask again');
select set_config('request.jwt.claims', '{"sub":"c0000000-0000-0000-0000-00000000000c","role":"authenticated"}', true);
select is((select state from public.my_connections() where user_id = 'c0000000-0000-0000-0000-00000000000b'), 'incoming', 'decline: C sees the new request');

-- Asking someone who already asked you connects you.
select set_config('request.jwt.claims', '{"sub":"c0000000-0000-0000-0000-00000000000d","role":"authenticated"}', true);
select is(public.request_connection('c0000000-0000-0000-0000-00000000000a'), 'requested', 'request_connection: D asks A');
select set_config('request.jwt.claims', '{"sub":"c0000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select is(public.request_connection('c0000000-0000-0000-0000-00000000000d'), 'connected', 'request_connection: A asking D back connects them');

-- Rate limit: 20 requests a day.
reset role;
insert into private.rate_hits (user_id, kind) select 'c0000000-0000-0000-0000-00000000000e', 'connect' from generate_series(1, 20);
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"c0000000-0000-0000-0000-00000000000e","role":"authenticated"}', true);
select throws_ok($$ select public.request_connection('c0000000-0000-0000-0000-00000000000a') $$, 'P0001',
  'That''s the most connection requests for one day. Try again tomorrow.', 'rate limit: 20 connection requests a day');
select throws_ok($$ select * from private.rate_hits $$, '42501', null, 'rate_hits: not readable');

-- ---------------------------------------------------------------------------
-- 1-to-1 messages
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"c0000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select set_config('t.dm', public.start_direct('c0000000-0000-0000-0000-00000000000b')::text, true);
select is(public.start_direct('c0000000-0000-0000-0000-00000000000b')::text, current_setting('t.dm'), 'start_direct: one conversation per pair');
select set_config('t.msg', (select id::text from public.send_message(current_setting('t.dm')::uuid, 'Morning, still on for Sunday?')), true);
select isnt(current_setting('t.msg'), null, 'send_message: A messages B');
select throws_ok($$ insert into public.messages (conversation_id, sender_id, body) values (current_setting('t.dm')::uuid, auth.uid(), 'direct') $$,
  '42501', null, 'messages: no direct inserts (send_message only)');
select throws_ok(format($$ select public.send_message(%L, '', 'c0000000-0000-0000-0000-00000000000b/%s/x.jpg') $$, current_setting('t.dm'), current_setting('t.dm')),
  'P0001', 'That photo isn''t one of yours.', 'send_message: photos only from your own folder');
select throws_ok(format($$ select public.send_message(%L, '', null, '{"kind":"spot","id":"x","title":"Y"}') $$, current_setting('t.dm')),
  'P0001', 'That can''t be shared.', 'send_message: only events, places and builds are shared');
select lives_ok(format($$ select public.send_message(%L, '', null, '{"kind":"build","id":"cb000000-0000-0000-0000-00000000000a","title":"Honda Civic Type R","subtitle":"Class A"}') $$, current_setting('t.dm')),
  'send_message: share a build as a card');
select throws_ok(format($$ select public.send_message(%L, '   ') $$, current_setting('t.dm')), 'P0001', 'Write a message first.', 'send_message: not empty');

-- (One transaction has one now(): put B's "read up to" before the messages.)
reset role;
update public.conversation_members set last_read_at = now() - interval '1 minute' where user_id = 'c0000000-0000-0000-0000-00000000000b';
update public.messages set created_at = now() - interval '10 seconds' where conversation_id = current_setting('t.dm')::uuid;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"c0000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
select is((select count(*)::int from public.messages where conversation_id = current_setting('t.dm')::uuid), 2, 'messages: B reads them');
select is((select unread from public.my_conversations() where id = current_setting('t.dm')::uuid), 2, 'my_conversations: 2 unread for B');
select ok((select can_send from public.my_conversations() where id = current_setting('t.dm')::uuid), 'my_conversations: B can reply');
select lives_ok(format($$ select public.mark_conversation_read(%L) $$, current_setting('t.dm')), 'mark_conversation_read: B reads it');
select is((select unread from public.my_conversations() where id = current_setting('t.dm')::uuid), 0, 'my_conversations: nothing unread');

select set_config('request.jwt.claims', '{"sub":"c0000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select ok((select m.last_read_at >= (select max(x.created_at) from public.messages x where x.conversation_id = m.conversation_id)
           from public.conversation_members m where m.conversation_id = current_setting('t.dm')::uuid and m.user_id = 'c0000000-0000-0000-0000-00000000000b'),
  'Seen: A can see B has read up to the last message');

select set_config('request.jwt.claims', '{"sub":"c0000000-0000-0000-0000-00000000000c","role":"authenticated"}', true);
select is((select count(*)::int from public.messages where conversation_id = current_setting('t.dm')::uuid), 0, 'messages: C can''t read A and B''s chat');
select is((select count(*)::int from public.conversations where id = current_setting('t.dm')::uuid), 0, 'conversations: C can''t see it');
select is((select count(*)::int from public.conversation_members where conversation_id = current_setting('t.dm')::uuid), 0, 'conversation_members: C can''t see who''s in it');
select throws_ok(format($$ select public.send_message(%L, 'let me in') $$, current_setting('t.dm')), 'P0001',
  'You can only message people you''re connected with.', 'send_message: not into someone else''s chat');
select throws_ok(format($$ insert into storage.objects (bucket_id, name) values ('messages', 'c0000000-0000-0000-0000-00000000000c/%s/a.jpg') $$, current_setting('t.dm')),
  '42501', null, 'storage: no uploads into a chat you''re not in');

select set_config('request.jwt.claims', '{"sub":"c0000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select lives_ok(format($$ insert into storage.objects (bucket_id, name) values ('messages', 'c0000000-0000-0000-0000-00000000000a/%s/a.jpg') $$, current_setting('t.dm')),
  'storage: a member uploads a photo into their folder for the chat');
select set_config('request.jwt.claims', '{"sub":"c0000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
select is((select count(*)::int from storage.objects where bucket_id = 'messages' and name like '%' || current_setting('t.dm') || '%'), 1,
  'storage: the other member can read it');
select set_config('request.jwt.claims', '{"sub":"c0000000-0000-0000-0000-00000000000c","role":"authenticated"}', true);
select is((select count(*)::int from storage.objects where bucket_id = 'messages'), 0, 'storage: nobody else can');

-- Rate limit: 20 messages a minute.
reset role;
insert into private.rate_hits (user_id, kind) select 'c0000000-0000-0000-0000-00000000000b', 'message' from generate_series(1, 20);
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"c0000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
select throws_ok(format($$ select public.send_message(%L, 'spam') $$, current_setting('t.dm')), 'P0001',
  'Slow down a little: that''s a lot of messages in a minute.', 'rate limit: 20 messages a minute');
reset role;
delete from private.rate_hits where user_id = 'c0000000-0000-0000-0000-00000000000b' and kind = 'message';
set local role authenticated;

-- Removing the connection ends 1-to-1 messages.
select set_config('request.jwt.claims', '{"sub":"c0000000-0000-0000-0000-00000000000d","role":"authenticated"}', true);
select set_config('t.dm2', public.start_direct('c0000000-0000-0000-0000-00000000000a')::text, true);
select lives_ok($$ select public.remove_connection('c0000000-0000-0000-0000-00000000000a') $$, 'remove_connection: D removes A');
select throws_ok(format($$ select public.send_message(%L, 'still there?') $$, current_setting('t.dm2')), 'P0001',
  'You can only message people you''re connected with.', 'remove_connection: no more 1-to-1 messages');
select is((select can_send from public.my_conversations() where id = current_setting('t.dm2')::uuid), false, 'my_conversations: can_send is false');
select throws_ok($$ select public.start_direct('c0000000-0000-0000-0000-00000000000a') $$, 'P0001',
  'You can only message people you''re connected with.', 'start_direct: not after disconnecting');

-- ---------------------------------------------------------------------------
-- Groups
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"c0000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
select set_config('request.jwt.claims', '{"sub":"c0000000-0000-0000-0000-00000000000c","role":"authenticated"}', true);
select lives_ok($$ select public.answer_connection('c0000000-0000-0000-0000-00000000000b', true) $$, 'setup: C accepts B');

select set_config('request.jwt.claims', '{"sub":"c0000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
select throws_ok($$ select public.create_group('Sunday run', array['c0000000-0000-0000-0000-00000000000d'::uuid]) $$, 'P0001',
  'You can only message people you''re connected with.', 'create_group: only your connections');
select throws_ok($$ select public.create_group('Too many', array(select gen_random_uuid() from generate_series(1, 50))) $$, 'P0001',
  'Groups can have up to 50 people.', 'create_group: up to 50 people');
select throws_ok($$ select public.create_group('  ', array['c0000000-0000-0000-0000-00000000000a'::uuid]) $$, 'P0001',
  'Give the group a name.', 'create_group: needs a name');
select set_config('t.grp', public.create_group('Sunday run', array['c0000000-0000-0000-0000-00000000000a'::uuid, 'c0000000-0000-0000-0000-00000000000c'::uuid])::text, true);
select is((select count(*)::int from public.conversation_members where conversation_id = current_setting('t.grp')::uuid), 3, 'create_group: B, A and C');
select is((select role from public.conversation_members where conversation_id = current_setting('t.grp')::uuid and user_id = auth.uid()), 'admin', 'create_group: the creator is admin');

select set_config('request.jwt.claims', '{"sub":"c0000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select throws_ok(format($$ select public.add_group_members(%L, array['c0000000-0000-0000-0000-00000000000d'::uuid]) $$, current_setting('t.grp')), 'P0001',
  'Only the group''s admins can add people.', 'add_group_members: admins only');
select throws_ok(format($$ select public.remove_group_member(%L, 'c0000000-0000-0000-0000-00000000000c') $$, current_setting('t.grp')), 'P0001',
  'Only the group''s admins can remove people.', 'remove_group_member: admins only');
select lives_ok(format($$ select public.send_message(%L, 'In') $$, current_setting('t.grp')), 'groups: members write');

select set_config('request.jwt.claims', '{"sub":"c0000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
select lives_ok(format($$ select public.remove_group_member(%L, 'c0000000-0000-0000-0000-00000000000c') $$, current_setting('t.grp')), 'remove_group_member: the admin removes C');
select set_config('request.jwt.claims', '{"sub":"c0000000-0000-0000-0000-00000000000c","role":"authenticated"}', true);
select is((select count(*)::int from public.messages where conversation_id = current_setting('t.grp')::uuid), 0, 'groups: someone removed can''t read it any more');
select throws_ok(format($$ select public.send_message(%L, 'back') $$, current_setting('t.grp')), 'P0001',
  'You can only message people you''re connected with.', 'groups: or write in it');

select set_config('request.jwt.claims', '{"sub":"c0000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
select lives_ok(format($$ select public.leave_conversation(%L) $$, current_setting('t.grp')), 'leave_conversation: the only admin leaves');
select set_config('request.jwt.claims', '{"sub":"c0000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select is((select role from public.conversation_members where conversation_id = current_setting('t.grp')::uuid and user_id = auth.uid()), 'admin',
  'leave_conversation: the longest-standing member becomes admin');
select ok(exists (select 1 from public.messages where conversation_id = current_setting('t.grp')::uuid and system and body like '%left'),
  'leave_conversation: a line says they left');

-- ---------------------------------------------------------------------------
-- Blocks
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"c0000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
select set_config('t.bthread', public.create_thread('advice', null, 'Which tyres for a wet winter?', 'Any tips?')::text, true);

select set_config('request.jwt.claims', '{"sub":"c0000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select lives_ok($$ select public.block_user('c0000000-0000-0000-0000-00000000000b') $$, 'block_user: A blocks B');
select ok(not private.are_connected('c0000000-0000-0000-0000-00000000000a', 'c0000000-0000-0000-0000-00000000000b'), 'block_user: the connection is removed');
select throws_ok(format($$ select public.send_message(%L, 'hi') $$, current_setting('t.dm')), 'P0001',
  'You can only message people you''re connected with.', 'block_user: A can''t message B');
select is((select count(*)::int from public.forum_threads where id = current_setting('t.bthread')::uuid), 0, 'block_user: B''s threads are hidden from A');
select is((select count(*)::int from public.people_near(25) where user_id = 'c0000000-0000-0000-0000-00000000000b'), 0, 'block_user: B is gone from A''s Cars near you');
select is((select count(*)::int from public.blocks), 1, 'blocks: A reads their own blocks');
select set_config('request.jwt.claims', '{"sub":"c0000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
select is((select count(*)::int from public.blocks), 0, 'blocks: B can''t see that A blocked them');
select throws_ok(format($$ select public.send_message(%L, 'why?') $$, current_setting('t.dm')), 'P0001',
  'You can only message people you''re connected with.', 'block_user: B can''t message A');
select throws_ok($$ select public.request_connection('c0000000-0000-0000-0000-00000000000a') $$, 'P0001',
  'You can''t connect with this person.', 'block_user: B can''t ask to connect again');
select is((select count(*)::int from public.people_near(25) where user_id = 'c0000000-0000-0000-0000-00000000000a'), 0, 'block_user: A is gone from B''s Cars near you');

-- ---------------------------------------------------------------------------
-- Forum
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"c0000000-0000-0000-0000-00000000000c","role":"authenticated"}', true);
select set_config('t.thread', public.create_thread('advice', null, 'Clutch slipping in 3rd', 'Stage 2 on the stock clutch. Advice?', '{}', null)::text, true);
select isnt(current_setting('t.thread'), null, 'create_thread: C asks for advice');
select throws_ok($$ select public.create_thread('advice', null, 'Hi', '') $$, 'P0001', 'Give it a title of at least 4 characters.', 'create_thread: a real title');
select throws_ok($$ select public.create_thread('local', null, 'Meet up?', '') $$, 'P0001', 'Pick a region for the Local board.', 'create_thread: Local needs a region');
select throws_ok($$ select public.create_thread('cars', null, 'You absolute c.u.n.t', '') $$, 'P0001',
  'Keep it friendly: that has a word Nightshift doesn''t allow.', 'filter: words Nightshift doesn''t allow, dotted out too');
select throws_ok($$ select public.create_thread('meets', null, 'Heads up', 'Police spotted on the ring road') $$, 'P0001',
  'Posts about where police or speed checks are aren''t allowed on Nightshift.', 'filter: no police spotting');
select throws_ok($$ select public.create_thread('meets', null, 'Friday night', 'Street racing on the A46 after') $$, 'P0001',
  'Nightshift doesn''t allow organising or timing racing on public roads. Track days are fine.', 'filter: no racing on public roads');
select lives_ok($$ select public.create_thread('advice', null, 'Pulled by police at a meet', 'Got a ticket for my exhaust, what are my options?') $$,
  'filter: talking about the police isn''t spotting them');
select throws_ok($$ select public.create_thread('builds', null, 'My build', '', array['c0000000-0000-0000-0000-00000000000a/forum/x.jpg']) $$, 'P0001',
  'That photo isn''t one of yours.', 'create_thread: photos from your own folder only');
select throws_ok($$ select public.create_thread('builds', null, 'My build', '', '{}', 'cb000000-0000-0000-0000-00000000000a') $$, 'P0001',
  'You can only link your own builds.', 'create_thread: only your own builds are linked');
select throws_ok($$ insert into public.forum_threads (board, author_id, title) values ('cars', auth.uid(), 'Direct') $$, '42501', null, 'forum_threads: no direct inserts');
select throws_ok(format($$ update public.forum_threads set title = 'Changed' where id = %L $$, current_setting('t.thread')), '42501', null, 'forum_threads: no direct edits');

select set_config('request.jwt.claims', '{"sub":"c0000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select set_config('t.reply', public.reply_thread(current_setting('t.thread')::uuid, 'Uprated clutch, the stock one won''t hold it.')::text, true);
select is((select reply_count from public.forum_threads where id = current_setting('t.thread')::uuid), 1, 'reply_thread: the count goes up');
select throws_ok(format($$ select public.mark_solved(%L, %L) $$, current_setting('t.thread'), current_setting('t.reply')), 'P0001',
  'Only the person who started the thread can mark it solved.', 'mark_solved: the thread''s author only');
select throws_ok(format($$ select public.mark_helpful(%L, true) $$, current_setting('t.reply')), 'P0001',
  'You can''t mark your own reply as helpful.', 'mark_helpful: not your own');

select set_config('request.jwt.claims', '{"sub":"c0000000-0000-0000-0000-00000000000c","role":"authenticated"}', true);
select lives_ok(format($$ select public.mark_helpful(%L, true) $$, current_setting('t.reply')), 'mark_helpful: C finds it helpful');
select is((select helpful_count from public.forum_replies where id = current_setting('t.reply')::uuid), 1, 'mark_helpful: counted once');
select lives_ok(format($$ select public.mark_solved(%L, %L) $$, current_setting('t.thread'), current_setting('t.reply')), 'mark_solved: C marks A''s reply');
select is((select rep from public.forum_rep_for(array['c0000000-0000-0000-0000-00000000000a'::uuid])), 25, 'mark_solved: +25 rep for the answer');
-- Farming: the same person marking the same helper again within a week pays nothing.
select set_config('t.thread2', public.create_thread('advice', null, 'Best wax for winter?', '')::text, true);
select set_config('request.jwt.claims', '{"sub":"c0000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select set_config('t.reply2', public.reply_thread(current_setting('t.thread2')::uuid, 'A ceramic spray every month.')::text, true);
select set_config('request.jwt.claims', '{"sub":"c0000000-0000-0000-0000-00000000000c","role":"authenticated"}', true);
select lives_ok(format($$ select public.mark_solved(%L, %L) $$, current_setting('t.thread2'), current_setting('t.reply2')), 'mark_solved: again, the same pair');
select is((select solved || '/' || rep from public.forum_rep_for(array['c0000000-0000-0000-0000-00000000000a'::uuid])), '2/25',
  'mark_solved: counted, but no more rep from the same person this week');
select lives_ok(format($$ select public.mark_solved(%L, %L) $$, current_setting('t.thread'), current_setting('t.reply')), 'mark_solved: re-marking pays nothing again');
select is((select rep from public.forum_rep_for(array['c0000000-0000-0000-0000-00000000000a'::uuid])), 25, 'mark_solved: once per thread');

-- Rate limit: 3 new threads in 10 minutes.
reset role;
insert into private.rate_hits (user_id, kind) select 'c0000000-0000-0000-0000-00000000000c', 'thread' from generate_series(1, 3);
set local role authenticated;
select throws_ok($$ select public.create_thread('cars', null, 'One more thing', '') $$, 'P0001', 'You''re posting a lot. Try again in a few minutes.',
  'rate limit: 3 threads in 10 minutes');

-- C blocks A: A's reply is hidden from C.
select lives_ok($$ select public.block_user('c0000000-0000-0000-0000-00000000000a') $$, 'block_user: C blocks A');
select is((select count(*)::int from public.forum_replies where thread_id = current_setting('t.thread')::uuid), 0, 'block_user: A''s replies are hidden from C');
select lives_ok($$ select public.unblock_user('c0000000-0000-0000-0000-00000000000a') $$, 'unblock_user');
select is((select count(*)::int from public.forum_replies where thread_id = current_setting('t.thread')::uuid), 1, 'unblock_user: they show again');

-- ---------------------------------------------------------------------------
-- Reports
-- ---------------------------------------------------------------------------
select throws_ok(format($$ select public.report_content('thread', %L, 'spam') $$, current_setting('t.thread')), 'P0001',
  'You can''t report yourself.', 'report_content: not yourself');
select throws_ok(format($$ select public.report_content('message', %L, 'harassment') $$, current_setting('t.msg')), 'P0001',
  'That isn''t there any more.', 'report_content: only messages you can see');
select set_config('request.jwt.claims', '{"sub":"c0000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
select lives_ok(format($$ select public.report_content('message', %L, 'harassment', 'Keeps messaging') $$, current_setting('t.msg')), 'report_content: B reports A''s message');
select lives_ok(format($$ select public.report_content('message', %L, 'harassment') $$, current_setting('t.msg')), 'report_content: twice is fine (counted once)');
select is((select count(*)::int from public.reports), 0, 'reports: only staff read them');
select lives_ok(format($$ select public.report_content('reply', %L, 'spam') $$, current_setting('t.reply')), 'report_content: B reports a reply');
select set_config('request.jwt.claims', '{"sub":"c0000000-0000-0000-0000-00000000000d","role":"authenticated"}', true);
select lives_ok(format($$ select public.report_content('reply', %L, 'spam') $$, current_setting('t.reply')), 'report_content: D too');
select set_config('request.jwt.claims', '{"sub":"c0000000-0000-0000-0000-00000000000e","role":"authenticated"}', true);
select lives_ok(format($$ select public.report_content('reply', %L, 'hate') $$, current_setting('t.reply')), 'report_content: and E');
select is((select count(*)::int from public.forum_replies where id = current_setting('t.reply')::uuid), 0, 'reports: three people hide it from everyone');
select throws_ok(format($$ select public.moderate_report((select gen_random_uuid()), 'hide') $$), 'P0001', 'Only staff can do that.', 'moderate_report: staff only');
select set_config('request.jwt.claims', '{"sub":"c0000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select is((select count(*)::int from public.forum_replies where id = current_setting('t.reply')::uuid), 1, 'reports: the author still sees it (hidden)');

select set_config('request.jwt.claims', '{"sub":"c0000000-0000-0000-0000-000000000005","role":"authenticated"}', true);
select is((select reports from public.moderation_queue where target = 'reply' and target_id = current_setting('t.reply')::uuid), 3, 'moderation_queue: staff see it, three reports');
select is((select excerpt from public.moderation_queue where target = 'message'), 'Morning, still on for Sunday?', 'moderation_queue: a reported message carries a copy');
select is((select count(*)::int from public.messages where id = current_setting('t.msg')::uuid), 0, 'staff: no blanket read of private messages');
select lives_ok(format($$ select public.moderate_report((select report_id from public.moderation_queue where target = 'reply' and target_id = %L), 'restore') $$, current_setting('t.reply')),
  'moderate_report: staff restore it');
select set_config('request.jwt.claims', '{"sub":"c0000000-0000-0000-0000-00000000000d","role":"authenticated"}', true);
select is((select count(*)::int from public.forum_replies where id = current_setting('t.reply')::uuid), 1, 'moderate_report: visible again');

-- ---------------------------------------------------------------------------
-- Feed posts
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"c0000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select throws_ok($$ select public.create_post('My drive', '{}', 53.232, -0.542, 'Home', 'public') $$, 'P0001',
  'That''s within about 1 km of your home area, so it can''t be shared. Pick a spot further away.', 'create_post: never at (or near) your home area');
select throws_ok($$ select public.create_post('   ') $$, 'P0001', 'Write something or add a photo.', 'create_post: not empty');
select throws_ok($$ select public.create_post('', array['c0000000-0000-0000-0000-00000000000b/posts/x.jpg']) $$, 'P0001',
  'That photo isn''t one of yours.', 'create_post: photos from your own folder only');
select throws_ok($$ select public.create_post('Speed trap at the A15 roundabout') $$, 'P0001',
  'Posts about where police or speed checks are aren''t allowed on Nightshift.', 'create_post: the same rules as the forum');
select set_config('t.post', public.create_post('Sunset at the cathedral', array['c0000000-0000-0000-0000-00000000000a/posts/p1.jpg'], 53.30, -0.60, 'Cathedral car park', 'public')::text, true);
select isnt(current_setting('t.post'), null, 'create_post: A posts a photo with a place');
select is((select round(lat::numeric, 2) from public.feed_posts('author', null, auth.uid()) where id = current_setting('t.post')::uuid), 53.30::numeric,
  'feed_posts: the place comes back as lat/lng');
select throws_ok($$ insert into public.posts (author_id, body) values (auth.uid(), 'direct') $$, '42501', null, 'posts: no direct inserts');

select set_config('request.jwt.claims', '{"sub":"c0000000-0000-0000-0000-00000000000c","role":"authenticated"}', true);
select set_config('t.cpost', public.create_post('Connections only: new wheels', '{}', null, null, null, 'connections')::text, true);
select set_config('request.jwt.claims', '{"sub":"c0000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
select is((select count(*)::int from public.feed_posts('connections') where id = current_setting('t.cpost')::uuid), 1, 'feed_posts: B (connected to C) sees C''s connections-only post');
select is((select count(*)::int from public.posts where id = current_setting('t.post')::uuid), 0, 'posts: B (blocked by A) can''t see A''s public post');
select set_config('request.jwt.claims', '{"sub":"c0000000-0000-0000-0000-00000000000d","role":"authenticated"}', true);
select is((select count(*)::int from public.posts where id = current_setting('t.cpost')::uuid), 0, 'posts: D (not connected to C) can''t read it');
select throws_ok(format($$ select public.like_post(%L, true) $$, current_setting('t.cpost')), 'P0001', 'That post isn''t there any more.', 'like_post: not on posts you can''t see');
select is((select count(*)::int from public.feed_posts('local') where id = current_setting('t.post')::uuid), 1, 'feed_posts: A''s public post is local to D');
select is((select count(*)::int from public.posts_in_box(53.0, -1.0, 53.5, 0.0) where id = current_setting('t.post')::uuid), 1, 'posts_in_box: on D''s map');
select lives_ok(format($$ select public.like_post(%L, true) $$, current_setting('t.post')), 'like_post: D likes it');
select lives_ok(format($$ select public.like_post(%L, true) $$, current_setting('t.post')), 'like_post: twice counts once');
select is((select like_count || ':' || liked_by_me from public.feed_posts('local') where id = current_setting('t.post')::uuid), '1:true', 'like_post: counted, and liked by me');
select lives_ok(format($$ select public.comment_post(%L, 'Proper shot that') $$, current_setting('t.post')), 'comment_post: D comments');
select throws_ok(format($$ select public.comment_post(%L, 'fuck off') $$, current_setting('t.post')), 'P0001',
  'Keep it friendly: that has a word Nightshift doesn''t allow.', 'comment_post: the word filter');
select is((select comment_count from public.posts where id = current_setting('t.post')::uuid), 1, 'comment_post: counted');
select lives_ok(format($$ select public.report_content('post', %L, 'spam') $$, current_setting('t.post')), 'report_content: posts can be reported');

-- ---------------------------------------------------------------------------
-- Rate builds
-- ---------------------------------------------------------------------------
select lives_ok($$ select public.rate_build('cb000000-0000-0000-0000-00000000000a', true) $$, 'rate_build: D likes A''s build');
select set_config('request.jwt.claims', '{"sub":"c0000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select throws_ok($$ select public.rate_build('cb000000-0000-0000-0000-00000000000a', true) $$, 'P0001', 'You can''t rate your own build.', 'rate_build: not your own');
select is((select likes from public.build_likes(array['cb000000-0000-0000-0000-00000000000a'::uuid])), 1, 'build_likes: counts only');
select is((select count(*)::int from public.build_ratings), 0, 'build_ratings: you only read your own');

-- ---------------------------------------------------------------------------
-- Signed out
-- ---------------------------------------------------------------------------
reset role;
set local role anon;
select throws_ok($$ select * from public.people_near(25) $$, '42501', null, 'signed out: no Cars near you');
select throws_ok($$ select * from public.forum_threads $$, '42501', null, 'signed out: no forum');
select throws_ok($$ select * from public.my_conversations() $$, '42501', null, 'signed out: no messages');
select throws_ok($$ select * from public.feed_posts('local') $$, '42501', null, 'signed out: no feed');
reset role;
select is((select count(*)::int from pg_publication_tables where pubname = 'supabase_realtime' and tablename in ('messages', 'conversation_members', 'connections')), 3,
  'realtime: messages, members and connections are published');

select * from finish();
rollback;

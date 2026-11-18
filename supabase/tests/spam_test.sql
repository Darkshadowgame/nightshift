-- Spam and selling (20261118180000): the normaliser, near duplicates, duplicates
-- within and across kinds, private-chat blasting, the cooldown and its automatic
-- report, the selling detector, the sell-only limits, the For sale & wanted cap,
-- the sell-only report and what staff see. Everything rolls back.
--
-- Users (made up): P spammer, F1-F3 P's connections, R seller, Q ratio seller,
-- L lister, S staff (admin), N nobody special.

begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(57);

insert into auth.users (id, email) values
  ('e5000000-0000-0000-0000-000000000001', 'sp-p@example.test'),
  ('e5000000-0000-0000-0000-000000000002', 'sp-f1@example.test'),
  ('e5000000-0000-0000-0000-000000000003', 'sp-f2@example.test'),
  ('e5000000-0000-0000-0000-000000000004', 'sp-f3@example.test'),
  ('e5000000-0000-0000-0000-000000000005', 'sp-r@example.test'),
  ('e5000000-0000-0000-0000-000000000006', 'sp-q@example.test'),
  ('e5000000-0000-0000-0000-000000000007', 'sp-l@example.test'),
  ('e5000000-0000-0000-0000-000000000008', 'sp-s@example.test'),
  ('e5000000-0000-0000-0000-000000000009', 'sp-n@example.test');
update public.profiles set handle = 'spam_' || right(id::text, 1), display_name = 'Spam ' || right(id::text, 1), region = 'East', onboarded = true
  where id::text like 'e5000000-0000-0000-0000-00000000000%';
insert into public.staff (user_id, role, note) values ('e5000000-0000-0000-0000-000000000008', 'admin', 'test admin');
insert into public.connections (requester_id, addressee_id, status) values
  ('e5000000-0000-0000-0000-000000000001', 'e5000000-0000-0000-0000-000000000002', 'accepted'),
  ('e5000000-0000-0000-0000-000000000001', 'e5000000-0000-0000-0000-000000000003', 'accepted'),
  ('e5000000-0000-0000-0000-000000000001', 'e5000000-0000-0000-0000-000000000004', 'accepted');
insert into public.posts (id, author_id, body) values ('e5a00000-0000-0000-0000-000000000001', 'e5000000-0000-0000-0000-000000000009', 'A post to comment on');
insert into public.events (id, type, title, starts_at, ends_at, reveal_minutes_before, area, area_radius_miles, area_name, invite_min_mods, created_by) values
  ('e5e00000-0000-0000-0000-000000000001', 'meet', 'Spam meet', now() + interval '1 day', null, 60, private.pt(52.2, 0.12), 3, 'Cambridge', 0, 'e5000000-0000-0000-0000-000000000009');
insert into public.event_hosts (event_id, user_id) values ('e5e00000-0000-0000-0000-000000000001', 'e5000000-0000-0000-0000-000000000009');
insert into public.event_going (event_id, user_id) values ('e5e00000-0000-0000-0000-000000000001', 'e5000000-0000-0000-0000-000000000001');

-- ---------------------------------------------------------------------------
-- The pure helpers
-- ---------------------------------------------------------------------------
select is(private.spam_normalise(E'  Check   OUT my page!!! \U0001F697🔥  '), 'check out my page', 'normalise: lower case, punctuation and emoji gone, spaces collapsed');
select ok(private.near_duplicate('check out my detailing page in leeds', 'check out my detailing page in leeds'), 'near duplicate: the same text');
select ok(private.near_duplicate('check out my detailing page in leeds today', 'check out my detailing page in leeds todays'), 'near duplicate: one letter different is still the same');
select ok(not private.near_duplicate('check out my detailing page in leeds', 'anyone going to the cars and coffee sunday'), 'near duplicate: different text isn''t');
select ok(not private.near_duplicate('see you there mate', 'see you there mat'), 'near duplicate: short texts must match exactly');
select ok(not private.near_duplicate('nice one', 'nice one'), 'near duplicate: very short texts never count');
select ok(private.is_selling('Coilovers £400 ono'), 'selling: price and ono');
select ok(private.is_selling('For sale: 18 inch BBS, collection only'), 'selling: for sale');
select ok(private.is_selling('All on ebay.co.uk/itm/12345 have a look'), 'selling: a marketplace link');
select ok(private.is_selling('Use my code DRIFT10 at checkout'), 'selling: discount codes');
select ok(private.is_selling('Exhaust £250 plus postage'), 'selling: price and postage');
select ok(not private.is_selling('Spent £400 on coilovers and it rides like a dream'), 'not selling: talking about what you spent');
select ok(not private.is_selling('Sold my old car last year and miss it'), 'not selling: sold my old car');
select ok(not private.is_selling('The selling point of this car is the chassis'), 'not selling: the selling point');

-- ---------------------------------------------------------------------------
-- Duplicates within and across kinds
-- ---------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"e5000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
select lives_ok($$ select public.create_post('Follow my detailing page for deals in Leeds!') $$, 'duplicates: the first copy');
select lives_ok($$ select public.create_post('follow my DETAILING page for deals in leeds') $$, 'duplicates: the second copy');
select is((select count(*)::int from public.posts where author_id = auth.uid() and is_repeat), 1, 'duplicates: the second copy is flagged as a repeat');
select throws_ok($$ select public.create_post('Follow my detailing page for deals in Leeds 🚗') $$, 'P0001',
  'You''ve already posted that. Spamming the same message isn''t allowed.', 'duplicates: the third copy is refused');
select throws_ok($$ select public.comment_post('e5a00000-0000-0000-0000-000000000001', 'Follow my detailing page for deals in Leeds') $$, 'P0001',
  'You''ve already posted that. Spamming the same message isn''t allowed.', 'duplicates: across kinds (a comment)');
select throws_ok($$ select public.create_thread('cars', null, 'Follow my detailing page', 'for deals in Leeds') $$, 'P0001',
  'You''ve already posted that. Spamming the same message isn''t allowed.', 'duplicates: across kinds (a thread: title and body)');
select throws_ok($$ select public.comment_post('e5a00000-0000-0000-0000-000000000001', 'Follow my detailing page for deal in Leeds') $$, 'P0001',
  'You''ve already posted that. Spamming the same message isn''t allowed.', 'duplicates: a near copy (90% alike) is refused too');
select lives_ok($$ select public.comment_post('e5a00000-0000-0000-0000-000000000001', 'Nice one') $$, 'duplicates: short replies');
select lives_ok($$ select public.comment_post('e5a00000-0000-0000-0000-000000000001', 'Nice one') $$, 'duplicates: short replies again');
select lives_ok($$ select public.comment_post('e5a00000-0000-0000-0000-000000000001', 'Nice one') $$, 'duplicates: short replies never count');

-- Event chat (a direct insert, checked by a trigger).
select lives_ok($$ insert into public.chat_messages (event_id, body) values ('e5e00000-0000-0000-0000-000000000001', 'Anyone want a lift from the services?') $$, 'chat: first');
select lives_ok($$ insert into public.chat_messages (event_id, body) values ('e5e00000-0000-0000-0000-000000000001', 'Anyone want a lift from the services??') $$, 'chat: second');
select throws_ok($$ insert into public.chat_messages (event_id, body) values ('e5e00000-0000-0000-0000-000000000001', 'anyone want a lift from the services') $$, 'P0001',
  'You''ve already posted that. Spamming the same message isn''t allowed.', 'chat: the third is refused');

-- Private chats: the same text in one chat is fine; blasting it into 3 chats isn't.
select set_config('t.c1', public.start_direct('e5000000-0000-0000-0000-000000000002')::text, true);
select set_config('t.c2', public.start_direct('e5000000-0000-0000-0000-000000000003')::text, true);
select set_config('t.c3', public.start_direct('e5000000-0000-0000-0000-000000000004')::text, true);
select lives_ok(format($$ select public.send_message(%L, 'Cheap tyres at my mates garage, msg me') $$, current_setting('t.c1')), 'messages: once');
select lives_ok(format($$ select public.send_message(%L, 'Cheap tyres at my mates garage, msg me') $$, current_setting('t.c1')), 'messages: again in the same chat');
select lives_ok(format($$ select public.send_message(%L, 'Cheap tyres at my mates garage, msg me') $$, current_setting('t.c1')), 'messages: a third time in the same chat is fine');
select lives_ok(format($$ select public.send_message(%L, 'Cheap tyres at my mates garage, msg me') $$, current_setting('t.c2')), 'messages: a second chat');
select throws_ok(format($$ select public.send_message(%L, 'Cheap tyres at my mates garage, msg me!') $$, current_setting('t.c3')), 'P0001',
  'You''ve already posted that. Spamming the same message isn''t allowed.', 'messages: a third different chat is blasting');

-- ---------------------------------------------------------------------------
-- Repeat offenders: five refused duplicates in a day
-- ---------------------------------------------------------------------------
select is(public.record_blocked_duplicate('post', null, 'Something fresh nobody has seen before'), 'not_duplicate', 'record_blocked_duplicate: checked again on the server');
select is(public.record_blocked_duplicate('post', null, 'Follow my detailing page for deals in Leeds'), 'noted', 'record_blocked_duplicate: 1');
select is(public.record_blocked_duplicate('comment', null, 'Follow my detailing page for deals in Leeds'), 'noted', 'record_blocked_duplicate: 2');
select is(public.record_blocked_duplicate('chat', 'e5e00000-0000-0000-0000-000000000001', 'Anyone want a lift from the services?'), 'noted', 'record_blocked_duplicate: 3');
select is(public.record_blocked_duplicate('message', current_setting('t.c3')::uuid, 'Cheap tyres at my mates garage, msg me'), 'noted', 'record_blocked_duplicate: 4');
select is(public.record_blocked_duplicate('post', null, 'Follow my detailing page for deals in Leeds'), 'cooldown', 'record_blocked_duplicate: the fifth gives a cooldown');
select is((select scope from public.my_moderation_status()), 'community', 'cooldown: a 24-hour Community ban');
select throws_like($$ select public.create_post('Totally new words this time round') $$, 'You can''t post in Community until %', 'cooldown: no posting');
select lives_ok(format($$ select public.send_message(%L, 'Sorry mate, see you Sunday') $$, current_setting('t.c1')), 'cooldown: messages to connections still work');
select is((select count(*)::int from public.notices where user_id = auth.uid() and title = 'Posting paused for 24 hours'), 1, 'cooldown: a notice says so');

-- ---------------------------------------------------------------------------
-- Selling
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"e5000000-0000-0000-0000-000000000005","role":"authenticated"}', true);
select lives_ok($$ select public.create_post('Selling my old Recaros, £300 ono') $$, 'selling: one selling post outside the board is fine');
select is((select is_selling from public.posts where author_id = auth.uid()), true, 'selling: the post is flagged is_selling');
select lives_ok($$ select public.create_post('Front splitter for sale, fits a mk7 GTI') $$, 'selling: a second');
select lives_ok($$ select public.create_thread('cars', null, 'WTS: Mk4 Golf parts', 'Loads of bits, dm for price') $$, 'selling: a third (a thread)');
select throws_ok($$ select public.create_post('BBS RS 17s £900, collection only') $$, 'P0001',
  'You''ve posted a lot of selling lately. Put things for sale on the For sale & wanted board instead.', 'selling: more than 3 in 7 days outside the board is refused');
select lives_ok($$ select public.create_thread('for_sale', null, 'BBS RS 17s', '£900, collection only') $$, 'selling: For sale & wanted still takes it');
select lives_ok($$ select public.create_post('Spent £400 on coilovers and it rides like a dream') $$, 'selling: normal posts are fine');

-- More than 60% selling over 5+ posts in 30 days (older than a week).
reset role;
insert into public.posts (author_id, body, is_selling, created_at)
  select 'e5000000-0000-0000-0000-000000000006', 'Old post ' || g, g <= 4, now() - interval '10 days' from generate_series(1, 5) g;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"e5000000-0000-0000-0000-000000000006","role":"authenticated"}', true);
select throws_ok($$ select public.create_post('Turbo for sale, £350') $$, 'P0001',
  'You''ve posted a lot of selling lately. Put things for sale on the For sale & wanted board instead.', 'selling: mostly selling over 30 days is refused');
select lives_ok($$ select public.create_post('Great drive out to the coast today') $$, 'selling: the same person can still post normally');

-- For sale & wanted: 5 listings in 7 days, then a sell-only report.
reset role;
insert into public.forum_threads (board, author_id, title, body, is_selling, created_at)
  select 'for_sale', 'e5000000-0000-0000-0000-000000000007', 'Listing ' || g, 'Wheels', true, now() - interval '1 day' from generate_series(1, 5) g;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"e5000000-0000-0000-0000-000000000007","role":"authenticated"}', true);
select throws_ok($$ select public.create_thread('for_sale', null, 'Another listing', 'Seats') $$, 'P0001',
  'That''s 5 listings on For sale & wanted this week, the most for 7 days. Try again in a few days.', 'For sale & wanted: 5 listings a week');
select lives_ok($$ select public.create_post('Wheels still for sale, have a look on the board') $$, 'sell-only: one more selling post');

-- ---------------------------------------------------------------------------
-- Staff see it
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"e5000000-0000-0000-0000-000000000009","role":"authenticated"}', true);
select throws_ok($$ select * from public.member_history('e5000000-0000-0000-0000-000000000001') $$, 'P0001', 'Only staff can do that.', 'member_history: staff only');
select set_config('request.jwt.claims', '{"sub":"e5000000-0000-0000-0000-000000000008","role":"authenticated"}', true);
select is((select array_agg(reason::text order by reason::text) from public.reports where automatic and target_user in ('e5000000-0000-0000-0000-000000000001', 'e5000000-0000-0000-0000-000000000007')),
  array['sell_only', 'spam'], 'auto-reports: spam for P, sell-only for L');
select is((select count(*)::int from public.moderation_queue where automatic and target = 'profile' and target_user::text like 'e5000000-%'), 2, 'moderation_queue: staff see both, marked automatic');
select is((select count(*)::int from public.member_history('e5000000-0000-0000-0000-000000000001') where is_repeat), 2, 'member_history: the repeats are flagged (a post and a chat line)');

select * from finish();
rollback;

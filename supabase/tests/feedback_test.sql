-- Feedback: anyone sends, senders read their own (20261117230000), only staff change or delete; screenshots in
-- the private `feedback` bucket. Run with `npx supabase test db` (rolled back).
--
-- Users: U signed-in tester, V another tester, A staff.

begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(33);

insert into auth.users (id, email) values
  ('f0000000-0000-0000-0000-000000000001', 'u@example.test'),
  ('f0000000-0000-0000-0000-000000000002', 'v@example.test'),
  ('f0000000-0000-0000-0000-000000000003', 'a@example.test');

-- Staff are added with the service role (here: the table owner).
insert into public.staff (user_id, note) values ('f0000000-0000-0000-0000-000000000003', 'moderator');

-- ---------------------------------------------------------------------------
-- Signed out
-- ---------------------------------------------------------------------------

set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);

select lives_ok($$ insert into public.feedback (kind, message, screen, app_version, update_id, device)
                   values ('bug', 'Sign-in code never arrived', 'sign-in', '1.0.0', 'upd-1', 'iPhone 15') $$,
  'feedback: signed out can send');
select throws_ok($$ insert into public.feedback (kind, message, user_id)
                    values ('idea', 'Hello', 'f0000000-0000-0000-0000-000000000001') $$,
  '42501', null, 'feedback: signed out can''t send in someone''s name');
select throws_ok($$ insert into public.feedback (kind, message, photo_path)
                    values ('bug', 'Look', 'f0000000-0000-0000-0000-000000000001/a.jpg') $$,
  '42501', null, 'feedback: signed out can''t attach a screenshot');
select throws_ok($$ select * from public.feedback $$, '42501', null, 'feedback: signed out can''t read');
select throws_ok($$ update public.feedback set status = 'done' $$, '42501', null, 'feedback: signed out can''t change');
select throws_ok($$ delete from public.feedback $$, '42501', null, 'feedback: signed out can''t delete');
select throws_ok($$ insert into storage.objects (bucket_id, name) values ('feedback', 'anon/a.jpg') $$,
  '42501', null, 'feedback bucket: signed out can''t upload');
reset role;

-- ---------------------------------------------------------------------------
-- Signed in
-- ---------------------------------------------------------------------------

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"f0000000-0000-0000-0000-000000000001","role":"authenticated"}', true);

select lives_ok($$ insert into public.feedback (kind, message, screen) values ('looks_wrong', 'Map pin is off by a street', 'map') $$,
  'feedback: signed in can send');
select lives_ok($$ insert into public.feedback (kind, message, user_id) values ('idea', 'Dark map please', null) $$,
  'feedback: signed in can send without their name');
select lives_ok($$ insert into storage.objects (bucket_id, name) values ('feedback', 'f0000000-0000-0000-0000-000000000001/shot.jpg') $$,
  'feedback bucket: upload to your own folder');
select throws_ok($$ insert into storage.objects (bucket_id, name) values ('feedback', 'f0000000-0000-0000-0000-000000000002/shot.jpg') $$,
  '42501', null, 'feedback bucket: not into someone else''s folder');
select lives_ok($$ insert into public.feedback (kind, message, photo_path)
                   values ('bug', 'Button overlaps', 'f0000000-0000-0000-0000-000000000001/shot.jpg') $$,
  'feedback: attach your own screenshot');
select throws_ok($$ insert into public.feedback (kind, message, photo_path)
                    values ('bug', 'Button overlaps', 'f0000000-0000-0000-0000-000000000002/shot.jpg') $$,
  '42501', null, 'feedback: not someone else''s screenshot');
select throws_ok($$ insert into public.feedback (kind, message, user_id)
                    values ('bug', 'Fake', 'f0000000-0000-0000-0000-000000000002') $$,
  '42501', null, 'feedback: not in someone else''s name');
select throws_ok($$ insert into public.feedback (kind, message, status) values ('bug', 'Done already', 'done') $$,
  '42501', null, 'feedback: the sender can''t set the status');
select throws_ok($$ insert into public.feedback (kind, message) values ('rant', 'Hmm') $$,
  '23514', null, 'feedback: bug, idea or looks_wrong only');
select throws_ok($$ insert into public.feedback (kind, message) values ('bug', '   ') $$,
  '23514', null, 'feedback: a message is needed');
select throws_ok($$ insert into public.feedback (kind, message) values ('bug', repeat('x', 4001)) $$,
  '23514', null, 'feedback: at most 4000 characters');
select lives_ok($$ insert into public.feedback (kind, message) values ('bug', repeat('x', 4000)) $$,
  'feedback: 4000 characters is fine');
select is((select count(*) from public.feedback)::int, 3, 'feedback: testers read only their own (not unsigned ones they sent)');
select is((select count(*) from storage.objects where bucket_id = 'feedback')::int, 0,
  'feedback bucket: testers can''t read screenshots, even their own');
update public.feedback set status = 'done';
delete from public.feedback;
reset role;

-- Counts look only at this test's rows (made in this transaction, so created_at = now()): real feedback may be there too.
select is((select count(*) from public.feedback where status = 'new' and created_at = now())::int, 5,
  'feedback: a tester''s update and delete change nothing');
select is((select user_id from public.feedback where message = 'Map pin is off by a street'),
  'f0000000-0000-0000-0000-000000000001'::uuid, 'feedback: user_id defaults to the sender');
select is((select user_id from public.feedback where message = 'Sign-in code never arrived'), null::uuid,
  'feedback: signed out sends with no user');

-- Flood guard: 20 an hour per person.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"f0000000-0000-0000-0000-000000000002","role":"authenticated"}', true);
select lives_ok($$ do $d$ begin for i in 1..20 loop
                     insert into public.feedback (kind, message) values ('idea', 'Idea ' || i);
                   end loop; end $d$ $$, 'feedback: 20 in an hour is fine');
select throws_ok($$ insert into public.feedback (kind, message) values ('idea', 'One more') $$,
  'P0001', 'You''ve sent a lot of feedback in the last hour. Thanks! Try again later.', 'feedback: then the flood guard stops it');
reset role;

-- ---------------------------------------------------------------------------
-- Staff
-- ---------------------------------------------------------------------------

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"f0000000-0000-0000-0000-000000000003","role":"authenticated"}', true);

select is((select count(*) from public.feedback where created_at = now())::int, 25, 'feedback: staff read it all');
select lives_ok($$ update public.feedback set status = 'seen' where kind = 'bug' $$, 'feedback: staff set the status');
select throws_ok($$ update public.feedback set message = 'edited' $$, '42501', null, 'feedback: staff can''t rewrite a message');
select throws_ok($$ update public.feedback set status = 'whatever' $$, '23514', null, 'feedback: known statuses only');
select is((select count(*) from storage.objects where bucket_id = 'feedback')::int, 1, 'feedback bucket: staff read screenshots');
select lives_ok($$ delete from public.feedback where kind = 'idea' $$, 'feedback: staff delete');
select is((select count(*) from public.feedback where created_at = now())::int, 4, 'feedback: and it''s gone');
reset role;

select * from finish();
rollback;

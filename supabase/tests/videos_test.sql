-- Video (20261121110000_number_plate_reason.sql, 20261121110100_videos.sql): one clip with
-- its cover per post, thread, reply or message; the plate tick is required; paths are your
-- own; the `videos` bucket's size limit and read rules; three "Shows a number plate"
-- reports hide it.
--
-- A posts. B shares a group chat with A. C is outside it. B, C and D report.

begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(32);

insert into auth.users (id, email) values
  ('e9000000-0000-0000-0000-00000000000a', 'vid-a@example.test'),
  ('e9000000-0000-0000-0000-00000000000b', 'vid-b@example.test'),
  ('e9000000-0000-0000-0000-00000000000c', 'vid-c@example.test'),
  ('e9000000-0000-0000-0000-00000000000d', 'vid-d@example.test');
update public.profiles set handle = 'vid_' || right(id::text, 1), display_name = 'Person ' || right(id::text, 1), region = 'East', onboarded = true
  where id::text like 'e9000000-0000-0000-0000-0000000000%';
insert into public.conversations (id, kind, name, created_by) values
  ('e9c00000-0000-0000-0000-000000000001', 'group', 'Video test', 'e9000000-0000-0000-0000-00000000000a');
insert into public.conversation_members (conversation_id, user_id, role) values
  ('e9c00000-0000-0000-0000-000000000001', 'e9000000-0000-0000-0000-00000000000a', 'admin'),
  ('e9c00000-0000-0000-0000-000000000001', 'e9000000-0000-0000-0000-00000000000b', 'member');

-- ---------------------------------------------------------------------------
-- The bucket
-- ---------------------------------------------------------------------------
select is((select file_size_limit from storage.buckets where id = 'videos'), 26214400::bigint, 'videos bucket: 25 MiB a file');
select is((select public from storage.buckets where id = 'videos'), false, 'videos bucket: private (signed links only)');
select is((select allowed_mime_types from storage.buckets where id = 'videos'), array['video/mp4', 'video/quicktime', 'image/jpeg'],
  'videos bucket: MP4, MOV and the JPEG cover only');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"e9000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);

-- ---------------------------------------------------------------------------
-- Feed posts
-- ---------------------------------------------------------------------------
select set_config('t.post', public.create_post('', '{}', p_video_path => 'e9000000-0000-0000-0000-00000000000a/posts/v1.mp4',
  p_video_poster => 'e9000000-0000-0000-0000-00000000000a/posts/v1.jpg', p_video_no_plates => true)::text, true);
select is((select video_path from public.posts where id = current_setting('t.post')::uuid), 'e9000000-0000-0000-0000-00000000000a/posts/v1.mp4',
  'create_post: a video on its own, with the plate tick');
select throws_ok($$ select public.create_post('Untucked', '{}', p_video_path => 'e9000000-0000-0000-0000-00000000000a/posts/v2.mp4',
  p_video_poster => 'e9000000-0000-0000-0000-00000000000a/posts/v2.jpg') $$, 'P0001',
  'Check the video has no readable number plates, then tick the box.', 'create_post: no video without the plate tick');
select throws_ok($$ select public.create_post('No cover', '{}', p_video_path => 'e9000000-0000-0000-0000-00000000000a/posts/v2.mp4', p_video_no_plates => true) $$, 'P0001',
  'That video needs its cover picture.', 'create_post: a video needs its cover');
select throws_ok($$ select public.create_post('Theirs', '{}', p_video_path => 'e9000000-0000-0000-0000-00000000000b/posts/v2.mp4',
  p_video_poster => 'e9000000-0000-0000-0000-00000000000b/posts/v2.jpg', p_video_no_plates => true) $$, 'P0001',
  'That video isn''t one of yours.', 'create_post: a video in someone else''s folder is refused');
select throws_ok($$ select public.create_post('Wrong type', '{}', p_video_path => 'e9000000-0000-0000-0000-00000000000a/posts/v2.exe',
  p_video_poster => 'e9000000-0000-0000-0000-00000000000a/posts/v2.jpg', p_video_no_plates => true) $$, 'P0001',
  'That video isn''t one of yours.', 'create_post: only .mp4 or .mov');
select lives_ok($$ select public.create_post('Old app', array['e9000000-0000-0000-0000-00000000000a/posts/p.jpg']) $$, 'create_post: the old arguments still work');
select is((select video_poster from public.posts where id = current_setting('t.post')::uuid), 'e9000000-0000-0000-0000-00000000000a/posts/v1.jpg',
  'posts: the cover can be read directly');

-- ---------------------------------------------------------------------------
-- Forum
-- ---------------------------------------------------------------------------
select set_config('t.thread', public.create_thread('advice', null, 'Rattle at 3k rpm', 'Listen to this',
  p_video_path => 'e9000000-0000-0000-0000-00000000000a/forum/v1.mov', p_video_poster => 'e9000000-0000-0000-0000-00000000000a/forum/v1.jpg',
  p_video_no_plates => true)::text, true);
select is((select video_path from public.forum_threads where id = current_setting('t.thread')::uuid), 'e9000000-0000-0000-0000-00000000000a/forum/v1.mov',
  'create_thread: a video');
select throws_ok($$ select public.create_thread('advice', null, 'Untucked video', '', p_video_path => 'e9000000-0000-0000-0000-00000000000a/forum/v2.mp4',
  p_video_poster => 'e9000000-0000-0000-0000-00000000000a/forum/v2.jpg') $$, 'P0001',
  'Check the video has no readable number plates, then tick the box.', 'create_thread: no video without the plate tick');
select lives_ok(format($$ select public.reply_thread(%L, 'Same noise here', '{}', null, 'e9000000-0000-0000-0000-00000000000a/forum/r1.mp4',
  'e9000000-0000-0000-0000-00000000000a/forum/r1.jpg', true) $$, current_setting('t.thread')), 'reply_thread: a video');
select throws_ok(format($$ select public.reply_thread(%L, 'Posts folder', '{}', null, 'e9000000-0000-0000-0000-00000000000a/posts/r2.mp4',
  'e9000000-0000-0000-0000-00000000000a/posts/r2.jpg', true) $$, current_setting('t.thread')), 'P0001',
  'That video isn''t one of yours.', 'reply_thread: only the forum folder');
select lives_ok(format($$ select public.reply_thread(%L, 'Old app reply') $$, current_setting('t.thread')), 'reply_thread: the old arguments still work');

-- ---------------------------------------------------------------------------
-- Chat
-- ---------------------------------------------------------------------------
select lives_ok($$ select public.send_message('e9c00000-0000-0000-0000-000000000001', '', null, null,
  'e9000000-0000-0000-0000-00000000000a/e9c00000-0000-0000-0000-000000000001/m1.mp4',
  'e9000000-0000-0000-0000-00000000000a/e9c00000-0000-0000-0000-000000000001/m1.jpg', true) $$, 'send_message: a video on its own');
select throws_ok($$ select public.send_message('e9c00000-0000-0000-0000-000000000001', 'Untucked', null, null,
  'e9000000-0000-0000-0000-00000000000a/e9c00000-0000-0000-0000-000000000001/m2.mp4',
  'e9000000-0000-0000-0000-00000000000a/e9c00000-0000-0000-0000-000000000001/m2.jpg') $$, 'P0001',
  'Check the video has no readable number plates, then tick the box.', 'send_message: no video without the plate tick');
select throws_ok($$ select public.send_message('e9c00000-0000-0000-0000-000000000001', 'Other chat', null, null,
  'e9000000-0000-0000-0000-00000000000a/e9c00000-0000-0000-0000-000000000099/m2.mp4',
  'e9000000-0000-0000-0000-00000000000a/e9c00000-0000-0000-0000-000000000099/m2.jpg', true) $$, 'P0001',
  'That video isn''t one of yours.', 'send_message: only this chat''s folder');
select lives_ok($$ select public.send_message('e9c00000-0000-0000-0000-000000000001', 'Old app message') $$, 'send_message: the old arguments still work');

-- ---------------------------------------------------------------------------
-- Storage rules
-- ---------------------------------------------------------------------------
select lives_ok($$ insert into storage.objects (bucket_id, name) values ('videos', 'e9000000-0000-0000-0000-00000000000a/posts/v1.mp4') $$,
  'storage: upload a post video into your own folder');
select lives_ok($$ insert into storage.objects (bucket_id, name) values ('videos', 'e9000000-0000-0000-0000-00000000000a/e9c00000-0000-0000-0000-000000000001/m1.mp4') $$,
  'storage: upload a chat video into a chat you''re in');
select throws_ok($$ insert into storage.objects (bucket_id, name) values ('videos', 'e9000000-0000-0000-0000-00000000000b/posts/x.mp4') $$,
  '42501', null, 'storage: not into someone else''s folder');
select throws_ok($$ insert into storage.objects (bucket_id, name) values ('videos', 'e9000000-0000-0000-0000-00000000000a/e9c00000-0000-0000-0000-000000000099/x.mp4') $$,
  '42501', null, 'storage: not into a chat you''re not in');
select throws_ok($$ insert into storage.objects (bucket_id, name) values ('videos', 'e9000000-0000-0000-0000-00000000000a/other/x.mp4') $$,
  '42501', null, 'storage: only posts, forum or a chat');

select set_config('request.jwt.claims', '{"sub":"e9000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
select is((select count(*)::int from storage.objects where bucket_id = 'videos' and name like 'e9000000-0000-0000-0000-00000000000a/%'), 2,
  'storage: a chat member reads the post video and the chat video');
select set_config('request.jwt.claims', '{"sub":"e9000000-0000-0000-0000-00000000000c","role":"authenticated"}', true);
select is((select count(*)::int from storage.objects where bucket_id = 'videos' and name like 'e9000000-0000-0000-0000-00000000000a/%'), 1,
  'storage: anyone else reads the post video but not the chat video');

-- ---------------------------------------------------------------------------
-- "Shows a number plate": three people hide it
-- ---------------------------------------------------------------------------
select lives_ok(format($$ select public.report_content('post', %L, 'number_plate') $$, current_setting('t.post')), 'report: C reports a number plate');
select set_config('request.jwt.claims', '{"sub":"e9000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
select lives_ok(format($$ select public.report_content('post', %L, 'number_plate') $$, current_setting('t.post')), 'report: B too');
reset role;
select is((select hidden_at from public.posts where id = current_setting('t.post')::uuid), null, 'report: two reports don''t hide it');
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"e9000000-0000-0000-0000-00000000000d","role":"authenticated"}', true);
select lives_ok(format($$ select public.report_content('post', %L, 'number_plate') $$, current_setting('t.post')), 'report: D makes three');
reset role;
select isnt((select hidden_at from public.posts where id = current_setting('t.post')::uuid), null, 'report: three hide it until staff look');

-- The table keeps a video and its cover together.
select throws_ok(format($$ update public.posts set video_poster = null where id = %L $$, current_setting('t.post')),
  '23514', null, 'posts: a video always has its cover');

select * from finish();
rollback;

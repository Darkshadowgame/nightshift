-- More photos (20261121100000_more_photos.sql): 10 photos on posts, threads and replies,
-- up to 4 on a post comment, and every path must be in your own folder.
--
-- A posts and comments; B is someone else whose folder A tries to use.

begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(26);

insert into auth.users (id, email) values
  ('e8000000-0000-0000-0000-00000000000a', 'mp-a@example.test'),
  ('e8000000-0000-0000-0000-00000000000b', 'mp-b@example.test');
update public.profiles set handle = 'mp_' || right(id::text, 1), display_name = 'Person ' || right(id::text, 1), region = 'East', onboarded = true
  where id::text like 'e8000000-0000-0000-0000-0000000000%';

-- Arrays of n photo paths in a folder.
create function pg_temp.paths(p_uid text, p_folder text, n int) returns text[] language sql as $$
  select array_agg(p_uid || '/' || p_folder || '/p' || g || '.jpg' order by g) from generate_series(1, n) g
$$;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"e8000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);

-- ---------------------------------------------------------------------------
-- Feed posts: 10
-- ---------------------------------------------------------------------------
select set_config('t.post', public.create_post('Ten from the meet', pg_temp.paths('e8000000-0000-0000-0000-00000000000a', 'posts', 10))::text, true);
select is((select cardinality(photos) from public.posts where id = current_setting('t.post')::uuid), 10, 'create_post: 10 photos');
select throws_ok($$ select public.create_post('Eleven', pg_temp.paths('e8000000-0000-0000-0000-00000000000a', 'posts', 11)) $$, 'P0001',
  'Up to 10 photos a post.', 'create_post: not 11');
select throws_ok($$ select public.create_post('Theirs', array['e8000000-0000-0000-0000-00000000000b/posts/x.jpg']) $$, 'P0001',
  'That photo isn''t one of yours.', 'create_post: a path in someone else''s folder is refused');
select throws_ok($$ select public.create_post('Null', array[null::text]) $$, 'P0001',
  'That photo isn''t one of yours.', 'create_post: a null path is refused');

-- ---------------------------------------------------------------------------
-- Forum threads and replies: 10
-- ---------------------------------------------------------------------------
select set_config('t.thread', public.create_thread('advice', null, 'Clutch slipping help', 'Pictures attached',
  pg_temp.paths('e8000000-0000-0000-0000-00000000000a', 'forum', 10))::text, true);
select is((select cardinality(photos) from public.forum_threads where id = current_setting('t.thread')::uuid), 10, 'create_thread: 10 photos');
select throws_ok($$ select public.create_thread('advice', null, 'Too many pics', '', pg_temp.paths('e8000000-0000-0000-0000-00000000000a', 'forum', 11)) $$, 'P0001',
  'Up to 10 photos a post.', 'create_thread: not 11');
select throws_ok($$ select public.create_thread('advice', null, 'Their photo', '', array['e8000000-0000-0000-0000-00000000000b/forum/x.jpg']) $$, 'P0001',
  'That photo isn''t one of yours.', 'create_thread: a path in someone else''s folder is refused');
select lives_ok(format($$ select public.reply_thread(%L, 'Here are two more', %L) $$, current_setting('t.thread'),
  pg_temp.paths('e8000000-0000-0000-0000-00000000000a', 'forum', 2)), 'reply_thread: 2 photos');
select lives_ok(format($$ select public.reply_thread(%L, 'And ten', %L) $$, current_setting('t.thread'),
  pg_temp.paths('e8000000-0000-0000-0000-00000000000a', 'forum', 10)), 'reply_thread: 10 photos');
select throws_ok(format($$ select public.reply_thread(%L, 'Eleven', %L) $$, current_setting('t.thread'),
  pg_temp.paths('e8000000-0000-0000-0000-00000000000a', 'forum', 11)), 'P0001', 'Up to 10 photos a post.', 'reply_thread: not 11');
select throws_ok(format($$ select public.reply_thread(%L, 'Theirs', %L) $$, current_setting('t.thread'),
  array['e8000000-0000-0000-0000-00000000000b/forum/x.jpg']), 'P0001', 'That photo isn''t one of yours.', 'reply_thread: a path in someone else''s folder is refused');
select throws_ok(format($$ select public.reply_thread(%L, 'Null', %L) $$, current_setting('t.thread'), array[null::text]),
  'P0001', 'That photo isn''t one of yours.', 'reply_thread: a null path is refused');

-- ---------------------------------------------------------------------------
-- Post comments: up to 4, in {uid}/comments/
-- ---------------------------------------------------------------------------
select set_config('t.c1', public.comment_post(current_setting('t.post')::uuid, 'Look at this',
  pg_temp.paths('e8000000-0000-0000-0000-00000000000a', 'comments', 4))::text, true);
select is((select photos from public.post_comments where id = current_setting('t.c1')::uuid),
  pg_temp.paths('e8000000-0000-0000-0000-00000000000a', 'comments', 4), 'comment_post: 4 photos kept in order');
select set_config('t.c2', public.comment_post(current_setting('t.post')::uuid, '', array['e8000000-0000-0000-0000-00000000000a/comments/only.jpg'])::text, true);
select is((select body from public.post_comments where id = current_setting('t.c2')::uuid), '', 'comment_post: a comment can be just a photo');
select lives_ok(format($$ select public.comment_post(%L, 'Words only') $$, current_setting('t.post')), 'comment_post: two arguments still work (old app)');
select throws_ok(format($$ select public.comment_post(%L, 'Five', %L) $$, current_setting('t.post'),
  pg_temp.paths('e8000000-0000-0000-0000-00000000000a', 'comments', 5)), 'P0001', 'Up to 4 photos a comment.', 'comment_post: not 5');
select throws_ok(format($$ select public.comment_post(%L, 'Theirs', %L) $$, current_setting('t.post'),
  array['e8000000-0000-0000-0000-00000000000b/comments/x.jpg']), 'P0001', 'That photo isn''t one of yours.', 'comment_post: a path in someone else''s folder is refused');
select throws_ok(format($$ select public.comment_post(%L, 'Wrong folder', %L) $$, current_setting('t.post'),
  array['e8000000-0000-0000-0000-00000000000a/posts/p1.jpg']), 'P0001', 'That photo isn''t one of yours.', 'comment_post: only the comments folder');
select throws_ok(format($$ select public.comment_post(%L, 'Climb', %L) $$, current_setting('t.post'),
  array['e8000000-0000-0000-0000-00000000000a/comments/../../b/x.jpg']), 'P0001', 'That photo isn''t one of yours.', 'comment_post: no path tricks');
select throws_ok(format($$ select public.comment_post(%L, 'Null', %L) $$, current_setting('t.post'), array[null::text]),
  'P0001', 'That photo isn''t one of yours.', 'comment_post: a null path is refused');
select throws_ok(format($$ select public.comment_post(%L, '  ', '{}') $$, current_setting('t.post')), 'P0001',
  'Write a comment first.', 'comment_post: no words and no photos is refused');
select throws_ok(format($$ insert into public.post_comments (post_id, author_id, body, photos) values (%L, 'e8000000-0000-0000-0000-00000000000a', 'x', '{a}') $$,
  current_setting('t.post')), '42501', null, 'post_comments: no direct insert');

-- B reads A's comment photos (the post is public).
select set_config('request.jwt.claims', '{"sub":"e8000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
select is((select cardinality(photos) from public.post_comments where id = current_setting('t.c1')::uuid), 4, 'post_comments: others read the photos');
reset role;

-- ---------------------------------------------------------------------------
-- The table limits themselves
-- ---------------------------------------------------------------------------
select throws_ok(format($$ update public.posts set photos = %L where id = %L $$, pg_temp.paths('x', 'posts', 11), current_setting('t.post')),
  '23514', null, 'posts: the table stops 11');
select throws_ok(format($$ update public.forum_threads set photos = %L where id = %L $$, pg_temp.paths('x', 'forum', 11), current_setting('t.thread')),
  '23514', null, 'forum_threads: the table stops 11');
select throws_ok(format($$ update public.post_comments set photos = %L where id = %L $$, pg_temp.paths('x', 'comments', 5), current_setting('t.c1')),
  '23514', null, 'post_comments: the table stops 5');

select * from finish();
rollback;

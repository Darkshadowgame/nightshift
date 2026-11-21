-- Profile picture (20261121150000): profiles.avatar_ref is readable by everyone, set or cleared only
-- through set_avatar() for your own row, and only to a photo that is yours (your avatar folder, or a
-- photo on one of your own vehicles). Older calls (save_profile) are untouched. Everything rolls back.
-- Users (made up): A and B are set up; C hasn't finished setting up.

begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(19);

insert into auth.users (id, email) values
  ('ea000000-0000-0000-0000-00000000000a', 'av-a@example.test'),
  ('ea000000-0000-0000-0000-00000000000b', 'av-b@example.test'),
  ('ea000000-0000-0000-0000-00000000000c', 'av-c@example.test');
update public.profiles set handle = 'av_' || right(id::text, 1), display_name = 'Person ' || right(id::text, 1), region = 'East', onboarded = true
  where id::text in ('ea000000-0000-0000-0000-00000000000a', 'ea000000-0000-0000-0000-00000000000b');

insert into public.builds (id, owner_id, kind, make, model, stock_bhp, weight_kg) values
  ('ea100000-0000-0000-0000-00000000000a', 'ea000000-0000-0000-0000-00000000000a', 'car', 'Mazda', 'MX-5', 158, 1000),
  ('ea100000-0000-0000-0000-00000000000b', 'ea000000-0000-0000-0000-00000000000b', 'car', 'Honda', 'Civic', 180, 1200);
insert into public.build_photos (build_id, owner_id, storage_path) values
  ('ea100000-0000-0000-0000-00000000000a', 'ea000000-0000-0000-0000-00000000000a', 'ea000000-0000-0000-0000-00000000000a/builds/ea100000-0000-0000-0000-00000000000a/one.jpg'),
  ('ea100000-0000-0000-0000-00000000000b', 'ea000000-0000-0000-0000-00000000000b', 'ea000000-0000-0000-0000-00000000000b/builds/ea100000-0000-0000-0000-00000000000b/one.jpg');

-- Table.
select has_column('public', 'profiles', 'avatar_ref', 'table: profiles has avatar_ref');
select is((select avatar_ref from public.profiles where id = 'ea000000-0000-0000-0000-00000000000a'), null, 'table: no picture by default');
select throws_ok($$ update public.profiles set avatar_ref = 'not-a-path' where id = 'ea000000-0000-0000-0000-00000000000a' $$,
  '23514', null, 'table: a ref has to be a path in your own folder');

select is(has_function_privilege('anon', 'public.set_avatar(text)', 'execute'), false, 'privileges: signed-out people can''t call set_avatar');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"ea000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);

-- Your own library photo.
select lives_ok($$ select public.set_avatar('ea000000-0000-0000-0000-00000000000a/avatar/pic1.jpg') $$, 'set_avatar: a photo in your avatar folder');
select is((select avatar_ref from public.profiles where id = 'ea000000-0000-0000-0000-00000000000a'), 'ea000000-0000-0000-0000-00000000000a/avatar/pic1.jpg', 'set_avatar: it is saved');

-- One of your own vehicle photos.
select lives_ok($$ select public.set_avatar('ea000000-0000-0000-0000-00000000000a/builds/ea100000-0000-0000-0000-00000000000a/one.jpg') $$, 'set_avatar: a photo on your own vehicle');

-- Not yours.
select throws_ok($$ select public.set_avatar('ea000000-0000-0000-0000-00000000000b/avatar/pic1.jpg') $$,
  null, 'That photo isn''t one of yours.', 'set_avatar: not a file in someone else''s folder');
select throws_ok($$ select public.set_avatar('ea000000-0000-0000-0000-00000000000b/builds/ea100000-0000-0000-0000-00000000000b/one.jpg') $$,
  null, 'That photo isn''t one of yours.', 'set_avatar: not someone else''s vehicle photo');
select throws_ok($$ select public.set_avatar('ea000000-0000-0000-0000-00000000000a/builds/ea100000-0000-0000-0000-00000000000a/other.jpg') $$,
  null, 'That photo isn''t one of yours.', 'set_avatar: a vehicle photo has to be on one of your vehicles');
select throws_ok($$ select public.set_avatar('ea000000-0000-0000-0000-00000000000a/posts/pic1.jpg') $$,
  null, 'That photo isn''t one of yours.', 'set_avatar: not from your posts folder');
select throws_ok($$ select public.set_avatar('ea000000-0000-0000-0000-00000000000a/avatar/../../x.jpg') $$,
  null, 'That photo isn''t one of yours.', 'set_avatar: no odd paths');

-- Everyone can read it; nobody can write the column directly.
select set_config('request.jwt.claims', '{"sub":"ea000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
select is((select avatar_ref from public.profiles where id = 'ea000000-0000-0000-0000-00000000000a'), 'ea000000-0000-0000-0000-00000000000a/builds/ea100000-0000-0000-0000-00000000000a/one.jpg', 'read: other people see it');
select throws_ok($$ update public.profiles set avatar_ref = 'ea000000-0000-0000-0000-00000000000b/avatar/x.jpg' where id = 'ea000000-0000-0000-0000-00000000000b' $$,
  '42501', null, 'write: no direct update of the column');

-- B setting theirs leaves A's alone.
select lives_ok($$ select public.set_avatar('ea000000-0000-0000-0000-00000000000b/avatar/mine.jpg') $$, 'set_avatar: B sets their own');
select is((select avatar_ref from public.profiles where id = 'ea000000-0000-0000-0000-00000000000a'), 'ea000000-0000-0000-0000-00000000000a/builds/ea100000-0000-0000-0000-00000000000a/one.jpg', 'set_avatar: only touches your own row');

-- Clearing, the old profile save, and not-set-up people.
select set_config('request.jwt.claims', '{"sub":"ea000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select public.save_profile('av_a', 'Person A', 'East', 52.0, -1.0);
select is((select avatar_ref from public.profiles where id = 'ea000000-0000-0000-0000-00000000000a') is not null, true, 'save_profile: the older call leaves the picture alone');
select public.set_avatar(null);
select is((select avatar_ref from public.profiles where id = 'ea000000-0000-0000-0000-00000000000a'), null, 'set_avatar: null goes back to the default');

select set_config('request.jwt.claims', '{"sub":"ea000000-0000-0000-0000-00000000000c","role":"authenticated"}', true);
select throws_ok($$ select public.set_avatar('ea000000-0000-0000-0000-00000000000c/avatar/pic1.jpg') $$,
  null, 'Set up your profile first.', 'set_avatar: finish setting up first');

select * from finish();
rollback;

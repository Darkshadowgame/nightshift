-- More photos (owner request, 18 Nov 2026: "it would be helpful when asking for help if you can send images").
--
-- * Feed posts, forum threads and forum replies: up to 10 photos (was 4).
-- * Post comments get photos: up to 4, in the commenter's own `photos` folder
--   ({uid}/comments/{file}), checked like forum photos. A comment can be just photos.
-- * Chat needs nothing here: several photos are sent as one message each
--   (send_message() is unchanged) and the app groups them into one bubble.
--
-- Every photo is still plate-blurred on the phone before upload (docs/SPEC.md).
-- The `photos` bucket's policies already limit uploads to {uid}/..., and account
-- deletion already empties the whole {uid}/ folder, so comment photos are covered.

alter table public.posts drop constraint posts_photos_check;
alter table public.posts add constraint posts_photos_check check (cardinality(photos) <= 10);
alter table public.forum_threads drop constraint forum_threads_photos_check;
alter table public.forum_threads add constraint forum_threads_photos_check check (cardinality(photos) <= 10);
alter table public.forum_replies drop constraint forum_replies_photos_check;
alter table public.forum_replies add constraint forum_replies_photos_check check (cardinality(photos) <= 10);

-- Threads and replies (create_thread(), reply_thread() call this).
create or replace function private.check_forum_photos(p_uid uuid, p_photos text[])
returns void
language plpgsql immutable
set search_path = ''
as $$
declare
  v text;
begin
  if cardinality(coalesce(p_photos, '{}')) > 10 then raise exception 'Up to 10 photos a post.'; end if;
  if array_position(coalesce(p_photos, '{}'), null) is not null then raise exception 'That photo isn''t one of yours.'; end if;
  foreach v in array coalesce(p_photos, '{}') loop
    if v !~ ('^' || p_uid::text || '/forum/[A-Za-z0-9._-]+$') then raise exception 'That photo isn''t one of yours.'; end if;
  end loop;
end;
$$;

-- Comment photos: your own, in your comments folder, up to 4.
create function private.check_comment_photos(p_uid uuid, p_photos text[])
returns void
language plpgsql immutable
set search_path = ''
as $$
declare
  v text;
begin
  if cardinality(coalesce(p_photos, '{}')) > 4 then raise exception 'Up to 4 photos a comment.'; end if;
  if array_position(coalesce(p_photos, '{}'), null) is not null then raise exception 'That photo isn''t one of yours.'; end if;
  foreach v in array coalesce(p_photos, '{}') loop
    if v !~ ('^' || p_uid::text || '/comments/[A-Za-z0-9._-]+$') then raise exception 'That photo isn''t one of yours.'; end if;
  end loop;
end;
$$;
revoke execute on function private.check_comment_photos(uuid, text[]) from public, anon;
grant execute on function private.check_comment_photos(uuid, text[]) to authenticated, service_role;

alter table public.post_comments add column photos text[] not null default '{}';
alter table public.post_comments add constraint post_comments_photos_check check (cardinality(photos) <= 4);
-- A comment can be just photos now.
alter table public.post_comments drop constraint post_comments_body_check;
alter table public.post_comments add constraint post_comments_body_check
  check (char_length(btrim(body)) <= 1000 and (btrim(body) <> '' or cardinality(photos) > 0));

-- comment_post() takes photos. The old two-argument form goes, so a call with
-- (p_post_id, p_body) still finds this one through the default.
drop function public.comment_post(uuid, text);
create function public.comment_post(p_post_id uuid, p_body text, p_photos text[] default '{}')
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
  v_body text := btrim(coalesce(p_body, ''));
  v_photos text[] := coalesce(p_photos, '{}');
  v_repeat boolean;
  v_id uuid;
begin
  if not private.can_see_post(p_post_id, v_uid) then raise exception 'That post isn''t there any more.'; end if;
  if v_body = '' and cardinality(v_photos) = 0 then raise exception 'Write a comment first.'; end if;
  if char_length(v_body) > 1000 then raise exception 'Keep it to 1,000 characters or fewer.'; end if;
  perform private.check_public_text(v_body);
  perform private.check_comment_photos(v_uid, v_photos);
  if private.rate_count(v_uid, 'comment', interval '1 minute') >= 5 then
    raise exception 'You''re posting a lot. Try again in a few minutes.';
  end if;
  if private.rate_count(v_uid, 'comment', interval '1 day') >= 200 then
    raise exception 'That''s the most comments for one day.';
  end if;
  perform private.rate_hit(v_uid, 'comment');
  v_repeat := private.spam_gate(v_uid, false, p_post_id, v_body);
  insert into public.post_comments (post_id, author_id, body, photos, is_repeat)
    values (p_post_id, v_uid, v_body, v_photos, v_repeat) returning id into v_id;
  return v_id;
end;
$$;
revoke all on function public.comment_post(uuid, text, text[]) from public, anon;
grant execute on function public.comment_post(uuid, text, text[]) to authenticated, service_role;

-- create_post(): the live definition (20261120100000_post_meet_point_privacy.sql) with 10 photos.
create or replace function public.create_post(
  p_body text,
  p_photos text[] default '{}',
  p_lat double precision default null,
  p_lng double precision default null,
  p_place_name text default null,
  p_visibility public.post_visibility default 'public',
  p_build_id uuid default null
)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
  v_body text := btrim(coalesce(p_body, ''));
  v_at extensions.geography;
  v text;
  v_selling boolean;
  v_repeat boolean;
  v_id uuid;
begin
  if not exists (select 1 from public.profiles p where p.id = v_uid and p.onboarded) then
    raise exception 'Set up your profile first.';
  end if;
  if v_body = '' and cardinality(coalesce(p_photos, '{}')) = 0 then raise exception 'Write something or add a photo.'; end if;
  if char_length(v_body) > 2000 then raise exception 'Keep it to 2,000 characters or fewer.'; end if;
  perform private.check_public_text(v_body || E'\n' || coalesce(p_place_name, ''));
  if cardinality(coalesce(p_photos, '{}')) > 10 then raise exception 'Up to 10 photos a post.'; end if;
  if array_position(coalesce(p_photos, '{}'), null) is not null then raise exception 'That photo isn''t one of yours.'; end if;
  foreach v in array coalesce(p_photos, '{}') loop
    if v !~ ('^' || v_uid::text || '/posts/[A-Za-z0-9._-]+$') then raise exception 'That photo isn''t one of yours.'; end if;
  end loop;
  perform private.check_own_build(v_uid, p_build_id);
  if (p_lat is null) <> (p_lng is null) then raise exception 'Pick the place on the map.'; end if;
  if p_lat is not null then
    if p_lat not between 49.8 and 60.9 or p_lng not between -8.7 and 1.9 then raise exception 'Places are for the UK only.'; end if;
    v_at := private.pt(round(p_lat::numeric, 4)::double precision, round(p_lng::numeric, 4)::double precision);
    if exists (select 1 from public.profile_homes h where h.user_id = v_uid and extensions.st_dwithin(h.home, v_at, 1000)) then
      raise exception 'That''s within about 1 km of your home area, so it can''t be shared. Pick a spot further away.';
    end if;
  end if;
  perform private.check_not_suspended(v_uid);
  v_selling := private.is_selling(v_body);
  if v_selling then perform private.check_selling_allowed(v_uid); end if;
  if private.rate_count(v_uid, 'post', interval '1 hour') >= 10 then
    raise exception 'You''re posting a lot. Try again in a little while.';
  end if;
  if private.rate_count(v_uid, 'post', interval '1 day') >= 30 then
    raise exception 'That''s the most posts for one day.';
  end if;
  perform private.rate_hit(v_uid, 'post');
  v_repeat := private.spam_gate(v_uid, false, null, v_body);
  insert into public.posts (author_id, body, photos, location, place_name, visibility, build_id, is_selling, is_repeat, event_id)
    values (v_uid, v_body, coalesce(p_photos, '{}'), v_at, case when v_at is null then null else nullif(btrim(coalesce(p_place_name, '')), '') end,
            coalesce(p_visibility, 'public'), p_build_id, v_selling, v_repeat, private.meet_at_for(v_at, v_uid))
    returning id into v_id;
  perform private.check_sell_only(v_uid);
  return v_id;
end;
$$;

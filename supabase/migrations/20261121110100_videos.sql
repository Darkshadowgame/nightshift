-- Video (owner request, 18 Nov 2026), for build 16 and later: one short clip per feed
-- post, forum thread, forum reply or chat message, with a cover picture (poster frame).
--
-- * The phone picks up to 30 s, exports 720p and refuses anything over 25 MB; the
--   `videos` bucket refuses anything over 25 MiB too, and only takes MP4/MOV and the
--   JPEG cover.
-- * Number plates can't be blurred in a video, so the RPCs refuse one unless the
--   poster ticked "No readable number plates in this video (I've checked)"
--   (p_video_no_plates). Anyone can report it as "Shows a number plate"
--   (20261121110000_number_plate_reason.sql); three people hide it until staff look,
--   like every report. Confirmed by the owner, 18 Nov 2026 (docs/SPEC.md).
-- * Paths: videos/{uid}/posts/…, videos/{uid}/forum/… (any signed-in user can read,
--   like `photos`), videos/{uid}/{conversation}/… (only that chat's members read).
-- * The RPCs keep every old argument in place and add three with defaults, so the
--   app before build 16 calls them as it always has.

-- ---------------------------------------------------------------------------
-- Storage
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('videos', 'videos', false, 26214400, array['video/mp4', 'video/quicktime', 'image/jpeg'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "videos: upload to own folder" on storage.objects for insert to authenticated
with check (
  bucket_id = 'videos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and (
    (storage.foldername(name))[2] in ('posts', 'forum')
    or private.is_member(private.try_uuid((storage.foldername(name))[2]), (select auth.uid()))
  )
);
create policy "videos: read" on storage.objects for select to authenticated
using (
  bucket_id = 'videos'
  and (
    (storage.foldername(name))[2] in ('posts', 'forum')
    or (storage.foldername(name))[1] = (select auth.uid())::text
    or private.is_member(private.try_uuid((storage.foldername(name))[2]), (select auth.uid()))
  )
);
create policy "videos: delete own" on storage.objects for delete to authenticated
using (bucket_id = 'videos' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- ---------------------------------------------------------------------------
-- Columns
-- ---------------------------------------------------------------------------

alter table public.posts add column video_path text, add column video_poster text,
  add constraint posts_video_pair check ((video_path is null) = (video_poster is null));
alter table public.forum_threads add column video_path text, add column video_poster text,
  add constraint forum_threads_video_pair check ((video_path is null) = (video_poster is null));
alter table public.forum_replies add column video_path text, add column video_poster text,
  add constraint forum_replies_video_pair check ((video_path is null) = (video_poster is null));
alter table public.messages add column video_path text, add column video_poster text,
  add constraint messages_video_pair check ((video_path is null) = (video_poster is null));

alter table public.posts drop constraint posts_not_empty;
alter table public.posts add constraint posts_not_empty check (btrim(body) <> '' or cardinality(photos) > 0 or video_path is not null);
alter table public.messages drop constraint messages_not_empty;
alter table public.messages add constraint messages_not_empty check (body <> '' or photo_path is not null or share is not null or video_path is not null);

-- posts is read column by column (20261120100000_post_meet_point_privacy.sql).
grant select (video_path, video_poster) on public.posts to authenticated;

-- A video is your own, in the right folder, with its cover, and you ticked the plate check.
create function private.check_video(p_uid uuid, p_folder text, p_video text, p_poster text, p_no_plates boolean)
returns void
language plpgsql immutable
set search_path = ''
as $$
begin
  if p_video is null and p_poster is null then return; end if;
  if p_video is null or p_poster is null then raise exception 'That video needs its cover picture.'; end if;
  if not coalesce(p_no_plates, false) then
    raise exception 'Check the video has no readable number plates, then tick the box.';
  end if;
  if p_video !~ ('^' || p_uid::text || '/' || p_folder || '/[A-Za-z0-9_-]+\.(mp4|mov)$')
     or p_poster !~ ('^' || p_uid::text || '/' || p_folder || '/[A-Za-z0-9_-]+\.jpg$') then
    raise exception 'That video isn''t one of yours.';
  end if;
end;
$$;
revoke execute on function private.check_video(uuid, text, text, text, boolean) from public, anon;
grant execute on function private.check_video(uuid, text, text, text, boolean) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- create_post(): 20261121100000_more_photos.sql plus a video
-- ---------------------------------------------------------------------------

drop function public.create_post(text, text[], double precision, double precision, text, public.post_visibility, uuid);
create function public.create_post(
  p_body text,
  p_photos text[] default '{}',
  p_lat double precision default null,
  p_lng double precision default null,
  p_place_name text default null,
  p_visibility public.post_visibility default 'public',
  p_build_id uuid default null,
  p_video_path text default null,
  p_video_poster text default null,
  p_video_no_plates boolean default false
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
  if v_body = '' and cardinality(coalesce(p_photos, '{}')) = 0 and p_video_path is null then raise exception 'Write something or add a photo.'; end if;
  if char_length(v_body) > 2000 then raise exception 'Keep it to 2,000 characters or fewer.'; end if;
  perform private.check_public_text(v_body || E'\n' || coalesce(p_place_name, ''));
  if cardinality(coalesce(p_photos, '{}')) > 10 then raise exception 'Up to 10 photos a post.'; end if;
  if array_position(coalesce(p_photos, '{}'), null) is not null then raise exception 'That photo isn''t one of yours.'; end if;
  foreach v in array coalesce(p_photos, '{}') loop
    if v !~ ('^' || v_uid::text || '/posts/[A-Za-z0-9._-]+$') then raise exception 'That photo isn''t one of yours.'; end if;
  end loop;
  perform private.check_video(v_uid, 'posts', p_video_path, p_video_poster, p_video_no_plates);
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
  insert into public.posts (author_id, body, photos, location, place_name, visibility, build_id, is_selling, is_repeat, event_id, video_path, video_poster)
    values (v_uid, v_body, coalesce(p_photos, '{}'), v_at, case when v_at is null then null else nullif(btrim(coalesce(p_place_name, '')), '') end,
            coalesce(p_visibility, 'public'), p_build_id, v_selling, v_repeat, private.meet_at_for(v_at, v_uid), p_video_path, p_video_poster)
    returning id into v_id;
  perform private.check_sell_only(v_uid);
  return v_id;
end;
$$;
revoke all on function public.create_post(text, text[], double precision, double precision, text, public.post_visibility, uuid, text, text, boolean) from public, anon;
grant execute on function public.create_post(text, text[], double precision, double precision, text, public.post_visibility, uuid, text, text, boolean) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- create_thread(): 20261118230000_forum_listings.sql plus a video
-- ---------------------------------------------------------------------------

drop function public.create_thread(public.forum_board, text, text, text, text[], uuid, text, integer, boolean, text, text);
create function public.create_thread(
  p_board public.forum_board,
  p_region text,
  p_title text,
  p_body text,
  p_photos text[] default '{}',
  p_build_id uuid default null,
  p_listing_kind text default null,
  p_price_pence integer default null,
  p_ono boolean default false,
  p_condition text default null,
  p_handover text default null,
  p_video_path text default null,
  p_video_poster text default null,
  p_video_no_plates boolean default false
)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
  v_title text := btrim(coalesce(p_title, ''));
  v_body text := btrim(coalesce(p_body, ''));
  v_listing boolean := p_board = 'for_sale';
  v_kind text := case when p_board = 'for_sale' then coalesce(p_listing_kind, 'sale') end;
  v_selling boolean;
  v_repeat boolean;
  v_id uuid;
begin
  if not exists (select 1 from public.profiles p where p.id = v_uid and p.onboarded) then
    raise exception 'Set up your profile first.';
  end if;
  if char_length(v_title) < 4 then raise exception 'Give it a title of at least 4 characters.'; end if;
  if char_length(v_title) > 120 then raise exception 'Keep the title to 120 characters or fewer.'; end if;
  if char_length(v_body) > 5000 then raise exception 'Keep it to 5,000 characters or fewer.'; end if;
  if p_board = 'local' and p_region is null then raise exception 'Pick a region for the Local board.'; end if;
  if v_listing then
    if v_kind not in ('sale', 'wanted') then raise exception 'Say whether it''s for sale or wanted.'; end if;
    if p_price_pence is not null and (p_price_pence < 0 or p_price_pence > 100000000) then
      raise exception 'Give a price between £0 and £1,000,000.';
    end if;
    if coalesce(p_ono, false) and p_price_pence is null then raise exception 'Add a price to say "or nearest offer".'; end if;
    if p_condition is not null and p_condition not in ('new', 'like_new', 'good', 'fair', 'parts') then
      raise exception 'Pick a condition from the list.';
    end if;
    if p_handover is not null and p_handover not in ('collection', 'postage', 'either') then
      raise exception 'Pick collection, postage or either.';
    end if;
  end if;
  perform private.check_public_text(v_title || E'\n' || v_body);
  perform private.check_forum_photos(v_uid, p_photos);
  perform private.check_video(v_uid, 'forum', p_video_path, p_video_poster, p_video_no_plates);
  perform private.check_own_build(v_uid, p_build_id);
  perform private.check_not_suspended(v_uid);
  v_selling := private.is_selling(v_title || E'\n' || v_body);
  if p_board = 'for_sale' then
    if (select count(*) from public.forum_threads t where t.author_id = v_uid and t.board = 'for_sale' and t.created_at > now() - interval '7 days') >= 5 then
      raise exception 'That''s 5 listings on For sale & wanted this week, the most for 7 days. Try again in a few days.';
    end if;
  elsif v_selling then
    perform private.check_selling_allowed(v_uid);
  end if;
  perform private.forum_rate(v_uid, 'thread');
  v_repeat := private.spam_gate(v_uid, false, null, v_title || ' ' || v_body);
  insert into public.forum_threads (board, region, author_id, title, body, photos, build_id, is_selling, is_repeat,
                                    listing_kind, price_pence, ono, condition, handover, video_path, video_poster)
    values (p_board, case when p_board = 'local' then p_region end, v_uid, v_title, v_body, coalesce(p_photos, '{}'), p_build_id, v_selling, v_repeat,
            v_kind,
            case when v_listing then p_price_pence end,
            case when v_listing then coalesce(p_ono, false) else false end,
            case when v_listing and v_kind = 'sale' then p_condition end,
            case when v_listing then p_handover end,
            p_video_path, p_video_poster)
    returning id into v_id;
  perform private.check_sell_only(v_uid);
  return v_id;
end;
$$;
revoke all on function public.create_thread(public.forum_board, text, text, text, text[], uuid, text, integer, boolean, text, text, text, text, boolean) from public, anon;
grant execute on function public.create_thread(public.forum_board, text, text, text, text[], uuid, text, integer, boolean, text, text, text, text, boolean) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- reply_thread() plus a video
-- ---------------------------------------------------------------------------

drop function public.reply_thread(uuid, text, text[], uuid);
create function public.reply_thread(
  p_thread_id uuid,
  p_body text,
  p_photos text[] default '{}',
  p_build_id uuid default null,
  p_video_path text default null,
  p_video_poster text default null,
  p_video_no_plates boolean default false
)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
  v_body text := btrim(coalesce(p_body, ''));
  t public.forum_threads;
  v_repeat boolean;
  v_id uuid;
begin
  select * into t from public.forum_threads where id = p_thread_id;
  if not found or (t.hidden_at is not null and t.author_id <> v_uid) or private.i_blocked(v_uid, t.author_id) then
    raise exception 'That thread isn''t there any more.';
  end if;
  if private.i_blocked(t.author_id, v_uid) then raise exception 'You can''t reply to this thread.'; end if;
  if not exists (select 1 from public.profiles p where p.id = v_uid and p.onboarded) then
    raise exception 'Set up your profile first.';
  end if;
  if v_body = '' then raise exception 'Write a reply first.'; end if;
  if char_length(v_body) > 5000 then raise exception 'Keep it to 5,000 characters or fewer.'; end if;
  perform private.check_public_text(v_body);
  perform private.check_forum_photos(v_uid, p_photos);
  perform private.check_video(v_uid, 'forum', p_video_path, p_video_poster, p_video_no_plates);
  perform private.check_own_build(v_uid, p_build_id);
  perform private.forum_rate(v_uid, 'reply');
  v_repeat := private.spam_gate(v_uid, false, p_thread_id, v_body);
  insert into public.forum_replies (thread_id, author_id, body, photos, build_id, is_repeat, video_path, video_poster)
    values (p_thread_id, v_uid, v_body, coalesce(p_photos, '{}'), p_build_id, v_repeat, p_video_path, p_video_poster)
    returning id into v_id;
  return v_id;
end;
$$;
revoke all on function public.reply_thread(uuid, text, text[], uuid, text, text, boolean) from public, anon;
grant execute on function public.reply_thread(uuid, text, text[], uuid, text, text, boolean) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- send_message() plus a video (in videos/{uid}/{conversation}/…)
-- ---------------------------------------------------------------------------

drop function public.send_message(uuid, text, text, jsonb);
create function public.send_message(
  p_conversation_id uuid,
  p_body text,
  p_photo_path text default null,
  p_share jsonb default null,
  p_video_path text default null,
  p_video_poster text default null,
  p_video_no_plates boolean default false
)
returns table (id uuid, created_at timestamptz)
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
  v_body text := btrim(coalesce(p_body, ''));
  v_share jsonb;
  v_other uuid;
  m public.messages;
begin
  if not private.can_post(p_conversation_id, v_uid) then
    raise exception 'You can only message people you''re connected with.';
  end if;
  if char_length(v_body) > 2000 then raise exception 'Keep it to 2,000 characters or fewer.'; end if;
  if p_photo_path is not null and p_photo_path !~ ('^' || v_uid::text || '/' || p_conversation_id::text || '/[A-Za-z0-9._-]+$') then
    raise exception 'That photo isn''t one of yours.';
  end if;
  perform private.check_video(v_uid, p_conversation_id::text, p_video_path, p_video_poster, p_video_no_plates);
  if p_share is not null then
    if jsonb_typeof(p_share) <> 'object' or coalesce(p_share->>'kind', '') not in ('event', 'place', 'build')
       or char_length(coalesce(p_share->>'id', '')) not between 1 and 100
       or char_length(coalesce(p_share->>'title', '')) not between 1 and 120
       or char_length(coalesce(p_share->>'subtitle', '')) > 160 then
      raise exception 'That can''t be shared.';
    end if;
    v_share := jsonb_build_object('kind', p_share->>'kind', 'id', p_share->>'id', 'title', p_share->>'title', 'subtitle', coalesce(p_share->>'subtitle', ''));
  end if;
  if v_body = '' and p_photo_path is null and v_share is null and p_video_path is null then raise exception 'Write a message first.'; end if;
  if private.rate_count(v_uid, 'message', interval '1 minute') >= 20 then
    raise exception 'Slow down a little: that''s a lot of messages in a minute.';
  end if;
  if private.rate_count(v_uid, 'message', interval '1 day') >= 1000 then
    raise exception 'That''s the most messages for one day.';
  end if;
  perform private.rate_hit(v_uid, 'message');
  perform private.spam_gate(v_uid, true, p_conversation_id, v_body);
  v_other := private.direct_other(p_conversation_id, v_uid);
  if v_other is not null then
    insert into public.conversation_members (conversation_id, user_id, role, last_read_at)
      values (p_conversation_id, v_other, 'member', now() - interval '1 second') on conflict do nothing;
  end if;
  insert into public.messages (conversation_id, sender_id, body, photo_path, share, video_path, video_poster)
    values (p_conversation_id, v_uid, v_body, p_photo_path, v_share, p_video_path, p_video_poster) returning * into m;
  update public.conversations c set last_message_at = m.created_at where c.id = p_conversation_id;
  update public.conversation_members cm set last_read_at = m.created_at
    where cm.conversation_id = p_conversation_id and cm.user_id = v_uid;
  return query select m.id, m.created_at;
end;
$$;
revoke all on function public.send_message(uuid, text, text, jsonb, text, text, boolean) from public, anon;
grant execute on function public.send_message(uuid, text, text, jsonb, text, text, boolean) to authenticated, service_role;

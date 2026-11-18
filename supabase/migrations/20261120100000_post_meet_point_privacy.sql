-- A post must never give away a meet point before it shows (Redesign 2, 4.11; REVIEW-11 #16).
--
-- The app (src/lib/postPrivacy.ts, fc04b98) drops the place name from a post made at a
-- meet point and words its place line for the viewer, but the server still stored the
-- post's exact place and returned it to everyone who could read the post: the
-- `location` and `place_name` columns of `posts` (direct select, and filters on them),
-- feed_posts() and posts_in_box(). Anyone not yet allowed to see the meet point could
-- read it from a post.
--
-- From here on:
--
-- * posts.event_id: the meet a post was made at. create_post() sets it when the place
--   is within 0.25 mi (MEET_POINT_MILES) of a meet point of a meet whose place is
--   hidden (not a show or track day) that the author can see. Existing posts are linked
--   the same way below. Only points the author can see, so a post can't be used to
--   find out whether a spot is a meet point.
-- * private.post_hidden_event(post, viewer): the meet whose meet point this post would
--   give away to this viewer, or null. A post gives away meet point S when it is within
--   0.25 mi of S and either it's linked to S's meet or its author can see S now. The
--   viewer may see it when private.can_see_stop(S, viewer) (the canSeeStop() rule: hosts,
--   the reveal time, going/invites, a rolling meet's CURRENT meet point for late
--   joiners). A linked post whose meet has no meet point there any more follows the
--   meet's current meet point. The author and staff always see their own exact data.
-- * feed_posts(): for a hidden post, lat/lng is the meet's rough area centre
--   (events.area, already fuzzed and public), place_name is null, and the new last
--   column event_id says which meet, so the app says "Around {Area}". The Local scope
--   compares that shown place, never the exact one, with your home area.
-- * posts_in_box(): hidden posts are left out of the map's Posts layer.
-- * Direct reads: `location` and `place_name` can't be selected (or filtered on) by
--   signed-in users any more; every other column can. The place comes only through
--   the two RPCs. No view, Realtime publication or other RPC returns a post's place
--   (report_content() and member_history() copy only the text).

-- ===========================================================================
-- 1. The link and the rule
-- ===========================================================================

alter table public.posts add column event_id uuid references public.events (id) on delete set null;
create index posts_event_idx on public.posts (event_id) where event_id is not null;

-- The meet (place hidden until it shows) whose meet point this place is at and that
-- p_user can see; the nearest, preferring meets that haven't ended. Null when none.
create function private.meet_at_for(p_at extensions.geography, p_user uuid)
returns uuid
language sql stable security definer
set search_path = ''
as $$
  select s.event_id
  from public.event_stops s
  join public.events e on e.id = s.event_id
  where p_at is not null
    and not private.is_public_type(e.type)
    and extensions.st_dwithin(s.location, p_at, private.mi(0.25))
    and private.can_see_stop(s.id, p_user)
  order by (now() < private.event_end(e.starts_at, e.ends_at)) desc, extensions.st_distance(s.location, p_at)
  limit 1
$$;

-- The meet whose meet point this post would give away to p_user, or null (show it as it is).
create function private.post_hidden_event(p_post uuid, p_user uuid)
returns uuid
language plpgsql stable security definer
set search_path = ''
as $$
declare
  p public.posts;
  v uuid;
begin
  select * into p from public.posts where id = p_post;
  if not found or (p.location is null and p.event_id is null) then return null; end if;
  if p_user is not null and (p.author_id = p_user or private.is_admin(p_user)) then return null; end if;
  if p.location is not null then
    select s.event_id into v
    from public.event_stops s
    join public.events e on e.id = s.event_id
    where not private.is_public_type(e.type)
      and extensions.st_dwithin(s.location, p.location, private.mi(0.25))
      and (s.event_id = p.event_id or private.can_see_stop(s.id, p.author_id))
      and not private.can_see_stop(s.id, p_user)
    order by (s.event_id = p.event_id) desc nulls last, extensions.st_distance(s.location, p.location)
    limit 1;
    if v is not null then return v; end if;
  end if;
  -- Linked, but none of its meet points is there any more: the meet's current one decides.
  if p.event_id is not null and not exists (
    select 1 from public.event_stops s
    where s.event_id = p.event_id and p.location is not null
      and extensions.st_dwithin(s.location, p.location, private.mi(0.25))
  ) then
    select e.id into v
    from public.events e
    where e.id = p.event_id
      and not private.is_public_type(e.type)
      and not private.can_see_stop(
        (select s.id from public.event_stops s where s.event_id = e.id and s.position = e.current_stop), p_user);
  end if;
  return v;
end;
$$;

-- Existing posts: link them as create_post() now does.
update public.posts p set event_id = private.meet_at_for(p.location, p.author_id)
where p.location is not null and p.event_id is null and private.meet_at_for(p.location, p.author_id) is not null;

-- ===========================================================================
-- 2. create_post() links the meet (body otherwise as 20261118180000)
-- ===========================================================================

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
  if cardinality(coalesce(p_photos, '{}')) > 4 then raise exception 'Up to 4 photos a post.'; end if;
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

-- ===========================================================================
-- 3. feed_posts(): the shown place, and the meet (adds the event_id column)
-- ===========================================================================

drop function public.feed_posts(text, timestamptz, uuid);
create function public.feed_posts(p_scope text default 'local', p_before timestamptz default null, p_author uuid default null)
returns table (
  id uuid, author_id uuid, body text, photos text[], lat double precision, lng double precision, place_name text,
  visibility public.post_visibility, build_id uuid, created_at timestamptz, like_count int, comment_count int,
  liked_by_me boolean, hidden boolean, event_id uuid
)
language plpgsql stable security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
  v_home extensions.geography;
  v_miles int;
begin
  if p_scope not in ('local', 'connections', 'author') then raise exception 'Pick Local or Connections.'; end if;
  select h.home into v_home from public.profile_homes h where h.user_id = v_uid;
  v_miles := coalesce((select s.travel_miles from public.profile_settings s where s.user_id = v_uid), 25);
  return query
    select p.id, p.author_id, p.body, p.photos,
           extensions.st_y(x.shown::extensions.geometry), extensions.st_x(x.shown::extensions.geometry),
           case when x.ev is null then p.place_name end,
           p.visibility, p.build_id, p.created_at, p.like_count, p.comment_count,
           exists (select 1 from public.post_likes l where l.post_id = p.id and l.user_id = v_uid),
           p.hidden_at is not null,
           coalesce(x.ev, p.event_id)
    from public.posts p
    cross join lateral (select private.post_hidden_event(p.id, v_uid) as ev) h
    cross join lateral (
      select h.ev as ev,
             case when h.ev is null then p.location else (select e.area from public.events e where e.id = h.ev) end as shown
    ) x
    where private.can_see_post(p.id, v_uid)
      and (p_before is null or p.created_at < p_before)
      and case p_scope
        when 'author' then p.author_id = p_author
        when 'connections' then p.author_id = v_uid or private.are_connected(v_uid, p.author_id)
        else p.visibility = 'public' and v_home is not null and (
          (x.shown is not null and extensions.st_dwithin(x.shown, v_home, private.mi(v_miles)))
          or exists (select 1 from public.profile_homes ah where ah.user_id = p.author_id
                     and extensions.st_dwithin(ah.home, v_home, private.mi(v_miles))))
      end
    order by p.created_at desc
    limit 50;
end;
$$;

-- ===========================================================================
-- 4. posts_in_box(): the map's Posts layer leaves hidden ones out
-- ===========================================================================

create or replace function public.posts_in_box(p_south double precision, p_west double precision, p_north double precision, p_east double precision)
returns table (id uuid, author_id uuid, lat double precision, lng double precision, photo text, place_name text, created_at timestamptz)
language sql stable security definer
set search_path = ''
as $$
  select p.id, p.author_id, extensions.st_y(p.location::extensions.geometry), extensions.st_x(p.location::extensions.geometry),
         p.photos[1], p.place_name, p.created_at
  from public.posts p
  where auth.uid() is not null
    and p.location is not null
    and p.created_at > now() - interval '30 days'
    and extensions.st_intersects(p.location, extensions.st_makeenvelope(p_west, p_south, p_east, p_north, 4326)::extensions.geography)
    and private.can_see_post(p.id, auth.uid())
    and private.post_hidden_event(p.id, auth.uid()) is null
  order by p.created_at desc
  limit 200
$$;

-- ===========================================================================
-- 5. Direct reads: no place columns
-- ===========================================================================

revoke select on public.posts from authenticated;
grant select (id, author_id, body, photos, visibility, build_id, created_at, like_count, comment_count, hidden_at,
              is_selling, is_repeat, event_id)
  on public.posts to authenticated;

revoke execute on function private.meet_at_for(extensions.geography, uuid), private.post_hidden_event(uuid, uuid) from public, anon;
grant execute on function private.meet_at_for(extensions.geography, uuid), private.post_hidden_event(uuid, uuid) to authenticated, service_role;
revoke execute on function public.feed_posts(text, timestamptz, uuid) from public, anon;
grant execute on function public.feed_posts(text, timestamptz, uuid) to authenticated, service_role;

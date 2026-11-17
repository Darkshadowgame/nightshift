-- Nightshift backend, part 14: Community (owner request, 17 Nov 2026).
--
--  * Cars near you: people within your travel distance, with a rough distance
--    worked out here from coarsened home areas (never a home, never exact).
--    "Show me in Cars near you" (on by default) hides you when turned off.
--  * Connections (owner decision, 17 Nov 2026): a request the other person
--    accepts or declines. Private messages, 1-to-1 and groups, are only
--    possible between connected people; everyone else talks on the forum.
--    A decline can't be re-sent for 30 days; the person who asked is never
--    told it was declined (it stays "Requested" for them).
--  * Blocks: hide the person's posts, replies and messages from you, end any
--    connection, and stop messages both ways.
--  * Forum: boards, threads, replies, "Helpful", one reply marked Solved
--    (small rep, capped so it can't be farmed). Public text passes a word
--    filter and the app's legal rules (no police spotting, no racing on
--    public roads); mirrored in src/lib/moderation.ts.
--  * Messages: 1-to-1 and group conversations (up to 50 people), text,
--    photos (private `messages` bucket), shared event/place/build cards,
--    "Seen" from last_read_at. Realtime on messages and members.
--  * Feed posts: text and photos, an optional place (never near your home
--    area), Public or Connections only, likes and comments; the map's Posts layer.
--  * Rate builds: like or pass; the likes count is shown on the build.
--  * Reports on every post, reply, message, profile and build, for staff;
--    three different people reporting a post hides it until staff look.
--  * Rate limits in every write RPC (private.rate_hits).
--
-- Mirrors src/lib/connections.ts, forum.ts, messages.ts, carsNear.ts and
-- moderation.ts. Every write goes through an RPC; RLS decides every read.

-- ===========================================================================
-- Rate limits (shared by the RPCs below)
-- ===========================================================================

create table private.rate_hits (
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null,
  at timestamptz not null default now()
);
create index rate_hits_idx on private.rate_hits (user_id, kind, at);

-- How many times this person did this within the window.
create function private.rate_count(p_user uuid, p_kind text, p_window interval)
returns int
language sql stable security definer
set search_path = ''
as $$
  select count(*)::int from private.rate_hits h
  where h.user_id = p_user and h.kind = p_kind and h.at > now() - p_window
$$;

-- Record one, and forget this person's ones older than a day.
create function private.rate_hit(p_user uuid, p_kind text)
returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  delete from private.rate_hits h where h.user_id = p_user and h.kind = p_kind and h.at < now() - interval '1 day';
  insert into private.rate_hits (user_id, kind) values (p_user, p_kind);
end;
$$;

-- A uuid from text, or null (storage paths are text).
create function private.try_uuid(p text)
returns uuid
language plpgsql immutable
set search_path = ''
as $$
begin
  return p::uuid;
exception when others then
  return null;
end;
$$;

-- ===========================================================================
-- Words and the legal rules for public text (mirror src/lib/moderation.ts)
-- ===========================================================================

-- Staff can add or remove words with SQL: insert into private.banned_terms (term) values ('...');
create table private.banned_terms (term text primary key check (term ~ '^[a-z ]+$'));
insert into private.banned_terms (term) values
  ('nigger'), ('niggers'), ('nigga'), ('niggas'), ('paki'), ('pakis'), ('chink'), ('chinks'),
  ('gook'), ('gooks'), ('spic'), ('spics'), ('kike'), ('kikes'), ('wog'), ('wogs'), ('coon'), ('coons'),
  ('raghead'), ('ragheads'), ('towelhead'), ('towelheads'), ('gypo'), ('gyppo'), ('pikey'), ('pikeys'),
  ('faggot'), ('faggots'), ('dyke'), ('dykes'),
  ('cunt'), ('cunts'), ('fuck'), ('fucks'), ('fucking'), ('fucked'), ('fucker'), ('fuckers'),
  ('motherfucker'), ('motherfuckers'), ('whore'), ('whores'), ('slut'), ('sluts');

-- Lower case, the usual swaps for letters (0 -> o, 1 -> i, 3 -> e, 4 -> a, 5 -> s,
-- 7 -> t, 9 -> g, @ -> a, $ -> s, ! -> i), and dots, dashes, stars and underscores
-- between letters dropped ("f.u.c.k"). Same as normaliseForWords() in moderation.ts.
create function private.normalise_words(p text)
returns text
language sql immutable parallel safe
set search_path = ''
as $$
  select regexp_replace(translate(lower(coalesce(p, '')), '0134579@$!', 'oieastgasi'), '([a-z])[.*_-]+(?=[a-z])', '\1', 'g')
$$;

-- The sentence the app shows, or null when the text is fine. Same as textProblem() in moderation.ts.
create function private.text_problem(p text)
returns text
language plpgsql stable security definer
set search_path = ''
as $$
declare
  v_words text := private.normalise_words(p);
  v_plain text := lower(coalesce(p, ''));
  v_cops text := '(police|cops|feds|old bill|plod|unmarked|speed traps?|speed checks?|speed guns?|camera vans?|laser guns?|traffic cops|rozzers)';
begin
  if exists (select 1 from private.banned_terms t where v_words ~ ('\y' || t.term || '\y')) then
    return 'Keep it friendly: that has a word Nightshift doesn''t allow.';
  end if;
  if v_plain ~ ('\y' || v_cops || '\s+(spotted|sat|parked|waiting|hiding|out|about|everywhere|lurking)\y')
     or v_plain ~ ('\y(spotted|watch out for|beware of|beware|heads up)\s+(the\s+|a\s+|an\s+)?' || v_cops || '\y')
     or v_plain ~ ('\y' || v_cops || '\s+(at|on|near)\s+(the\s+)?(a|b|m)[0-9]+\y') then
    return 'Posts about where police or speed checks are aren''t allowed on Nightshift.';
  end if;
  if v_plain ~ '\y(street|road|illegal)\s+rac(e|es|ing)\y'
     or v_plain ~ '\y(race|racing|timed run|time trial)\s+(on|down|along|up)\s+(the\s+)?(a|b|m)[0-9]+\y'
     or v_plain ~ '\y(drag|top speed|roll)\s+(race|races|racing|run|runs)\s+(on|down|along)\s+(the\s+)?(road|roads|street|streets|motorway|dual carriageway|bypass|a[0-9]+|b[0-9]+|m[0-9]+)\y' then
    return 'Nightshift doesn''t allow organising or timing racing on public roads. Track days are fine.';
  end if;
  return null;
end;
$$;

create function private.check_public_text(p text)
returns void
language plpgsql stable security definer
set search_path = ''
as $$
declare
  v text := private.text_problem(p);
begin
  if v is not null then raise exception '%', v; end if;
end;
$$;

-- ===========================================================================
-- Settings: "Show me in Cars near you"
-- ===========================================================================

alter table public.profile_settings add column show_in_nearby boolean not null default true;

create function public.save_community_prefs(p_show_in_nearby boolean)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
begin
  insert into public.profile_settings (user_id, show_in_nearby) values (v_uid, coalesce(p_show_in_nearby, true))
  on conflict (user_id) do update set show_in_nearby = excluded.show_in_nearby;
end;
$$;

-- ===========================================================================
-- Blocks
-- ===========================================================================

create table public.blocks (
  blocker_id uuid not null references auth.users (id) on delete cascade,
  blocked_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint blocks_not_self check (blocker_id <> blocked_id)
);
create index blocks_blocked_idx on public.blocks (blocked_id);

-- Either of the two has blocked the other.
create function private.blocked_between(a uuid, b uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.blocks k
    where (k.blocker_id = a and k.blocked_id = b) or (k.blocker_id = b and k.blocked_id = a)
  )
$$;

-- You blocked them (their content is hidden from you).
create function private.i_blocked(p_me uuid, p_other uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (select 1 from public.blocks k where k.blocker_id = p_me and k.blocked_id = p_other)
$$;

-- ===========================================================================
-- Connections
-- ===========================================================================

create type public.connection_status as enum ('pending', 'accepted', 'declined');

create table public.connections (
  requester_id uuid not null references auth.users (id) on delete cascade,
  addressee_id uuid not null references auth.users (id) on delete cascade,
  status public.connection_status not null default 'pending',
  created_at timestamptz not null default now(),
  answered_at timestamptz,
  primary key (requester_id, addressee_id),
  constraint connections_not_self check (requester_id <> addressee_id)
);
-- One row per pair, whichever way round.
create unique index connections_pair_idx on public.connections (least(requester_id, addressee_id), greatest(requester_id, addressee_id));
create index connections_addressee_idx on public.connections (addressee_id, status);

create function private.are_connected(a uuid, b uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select a is not null and b is not null and exists (
    select 1 from public.connections c
    where c.status = 'accepted'
      and ((c.requester_id = a and c.addressee_id = b) or (c.requester_id = b and c.addressee_id = a))
  )
$$;

-- Ask to connect. Returns 'requested' or 'connected' (their request to you is accepted).
create function public.request_connection(p_user uuid)
returns text
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
  c public.connections;
begin
  if p_user is null or p_user = v_uid then raise exception 'You can''t connect with yourself.'; end if;
  if not exists (select 1 from public.profiles p where p.id = p_user and p.onboarded) then
    raise exception 'That person isn''t on Nightshift any more.';
  end if;
  if private.blocked_between(v_uid, p_user) then raise exception 'You can''t connect with this person.'; end if;

  select * into c from public.connections x
    where (x.requester_id = v_uid and x.addressee_id = p_user) or (x.requester_id = p_user and x.addressee_id = v_uid);
  if found then
    if c.status = 'accepted' then return 'connected'; end if;
    if c.status = 'pending' and c.requester_id = v_uid then return 'requested'; end if;
    if c.status = 'pending' then
      -- They asked you already: asking back accepts it.
      update public.connections set status = 'accepted', answered_at = now()
        where requester_id = p_user and addressee_id = v_uid;
      return 'connected';
    end if;
    -- Declined. You asked and were turned down: it stays "Requested" for 30 days.
    if c.requester_id = v_uid and c.answered_at > now() - interval '30 days' then return 'requested'; end if;
  end if;

  if private.rate_count(v_uid, 'connect', interval '1 day') >= 20 then
    raise exception 'That''s the most connection requests for one day. Try again tomorrow.';
  end if;
  perform private.rate_hit(v_uid, 'connect');
  delete from public.connections x
    where (x.requester_id = v_uid and x.addressee_id = p_user) or (x.requester_id = p_user and x.addressee_id = v_uid);
  insert into public.connections (requester_id, addressee_id) values (v_uid, p_user);
  return 'requested';
end;
$$;

-- Accept or decline a request someone sent you.
create function public.answer_connection(p_user uuid, p_accept boolean)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
begin
  update public.connections
    set status = case when p_accept then 'accepted'::public.connection_status else 'declined'::public.connection_status end,
        answered_at = now()
    where requester_id = p_user and addressee_id = v_uid and status = 'pending';
  if not found then raise exception 'That request isn''t there any more.'; end if;
end;
$$;

-- Remove a connection, or take back a request you sent (a declined one keeps its 30 days).
create function public.remove_connection(p_user uuid)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
begin
  delete from public.connections x
    where ((x.requester_id = v_uid and x.addressee_id = p_user) or (x.requester_id = p_user and x.addressee_id = v_uid))
      and (x.status = 'accepted' or (x.status = 'pending' and x.requester_id = v_uid));
end;
$$;

-- Everyone you're connected with or have a request with. A request you sent
-- that was declined shows as 'outgoing' for 30 days; one you declined isn't listed.
create function public.my_connections()
returns table (user_id uuid, state text, since timestamptz)
language sql stable security definer
set search_path = ''
as $$
  select case when c.requester_id = auth.uid() then c.addressee_id else c.requester_id end,
         case
           when c.status = 'accepted' then 'connected'
           when c.requester_id = auth.uid() then 'outgoing'
           else 'incoming'
         end,
         coalesce(c.answered_at, c.created_at)
  from public.connections c
  where auth.uid() in (c.requester_id, c.addressee_id)
    and (c.status <> 'declined' or (c.requester_id = auth.uid() and c.answered_at > now() - interval '30 days'))
$$;

-- Block: hides their content from you, ends any connection, stops messages both ways.
create function public.block_user(p_user uuid)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
begin
  if p_user is null or p_user = v_uid then raise exception 'You can''t block yourself.'; end if;
  if not exists (select 1 from auth.users u where u.id = p_user) then raise exception 'That person isn''t on Nightshift any more.'; end if;
  insert into public.blocks (blocker_id, blocked_id) values (v_uid, p_user) on conflict do nothing;
  delete from public.connections x
    where (x.requester_id = v_uid and x.addressee_id = p_user) or (x.requester_id = p_user and x.addressee_id = v_uid);
end;
$$;

create function public.unblock_user(p_user uuid)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
begin
  delete from public.blocks where blocker_id = v_uid and blocked_id = p_user;
end;
$$;

-- ===========================================================================
-- Cars near you (mirrors roughMiles() in src/lib/carsNear.ts)
-- ===========================================================================

-- Homes are already snapped to ~1 km. For distances between people they're
-- snapped again to 0.05 degrees (about 5 km north-south), and the answer is
-- rounded, so moving your own home around can't pin anyone down.
create function private.coarse(p extensions.geography)
returns extensions.geography
language sql immutable parallel safe
set search_path = ''
as $$
  select private.pt(
    (round((extensions.st_y(p::extensions.geometry) / 0.05)::numeric) * 0.05)::double precision,
    (round((extensions.st_x(p::extensions.geometry) / 0.05)::numeric) * 0.05)::double precision
  )
$$;

-- Under 5 mi is 5 ("under 5 mi"); then to the nearest 2 up to 20, 5 up to 50, 10 beyond.
create function private.rough_miles(m double precision)
returns int
language sql immutable parallel safe
set search_path = ''
as $$
  select case
    when m < 5 then 5
    when m < 20 then greatest(6, (round((m / 2)::numeric) * 2)::int)
    when m < 50 then (round((m / 5)::numeric) * 5)::int
    else (round((m / 10)::numeric) * 10)::int
  end
$$;

-- People within p_max_miles (default: your travel distance) of your home area,
-- nearest first: user id and rough miles only. Not you, not people who hid
-- themselves, not anyone blocked either way, onboarded people only.
create function public.people_near(p_max_miles int default null)
returns table (user_id uuid, miles int)
language plpgsql stable security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
  v_home extensions.geography;
  v_max int;
begin
  select private.coarse(h.home) into v_home from public.profile_homes h where h.user_id = v_uid;
  if v_home is null then return; end if;
  v_max := coalesce(p_max_miles, (select s.travel_miles from public.profile_settings s where s.user_id = v_uid), 25);
  if v_max < 1 or v_max > 300 then raise exception 'Pick a distance from 1 to 300 miles.'; end if;
  return query
    select x.id, x.m from (
      select p.id, private.rough_miles(extensions.st_distance(private.coarse(h.home), v_home) / 1609.344) as m
      from public.profiles p
      join public.profile_homes h on h.user_id = p.id
      left join public.profile_settings s on s.user_id = p.id
      where p.onboarded and p.id <> v_uid
        and coalesce(s.show_in_nearby, true)
        and not private.blocked_between(v_uid, p.id)
        and extensions.st_dwithin(h.home, v_home, private.mi(v_max + 10))
    ) x
    where x.m <= v_max
    order by x.m, x.id
    limit 300;
end;
$$;

-- ===========================================================================
-- Rate builds (like / pass)
-- ===========================================================================

create table public.build_ratings (
  build_id uuid not null references public.builds (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  liked boolean not null,
  created_at timestamptz not null default now(),
  primary key (build_id, user_id)
);
create index build_ratings_user_idx on public.build_ratings (user_id);

create function public.rate_build(p_build_id uuid, p_like boolean)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
  v_owner uuid;
begin
  select b.owner_id into v_owner from public.builds b where b.id = p_build_id;
  if v_owner is null then raise exception 'That build isn''t there any more.'; end if;
  if v_owner = v_uid then raise exception 'You can''t rate your own build.'; end if;
  if private.rate_count(v_uid, 'rate_build', interval '1 day') >= 500 then
    raise exception 'That''s plenty of rating for one day. Come back tomorrow.';
  end if;
  perform private.rate_hit(v_uid, 'rate_build');
  insert into public.build_ratings (build_id, user_id, liked) values (p_build_id, v_uid, coalesce(p_like, false))
  on conflict (build_id, user_id) do update set liked = excluded.liked, created_at = now();
end;
$$;

-- Likes per build (counts only, never who).
create function public.build_likes(p_build_ids uuid[])
returns table (build_id uuid, likes int)
language sql stable security definer
set search_path = ''
as $$
  select b.id, (select count(*) from public.build_ratings r where r.build_id = b.id and r.liked)::int
  from unnest(p_build_ids) as b (id)
  where auth.uid() is not null
$$;

-- ===========================================================================
-- Forum
-- ===========================================================================

create type public.forum_board as enum ('advice', 'builds', 'cars', 'bikes', 'detailing', 'meets', 'for_sale', 'local');

create table public.forum_threads (
  id uuid primary key default gen_random_uuid(),
  board public.forum_board not null,
  -- Local board only: one of the profile regions.
  region text check (region in (
    'Midlands', 'North West', 'North East', 'Yorkshire', 'East', 'London',
    'South East', 'South West', 'Wales', 'Scotland', 'Northern Ireland'
  )),
  author_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 4 and 120),
  body text not null default '' check (char_length(body) <= 5000),
  -- Storage paths in `photos` ({author}/forum/...), plate-blurred on the phone.
  photos text[] not null default '{}' check (cardinality(photos) <= 4),
  build_id uuid references public.builds (id) on delete set null,
  created_at timestamptz not null default now(),
  last_activity_at timestamptz not null default now(),
  reply_count int not null default 0 check (reply_count >= 0),
  solved_reply_id uuid,
  -- Set by three reports or by staff: hidden from everyone but the author until staff look.
  hidden_at timestamptz,
  constraint forum_local_region check ((board = 'local') = (region is not null))
);
create index forum_threads_active_idx on public.forum_threads (board, last_activity_at desc);
create index forum_threads_new_idx on public.forum_threads (board, created_at desc);
create index forum_threads_author_idx on public.forum_threads (author_id, created_at);

create table public.forum_replies (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.forum_threads (id) on delete cascade,
  author_id uuid not null references auth.users (id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 5000),
  photos text[] not null default '{}' check (cardinality(photos) <= 4),
  build_id uuid references public.builds (id) on delete set null,
  created_at timestamptz not null default now(),
  helpful_count int not null default 0 check (helpful_count >= 0),
  hidden_at timestamptz
);
create index forum_replies_thread_idx on public.forum_replies (thread_id, created_at);
create index forum_replies_author_idx on public.forum_replies (author_id, created_at);

alter table public.forum_threads
  add constraint forum_threads_solved_fk foreign key (solved_reply_id) references public.forum_replies (id) on delete set null;

create table public.forum_helpful (
  reply_id uuid not null references public.forum_replies (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (reply_id, user_id)
);
create index forum_helpful_user_idx on public.forum_helpful (user_id);

-- Rep for a reply marked Solved: once per thread, kept if the thread goes.
create table public.forum_rep (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  thread_id uuid references public.forum_threads (id) on delete set null,
  -- Who marked it (for the "same person" cap); kept null if they leave.
  marked_by uuid references auth.users (id) on delete set null,
  rep int not null check (rep >= 0),
  earned_on date not null,
  created_at timestamptz not null default now()
);
create unique index forum_rep_thread_idx on public.forum_rep (thread_id) where thread_id is not null;
create index forum_rep_user_idx on public.forum_rep (user_id, earned_on);

-- Reply counts and activity (the author's RLS can't update the thread).
create function private.forum_reply_counts()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.forum_threads set reply_count = reply_count + 1, last_activity_at = new.created_at where id = new.thread_id;
  else
    update public.forum_threads set reply_count = greatest(0, reply_count - 1) where id = old.thread_id;
  end if;
  return null;
end;
$$;
create trigger forum_replies_count after insert or delete on public.forum_replies
  for each row execute function private.forum_reply_counts();

create function private.forum_helpful_counts()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.forum_replies set helpful_count = helpful_count + 1 where id = new.reply_id;
  else
    update public.forum_replies set helpful_count = greatest(0, helpful_count - 1) where id = old.reply_id;
  end if;
  return null;
end;
$$;
create trigger forum_helpful_count after insert or delete on public.forum_helpful
  for each row execute function private.forum_helpful_counts();

-- Photos must be your own, in your forum folder of `photos`.
create function private.check_forum_photos(p_uid uuid, p_photos text[])
returns void
language plpgsql immutable
set search_path = ''
as $$
declare
  v text;
begin
  if cardinality(coalesce(p_photos, '{}')) > 4 then raise exception 'Up to 4 photos a post.'; end if;
  foreach v in array coalesce(p_photos, '{}') loop
    if v !~ ('^' || p_uid::text || '/forum/[A-Za-z0-9._-]+$') then raise exception 'That photo isn''t one of yours.'; end if;
  end loop;
end;
$$;

-- A build linked in a post must be yours.
create function private.check_own_build(p_uid uuid, p_build uuid)
returns void
language plpgsql stable security definer
set search_path = ''
as $$
begin
  if p_build is not null and not exists (select 1 from public.builds b where b.id = p_build and b.owner_id = p_uid) then
    raise exception 'You can only link your own builds.';
  end if;
end;
$$;

create function private.forum_rate(p_uid uuid, p_kind text)
returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  if p_kind = 'thread' then
    if private.rate_count(p_uid, 'thread', interval '10 minutes') >= 3 then
      raise exception 'You''re posting a lot. Try again in a few minutes.';
    end if;
    if private.rate_count(p_uid, 'thread', interval '1 day') >= 15 then
      raise exception 'That''s the most new threads for one day.';
    end if;
  else
    if private.rate_count(p_uid, 'reply', interval '1 minute') >= 5 then
      raise exception 'You''re posting a lot. Try again in a few minutes.';
    end if;
    if private.rate_count(p_uid, 'reply', interval '1 day') >= 200 then
      raise exception 'That''s the most replies for one day.';
    end if;
  end if;
  perform private.rate_hit(p_uid, p_kind);
end;
$$;

create function public.create_thread(
  p_board public.forum_board,
  p_region text,
  p_title text,
  p_body text,
  p_photos text[] default '{}',
  p_build_id uuid default null
)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
  v_title text := btrim(coalesce(p_title, ''));
  v_body text := btrim(coalesce(p_body, ''));
  v_id uuid;
begin
  if not exists (select 1 from public.profiles p where p.id = v_uid and p.onboarded) then
    raise exception 'Set up your profile first.';
  end if;
  if char_length(v_title) < 4 then raise exception 'Give it a title of at least 4 characters.'; end if;
  if char_length(v_title) > 120 then raise exception 'Keep the title to 120 characters or fewer.'; end if;
  if char_length(v_body) > 5000 then raise exception 'Keep it to 5,000 characters or fewer.'; end if;
  if p_board = 'local' and p_region is null then raise exception 'Pick a region for the Local board.'; end if;
  perform private.check_public_text(v_title || E'\n' || v_body);
  perform private.check_forum_photos(v_uid, p_photos);
  perform private.check_own_build(v_uid, p_build_id);
  perform private.forum_rate(v_uid, 'thread');
  insert into public.forum_threads (board, region, author_id, title, body, photos, build_id)
    values (p_board, case when p_board = 'local' then p_region end, v_uid, v_title, v_body, coalesce(p_photos, '{}'), p_build_id)
    returning id into v_id;
  return v_id;
end;
$$;

create function public.reply_thread(p_thread_id uuid, p_body text, p_photos text[] default '{}', p_build_id uuid default null)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
  v_body text := btrim(coalesce(p_body, ''));
  t public.forum_threads;
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
  perform private.check_own_build(v_uid, p_build_id);
  perform private.forum_rate(v_uid, 'reply');
  insert into public.forum_replies (thread_id, author_id, body, photos, build_id)
    values (p_thread_id, v_uid, v_body, coalesce(p_photos, '{}'), p_build_id)
    returning id into v_id;
  return v_id;
end;
$$;

create function public.mark_helpful(p_reply_id uuid, p_on boolean)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
  r public.forum_replies;
begin
  select * into r from public.forum_replies where id = p_reply_id and hidden_at is null;
  if not found then raise exception 'That reply isn''t there any more.'; end if;
  if r.author_id = v_uid then raise exception 'You can''t mark your own reply as helpful.'; end if;
  if p_on then
    insert into public.forum_helpful (reply_id, user_id) values (p_reply_id, v_uid) on conflict do nothing;
  else
    delete from public.forum_helpful where reply_id = p_reply_id and user_id = v_uid;
  end if;
end;
$$;

-- The thread's author marks one reply as the answer (or none). The first reply
-- marked earns its author +25 rep, once per thread, never for your own reply,
-- at most 3 paid a day, and at most one a week from the same thread author
-- (over a cap it's kept with 0, so the count stays right). Mirrors forum.ts.
create function public.mark_solved(p_thread_id uuid, p_reply_id uuid)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
  t public.forum_threads;
  r public.forum_replies;
  v_rep int := 25;
begin
  select * into t from public.forum_threads where id = p_thread_id;
  if not found then raise exception 'That thread isn''t there any more.'; end if;
  if t.author_id <> v_uid then raise exception 'Only the person who started the thread can mark it solved.'; end if;
  if p_reply_id is null then
    update public.forum_threads set solved_reply_id = null where id = p_thread_id;
    return;
  end if;
  select * into r from public.forum_replies where id = p_reply_id and thread_id = p_thread_id and hidden_at is null;
  if not found then raise exception 'That reply isn''t there any more.'; end if;
  update public.forum_threads set solved_reply_id = p_reply_id, last_activity_at = now() where id = p_thread_id;
  if r.author_id <> v_uid and not exists (select 1 from public.forum_rep f where f.thread_id = p_thread_id) then
    if (select count(*) from public.forum_rep f where f.user_id = r.author_id and f.earned_on = private.uk_day() and f.rep > 0) >= 3
       or exists (select 1 from public.forum_rep f where f.user_id = r.author_id and f.marked_by = v_uid
                  and f.rep > 0 and f.created_at > now() - interval '7 days') then
      v_rep := 0;
    end if;
    insert into public.forum_rep (user_id, thread_id, marked_by, rep, earned_on)
      values (r.author_id, p_thread_id, v_uid, v_rep, private.uk_day());
  end if;
end;
$$;

-- Forum rep for the rep ledger (counts only, for anyone).
create function public.forum_rep_for(p_user_ids uuid[])
returns table (user_id uuid, solved int, rep int)
language sql stable security definer
set search_path = ''
as $$
  select u.id,
         coalesce((select count(*) from public.forum_rep f where f.user_id = u.id), 0)::int,
         coalesce((select sum(f.rep) from public.forum_rep f where f.user_id = u.id), 0)::int
  from unnest(p_user_ids) as u (id)
  where auth.uid() is not null
$$;

-- ===========================================================================
-- Messages
-- ===========================================================================

create type public.conversation_kind as enum ('direct', 'group');

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  kind public.conversation_kind not null,
  name text check (name is null or char_length(btrim(name)) between 1 and 40),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  -- Direct only: "<lower uuid>:<higher uuid>", so a pair has one conversation.
  direct_key text unique,
  constraint conversations_shape check (
    (kind = 'direct' and direct_key is not null and name is null) or (kind = 'group' and direct_key is null and name is not null)
  )
);

create table public.conversation_members (
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'member' check (role in ('admin', 'member')),
  joined_at timestamptz not null default now(),
  -- "Seen": messages up to here have been read.
  last_read_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);
create index conversation_members_user_idx on public.conversation_members (user_id);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  -- Null for lines the app writes ("@dan added @kez").
  sender_id uuid references auth.users (id) on delete cascade,
  body text not null default '' check (char_length(body) <= 2000),
  -- In the private `messages` bucket: {sender}/{conversation}/{file}.
  photo_path text,
  -- A shared event, place or build: { kind, id, title, subtitle }.
  share jsonb,
  system boolean not null default false,
  created_at timestamptz not null default now(),
  hidden_at timestamptz,
  constraint messages_not_empty check (body <> '' or photo_path is not null or share is not null)
);
create index messages_conversation_idx on public.messages (conversation_id, created_at desc);
create index messages_sender_idx on public.messages (sender_id, created_at);

create function private.is_member(p_conv uuid, p_user uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (select 1 from public.conversation_members m where m.conversation_id = p_conv and m.user_id = p_user)
$$;

create function private.is_group_admin(p_conv uuid, p_user uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.conversation_members m join public.conversations c on c.id = m.conversation_id
    where m.conversation_id = p_conv and m.user_id = p_user and m.role = 'admin' and c.kind = 'group'
  )
$$;

-- The other person in a direct conversation.
create function private.direct_other(p_conv uuid, p_user uuid)
returns uuid
language sql stable security definer
set search_path = ''
as $$
  select case when split_part(c.direct_key, ':', 1)::uuid = p_user then split_part(c.direct_key, ':', 2)::uuid
              else split_part(c.direct_key, ':', 1)::uuid end
  from public.conversations c where c.id = p_conv and c.kind = 'direct'
$$;

-- Can this person write in this conversation now? Groups: a member. Direct: a
-- member, still connected with the other person, and no block either way.
create function private.can_post(p_conv uuid, p_user uuid)
returns boolean
language plpgsql stable security definer
set search_path = ''
as $$
declare
  c public.conversations;
  v_other uuid;
begin
  select * into c from public.conversations where id = p_conv;
  if not found or not private.is_member(p_conv, p_user) then return false; end if;
  if c.kind = 'group' then return true; end if;
  v_other := private.direct_other(p_conv, p_user);
  return private.are_connected(p_user, v_other) and not private.blocked_between(p_user, v_other);
end;
$$;

-- Handle for the lines the app writes.
create function private.handle_of(p_user uuid)
returns text
language sql stable security definer
set search_path = ''
as $$ select coalesce('@' || p.handle, 'Someone') from public.profiles p where p.id = p_user $$;

create function private.system_line(p_conv uuid, p_text text)
returns void
language sql security definer
set search_path = ''
as $$
  insert into public.messages (conversation_id, sender_id, body, system) values (p_conv, null, p_text, true);
  update public.conversations set last_message_at = now() where id = p_conv;
$$;

-- Groups always keep an admin: when the last one goes, the longest-standing
-- member takes over; an empty group is deleted. Runs on leave, remove and
-- account deletion (the member row cascades).
create function private.after_member_left()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  v_kind public.conversation_kind;
begin
  select kind into v_kind from public.conversations where id = old.conversation_id;
  if v_kind is null then return null; end if;
  if not exists (select 1 from public.conversation_members m where m.conversation_id = old.conversation_id) then
    delete from public.conversations where id = old.conversation_id;
  elsif v_kind = 'group' and not exists (
    select 1 from public.conversation_members m where m.conversation_id = old.conversation_id and m.role = 'admin'
  ) then
    update public.conversation_members set role = 'admin'
      where (conversation_id, user_id) = (
        select m.conversation_id, m.user_id from public.conversation_members m
        where m.conversation_id = old.conversation_id order by m.joined_at, m.user_id limit 1
      );
  end if;
  return null;
end;
$$;
create trigger conversation_members_left after delete on public.conversation_members
  for each row execute function private.after_member_left();

-- People you can put in a chat: connected with you, no block either way.
create function private.check_can_add(p_uid uuid, p_user uuid)
returns void
language plpgsql stable security definer
set search_path = ''
as $$
begin
  if p_user is null or p_user = p_uid then raise exception 'Pick someone else.'; end if;
  if not private.are_connected(p_uid, p_user) or private.blocked_between(p_uid, p_user) then
    raise exception 'You can only message people you''re connected with.';
  end if;
end;
$$;

-- Open (or reopen) your 1-to-1 chat with a connection. Returns its id.
create function public.start_direct(p_user uuid)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
  v_key text;
  v_id uuid;
begin
  perform private.check_can_add(v_uid, p_user);
  v_key := least(v_uid, p_user)::text || ':' || greatest(v_uid, p_user)::text;
  select id into v_id from public.conversations where direct_key = v_key;
  if v_id is null then
    insert into public.conversations (kind, created_by, direct_key) values ('direct', v_uid, v_key) returning id into v_id;
  end if;
  insert into public.conversation_members (conversation_id, user_id, role)
    values (v_id, v_uid, 'member'), (v_id, p_user, 'member')
    on conflict do nothing;
  return v_id;
end;
$$;

-- A group: you (admin) and 1 to 49 of your connections.
create function public.create_group(p_name text, p_member_ids uuid[])
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
  v_name text := btrim(coalesce(p_name, ''));
  v_ids uuid[] := array(select distinct x from unnest(coalesce(p_member_ids, '{}')) x where x is not null and x <> v_uid);
  v uuid;
  v_id uuid;
begin
  if v_name = '' then raise exception 'Give the group a name.'; end if;
  if char_length(v_name) > 40 then raise exception 'Keep the name to 40 characters or fewer.'; end if;
  perform private.check_public_text(v_name);
  if cardinality(v_ids) = 0 then raise exception 'Add at least one person.'; end if;
  if cardinality(v_ids) > 49 then raise exception 'Groups can have up to 50 people.'; end if;
  foreach v in array v_ids loop perform private.check_can_add(v_uid, v); end loop;
  if private.rate_count(v_uid, 'group', interval '1 day') >= 10 then
    raise exception 'That''s the most new groups for one day.';
  end if;
  perform private.rate_hit(v_uid, 'group');
  insert into public.conversations (kind, name, created_by) values ('group', v_name, v_uid) returning id into v_id;
  insert into public.conversation_members (conversation_id, user_id, role) values (v_id, v_uid, 'admin');
  insert into public.conversation_members (conversation_id, user_id, role) select v_id, x, 'member' from unnest(v_ids) x;
  perform private.system_line(v_id, private.handle_of(v_uid) || ' started the group');
  return v_id;
end;
$$;

create function public.add_group_members(p_conversation_id uuid, p_member_ids uuid[])
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
  v uuid;
  v_ids uuid[];
begin
  if not private.is_group_admin(p_conversation_id, v_uid) then raise exception 'Only the group''s admins can add people.'; end if;
  v_ids := array(select distinct x from unnest(coalesce(p_member_ids, '{}')) x
                 where x is not null and not private.is_member(p_conversation_id, x));
  if cardinality(v_ids) = 0 then return; end if;
  if (select count(*) from public.conversation_members m where m.conversation_id = p_conversation_id) + cardinality(v_ids) > 50 then
    raise exception 'Groups can have up to 50 people.';
  end if;
  foreach v in array v_ids loop
    perform private.check_can_add(v_uid, v);
    insert into public.conversation_members (conversation_id, user_id, role) values (p_conversation_id, v, 'member');
    perform private.system_line(p_conversation_id, private.handle_of(v_uid) || ' added ' || private.handle_of(v));
  end loop;
end;
$$;

create function public.remove_group_member(p_conversation_id uuid, p_user uuid)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
begin
  if not private.is_group_admin(p_conversation_id, v_uid) then raise exception 'Only the group''s admins can remove people.'; end if;
  if p_user = v_uid then raise exception 'Use Leave the group instead.'; end if;
  delete from public.conversation_members where conversation_id = p_conversation_id and user_id = p_user;
  if found then
    perform private.system_line(p_conversation_id, private.handle_of(v_uid) || ' removed ' || private.handle_of(p_user));
  end if;
end;
$$;

create function public.set_group_admin(p_conversation_id uuid, p_user uuid, p_admin boolean)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
begin
  if not private.is_group_admin(p_conversation_id, v_uid) then raise exception 'Only the group''s admins can do that.'; end if;
  if p_user = v_uid and not p_admin then raise exception 'Make someone else an admin, then leave the group.'; end if;
  update public.conversation_members set role = case when p_admin then 'admin' else 'member' end
    where conversation_id = p_conversation_id and user_id = p_user;
  if not found then raise exception 'They''re not in this group.'; end if;
end;
$$;

create function public.rename_group(p_conversation_id uuid, p_name text)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
  v_name text := btrim(coalesce(p_name, ''));
begin
  if not private.is_group_admin(p_conversation_id, v_uid) then raise exception 'Only the group''s admins can rename it.'; end if;
  if v_name = '' then raise exception 'Give the group a name.'; end if;
  if char_length(v_name) > 40 then raise exception 'Keep the name to 40 characters or fewer.'; end if;
  perform private.check_public_text(v_name);
  update public.conversations set name = v_name where id = p_conversation_id;
  perform private.system_line(p_conversation_id, private.handle_of(v_uid) || ' renamed the group');
end;
$$;

-- Leave a group, or delete a 1-to-1 chat from your list (the other person keeps theirs).
create function public.leave_conversation(p_conversation_id uuid)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
  v_kind public.conversation_kind;
begin
  select kind into v_kind from public.conversations where id = p_conversation_id;
  if v_kind = 'group' and private.is_member(p_conversation_id, v_uid)
     and exists (select 1 from public.conversation_members m where m.conversation_id = p_conversation_id and m.user_id <> v_uid) then
    perform private.system_line(p_conversation_id, private.handle_of(v_uid) || ' left');
  end if;
  delete from public.conversation_members where conversation_id = p_conversation_id and user_id = v_uid;
end;
$$;

-- Send a message. At most 20 a minute and 1,000 a day.
create function public.send_message(p_conversation_id uuid, p_body text, p_photo_path text default null, p_share jsonb default null)
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
  if p_share is not null then
    if jsonb_typeof(p_share) <> 'object' or coalesce(p_share->>'kind', '') not in ('event', 'place', 'build')
       or char_length(coalesce(p_share->>'id', '')) not between 1 and 100
       or char_length(coalesce(p_share->>'title', '')) not between 1 and 120
       or char_length(coalesce(p_share->>'subtitle', '')) > 160 then
      raise exception 'That can''t be shared.';
    end if;
    v_share := jsonb_build_object('kind', p_share->>'kind', 'id', p_share->>'id', 'title', p_share->>'title', 'subtitle', coalesce(p_share->>'subtitle', ''));
  end if;
  if v_body = '' and p_photo_path is null and v_share is null then raise exception 'Write a message first.'; end if;
  if private.rate_count(v_uid, 'message', interval '1 minute') >= 20 then
    raise exception 'Slow down a little: that''s a lot of messages in a minute.';
  end if;
  if private.rate_count(v_uid, 'message', interval '1 day') >= 1000 then
    raise exception 'That''s the most messages for one day.';
  end if;
  perform private.rate_hit(v_uid, 'message');
  -- A 1-to-1 chat the other person deleted comes back to their list.
  v_other := private.direct_other(p_conversation_id, v_uid);
  if v_other is not null then
    insert into public.conversation_members (conversation_id, user_id, role, last_read_at)
      values (p_conversation_id, v_other, 'member', now() - interval '1 second') on conflict do nothing;
  end if;
  insert into public.messages (conversation_id, sender_id, body, photo_path, share)
    values (p_conversation_id, v_uid, v_body, p_photo_path, v_share) returning * into m;
  update public.conversations c set last_message_at = m.created_at where c.id = p_conversation_id;
  update public.conversation_members cm set last_read_at = m.created_at
    where cm.conversation_id = p_conversation_id and cm.user_id = v_uid;
  return query select m.id, m.created_at;
end;
$$;

create function public.mark_conversation_read(p_conversation_id uuid)
returns void
language sql security definer
set search_path = ''
as $$
  update public.conversation_members set last_read_at = now()
  where conversation_id = p_conversation_id and user_id = auth.uid()
$$;

-- Your conversations, newest first: members, unread count (not your own, not
-- hidden, not from people you blocked), the last line, and whether you can write.
create function public.my_conversations()
returns table (
  id uuid, kind public.conversation_kind, name text, created_at timestamptz, last_message_at timestamptz,
  member_ids uuid[], admin_ids uuid[], unread int, last_body text, last_sender uuid, last_kind text, can_send boolean
)
language sql stable security definer
set search_path = ''
as $$
  select c.id, c.kind, c.name, c.created_at, c.last_message_at,
         array(select m.user_id from public.conversation_members m where m.conversation_id = c.id order by m.joined_at),
         array(select m.user_id from public.conversation_members m where m.conversation_id = c.id and m.role = 'admin'),
         (select count(*) from public.messages x
            where x.conversation_id = c.id and x.created_at > me.last_read_at and x.hidden_at is null
              and x.sender_id is not null and x.sender_id <> me.user_id
              and not private.i_blocked(me.user_id, x.sender_id))::int,
         l.body, l.sender_id,
         case when l.id is null then null when l.system then 'system' when l.photo_path is not null then 'photo'
              when l.share is not null then 'share' else 'text' end,
         private.can_post(c.id, me.user_id)
  from public.conversation_members me
  join public.conversations c on c.id = me.conversation_id
  left join lateral (
    select x.* from public.messages x
    where x.conversation_id = c.id and x.hidden_at is null
      and (x.sender_id is null or not private.i_blocked(me.user_id, x.sender_id))
    order by x.created_at desc limit 1
  ) l on true
  where me.user_id = auth.uid()
  order by c.last_message_at desc
  limit 200
$$;

-- ===========================================================================
-- Feed posts (owner request, 17 Nov 2026: "like Facebook")
-- ===========================================================================
--
-- Text and up to 4 plate-blurred photos (`photos` bucket, {author}/posts/...),
-- an optional place (picked on the map; never within about 1 km of your own
-- home area), Public (everyone signed in) or Connections only, likes and
-- comments. Posts with a place show on the map's Posts layer.

create type public.post_visibility as enum ('public', 'connections');

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users (id) on delete cascade,
  body text not null default '' check (char_length(body) <= 2000),
  photos text[] not null default '{}' check (cardinality(photos) <= 4),
  -- Snapped to 4 decimal places (~10 m).
  location extensions.geography(Point, 4326),
  place_name text check (char_length(place_name) <= 80),
  visibility public.post_visibility not null default 'public',
  build_id uuid references public.builds (id) on delete set null,
  created_at timestamptz not null default now(),
  like_count int not null default 0 check (like_count >= 0),
  comment_count int not null default 0 check (comment_count >= 0),
  hidden_at timestamptz,
  constraint posts_not_empty check (btrim(body) <> '' or cardinality(photos) > 0)
);
create index posts_created_idx on public.posts (created_at desc);
create index posts_author_idx on public.posts (author_id, created_at desc);
create index posts_location_idx on public.posts using gist (location) where location is not null;

create table public.post_likes (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
create index post_likes_user_idx on public.post_likes (user_id);

create table public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  author_id uuid not null references auth.users (id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 1000),
  created_at timestamptz not null default now(),
  hidden_at timestamptz
);
create index post_comments_post_idx on public.post_comments (post_id, created_at);

-- Can this person read this post? (the RLS rule, for the RPCs too)
create function private.can_see_post(p_post uuid, p_user uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.posts p
    where p.id = p_post
      and (p.author_id = p_user or (
        p.hidden_at is null
        and not private.blocked_between(p_user, p.author_id)
        and (p.visibility = 'public' or private.are_connected(p_user, p.author_id))
      ))
  )
$$;

create function private.post_counts()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  if tg_table_name = 'post_likes' then
    if tg_op = 'INSERT' then update public.posts set like_count = like_count + 1 where id = new.post_id;
    else update public.posts set like_count = greatest(0, like_count - 1) where id = old.post_id; end if;
  else
    if tg_op = 'INSERT' then update public.posts set comment_count = comment_count + 1 where id = new.post_id;
    else update public.posts set comment_count = greatest(0, comment_count - 1) where id = old.post_id; end if;
  end if;
  return null;
end;
$$;
create trigger post_likes_count after insert or delete on public.post_likes for each row execute function private.post_counts();
create trigger post_comments_count after insert or delete on public.post_comments for each row execute function private.post_counts();

create function public.create_post(
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
    -- Never a home: nothing within about 1 km of your (already fuzzed) home area.
    if exists (select 1 from public.profile_homes h where h.user_id = v_uid and extensions.st_dwithin(h.home, v_at, 1000)) then
      raise exception 'That''s within about 1 km of your home area, so it can''t be shared. Pick a spot further away.';
    end if;
  end if;
  if private.rate_count(v_uid, 'post', interval '1 hour') >= 10 then
    raise exception 'You''re posting a lot. Try again in a little while.';
  end if;
  if private.rate_count(v_uid, 'post', interval '1 day') >= 30 then
    raise exception 'That''s the most posts for one day.';
  end if;
  perform private.rate_hit(v_uid, 'post');
  insert into public.posts (author_id, body, photos, location, place_name, visibility, build_id)
    values (v_uid, v_body, coalesce(p_photos, '{}'), v_at, case when v_at is null then null else nullif(btrim(coalesce(p_place_name, '')), '') end,
            coalesce(p_visibility, 'public'), p_build_id)
    returning id into v_id;
  return v_id;
end;
$$;

create function public.like_post(p_post_id uuid, p_on boolean)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
begin
  if not private.can_see_post(p_post_id, v_uid) then raise exception 'That post isn''t there any more.'; end if;
  if p_on then
    insert into public.post_likes (post_id, user_id) values (p_post_id, v_uid) on conflict do nothing;
  else
    delete from public.post_likes where post_id = p_post_id and user_id = v_uid;
  end if;
end;
$$;

create function public.comment_post(p_post_id uuid, p_body text)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
  v_body text := btrim(coalesce(p_body, ''));
  v_id uuid;
begin
  if not private.can_see_post(p_post_id, v_uid) then raise exception 'That post isn''t there any more.'; end if;
  if v_body = '' then raise exception 'Write a comment first.'; end if;
  if char_length(v_body) > 1000 then raise exception 'Keep it to 1,000 characters or fewer.'; end if;
  perform private.check_public_text(v_body);
  if private.rate_count(v_uid, 'comment', interval '1 minute') >= 5 then
    raise exception 'You''re posting a lot. Try again in a few minutes.';
  end if;
  if private.rate_count(v_uid, 'comment', interval '1 day') >= 200 then
    raise exception 'That''s the most comments for one day.';
  end if;
  perform private.rate_hit(v_uid, 'comment');
  insert into public.post_comments (post_id, author_id, body) values (p_post_id, v_uid, v_body) returning id into v_id;
  return v_id;
end;
$$;

-- The feed: 'connections' (your connections' posts and your own) or 'local'
-- (public posts placed within your travel distance of your home area, or by
-- people who live within it). Newest first, 50 at a time before p_before.
-- Homes are only compared in here, never returned.
create function public.feed_posts(p_scope text default 'local', p_before timestamptz default null, p_author uuid default null)
returns table (
  id uuid, author_id uuid, body text, photos text[], lat double precision, lng double precision, place_name text,
  visibility public.post_visibility, build_id uuid, created_at timestamptz, like_count int, comment_count int,
  liked_by_me boolean, hidden boolean
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
           extensions.st_y(p.location::extensions.geometry), extensions.st_x(p.location::extensions.geometry),
           p.place_name, p.visibility, p.build_id, p.created_at, p.like_count, p.comment_count,
           exists (select 1 from public.post_likes l where l.post_id = p.id and l.user_id = v_uid),
           p.hidden_at is not null
    from public.posts p
    where private.can_see_post(p.id, v_uid)
      and (p_before is null or p.created_at < p_before)
      and case p_scope
        when 'author' then p.author_id = p_author
        when 'connections' then p.author_id = v_uid or private.are_connected(v_uid, p.author_id)
        else p.visibility = 'public' and v_home is not null and (
          (p.location is not null and extensions.st_dwithin(p.location, v_home, private.mi(v_miles)))
          or exists (select 1 from public.profile_homes ah where ah.user_id = p.author_id
                     and extensions.st_dwithin(ah.home, v_home, private.mi(v_miles))))
      end
    order by p.created_at desc
    limit 50;
end;
$$;

-- The map's Posts layer: posts with a place you can see, in a box, from the last 30 days.
create function public.posts_in_box(p_south double precision, p_west double precision, p_north double precision, p_east double precision)
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
  order by p.created_at desc
  limit 200
$$;

-- ===========================================================================
-- Reports (moderation)
-- ===========================================================================

create type public.report_target as enum ('thread', 'reply', 'message', 'profile', 'build', 'post', 'comment');
create type public.report_reason as enum (
  'spam', 'harassment', 'hate', 'sexual', 'violence', 'dangerous_driving', 'police', 'personal_info', 'scam', 'underage', 'other'
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references auth.users (id) on delete set null,
  target public.report_target not null,
  target_id uuid not null,
  target_user uuid references auth.users (id) on delete cascade,
  reason public.report_reason not null,
  note text check (char_length(note) <= 500),
  -- A copy of what was reported, for staff (a message stays private otherwise).
  excerpt text,
  created_at timestamptz not null default now(),
  status text not null default 'new' check (status in ('new', 'actioned', 'dismissed')),
  handled_by uuid references auth.users (id) on delete set null,
  handled_at timestamptz
);
create unique index reports_once_idx on public.reports (reporter_id, target, target_id) where reporter_id is not null;
create index reports_status_idx on public.reports (status, created_at);
create index reports_target_idx on public.reports (target, target_id);

create function public.report_content(p_target public.report_target, p_target_id uuid, p_reason public.report_reason, p_note text default null)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
  v_user uuid;
  v_excerpt text;
  v_count int;
begin
  if p_target = 'thread' then
    select t.author_id, t.title || E'\n' || t.body into v_user, v_excerpt from public.forum_threads t where t.id = p_target_id;
  elsif p_target = 'reply' then
    select r.author_id, r.body into v_user, v_excerpt from public.forum_replies r where r.id = p_target_id;
  elsif p_target = 'message' then
    select m.sender_id, m.body || coalesce(' [photo ' || m.photo_path || ']', '') into v_user, v_excerpt
      from public.messages m where m.id = p_target_id and private.is_member(m.conversation_id, v_uid);
  elsif p_target = 'profile' then
    select p.id, '@' || p.handle || ' · ' || coalesce(p.display_name, '') into v_user, v_excerpt from public.profiles p where p.id = p_target_id;
  elsif p_target = 'post' then
    select p.author_id, p.body || coalesce(' [' || cardinality(p.photos) || ' photos]', '') into v_user, v_excerpt
      from public.posts p where p.id = p_target_id and private.can_see_post(p.id, v_uid);
  elsif p_target = 'comment' then
    select c.author_id, c.body into v_user, v_excerpt
      from public.post_comments c where c.id = p_target_id and private.can_see_post(c.post_id, v_uid);
  elsif p_target = 'build' then
    select b.owner_id, b.make || ' ' || b.model || coalesce(' "' || b.nickname || '"', '') into v_user, v_excerpt
      from public.builds b where b.id = p_target_id;
  end if;
  if v_user is null then raise exception 'That isn''t there any more.'; end if;
  if v_user = v_uid then raise exception 'You can''t report yourself.'; end if;
  if private.rate_count(v_uid, 'report', interval '1 day') >= 30 then
    raise exception 'That''s the most reports for one day. Thanks for helping.';
  end if;
  perform private.rate_hit(v_uid, 'report');
  insert into public.reports (reporter_id, target, target_id, target_user, reason, note, excerpt)
    values (v_uid, p_target, p_target_id, v_user, p_reason, nullif(left(btrim(coalesce(p_note, '')), 500), ''), left(v_excerpt, 1000))
    on conflict do nothing;
  -- Three different people: hidden until staff look.
  select count(distinct r.reporter_id) into v_count from public.reports r
    where r.target = p_target and r.target_id = p_target_id and r.status = 'new';
  if v_count >= 3 then
    if p_target = 'thread' then update public.forum_threads set hidden_at = coalesce(hidden_at, now()) where id = p_target_id;
    elsif p_target = 'reply' then update public.forum_replies set hidden_at = coalesce(hidden_at, now()) where id = p_target_id;
    elsif p_target = 'message' then update public.messages set hidden_at = coalesce(hidden_at, now()) where id = p_target_id;
    elsif p_target = 'post' then update public.posts set hidden_at = coalesce(hidden_at, now()) where id = p_target_id;
    elsif p_target = 'comment' then update public.post_comments set hidden_at = coalesce(hidden_at, now()) where id = p_target_id;
    end if;
  end if;
end;
$$;

-- Staff: hide (and close every report on it), restore, or dismiss.
create function public.moderate_report(p_report_id uuid, p_action text)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
  r public.reports;
  v_hide timestamptz;
begin
  if not private.is_admin(v_uid) then raise exception 'Only staff can do that.'; end if;
  select * into r from public.reports where id = p_report_id;
  if not found then raise exception 'That report isn''t there any more.'; end if;
  if p_action not in ('hide', 'restore', 'dismiss') then raise exception 'Pick hide, restore or dismiss.'; end if;
  if p_action in ('hide', 'restore') then
    v_hide := case when p_action = 'hide' then now() end;
    if r.target = 'thread' then update public.forum_threads set hidden_at = v_hide where id = r.target_id;
    elsif r.target = 'reply' then update public.forum_replies set hidden_at = v_hide where id = r.target_id;
    elsif r.target = 'message' then update public.messages set hidden_at = v_hide where id = r.target_id;
    elsif r.target = 'post' then update public.posts set hidden_at = v_hide where id = r.target_id;
    elsif r.target = 'comment' then update public.post_comments set hidden_at = v_hide where id = r.target_id;
    end if;
  end if;
  update public.reports
    set status = case when p_action = 'dismiss' then 'dismissed' else 'actioned' end, handled_by = v_uid, handled_at = now()
    where target = r.target and target_id = r.target_id and status = 'new';
end;
$$;

-- Staff's queue: open reports grouped by what was reported, most reported first.
create view public.moderation_queue with (security_invoker = true) as
  select r.target, r.target_id, r.target_user,
         count(*)::int as reports,
         array_agg(distinct r.reason) as reasons,
         min(r.created_at) as first_reported,
         (array_agg(r.id order by r.created_at))[1] as report_id,
         (array_agg(r.excerpt order by r.created_at))[1] as excerpt,
         array_remove(array_agg(r.note order by r.created_at), null) as notes
  from public.reports r
  where r.status = 'new'
  group by r.target, r.target_id, r.target_user;

-- ===========================================================================
-- Row Level Security
-- ===========================================================================

alter table public.blocks enable row level security;
alter table public.connections enable row level security;
alter table public.build_ratings enable row level security;
alter table public.forum_threads enable row level security;
alter table public.forum_replies enable row level security;
alter table public.forum_helpful enable row level security;
alter table public.forum_rep enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;
alter table public.reports enable row level security;

create policy "blocks: own" on public.blocks
  for select to authenticated using (blocker_id = (select auth.uid()));

-- Pending requests to you and from you, and accepted ones. Declined rows are
-- never readable (the asker isn't told); my_connections() shows them as "Requested".
create policy "connections: own" on public.connections
  for select to authenticated using (
    (select auth.uid()) in (requester_id, addressee_id) and status <> 'declined'
  );

create policy "build_ratings: own" on public.build_ratings
  for select to authenticated using (user_id = (select auth.uid()));

create policy "forum_threads: read" on public.forum_threads
  for select to authenticated using (
    (hidden_at is null or author_id = (select auth.uid()))
    and not private.i_blocked((select auth.uid()), author_id)
  );
create policy "forum_threads: staff read" on public.forum_threads
  for select to authenticated using (private.is_admin((select auth.uid())));
create policy "forum_threads: author deletes" on public.forum_threads
  for delete to authenticated using (author_id = (select auth.uid()));

create policy "forum_replies: read" on public.forum_replies
  for select to authenticated using (
    (hidden_at is null or author_id = (select auth.uid()))
    and not private.i_blocked((select auth.uid()), author_id)
    and exists (select 1 from public.forum_threads t where t.id = thread_id)
  );
create policy "forum_replies: staff read" on public.forum_replies
  for select to authenticated using (private.is_admin((select auth.uid())));
create policy "forum_replies: author deletes" on public.forum_replies
  for delete to authenticated using (author_id = (select auth.uid()));

create policy "forum_helpful: own" on public.forum_helpful
  for select to authenticated using (user_id = (select auth.uid()));
create policy "forum_rep: own" on public.forum_rep
  for select to authenticated using (user_id = (select auth.uid()));

-- Members only. Staff don't get a blanket read on private messages: reports carry a copy.
create policy "conversations: members" on public.conversations
  for select to authenticated using (private.is_member(id, (select auth.uid())));
create policy "conversation_members: members" on public.conversation_members
  for select to authenticated using (private.is_member(conversation_id, (select auth.uid())));
create policy "messages: members" on public.messages
  for select to authenticated using (
    private.is_member(conversation_id, (select auth.uid()))
    and (hidden_at is null or sender_id = (select auth.uid()))
    and (sender_id is null or not private.i_blocked((select auth.uid()), sender_id))
  );

alter table public.posts enable row level security;
alter table public.post_likes enable row level security;
alter table public.post_comments enable row level security;

-- Public posts for everyone signed in, Connections-only posts for connections; never across a block.
create policy "posts: read" on public.posts
  for select to authenticated using (private.can_see_post(id, (select auth.uid())));
create policy "posts: staff read" on public.posts
  for select to authenticated using (private.is_admin((select auth.uid())));
create policy "posts: author deletes" on public.posts
  for delete to authenticated using (author_id = (select auth.uid()));
create policy "post_likes: own" on public.post_likes
  for select to authenticated using (user_id = (select auth.uid()));
create policy "post_comments: read" on public.post_comments
  for select to authenticated using (
    private.can_see_post(post_id, (select auth.uid()))
    and (hidden_at is null or author_id = (select auth.uid()))
    and not private.blocked_between((select auth.uid()), author_id)
  );
create policy "post_comments: staff read" on public.post_comments
  for select to authenticated using (private.is_admin((select auth.uid())));
create policy "post_comments: author or post author deletes" on public.post_comments
  for delete to authenticated using (
    author_id = (select auth.uid())
    or exists (select 1 from public.posts p where p.id = post_id and p.author_id = (select auth.uid()))
  );

revoke all on public.posts, public.post_likes, public.post_comments from anon, authenticated;
-- The place is read through feed_posts() / posts_in_box() as lat/lng.
grant select on public.posts, public.post_likes, public.post_comments to authenticated;
grant delete on public.posts, public.post_comments to authenticated;
grant all on public.posts, public.post_likes, public.post_comments to service_role;

create policy "reports: staff read" on public.reports
  for select to authenticated using (private.is_admin((select auth.uid())));

revoke all on public.blocks, public.connections, public.build_ratings, public.forum_threads, public.forum_replies,
  public.forum_helpful, public.forum_rep, public.conversations, public.conversation_members, public.messages,
  public.reports, public.moderation_queue
  from anon, authenticated;
grant select on public.blocks, public.connections, public.build_ratings, public.forum_threads, public.forum_replies,
  public.forum_helpful, public.forum_rep, public.conversations, public.conversation_members, public.messages,
  public.reports, public.moderation_queue
  to authenticated;
grant delete on public.forum_threads, public.forum_replies to authenticated;
grant all on public.blocks, public.connections, public.build_ratings, public.forum_threads, public.forum_replies,
  public.forum_helpful, public.forum_rep, public.conversations, public.conversation_members, public.messages,
  public.reports, public.moderation_queue
  to service_role;

-- RPCs: signed in only.
do $$
declare
  f regprocedure;
begin
  for f in
    select p.oid::regprocedure from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname in (
      'save_community_prefs', 'request_connection', 'answer_connection', 'remove_connection', 'my_connections',
      'block_user', 'unblock_user', 'people_near', 'rate_build', 'build_likes', 'create_thread', 'reply_thread',
      'mark_helpful', 'mark_solved', 'forum_rep_for', 'start_direct', 'create_group', 'add_group_members',
      'remove_group_member', 'set_group_admin', 'rename_group', 'leave_conversation', 'send_message',
      'mark_conversation_read', 'my_conversations', 'report_content', 'moderate_report',
      'create_post', 'like_post', 'comment_post', 'feed_posts', 'posts_in_box')
  loop
    execute format('revoke execute on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated, service_role', f);
  end loop;
  for f in
    select p.oid::regprocedure from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'private' and p.proname in ('rate_hit', 'system_line', 'forum_rate', 'after_member_left',
      'forum_reply_counts', 'forum_helpful_counts', 'post_counts')
  loop
    execute format('revoke execute on function %s from public, anon, authenticated', f);
  end loop;
end;
$$;

-- ===========================================================================
-- Storage: message photos (private, members only)
-- ===========================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('messages', 'messages', false, 10485760, array['image/jpeg', 'image/png', 'image/heic', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- {sender}/{conversation}/{file}: you upload into your own folder for a conversation you're in.
create policy "messages: members upload" on storage.objects for insert to authenticated
with check (
  bucket_id = 'messages'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and private.is_member(private.try_uuid((storage.foldername(name))[2]), (select auth.uid()))
);
create policy "messages: members read" on storage.objects for select to authenticated
using (
  bucket_id = 'messages'
  and private.is_member(private.try_uuid((storage.foldername(name))[2]), (select auth.uid()))
);
create policy "messages: delete own" on storage.objects for delete to authenticated
using (bucket_id = 'messages' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- ===========================================================================
-- Realtime: new messages, read receipts, connection requests
-- ===========================================================================

alter publication supabase_realtime add table public.messages, public.conversation_members, public.connections;

-- Group drive: everyone in the group on the driving map (Slipstream, 22 Nov 2026).
--
-- Strictly opt-in, short-lived and visible only to the group:
--   * a person starts a group drive (or joins one by its code) and so agrees to share their live
--     position with the other members until it ends;
--   * the server keeps ONLY each member's latest position, on that member's own row (lat, lng,
--     heading, speed, updated_at). There is no history table and nothing else ever stores a position;
--   * a member's position is gone the moment they leave; the whole group is gone when the leader
--     ends it, when the last person leaves, or 6 hours after it started (cleared on the next call,
--     see private.group_drive_sweep(); the project has no scheduled cleanup and does not use pg_cron);
--   * only current members can read member positions, through group_drive_read(). The tables have
--     row level security on and NO policies and no grants, so they cannot be read or written
--     directly and are not exposed to Realtime. The app polls group_drive_read() every 5 seconds
--     instead: simpler to keep private than a Realtime channel on a table of positions;
--   * people with a block either way cannot join each other's group and never see each other in it.
--
-- Purely additive, so older apps keep working: two new tables, new functions only, nothing replaced
-- or dropped. Until it is applied the app hides "Drive together" and "Join the group drive".

-- ===========================================================================
-- Tables
-- ===========================================================================

create table public.group_drives (
  id uuid primary key default gen_random_uuid(),
  -- The join code: 16 random hex characters (64 bits) from gen_random_uuid(). Not guessable.
  code text not null unique check (code ~ '^[0-9a-f]{16}$'),
  leader_id uuid not null references public.profiles (id) on delete cascade,
  -- The meet or drive it is for, so people going to the meet can find it. 'none': just a drive.
  target_kind text not null default 'none' check (target_kind in ('event', 'spot', 'none')),
  target_id text check (target_id is null or char_length(target_id) <= 64),
  -- Taken from the meet or drive on the server, never typed by anyone.
  title text not null check (char_length(title) between 1 and 80),
  started_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '6 hours'
);
create index group_drives_expires_idx on public.group_drives (expires_at);
create index group_drives_target_idx on public.group_drives (target_kind, target_id);

-- One row per member, holding only their LATEST position (updated in place; never inserted again).
create table public.group_drive_members (
  group_id uuid not null references public.group_drives (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  lat double precision check (lat between -90 and 90),
  lng double precision check (lng between -180 and 180),
  heading real check (heading is null or (heading >= 0 and heading < 360)),
  speed real check (speed is null or (speed >= 0 and speed <= 100)),
  updated_at timestamptz,
  primary key (group_id, user_id)
);
-- You can be in one group drive at a time.
create unique index group_drive_members_one_group on public.group_drive_members (user_id);

alter table public.group_drives enable row level security;
alter table public.group_drive_members enable row level security;
-- No policies: nobody reads or writes these tables directly. The functions below (security definer) are the only way in.
revoke all on public.group_drives, public.group_drive_members from public, anon, authenticated;
grant all on public.group_drives, public.group_drive_members to service_role;

-- ===========================================================================
-- Private helpers
-- ===========================================================================

-- Ends every group drive whose 6 hours are up (members' rows go with it). Runs at the start of each call below.
create function private.group_drive_sweep()
returns void
language sql security definer
set search_path = ''
as $$
  delete from public.group_drives g where g.expires_at <= now();
$$;

-- Takes one person out of their group (their position goes with their row). An empty group is deleted;
-- if the leader leaves, the person who has been in longest leads.
create function private.group_drive_drop(p_user uuid)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_group uuid;
  v_next uuid;
begin
  delete from public.group_drive_members m where m.user_id = p_user returning m.group_id into v_group;
  if v_group is null then return; end if;
  if not exists (select 1 from public.group_drive_members m where m.group_id = v_group) then
    delete from public.group_drives g where g.id = v_group;
  elsif exists (select 1 from public.group_drives g where g.id = v_group and g.leader_id = p_user) then
    select m.user_id into v_next from public.group_drive_members m where m.group_id = v_group order by m.joined_at, m.user_id limit 1;
    update public.group_drives g set leader_id = v_next where g.id = v_group;
  end if;
end;
$$;

-- What the app shows about a group (no positions).
create function private.group_drive_summary(p_group uuid)
returns jsonb
language sql stable security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'id', g.id,
    'code', g.code,
    'title', g.title,
    'target_kind', g.target_kind,
    'target_id', g.target_id,
    'leader_id', g.leader_id,
    'started_at', g.started_at,
    'expires_at', g.expires_at,
    'member_count', (select count(*)::int from public.group_drive_members m where m.group_id = g.id)
  )
  from public.group_drives g
  where g.id = p_group
$$;

-- Checks the caller may use group drives: signed in, set up, not suspended.
create function private.group_drive_caller()
returns uuid
language plpgsql stable security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
begin
  if not exists (select 1 from public.profiles p where p.id = v_uid and p.onboarded) then
    raise exception 'Set up your profile first.';
  end if;
  perform private.check_not_suspended(v_uid);
  return v_uid;
end;
$$;

-- ===========================================================================
-- Start
-- ===========================================================================

-- Starts a group drive and puts you in it. p_target_kind 'event' (you are going to or host it) or 'spot'
-- (a drive or place) or 'none'. You leave any group drive you were in.
create function public.group_drive_start(p_target_kind text default 'none', p_target_id text default null)
returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.group_drive_caller();
  v_kind text := coalesce(nullif(btrim(p_target_kind), ''), 'none');
  v_target text := nullif(btrim(coalesce(p_target_id, '')), '');
  v_title text := 'Group drive';
  v_ref uuid;
  v_id uuid;
begin
  if v_kind not in ('event', 'spot', 'none') then raise exception 'That isn''t something you can drive to together.'; end if;
  if v_kind = 'none' then v_target := null; end if;
  if v_kind <> 'none' and v_target is null then raise exception 'That isn''t something you can drive to together.'; end if;
  if v_target is not null and char_length(v_target) > 64 then raise exception 'That isn''t something you can drive to together.'; end if;
  if private.rate_count(v_uid, 'group_drive_start', interval '1 day') >= 10 then
    raise exception 'That''s the most group drives for one day.';
  end if;

  perform private.group_drive_sweep();

  if v_kind = 'event' then
    v_ref := private.try_uuid(v_target);
    if v_ref is null or not exists (select 1 from public.events e where e.id = v_ref) then raise exception 'Meet not found.'; end if;
    if not (private.is_event_host(v_ref, v_uid) or private.is_going(v_ref, v_uid)) then
      raise exception 'You can start a group drive for a meet you are going to.';
    end if;
    select left(e.title, 80) into v_title from public.events e where e.id = v_ref;
  elsif v_kind = 'spot' then
    v_ref := private.try_uuid(v_target);
    if v_ref is not null then
      select left(s.name, 80) into v_title from public.spots s where s.id = v_ref and s.status = 'approved';
      v_title := coalesce(v_title, 'Group drive');
    end if;
  end if;

  perform private.rate_hit(v_uid, 'group_drive_start');
  perform private.group_drive_drop(v_uid);

  insert into public.group_drives (code, leader_id, target_kind, target_id, title)
  values (substr(replace(gen_random_uuid()::text, '-', ''), 1, 16), v_uid, v_kind, v_target, v_title)
  returning id into v_id;
  insert into public.group_drive_members (group_id, user_id) values (v_id, v_uid);
  return private.group_drive_summary(v_id);
end;
$$;

-- ===========================================================================
-- Preview and join
-- ===========================================================================

-- What the join screen shows before anyone agrees to share: the title, who started it and how many are in.
-- Never a position.
create function public.group_drive_preview(p_code text)
returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.group_drive_caller();
  g public.group_drives;
begin
  if private.rate_count(v_uid, 'group_drive_join', interval '1 hour') >= 60 then
    raise exception 'Too many tries. Wait a little and try again.';
  end if;
  perform private.rate_hit(v_uid, 'group_drive_join');
  perform private.group_drive_sweep();
  select * into g from public.group_drives x where x.code = lower(btrim(coalesce(p_code, '')));
  if not found or private.blocked_between(v_uid, g.leader_id) then
    raise exception 'That group drive has ended, or the link is wrong.';
  end if;
  return private.group_drive_summary(g.id) || jsonb_build_object(
    'leader_handle', (select p.handle from public.profiles p where p.id = g.leader_id),
    'joined', exists (select 1 from public.group_drive_members m where m.group_id = g.id and m.user_id = v_uid)
  );
end;
$$;

-- Joins by code (agreeing to share your position with the group). Max 30 people. Nobody who has a block with
-- you either way can be in it. You leave any other group drive you were in.
create function public.group_drive_join(p_code text)
returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.group_drive_caller();
  g public.group_drives;
begin
  if private.rate_count(v_uid, 'group_drive_join', interval '1 hour') >= 60 then
    raise exception 'Too many tries. Wait a little and try again.';
  end if;
  perform private.rate_hit(v_uid, 'group_drive_join');
  perform private.group_drive_sweep();
  select * into g from public.group_drives x where x.code = lower(btrim(coalesce(p_code, ''))) for update;
  if not found then raise exception 'That group drive has ended, or the link is wrong.'; end if;
  if exists (select 1 from public.group_drive_members m where m.group_id = g.id and m.user_id = v_uid) then
    return private.group_drive_summary(g.id);
  end if;
  if exists (select 1 from public.group_drive_members m where m.group_id = g.id and private.blocked_between(v_uid, m.user_id)) then
    raise exception 'You can''t join that group drive.';
  end if;
  if (select count(*) from public.group_drive_members m where m.group_id = g.id) >= 30 then
    raise exception 'That group drive is full (30 people).';
  end if;
  perform private.group_drive_drop(v_uid);
  insert into public.group_drive_members (group_id, user_id) values (g.id, v_uid);
  return private.group_drive_summary(g.id);
end;
$$;

-- ===========================================================================
-- Leave and end
-- ===========================================================================

-- Leaves your group drive: your position is deleted at once. Safe to call when you are in none.
create function public.group_drive_leave()
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
begin
  perform private.group_drive_sweep();
  perform private.group_drive_drop(v_uid);
end;
$$;

-- The leader ends it for everyone: every member's position goes with it.
create function public.group_drive_end()
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
  v_deleted int;
begin
  perform private.group_drive_sweep();
  if not exists (select 1 from public.group_drive_members m where m.user_id = v_uid) then return; end if;
  delete from public.group_drives g
  where g.leader_id = v_uid and exists (select 1 from public.group_drive_members m where m.group_id = g.id and m.user_id = v_uid);
  get diagnostics v_deleted = row_count;
  if v_deleted = 0 then raise exception 'Only the person who started the group drive can end it for everyone.'; end if;
end;
$$;

-- ===========================================================================
-- Position and read
-- ===========================================================================

-- Sets YOUR latest position (the row is updated in place; nothing is kept). False when you are not in an
-- active group drive any more (ended, expired, left): the app stops sending. A call within 2 seconds of the
-- last one is ignored, so the app's 5 seconds can't be outrun. UK roads only. Both coordinates null clears
-- your position (the app does that when navigation ends, so nobody sees a stale dot).
create function public.group_drive_post_position(
  p_lat double precision,
  p_lng double precision,
  p_heading double precision default null,
  p_speed double precision default null
)
returns boolean
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
begin
  perform private.group_drive_sweep();
  if p_lat is null and p_lng is null then
    update public.group_drive_members m set lat = null, lng = null, heading = null, speed = null, updated_at = null where m.user_id = v_uid;
    return found;
  end if;
  if p_lat is null or p_lng is null or not (p_lat between 49.8 and 61.0 and p_lng between -8.7 and 2.0) then
    raise exception 'Group drives are for UK roads only.';
  end if;
  if not exists (select 1 from public.group_drive_members m where m.user_id = v_uid) then return false; end if;
  update public.group_drive_members m
  set lat = round(p_lat::numeric, 5)::double precision,
      lng = round(p_lng::numeric, 5)::double precision,
      heading = case when p_heading is null or p_heading < 0 then null else (p_heading::numeric % 360)::real end,
      speed = case when p_speed is null or p_speed < 0 then null else least(p_speed, 100)::real end,
      updated_at = now()
  where m.user_id = v_uid and (m.updated_at is null or m.updated_at < now() - interval '2 seconds');
  return true;
end;
$$;

-- Your group and its other members with their latest positions. Only members get anything: not in a group
-- (or it ended or ran out) is {"active": false}. Members you have a block with (either way) are left out.
create function public.group_drive_read()
returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
  v_group uuid;
begin
  perform private.group_drive_sweep();
  select m.group_id into v_group from public.group_drive_members m where m.user_id = v_uid;
  if v_group is null then return jsonb_build_object('active', false); end if;
  return jsonb_build_object(
    'active', true,
    'now', now(),
    'group', private.group_drive_summary(v_group),
    'members', coalesce((
      select jsonb_agg(jsonb_build_object(
        'user_id', m.user_id,
        'handle', p.handle,
        'display_name', p.display_name,
        'avatar_ref', p.avatar_ref,
        'is_leader', g.leader_id = m.user_id,
        -- A position older than 10 minutes is not given out at all (the member has stopped sharing).
        'lat', case when m.updated_at > now() - interval '10 minutes' then m.lat end,
        'lng', case when m.updated_at > now() - interval '10 minutes' then m.lng end,
        'heading', case when m.updated_at > now() - interval '10 minutes' then m.heading end,
        'speed', case when m.updated_at > now() - interval '10 minutes' then m.speed end,
        'updated_at', case when m.updated_at > now() - interval '10 minutes' then m.updated_at end
      ) order by m.joined_at, m.user_id)
      from public.group_drive_members m
      join public.group_drives g on g.id = m.group_id
      join public.profiles p on p.id = m.user_id
      where m.group_id = v_group and m.user_id <> v_uid and not private.blocked_between(v_uid, m.user_id)
    ), '[]'::jsonb)
  );
end;
$$;

-- The group drive for a meet you are going to (or host): its code, title and head count, or null. This is what
-- shows "Join the group drive" on the meet page. Not offered when the leader has a block with you.
create function public.group_drive_for_event(p_event_id uuid)
returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.group_drive_caller();
  v_group uuid;
begin
  perform private.group_drive_sweep();
  if p_event_id is null or not (private.is_event_host(p_event_id, v_uid) or private.is_going(p_event_id, v_uid)) then return null; end if;
  select g.id into v_group
  from public.group_drives g
  where g.target_kind = 'event' and g.target_id = p_event_id::text
    and not private.blocked_between(v_uid, g.leader_id)
    and (select count(*) from public.group_drive_members m where m.group_id = g.id) < 30
  order by g.started_at desc
  limit 1;
  if v_group is null then return null; end if;
  return private.group_drive_summary(v_group) || jsonb_build_object(
    'joined', exists (select 1 from public.group_drive_members m where m.group_id = v_group and m.user_id = v_uid)
  );
end;
$$;

-- ===========================================================================
-- Access
-- ===========================================================================

revoke execute on function
  private.group_drive_sweep(),
  private.group_drive_drop(uuid),
  private.group_drive_summary(uuid),
  private.group_drive_caller()
from public, anon, authenticated;

revoke execute on function
  public.group_drive_start(text, text),
  public.group_drive_preview(text),
  public.group_drive_join(text),
  public.group_drive_leave(),
  public.group_drive_end(),
  public.group_drive_post_position(double precision, double precision, double precision, double precision),
  public.group_drive_read(),
  public.group_drive_for_event(uuid)
from public, anon;

grant execute on function
  public.group_drive_start(text, text),
  public.group_drive_preview(text),
  public.group_drive_join(text),
  public.group_drive_leave(),
  public.group_drive_end(),
  public.group_drive_post_position(double precision, double precision, double precision, double precision),
  public.group_drive_read(),
  public.group_drive_for_event(uuid)
to authenticated, service_role;

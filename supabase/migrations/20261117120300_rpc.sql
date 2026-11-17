-- Nightshift backend, part 4: the RPC functions the app calls.
--
-- Each one is security definer with an empty search_path, checks the caller
-- (auth.uid()) itself, and raises with the same readable sentence the phone
-- shows today (src/lib/*.ts), so the UI can show error.message as it is.
-- Called from the app as supabase.rpc('<name>', { p_...: ... }).

create function private.require_uid()
returns uuid
language plpgsql stable
set search_path = ''
as $$
declare
  v uuid := auth.uid();
begin
  if v is null then
    raise exception 'Sign in first.' using errcode = '28000';
  end if;
  return v;
end;
$$;

create function private.post_system_chat(p_event uuid, p_user uuid, p_text text)
returns void
language sql security definer
set search_path = ''
as $$
  insert into public.chat_messages (event_id, user_id, body, system) values (p_event, p_user, p_text, true)
$$;

-- ===========================================================================
-- Profile
-- ===========================================================================

-- First run and "Edit profile": handle, name, region and the rough home area.
-- The home is snapped to the ~1 km grid by a trigger before it is stored.
create function public.save_profile(
  p_handle text,
  p_name text,
  p_region text,
  p_home_lat double precision,
  p_home_lng double precision
)
returns public.profiles
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
  v_handle text := lower(regexp_replace(btrim(coalesce(p_handle, '')), '^@+', ''));
  v_name text := btrim(coalesce(p_name, ''));
  r public.profiles;
begin
  if char_length(v_handle) < 3 then raise exception 'Handles need at least 3 characters.'; end if;
  if char_length(v_handle) > 20 then raise exception 'Keep your handle to 20 characters or fewer.'; end if;
  if v_handle !~ '^[a-z0-9._]+$' then raise exception 'Use letters, numbers, dots and underscores only.'; end if;
  if exists (select 1 from public.profiles p where p.handle = v_handle and p.id <> v_uid) then
    raise exception 'Someone already has that handle.';
  end if;
  if v_name = '' then raise exception 'Add a display name.'; end if;
  if char_length(v_name) > 30 then raise exception 'Keep your name to 30 characters or fewer.'; end if;
  if p_region is null or p_region not in (
    'Midlands', 'North West', 'North East', 'Yorkshire', 'East', 'London',
    'South East', 'South West', 'Wales', 'Scotland', 'Northern Ireland'
  ) then
    raise exception 'Pick your region.';
  end if;
  if p_home_lat is null or p_home_lng is null then
    raise exception 'Set your rough home area: use your current location, search your town or postcode, or long-press the map.';
  end if;
  if not (p_home_lat between 49.8 and 61.0 and p_home_lng between -8.7 and 2.0) then
    raise exception 'Nightshift is UK only for now. Pick a home area in the UK.';
  end if;

  insert into public.profiles (id) values (v_uid) on conflict (id) do nothing;
  insert into public.profile_homes (user_id, home)
    values (v_uid, private.pt(p_home_lat, p_home_lng))
    on conflict (user_id) do update set home = excluded.home;
  update public.profiles
    set handle = v_handle, display_name = v_name, region = p_region,
        onboarded = true, onboarded_at = coalesce(onboarded_at, now())
    where id = v_uid
    returning * into r;
  return r;
end;
$$;

-- ===========================================================================
-- Events: create, edit, cancel
-- ===========================================================================

-- Create (p_event->>'id' null) or edit an event with its stops, in one go.
-- p_event: { id?, type, title, description?, starts_at, ends_at?, reveal_minutes_before,
--            area: {lat, lng}, area_radius_miles, area_name, crew_id?, route_miles?,
--            filter: { everyone, cars, bikes, classes: [], min_mods, brands: [], radius_miles } }
-- p_stops: [{ id?, name, lat, lng, note? }] in order. Every stop needs a place.
-- p_cohost_ids: named co-hosts besides you (null on edit keeps the current ones).
-- Returns { id, warnings: [ban-zone warnings] }.
create function public.save_event(p_event jsonb, p_stops jsonb, p_cohost_ids uuid[] default null)
returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
  v_id uuid := nullif(p_event->>'id', '')::uuid;
  v_is_new boolean := nullif(p_event->>'id', '') is null;
  v_old public.events;
  v_type public.event_type := (p_event->>'type')::public.event_type;
  v_crew uuid := nullif(p_event->>'crew_id', '')::uuid;
  v_filter jsonb := coalesce(p_event->'filter', '{}'::jsonb);
  v_starts timestamptz := (p_event->>'starts_at')::timestamptz;
  v_stop jsonb;
  v_pos int := 0;
  v_keep uuid[] := '{}';
  v_stop_id uuid;
  v_name text;
  v_loc extensions.geography;
  v_zone public.ban_zones;
  v_warnings text[] := '{}';
  v_problem text;
begin
  if p_stops is null or jsonb_typeof(p_stops) <> 'array' or jsonb_array_length(p_stops) = 0 then
    raise exception 'Place at least one stop.';
  end if;
  if jsonb_array_length(p_stops) > 12 then raise exception 'Keep it to 12 stops or fewer.'; end if;
  if v_starts is null then raise exception 'Pick a start time.'; end if;

  if v_is_new then
    if v_starts <= now() then raise exception 'Pick a start time in the future.'; end if;
  else
    select * into v_old from public.events where id = v_id for update;
    if not found then raise exception 'Event not found.'; end if;
    if not private.is_event_host(v_id, v_uid) then raise exception 'Only hosts can edit this event.'; end if;
    -- canEditEvent()
    if v_old.cancelled_at is not null then raise exception 'This event was cancelled.'; end if;
    if now() >= v_old.starts_at then
      if v_old.type = 'rolling' then
        raise exception 'It has started. Use Change the plan to edit stops.';
      end if;
      raise exception 'It has started, so it can''t be edited.';
    end if;
    if exists (select 1 from public.check_ins c where c.event_id = v_id) then
      raise exception 'People have already checked in, so it can''t be edited.';
    end if;
  end if;

  -- Crew events: only the crew's owner and hosts run them.
  if v_crew is not null
     and (v_is_new or v_crew is distinct from v_old.crew_id)
     and not exists (
       select 1 from public.crew_members m
       where m.crew_id = v_crew and m.user_id = v_uid and m.role in ('owner', 'host')
     ) then
    raise exception 'Only the crew''s owner and hosts can run crew events.';
  end if;

  if v_is_new then
    insert into public.events (
      type, title, description, starts_at, ends_at, reveal_minutes_before,
      area, area_radius_miles, area_name, crew_id, route_miles,
      invite_everyone, invite_cars, invite_bikes, invite_classes, invite_min_mods, invite_brands, invite_radius_miles,
      created_by
    ) values (
      v_type, btrim(p_event->>'title'), nullif(btrim(p_event->>'description'), ''), v_starts,
      (p_event->>'ends_at')::timestamptz, coalesce((p_event->>'reveal_minutes_before')::int, 60),
      private.pt((p_event->'area'->>'lat')::float8, (p_event->'area'->>'lng')::float8),
      (p_event->>'area_radius_miles')::numeric, btrim(p_event->>'area_name'), v_crew,
      (p_event->>'route_miles')::numeric,
      coalesce((v_filter->>'everyone')::boolean, false),
      coalesce((v_filter->>'cars')::boolean, true),
      coalesce((v_filter->>'bikes')::boolean, true),
      array(select x::public.class_letter from jsonb_array_elements_text(coalesce(v_filter->'classes', '[]'::jsonb)) as x),
      coalesce((v_filter->>'min_mods')::int, 3),
      array(select btrim(x) from jsonb_array_elements_text(coalesce(v_filter->'brands', '[]'::jsonb)) as x),
      coalesce((v_filter->>'radius_miles')::numeric, 25),
      v_uid
    ) returning id into v_id;
    insert into public.event_hosts (event_id, user_id) values (v_id, v_uid);
  else
    update public.events set
      type = v_type,
      title = btrim(p_event->>'title'),
      description = nullif(btrim(p_event->>'description'), ''),
      starts_at = v_starts,
      ends_at = (p_event->>'ends_at')::timestamptz,
      reveal_minutes_before = coalesce((p_event->>'reveal_minutes_before')::int, 60),
      area = private.pt((p_event->'area'->>'lat')::float8, (p_event->'area'->>'lng')::float8),
      area_radius_miles = (p_event->>'area_radius_miles')::numeric,
      area_name = btrim(p_event->>'area_name'),
      crew_id = v_crew,
      route_miles = (p_event->>'route_miles')::numeric,
      invite_everyone = coalesce((v_filter->>'everyone')::boolean, false),
      invite_cars = coalesce((v_filter->>'cars')::boolean, true),
      invite_bikes = coalesce((v_filter->>'bikes')::boolean, true),
      invite_classes = array(select x::public.class_letter from jsonb_array_elements_text(coalesce(v_filter->'classes', '[]'::jsonb)) as x),
      invite_min_mods = coalesce((v_filter->>'min_mods')::int, 3),
      invite_brands = array(select btrim(x) from jsonb_array_elements_text(coalesce(v_filter->'brands', '[]'::jsonb)) as x),
      invite_radius_miles = coalesce((v_filter->>'radius_miles')::numeric, 25),
      current_stop = least(current_stop, greatest(0, jsonb_array_length(p_stops) - 1))
    where id = v_id;
  end if;

  -- Stops, in order. Existing stops keep their id (stopsFromDraft()).
  for v_stop in select value from jsonb_array_elements(p_stops) loop
    if (v_stop->>'lat') is null or (v_stop->>'lng') is null then
      raise exception 'Every stop needs a place.';
    end if;
    v_name := coalesce(nullif(btrim(v_stop->>'name'), ''), 'Stop ' || (v_pos + 1));
    v_loc := private.pt((v_stop->>'lat')::float8, (v_stop->>'lng')::float8);
    v_stop_id := nullif(v_stop->>'id', '')::uuid;
    if v_stop_id is not null and not v_is_new
       and exists (select 1 from public.event_stops s where s.id = v_stop_id and s.event_id = v_id) then
      update public.event_stops
        set position = v_pos, name = v_name, location = v_loc, note = nullif(btrim(v_stop->>'note'), '')
        where id = v_stop_id;
    else
      insert into public.event_stops (event_id, position, name, location, note)
        values (v_id, v_pos, v_name, v_loc, nullif(btrim(v_stop->>'note'), ''))
        returning id into v_stop_id;
    end if;
    v_keep := v_keep || v_stop_id;
    v_zone := private.ban_zone_at(v_loc);
    if v_zone.id is not null then
      v_warnings := v_warnings || private.ban_zone_warning(v_name, v_zone);
    end if;
    -- The audit trail of every stop placed (legal.md section 1, recommendation 2).
    insert into public.plan_changes (event_id, by_user, kind, text, stop_id, stop_name, location, ban_zone)
      values (v_id, v_uid, case when v_is_new then 'created' else 'edited' end,
              format('Stop %s: %s.', v_pos + 1, v_name), v_stop_id, v_name, v_loc, v_zone.name);
    v_pos := v_pos + 1;
  end loop;
  delete from public.event_stops s where s.event_id = v_id and s.id <> all (v_keep);

  if p_cohost_ids is not null then
    delete from public.event_hosts h
      where h.event_id = v_id and h.user_id <> v_uid
        and h.user_id is distinct from (select e.created_by from public.events e where e.id = v_id)
        and h.user_id <> all (p_cohost_ids);
    insert into public.event_hosts (event_id, user_id)
      select v_id, u from unnest(p_cohost_ids) as u
      on conflict do nothing;
  end if;

  v_problem := private.area_problem(v_id);
  if v_problem is not null then raise exception '%', v_problem; end if;

  if not v_is_new then
    perform private.post_system_chat(v_id, v_uid, 'Hosts updated the event details');
  end if;

  return jsonb_build_object('id', v_id, 'warnings', to_jsonb(v_warnings));
end;
$$;

create function public.cancel_event(p_event_id uuid)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
  e public.events;
begin
  select * into e from public.events where id = p_event_id for update;
  if not found then raise exception 'Event not found.'; end if;
  if not private.is_event_host(e.id, v_uid) then raise exception 'Only hosts can cancel this event.'; end if;
  if e.cancelled_at is not null then return; end if;
  update public.events set cancelled_at = now() where id = e.id;
  insert into public.plan_changes (event_id, by_user, kind, text) values (e.id, v_uid, 'cancelled', 'Cancelled the event.');
  perform private.post_system_chat(e.id, v_uid, 'Hosts cancelled the event');
end;
$$;

-- ===========================================================================
-- Going and requests (rsvp(), dropOut(), answerRequest() in events.ts)
-- ===========================================================================

-- p_going true: people the invite covers (or anyone, for public events) go
-- straight in; anyone else adds a request a host must answer.
-- p_going false: drop out, or withdraw a pending request.
-- Returns 'going', 'requested' or 'none'.
create function public.set_going(p_event_id uuid, p_going boolean)
returns text
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
  e public.events;
  v_role text;
begin
  select * into e from public.events where id = p_event_id;
  if not found then raise exception 'Event not found.'; end if;

  if not p_going then
    delete from public.event_going where event_id = e.id and user_id = v_uid;
    delete from public.event_requests where event_id = e.id and user_id = v_uid and status = 'pending';
    return 'none';
  end if;

  if e.cancelled_at is not null then raise exception 'This event was cancelled.'; end if;
  if now() >= private.event_end(e.starts_at, e.ends_at) then raise exception 'This event has finished.'; end if;

  v_role := private.event_role(e.id, v_uid);
  if v_role in ('host', 'going', 'invited', 'public') then
    insert into public.event_going (event_id, user_id) values (e.id, v_uid) on conflict do nothing;
    delete from public.event_requests where event_id = e.id and user_id = v_uid and status = 'pending';
    return 'going';
  end if;
  if v_role = 'declined' then raise exception 'A host has already said no to this one.'; end if;

  insert into public.event_requests (event_id, user_id) values (e.id, v_uid)
    on conflict (event_id, user_id) do update
      set status = 'pending', created_at = now(), answered_at = null, answered_by = null
      where public.event_requests.status = 'approved';
  return 'requested';
end;
$$;

create function public.answer_request(p_event_id uuid, p_user_id uuid, p_approve boolean)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
begin
  if not private.is_event_host(p_event_id, v_uid) then raise exception 'Only hosts can answer requests.'; end if;
  update public.event_requests
    set status = case when p_approve then 'approved'::public.request_status else 'declined'::public.request_status end,
        answered_at = now(), answered_by = v_uid
    where event_id = p_event_id and user_id = p_user_id and status = 'pending';
  if not found then raise exception 'That request has gone.'; end if;
  if p_approve then
    insert into public.event_going (event_id, user_id) values (p_event_id, p_user_id) on conflict do nothing;
  end if;
end;
$$;

-- ===========================================================================
-- Seeing stops
-- ===========================================================================

-- Stops of these events as the caller may see them. Locked stops come back
-- with name, lat, lng and note null and visible = false (the app labels them
-- "Stop n"). Only hosts, people going and public events get rows at all.
create function public.get_event_stops(p_event_ids uuid[])
returns table (
  id uuid,
  event_id uuid,
  "position" int,
  name text,
  lat double precision,
  lng double precision,
  note text,
  revealed_at timestamptz,
  visible boolean
)
language sql stable security definer
set search_path = ''
as $$
  select
    s.id,
    s.event_id,
    s.position,
    case when v.ok then s.name end,
    case when v.ok then extensions.st_y(s.location::extensions.geometry) end,
    case when v.ok then extensions.st_x(s.location::extensions.geometry) end,
    case when v.ok then s.note end,
    s.revealed_at,
    v.ok
  from public.event_stops s
  join public.events e on e.id = s.event_id
  cross join lateral (select private.can_see_stop(s.id, auth.uid()) as ok) v
  where s.event_id = any (p_event_ids)
    and (
      v.ok
      or private.is_public_type(e.type)
      or private.is_event_host(e.id, auth.uid())
      or private.is_going(e.id, auth.uid())
    )
  order by s.event_id, s.position
$$;

-- viewEvents(): every event this person has a role in (not 'none'), with the
-- phase and the furthest stop they may see up to the active one (-1: area only).
-- Finished events drop off after p_past_days.
create function public.events_for_me(p_past_days int default 7)
returns table (event_id uuid, role text, phase text, shown_stop int)
language sql stable security definer
set search_path = ''
as $$
  select e.id, r.role, p.phase, coalesce(st.shown, -1)
  from public.events e
  cross join lateral (select private.event_role(e.id, auth.uid()) as role) r
  cross join lateral (
    select case
      when e.cancelled_at is not null then 'cancelled'
      when now() >= private.event_end(e.starts_at, e.ends_at) then 'over'
      when now() >= e.starts_at then 'live'
      when now() >= e.starts_at - make_interval(mins => e.reveal_minutes_before) then 'revealed'
      else 'upcoming'
    end as phase
  ) p
  cross join lateral (
    select max(s.position) as shown
    from public.event_stops s
    where s.event_id = e.id
      and s.position <= case when e.type = 'rolling' then e.current_stop else 0 end
      and private.can_see_stop(s.id, auth.uid())
  ) st
  where private.event_end(e.starts_at, e.ends_at) > now() - make_interval(days => greatest(p_past_days, 0))
    and r.role <> 'none'
  order by e.starts_at
$$;

create function public.event_role(p_event_id uuid)
returns text
language sql stable security definer
set search_path = ''
as $$ select private.event_role(p_event_id, auth.uid()) $$;

-- The host form's live count of who an invite would reach. Never returns who.
-- Counts of 1 or 2 come back null ("fewer than 3"), so a narrow filter can't
-- be used to find out where one person lives.
create function public.invite_count(p_filter jsonb, p_area_lat double precision, p_area_lng double precision)
returns jsonb
language plpgsql stable security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
  v_everyone boolean := coalesce((p_filter->>'everyone')::boolean, false);
  v_radius numeric := coalesce((p_filter->>'radius_miles')::numeric, 25);
  v_classes public.class_letter[] := array(select x::public.class_letter from jsonb_array_elements_text(coalesce(p_filter->'classes', '[]'::jsonb)) as x);
  v_brands text[] := array(select btrim(x) from jsonb_array_elements_text(coalesce(p_filter->'brands', '[]'::jsonb)) as x);
  v_people int;
  v_builds int;
begin
  if v_radius < 10 then raise exception 'Invite radius must be at least 10 miles.'; end if;
  with near as (
    select h.user_id
    from public.profile_homes h
    where h.user_id <> v_uid
      and extensions.st_dwithin(h.home, private.pt(p_area_lat, p_area_lng), private.mi(v_radius::double precision))
  ), matching as (
    select b.id, b.owner_id
    from public.builds b
    join near on near.user_id = b.owner_id
    where private.build_matches(b.id, v_everyone, coalesce((p_filter->>'cars')::boolean, true),
                                coalesce((p_filter->>'bikes')::boolean, true), v_classes,
                                coalesce((p_filter->>'min_mods')::int, 3), v_brands)
  )
  select
    case when v_everyone then (select count(*) from near) else (select count(distinct owner_id) from matching) end,
    (select count(*) from matching)
  into v_people, v_builds;
  return jsonb_build_object(
    'people', case when v_people between 1 and 2 then null else v_people end,
    'builds', case when v_builds between 1 and 2 then null else v_builds end
  );
end;
$$;

-- ===========================================================================
-- On the night: check in, move on, change the plan
-- ===========================================================================

-- canCheckIn() + checkIn(). The position is the phone's GPS fix: it is only
-- compared with the stop (within 0.5 mi) and never stored. The server can't
-- prove the fix is real; see docs/BACKEND.md "Limits".
create function public.check_in(p_event_id uuid, p_position int, p_lat double precision, p_lng double precision)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
  e public.events;
  s public.event_stops;
begin
  select * into e from public.events where id = p_event_id;
  if not found then raise exception 'Event not found.'; end if;
  if e.cancelled_at is not null then raise exception 'This event was cancelled.'; end if;
  if now() >= private.event_end(e.starts_at, e.ends_at) then raise exception 'This event has finished.'; end if;
  if now() < e.starts_at - interval '30 minutes' then raise exception 'Check-in opens 30 minutes before the start.'; end if;
  if not private.is_going(e.id, v_uid) and not private.is_event_host(e.id, v_uid) then
    raise exception 'Tap Going first, then check in.';
  end if;
  select * into s from public.event_stops where event_id = e.id and position = p_position;
  if not found then raise exception 'That stop no longer exists.'; end if;
  if not private.can_see_stop(s.id, v_uid) then raise exception 'You can''t see this stop yet.'; end if;
  if e.type = 'rolling' and p_position <> e.current_stop then
    raise exception 'The meet has moved on. Check in at the current stop.';
  end if;
  if p_lat is null or p_lng is null then
    raise exception 'Turn on location so the app can see you are at the stop.';
  end if;
  if not extensions.st_dwithin(s.location, private.pt(p_lat, p_lng), private.mi(0.5)) then
    raise exception 'You need to be within 0.5 mi of %.', s.name;
  end if;
  insert into public.check_ins (event_id, user_id, stop_id) values (e.id, v_uid, s.id) on conflict do nothing;
end;
$$;

-- moveOn() + moveOnAudience(). Reveals the next planned stop, logs it, queues
-- a "moved on" notice for everyone checked in at the stop being left (the push
-- function sends these in Phase 2) and returns those user ids.
create function public.move_on(p_event_id uuid)
returns setof uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
  e public.events;
  v_from public.event_stops;
  v_next public.event_stops;
begin
  select * into e from public.events where id = p_event_id for update;
  if not found then raise exception 'Event not found.'; end if;
  if not private.is_event_host(e.id, v_uid) then raise exception 'Only hosts can move the meet on.'; end if;
  if e.type <> 'rolling' then raise exception 'Only rolling meets move on.'; end if;
  if e.cancelled_at is not null then raise exception 'This event was cancelled.'; end if;
  if now() >= private.event_end(e.starts_at, e.ends_at) then raise exception 'This event has finished.'; end if;
  if now() < e.starts_at then raise exception 'The meet hasn''t started yet.'; end if;

  select * into v_from from public.event_stops where event_id = e.id and position = e.current_stop;
  select * into v_next from public.event_stops where event_id = e.id and position = e.current_stop + 1;
  if v_next.id is null then raise exception 'This is the last planned stop.'; end if;

  update public.event_stops set revealed_at = now() where id = v_next.id;
  update public.events set current_stop = v_next.position where id = e.id;
  insert into public.plan_changes (event_id, by_user, kind, text, stop_id, stop_name, location)
    values (e.id, v_uid, 'move_on', format('Moved on to stop %s, %s.', v_next.position + 1, v_next.name),
            v_next.id, v_next.name, v_next.location);

  -- movedOnReminder(): never names the new place.
  insert into public.notices (user_id, event_id, kind, key, title, body, url)
    select c.user_id, e.id, 'moved',
           format('ns.%s.moved.%s', e.id, v_next.position),
           e.title || ' moved on',
           format('Stop %s is unlocked. Open Nightshift to see where.', v_next.position + 1),
           '/event/' || e.id
    from public.check_ins c
    where c.stop_id = v_from.id
    on conflict (user_id, key) where key is not null do nothing;

  return query select c.user_id from public.check_ins c where c.stop_id = v_from.id;
end;
$$;

-- applyPlanChange(): hosts change a rolling meet's stops on the night.
-- p_kind: 'rename' (p_stop_id, p_name) | 'move' (p_stop_id, p_lat, p_lng)
--       | 'remove' (p_stop_id) | 'add' (p_name, p_lat, p_lng).
-- For 'add' and 'move' the phone sends the rough area worked out again with
-- area.ts (p_area_*); the server checks it still holds every stop and doesn't
-- sit on one. Returns { warning } (a ban-zone warning, or null).
create function public.change_plan(
  p_event_id uuid,
  p_kind text,
  p_stop_id uuid default null,
  p_name text default null,
  p_lat double precision default null,
  p_lng double precision default null,
  p_area_lat double precision default null,
  p_area_lng double precision default null,
  p_area_radius_miles numeric default null
)
returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
  e public.events;
  s public.event_stops;
  v_name text;
  v_text text;
  v_loc extensions.geography;
  v_zone public.ban_zones;
  v_warning text;
  v_pos int;
  v_miles double precision;
  v_problem text;
begin
  select * into e from public.events where id = p_event_id for update;
  if not found then raise exception 'Event not found.'; end if;
  if not private.is_event_host(e.id, v_uid) then raise exception 'Only hosts can change the plan.'; end if;
  -- canChangePlan()
  if e.type <> 'rolling' then raise exception 'Only rolling meets can change stops on the night.'; end if;
  if e.cancelled_at is not null then raise exception 'This event was cancelled.'; end if;
  if now() >= private.event_end(e.starts_at, e.ends_at) then raise exception 'This event has finished.'; end if;

  if p_kind in ('add', 'move') and (p_lat is null or p_lng is null) then
    raise exception 'Pick a place on the map.';
  end if;

  if p_kind = 'add' then
    select coalesce(max(position), -1) + 1 into v_pos from public.event_stops where event_id = e.id;
    if v_pos >= 12 then raise exception 'Keep it to 12 stops or fewer.'; end if;
    v_name := coalesce(nullif(btrim(p_name), ''), 'Stop ' || (v_pos + 1));
    v_loc := private.pt(p_lat, p_lng);
    insert into public.event_stops (event_id, position, name, location)
      values (e.id, v_pos, v_name, v_loc) returning * into s;
    v_zone := private.ban_zone_at(v_loc);
    v_text := format('Added %s as stop %s.', v_name, v_pos + 1);
  else
    select * into s from public.event_stops where id = p_stop_id and event_id = e.id;
    if not found then raise exception 'That stop no longer exists.'; end if;
    v_loc := s.location;
    if p_kind = 'rename' then
      v_name := btrim(coalesce(p_name, ''));
      if v_name = '' then raise exception 'Give the stop a name.'; end if;
      if v_name = s.name then raise exception 'That''s the same name.'; end if;
      update public.event_stops set name = v_name where id = s.id;
      v_text := format('Renamed stop %s from %s to %s.', s.position + 1, s.name, v_name);
    elsif p_kind = 'move' then
      -- canMoveStop()
      if s.position < e.current_stop then raise exception 'The meet has already left this stop.'; end if;
      if exists (select 1 from public.check_ins c where c.stop_id = s.id) then
        raise exception 'People have checked in here, so it can''t be moved.';
      end if;
      v_loc := private.pt(p_lat, p_lng);
      v_miles := extensions.st_distance(s.location, v_loc) / 1609.344;
      update public.event_stops set location = v_loc where id = s.id;
      v_zone := private.ban_zone_at(v_loc);
      v_name := s.name;
      v_text := format('Moved stop %s, %s%s.', s.position + 1, s.name,
                       case when v_miles >= 0.1 then format(', by %s mi', to_char(v_miles, 'FM9990.0')) else '' end);
    elsif p_kind = 'remove' then
      -- canRemoveStop()
      if s.position <= e.current_stop then
        raise exception 'You can only remove stops the meet hasn''t reached. Move this one instead.';
      end if;
      delete from public.event_stops where id = s.id;
      update public.event_stops set position = position - 1 where event_id = e.id and position > s.position;
      v_text := format('Removed stop %s, %s.', s.position + 1, s.name);
    else
      raise exception 'Unknown change.';
    end if;
  end if;

  if p_area_lat is not null and p_area_lng is not null then
    update public.events
      set area = private.pt(p_area_lat, p_area_lng),
          area_radius_miles = coalesce(p_area_radius_miles, area_radius_miles)
      where id = e.id;
  end if;
  v_problem := private.area_problem(e.id);
  if v_problem is not null then raise exception '%', v_problem; end if;

  if v_zone.id is not null then
    v_warning := private.ban_zone_warning(coalesce(v_name, s.name), v_zone);
  end if;
  insert into public.plan_changes (event_id, by_user, kind, text, stop_id, stop_name, location, ban_zone)
    values (e.id, v_uid, p_kind, v_text, s.id, coalesce(v_name, s.name), v_loc, v_zone.name);
  -- planChangedMessage(): the chat line never says where.
  perform private.post_system_chat(e.id, v_uid, 'Hosts changed the plan');
  return jsonb_build_object('warning', v_warning);
end;
$$;

-- ===========================================================================
-- Votes and awards (src/lib/awards.ts)
-- ===========================================================================

-- castVote(): checked-in attendees only, from the start until 24 h after the
-- end, never for your own build, and only builds that can win the category.
-- A new vote in the same category replaces the old one.
create function public.cast_vote(p_event_id uuid, p_category text, p_build_id uuid)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
  e public.events;
  b public.builds;
begin
  select * into e from public.events where id = p_event_id;
  if not found then raise exception 'Event not found.'; end if;
  -- canVote()
  if e.cancelled_at is not null then raise exception 'This event was cancelled.'; end if;
  if now() < e.starts_at then raise exception 'Voting opens when the event starts.'; end if;
  if now() >= private.event_end(e.starts_at, e.ends_at) + interval '24 hours' then raise exception 'Voting has closed.'; end if;
  if not private.has_checked_in(e.id, v_uid) then raise exception 'Check in at the event to vote.'; end if;
  if p_category !~ '^(best-in-show|best-car|best-bike|class-[SABCD]|stance|sound|paint|cleanest|newcomer)$' then
    raise exception 'Unknown award.';
  end if;
  -- eligibleFor(): builds owned by someone who checked in, of the right kind or class.
  select * into b from public.builds where id = p_build_id;
  if not found
     or not private.has_checked_in(e.id, b.owner_id)
     or (p_category = 'best-car' and b.kind <> 'car')
     or (p_category = 'best-bike' and b.kind <> 'bike')
     or (p_category like 'class-%' and private.build_class(b.id)::text <> substr(p_category, 7)) then
    raise exception 'That build can''t win this award.';
  end if;
  if b.owner_id = v_uid then raise exception 'You can''t vote for your own build.'; end if;

  insert into public.votes (event_id, voter_id, category, build_id)
    values (e.id, v_uid, p_category, b.id)
    on conflict (event_id, voter_id, category)
    do update set build_id = excluded.build_id, created_at = now();
end;
$$;

-- results(): the awards for one event, once voting has closed (empty before).
-- categoriesFor() decides which awards the event has; a category needs 3+
-- votes; ties go to the build that reached the top count first.
-- Security definer because votes are secret, but only totals come out.
create function public.event_awards(p_event_id uuid)
returns table (category text, build_id uuid, owner_id uuid, votes int, awarded_at timestamptz)
language sql stable security definer
set search_path = ''
as $$
  with e as (
    select ev.id, private.event_end(ev.starts_at, ev.ends_at) + interval '24 hours' as closes
    from public.events ev
    where ev.id = p_event_id
      and ev.cancelled_at is null
      and now() >= private.event_end(ev.starts_at, ev.ends_at) + interval '24 hours'
  ),
  att as (
    select distinct c.user_id from public.check_ins c join e on e.id = c.event_id
  ),
  cands as (
    select b.id, b.kind, private.build_class(b.id)::text as cls
    from public.builds b join att on att.user_id = b.owner_id
  ),
  counts as (
    select
      count(*) filter (where kind = 'car') as cars,
      count(*) filter (where kind = 'bike') as bikes,
      (select count(*) from att) as people
    from cands
  ),
  cats as (
    select 'best-in-show'::text as c
    union all select 'best-car' from counts where cars >= 2 and bikes >= 1
    union all select 'best-bike' from counts where bikes >= 2 and cars >= 1
    union all
      select 'class-' || cands.cls from cands, counts
      where counts.people >= 12
      group by cands.cls having count(*) >= 2
    union all select unnest(array['stance', 'sound', 'paint', 'cleanest', 'newcomer'])
  ),
  ranked as (
    select
      v.category,
      v.build_id,
      v.created_at,
      count(*) over (partition by v.category, v.build_id order by v.created_at, v.voter_id rows unbounded preceding) as n,
      count(*) over (partition by v.category) as total
    from public.votes v
    join e on e.id = v.event_id
    where v.category in (select c from cats)
  ),
  best as (
    select distinct on (r.category) r.category, r.build_id, r.n
    from ranked r
    where r.total >= 3
    order by r.category, r.n desc, r.created_at asc
  )
  select best.category, best.build_id, b.owner_id, best.n::int, e.closes
  from best
  join public.builds b on b.id = best.build_id
  cross join e
$$;

-- Every trophy handed out so far (allAwards()).
create view public.awards with (security_invoker = true) as
  select ev.id as event_id, a.category, a.build_id, a.owner_id, a.votes, a.awarded_at
  from public.events ev
  cross join lateral public.event_awards(ev.id) a
  where ev.cancelled_at is null
    and private.event_end(ev.starts_at, ev.ends_at) + interval '24 hours' <= now();

-- ===========================================================================
-- Drives and photo spots (src/lib/spots.ts)
-- ===========================================================================

-- makeSpot(): suggest a drive (points in order) or a photo spot (one point).
-- p_points: [{lat, lng}, ...]. Starts pending; staff approve it.
-- Returns { id, warning } (a ban-zone warning, or null).
create function public.suggest_spot(p_kind public.spot_kind, p_name text, p_description text, p_points jsonb)
returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
  v_name text := btrim(coalesce(p_name, ''));
  v_n int := coalesce(jsonb_array_length(p_points), 0);
  v_pts extensions.geography[];
  v_line extensions.geography;
  v_miles double precision;
  v_gap double precision;
  v_zone public.ban_zones;
  v_id uuid;
  i int;
begin
  if p_kind not in ('drive', 'photo') then raise exception 'You can suggest drives and photo spots.'; end if;
  if char_length(v_name) < 3 then raise exception 'Give it a name of at least 3 characters.'; end if;
  if char_length(v_name) > 40 then raise exception 'Keep the name to 40 characters or fewer.'; end if;
  if exists (select 1 from public.spots s where lower(s.name) = lower(v_name)) then
    raise exception 'There is already a place with that name.';
  end if;

  v_pts := array(
    select private.pt((p->>'lat')::float8, (p->>'lng')::float8)
    from jsonb_array_elements(coalesce(p_points, '[]'::jsonb)) with ordinality as t(p, ord)
    order by ord
  );

  if p_kind = 'photo' then
    if v_n <> 1 then raise exception 'Long-press the map to place the spot.'; end if;
  else
    if v_n < 2 then raise exception 'Long-press the map to add at least a start and a finish.'; end if;
    if v_n > 200 then raise exception 'That drive has too many points.'; end if;
    v_line := extensions.st_makeline(array(select g::extensions.geometry from unnest(v_pts) as g))::extensions.geography;
    v_miles := extensions.st_length(v_line) / 1609.344;
    if v_miles < 1 then raise exception 'A drive needs to be at least 1 mile long.'; end if;
    if v_miles > 80 then raise exception 'Keep drives under 80 miles.'; end if;
    for i in 1 .. v_n - 1 loop
      v_gap := extensions.st_distance(v_pts[i], v_pts[i + 1]) / 1609.344;
      if v_gap > 1.5 then
        raise exception 'Points % and % are % mi apart. Add points along the road at least every 1.5 mi, so the drive follows the road and can be checked fairly.',
          i, i + 1, to_char(v_gap, 'FM9990.0');
      end if;
    end loop;
  end if;

  for i in 1 .. v_n loop
    v_zone := private.ban_zone_at(v_pts[i]);
    exit when v_zone.id is not null;
  end loop;

  insert into public.spots (kind, name, description, location, path, miles, author_id, status, ban_zone)
  values (
    p_kind,
    v_name,
    coalesce(nullif(btrim(p_description), ''),
             case when p_kind = 'drive' then 'A drive suggested by the community. Never timed.'
                  else 'A photo spot suggested by the community.' end),
    case when p_kind = 'drive' then v_pts[(v_n / 2) + 1] else v_pts[1] end,
    v_line,
    case when p_kind = 'drive' then round(v_miles::numeric, 1) end,
    v_uid,
    'pending',
    v_zone.name
  ) returning id into v_id;

  return jsonb_build_object(
    'id', v_id,
    'warning', case when v_zone.id is not null then private.ban_zone_warning(v_name, v_zone) end
  );
end;
$$;

-- judgeRun() on the server. p_fixes holds one GPS fix per checkpoint, in
-- order: [{lat, lng, t}] with t in epoch milliseconds. They are checked and
-- thrown away: only the day of a pass is stored, and the answer is only ever
-- { ok: true } or { ok: false, reason } with no time or speed in it.
create function public.complete_drive(p_spot_id uuid, p_fixes jsonb)
returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
  s public.spots;
  v_n int;
  v_fix jsonb;
  v_t bigint;
  v_prev bigint;
  v_first bigint;
  v_miles double precision;
  v_hours double precision;
  i int;
  c_order constant text := 'Pass every checkpoint in order to finish.';
begin
  select * into s from public.spots where id = p_spot_id;
  if not found or s.kind <> 'drive' or s.path is null then
    return jsonb_build_object('ok', false, 'reason', 'Drive not found.');
  end if;
  if s.status <> 'approved' then
    return jsonb_build_object('ok', false, 'reason', 'This place is waiting for approval.');
  end if;
  v_n := extensions.st_npoints(s.path::extensions.geometry);
  if v_n < 2 then return jsonb_build_object('ok', false, 'reason', 'This drive has no checkpoints.'); end if;
  if p_fixes is null or jsonb_typeof(p_fixes) <> 'array' or jsonb_array_length(p_fixes) < v_n then
    return jsonb_build_object('ok', false, 'reason', c_order);
  end if;

  for i in 1 .. v_n loop
    v_fix := p_fixes -> (i - 1);
    v_t := (v_fix->>'t')::bigint;
    if v_t is null or (v_fix->>'lat') is null or (v_fix->>'lng') is null
       or (v_prev is not null and v_t < v_prev)
       or not extensions.st_dwithin(
         private.pt((v_fix->>'lat')::float8, (v_fix->>'lng')::float8),
         extensions.st_pointn(s.path::extensions.geometry, i)::extensions.geography,
         private.mi(0.2)) then
      return jsonb_build_object('ok', false, 'reason', c_order);
    end if;
    if i = 1 then v_first := v_t; end if;
    v_prev := v_t;
  end loop;

  -- The run has to have just finished (no replaying an old one).
  if to_timestamp(v_prev / 1000.0) > now() + interval '5 minutes'
     or to_timestamp(v_prev / 1000.0) < now() - interval '1 hour' then
    return jsonb_build_object('ok', false, 'reason', 'That run is too old to count. Start again when you''re ready.');
  end if;

  -- driveMiles(): the drawn route, or the stated road length if longer.
  v_miles := greatest(coalesce(s.miles, 0)::double precision, extensions.st_length(s.path) / 1609.344);
  -- driveWindowMs(): half an hour plus 6 minutes a mile.
  if (v_prev - v_first) > (30 + v_miles * 6) * 60000 then
    return jsonb_build_object('ok', false, 'reason',
      'That took longer than a drive allows, so it doesn''t count. Start again when you''re ready.');
  end if;
  v_hours := (v_prev - v_first) / 3600000.0;
  if v_hours <= 0 or v_miles / v_hours > 45 then
    return jsonb_build_object('ok', false, 'reason',
      'That was quicker than these roads allow at the speed limits, so it doesn''t count. Drives are never about speed.');
  end if;

  insert into public.spot_completions (spot_id, user_id, completed_on)
    values (s.id, v_uid, (now() at time zone 'Europe/London')::date)
    on conflict on constraint spot_completions_once_a_day do nothing;
  return jsonb_build_object('ok', true);
end;
$$;

-- canVisit() + recordCompletion() for photo spots. p_photo_path is an object
-- the caller already uploaded to photos/{their id}/... (plate-pixelated on the phone).
create function public.visit_spot(
  p_spot_id uuid,
  p_lat double precision,
  p_lng double precision,
  p_photo_path text default null
)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
  s public.spots;
begin
  select * into s from public.spots where id = p_spot_id;
  if not found then raise exception 'Spot not found.'; end if;
  if s.kind = 'track' then raise exception 'Tracks are driven at track days.'; end if;
  if s.kind = 'venue' then raise exception 'Venues are for meets: check in at the event.'; end if;
  if s.kind <> 'photo' then raise exception 'Only photo spots take check-ins.'; end if;
  if s.status <> 'approved' then raise exception 'This spot is waiting for approval.'; end if;
  if p_lat is null or p_lng is null then raise exception 'Turn on location so the app can see you are at the spot.'; end if;
  if not extensions.st_dwithin(s.location, private.pt(p_lat, p_lng), private.mi(0.2)) then
    raise exception 'You need to be within 0.2 mi of %.', s.name;
  end if;
  if p_photo_path is not null and split_part(p_photo_path, '/', 1) <> v_uid::text then
    raise exception 'That photo isn''t yours.';
  end if;
  insert into public.spot_completions (spot_id, user_id, completed_on, photo_path)
    values (s.id, v_uid, (now() at time zone 'Europe/London')::date, p_photo_path)
    on conflict on constraint spot_completions_once_a_day
    do update set photo_path = coalesce(excluded.photo_path, public.spot_completions.photo_path);
end;
$$;

-- rateSpot(): only after finishing or visiting it, never your own suggestion.
create function public.rate_spot(p_spot_id uuid, p_stars numeric)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
  s public.spots;
  v_stars int := round(p_stars);
begin
  select * into s from public.spots where id = p_spot_id and status = 'approved';
  if not found then raise exception 'Place not found.'; end if;
  if s.author_id = v_uid then raise exception 'You can''t rate a place you suggested.'; end if;
  if not exists (select 1 from public.spot_completions c where c.spot_id = s.id and c.user_id = v_uid) then
    if s.kind = 'drive' then raise exception 'Finish the drive to rate it.'; end if;
    raise exception 'Visit the spot to rate it.';
  end if;
  if v_stars is null or v_stars < 1 or v_stars > 5 then raise exception 'Pick 1 to 5 stars.'; end if;
  insert into public.spot_ratings (spot_id, user_id, stars) values (s.id, v_uid, v_stars)
    on conflict (spot_id, user_id) do update set stars = excluded.stars, rated_at = now();
end;
$$;

-- Counts for the place pages and author rep (statsOf() / averageStars()):
-- people who completed it (each once) and the ratings that count (from people
-- who completed it, not the author). Never says who or when.
create function public.spot_stats(p_spot_ids uuid[])
returns table (spot_id uuid, people int, rating_average numeric, rating_count int, completed_by_me boolean)
language sql stable security definer
set search_path = ''
as $$
  select
    s.id,
    (select count(distinct c.user_id) from public.spot_completions c where c.spot_id = s.id)::int,
    (select round(avg(r.stars), 2) from public.spot_ratings r
      where r.spot_id = s.id and r.user_id is distinct from s.author_id
        and exists (select 1 from public.spot_completions c where c.spot_id = s.id and c.user_id = r.user_id)),
    (select count(*) from public.spot_ratings r
      where r.spot_id = s.id and r.user_id is distinct from s.author_id
        and exists (select 1 from public.spot_completions c where c.spot_id = s.id and c.user_id = r.user_id))::int,
    exists (select 1 from public.spot_completions c where c.spot_id = s.id and c.user_id = auth.uid())
  from public.spots s
  where s.id = any (p_spot_ids)
    and (s.status = 'approved' or s.author_id = auth.uid())
$$;

-- ===========================================================================
-- Crews (src/lib/crews.ts)
-- ===========================================================================

-- dropMember(): leave your crew; an owner who leaves hands over to a host,
-- else the longest-standing member.
create function private.leave_current_crew(p_user uuid)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  m public.crew_members;
  v_heir uuid;
begin
  delete from public.crew_members where user_id = p_user returning * into m;
  if m.crew_id is null or m.role <> 'owner' then return; end if;
  select cm.user_id into v_heir
    from public.crew_members cm
    where cm.crew_id = m.crew_id
    order by (cm.role = 'host') desc, cm.joined_at, cm.user_id
    limit 1;
  if v_heir is not null then
    update public.crew_members set role = 'owner' where crew_id = m.crew_id and user_id = v_heir;
  end if;
end;
$$;

create function public.create_crew(p_name text, p_tag text)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
  v_name text := btrim(coalesce(p_name, ''));
  v_tag text := upper(regexp_replace(btrim(coalesce(p_tag, '')), '[^a-zA-Z0-9]', '', 'g'));
  v_id uuid;
begin
  if char_length(v_name) < 3 then raise exception 'Crew names need at least 3 characters.'; end if;
  if char_length(v_name) > 30 then raise exception 'Keep the crew name to 30 characters or fewer.'; end if;
  if exists (select 1 from public.crews c where lower(c.name) = lower(v_name)) then
    raise exception 'There is already a crew with that name.';
  end if;
  if char_length(v_tag) < 2 or char_length(v_tag) > 4 then raise exception 'Tags are 2 to 4 letters or numbers.'; end if;
  if exists (select 1 from public.crews c where c.tag = v_tag) then raise exception 'Another crew has that tag.'; end if;

  perform private.leave_current_crew(v_uid);
  insert into public.crews (name, tag, created_by) values (v_name, v_tag, v_uid) returning id into v_id;
  insert into public.crew_members (crew_id, user_id, role) values (v_id, v_uid, 'owner');
  return v_id;
end;
$$;

-- Join as a plain member, leaving any other crew.
create function public.join_crew(p_crew_id uuid)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
begin
  if not exists (select 1 from public.crews c where c.id = p_crew_id) then
    raise exception 'That crew no longer exists.';
  end if;
  if exists (select 1 from public.crew_members m where m.crew_id = p_crew_id and m.user_id = v_uid) then
    return;
  end if;
  perform private.leave_current_crew(v_uid);
  insert into public.crew_members (crew_id, user_id, role) values (p_crew_id, v_uid, 'member');
end;
$$;

create function public.leave_crew()
returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  perform private.leave_current_crew(private.require_uid());
end;
$$;

-- setCrewHost(): the owner makes a member a host ('host') or takes it away ('member').
create function public.set_crew_role(p_crew_id uuid, p_user_id uuid, p_role public.crew_role)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
  m public.crew_members;
begin
  if not exists (select 1 from public.crews c where c.id = p_crew_id) then
    raise exception 'That crew no longer exists.';
  end if;
  if not exists (
    select 1 from public.crew_members o where o.crew_id = p_crew_id and o.user_id = v_uid and o.role = 'owner'
  ) then
    raise exception 'Only the crew owner can pick hosts.';
  end if;
  if p_role = 'owner' then raise exception 'Handing over the crew isn''t available yet.'; end if;
  select * into m from public.crew_members where crew_id = p_crew_id and user_id = p_user_id;
  if not found then raise exception 'They are not in this crew.'; end if;
  if m.role = 'owner' then raise exception 'The owner is always a host.'; end if;
  update public.crew_members set role = p_role where crew_id = p_crew_id and user_id = p_user_id;
end;
$$;

-- ===========================================================================
-- Notices
-- ===========================================================================

create function public.mark_notices_read()
returns void
language sql security definer
set search_path = ''
as $$
  update public.notices set read_at = now() where user_id = auth.uid() and read_at is null
$$;

-- ===========================================================================
-- Execute rights: signed-in users only. Supabase grants EXECUTE to PUBLIC by
-- default, which would include `anon`.
-- ===========================================================================

revoke execute on all functions in schema public from public, anon;
grant execute on all functions in schema public to authenticated, service_role;
revoke execute on all functions in schema private from public, anon;
grant execute on all functions in schema private to authenticated, service_role;

grant select on public.awards to authenticated;

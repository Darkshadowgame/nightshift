-- REVIEW-7 (docs/REVIEW-7-first-user.md): late joiners, plain words, no minimum mods by default.
--
-- 1. Rolling meets: anyone GOING to a live rolling meet can see the meet point it is
--    at NOW (position = current_stop), so someone who joins late can find it and
--    check in. Meet points ahead of it stay hidden. One it has left stays visible to
--    the people who were there. The "moved on" notice still goes only to people
--    checked in at the meet point being left. Same rule as canSeeStop() in
--    src/lib/events.ts; check_in(), get_event_stops() and events_for_me() all go through it.
-- 2. Words: "meet point" and "location shown", never "stop" or "unlocked", in
--    reminders, notices, check-in refusals and the hosts' plan log
--    (src/lib/glossary.ts, src/lib/reminders.ts).
-- 3. Invites: no minimum mods unless the host sets one (column default and the
--    save_event()/invite_count() fallbacks go from 3 to 0, as DEFAULT_FILTER).
--
-- Function bodies are otherwise copied unchanged from their latest migration.

-- ===========================================================================
-- 1. THE meet point visibility rule (was 20261117120200_rls.sql)
-- ===========================================================================

create or replace function private.can_see_stop(p_stop uuid, p_user uuid)
returns boolean
language plpgsql stable security definer
set search_path = ''
as $$
declare
  s public.event_stops;
  e public.events;
begin
  select * into s from public.event_stops where id = p_stop;
  if not found then return false; end if;
  select * into e from public.events where id = s.event_id;
  if private.is_event_host(e.id, p_user) then return true; end if;
  if private.is_public_type(e.type) then return true; end if;
  if e.cancelled_at is not null then return false; end if;
  if p_user is null or not private.is_going(e.id, p_user) then return false; end if;
  if now() < e.starts_at - make_interval(mins => e.reveal_minutes_before) then return false; end if;
  if e.type <> 'rolling' then return true; end if;
  -- Never a meet point ahead of the one it's at.
  if s.position > e.current_stop then return false; end if;
  -- The one it's at now: everyone going, so a late joiner can find it and check in.
  if s.position = e.current_stop or s.position = 0 then return true; end if;
  -- One it has left: people who were there (checked in at it, or at the one before).
  return exists (
    select 1
    from public.check_ins c
    join public.event_stops x on x.id = c.stop_id
    where c.event_id = e.id
      and c.user_id = p_user
      and x.event_id = e.id
      and x.position in (s.position, s.position - 1)
  );
end;
$$;

-- ===========================================================================
-- 2. Check-in (was 20261118170000), moving on and changing the plan (20261117120300)
-- ===========================================================================

create or replace function public.check_in(
  p_event_id uuid,
  p_position int,
  p_lat double precision,
  p_lng double precision,
  p_build_id uuid default null
)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
  e public.events;
  s public.event_stops;
  v_current uuid;
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
  if not found then raise exception 'That meet point no longer exists.'; end if;
  if not private.can_see_stop(s.id, v_uid) then raise exception 'You can''t see this meet point yet.'; end if;
  if e.type = 'rolling' and p_position <> e.current_stop then
    raise exception 'The meet has moved on. Check in at the meet point it is at now.';
  end if;
  if p_lat is null or p_lng is null then
    raise exception 'Turn on location so the app can see you are at the meet point.';
  end if;
  if not extensions.st_dwithin(s.location, private.pt(p_lat, p_lng), private.mi(0.5)) then
    raise exception 'You need to be within 0.5 mi of %.', s.name;
  end if;

  if p_build_id is not null then
    select g.build_id into v_current from public.event_going g where g.event_id = e.id and g.user_id = v_uid;
    if p_build_id is distinct from v_current then
      if not exists (select 1 from public.builds b where b.id = p_build_id and b.owner_id = v_uid) then
        raise exception 'That isn''t one of your builds.';
      end if;
      if v_current is null and private.has_checked_in(e.id, v_uid) then
        -- Checked in before with no vehicle on record (older rows, the old demo, a
        -- passenger who added a build later): record this one if the invite covers it,
        -- and never let the missing record block this check-in (checkIn() in src/lib/events.ts).
        if private.can_go_with(e.id, v_uid, p_build_id) then
          insert into public.event_going (event_id, user_id, build_id) values (e.id, v_uid, p_build_id)
            on conflict (event_id, user_id) do update set build_id = excluded.build_id;
        end if;
      else
        if private.has_checked_in(e.id, v_uid) then
          raise exception 'You''ve checked in, so your vehicle is set for this one.';
        end if;
        if not private.can_go_with(e.id, v_uid, p_build_id) then
          raise exception 'That build doesn''t match the invite. Check in with one that does, or ask a host.';
        end if;
        insert into public.event_going (event_id, user_id, build_id) values (e.id, v_uid, p_build_id)
          on conflict (event_id, user_id) do update set build_id = excluded.build_id;
      end if;
    end if;
  end if;

  insert into public.check_ins (event_id, user_id, stop_id) values (e.id, v_uid, s.id) on conflict do nothing;
end;
$$;

create or replace function public.move_on(p_event_id uuid)
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
  if v_next.id is null then raise exception 'This is the last planned meet point.'; end if;

  update public.event_stops set revealed_at = now() where id = v_next.id;
  update public.events set current_stop = v_next.position where id = e.id;
  insert into public.plan_changes (event_id, by_user, kind, text, stop_id, stop_name, location)
    values (e.id, v_uid, 'move_on', format('Moved on to meet point %s, %s.', v_next.position + 1, v_next.name),
            v_next.id, v_next.name, v_next.location);

  -- movedOnReminder(): never names the new place.
  insert into public.notices (user_id, event_id, kind, key, title, body, url)
    select c.user_id, e.id, 'moved',
           format('ns.%s.moved.%s', e.id, v_next.position),
           e.title || ' moved on',
           format('Meet point %s is shown. Open Nightshift to see where.', v_next.position + 1),
           '/event/' || e.id
    from public.check_ins c
    where c.stop_id = v_from.id
    on conflict (user_id, key) where key is not null do nothing;

  return query select c.user_id from public.check_ins c where c.stop_id = v_from.id;
end;
$$;

create or replace function public.change_plan(
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
  if e.type <> 'rolling' then raise exception 'Only rolling meets can change meet points on the night.'; end if;
  if e.cancelled_at is not null then raise exception 'This event was cancelled.'; end if;
  if now() >= private.event_end(e.starts_at, e.ends_at) then raise exception 'This event has finished.'; end if;

  if p_kind in ('add', 'move') and (p_lat is null or p_lng is null) then
    raise exception 'Pick a place on the map.';
  end if;

  if p_kind = 'add' then
    select coalesce(max(position), -1) + 1 into v_pos from public.event_stops where event_id = e.id;
    if v_pos >= 12 then raise exception 'Keep it to 12 meet points or fewer.'; end if;
    v_name := coalesce(nullif(btrim(p_name), ''), 'Meet point ' || (v_pos + 1));
    v_loc := private.pt(p_lat, p_lng);
    insert into public.event_stops (event_id, position, name, location)
      values (e.id, v_pos, v_name, v_loc) returning * into s;
    v_zone := private.ban_zone_at(v_loc);
    v_text := format('Added %s as meet point %s.', v_name, v_pos + 1);
  else
    select * into s from public.event_stops where id = p_stop_id and event_id = e.id;
    if not found then raise exception 'That meet point no longer exists.'; end if;
    v_loc := s.location;
    if p_kind = 'rename' then
      v_name := btrim(coalesce(p_name, ''));
      if v_name = '' then raise exception 'Give the meet point a name.'; end if;
      if v_name = s.name then raise exception 'That''s the same name.'; end if;
      update public.event_stops set name = v_name where id = s.id;
      v_text := format('Renamed meet point %s from %s to %s.', s.position + 1, s.name, v_name);
    elsif p_kind = 'move' then
      -- canMoveStop()
      if s.position < e.current_stop then raise exception 'The meet has already left this meet point.'; end if;
      if exists (select 1 from public.check_ins c where c.stop_id = s.id) then
        raise exception 'People have checked in here, so it can''t be moved.';
      end if;
      v_loc := private.pt(p_lat, p_lng);
      v_miles := extensions.st_distance(s.location, v_loc) / 1609.344;
      update public.event_stops set location = v_loc where id = s.id;
      v_zone := private.ban_zone_at(v_loc);
      v_name := s.name;
      v_text := format('Moved meet point %s, %s%s.', s.position + 1, s.name,
                       case when v_miles >= 0.1 then format(', by %s mi', to_char(v_miles, 'FM9990.0')) else '' end);
    elsif p_kind = 'remove' then
      -- canRemoveStop()
      if s.position <= e.current_stop then
        raise exception 'You can only remove meet points the meet hasn''t reached. Move this one instead.';
      end if;
      delete from public.event_stops where id = s.id;
      update public.event_stops set position = position - 1 where event_id = e.id and position > s.position;
      v_text := format('Removed meet point %s, %s.', s.position + 1, s.name);
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
-- Reminders (was 20261118170000)
-- ===========================================================================

create or replace function public.queue_due_reminders(p_window interval default interval '15 minutes')
returns int
language plpgsql security definer
set search_path = ''
as $$
declare
  v_count int := 0;
  v_rows int;
begin
  -- "Location shown" at the reveal time (not for shows and track days, and
  -- not when it falls at the same moment as the 30-minute reminder).
  with due as (
    select e.*, e.starts_at - make_interval(mins => e.reveal_minutes_before) as at
    from public.events e
    where e.cancelled_at is null
      and not private.is_public_type(e.type)
      and e.reveal_minutes_before > 0
      and e.reveal_minutes_before <> 30
      and e.starts_at - make_interval(mins => e.reveal_minutes_before) <= now()
      and e.starts_at - make_interval(mins => e.reveal_minutes_before) > now() - p_window
  ), people as (
    select d.id as event_id, g.user_id from due d join public.event_going g on g.event_id = d.id
    union
    select d.id, h.user_id from due d join public.event_hosts h on h.event_id = d.id
    union
    select d.id, m.user_id from due d join public.crew_members m on m.crew_id = d.crew_id and m.role in ('owner', 'host')
  )
  insert into public.notices (user_id, event_id, kind, key, title, body, url)
  select
    p.user_id, d.id, 'reveal', format('ns.%s.reveal', d.id),
    d.title || ': location shown',
    case when private.is_event_host(d.id, p.user_id)
      then format('People going can now see where your %s is.', lower(replace(replace(d.type::text, 'rolling', 'rolling meet'), 'trackday', 'track day')))
      else format('Open Nightshift to see where the %s is. Starts %s.',
                  lower(replace(replace(d.type::text, 'rolling', 'rolling meet'), 'trackday', 'track day')),
                  to_char(d.starts_at at time zone 'Europe/London', 'HH24:MI'))
    end,
    '/event/' || d.id
  from people p join due d on d.id = p.event_id
  on conflict (user_id, key) where key is not null do nothing;
  get diagnostics v_rows = row_count;
  v_count := v_count + v_rows;

  -- "Starts in 30 min": check-in opens.
  with due as (
    select e.*
    from public.events e
    where e.cancelled_at is null
      and e.starts_at - interval '30 minutes' <= now()
      and e.starts_at - interval '30 minutes' > now() - p_window
  ), people as (
    select d.id as event_id, g.user_id from due d join public.event_going g on g.event_id = d.id
    union
    select d.id, h.user_id from due d join public.event_hosts h on h.event_id = d.id
    union
    select d.id, m.user_id from due d join public.crew_members m on m.crew_id = d.crew_id and m.role in ('owner', 'host')
  )
  insert into public.notices (user_id, event_id, kind, key, title, body, url)
  select
    p.user_id, d.id, 'soon', format('ns.%s.soon', d.id),
    d.title || ' starts in 30 min',
    case
      when private.is_event_host(d.id, p.user_id) or private.is_public_type(d.type) or d.reveal_minutes_before >= 30
        then format('Check-in is open. %s.', d.area_name)
      else format('The location is shown and check-in is open. %s.', d.area_name)
    end,
    '/event/' || d.id
  from people p join due d on d.id = p.event_id
  on conflict (user_id, key) where key is not null do nothing;
  get diagnostics v_rows = row_count;
  return v_count + v_rows;
end;
$$;

-- ===========================================================================
-- 3. No minimum mods by default (was 20261117120300 and 20261117120100)
-- ===========================================================================

alter table public.events alter column invite_min_mods set default 0;

create or replace function public.save_event(p_event jsonb, p_stops jsonb, p_cohost_ids uuid[] default null)
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
    raise exception 'Place at least one meet point.';
  end if;
  if jsonb_array_length(p_stops) > 12 then raise exception 'Keep it to 12 meet points or fewer.'; end if;
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
        raise exception 'It has started. Use Change the plan to edit meet points.';
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
      coalesce((v_filter->>'min_mods')::int, 0),
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
      invite_min_mods = coalesce((v_filter->>'min_mods')::int, 0),
      invite_brands = array(select btrim(x) from jsonb_array_elements_text(coalesce(v_filter->'brands', '[]'::jsonb)) as x),
      invite_radius_miles = coalesce((v_filter->>'radius_miles')::numeric, 25),
      current_stop = least(current_stop, greatest(0, jsonb_array_length(p_stops) - 1))
    where id = v_id;
  end if;

  -- Stops, in order. Existing stops keep their id (stopsFromDraft()).
  for v_stop in select value from jsonb_array_elements(p_stops) loop
    if (v_stop->>'lat') is null or (v_stop->>'lng') is null then
      raise exception 'Every meet point needs a place.';
    end if;
    v_name := coalesce(nullif(btrim(v_stop->>'name'), ''), 'Meet point ' || (v_pos + 1));
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
              format('Meet point %s: %s.', v_pos + 1, v_name), v_stop_id, v_name, v_loc, v_zone.name);
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

create or replace function public.invite_count(p_filter jsonb, p_area_lat double precision, p_area_lng double precision)
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
                                coalesce((p_filter->>'min_mods')::int, 0), v_brands)
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

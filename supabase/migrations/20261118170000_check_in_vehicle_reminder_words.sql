-- check_in() accepts a vehicle when none was recorded (REVIEW-6-perf.md item 14, bug B2),
-- and reminder wording uses the glossary's "stop unlocks" (docs/SPEC.md, src/lib/glossary.ts).
--
-- Before: someone who had checked in with no build on record (going as a passenger,
-- older rows, the old demo) was refused at the next stop when the app sent the build
-- they were in: "You've checked in, so your vehicle is set for this one." The app's
-- checkIn() records a fitting build in that case and never refuses for it; now the
-- server does the same. A build that isn't yours is still refused, and once a build
-- is on record it still can't change after the first check-in.

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

-- Reminders: "Stop unlocked", not "location unlocked" (mirrors remindersFor() in src/lib/reminders.ts).
create or replace function public.queue_due_reminders(p_window interval default interval '15 minutes')
returns int
language plpgsql security definer
set search_path = ''
as $$
declare
  v_count int := 0;
  v_rows int;
begin
  -- "Stop unlocked" at the reveal time (not for shows and track days, and
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
    d.title || ': stop unlocked',
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
      else format('The stop is unlocked and check-in is open. %s.', d.area_name)
    end,
    '/event/' || d.id
  from people p join due d on d.id = p.event_id
  on conflict (user_id, key) where key is not null do nothing;
  get diagnostics v_rows = row_count;
  return v_count + v_rows;
end;
$$;

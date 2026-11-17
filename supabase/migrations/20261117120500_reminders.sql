-- Nightshift backend, part 6: server-side reminders (Phase 2).
--
-- Mirrors remindersFor() in src/lib/reminders.ts. The push-notices Edge
-- Function calls this every few minutes with the service role key, then sends
-- any unpushed notices through the Expo push service. Until real push is
-- possible (paid Apple developer account), the phone keeps scheduling its own
-- local reminders and these rows simply fill the in-app notice list.
--
-- Lock screens are public: titles and bodies never name a stop, only the
-- event title and its rough area name.

create function public.queue_due_reminders(p_window interval default interval '15 minutes')
returns int
language plpgsql security definer
set search_path = ''
as $$
declare
  v_count int := 0;
  v_rows int;
begin
  -- "Location unlocked" at the reveal time (not for shows and track days, and
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
    d.title || ': location unlocked',
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
      else format('Location unlocked and check-in is open. %s.', d.area_name)
    end,
    '/event/' || d.id
  from people p join due d on d.id = p.event_id
  on conflict (user_id, key) where key is not null do nothing;
  get diagnostics v_rows = row_count;
  return v_count + v_rows;
end;
$$;

-- Service role only (the scheduled Edge Function), never the app.
revoke execute on function public.queue_due_reminders(interval) from public, anon, authenticated;
grant execute on function public.queue_due_reminders(interval) to service_role;

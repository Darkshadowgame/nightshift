-- Level-up, profile area: trust and safety (20261122170000).
--
-- Three additive pieces. Nothing existing is replaced or changed, so older app versions keep
-- working exactly as before; the newer app hides each feature until these functions exist.
--
-- 1. quiet_alert(event): "This is getting out of hand". Someone going to (or at) a meet tells the
--    host and Slipstream's staff, without anyone else at the meet knowing who. Built on the report
--    system: it adds a normal report on the event (so it lands in the staff queue like any other,
--    reporter hidden from everyone but staff) and a notice for each host that never names the sender.
-- 2. vehicle_sightings + confirm_vehicle_seen() + vehicle_seen(): the optional "Seen in person" mark.
--    Someone who checked in at the same meet as the vehicle's owner says they saw it there. No plates,
--    no documents. One confirmation per person per vehicle, a daily limit, and the mark needs three
--    different people.
-- 3. host_records(): for each host, how many of their meets really ran and how many reports on them
--    staff upheld. The app turns that into one trust signal ("Trusted host", or a plain line for a
--    shorter record). Only counts are returned, never who reported what.

-- ===========================================================================
-- 1. Quiet alert
-- ===========================================================================

create table public.quiet_alerts (
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);
alter table public.quiet_alerts enable row level security;
revoke all on public.quiet_alerts from anon, authenticated;
grant all on public.quiet_alerts to service_role;
-- Nobody reads these directly (not even the sender): staff see the report, hosts see the notice.

create function public.quiet_alert(p_event uuid)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
  e public.events;
  v_host record;
begin
  select * into e from public.events where id = p_event;
  if not found then raise exception 'That meet isn''t there any more.'; end if;
  -- Suspended people can still ask for help, like they can still report.
  -- Only someone who is going or has checked in. Hosts already know what is happening.
  if private.is_event_host(p_event, v_uid) then raise exception 'You''re a host of this meet. Use Cancel or Plan changes.'; end if;
  if not (private.is_going(p_event, v_uid) or exists (select 1 from public.check_ins c where c.event_id = p_event and c.user_id = v_uid)) then
    raise exception 'Only people going to this meet can do that.';
  end if;
  if (select count(*) from public.quiet_alerts a where a.user_id = v_uid and a.created_at > now() - interval '1 day') >= 5 then
    raise exception 'That''s the most alerts for one day. If someone is in danger, call 999.';
  end if;
  -- Counted with reports (which suspended people can still send).
  perform private.rate_hit(v_uid, 'report');

  insert into public.quiet_alerts (event_id, user_id) values (p_event, v_uid) on conflict do nothing;

  -- Staff see it as a report on the meet (the reporter is only visible to staff, as for any report).
  insert into public.reports (reporter_id, target, target_id, target_user, reason, note, excerpt)
    values (v_uid, 'event', p_event, e.created_by, 'other', 'Quiet alert: someone at the meet says it is getting out of hand.',
            left(e.title || ' · ' || e.area_name, 1000))
    on conflict do nothing;

  -- Every host gets one notice per quarter hour, however many people send one. It never names the sender.
  for v_host in
    select h.user_id from public.event_hosts h where h.event_id = p_event
    union
    select e.created_by where e.created_by is not null
    union
    select m.user_id from public.crew_members m where m.crew_id = e.crew_id and m.role in ('owner', 'host')
  loop
    insert into public.notices (user_id, event_id, kind, key, title, body, url)
      values (v_host.user_id, p_event, 'host',
              format('quiet.%s.%s', p_event, floor(extract(epoch from now()) / 900)::bigint),
              'Someone at ' || e.title || ' asked for help',
              'Someone at your meet says it''s getting out of hand. Please check on it. If anyone is in danger, call 999.',
              '/event/' || p_event)
      on conflict (user_id, key) where key is not null do nothing;
  end loop;
end;
$$;

-- ===========================================================================
-- 2. Seen in person
-- ===========================================================================

create table public.vehicle_sightings (
  build_id uuid not null references public.builds (id) on delete cascade,
  witness_id uuid not null references public.profiles (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete cascade,
  created_at timestamptz not null default now(),
  -- One confirmation per person per vehicle, ever.
  primary key (build_id, witness_id)
);
create index vehicle_sightings_witness_idx on public.vehicle_sightings (witness_id, created_at);
alter table public.vehicle_sightings enable row level security;
revoke all on public.vehicle_sightings from anon, authenticated;
grant all on public.vehicle_sightings to service_role;
-- Read only through vehicle_seen(), which returns counts.

create function public.confirm_vehicle_seen(p_build uuid, p_event uuid)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
  v_owner uuid;
  e public.events;
begin
  select b.owner_id into v_owner from public.builds b where b.id = p_build;
  if v_owner is null then raise exception 'That vehicle isn''t there any more.'; end if;
  if v_owner = v_uid then raise exception 'You can''t confirm your own vehicle.'; end if;
  select * into e from public.events where id = p_event;
  if not found or e.cancelled_at is not null or now() < e.starts_at then
    raise exception 'Only people who were both at the same meet can confirm this.';
  end if;
  perform private.check_not_suspended(v_uid);
  if not exists (select 1 from public.check_ins c where c.event_id = p_event and c.user_id = v_uid)
     or not exists (select 1 from public.check_ins c where c.event_id = p_event and c.user_id = v_owner) then
    raise exception 'Only people who were both at the same meet can confirm this.';
  end if;
  if exists (select 1 from public.vehicle_sightings s where s.build_id = p_build and s.witness_id = v_uid) then
    raise exception 'You''ve already confirmed this one.';
  end if;
  if private.rate_count(v_uid, 'vehicle_seen', interval '1 day') >= 10 then
    raise exception 'That''s enough for today. Try again tomorrow.';
  end if;
  perform private.rate_hit(v_uid, 'vehicle_seen');
  insert into public.vehicle_sightings (build_id, witness_id, event_id) values (p_build, v_uid, p_event);
end;
$$;

-- How many different people have confirmed each vehicle, and whether you have. The mark shows at 3.
create function public.vehicle_seen(p_build_ids uuid[])
returns table (build_id uuid, witnesses int, mine boolean)
language sql stable security definer
set search_path = ''
as $$
  select s.build_id, count(*)::int, bool_or(s.witness_id = auth.uid())
  from public.vehicle_sightings s
  where auth.uid() is not null and s.build_id = any (p_build_ids[1:60])
  group by s.build_id
$$;

-- ===========================================================================
-- 3. Host records
-- ===========================================================================

-- For each host: meets that really ran (over, not cancelled, at least 3 people checked in) and how many
-- of them have a report that staff upheld ("actioned"). Counts only. Up to 20 hosts at a time.
create function public.host_records(p_hosts uuid[])
returns table (host_id uuid, meets_run int, upheld int)
language sql stable security definer
set search_path = ''
as $$
  with ran as (
    select h.id as host_id, e.id as event_id
    from unnest(p_hosts[1:20]) as h(id)
    join public.events e
      on (e.created_by = h.id or exists (select 1 from public.event_hosts eh where eh.event_id = e.id and eh.user_id = h.id))
    where auth.uid() is not null
      and e.cancelled_at is null
      and now() >= private.event_end(e.starts_at, e.ends_at)
      and (select count(distinct c.user_id) from public.check_ins c where c.event_id = e.id) >= 3
  )
  select r.host_id,
         count(*)::int,
         count(*) filter (where exists (
           select 1 from public.reports rp where rp.target = 'event' and rp.target_id = r.event_id and rp.status = 'actioned'
         ))::int
  from ran r
  group by r.host_id
$$;

-- ===========================================================================
-- Privileges
-- ===========================================================================

revoke all on function public.quiet_alert(uuid) from public, anon;
grant execute on function public.quiet_alert(uuid) to authenticated, service_role;
revoke all on function public.confirm_vehicle_seen(uuid, uuid) from public, anon;
grant execute on function public.confirm_vehicle_seen(uuid, uuid) to authenticated, service_role;
revoke all on function public.vehicle_seen(uuid[]) from public, anon;
grant execute on function public.vehicle_seen(uuid[]) to authenticated, service_role;
revoke all on function public.host_records(uuid[]) from public, anon;
grant execute on function public.host_records(uuid[]) to authenticated, service_role;

-- Meet level-up (22 Nov 2026): capacity and waitlist, house rules, one-tap status, and meet history.
-- The app's rules are src/lib/meetExtras.ts.
--
-- Purely additive, so phones on the older app keep working unchanged:
--   * no existing function, policy or grant is dropped; set_going(), answer_request() and check_in()
--     are NOT replaced. A full meet is enforced by a trigger on event_going instead, and a place that
--     frees up is filled by a trigger, so older apps see a plain "This meet is full" error;
--   * events_list is re-created with two extra columns at the end (capacity, rules), on top of the
--     newest definition (20261121090000_event_invites.sql); older apps list their columns by name;
--   * co-hosts need no new table: event_hosts already holds them (save_event() sets them before the
--     start); add_cohost() lets a host add one later.
-- Privacy: nothing here touches a meet point. Status rows are read by the person, hosts and people
-- going (the same audience as check_ins); the waitlist by the person and hosts. meet_stats() returns
-- counts only. The after-meet album uses the existing posts and photo pipeline (plates blurred on the
-- phone, moderation as before); its 48 hour window is applied by the app.

alter table public.events add column capacity integer check (capacity is null or capacity between 1 and 500);
alter table public.events add column rules text[] not null default '{}'
  check (cardinality(rules) <= 12 and rules <@ array['no-revving','no-burnouts','litter','quiet-arrival','no-drinking','respect-venue','park-nicely','kids-dogs','no-drones','ask-photos']);

create or replace view public.events_list with (security_invoker = 'true') as
  select id, type, title, description, starts_at, ends_at, reveal_minutes_before,
    extensions.st_y(area::extensions.geometry) as area_lat,
    extensions.st_x(area::extensions.geometry) as area_lng,
    area_radius_miles, area_name, current_stop, crew_id, route_miles,
    invite_everyone, invite_cars, invite_bikes, invite_classes, invite_min_mods, invite_brands, invite_radius_miles,
    created_by, cancelled_at, created_at, updated_at,
    allow_invites,
    capacity, rules
  from public.events e;

-- ---------------------------------------------------------------------------
-- One-tap status
-- ---------------------------------------------------------------------------
create table public.event_status (
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  status text not null check (status in ('late', 'left')),
  at timestamptz not null default now(),
  primary key (event_id, user_id)
);
alter table public.event_status enable row level security;
revoke all on public.event_status from anon, authenticated;
grant select on public.event_status to authenticated;
grant all on public.event_status to service_role;
create policy "event_status: self, hosts and people going read" on public.event_status
  for select to authenticated using (
    user_id = (select auth.uid())
    or private.is_event_host(event_id, (select auth.uid()))
    or private.is_going(event_id, (select auth.uid()))
  );

-- null clears it. Only people going, while the meet is on or still to come.
create or replace function public.set_meet_status(p_event_id uuid, p_status text) returns void
  language plpgsql security definer set search_path to '' as $$
declare
  v_uid uuid := private.require_uid();
  e public.events;
begin
  select * into e from public.events where id = p_event_id;
  if not found then raise exception 'Event not found.'; end if;
  if e.cancelled_at is not null then raise exception 'This event was cancelled.'; end if;
  if now() >= private.event_end(e.starts_at, e.ends_at) then raise exception 'This event has finished.'; end if;
  if not private.is_going(e.id, v_uid) then raise exception 'Say you''re going first.'; end if;
  if p_status is null then
    delete from public.event_status where event_id = e.id and user_id = v_uid;
    return;
  end if;
  if p_status not in ('late', 'left') then raise exception 'Pick running late or left.'; end if;
  perform private.check_not_suspended(v_uid);
  if private.rate_count(v_uid, 'meet_status', interval '1 hour') >= 20 then raise exception 'Slow down a little.'; end if;
  perform private.rate_hit(v_uid, 'meet_status');
  insert into public.event_status (event_id, user_id, status) values (e.id, v_uid, p_status)
    on conflict (event_id, user_id) do update set status = excluded.status, at = now();
end;
$$;

-- ---------------------------------------------------------------------------
-- Capacity and waitlist
-- ---------------------------------------------------------------------------
create table public.event_waitlist (
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  build_id uuid references public.builds (id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);
create index event_waitlist_order_idx on public.event_waitlist (event_id, created_at);
alter table public.event_waitlist enable row level security;
revoke all on public.event_waitlist from anon, authenticated;
grant select on public.event_waitlist to authenticated;
grant all on public.event_waitlist to service_role;
create policy "event_waitlist: self and hosts read" on public.event_waitlist
  for select to authenticated using (user_id = (select auth.uid()) or private.is_event_host(event_id, (select auth.uid())));

-- Places taken: people going who are not hosts.
create function private.places_taken(p_event uuid) returns integer
  language sql stable security definer set search_path to '' as $$
  select count(*)::int from public.event_going g
  where g.event_id = p_event and not private.is_event_host(p_event, g.user_id)
$$;
revoke all on function private.places_taken(uuid) from public, anon, authenticated;

-- A full meet takes nobody else (hosts excepted), whichever call tries to add them.
create function private.enforce_capacity() returns trigger
  language plpgsql security definer set search_path to '' as $$
declare
  v_cap integer;
begin
  select capacity into v_cap from public.events where id = new.event_id;
  if v_cap is null or private.is_event_host(new.event_id, new.user_id) then return new; end if;
  if private.places_taken(new.event_id) >= v_cap then
    raise exception 'This meet is full. Join the waitlist and you move up if someone drops out.';
  end if;
  return new;
end;
$$;
revoke all on function private.enforce_capacity() from public, anon, authenticated;
create trigger event_going_capacity before insert on public.event_going
  for each row execute function private.enforce_capacity();

-- A place came up: the first people waiting move in, first in line first, and are told.
create function private.promote_waitlist() returns trigger
  language plpgsql security definer set search_path to '' as $$
declare
  e public.events;
  w public.event_waitlist;
begin
  select * into e from public.events where id = old.event_id;
  if not found or e.capacity is null or e.cancelled_at is not null or now() >= private.event_end(e.starts_at, e.ends_at) then return old; end if;
  while private.places_taken(e.id) < e.capacity loop
    select * into w from public.event_waitlist where event_id = e.id order by created_at limit 1 for update skip locked;
    exit when not found;
    delete from public.event_waitlist where event_id = e.id and user_id = w.user_id;
    insert into public.event_going (event_id, user_id, build_id) values (e.id, w.user_id, w.build_id) on conflict do nothing;
    insert into public.notices (user_id, event_id, kind, key, title, body, url)
      values (w.user_id, e.id, 'system', format('ns.%s.waitlist.%s', e.id, w.user_id),
              format('You''re going to %s', e.title), 'A place came up, so you moved off the waitlist.', '/event/' || e.id::text)
      on conflict do nothing;
  end loop;
  return old;
end;
$$;
revoke all on function private.promote_waitlist() from public, anon, authenticated;
create trigger event_going_promote after delete on public.event_going
  for each row execute function private.promote_waitlist();

create or replace function public.join_waitlist(p_event_id uuid, p_build_id uuid default null) returns void
  language plpgsql security definer set search_path to '' as $$
declare
  v_uid uuid := private.require_uid();
  e public.events;
begin
  select * into e from public.events where id = p_event_id;
  if not found then raise exception 'Event not found.'; end if;
  if e.cancelled_at is not null then raise exception 'This event was cancelled.'; end if;
  if now() >= private.event_end(e.starts_at, e.ends_at) then raise exception 'This event has finished.'; end if;
  perform private.check_not_suspended(v_uid);
  if private.is_event_host(e.id, v_uid) or private.is_going(e.id, v_uid) then raise exception 'You''re already going.'; end if;
  if e.capacity is null or private.places_taken(e.id) < e.capacity then raise exception 'There is a place free. Tap I''m going.'; end if;
  if p_build_id is not null and not exists (select 1 from public.builds b where b.id = p_build_id and b.owner_id = v_uid) then
    raise exception 'That isn''t one of your builds.';
  end if;
  if not private.can_go_with(e.id, v_uid, p_build_id) then raise exception 'That doesn''t match the invite. Ask a host to let you in.'; end if;
  if exists (select 1 from public.event_requests r where r.event_id = e.id and r.user_id = v_uid and r.status = 'declined') then
    raise exception 'A host has already said no to this one.';
  end if;
  if private.rate_count(v_uid, 'waitlist', interval '1 day') >= 30 then raise exception 'That''s the most waitlists for one day.'; end if;
  perform private.rate_hit(v_uid, 'waitlist');
  insert into public.event_waitlist (event_id, user_id, build_id) values (e.id, v_uid, p_build_id)
    on conflict (event_id, user_id) do update set build_id = coalesce(excluded.build_id, public.event_waitlist.build_id);
end;
$$;

create or replace function public.leave_waitlist(p_event_id uuid) returns void
  language plpgsql security definer set search_path to '' as $$
declare
  v_uid uuid := private.require_uid();
begin
  delete from public.event_waitlist where event_id = p_event_id and user_id = v_uid;
end;
$$;

-- ---------------------------------------------------------------------------
-- Host options after the meet is made: places and house rules
-- ---------------------------------------------------------------------------
create or replace function public.set_meet_options(p_event_id uuid, p_capacity integer, p_rules text[]) returns void
  language plpgsql security definer set search_path to '' as $$
declare
  v_uid uuid := private.require_uid();
  v_rules text[];
  v_taken integer;
begin
  if not private.is_event_host(p_event_id, v_uid) then raise exception 'Only hosts can change that.'; end if;
  if p_capacity is not null and (p_capacity < 1 or p_capacity > 500) then raise exception 'Pick a number from 1 to 500, or leave it empty for no limit.'; end if;
  select coalesce(array_agg(distinct x), '{}') into v_rules from unnest(coalesce(p_rules, '{}')) x;
  if not (v_rules <@ array['no-revving','no-burnouts','litter','quiet-arrival','no-drinking','respect-venue','park-nicely','kids-dogs','no-drones','ask-photos']) then
    raise exception 'Pick rules from the list.';
  end if;
  update public.events set capacity = p_capacity, rules = v_rules where id = p_event_id;
  -- Raising the limit lets people waiting in.
  if p_capacity is not null then
    v_taken := private.places_taken(p_event_id);
    while v_taken < p_capacity and exists (select 1 from public.event_waitlist w where w.event_id = p_event_id) loop
      with next as (
        delete from public.event_waitlist w
        where (w.event_id, w.user_id) = (select w2.event_id, w2.user_id from public.event_waitlist w2 where w2.event_id = p_event_id order by w2.created_at limit 1)
        returning w.event_id, w.user_id, w.build_id
      )
      insert into public.event_going (event_id, user_id, build_id) select event_id, user_id, build_id from next on conflict do nothing;
      v_taken := private.places_taken(p_event_id);
    end loop;
  else
    insert into public.event_going (event_id, user_id, build_id)
      select w.event_id, w.user_id, w.build_id from public.event_waitlist w where w.event_id = p_event_id on conflict do nothing;
    delete from public.event_waitlist where event_id = p_event_id;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Co-hosts, added after the meet is made
-- ---------------------------------------------------------------------------
create or replace function public.add_cohost(p_event_id uuid, p_user_id uuid) returns void
  language plpgsql security definer set search_path to '' as $$
declare
  v_uid uuid := private.require_uid();
  e public.events;
begin
  select * into e from public.events where id = p_event_id;
  if not found then raise exception 'Event not found.'; end if;
  if not private.is_event_host(e.id, v_uid) then raise exception 'Only hosts can add a co-host.'; end if;
  if e.cancelled_at is not null then raise exception 'This event was cancelled.'; end if;
  perform private.check_not_suspended(v_uid);
  if p_user_id is null or p_user_id = v_uid or private.blocked_between(v_uid, p_user_id)
     or not exists (select 1 from public.profiles p where p.id = p_user_id and p.onboarded) then
    raise exception 'Pick someone else.';
  end if;
  if exists (select 1 from public.event_hosts h where h.event_id = e.id and h.user_id = p_user_id) then raise exception 'They already host this one.'; end if;
  if (select count(*) from public.event_hosts h where h.event_id = e.id) >= 5 then raise exception 'A meet can have up to 5 hosts.'; end if;
  insert into public.event_hosts (event_id, user_id) values (e.id, p_user_id);
  delete from public.event_requests where event_id = e.id and user_id = p_user_id and status = 'pending';
  delete from public.event_waitlist where event_id = e.id and user_id = p_user_id;
  insert into public.notices (user_id, event_id, kind, key, title, body, url)
    values (p_user_id, e.id, 'host', format('ns.%s.cohost.%s', e.id, p_user_id), format('You''re now a host of %s', e.title),
            'You can edit and manage it.', '/event/' || e.id::text)
    on conflict do nothing;
end;
$$;

-- ---------------------------------------------------------------------------
-- Meet history and the host's numbers (counts only)
-- ---------------------------------------------------------------------------
-- runs/typical: for anyone who can see the meet. regulars/newcomers: hosts only (null for others).
-- "The same meet": an earlier, finished, not-cancelled event with the same name (ignoring case) that
-- shares a host or the crew. Turnout is people checked in, or people going when nobody checked in.
create or replace function public.meet_stats(p_event_id uuid) returns jsonb
  language plpgsql security definer set search_path to '' as $$
declare
  v_uid uuid := private.require_uid();
  e public.events;
  v_ids uuid[];
  v_runs integer;
  v_typical integer;
  v_regulars integer;
  v_newcomers integer;
  v_host boolean;
begin
  select * into e from public.events where id = p_event_id;
  if not found then raise exception 'Event not found.'; end if;
  v_host := private.is_event_host(e.id, v_uid);
  if not v_host and private.event_role(e.id, v_uid) = 'none' and not private.was_invited(e.id, v_uid) then
    raise exception 'Event not found.';
  end if;

  select coalesce(array_agg(o.id), '{}') into v_ids from public.events o
    where o.id <> e.id and o.cancelled_at is null
      and private.event_end(o.starts_at, o.ends_at) < now()
      and lower(btrim(o.title)) = lower(btrim(e.title))
      and (
        (e.crew_id is not null and o.crew_id = e.crew_id)
        or exists (select 1 from public.event_hosts h1 join public.event_hosts h2 on h2.user_id = h1.user_id
                   where h1.event_id = e.id and h2.event_id = o.id)
      );

  v_runs := cardinality(v_ids);
  select percentile_disc(0.5) within group (order by t) into v_typical from (
    select coalesce(nullif((select count(distinct c.user_id) from public.check_ins c where c.event_id = s), 0),
                    (select count(*) from public.event_going g where g.event_id = s))::int as t
    from unnest(v_ids) s
  ) x where t > 0;

  if v_host then
    with now_people as (
      select distinct c.user_id from public.check_ins c where c.event_id = e.id
      union
      select g.user_id from public.event_going g where g.event_id = e.id
        and not exists (select 1 from public.check_ins c2 where c2.event_id = e.id)
    ), people as (
      select n.user_id,
        (exists (select 1 from public.event_going g where g.event_id = any (v_ids) and g.user_id = n.user_id)
         or exists (select 1 from public.check_ins c where c.event_id = any (v_ids) and c.user_id = n.user_id)) as regular
      from now_people n where not private.is_event_host(e.id, n.user_id)
    )
    select count(*) filter (where regular), count(*) filter (where not regular) into v_regulars, v_newcomers from people;
  end if;

  return jsonb_build_object('runs', v_runs, 'typical', v_typical, 'regulars', v_regulars, 'newcomers', v_newcomers);
end;
$$;

revoke all on function public.set_meet_status(uuid, text) from public, anon;
revoke all on function public.join_waitlist(uuid, uuid) from public, anon;
revoke all on function public.leave_waitlist(uuid) from public, anon;
revoke all on function public.set_meet_options(uuid, integer, text[]) from public, anon;
revoke all on function public.add_cohost(uuid, uuid) from public, anon;
revoke all on function public.meet_stats(uuid) from public, anon;
grant execute on function public.set_meet_status(uuid, text) to authenticated;
grant execute on function public.join_waitlist(uuid, uuid) to authenticated;
grant execute on function public.leave_waitlist(uuid) to authenticated;
grant execute on function public.set_meet_options(uuid, integer, text[]) to authenticated;
grant execute on function public.add_cohost(uuid, uuid) to authenticated;
grant execute on function public.meet_stats(uuid) to authenticated;

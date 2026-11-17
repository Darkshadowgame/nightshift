-- Nightshift backend, part 8: finding events, travel distance, new-event
-- alerts and staff (admin) read access. Mirrors src/lib/discover.ts.
--
-- Owner decisions (Nov 2026), see docs/BACKEND.md section 8:
-- * Discovery: every signed-in user can see that an event exists (the events
--   row: title, type, time, rough area, invite filter). That is the existing
--   "events: signed-in users read" policy, kept as it is. Exact stops stay
--   behind private.can_see_stop() and public.get_event_stops().
-- * Staff (admins) can read everything for moderation, except homes, travel
--   settings and push tokens. Staff get no host powers: private.is_event_host()
--   is unchanged, so they can't move on, edit, cancel or see stops through RPCs
--   as a host would.
-- * Willing to travel and new-event alerts are personal: only the owner reads them.

-- ===========================================================================
-- Staff
-- ===========================================================================

-- Who is staff. Managed with the service role only (dashboard or SQL editor):
--   insert into public.staff (user_id, note) values ('<uuid>', 'moderator');
create table public.staff (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  note text check (char_length(note) <= 200),
  added_at timestamptz not null default now()
);
alter table public.staff enable row level security;

create function private.is_admin(p_user uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select p_user is not null and exists (select 1 from public.staff s where s.user_id = p_user)
$$;

-- You can see whether you are staff (the app shows moderation tools); staff see the list.
create policy "staff: read own row, staff read all" on public.staff
  for select to authenticated
  using (user_id = (select auth.uid()) or private.is_admin((select auth.uid())));

-- Read access everywhere for moderation. Policies are permissive, so these add
-- to the existing ones. Tables every signed-in user can already read
-- (profiles, builds, build_mods, build_photos, crews, crew_members, ban_zones,
-- events, event_hosts, road_closures) need nothing more.
-- Deliberately left out: profile_homes, profile_settings, push_tokens.
create policy "event_stops: staff read" on public.event_stops
  for select to authenticated using (private.is_admin((select auth.uid())));
create policy "event_going: staff read" on public.event_going
  for select to authenticated using (private.is_admin((select auth.uid())));
create policy "event_requests: staff read" on public.event_requests
  for select to authenticated using (private.is_admin((select auth.uid())));
create policy "check_ins: staff read" on public.check_ins
  for select to authenticated using (private.is_admin((select auth.uid())));
create policy "plan_changes: staff read" on public.plan_changes
  for select to authenticated using (private.is_admin((select auth.uid())));
create policy "chat_messages: staff read" on public.chat_messages
  for select to authenticated using (private.is_admin((select auth.uid())));
create policy "votes: staff read" on public.votes
  for select to authenticated using (private.is_admin((select auth.uid())));
create policy "notices: staff read" on public.notices
  for select to authenticated using (private.is_admin((select auth.uid())));
create policy "spots: staff read" on public.spots
  for select to authenticated using (private.is_admin((select auth.uid())));
create policy "spot_completions: staff read" on public.spot_completions
  for select to authenticated using (private.is_admin((select auth.uid())));
create policy "spot_ratings: staff read" on public.spot_ratings
  for select to authenticated using (private.is_admin((select auth.uid())));
create policy "partner_venues: staff read" on public.partner_venues
  for select to authenticated using (private.is_admin((select auth.uid())));

-- ===========================================================================
-- Willing to travel and new-event alerts (personal)
-- ===========================================================================

-- No row means the defaults: 25 mi and 'notify' (DEFAULT_TRAVEL_MILES and
-- DEFAULT_ALERTS in discover.ts).
create table public.profile_settings (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  -- How far you'd travel for an event, whole miles.
  travel_miles int not null default 25 check (travel_miles between 1 and 300),
  -- notify: a notice (and a push later); search: nothing, you browse; off: nothing.
  new_event_alerts text not null default 'notify' check (new_event_alerts in ('notify', 'search', 'off')),
  updated_at timestamptz not null default now()
);
alter table public.profile_settings enable row level security;
create trigger profile_settings_touch before update on public.profile_settings
  for each row execute function private.touch_updated_at();

create policy "profile_settings: owner reads" on public.profile_settings
  for select to authenticated using (user_id = (select auth.uid()));

-- Same checks and sentences as travelProblem() / alertProblem() in discover.ts.
create function public.save_travel_prefs(p_travel_miles numeric, p_new_event_alerts text)
returns public.profile_settings
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
  r public.profile_settings;
begin
  if p_travel_miles is null then raise exception 'Pick how far you''d travel.'; end if;
  if p_travel_miles <> trunc(p_travel_miles) then raise exception 'Use a whole number of miles.'; end if;
  if p_travel_miles < 1 or p_travel_miles > 300 then raise exception 'Pick how far you''d travel: 1 to 300 miles.'; end if;
  if p_new_event_alerts is null or p_new_event_alerts not in ('notify', 'search', 'off') then
    raise exception 'Pick how you hear about new events.';
  end if;
  insert into public.profiles (id) values (v_uid) on conflict (id) do nothing;
  insert into public.profile_settings (user_id, travel_miles, new_event_alerts)
    values (v_uid, p_travel_miles::int, p_new_event_alerts)
    on conflict (user_id) do update
      set travel_miles = excluded.travel_miles, new_event_alerts = excluded.new_event_alerts
    returning * into r;
  return r;
end;
$$;

-- ===========================================================================
-- New events near you (isNearbyMatch() + nearbyNotice() in discover.ts)
-- ===========================================================================

-- Queue a 'nearby' notice for everyone who should hear about this event:
-- * their setting is 'notify' (the default);
-- * their home (fuzzed, never leaves this function) is within their travel distance of the rough area;
-- * they can go: a public show or track day, or private.is_invited() (a build
--   fits the filter and they live inside the host's radius; "everyone welcome"
--   skips the build check);
-- * they aren't already in it (host, going, asked or turned down);
-- * it hasn't started and isn't cancelled.
-- The key (ns.<event>.nearby) makes it once per person per event, however
-- often the event is saved. The text never names a stop: title, time, area name.
-- Returns how many notices were added.
create function private.queue_nearby_notices(p_event uuid)
returns int
language plpgsql security definer
set search_path = ''
as $$
declare
  e public.events;
  v_label text;
  v_rows int;
begin
  select * into e from public.events where id = p_event;
  if not found or e.cancelled_at is not null or e.starts_at <= now() then return 0; end if;
  v_label := case e.type when 'rolling' then 'rolling meet' when 'trackday' then 'track day' else e.type::text end;

  insert into public.notices (user_id, event_id, kind, key, title, body, url)
  select
    h.user_id, e.id, 'nearby', format('ns.%s.nearby', e.id),
    format('New %s near you', v_label),
    format('%s · %s · %s', e.title, to_char(e.starts_at at time zone 'Europe/London', 'Dy DD Mon HH24:MI'), e.area_name),
    '/event/' || e.id
  from public.profile_homes h
  left join public.profile_settings ps on ps.user_id = h.user_id
  where extensions.st_dwithin(h.home, e.area, private.mi(coalesce(ps.travel_miles, 25)::double precision))
    and coalesce(ps.new_event_alerts, 'notify') = 'notify'
    and h.user_id is distinct from e.created_by
    and not private.is_event_host(e.id, h.user_id)
    and not private.is_going(e.id, h.user_id)
    and not exists (select 1 from public.event_requests r where r.event_id = e.id and r.user_id = h.user_id)
    and (private.is_public_type(e.type) or private.is_invited(e.id, h.user_id))
  on conflict (user_id, key) where key is not null do nothing;
  get diagnostics v_rows = row_count;
  return v_rows;
end;
$$;

create function private.events_queue_nearby()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  perform private.queue_nearby_notices(new.id);
  return null;
end;
$$;

-- Deferred to the end of the transaction, so save_event() has added the stops
-- and co-hosts first (co-hosts never hear about their own event as "new").
-- Runs when an event is made, and again when an edit could reach new people
-- (area, time, type or invite filter changed); people already told aren't told twice.
-- push-notices sends these with the reminders in Phase 2.
create constraint trigger events_queue_nearby
  after insert or update of area, starts_at, type, invite_everyone, invite_cars, invite_bikes,
    invite_classes, invite_min_mods, invite_brands, invite_radius_miles
  on public.events
  deferrable initially deferred
  for each row execute function private.events_queue_nearby();

-- ===========================================================================
-- Find events (searchEvents() in discover.ts)
-- ===========================================================================

-- Upcoming and live events the caller can see, nearest first, then soonest.
-- * Distance is from the caller's own home (read here, never returned), or
--   from p_from_lat/p_from_lng snapped to the ~1 km grid first ("where I am").
--   It is measured to the event's rough area, never to a stop.
-- * p_max_miles: null means your travel distance (25 if never set); 1–600
--   (600 covers the whole UK: the app's "Any distance").
-- * p_types: null or empty means every type.
-- * p_when: 'any' | 'tonight' (to 5am) | 'week' (7 days) | 'weekend' (Fri 5pm
--   to Mon 5am, from now once it has started), in Europe/London time. An event
--   counts if any part of it is inside the window, so live events are "tonight".
-- * p_can_go_only: only events you'd be straight in to (host, going, invited, public).
-- * p_vehicles: 'any' | 'cars' | 'bikes' (everyone-welcome events take both).
-- Locked events come back with stop_name, stop_lat and stop_lng null: only
-- the rough area. shown_stop is the furthest stop you may see, as in events_for_me().
create function public.search_events(
  p_max_miles numeric default null,
  p_types public.event_type[] default null,
  p_when text default 'any',
  p_can_go_only boolean default false,
  p_vehicles text default 'any',
  p_from_lat double precision default null,
  p_from_lng double precision default null
)
returns table (
  event_id uuid,
  type public.event_type,
  title text,
  starts_at timestamptz,
  ends_at timestamptz,
  phase text,
  role text,
  can_go boolean,
  miles numeric,
  area_name text,
  area_lat double precision,
  area_lng double precision,
  area_radius_miles numeric,
  shown_stop int,
  stop_name text,
  stop_lat double precision,
  stop_lng double precision,
  crew_id uuid,
  route_miles numeric,
  invite_everyone boolean,
  invite_cars boolean,
  invite_bikes boolean,
  invite_classes public.class_letter[],
  invite_min_mods int,
  invite_brands text[],
  invite_radius_miles numeric
)
language plpgsql stable security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_uid uuid := private.require_uid();
  v_from extensions.geography;
  v_radius numeric;
  v_local timestamp := now() at time zone 'Europe/London';
  v_monday timestamp := date_trunc('week', now() at time zone 'Europe/London');
  v_start timestamptz;
  v_end timestamptz;
begin
  if (p_from_lat is null) <> (p_from_lng is null) then
    raise exception 'Send both latitude and longitude, or neither.';
  end if;
  if p_from_lat is not null then
    if not (p_from_lat between 49.8 and 61.0 and p_from_lng between -8.7 and 2.0) then
      raise exception 'Nightshift is UK only for now. Search from somewhere in the UK.';
    end if;
    v_from := private.fuzz(private.pt(p_from_lat, p_from_lng));
  else
    select h.home into v_from from public.profile_homes h where h.user_id = v_uid;
    if v_from is null then
      raise exception 'Set your rough home area first, or search from where you are.';
    end if;
  end if;

  v_radius := coalesce(p_max_miles, (select s.travel_miles from public.profile_settings s where s.user_id = v_uid), 25);
  if v_radius < 1 or v_radius > 600 then raise exception 'Pick a distance between 1 and 600 miles.'; end if;

  case coalesce(p_when, 'any')
    when 'any' then
      null;
    when 'tonight' then
      v_start := now();
      v_end := (date_trunc('day', v_local) + case when extract(hour from v_local) < 5 then interval '5 hours' else interval '29 hours' end)
               at time zone 'Europe/London';
    when 'week' then
      v_start := now();
      v_end := now() + interval '7 days';
    when 'weekend' then
      if v_local < v_monday + interval '5 hours' then
        -- Monday before 5am: still last weekend.
        v_start := now();
        v_end := (v_monday + interval '5 hours') at time zone 'Europe/London';
      else
        v_start := greatest(now(), (v_monday + interval '4 days 17 hours') at time zone 'Europe/London');
        v_end := (v_monday + interval '7 days 5 hours') at time zone 'Europe/London';
      end if;
    else
      raise exception 'Pick when: any time, tonight, this week or the weekend.';
  end case;

  if coalesce(p_vehicles, 'any') not in ('any', 'cars', 'bikes') then
    raise exception 'Pick cars, bikes or both.';
  end if;

  return query
  with cand as (
    select e.*, extensions.st_distance(v_from, e.area) / 1609.344 as dist
    from public.events e
    where e.cancelled_at is null
      and private.event_end(e.starts_at, e.ends_at) > now()
      and extensions.st_dwithin(v_from, e.area, private.mi(v_radius::double precision))
      and (p_types is null or cardinality(p_types) = 0 or e.type = any (p_types))
      and (coalesce(p_vehicles, 'any') = 'any' or e.invite_everyone
           or (p_vehicles = 'cars' and e.invite_cars) or (p_vehicles = 'bikes' and e.invite_bikes))
      and (v_end is null or (e.starts_at < v_end and private.event_end(e.starts_at, e.ends_at) > v_start))
  ), roled as (
    select c.*, private.event_role(c.id, v_uid) as rl from cand c
  ), shown as (
    select r.*, coalesce((
      select max(s.position)
      from public.event_stops s
      where s.event_id = r.id
        and s.position <= case when r.type = 'rolling' then r.current_stop else 0 end
        and private.can_see_stop(s.id, v_uid)
    ), -1) as sh
    from roled r
  )
  select
    x.id,
    x.type,
    x.title,
    x.starts_at,
    x.ends_at,
    case
      when now() >= x.starts_at then 'live'
      when now() >= x.starts_at - make_interval(mins => x.reveal_minutes_before) then 'revealed'
      else 'upcoming'
    end,
    x.rl,
    x.rl in ('host', 'going', 'invited', 'public'),
    round(x.dist::numeric, 1),
    x.area_name,
    extensions.st_y(x.area::extensions.geometry),
    extensions.st_x(x.area::extensions.geometry),
    x.area_radius_miles,
    x.sh,
    st.name,
    extensions.st_y(st.location::extensions.geometry),
    extensions.st_x(st.location::extensions.geometry),
    x.crew_id,
    x.route_miles,
    x.invite_everyone,
    x.invite_cars,
    x.invite_bikes,
    x.invite_classes,
    x.invite_min_mods,
    x.invite_brands,
    x.invite_radius_miles
  from shown x
  -- Only the stop the caller may see (sh >= 0 means can_see_stop() said yes).
  left join public.event_stops st on st.event_id = x.id and st.position = x.sh and x.sh >= 0
  where not coalesce(p_can_go_only, false) or x.rl in ('host', 'going', 'invited', 'public')
  order by x.dist, x.starts_at
  limit 100;
end;
$$;

-- ===========================================================================
-- Privileges. New tables get Supabase's default grants, so start from none.
-- ===========================================================================

revoke all on public.staff, public.profile_settings from anon, authenticated;
grant select on public.staff, public.profile_settings to authenticated;
grant all on public.staff, public.profile_settings to service_role;

revoke execute on function public.search_events(numeric, public.event_type[], text, boolean, text, double precision, double precision) from public, anon;
revoke execute on function public.save_travel_prefs(numeric, text) from public, anon;
grant execute on function public.search_events(numeric, public.event_type[], text, boolean, text, double precision, double precision) to authenticated, service_role;
grant execute on function public.save_travel_prefs(numeric, text) to authenticated, service_role;

revoke execute on function private.is_admin(uuid) from public, anon;
grant execute on function private.is_admin(uuid) to authenticated, service_role;
-- Only the trigger queues alerts; nobody calls these directly.
revoke execute on function private.queue_nearby_notices(uuid) from public, anon, authenticated;
revoke execute on function private.events_queue_nearby() from public, anon, authenticated;
grant execute on function private.queue_nearby_notices(uuid) to service_role;

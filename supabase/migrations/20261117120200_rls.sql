-- Nightshift backend, part 3: access helpers, Row Level Security and grants.
--
-- The helpers below are security definer so RLS policies can ask "is this
-- person a host / going / checked in?" without recursing into the policies of
-- the tables they read. They live in `private`, which the Data API doesn't
-- expose, so the app can't call them directly with someone else's id.

-- ===========================================================================
-- Who is who on an event
-- ===========================================================================

-- Named co-host, or (crew events) the crew's owner or one of its hosts.
-- Mirrors isHost() in src/lib/events.ts.
create function private.is_event_host(p_event uuid, p_user uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select p_user is not null and (
    exists (select 1 from public.event_hosts h where h.event_id = p_event and h.user_id = p_user)
    or exists (
      select 1
      from public.events e
      join public.crew_members m on m.crew_id = e.crew_id
      where e.id = p_event and m.user_id = p_user and m.role in ('owner', 'host')
    )
  )
$$;

create function private.is_going(p_event uuid, p_user uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (select 1 from public.event_going g where g.event_id = p_event and g.user_id = p_user)
$$;

-- Checked in at any stop of the event (an "attendee" in awards.ts).
create function private.has_checked_in(p_event uuid, p_user uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (select 1 from public.check_ins c where c.event_id = p_event and c.user_id = p_user)
$$;

create function private.reveal_at(p_event uuid)
returns timestamptz
language sql stable security definer
set search_path = ''
as $$
  select e.starts_at - make_interval(mins => e.reveal_minutes_before) from public.events e where e.id = p_event
$$;

-- ===========================================================================
-- THE stop visibility rule. Must match canSeeStop() in src/lib/events.ts:
--  * hosts see everything;
--  * shows and track days are public;
--  * cancelled events show nothing more;
--  * otherwise you must be going and past the reveal time;
--  * cruises and meets: then every stop;
--  * rolling meets: stop 0 from the reveal; a later stop only once the host has
--    moved on to it (position <= current_stop) AND you checked in at the stop before.
-- ===========================================================================
create function private.can_see_stop(p_stop uuid, p_user uuid)
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
  if s.position = 0 then return true; end if;
  if s.position > e.current_stop then return false; end if;
  return exists (
    select 1
    from public.check_ins c
    join public.event_stops prev on prev.id = c.stop_id
    where c.event_id = e.id
      and c.user_id = p_user
      and prev.event_id = e.id
      and prev.position = s.position - 1
  );
end;
$$;

-- ===========================================================================
-- Classes and invites (src/lib/classes.ts, src/lib/invites.ts)
-- ===========================================================================

create function private.build_class(p_build uuid)
returns public.class_letter
language sql stable security definer
set search_path = ''
as $$
  with b as (
    select
      bu.kind,
      bu.weight_kg,
      case
        when bu.dyno_bhp > 0 then bu.dyno_bhp
        else bu.stock_bhp + coalesce((
          select sum(greatest(m.bhp_gain, 0)) from public.build_mods m where m.build_id = bu.id
        ), 0)
      end as bhp
    from public.builds bu
    where bu.id = p_build
  ), f as (
    select
      kind,
      case
        when kind = 'bike' then bhp / (case when weight_kg > 0 then weight_kg else 200 end) * 1000
        else bhp * sqrt(1450 / (case when weight_kg > 0 then weight_kg else 1450 end))
      end as fig
    from b
  )
  select (case
    when kind = 'bike' then
      case when fig >= 850 then 'S' when fig >= 580 then 'A' when fig >= 380 then 'B' when fig >= 200 then 'C' else 'D' end
    else
      case when fig >= 420 then 'S' when fig >= 290 then 'A' when fig >= 190 then 'B' when fig >= 125 then 'C' else 'D' end
  end)::public.class_letter
  from f
$$;

-- buildMatches(): does one build fit an invite filter?
create function private.build_matches(
  p_build uuid,
  p_everyone boolean,
  p_cars boolean,
  p_bikes boolean,
  p_classes public.class_letter[],
  p_min_mods int,
  p_brands text[]
)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select p_everyone or (
    ((b.kind = 'car' and p_cars) or (b.kind = 'bike' and p_bikes))
    and (cardinality(p_classes) = 0 or private.build_class(b.id) = any (p_classes))
    and (select count(*) from public.build_mods m where m.build_id = b.id) >= p_min_mods
    and (
      cardinality(p_brands) = 0
      or lower(btrim(b.make)) in (select lower(btrim(x)) from unnest(p_brands) as x)
    )
  )
  from public.builds b
  where b.id = p_build
$$;

-- invitees(): home (fuzzed) inside the radius of the area, and any build
-- matching (or "everyone welcome"). The home never leaves this function.
create function private.is_invited(p_event uuid, p_user uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.events e
    join public.profile_homes h on h.user_id = p_user
    where e.id = p_event
      and extensions.st_dwithin(h.home, e.area, private.mi(e.invite_radius_miles::double precision))
      and (
        e.invite_everyone
        or exists (
          select 1 from public.builds b
          where b.owner_id = p_user
            and private.build_matches(b.id, e.invite_everyone, e.invite_cars, e.invite_bikes,
                                      e.invite_classes, e.invite_min_mods, e.invite_brands)
        )
      )
  )
$$;

-- roleOf() in src/lib/eventView.ts.
create function private.event_role(p_event uuid, p_user uuid)
returns text
language sql stable security definer
set search_path = ''
as $$
  select case
    when private.is_event_host(p_event, p_user) then 'host'
    when private.is_going(p_event, p_user) then 'going'
    when private.is_public_type(e.type) then 'public'
    when private.is_invited(p_event, p_user) then 'invited'
    when exists (select 1 from public.event_requests r where r.event_id = p_event and r.user_id = p_user and r.status = 'pending') then 'requested'
    when exists (select 1 from public.event_requests r where r.event_id = p_event and r.user_id = p_user and r.status = 'declined') then 'declined'
    else 'none'
  end
  from public.events e
  where e.id = p_event
$$;

-- ===========================================================================
-- Places: rough areas and ban zones
-- ===========================================================================

-- The rough area must hold every stop and, for private event types, sit at
-- least 0.75 mi from every stop (areaGivesAway() in area.ts). The phone works
-- the area out with area.ts; the server only checks it. Null means fine.
create function private.area_problem(p_event uuid)
returns text
language plpgsql stable security definer
set search_path = ''
as $$
declare
  e public.events;
begin
  select * into e from public.events where id = p_event;
  if exists (
    select 1 from public.event_stops s
    where s.event_id = e.id
      and not extensions.st_dwithin(e.area, s.location, private.mi(e.area_radius_miles::double precision))
  ) then
    return 'The rough area has to contain every stop.';
  end if;
  if not private.is_public_type(e.type) and exists (
    select 1 from public.event_stops s
    where s.event_id = e.id and extensions.st_dwithin(e.area, s.location, private.mi(0.75))
  ) then
    return 'The rough area is too close to a stop, so it would give the place away.';
  end if;
  return null;
end;
$$;

create function private.ban_zone_at(p extensions.geography)
returns public.ban_zones
language sql stable security definer
set search_path = ''
as $$
  select z.*
  from public.ban_zones z
  where extensions.st_dwithin(z.centre, p, private.mi(z.radius_miles::double precision))
    and (z.valid_until is null or z.valid_until >= current_date)
  order by z.name
  limit 1
$$;

-- banZoneWarning() in events.ts.
create function private.ban_zone_warning(p_place text, z public.ban_zones)
returns text
language sql immutable
set search_path = ''
as $$
  select format(
    '%s is inside the %s ban zone. Court orders here can ban organising or promoting late-night meets and cruises (often 3pm to 7am), and hosts have been taken to court. %s',
    p_place, z.name, z.note
  )
$$;

grant execute on all functions in schema private to authenticated, service_role;

-- ===========================================================================
-- Row Level Security: on for every table, policies for `authenticated` only.
-- `anon` (signed out) gets nothing. The service role bypasses RLS (Edge Functions).
-- ===========================================================================

alter table public.profiles enable row level security;
alter table public.profile_homes enable row level security;
alter table public.push_tokens enable row level security;
alter table public.builds enable row level security;
alter table public.build_mods enable row level security;
alter table public.build_photos enable row level security;
alter table public.crews enable row level security;
alter table public.crew_members enable row level security;
alter table public.partner_venues enable row level security;
alter table public.ban_zones enable row level security;
alter table public.events enable row level security;
alter table public.event_stops enable row level security;
alter table public.event_hosts enable row level security;
alter table public.event_going enable row level security;
alter table public.event_requests enable row level security;
alter table public.check_ins enable row level security;
alter table public.plan_changes enable row level security;
alter table public.chat_messages enable row level security;
alter table public.votes enable row level security;
alter table public.notices enable row level security;
alter table public.spots enable row level security;
alter table public.spot_completions enable row level security;
alter table public.spot_ratings enable row level security;
alter table public.road_closures enable row level security;

-- People ----------------------------------------------------------------------

create policy "profiles: signed-in users read" on public.profiles
  for select to authenticated using (true);

-- Your home area: only you. Nobody else can read it, ever; invites use private.is_invited().
create policy "profile_homes: owner reads" on public.profile_homes
  for select to authenticated using (user_id = (select auth.uid()));

create policy "push_tokens: owner reads" on public.push_tokens
  for select to authenticated using (user_id = (select auth.uid()));
create policy "push_tokens: owner adds" on public.push_tokens
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "push_tokens: owner removes" on public.push_tokens
  for delete to authenticated using (user_id = (select auth.uid()));

-- Garage: public to signed-in users, written by the owner ---------------------

create policy "builds: signed-in users read" on public.builds
  for select to authenticated using (true);
create policy "builds: owner adds" on public.builds
  for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "builds: owner edits" on public.builds
  for update to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "builds: owner deletes" on public.builds
  for delete to authenticated using (owner_id = (select auth.uid()));

create policy "build_mods: signed-in users read" on public.build_mods
  for select to authenticated using (true);
create policy "build_mods: owner adds" on public.build_mods
  for insert to authenticated
  with check (exists (select 1 from public.builds b where b.id = build_id and b.owner_id = (select auth.uid())));
create policy "build_mods: owner edits" on public.build_mods
  for update to authenticated
  using (exists (select 1 from public.builds b where b.id = build_id and b.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.builds b where b.id = build_id and b.owner_id = (select auth.uid())));
create policy "build_mods: owner deletes" on public.build_mods
  for delete to authenticated
  using (exists (select 1 from public.builds b where b.id = build_id and b.owner_id = (select auth.uid())));

create policy "build_photos: signed-in users read" on public.build_photos
  for select to authenticated using (true);
create policy "build_photos: owner adds" on public.build_photos
  for insert to authenticated
  with check (
    owner_id = (select auth.uid())
    and exists (select 1 from public.builds b where b.id = build_id and b.owner_id = (select auth.uid()))
  );
create policy "build_photos: owner edits" on public.build_photos
  for update to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "build_photos: owner deletes" on public.build_photos
  for delete to authenticated using (owner_id = (select auth.uid()));

-- Crews: readable; changed only through the crew RPCs --------------------------

create policy "crews: signed-in users read" on public.crews
  for select to authenticated using (true);
create policy "crew_members: signed-in users read" on public.crew_members
  for select to authenticated using (true);

create policy "partner_venues: active ones readable" on public.partner_venues
  for select to authenticated using (active);
create policy "ban_zones: signed-in users read" on public.ban_zones
  for select to authenticated using (true);
create policy "road_closures: signed-in users read" on public.road_closures
  for select to authenticated using (true);

-- Events -------------------------------------------------------------------------

-- The event row only holds the rough area (fuzzed, never on a stop), the time
-- and the filters: the same as the share text, which is "safe to post anywhere".
-- Lists for the app come from public.events_for_me(), which drops role 'none'.
create policy "events: signed-in users read" on public.events
  for select to authenticated using (true);

-- Exact places: hosts only. Everyone else uses public.get_event_stops().
create policy "event_stops: hosts read" on public.event_stops
  for select to authenticated using (private.is_event_host(event_id, (select auth.uid())));

create policy "event_hosts: signed-in users read" on public.event_hosts
  for select to authenticated using (true);

create policy "event_going: self, hosts and people going read" on public.event_going
  for select to authenticated using (
    user_id = (select auth.uid())
    or private.is_event_host(event_id, (select auth.uid()))
    or private.is_going(event_id, (select auth.uid()))
  );

create policy "event_requests: self and hosts read" on public.event_requests
  for select to authenticated using (
    user_id = (select auth.uid()) or private.is_event_host(event_id, (select auth.uid()))
  );

-- Check-ins only carry a stop id and a time, never a position.
create policy "check_ins: self, hosts and people going read" on public.check_ins
  for select to authenticated using (
    user_id = (select auth.uid())
    or private.is_event_host(event_id, (select auth.uid()))
    or private.is_going(event_id, (select auth.uid()))
  );

-- The audit log names places: hosts only.
create policy "plan_changes: hosts read" on public.plan_changes
  for select to authenticated using (private.is_event_host(event_id, (select auth.uid())));

-- Chat is for hosts and people going.
create policy "chat_messages: hosts and people going read" on public.chat_messages
  for select to authenticated using (
    private.is_event_host(event_id, (select auth.uid())) or private.is_going(event_id, (select auth.uid()))
  );
create policy "chat_messages: hosts and people going post" on public.chat_messages
  for insert to authenticated with check (
    user_id = (select auth.uid())
    and not system
    and (private.is_event_host(event_id, (select auth.uid())) or private.is_going(event_id, (select auth.uid())))
  );

-- Votes are secret: you only see your own. Results come from public.event_awards().
create policy "votes: voter reads own" on public.votes
  for select to authenticated using (voter_id = (select auth.uid()));

create policy "notices: owner reads" on public.notices
  for select to authenticated using (user_id = (select auth.uid()));
create policy "notices: owner marks read" on public.notices
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Places -------------------------------------------------------------------------

-- visibleSpots(): approved places, plus your own pending suggestions.
create policy "spots: approved or own" on public.spots
  for select to authenticated using (status = 'approved' or author_id = (select auth.uid()));

-- Who drove what, on which day, stays with that person. Counts come from public.spot_stats().
create policy "spot_completions: owner reads" on public.spot_completions
  for select to authenticated using (user_id = (select auth.uid()));
create policy "spot_ratings: owner reads" on public.spot_ratings
  for select to authenticated using (user_id = (select auth.uid()));

-- ===========================================================================
-- Table privileges. RLS decides rows; these decide which statements are possible
-- at all. Everything not granted here goes through security definer RPCs.
-- ===========================================================================

revoke all on all tables in schema public from anon, authenticated;

grant select on
  public.profiles, public.profile_homes, public.push_tokens,
  public.builds, public.build_mods, public.build_photos,
  public.crews, public.crew_members, public.partner_venues, public.ban_zones,
  public.events, public.event_stops, public.event_hosts, public.event_going,
  public.event_requests, public.check_ins, public.plan_changes, public.chat_messages,
  public.votes, public.notices, public.spots, public.spot_completions, public.spot_ratings,
  public.road_closures
to authenticated;

grant insert, update, delete on public.builds, public.build_mods, public.build_photos to authenticated;
grant insert, delete on public.push_tokens to authenticated;
grant insert (event_id, body) on public.chat_messages to authenticated;
grant update (read_at) on public.notices to authenticated;

grant all on all tables in schema public to service_role;

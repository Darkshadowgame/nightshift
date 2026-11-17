-- Nightshift backend, part 10: which vehicle you're bringing to an event.
--
-- Mirrors src/lib/bringing.ts and the vehicle rules in src/lib/events.ts:
--  * event_going and event_requests carry the build you're bringing
--    (nullable: old rows and people going without a vehicle). A composite
--    foreign key makes sure it's one of YOUR builds; deleting the build just
--    clears the choice.
--  * set_going() takes the build. Going straight in needs the invite to cover
--    that build (or a public event, "everyone welcome" or being a host). A
--    build the invite doesn't cover makes it a request, and changing to one
--    while going puts you back to asking a host, as the app does.
--  * The vehicle can change until the event starts, and at check-in (before
--    you've checked in) to say you turned up in something else.
--  * Awards: the candidates are the builds people who checked in brought.
--    Only people with no choice on record (rows from before this) fall back
--    to all their builds.
--  * Invite matching for alerts and search (private.is_invited) still looks
--    at any of your builds: it's about whether you could go at all.
--
-- Also adds the garage columns the app has used since the vehicle picker:
-- builds.vehicle_id, builds.tune_stage and builds.engine_swap.

-- ===========================================================================
-- Garage columns (src/lib/types.ts Build)
-- ===========================================================================

alter table public.builds
  -- Dataset id of the base vehicle picked in the app's vehicle picker.
  add column vehicle_id text check (char_length(btrim(vehicle_id)) between 1 and 80),
  -- One tune stage at a time (TuneStage in types.ts).
  add column tune_stage text check (tune_stage in ('stock', 'stage1', 'stage2', 'stage2plus', 'stage3', 'stage4', 'custom')),
  -- EngineSwap in types.ts: { donorMake, donorModel, donorVariant?, donorId?, bhp, torqueLbFt?, weightDeltaKg? }.
  add column engine_swap jsonb check (
    engine_swap is null or (
      jsonb_typeof(engine_swap) = 'object'
      and jsonb_typeof(engine_swap -> 'donorMake') = 'string'
      and jsonb_typeof(engine_swap -> 'donorModel') = 'string'
      and jsonb_typeof(engine_swap -> 'bhp') = 'number'
      and pg_column_size(engine_swap) <= 2048
    )
  );

-- So going/request rows can point at (build, owner) together.
alter table public.builds add constraint builds_id_owner_key unique (id, owner_id);

-- ===========================================================================
-- The build you're bringing
-- ===========================================================================

alter table public.event_going add column build_id uuid;
alter table public.event_going
  add constraint event_going_build_is_yours foreign key (build_id, user_id)
    references public.builds (id, owner_id) on delete set null (build_id);
create index event_going_build_idx on public.event_going (build_id);

alter table public.event_requests add column build_id uuid;
alter table public.event_requests
  add constraint event_requests_build_is_yours foreign key (build_id, user_id)
    references public.builds (id, owner_id) on delete set null (build_id);
create index event_requests_build_idx on public.event_requests (build_id);

-- fitsInvite() + canGoWith() in src/lib/bringing.ts: would this person go
-- straight in with this build? Hosts and public events always; otherwise a
-- home inside the radius and ("everyone welcome" or the build fits the filter).
-- With no build, the old any-build rule (private.is_invited).
create function private.can_go_with(p_event uuid, p_user uuid, p_build uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select
    private.is_event_host(p_event, p_user)
    or private.is_public_type(e.type)
    or case
      when p_build is null then private.is_invited(p_event, p_user)
      else exists (
        select 1
        from public.profile_homes h
        where h.user_id = p_user
          and extensions.st_dwithin(h.home, e.area, private.mi(e.invite_radius_miles::double precision))
          and (
            e.invite_everyone
            or private.build_matches(p_build, e.invite_everyone, e.invite_cars, e.invite_bikes,
                                     e.invite_classes, e.invite_min_mods, e.invite_brands)
          )
      )
    end
  from public.events e
  where e.id = p_event
$$;

-- awardBuilds() in src/lib/bringing.ts: the builds people who checked in
-- brought. Someone with no choice on record (old rows, or a host who never
-- tapped Going) counts with all their builds.
create function private.award_candidates(p_event uuid)
returns table (build_id uuid, owner_id uuid)
language sql stable security definer
set search_path = ''
as $$
  with att as (
    select distinct c.user_id from public.check_ins c where c.event_id = p_event
  )
  select b.id, b.owner_id
  from att
  left join public.event_going g on g.event_id = p_event and g.user_id = att.user_id
  join public.builds b on b.owner_id = att.user_id and (g.build_id is null or b.id = g.build_id)
$$;

-- ===========================================================================
-- set_going(): now with the build
-- ===========================================================================

drop function public.set_going(uuid, boolean);

-- rsvp() in src/lib/events.ts. p_build_id: the build you're bringing. Null
-- keeps what you picked before (or, the first time, your only build if you
-- have exactly one). Returns 'going', 'requested' or 'none'.
create function public.set_going(p_event_id uuid, p_going boolean, p_build_id uuid default null)
returns text
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
  e public.events;
  v_build uuid := p_build_id;
  v_going public.event_going;
  v_request public.event_requests;
  v_current uuid;
  v_had boolean;
  v_changed boolean;
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
  if v_build is not null and not exists (select 1 from public.builds b where b.id = v_build and b.owner_id = v_uid) then
    raise exception 'That isn''t one of your builds.';
  end if;

  select * into v_going from public.event_going where event_id = e.id and user_id = v_uid;
  select * into v_request from public.event_requests where event_id = e.id and user_id = v_uid and status = 'pending';
  v_had := v_going.user_id is not null or v_request.user_id is not null;
  v_current := coalesce(v_going.build_id, v_request.build_id);
  v_changed := v_build is not null and v_build is distinct from v_current;

  -- Already going and nothing new picked: nothing changes.
  if v_going.user_id is not null and not v_changed then return 'going'; end if;

  -- canChangeVehicle(): nothing changes after you've checked in, and a
  -- change (not a first pick) after the start happens at check-in.
  if v_changed and private.has_checked_in(e.id, v_uid) then
    raise exception 'You''ve checked in, so your vehicle is set for this one.';
  end if;
  if v_changed and v_had and v_current is not null and now() >= e.starts_at then
    raise exception 'It has started. Change your vehicle when you check in.';
  end if;

  if v_build is null then
    if v_had then
      v_build := v_current;  -- asking again: the same build
    elsif (select count(*) from public.builds b where b.owner_id = v_uid) = 1 then
      select b.id into v_build from public.builds b where b.owner_id = v_uid;  -- one build: that's the one
    end if;
  end if;

  if private.can_go_with(e.id, v_uid, v_build) then
    insert into public.event_going (event_id, user_id, build_id) values (e.id, v_uid, v_build)
      on conflict (event_id, user_id) do update set build_id = coalesce(excluded.build_id, public.event_going.build_id);
    delete from public.event_requests where event_id = e.id and user_id = v_uid and status = 'pending';
    return 'going';
  end if;

  if exists (select 1 from public.event_requests r where r.event_id = e.id and r.user_id = v_uid and r.status = 'declined') then
    raise exception 'A host has already said no to this one.';
  end if;

  if v_request.user_id is not null and not v_changed then return 'requested'; end if;

  -- Not covered with this build: a request a host must answer. Going in
  -- something the invite doesn't cover puts you back to asking.
  delete from public.event_going where event_id = e.id and user_id = v_uid;
  insert into public.event_requests (event_id, user_id, build_id) values (e.id, v_uid, v_build)
    on conflict (event_id, user_id) do update
      set status = 'pending',
          build_id = coalesce(excluded.build_id, public.event_requests.build_id),
          created_at = case when public.event_requests.status = 'pending' then public.event_requests.created_at else now() end,
          answered_at = null, answered_by = null
      where public.event_requests.status in ('approved', 'pending');
  return 'requested';
end;
$$;

-- answerRequest(): an approved request goes in with the build it asked with.
create or replace function public.answer_request(p_event_id uuid, p_user_id uuid, p_approve boolean)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
  v_build uuid;
begin
  if not private.is_event_host(p_event_id, v_uid) then raise exception 'Only hosts can answer requests.'; end if;
  update public.event_requests
    set status = case when p_approve then 'approved'::public.request_status else 'declined'::public.request_status end,
        answered_at = now(), answered_by = v_uid
    where event_id = p_event_id and user_id = p_user_id and status = 'pending'
    returning build_id into v_build;
  if not found then raise exception 'That request has gone.'; end if;
  if p_approve then
    insert into public.event_going (event_id, user_id, build_id) values (p_event_id, p_user_id, v_build)
      on conflict (event_id, user_id) do update set build_id = coalesce(excluded.build_id, public.event_going.build_id);
  end if;
end;
$$;

-- ===========================================================================
-- check_in(): optionally say you turned up in something else
-- ===========================================================================

drop function public.check_in(uuid, int, double precision, double precision);

-- canCheckIn() + checkIn(). p_build_id: the build you're actually in, when
-- it isn't the one you said (before your first check-in only). It must be
-- yours and one the invite covers; anything else is refused so the check-in
-- doesn't quietly skip the host. Hosts checking in with a build count as going.
create function public.check_in(
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

  insert into public.check_ins (event_id, user_id, stop_id) values (e.id, v_uid, s.id) on conflict do nothing;
end;
$$;

-- ===========================================================================
-- Votes and awards: the brought builds
-- ===========================================================================

-- castVote(): as before, but the build must be one an attendee brought.
create or replace function public.cast_vote(p_event_id uuid, p_category text, p_build_id uuid)
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
  if e.cancelled_at is not null then raise exception 'This event was cancelled.'; end if;
  if now() < e.starts_at then raise exception 'Voting opens when the event starts.'; end if;
  if now() >= private.event_end(e.starts_at, e.ends_at) + interval '24 hours' then raise exception 'Voting has closed.'; end if;
  if not private.has_checked_in(e.id, v_uid) then raise exception 'Check in at the event to vote.'; end if;
  if p_category !~ '^(best-in-show|best-car|best-bike|class-[SABCD]|stance|sound|paint|cleanest|newcomer)$' then
    raise exception 'Unknown award.';
  end if;
  select * into b from public.builds where id = p_build_id;
  if not found
     or not exists (select 1 from private.award_candidates(e.id) c where c.build_id = b.id)
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

-- results(): categories from the brought builds; only votes for builds that
-- are still candidates count.
create or replace function public.event_awards(p_event_id uuid)
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
    from e
    cross join lateral private.award_candidates(e.id) ac
    join public.builds b on b.id = ac.build_id
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
      and v.build_id in (select id from cands)
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

-- ===========================================================================
-- Execute rights (the new and re-created functions)
-- ===========================================================================

revoke execute on function public.set_going(uuid, boolean, uuid) from public, anon;
revoke execute on function public.check_in(uuid, int, double precision, double precision, uuid) from public, anon;
grant execute on function public.set_going(uuid, boolean, uuid) to authenticated, service_role;
grant execute on function public.check_in(uuid, int, double precision, double precision, uuid) to authenticated, service_role;

revoke execute on function private.can_go_with(uuid, uuid, uuid) from public, anon;
revoke execute on function private.award_candidates(uuid) from public, anon;
grant execute on function private.can_go_with(uuid, uuid, uuid) to authenticated, service_role;
grant execute on function private.award_candidates(uuid) to authenticated, service_role;

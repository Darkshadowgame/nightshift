-- Nightshift backend, part 11: what the app needs to run on the backend.
--
--  * Read views with plain lat/lng instead of PostGIS geography, so the app
--    reads events, places and your own home without parsing WKB. They are
--    security_invoker views: Row Level Security on the tables underneath
--    still decides the rows (your own home only; approved places plus your
--    own suggestions).
--  * Realtime: the tables a live event changes (the event row, chat, who's
--    going, requests, check-ins) and your notices go into the
--    supabase_realtime publication. Realtime checks RLS for every subscriber,
--    so people only hear about rows they could read anyway. Exact stops are
--    never published: the app re-reads get_event_stops() when the event row
--    changes (move_on() bumps current_stop).
--  * delete_my_account(): Apple's account-deletion rule (App Review 5.1.1(v)).
--    Deletes the auth user; every table that belongs to a person cascades
--    from it. The app removes the person's files from Storage first, through
--    the Storage API (Supabase doesn't allow deleting storage rows in SQL).

-- ===========================================================================
-- Read views
-- ===========================================================================

create view public.events_list with (security_invoker = true) as
  select
    e.id, e.type, e.title, e.description, e.starts_at, e.ends_at, e.reveal_minutes_before,
    extensions.st_y(e.area::extensions.geometry) as area_lat,
    extensions.st_x(e.area::extensions.geometry) as area_lng,
    e.area_radius_miles, e.area_name, e.current_stop, e.crew_id, e.route_miles,
    e.invite_everyone, e.invite_cars, e.invite_bikes, e.invite_classes, e.invite_min_mods,
    e.invite_brands, e.invite_radius_miles, e.created_by, e.cancelled_at, e.created_at, e.updated_at
  from public.events e;

create view public.spots_list with (security_invoker = true) as
  select
    s.id, s.kind, s.name, s.description,
    extensions.st_y(s.location::extensions.geometry) as lat,
    extensions.st_x(s.location::extensions.geometry) as lng,
    case when s.path is null then null else (
      select jsonb_agg(
               jsonb_build_object('lat', extensions.st_y(d.geom), 'lng', extensions.st_x(d.geom))
               order by d.path)
      from extensions.st_dumppoints(s.path::extensions.geometry) d
    ) end as path,
    s.miles, s.author_id, s.status, s.created_at, s.ban_zone, s.warnings, s.region
  from public.spots s;

-- Only ever your own row (profile_homes: "owner reads").
create view public.my_home with (security_invoker = true) as
  select h.user_id,
         extensions.st_y(h.home::extensions.geometry) as lat,
         extensions.st_x(h.home::extensions.geometry) as lng
  from public.profile_homes h;

revoke all on public.events_list, public.spots_list, public.my_home from anon, authenticated;
grant select on public.events_list, public.spots_list, public.my_home to authenticated;
grant all on public.events_list, public.spots_list, public.my_home to service_role;

-- ===========================================================================
-- Realtime
-- ===========================================================================

do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end;
$$;

alter publication supabase_realtime add table
  public.events, public.chat_messages, public.event_going, public.event_requests,
  public.check_ins, public.notices;

-- ===========================================================================
-- Delete my account
-- ===========================================================================

create function public.delete_my_account()
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
  v_crew uuid;
begin
  -- Crews: an owner hands over (to a host, else the longest-standing member).
  select m.crew_id into v_crew from public.crew_members m where m.user_id = v_uid;
  perform private.leave_current_crew(v_uid);
  if v_crew is not null and not exists (select 1 from public.crew_members m where m.crew_id = v_crew) then
    delete from public.crews where id = v_crew;
  end if;

  -- Events only you host that haven't finished are cancelled, so nobody is
  -- left waiting for a meet with no host. Crew events stay with the crew.
  update public.events e
    set cancelled_at = now()
    where e.cancelled_at is null
      and e.crew_id is null
      and private.event_end(e.starts_at, e.ends_at) > now()
      and exists (select 1 from public.event_hosts h where h.event_id = e.id and h.user_id = v_uid)
      and not exists (select 1 from public.event_hosts h where h.event_id = e.id and h.user_id <> v_uid);

  -- Everything else cascades from the auth user: profile, home, travel
  -- settings, builds (and their mods, photo rows and votes for them), going,
  -- requests, check-ins, chat, votes, notices, completions, ratings, push
  -- tokens. Places you suggested stay without an author; feedback stays
  -- without a sender.
  delete from auth.users where id = v_uid;
end;
$$;

revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated, service_role;

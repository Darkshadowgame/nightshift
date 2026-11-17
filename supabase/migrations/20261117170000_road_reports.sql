-- Nightshift backend, part 12: community road reports (Waze-style) and the
-- open-data closures the app shows with them.
--
-- Drivers report what's on the road from the driving view in two taps (crash,
-- hazard, roadworks, closure, traffic, mobile speed camera, police / speed
-- check). Other drivers passing answer "Still there?"; reports expire on their
-- own, are extended while people confirm them (up to a cap) and are cleared
-- after two "gone" answers in a row. Rules mirror src/lib/roadReports.ts.
--
-- Police reports (owner decision, 17 Nov 2026) are labelled "Police / speed
-- check", last 30 minutes and are never extended, and are only returned to the
-- driving view: road_reports_near() leaves them out unless the caller passes
-- context 'driving', they can't be read from the table directly, and so
-- Realtime never sends them either. They never appear on the main map or on
-- event, cruise or meet screens.
--
-- Privacy: the report's point is the only position kept, snapped to 4 decimal
-- places (about 10 m). The reporter's and voter's own positions are compared
-- and thrown away. Who reported something is never readable by other people
-- (column grants below), so a report can't be used to place a person.
--
-- Rep: +10 to the reporter when two other drivers confirm a report (at most 5
-- a day), +2 for answering "Still there?" either way (once per report, at most
-- 10 a day). Nothing for an unconfirmed report, and nothing ever for speed.

create type public.road_report_kind as enum ('crash', 'hazard', 'roadworks', 'closure', 'traffic', 'mobile_camera', 'police');
create type public.road_report_status as enum ('active', 'cleared', 'expired');
create type public.road_vote as enum ('still_there', 'gone');

-- ===========================================================================
-- Tables
-- ===========================================================================

create table public.road_reports (
  id uuid primary key default gen_random_uuid(),
  kind public.road_report_kind not null,
  -- Snapped to 4 decimal places (~10 m) by report_road().
  point extensions.geography(Point, 4326) not null,
  -- Direction of travel when reported (0-359), so the other carriageway isn't warned.
  heading smallint check (heading is null or heading between 0 and 359),
  created_by uuid references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  status public.road_report_status not null default 'active',
  confirm_count integer not null default 0 check (confirm_count >= 0),
  clear_count integer not null default 0 check (clear_count >= 0),
  -- When two other drivers had confirmed it (the reporter's rep is paid then, once).
  confirmed_at timestamptz
);
create index road_reports_point_idx on public.road_reports using gist (point);
create index road_reports_author_idx on public.road_reports (created_by, created_at);
create index road_reports_live_idx on public.road_reports (status, expires_at);

create table public.road_report_votes (
  report_id uuid not null references public.road_reports (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  vote public.road_vote not null,
  created_at timestamptz not null default now(),
  -- Order of answers (created_at ties inside one transaction).
  seq bigint generated always as identity,
  primary key (report_id, user_id)
);
create index road_report_votes_user_idx on public.road_report_votes (user_id, created_at);

-- Rep earned from road reports. Kept when the report itself is tidied away.
create table public.road_rep (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  report_id uuid references public.road_reports (id) on delete set null,
  reason text not null check (reason in ('reported', 'checked')),
  rep integer not null check (rep >= 0),
  earned_on date not null,
  created_at timestamptz not null default now(),
  constraint road_rep_once unique (user_id, report_id, reason)
);
create index road_rep_user_idx on public.road_rep (user_id, earned_on);

-- Open-data closures (import-closures): direction and road for the card, and
-- whether the whole road is shut (rerouting) or only some lanes.
alter table public.road_closures
  add column road text,
  add column direction text,
  add column full_closure boolean not null default true;

-- ===========================================================================
-- Rules (mirror src/lib/roadReports.ts)
-- ===========================================================================

-- How long a report lasts, and how long confirmations can keep it going.
create function private.road_ttl(k public.road_report_kind)
returns interval
language sql immutable parallel safe
set search_path = ''
as $$
  select case k
    when 'police' then interval '30 minutes'
    when 'mobile_camera' then interval '60 minutes'
    when 'traffic' then interval '30 minutes'
    when 'hazard' then interval '2 hours'
    when 'crash' then interval '2 hours'
    when 'roadworks' then interval '24 hours'
    when 'closure' then interval '24 hours'
  end
$$;

-- Police reports are never extended: 30 minutes from the report, full stop.
create function private.road_cap(k public.road_report_kind)
returns interval
language sql immutable parallel safe
set search_path = ''
as $$
  select case k
    when 'police' then interval '30 minutes'
    when 'mobile_camera' then interval '2 hours'
    when 'traffic' then interval '90 minutes'
    when 'hazard' then interval '4 hours'
    when 'crash' then interval '4 hours'
    when 'roadworks' then interval '72 hours'
    when 'closure' then interval '72 hours'
  end
$$;

-- The UK day (for the daily rep caps).
create function private.uk_day()
returns date
language sql stable
set search_path = ''
as $$ select (now() at time zone 'Europe/London')::date $$;

-- Mark reports whose time is up. Called by the RPCs (cheap: an index on status, expires_at).
create function private.expire_road_reports()
returns void
language sql security definer
set search_path = ''
as $$
  update public.road_reports set status = 'expired' where status = 'active' and expires_at <= now();
$$;

-- Rep for one report, once, within the daily cap (over the cap it's recorded with 0 rep).
create function private.road_award(p_user uuid, p_report uuid, p_reason text)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_rep int := case p_reason when 'reported' then 10 else 2 end;
  v_cap int := case p_reason when 'reported' then 5 else 10 end;
  v_today int;
begin
  if p_user is null then return; end if;
  select count(*) into v_today from public.road_rep r
    where r.user_id = p_user and r.reason = p_reason and r.earned_on = private.uk_day() and r.rep > 0;
  insert into public.road_rep (user_id, report_id, reason, rep, earned_on)
    values (p_user, p_report, p_reason, case when v_today >= v_cap then 0 else v_rep end, private.uk_day())
    on conflict (user_id, report_id, reason) do nothing;
end;
$$;

-- One answer to "Still there?". Checks are done by the callers.
create function private.road_answer(p_user uuid, p_report uuid, p_vote public.road_vote)
returns public.road_reports
language plpgsql security definer
set search_path = ''
as $$
declare
  r public.road_reports;
  v_gone_run int;
begin
  insert into public.road_report_votes (report_id, user_id, vote) values (p_report, p_user, p_vote);
  perform private.road_award(p_user, p_report, 'checked');

  if p_vote = 'still_there' then
    update public.road_reports t
      set confirm_count = t.confirm_count + 1,
          expires_at = least(t.created_at + private.road_cap(t.kind), greatest(t.expires_at, now() + private.road_ttl(t.kind)))
      where t.id = p_report
      returning * into r;
    if r.confirm_count >= 2 and r.confirmed_at is null then
      update public.road_reports t set confirmed_at = now() where t.id = p_report returning * into r;
      perform private.road_award(r.created_by, r.id, 'reported');
    end if;
  else
    -- Cleared after two "gone" answers with no "still there" since.
    select count(*) into v_gone_run from public.road_report_votes v
      where v.report_id = p_report and v.vote = 'gone'
        and v.seq > coalesce((select max(s.seq) from public.road_report_votes s
                               where s.report_id = p_report and s.vote = 'still_there'), 0);
    update public.road_reports t
      set clear_count = t.clear_count + 1,
          status = case when v_gone_run >= 2 then 'cleared'::public.road_report_status else t.status end
      where t.id = p_report
      returning * into r;
  end if;
  return r;
end;
$$;

-- ===========================================================================
-- RPCs
-- ===========================================================================

-- Report something on the road. (p_lat, p_lng) is the report; (p_from_lat,
-- p_from_lng) is where the phone is now, which must be within half a mile and
-- is not stored. The same kind already reported by someone else within 150 m
-- (same direction) counts as a "still there" for that report instead.
create function public.report_road(
  p_kind public.road_report_kind,
  p_lat double precision,
  p_lng double precision,
  p_heading double precision default null,
  p_from_lat double precision default null,
  p_from_lng double precision default null
)
returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
  v_at extensions.geography;
  v_heading smallint;
  v_dupe public.road_reports;
  r public.road_reports;
begin
  if p_kind is null then raise exception 'Pick what you''re reporting.'; end if;
  if p_lat is null or p_lng is null or not (p_lat between 49.8 and 61.0 and p_lng between -8.7 and 2.0) then
    raise exception 'Reports are for UK roads only.';
  end if;
  if p_from_lat is null or p_from_lng is null then
    raise exception 'Reporting needs your current location.';
  end if;
  if not extensions.st_dwithin(private.pt(p_from_lat, p_from_lng), private.pt(p_lat, p_lng), private.mi(0.5)) then
    raise exception 'You can only report within half a mile of where you are.';
  end if;
  if exists (select 1 from public.road_reports x where x.created_by = v_uid and x.created_at > now() - interval '2 minutes') then
    raise exception 'You''ve just sent a report. Try again in a couple of minutes.';
  end if;
  if (select count(*) from public.road_reports x where x.created_by = v_uid and x.created_at > now() - interval '24 hours') >= 30 then
    raise exception 'That''s the most reports for one day. Thanks for helping.';
  end if;

  perform private.expire_road_reports();
  v_at := private.pt(round(p_lat::numeric, 4)::double precision, round(p_lng::numeric, 4)::double precision);
  v_heading := case when p_heading is null or p_heading < 0 then null else (round(p_heading)::int % 360)::smallint end;

  -- Someone else got there first: that's a confirmation.
  select * into v_dupe from public.road_reports x
    where x.kind = p_kind and x.status = 'active' and x.expires_at > now()
      and x.created_by is distinct from v_uid
      and extensions.st_dwithin(x.point, v_at, 150)
      and (x.heading is null or v_heading is null or abs(((x.heading - v_heading + 540) % 360) - 180) < 90)
      and not exists (select 1 from public.road_report_votes v where v.report_id = x.id and v.user_id = v_uid)
    order by extensions.st_distance(x.point, v_at)
    limit 1;
  if found then
    r := private.road_answer(v_uid, v_dupe.id, 'still_there');
    return jsonb_build_object('id', r.id, 'merged', true, 'expires_at', r.expires_at);
  end if;

  insert into public.road_reports (kind, point, heading, created_by, expires_at)
    values (p_kind, v_at, v_heading, v_uid, now() + private.road_ttl(p_kind))
    returning * into r;

  -- Tidy up: finished reports go after two days (their rep rows stay).
  delete from public.road_reports x where x.status <> 'active' and x.expires_at < now() - interval '2 days';

  return jsonb_build_object('id', r.id, 'merged', false, 'expires_at', r.expires_at);
end;
$$;

-- Answer "Still there?" for someone else's report, within a mile of it.
create function public.vote_road_report(
  p_report_id uuid,
  p_vote public.road_vote,
  p_lat double precision default null,
  p_lng double precision default null
)
returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
  r public.road_reports;
begin
  if p_vote is null then raise exception 'Say whether it''s still there.'; end if;
  perform private.expire_road_reports();
  select * into r from public.road_reports x where x.id = p_report_id for update;
  if not found then raise exception 'That report has gone.'; end if;
  if r.status = 'expired' then raise exception 'That report has already expired.'; end if;
  if r.status = 'cleared' then raise exception 'That report has already been cleared.'; end if;
  if r.created_by = v_uid then raise exception 'You can''t confirm your own report.'; end if;
  if exists (select 1 from public.road_report_votes v where v.report_id = r.id and v.user_id = v_uid) then
    raise exception 'You''ve already answered for this one.';
  end if;
  if p_lat is null or p_lng is null then raise exception 'Answering needs your current location.'; end if;
  if not extensions.st_dwithin(private.pt(p_lat, p_lng), r.point, private.mi(1)) then
    raise exception 'You need to be within a mile of the report to answer.';
  end if;

  r := private.road_answer(v_uid, r.id, p_vote);
  return jsonb_build_object('status', r.status, 'confirm_count', r.confirm_count, 'clear_count', r.clear_count, 'expires_at', r.expires_at);
end;
$$;

-- Active reports near a point, nearest first, at most 200. Police reports only
-- for p_context 'driving' (the app only sends it from the driving view), and
-- only within 10 miles even then.
create function public.road_reports_near(
  p_lat double precision,
  p_lng double precision,
  p_radius_mi double precision default 10,
  p_context text default 'map'
)
returns table (
  id uuid, kind public.road_report_kind, lat double precision, lng double precision, heading smallint,
  created_at timestamptz, expires_at timestamptz, confirm_count int, clear_count int,
  mine boolean, my_vote public.road_vote
)
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
  v_at extensions.geography;
  v_radius double precision;
begin
  if p_lat is null or p_lng is null then raise exception 'Reports near where?'; end if;
  if coalesce(p_context, '') not in ('map', 'driving') then raise exception 'Unknown context.'; end if;
  v_at := private.pt(p_lat, p_lng);
  v_radius := private.mi(least(50, greatest(0.1, coalesce(p_radius_mi, 10))));
  perform private.expire_road_reports();
  return query
    select r.id, r.kind,
           round(extensions.st_y(r.point::extensions.geometry)::numeric, 4)::double precision,
           round(extensions.st_x(r.point::extensions.geometry)::numeric, 4)::double precision,
           r.heading, r.created_at, r.expires_at, r.confirm_count, r.clear_count,
           r.created_by = v_uid,
           (select v.vote from public.road_report_votes v where v.report_id = r.id and v.user_id = v_uid)
    from public.road_reports r
    where r.status = 'active' and r.expires_at > now()
      and extensions.st_dwithin(r.point, v_at, v_radius)
      and (r.kind <> 'police'
           or (p_context = 'driving' and extensions.st_dwithin(r.point, v_at, private.mi(10))))
    order by extensions.st_distance(r.point, v_at)
    limit 200;
end;
$$;

-- Open-data closures in force now near a point (lines as [{lat,lng}], nearest first, at most 200).
create function public.road_closures_near(
  p_lat double precision,
  p_lng double precision,
  p_radius_mi double precision default 10
)
returns table (
  id uuid, source text, kind text, description text, road text, direction text, full_closure boolean,
  lat double precision, lng double precision, path jsonb, starts_at timestamptz, ends_at timestamptz
)
language plpgsql stable security definer
set search_path = ''
as $$
declare
  v_at extensions.geography;
begin
  perform private.require_uid();
  if p_lat is null or p_lng is null then raise exception 'Closures near where?'; end if;
  v_at := private.pt(p_lat, p_lng);
  return query
    select c.id, c.source, c.kind, c.description, c.road, c.direction, c.full_closure,
           extensions.st_y(extensions.st_pointonsurface(c.geom::extensions.geometry)),
           extensions.st_x(extensions.st_pointonsurface(c.geom::extensions.geometry)),
           case when extensions.geometrytype(c.geom::extensions.geometry) = 'LINESTRING' then (
             select jsonb_agg(jsonb_build_object('lat', extensions.st_y(d.geom), 'lng', extensions.st_x(d.geom)) order by d.path)
             from extensions.st_dumppoints(c.geom::extensions.geometry) d
           ) end,
           c.starts_at, c.ends_at
    from public.road_closures c
    where (c.starts_at is null or c.starts_at <= now())
      and (c.ends_at is null or c.ends_at > now())
      and extensions.st_dwithin(c.geom, v_at, private.mi(least(50, greatest(0.1, coalesce(p_radius_mi, 10)))))
    order by extensions.st_distance(c.geom, v_at)
    limit 200;
end;
$$;

-- Road-report rep for the rep ledger: counts only, for anyone (like levels on profiles).
create function public.road_rep_for(p_user_ids uuid[])
returns table (user_id uuid, reports_confirmed int, reports_checked int, reported_rep int, checked_rep int, rep int)
language sql stable security definer
set search_path = ''
as $$
  select u.id,
         coalesce((select count(*) from public.road_rep r where r.user_id = u.id and r.reason = 'reported'), 0)::int,
         coalesce((select count(*) from public.road_rep r where r.user_id = u.id and r.reason = 'checked'), 0)::int,
         coalesce((select sum(r.rep) from public.road_rep r where r.user_id = u.id and r.reason = 'reported'), 0)::int,
         coalesce((select sum(r.rep) from public.road_rep r where r.user_id = u.id and r.reason = 'checked'), 0)::int,
         coalesce((select sum(r.rep) from public.road_rep r where r.user_id = u.id), 0)::int
  from unnest(p_user_ids) as u (id)
  where auth.uid() is not null
$$;

-- ===========================================================================
-- Access
-- ===========================================================================

alter table public.road_reports enable row level security;
alter table public.road_report_votes enable row level security;
alter table public.road_rep enable row level security;

-- Non-police reports are readable (for Realtime); police only through
-- road_reports_near(p_context => 'driving').
create policy "road_reports: signed-in users read, not police" on public.road_reports
  for select to authenticated using (kind <> 'police');
create policy "road_report_votes: own answers" on public.road_report_votes
  for select to authenticated using (user_id = (select auth.uid()));
create policy "road_rep: own rows" on public.road_rep
  for select to authenticated using (user_id = (select auth.uid()));

revoke all on public.road_reports, public.road_report_votes, public.road_rep from anon, authenticated;
-- Never who reported it.
grant select (id, kind, point, heading, created_at, expires_at, status, confirm_count, clear_count)
  on public.road_reports to authenticated;
grant select on public.road_report_votes, public.road_rep to authenticated;
grant all on public.road_reports, public.road_report_votes, public.road_rep to service_role;

revoke execute on function
  public.report_road(public.road_report_kind, double precision, double precision, double precision, double precision, double precision),
  public.vote_road_report(uuid, public.road_vote, double precision, double precision),
  public.road_reports_near(double precision, double precision, double precision, text),
  public.road_closures_near(double precision, double precision, double precision),
  public.road_rep_for(uuid[])
from public, anon;
grant execute on function
  public.report_road(public.road_report_kind, double precision, double precision, double precision, double precision, double precision),
  public.vote_road_report(uuid, public.road_vote, double precision, double precision),
  public.road_reports_near(double precision, double precision, double precision, text),
  public.road_closures_near(double precision, double precision, double precision),
  public.road_rep_for(uuid[])
to authenticated, service_role;

revoke execute on function
  private.road_award(uuid, uuid, text),
  private.road_answer(uuid, uuid, public.road_vote),
  private.expire_road_reports()
from public, anon;

-- Live updates near you (the app re-reads road_reports_near() when one arrives).
alter publication supabase_realtime add table public.road_reports;

-- Nightshift backend: a little rep for using the app (owner decision, 19 Nov 2026).
--
-- * Navigation: +5 for a finished in-app navigation, at most 3 paid a day
--   (Europe/London). complete_navigation() is called once on arrival with the
--   distance driven, the time it took, and where it started and ended. It
--   counts only for at least 2 miles and 3 minutes at an average no higher
--   than 70 mph (the national limit: the same "too quick to count" rule as
--   complete_drive(), with the motorway limit because a trip can use them),
--   never less than the straight line between start and finish, and never
--   overlapping the last finished trip. The points are compared and thrown
--   away: only the day, the time and the rep are kept. The answer never says a
--   time or a speed. The demo's simulated drives never reach the server.
-- * Road reports: +2 for posting one (a merged report is an answer instead),
--   at most 10 paid a day; +10 once two other drivers confirm it (unchanged);
--   -2 when it's cleared (two "gone" in a row) within 10 minutes of being
--   reported without ever being confirmed, once per report. Road-report rep
--   (posting, confirmations and wrong ones together) never goes below 0.
--
-- Mirrors src/lib/navRep.ts and src/lib/roadReports.ts. road_rep_for() gains
-- the new counts; the app only calls complete_navigation() once it sees them.

-- ===========================================================================
-- Road reports: posting and wrong ones
-- ===========================================================================

alter table public.road_rep drop constraint road_rep_reason_check;
alter table public.road_rep add constraint road_rep_reason_check
  check (reason in ('reported', 'checked', 'posted', 'wrong'));
alter table public.road_rep drop constraint road_rep_rep_check;
alter table public.road_rep add constraint road_rep_rep_check
  check (case when reason = 'wrong' then rep <= 0 else rep >= 0 end);

-- Rep for one report, once, within the daily cap (over the cap it's recorded
-- with 0 rep). 'wrong' has no cap: it's -2 once per report.
create or replace function private.road_award(p_user uuid, p_report uuid, p_reason text)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_rep int := case p_reason when 'reported' then 10 when 'posted' then 2 when 'wrong' then -2 else 2 end;
  v_cap int := case p_reason when 'reported' then 5 when 'posted' then 10 when 'wrong' then null else 10 end;
  v_today int := 0;
begin
  if p_user is null then return; end if;
  if v_cap is not null then
    select count(*) into v_today from public.road_rep r
      where r.user_id = p_user and r.reason = p_reason and r.earned_on = private.uk_day() and r.rep > 0;
  end if;
  insert into public.road_rep (user_id, report_id, reason, rep, earned_on)
    values (p_user, p_report, p_reason, case when v_cap is not null and v_today >= v_cap then 0 else v_rep end, private.uk_day())
    on conflict (user_id, report_id, reason) do nothing;
end;
$$;

-- One answer to "Still there?". As before, plus the wrong-report rule.
create or replace function private.road_answer(p_user uuid, p_report uuid, p_vote public.road_vote)
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
    -- Cleared as wrong: within 10 minutes of the report, never confirmed.
    if r.status = 'cleared' and v_gone_run = 2 and r.confirmed_at is null
       and now() - r.created_at <= interval '10 minutes' then
      perform private.road_award(r.created_by, r.id, 'wrong');
    end if;
  end if;
  return r;
end;
$$;

-- Report something on the road. As before, plus +2 for posting (10 a day),
-- and the rep it paid in the answer: { id, merged, expires_at, rep }.
create or replace function public.report_road(
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
  v_rep int;
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

  -- Someone else got there first: that's a confirmation (and pays as an answer).
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
    select g.rep into v_rep from public.road_rep g where g.user_id = v_uid and g.report_id = r.id and g.reason = 'checked';
    return jsonb_build_object('id', r.id, 'merged', true, 'expires_at', r.expires_at, 'rep', coalesce(v_rep, 0));
  end if;

  insert into public.road_reports (kind, point, heading, created_by, expires_at)
    values (p_kind, v_at, v_heading, v_uid, now() + private.road_ttl(p_kind))
    returning * into r;
  perform private.road_award(v_uid, r.id, 'posted');
  select g.rep into v_rep from public.road_rep g where g.user_id = v_uid and g.report_id = r.id and g.reason = 'posted';

  -- Tidy up: finished reports go after two days (their rep rows stay).
  delete from public.road_reports x where x.status <> 'active' and x.expires_at < now() - interval '2 days';

  return jsonb_build_object('id', r.id, 'merged', false, 'expires_at', r.expires_at, 'rep', coalesce(v_rep, 0));
end;
$$;

-- ===========================================================================
-- Navigation
-- ===========================================================================

-- One row per finished navigation that counted (0 rep over the daily cap).
-- No positions, no distance: the day, when it finished, how long it took, the rep.
create table public.nav_rep (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  rep integer not null check (rep >= 0),
  duration_s integer not null check (duration_s > 0),
  earned_on date not null,
  created_at timestamptz not null default now()
);
create index nav_rep_user_idx on public.nav_rep (user_id, created_at);

-- A finished in-app navigation. Returns { ok: true, rep } (rep 0 over the
-- daily cap) or { ok: false, reason } with no time or speed in it.
create function public.complete_navigation(
  p_distance_m double precision,
  p_duration_s double precision,
  p_from_lat double precision default null,
  p_from_lng double precision default null,
  p_to_lat double precision default null,
  p_to_lng double precision default null
)
returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
  v_today int;
  v_rep int;
  c_no constant text := 'That trip doesn''t count.';
begin
  if p_distance_m is null or p_duration_s is null or p_distance_m = 'NaN' or p_duration_s = 'NaN' then
    return jsonb_build_object('ok', false, 'reason', c_no);
  end if;
  -- At least 2 miles and 3 minutes; a day at most.
  if p_distance_m < 2 * 1609.344 or p_duration_s < 180 or p_duration_s > 86400 then
    return jsonb_build_object('ok', false, 'reason', c_no);
  end if;
  -- The drives check (complete_drive), with the national limit as the ceiling.
  if (p_distance_m / 1609.344) / (p_duration_s / 3600.0) > 70 then
    return jsonb_build_object('ok', false, 'reason', c_no);
  end if;
  -- Never less than the straight line (the points are compared, not stored).
  if p_from_lat is not null and p_from_lng is not null and p_to_lat is not null and p_to_lng is not null
     and extensions.st_distance(private.pt(p_from_lat, p_from_lng), private.pt(p_to_lat, p_to_lng)) > p_distance_m + 200 then
    return jsonb_build_object('ok', false, 'reason', c_no);
  end if;
  -- Trips can't overlap: this one started after the last one finished.
  if exists (select 1 from public.nav_rep n
             where n.user_id = v_uid and n.created_at > now() - make_interval(secs => p_duration_s)) then
    return jsonb_build_object('ok', false, 'reason', c_no);
  end if;

  select count(*) into v_today from public.nav_rep n
    where n.user_id = v_uid and n.earned_on = private.uk_day() and n.rep > 0;
  v_rep := case when v_today >= 3 then 0 else 5 end;
  insert into public.nav_rep (user_id, rep, duration_s, earned_on)
    values (v_uid, v_rep, round(p_duration_s)::int, private.uk_day());
  return jsonb_build_object('ok', true, 'rep', v_rep);
end;
$$;

-- ===========================================================================
-- The rep ledger: road reports and navigation, counts only, for anyone
-- ===========================================================================

drop function public.road_rep_for(uuid[]);
create function public.road_rep_for(p_user_ids uuid[])
returns table (
  user_id uuid, reports_confirmed int, reports_checked int, reported_rep int, checked_rep int, rep int,
  reports_posted int, posted_rep int, reports_wrong int, wrong_rep int, navigations int, navigation_rep int
)
language sql stable security definer
set search_path = ''
as $$
  with s as (
    select u.id,
           coalesce((select count(*) from public.road_rep r where r.user_id = u.id and r.reason = 'reported'), 0)::int as reports_confirmed,
           coalesce((select count(*) from public.road_rep r where r.user_id = u.id and r.reason = 'checked'), 0)::int as reports_checked,
           coalesce((select sum(r.rep) from public.road_rep r where r.user_id = u.id and r.reason = 'reported'), 0)::int as reported_rep,
           coalesce((select sum(r.rep) from public.road_rep r where r.user_id = u.id and r.reason = 'checked'), 0)::int as checked_rep,
           coalesce((select count(*) from public.road_rep r where r.user_id = u.id and r.reason = 'posted'), 0)::int as reports_posted,
           coalesce((select sum(r.rep) from public.road_rep r where r.user_id = u.id and r.reason = 'posted'), 0)::int as posted_rep,
           coalesce((select count(*) from public.road_rep r where r.user_id = u.id and r.reason = 'wrong'), 0)::int as reports_wrong,
           coalesce((select sum(r.rep) from public.road_rep r where r.user_id = u.id and r.reason = 'wrong'), 0)::int as wrong_rep,
           coalesce((select count(*) from public.nav_rep n where n.user_id = u.id), 0)::int as navigations,
           coalesce((select sum(n.rep) from public.nav_rep n where n.user_id = u.id), 0)::int as navigation_rep
    from unnest(p_user_ids) as u (id)
    where auth.uid() is not null
  )
  select s.id, s.reports_confirmed, s.reports_checked, s.reported_rep, s.checked_rep,
         -- Road-report rep never below 0; answers and navigation on top.
         (greatest(0, s.posted_rep + s.reported_rep + s.wrong_rep) + s.checked_rep + s.navigation_rep)::int,
         s.reports_posted, s.posted_rep, s.reports_wrong, s.wrong_rep, s.navigations, s.navigation_rep
  from s
$$;

-- ===========================================================================
-- Access
-- ===========================================================================

alter table public.nav_rep enable row level security;
create policy "nav_rep: own rows" on public.nav_rep
  for select to authenticated using (user_id = (select auth.uid()));
revoke all on public.nav_rep from anon, authenticated;
grant select on public.nav_rep to authenticated;
grant all on public.nav_rep to service_role;

revoke execute on function
  public.complete_navigation(double precision, double precision, double precision, double precision, double precision, double precision),
  public.road_rep_for(uuid[])
from public, anon;
grant execute on function
  public.complete_navigation(double precision, double precision, double precision, double precision, double precision, double precision),
  public.road_rep_for(uuid[])
to authenticated, service_role;

revoke execute on function private.road_award(uuid, uuid, text), private.road_answer(uuid, uuid, public.road_vote) from public, anon;

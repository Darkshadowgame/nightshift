-- The "Dyno proven" badge (owner rules, 18 Nov 2026). The server decides it, not
-- the phone: public.dyno_badges() works it out from build_dyno_runs with the
-- same rules as dynoBadge() in src/lib/dyno.ts. Nobody can set it: it isn't a
-- column anywhere, it's computed on every read.
--
-- 1. The build's latest run (newest day, then the later one added) has a sheet photo.
-- 2. The build's dyno_bhp (the power Class uses) matches that run within 2%:
--    a crank run as it is, a wheel run plus 15% (cars) or 10% (bikes). Edit the
--    figure by hand and the badge goes until it matches again.
-- 3. The run is under two years old (730 days); older ones read "Dyno 2023".
-- 4. Staff haven't taken the badge off that sheet (dyno_badge_removals, by the
--    sheet's Storage path, so saving the build again doesn't bring it back).

create table public.dyno_badge_removals (
  storage_path text primary key,
  build_id uuid references public.builds (id) on delete cascade,
  removed_by uuid,
  reason text,
  created_at timestamptz not null default now()
);
-- Row level security with no policies: only the definer functions below read or write it.
alter table public.dyno_badge_removals enable row level security;
revoke all on public.dyno_badge_removals from anon, authenticated;

create function public.dyno_badges(p_build_ids uuid[])
returns table (build_id uuid, run_id uuid, dyno_verified boolean, dyno_old boolean, dyno_year int, removed boolean)
language sql stable security definer
set search_path = ''
as $$
  with latest as (
    select distinct on (r.build_id) r.*
    from public.build_dyno_runs r
    where r.build_id = any (p_build_ids)
    order by r.build_id, r.run_on desc, r.position desc
  ),
  judged as (
    select l.build_id, l.id as run_id, l.run_on, l.storage_path,
      exists (select 1 from public.dyno_badge_removals x where x.storage_path = l.storage_path) as removed,
      case when l.measured_at = 'crank' then l.power_bhp
           else l.power_bhp / (1 - case b.kind when 'bike' then 0.10 else 0.15 end) end as crank,
      b.dyno_bhp
    from latest l join public.builds b on b.id = l.build_id
  )
  select j.build_id, j.run_id,
    (j.storage_path is not null and not j.removed and j.dyno_bhp is not null
      and abs(j.dyno_bhp - j.crank) <= j.crank * 0.02
      and j.run_on > (now() at time zone 'Europe/London')::date - 730) as dyno_verified,
    (j.storage_path is not null and not j.removed and j.dyno_bhp is not null
      and abs(j.dyno_bhp - j.crank) <= j.crank * 0.02
      and j.run_on <= (now() at time zone 'Europe/London')::date - 730) as dyno_old,
    extract(year from j.run_on)::int as dyno_year,
    j.removed
  from judged j
$$;
revoke execute on function public.dyno_badges(uuid[]) from public, anon;
grant execute on function public.dyno_badges(uuid[]) to authenticated, service_role;

-- Staff take the badge off a sheet that's fake or edited; it's in the audit log.
alter table public.moderation_actions drop constraint if exists moderation_actions_action_check;
alter table public.moderation_actions add constraint moderation_actions_action_check
  check (action in ('warn', 'hide', 'unhide', 'ban', 'suspend', 'lift', 'promote', 'demote', 'dismiss', 'auto_report', 'cooldown', 'remove_dyno'));

create function public.remove_dyno_badge(p_run_id uuid, p_reason text default null)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
  r public.build_dyno_runs;
begin
  if private.staff_rank(v_uid) < 1 then raise exception 'Only staff can do that.'; end if;
  select * into r from public.build_dyno_runs where id = p_run_id;
  if not found then raise exception 'That dyno run isn''t there any more.'; end if;
  if r.storage_path is null then raise exception 'That run has no sheet, so it has no badge.'; end if;
  insert into public.dyno_badge_removals (storage_path, build_id, removed_by, reason)
    values (r.storage_path, r.build_id, v_uid, nullif(left(btrim(coalesce(p_reason, '')), 300), ''))
    on conflict (storage_path) do nothing;
  perform private.log_action(v_uid, 'remove_dyno', r.owner_id, 'build', r.build_id, null,
                             coalesce(nullif(btrim(coalesce(p_reason, '')), ''), 'Fake or edited dyno sheet'));
end;
$$;
revoke execute on function public.remove_dyno_badge(uuid, text) from public, anon;
grant execute on function public.remove_dyno_badge(uuid, text) to authenticated;

-- REVIEW-10 (docs/REVIEW-10-first-user.md), owner decisions 3, 4 and 14.
--
-- 1. Mods in the same group count once (src/lib/modGroups.ts): a Stage 1 tune and an
--    ECU remap are one "engine tune". private.mod_unit() mirrors modUnit(); invites'
--    "minimum mods" (private.build_matches) counts distinct units.
-- 2. Class only uses a dyno figure that a run with a photo of its sheet backs
--    (src/lib/classes.ts effectivePower): the newest run with a sheet that staff
--    haven't taken the badge off, within 2% (a wheels run plus 15% cars / 10% bikes).
--    A typed figure with no sheet never changes Class.
-- 3. A mod can carry a short note ("BC Racing BR, 30 mm drop") from the Add a mod sheet.

alter table public.build_mods add column note text check (note is null or char_length(note) <= 80);

-- What a mod counts as. Keep the lists in step with COUNT_GROUPS in modGroups.ts
-- (quick-pick names from src/data/catalog.ts).
create function private.mod_unit(p_name text)
returns text
language sql immutable
set search_path = ''
as $$
  with n as (select lower(regexp_replace(btrim(coalesce(p_name, '')), '\s+', ' ', 'g')) as v)
  select case
    when v ~ '^((stage ?(1|2|2\+|3|4)|custom)( ecu)? (tune|re-?map|map)|(ecu )?(re-?map|flash|tune))$' then 'g:tune'
    when v in ('ecu remap', 'ecu flash', 'fuel controller / map', 'custom dyno map', 'pops and bangs map', 'anti-lag', 'de-restricted') then 'g:tune'
    when v in ('panel air filter', 'induction kit', 'cold air intake') then 'g:intake'
    when v in ('cat-back exhaust', 'turbo-back exhaust', 'full exhaust', 'slip-on / end can', 'full system exhaust', 'straight-through (no cat)') then 'g:exhaust'
    when v in ('hybrid turbo', 'big turbo conversion', 'turbo / supercharger kit') then 'g:turbo'
    when v in ('coilovers', 'lowering springs', 'air ride') then 'g:lowering'
    when v in ('aftermarket wheels', 'forged wheels') then 'g:wheels'
    else 'n:' || v
  end
  from n
$$;

create function private.mod_count(p_build uuid)
returns int
language sql stable security definer
set search_path = ''
as $$
  select count(distinct private.mod_unit(m.name))::int from public.build_mods m where m.build_id = p_build
$$;

-- The dyno figure Class may use: dyno_bhp when the newest sheet run backs it, else null.
create function private.sheet_dyno_bhp(p_build uuid)
returns numeric
language sql stable security definer
set search_path = ''
as $$
  with s as (
    select r.*
    from public.build_dyno_runs r
    where r.build_id = p_build
      and r.storage_path is not null
      and not exists (select 1 from public.dyno_badge_removals x where x.storage_path = r.storage_path)
    order by r.run_on desc, r.position desc
    limit 1
  ), c as (
    select case when s.measured_at = 'crank' then round(s.power_bhp)
                else round(s.power_bhp / (1 - case b.kind when 'bike' then 0.10 else 0.15 end)) end as crank,
           b.dyno_bhp
    from s join public.builds b on b.id = s.build_id
  )
  select c.dyno_bhp from c
  where c.dyno_bhp > 0 and abs(c.dyno_bhp - c.crank) <= c.crank * 0.02
$$;

create or replace function private.build_class(p_build uuid)
returns public.class_letter
language sql stable security definer
set search_path = ''
as $$
  with b as (
    select
      bu.kind,
      bu.weight_kg,
      coalesce(private.sheet_dyno_bhp(bu.id), bu.stock_bhp + coalesce((
        select sum(greatest(m.bhp_gain, 0)) from public.build_mods m where m.build_id = bu.id
      ), 0)) as bhp
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

create or replace function private.build_matches(
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
    and private.mod_count(b.id) >= p_min_mods
    and (
      cardinality(p_brands) = 0
      or lower(btrim(b.make)) in (select lower(btrim(x)) from unnest(p_brands) as x)
    )
  )
  from public.builds b
  where b.id = p_build
$$;

-- Same grants as the other private helpers (RLS policies reach build_matches as the caller).
revoke execute on function private.mod_unit(text), private.mod_count(uuid), private.sheet_dyno_bhp(uuid) from public, anon;
grant execute on function private.mod_unit(text), private.mod_count(uuid), private.sheet_dyno_bhp(uuid) to authenticated, service_role;

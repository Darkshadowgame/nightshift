-- REVIEW-10 owner decision 6: "People near you" is opt-in. New people start hidden;
-- everyone already here keeps what they had (no row meant shown, so they get a row
-- saying shown). people_near() treats a missing row as hidden from now on.

insert into public.profile_settings (user_id, show_in_nearby)
select p.id, true from public.profiles p
where not exists (select 1 from public.profile_settings s where s.user_id = p.id)
on conflict (user_id) do nothing;

alter table public.profile_settings alter column show_in_nearby set default false;

create or replace function public.save_community_prefs(p_show_in_nearby boolean)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
begin
  insert into public.profile_settings (user_id, show_in_nearby) values (v_uid, coalesce(p_show_in_nearby, false))
  on conflict (user_id) do update set show_in_nearby = excluded.show_in_nearby;
end;
$$;

create or replace function public.people_near(p_max_miles int default null)
returns table (user_id uuid, miles int)
language plpgsql stable security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
  v_home extensions.geography;
  v_max int;
begin
  select private.coarse(h.home) into v_home from public.profile_homes h where h.user_id = v_uid;
  if v_home is null then return; end if;
  v_max := coalesce(p_max_miles, (select s.travel_miles from public.profile_settings s where s.user_id = v_uid), 25);
  if v_max < 1 or v_max > 300 then raise exception 'Pick a distance from 1 to 300 miles.'; end if;
  return query
    select x.id, x.m from (
      select p.id, private.rough_miles(extensions.st_distance(private.coarse(h.home), v_home) / 1609.344) as m
      from public.profiles p
      join public.profile_homes h on h.user_id = p.id
      left join public.profile_settings s on s.user_id = p.id
      where p.onboarded and p.id <> v_uid
        and coalesce(s.show_in_nearby, false)
        and not private.blocked_between(v_uid, p.id)
        and extensions.st_dwithin(h.home, v_home, private.mi(v_max + 10))
    ) x
    where x.m <= v_max
    order by x.m, x.id
    limit 300;
end;
$$;

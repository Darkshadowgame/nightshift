-- Local meets and organised events (22 Nov 2026, owner decision: "separate planned meets with sponsors
-- vs local meets just for fun and culture"). The app's rules are src/lib/organised.ts.
--
-- Every meet is a local meet (the default, and everything that exists today) or an organised event: a
-- flag on the event, not a new type. Only an organised event may carry an organiser name, up to 3
-- sponsors, a ticket price and an external https ticket link (the app takes no payment). Only accounts
-- marked as organisers can post one; only staff (admins and the owner) can set that mark.
--
-- Purely additive, so phones on the older app keep working unchanged:
--   * nothing is dropped and no existing function is replaced: save_event() is NOT touched. An organised
--     event is made with save_event() as a plain meet, then marked by the new set_event_organised(),
--     which checks the organiser mark again on the server;
--   * events_list is re-created with five extra columns at the end, on top of the newest definition
--     (20261122140000_lvl_meets.sql); older apps list their columns by name and ignore the new ones;
--   * the organiser mark lives in its own table (organisers), not on profiles, so no profile view,
--     grant or older profile call changes.
-- Privacy: nothing here touches a meet point, a home or a location. The organiser table is readable by
-- the person it is about and by staff only.

-- ---------------------------------------------------------------------------
-- The organiser mark (server-controlled; staff only)
-- ---------------------------------------------------------------------------
create table public.organisers (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  note text check (note is null or char_length(note) <= 200),
  granted_by uuid,
  granted_at timestamptz not null default now()
);
alter table public.organisers enable row level security;
revoke all on public.organisers from anon, authenticated;
grant select on public.organisers to authenticated;
grant all on public.organisers to service_role;
create policy "organisers: self and staff read" on public.organisers
  for select to authenticated using (user_id = (select auth.uid()) or private.is_admin((select auth.uid())));

-- ---------------------------------------------------------------------------
-- Events: the organised flag and what only an organised event may carry
-- ---------------------------------------------------------------------------
alter table public.events add column organised boolean not null default false;
alter table public.events add column organiser_name text check (organiser_name is null or char_length(organiser_name) between 2 and 60);
alter table public.events add column sponsors jsonb not null default '[]'::jsonb
  check (jsonb_typeof(sponsors) = 'array' and jsonb_array_length(sponsors) <= 3);
alter table public.events add column ticket_pence integer check (ticket_pence is null or ticket_pence between 1 and 100000);
alter table public.events add column ticket_url text
  check (ticket_url is null or (char_length(ticket_url) <= 300 and ticket_url ~ '^https://[^\s/@?#]+\.[^\s/@?#]+([/?#]\S*)?$'));
-- A local meet never carries a sponsor, a price or a ticket link.
alter table public.events add constraint events_local_is_plain check (
  organised or (organiser_name is null and sponsors = '[]'::jsonb and ticket_pence is null and ticket_url is null)
);

create or replace view public.events_list with (security_invoker = 'true') as
  select id, type, title, description, starts_at, ends_at, reveal_minutes_before,
    extensions.st_y(area::extensions.geometry) as area_lat,
    extensions.st_x(area::extensions.geometry) as area_lng,
    area_radius_miles, area_name, current_stop, crew_id, route_miles,
    invite_everyone, invite_cars, invite_bikes, invite_classes, invite_min_mods, invite_brands, invite_radius_miles,
    created_by, cancelled_at, created_at, updated_at,
    allow_invites,
    capacity, rules,
    organised, organiser_name, sponsors, ticket_pence, ticket_url
  from public.events e;

-- ---------------------------------------------------------------------------
-- Staff: mark or unmark an organiser (admins and the owner)
-- ---------------------------------------------------------------------------
create or replace function public.is_organiser(p_user uuid) returns boolean
  language plpgsql stable security definer set search_path to '' as $$
declare
  v_uid uuid := private.require_uid();
begin
  if p_user <> v_uid and not private.is_admin(v_uid) then raise exception 'Only staff can do that.'; end if;
  return exists (select 1 from public.organisers o where o.user_id = p_user);
end;
$$;

create or replace function public.set_organiser(p_user uuid, p_on boolean, p_reason text) returns void
  language plpgsql security definer set search_path to '' as $$
declare
  v_uid uuid := private.require_uid();
  v_reason text := btrim(coalesce(p_reason, ''));
begin
  if private.staff_rank(v_uid) < 2 then raise exception 'Only admins and the owner can do that.'; end if;
  if p_on is null then raise exception 'Say whether to allow or remove it.'; end if;
  if char_length(v_reason) not between 3 and 200 then raise exception 'Give a reason (3 to 200 characters).'; end if;
  if not exists (select 1 from public.profiles p where p.id = p_user and p.onboarded) then raise exception 'That person isn''t on Slipstream any more.'; end if;
  if p_on then
    insert into public.organisers (user_id, note, granted_by) values (p_user, v_reason, v_uid)
      on conflict (user_id) do update set note = excluded.note, granted_by = excluded.granted_by, granted_at = now();
    perform private.moderation_notice(p_user, 'organiser:' || to_char(clock_timestamp(), 'YYYYMMDDHH24MISSUS'), 'You can post organised events',
      'Your account can now post organised events, with sponsors and a ticket link. Local meets stay free of sponsors and tickets.');
  else
    delete from public.organisers where user_id = p_user;
    perform private.moderation_notice(p_user, 'organiser:' || to_char(clock_timestamp(), 'YYYYMMDDHH24MISSUS'), 'Organiser mark removed',
      'Your account can only post local meets now.');
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- A host marks their event organised (organisers only), or clears it back to a local meet
-- ---------------------------------------------------------------------------
create or replace function public.set_event_organised(
  p_event_id uuid, p_organised boolean, p_organiser text, p_sponsors jsonb, p_ticket_pence integer, p_ticket_url text
) returns void
  language plpgsql security definer set search_path to '' as $$
declare
  v_uid uuid := private.require_uid();
  e public.events;
  v_name text := regexp_replace(btrim(coalesce(p_organiser, '')), '\s+', ' ', 'g');
  v_url text := btrim(coalesce(p_ticket_url, ''));
  v_clean jsonb := '[]'::jsonb;
  v_item jsonb;
  v_sname text;
  v_shop text;
begin
  select * into e from public.events where id = p_event_id;
  if not found then raise exception 'Event not found.'; end if;
  if not private.is_event_host(e.id, v_uid) then raise exception 'Only hosts can change that.'; end if;
  if e.cancelled_at is not null then raise exception 'This event was cancelled.'; end if;
  if now() >= private.event_end(e.starts_at, e.ends_at) then raise exception 'This event has finished.'; end if;

  -- Back to a local meet: everything commercial goes.
  if p_organised is not true then
    update public.events set organised = false, organiser_name = null, sponsors = '[]'::jsonb, ticket_pence = null, ticket_url = null where id = e.id;
    return;
  end if;

  perform private.check_not_suspended(v_uid);
  if not exists (select 1 from public.organisers o where o.user_id = v_uid) then
    raise exception 'Only organiser accounts can post organised events.';
  end if;
  if private.rate_count(v_uid, 'organised_event', interval '1 hour') >= 20 then raise exception 'Slow down a little.'; end if;
  perform private.rate_hit(v_uid, 'organised_event');

  if char_length(v_name) not between 2 and 60 then raise exception 'Say who is organising it (2 to 60 characters).'; end if;
  perform private.check_public_text(v_name);

  if p_sponsors is not null and jsonb_typeof(p_sponsors) <> 'array' then raise exception 'Sponsors must be a list.'; end if;
  for v_item in select * from jsonb_array_elements(coalesce(p_sponsors, '[]'::jsonb)) loop
    if jsonb_typeof(v_item) <> 'object' or jsonb_typeof(v_item -> 'name') is distinct from 'string' then raise exception 'Each sponsor needs a name.'; end if;
    v_sname := regexp_replace(btrim(v_item ->> 'name'), '\s+', ' ', 'g');
    if v_sname = '' then continue; end if;
    if char_length(v_sname) > 40 then raise exception 'Keep each sponsor name under 40 characters.'; end if;
    perform private.check_public_text(v_sname);
    if exists (select 1 from jsonb_array_elements(v_clean) c where lower(c ->> 'name') = lower(v_sname)) then continue; end if;
    v_shop := nullif(btrim(coalesce(v_item ->> 'shop', '')), '');
    if v_shop is not null and v_shop !~ '^(partner:)?[A-Za-z0-9._:-]{1,70}$' then raise exception 'That shop link isn''t one Slipstream knows.'; end if;
    v_clean := v_clean || jsonb_build_array(case when v_shop is null then jsonb_build_object('name', v_sname) else jsonb_build_object('name', v_sname, 'shop', v_shop) end);
  end loop;
  if jsonb_array_length(v_clean) > 3 then raise exception 'An event can have up to 3 sponsors.'; end if;

  if p_ticket_pence is not null and p_ticket_pence not between 1 and 100000 then raise exception 'Pick a ticket price from £0.01 to £1,000, or leave it empty.'; end if;
  if v_url <> '' and (char_length(v_url) > 300 or v_url !~ '^https://[^\s/@?#]+\.[^\s/@?#]+([/?#]\S*)?$') then
    raise exception 'The ticket link must start with https:// and be a web address.';
  end if;

  update public.events
    set organised = true, organiser_name = v_name, sponsors = v_clean, ticket_pence = p_ticket_pence, ticket_url = nullif(v_url, '')
    where id = e.id;
end;
$$;

revoke all on function public.is_organiser(uuid) from public, anon;
revoke all on function public.set_organiser(uuid, boolean, text) from public, anon;
revoke all on function public.set_event_organised(uuid, boolean, text, jsonb, integer, text) from public, anon;
grant execute on function public.is_organiser(uuid) to authenticated;
grant execute on function public.set_organiser(uuid, boolean, text) to authenticated;
grant execute on function public.set_event_organised(uuid, boolean, text, jsonb, integer, text) to authenticated;

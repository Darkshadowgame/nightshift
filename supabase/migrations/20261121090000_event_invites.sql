-- Bring your mates (owner request, 19 Nov 2026): after you say you're going, invite your
-- connections to the event. The app's rules are src/lib/eventInvites.ts.
--
-- * events.allow_invites: the host's "Let people invite their connections" (on by default).
-- * event_invites: who invited whom. Only the inviter and the invitee can read a row.
-- * invite_connections(event, user_ids): hosts and people going invite accepted connections
--   (never blocked people, either way), at most 20 per event per person and 100 a day. Each
--   invitee gets a notice and the event's card in the 1-to-1 chat.
-- * events_for_me() lists an event you were invited to even when the invite rules leave you
--   out (role 'shared'). Being invited never shows the meet point: get_event_stops() still uses
--   can_see_stop(), which needs you going and the reveal time. Joining goes through set_going()
--   as before, so someone the rules leave out asks to go and a host answers.
-- * request_inviters(event_ids): hosts see who invited the people asking to go.

alter table public.events add column allow_invites boolean not null default true;

create or replace view public.events_list with (security_invoker = 'true') as
  select id, type, title, description, starts_at, ends_at, reveal_minutes_before,
    extensions.st_y(area::extensions.geometry) as area_lat,
    extensions.st_x(area::extensions.geometry) as area_lng,
    area_radius_miles, area_name, current_stop, crew_id, route_miles,
    invite_everyone, invite_cars, invite_bikes, invite_classes, invite_min_mods, invite_brands, invite_radius_miles,
    created_by, cancelled_at, created_at, updated_at,
    allow_invites
  from public.events e;

create table public.event_invites (
  event_id uuid not null references public.events (id) on delete cascade,
  inviter_id uuid not null references public.profiles (id) on delete cascade,
  invitee_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (event_id, inviter_id, invitee_id),
  constraint event_invites_not_self check (inviter_id <> invitee_id)
);
create index event_invites_invitee_idx on public.event_invites (invitee_id, event_id);

alter table public.event_invites enable row level security;
revoke all on public.event_invites from anon, authenticated;
grant select on public.event_invites to authenticated;
grant all on public.event_invites to service_role;
create policy "event_invites: inviter and invitee read" on public.event_invites
  for select to authenticated using (inviter_id = (select auth.uid()) or invitee_id = (select auth.uid()));

-- Invited by someone you haven't blocked (and who hasn't blocked you).
create or replace function private.was_invited(p_event uuid, p_user uuid) returns boolean
  language sql stable security definer set search_path to '' as $$
  select p_user is not null and exists (
    select 1 from public.event_invites i
    where i.event_id = p_event and i.invitee_id = p_user and not private.blocked_between(i.inviter_id, i.invitee_id)
  )
$$;
revoke all on function private.was_invited(uuid, uuid) from public, anon, authenticated;

-- The event list: as before, plus events a connection invited you to.
create or replace function public.events_for_me(p_past_days integer default 7)
  returns table(event_id uuid, role text, phase text, shown_stop integer)
  language sql stable security definer set search_path to '' as $$
  select e.id, case when r.role = 'none' then 'shared' else r.role end, p.phase, coalesce(st.shown, -1)
  from public.events e
  cross join lateral (select private.event_role(e.id, auth.uid()) as role) r
  cross join lateral (
    select case
      when e.cancelled_at is not null then 'cancelled'
      when now() >= private.event_end(e.starts_at, e.ends_at) then 'over'
      when now() >= e.starts_at then 'live'
      when now() >= e.starts_at - make_interval(mins => e.reveal_minutes_before) then 'revealed'
      else 'upcoming'
    end as phase
  ) p
  cross join lateral (
    select max(s.position) as shown
    from public.event_stops s
    where s.event_id = e.id
      and s.position <= case when e.type = 'rolling' then e.current_stop else 0 end
      and private.can_see_stop(s.id, auth.uid())
  ) st
  where private.event_end(e.starts_at, e.ends_at) > now() - make_interval(days => greatest(p_past_days, 0))
    and (r.role <> 'none' or private.was_invited(e.id, auth.uid()))
  order by e.starts_at
$$;

-- The host's switch (the host form's "Let people invite their connections").
create or replace function public.set_event_invites(p_event_id uuid, p_on boolean) returns void
  language plpgsql security definer set search_path to '' as $$
declare
  v_uid uuid := private.require_uid();
begin
  if not private.is_event_host(p_event_id, v_uid) then raise exception 'Only hosts can change that.'; end if;
  update public.events set allow_invites = coalesce(p_on, true) where id = p_event_id;
end;
$$;

create or replace function public.invite_connections(p_event_id uuid, p_user_ids uuid[]) returns integer
  language plpgsql security definer set search_path to '' as $$
declare
  v_uid uuid := private.require_uid();
  e public.events;
  v_ids uuid[];
  v_new uuid[];
  v_id uuid;
  v_had int;
  v_handle text;
  v_key text;
  v_conv uuid;
  v_share jsonb;
  m public.messages;
begin
  select * into e from public.events where id = p_event_id;
  if not found then raise exception 'Event not found.'; end if;
  if e.cancelled_at is not null then raise exception 'This event was cancelled.'; end if;
  if now() >= private.event_end(e.starts_at, e.ends_at) then raise exception 'This event has finished.'; end if;
  if not e.allow_invites then raise exception 'The host has turned off invites for this one.'; end if;
  if not (private.is_event_host(e.id, v_uid) or private.is_going(e.id, v_uid)) then
    raise exception 'Say you''re going first, then invite your connections.';
  end if;
  perform private.check_not_suspended(v_uid);

  select coalesce(array_agg(distinct x), '{}') into v_ids from unnest(coalesce(p_user_ids, '{}')) x where x is not null;
  if cardinality(v_ids) = 0 then raise exception 'Pick someone to invite.'; end if;
  foreach v_id in array v_ids loop
    if v_id = v_uid or not private.are_connected(v_uid, v_id) or private.blocked_between(v_uid, v_id) then
      raise exception 'You can only invite people you''re connected with.';
    end if;
  end loop;

  -- New ones only: already invited by you, hosting or going need nothing more.
  select coalesce(array_agg(x), '{}') into v_new from unnest(v_ids) x
  where not exists (select 1 from public.event_invites i where i.event_id = e.id and i.inviter_id = v_uid and i.invitee_id = x)
    and not private.is_event_host(e.id, x) and not private.is_going(e.id, x);
  if cardinality(v_new) = 0 then return 0; end if;

  select count(*) into v_had from public.event_invites i where i.event_id = e.id and i.inviter_id = v_uid;
  if v_had + cardinality(v_new) > 20 then
    raise exception 'You can invite up to 20 people to one event.';
  end if;
  if private.rate_count(v_uid, 'invite', interval '1 day') + cardinality(v_new) > 100 then
    raise exception 'That''s the most invites for one day.';
  end if;

  select p.handle into v_handle from public.profiles p where p.id = v_uid;
  v_share := jsonb_build_object(
    'kind', 'event', 'id', e.id::text, 'title', left(e.title, 120),
    'subtitle', left(format('%s · %s · %s',
      case e.type when 'cruise' then 'Cruise' when 'rolling' then 'Rolling meet' when 'meet' then 'Meet' when 'show' then 'Show' else 'Track day' end,
      to_char(e.starts_at at time zone 'Europe/London', 'Dy HH24:MI'), e.area_name), 160));

  foreach v_id in array v_new loop
    perform private.rate_hit(v_uid, 'invite');
    insert into public.event_invites (event_id, inviter_id, invitee_id) values (e.id, v_uid, v_id);

    insert into public.notices (user_id, event_id, kind, key, title, body, url)
      values (v_id, e.id, 'system', format('ns.%s.invite.%s', e.id, v_uid),
              format('@%s invited you to %s', coalesce(v_handle, 'someone'), e.title),
              'Open it to see when and roughly where.', '/event/' || e.id::text)
      on conflict do nothing;

    -- The card in your 1-to-1 chat (start_direct() and send_message() without the per-minute limit:
    -- the 20-a-meet cap above is the limit here).
    v_key := least(v_uid, v_id)::text || ':' || greatest(v_uid, v_id)::text;
    select c.id into v_conv from public.conversations c where c.direct_key = v_key;
    if v_conv is null then
      insert into public.conversations (kind, created_by, direct_key) values ('direct', v_uid, v_key) returning id into v_conv;
    end if;
    insert into public.conversation_members (conversation_id, user_id, role)
      values (v_conv, v_uid, 'member'), (v_conv, v_id, 'member') on conflict do nothing;
    insert into public.messages (conversation_id, sender_id, body, share)
      values (v_conv, v_uid, '', v_share) returning * into m;
    update public.conversations c set last_message_at = m.created_at where c.id = v_conv;
    update public.conversation_members cm set last_read_at = m.created_at where cm.conversation_id = v_conv and cm.user_id = v_uid;
    v_conv := null;
  end loop;
  return cardinality(v_new);
end;
$$;

-- Hosts: who invited the people asking to go ("Invited by @dan").
create or replace function public.request_inviters(p_event_ids uuid[])
  returns table(event_id uuid, user_id uuid, inviter_id uuid)
  language sql stable security definer set search_path to '' as $$
  select distinct on (r.event_id, r.user_id) r.event_id, r.user_id, i.inviter_id
  from public.event_requests r
  join public.event_invites i on i.event_id = r.event_id and i.invitee_id = r.user_id
  where r.event_id = any (p_event_ids)
    and r.status = 'pending'
    and private.is_event_host(r.event_id, auth.uid())
  order by r.event_id, r.user_id, i.created_at
$$;

revoke all on function public.set_event_invites(uuid, boolean) from public, anon;
revoke all on function public.invite_connections(uuid, uuid[]) from public, anon;
revoke all on function public.request_inviters(uuid[]) from public, anon;
grant execute on function public.set_event_invites(uuid, boolean) to authenticated;
grant execute on function public.invite_connections(uuid, uuid[]) to authenticated;
grant execute on function public.request_inviters(uuid[]) to authenticated;

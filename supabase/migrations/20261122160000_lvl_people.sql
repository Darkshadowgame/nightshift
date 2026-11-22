-- People, crews and blocking (Slipstream "level up", people area).
--
-- 1. Crew emblem: crews.emblem is one of the app's built-in emblems (a shape and a paint swatch, like
--    'bolt-2'). Set only through set_crew_emblem() by the crew's owner. Nothing is uploaded.
-- 2. Same model near you: people in YOUR REGION with the same make and model as one of your vehicles.
--    Region only: no distance, no place. Opt out with set_same_model_hidden(); opting out hides you from
--    the list and the list from you. Blocked people (either way) and people you are already connected to
--    never appear.
-- 3. Blocking that really blocks: the app already hid people you blocked. These policies also hide YOU
--    from the person you blocked, in forum threads and replies, event chat, going lists, event requests
--    and crew member lists (before this, forum and event chat only hid one way).
--
-- Purely additive, so older apps keep working:
--   * no existing function, view, table, policy or grant is replaced or dropped;
--   * the new column is nullable and older apps list their columns explicitly;
--   * the policies are RESTRICTIVE and only ever remove rows that involve someone you have a block with
--     either way, which older apps never showed anyway, so nothing they rely on changes.
-- Until it is applied the new app hides Same model near you and tells a crew owner emblems are not on yet.

-- ===========================================================================
-- 1. Crew emblem
-- ===========================================================================

alter table public.crews
  add column if not exists emblem text
  check (emblem is null or emblem ~ '^(shield|bolt|wheel|flag|star|chevron)-[0-7]$');

create function public.set_crew_emblem(p_crew_id uuid, p_emblem text)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
  v_emblem text := nullif(btrim(coalesce(p_emblem, '')), '');
begin
  if not exists (select 1 from public.crews c where c.id = p_crew_id) then
    raise exception 'That crew no longer exists.';
  end if;
  if not exists (
    select 1 from public.crew_members o where o.crew_id = p_crew_id and o.user_id = v_uid and o.role = 'owner'
  ) then
    raise exception 'Only the crew owner can change the emblem.';
  end if;
  if v_emblem is not null and v_emblem !~ '^(shield|bolt|wheel|flag|star|chevron)-[0-7]$' then
    raise exception 'Pick one of the emblems on the list.';
  end if;
  perform private.check_not_suspended(v_uid);
  if private.rate_count(v_uid, 'crew_emblem', interval '1 day') >= 30 then
    raise exception 'That''s the most emblem changes for one day.';
  end if;
  perform private.rate_hit(v_uid, 'crew_emblem');
  update public.crews set emblem = v_emblem where id = p_crew_id;
end;
$$;
revoke all on function public.set_crew_emblem(uuid, text) from public, anon;
grant execute on function public.set_crew_emblem(uuid, text) to authenticated, service_role;

-- ===========================================================================
-- 2. Same model near you
-- ===========================================================================

alter table public.profile_settings add column if not exists hide_same_model boolean not null default false;

-- Opt out (true) or back in (false). Only your own row.
create function public.set_same_model_hidden(p_hide boolean)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
begin
  if private.rate_count(v_uid, 'same_model_pref', interval '1 day') >= 60 then
    raise exception 'That''s the most changes for one day.';
  end if;
  perform private.rate_hit(v_uid, 'same_model_pref');
  insert into public.profile_settings (user_id, hide_same_model) values (v_uid, coalesce(p_hide, false))
  on conflict (user_id) do update set hide_same_model = excluded.hide_same_model;
end;
$$;
revoke all on function public.set_same_model_hidden(boolean) from public, anon;
grant execute on function public.set_same_model_hidden(boolean) to authenticated, service_role;

-- Ids only, in your own region (profiles.region), never a distance. Make and model are compared without
-- case, spaces or punctuation ("MX-5" matches "mx5").
create function public.same_model_near()
returns table (user_id uuid)
language plpgsql stable security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
  v_region text;
begin
  select lower(btrim(p.region)) into v_region from public.profiles p where p.id = v_uid and p.onboarded;
  if v_region is null or v_region = '' then return; end if;
  if coalesce((select s.hide_same_model from public.profile_settings s where s.user_id = v_uid), false) then return; end if;
  return query
    select p.id
    from public.profiles p
    left join public.profile_settings s on s.user_id = p.id
    where p.onboarded
      and p.id <> v_uid
      and lower(btrim(p.region)) = v_region
      and not coalesce(s.hide_same_model, false)
      and not private.blocked_between(v_uid, p.id)
      and not private.are_connected(v_uid, p.id)
      and exists (
        select 1
        from public.builds theirs
        join public.builds mine on mine.owner_id = v_uid
          and lower(regexp_replace(mine.make || '|' || mine.model, '[^a-zA-Z0-9|]', '', 'g'))
            = lower(regexp_replace(theirs.make || '|' || theirs.model, '[^a-zA-Z0-9|]', '', 'g'))
        where theirs.owner_id = p.id
      )
    order by p.handle, p.id
    limit 12;
end;
$$;
revoke all on function public.same_model_near() from public, anon;
grant execute on function public.same_model_near() to authenticated, service_role;

-- ===========================================================================
-- 3. Blocking both ways
-- ===========================================================================
-- Restrictive: on top of each table's own read policy. Staff keep their view for moderation.

create policy "forum_threads: not across a block" on public.forum_threads
  as restrictive for select to authenticated using (
    private.is_admin((select auth.uid())) or not private.blocked_between((select auth.uid()), author_id)
  );

create policy "forum_replies: not across a block" on public.forum_replies
  as restrictive for select to authenticated using (
    private.is_admin((select auth.uid())) or not private.blocked_between((select auth.uid()), author_id)
  );

create policy "chat_messages: not across a block" on public.chat_messages
  as restrictive for select to authenticated using (
    private.is_admin((select auth.uid())) or not private.blocked_between((select auth.uid()), user_id)
  );

create policy "event_going: not across a block" on public.event_going
  as restrictive for select to authenticated using (
    user_id = (select auth.uid()) or not private.blocked_between((select auth.uid()), user_id)
  );

create policy "event_requests: not across a block" on public.event_requests
  as restrictive for select to authenticated using (
    user_id = (select auth.uid()) or not private.blocked_between((select auth.uid()), user_id)
  );

create policy "crew_members: not across a block" on public.crew_members
  as restrictive for select to authenticated using (
    user_id = (select auth.uid()) or not private.blocked_between((select auth.uid()), user_id)
  );

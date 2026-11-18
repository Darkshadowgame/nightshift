-- Nightshift backend: moderation for all user content (App Store 1.2).
--
--  * Report anything: event chat lines, events, crews and suggested places
--    join the Community targets in report_content(). Three people reporting a
--    chat line hides it, like a post.
--  * Blocks reach event chat: lines from people you blocked aren't readable
--    (so Realtime doesn't send them either).
--  * Suspensions: staff suspend a person (for some days, or until lifted). A
--    suspended person can't post, reply, comment, message, ask to connect,
--    start a group or write in event chat. They can still read, report and
--    delete their account.
--  * Staff work the queue from the app (Settings › Moderation, shown only to
--    staff) through moderation_queue and moderate_report(): dismiss, hide,
--    restore, or suspend the person.

-- ===========================================================================
-- Event chat: hidden lines and blocks
-- ===========================================================================

alter table public.chat_messages add column if not exists hidden_at timestamptz;

-- Restrictive: on top of "hosts and people going read".
create policy "chat_messages: not hidden, not from people you blocked" on public.chat_messages
  as restrictive for select to authenticated using (
    private.is_admin((select auth.uid()))
    or ((hidden_at is null or user_id = (select auth.uid())) and not private.i_blocked((select auth.uid()), user_id))
  );

-- ===========================================================================
-- Suspensions
-- ===========================================================================

create table public.suspensions (
  user_id uuid primary key references auth.users (id) on delete cascade,
  reason text check (char_length(reason) <= 500),
  -- Null: until staff lift it.
  until timestamptz,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.suspensions enable row level security;
-- You can see your own suspension (the app explains it); staff see them all.
create policy "suspensions: own, staff all" on public.suspensions
  for select to authenticated using (user_id = (select auth.uid()) or private.is_admin((select auth.uid())));
revoke all on public.suspensions from anon, authenticated;
grant select on public.suspensions to authenticated;
grant all on public.suspensions to service_role;

create function private.is_suspended(p_user uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (select 1 from public.suspensions s where s.user_id = p_user and (s.until is null or s.until > now()))
$$;

create function private.check_not_suspended(p_user uuid)
returns void
language plpgsql stable security definer
set search_path = ''
as $$
begin
  if private.is_suspended(p_user) then
    raise exception 'Your account is suspended, so you can''t post or message right now. You can still read and report.';
  end if;
end;
$$;

-- Every Community write records a rate hit first: the suspension check goes
-- there (reports and build ratings stay allowed).
create or replace function private.rate_hit(p_user uuid, p_kind text)
returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  if p_kind not in ('report', 'rate_build') then perform private.check_not_suspended(p_user); end if;
  delete from private.rate_hits h where h.user_id = p_user and h.kind = p_kind and h.at < now() - interval '1 day';
  insert into private.rate_hits (user_id, kind) values (p_user, p_kind);
end;
$$;
revoke execute on function private.rate_hit(uuid, text) from public, anon, authenticated;

-- Event chat is a direct insert: a restrictive policy keeps suspended people out.
create policy "chat_messages: not while suspended" on public.chat_messages
  as restrictive for insert to authenticated with check (not private.is_suspended((select auth.uid())));

-- 1-to-1 chats: start_direct() doesn't record a hit, so check here too.
create or replace function private.check_can_add(p_uid uuid, p_user uuid)
returns void
language plpgsql stable security definer
set search_path = ''
as $$
begin
  perform private.check_not_suspended(p_uid);
  if p_user is null or p_user = p_uid then raise exception 'Pick someone else.'; end if;
  if not private.are_connected(p_uid, p_user) or private.blocked_between(p_uid, p_user) then
    raise exception 'You can only message people you''re connected with.';
  end if;
end;
$$;

-- Am I staff, and am I suspended? (the app's Settings › Moderation and the composer note)
create function public.my_moderation_status()
returns table (is_staff boolean, suspended_until timestamptz, suspended boolean)
language sql stable security definer
set search_path = ''
as $$
  select private.is_admin(auth.uid()),
         (select s.until from public.suspensions s where s.user_id = auth.uid()),
         private.is_suspended(auth.uid())
  where auth.uid() is not null
$$;

-- ===========================================================================
-- Reports on everything
-- ===========================================================================

create or replace function public.report_content(p_target public.report_target, p_target_id uuid, p_reason public.report_reason, p_note text default null)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
  v_user uuid;
  v_excerpt text;
  v_count int;
begin
  if p_target = 'thread' then
    select t.author_id, t.title || E'\n' || t.body into v_user, v_excerpt from public.forum_threads t where t.id = p_target_id;
  elsif p_target = 'reply' then
    select r.author_id, r.body into v_user, v_excerpt from public.forum_replies r where r.id = p_target_id;
  elsif p_target = 'message' then
    select m.sender_id, m.body || coalesce(' [photo ' || m.photo_path || ']', '') into v_user, v_excerpt
      from public.messages m where m.id = p_target_id and private.is_member(m.conversation_id, v_uid);
  elsif p_target = 'post' then
    select p.author_id, p.body || coalesce(' [' || cardinality(p.photos) || ' photos]', '') into v_user, v_excerpt
      from public.posts p where p.id = p_target_id and private.can_see_post(p.id, v_uid);
  elsif p_target = 'comment' then
    select c.author_id, c.body into v_user, v_excerpt
      from public.post_comments c where c.id = p_target_id and private.can_see_post(c.post_id, v_uid);
  elsif p_target = 'profile' then
    select p.id, '@' || p.handle || ' · ' || coalesce(p.display_name, '') into v_user, v_excerpt from public.profiles p where p.id = p_target_id;
  elsif p_target = 'build' then
    select b.owner_id, b.make || ' ' || b.model || coalesce(' "' || b.nickname || '"', '') into v_user, v_excerpt
      from public.builds b where b.id = p_target_id;
  elsif p_target = 'chat' then
    -- Event chat: only lines you can read (you're a host or going).
    select c.user_id, c.body into v_user, v_excerpt
      from public.chat_messages c
      where c.id = p_target_id and not c.system
        and (private.is_event_host(c.event_id, v_uid) or private.is_going(c.event_id, v_uid));
  elsif p_target = 'event' then
    select e.created_by, e.title || coalesce(E'\n' || e.description, '') || ' · ' || e.area_name into v_user, v_excerpt
      from public.events e where e.id = p_target_id;
  elsif p_target = 'crew' then
    select coalesce((select m.user_id from public.crew_members m where m.crew_id = c.id and m.role = 'owner' limit 1), c.created_by),
           c.name || ' [' || c.tag || ']' into v_user, v_excerpt
      from public.crews c where c.id = p_target_id;
  elsif p_target = 'spot' then
    select s.author_id, s.name || coalesce(E'\n' || s.description, '') into v_user, v_excerpt
      from public.spots s where s.id = p_target_id and s.author_id is not null;
  end if;
  if v_excerpt is null then raise exception 'That isn''t there any more.'; end if;
  if v_user = v_uid then raise exception 'You can''t report yourself.'; end if;
  if private.rate_count(v_uid, 'report', interval '1 day') >= 30 then
    raise exception 'That''s the most reports for one day. Thanks for helping.';
  end if;
  perform private.rate_hit(v_uid, 'report');
  insert into public.reports (reporter_id, target, target_id, target_user, reason, note, excerpt)
    values (v_uid, p_target, p_target_id, v_user, p_reason, nullif(left(btrim(coalesce(p_note, '')), 500), ''), left(v_excerpt, 1000))
    on conflict do nothing;
  -- Three different people: hidden until staff look.
  select count(distinct r.reporter_id) into v_count from public.reports r
    where r.target = p_target and r.target_id = p_target_id and r.status = 'new';
  if v_count >= 3 then
    if p_target = 'thread' then update public.forum_threads set hidden_at = coalesce(hidden_at, now()) where id = p_target_id;
    elsif p_target = 'reply' then update public.forum_replies set hidden_at = coalesce(hidden_at, now()) where id = p_target_id;
    elsif p_target = 'message' then update public.messages set hidden_at = coalesce(hidden_at, now()) where id = p_target_id;
    elsif p_target = 'post' then update public.posts set hidden_at = coalesce(hidden_at, now()) where id = p_target_id;
    elsif p_target = 'comment' then update public.post_comments set hidden_at = coalesce(hidden_at, now()) where id = p_target_id;
    elsif p_target = 'chat' then update public.chat_messages set hidden_at = coalesce(hidden_at, now()) where id = p_target_id;
    end if;
  end if;
end;
$$;

-- Staff: dismiss; hide (or restore) the content; or suspend the person
-- (p_days null: until lifted). Hiding an event cancels it; hiding a suggested
-- place rejects it. Every open report on the same thing is closed with it.
create or replace function public.moderate_report(p_report_id uuid, p_action text, p_days int default null, p_reason text default null)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
  r public.reports;
  v_hide timestamptz;
begin
  if not private.is_admin(v_uid) then raise exception 'Only staff can do that.'; end if;
  select * into r from public.reports where id = p_report_id;
  if not found then raise exception 'That report isn''t there any more.'; end if;
  if p_action not in ('hide', 'restore', 'dismiss', 'suspend') then raise exception 'Pick dismiss, hide, restore or suspend.'; end if;
  if p_action in ('hide', 'restore') then
    v_hide := case when p_action = 'hide' then now() end;
    if r.target = 'thread' then update public.forum_threads set hidden_at = v_hide where id = r.target_id;
    elsif r.target = 'reply' then update public.forum_replies set hidden_at = v_hide where id = r.target_id;
    elsif r.target = 'message' then update public.messages set hidden_at = v_hide where id = r.target_id;
    elsif r.target = 'post' then update public.posts set hidden_at = v_hide where id = r.target_id;
    elsif r.target = 'comment' then update public.post_comments set hidden_at = v_hide where id = r.target_id;
    elsif r.target = 'chat' then update public.chat_messages set hidden_at = v_hide where id = r.target_id;
    elsif r.target = 'event' and p_action = 'hide' then update public.events set cancelled_at = coalesce(cancelled_at, now()) where id = r.target_id;
    elsif r.target = 'spot' then
      update public.spots set status = case when p_action = 'hide' then 'rejected'::public.spot_status else 'approved'::public.spot_status end where id = r.target_id;
    elsif p_action = 'hide' then
      raise exception 'Profiles, builds and crews can''t be hidden: suspend the person instead.';
    end if;
  elsif p_action = 'suspend' then
    if r.target_user is null then raise exception 'That person isn''t on Nightshift any more.'; end if;
    if private.is_admin(r.target_user) then raise exception 'Staff can''t be suspended here.'; end if;
    if p_days is not null and (p_days < 1 or p_days > 3650) then raise exception 'Suspend for 1 to 3,650 days, or until lifted.'; end if;
    insert into public.suspensions (user_id, reason, until, created_by)
      values (r.target_user, left(coalesce(p_reason, r.reason::text), 500), case when p_days is null then null else now() + make_interval(days => p_days) end, v_uid)
      on conflict (user_id) do update set reason = excluded.reason, until = excluded.until, created_by = excluded.created_by, created_at = now();
  end if;
  update public.reports
    set status = case when p_action = 'dismiss' then 'dismissed' else 'actioned' end, handled_by = v_uid, handled_at = now()
    where target = r.target and target_id = r.target_id and status = 'new';
end;
$$;

create function public.lift_suspension(p_user uuid)
returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  if not private.is_admin(private.require_uid()) then raise exception 'Only staff can do that.'; end if;
  delete from public.suspensions where user_id = p_user;
end;
$$;

-- The old two-argument moderate_report() is replaced by the one above.
drop function if exists public.moderate_report(uuid, text);

do $$
declare
  f regprocedure;
begin
  for f in
    select p.oid::regprocedure from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname in ('report_content', 'moderate_report', 'lift_suspension', 'my_moderation_status')
  loop
    execute format('revoke execute on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated, service_role', f);
  end loop;
end;
$$;

-- Nightshift backend: spam, sell-only accounts, member moderation and staff roles
-- (owner requests, 18 Nov 2026). Mirrors src/lib/moderation.ts and docs/MODERATION.md.
--
--  * Duplicate spam: the same (or nearly the same) text more than twice in 24 hours
--    across posts, comments, threads, replies and event chat is refused. In private
--    chats only copy-paste blasting counts: the same text into 3 or more different
--    chats. Five refused duplicates in a day (the app reports each refusal with
--    record_blocked_duplicate(), which checks it again here) give an automatic
--    staff report ('spam') and a 24-hour Community cooldown.
--  * Selling: each post and thread stores is_selling. Outside For sale & wanted,
--    selling is refused once it's most of what someone posts (5+ posts in 30 days,
--    over 60% selling) or more than 3 selling posts in 7 days. For sale & wanted
--    takes 5 new listings per person per 7 days. 90%+ selling (5+ posts) is an
--    automatic staff report ('sell_only'); never an automatic ban.
--  * Suspensions get a scope: 'community' (no posts, comments, threads, replies,
--    event chat or connection requests; messages to existing connections still
--    work) or 'full' (no messages either, as before).
--  * Warnings the person must acknowledge, notices for every warning, ban and role
--    change, and the staff Member moderation screen (history, counts, log).
--  * Roles: owner (one; set by the owner with SQL, docs/MODERATION.md), admin,
--    moderator. Moderators warn, hide and Community-ban up to 7 days. Admins also
--    ban for longer or until lifted, fully suspend, and promote or demote
--    moderators. Only the owner makes or removes admins. Nobody acts on themselves
--    or on someone with the same or a higher role.
--  * moderation_actions: an append-only audit log of every moderation action.
--
-- PostgREST rolls a call back when it fails, so a refused duplicate can't record
-- itself: hence record_blocked_duplicate().

-- ===========================================================================
-- Text helpers (mirror src/lib/moderation.ts)
-- ===========================================================================

-- Lower case; only a-z, 0-9 and spaces kept (punctuation and emoji go); runs of
-- space become one. Same as normaliseForSpam().
create function private.spam_normalise(p text)
returns text
language sql immutable parallel safe
set search_path = ''
as $$
  select btrim(regexp_replace(regexp_replace(lower(coalesce(p, '')), '[^a-z0-9 \t\n\r]+', '', 'g'), '[ \t\n\r]+', ' ', 'g'))
$$;

-- Dice coefficient on the sets of 2-character pieces. Same as similarity().
create function private.text_similarity(a text, b text)
returns double precision
language sql immutable parallel safe
set search_path = ''
as $$
  with x as (
    select coalesce((select array_agg(distinct substr(a, i, 2)) from generate_series(1, char_length(a) - 1) i), '{}') as ga,
           coalesce((select array_agg(distinct substr(b, i, 2)) from generate_series(1, char_length(b) - 1) i), '{}') as gb
  )
  select case
    when a = b then 1.0
    when cardinality(ga) + cardinality(gb) = 0 then 0.0
    else 2.0 * (select count(*) from unnest(ga) g where g = any (gb)) / (cardinality(ga) + cardinality(gb))
  end
  from x
$$;

-- Two normalised texts are the same message: equal (15+ characters), or both over
-- 20 characters, similar in length and 90% alike. Same as isNearDuplicate().
create function private.near_duplicate(a text, b text)
returns boolean
language sql immutable parallel safe
set search_path = ''
as $$
  select char_length(a) >= 15 and char_length(b) >= 15 and (
    a = b
    or (char_length(a) > 20 and char_length(b) > 20
        and least(char_length(a), char_length(b))::double precision / greatest(char_length(a), char_length(b)) >= 0.8
        and private.text_similarity(a, b) >= 0.9)
  )
$$;

-- Is this selling? Same as isSelling(). Talking about money ("spent £400 on
-- coilovers"), "sold my old car" and "the selling point" are not.
create function private.is_selling(p text)
returns boolean
language plpgsql immutable
set search_path = ''
as $$
declare
  t text := regexp_replace(lower(coalesce(p, '')), '(best|top|fast|biggest)[ -]selling|selling points?', ' ', 'g');
begin
  if t ~ '\y(for sale|fs|f/s|wts|wtb|wtt|ono|ovno|selling)\y'
     or t ~ '\y(dm|pm|message|msg|inbox)( me)? (for|4) (a )?prices?\y'
     or t ~ '\y(collection only|price drop|price dropped|asking price|open to offers|offers welcome|no offers|no time ?wasters)\y'
     or t ~ '(ebay\.(co\.uk|com)|gumtree\.com|facebook\.com/marketplace|fb\.com/marketplace|vinted\.(co\.uk|com)|depop\.com|preloved\.co\.uk)'
     or t ~ '\y(listed|listing|up) on (ebay|gumtree|vinted|depop|marketplace|fb marketplace|facebook marketplace)\y'
     or t ~ '\y(use|using) (my )?code\y'
     or t ~ '\y(discount|promo|voucher|affiliate|referral) codes?\y'
     or t ~ '\y[0-9]{1,2}% off\y' then
    return true;
  end if;
  return (t ~ '£ ?[0-9]' or t ~ '\y[0-9]+(\.[0-9]+)?k? ?(quid|gbp|pounds|squid)\y')
     and t ~ '\y(postage|posted|p&p|collection|collect|offers|swaps?|px|bnib|boxed|asking)\y';
end;
$$;

-- ===========================================================================
-- Flags on content, automatic reports
-- ===========================================================================

alter table public.posts add column is_selling boolean not null default false, add column is_repeat boolean not null default false;
alter table public.forum_threads add column is_selling boolean not null default false, add column is_repeat boolean not null default false;
alter table public.post_comments add column is_repeat boolean not null default false;
alter table public.forum_replies add column is_repeat boolean not null default false;
alter table public.chat_messages add column is_repeat boolean not null default false;

-- Existing content gets its selling flag.
update public.posts set is_selling = private.is_selling(body) where body <> '';
update public.forum_threads set is_selling = private.is_selling(title || E'\n' || body);

create index post_comments_author_idx on public.post_comments (author_id, created_at);
create index chat_messages_user_idx on public.chat_messages (user_id, created_at);

alter table public.reports add column automatic boolean not null default false;

-- Staff's queue, now saying which reports Nightshift raised itself.
create or replace view public.moderation_queue with (security_invoker = true) as
  select r.target, r.target_id, r.target_user,
         count(*)::int as reports,
         array_agg(distinct r.reason) as reasons,
         min(r.created_at) as first_reported,
         (array_agg(r.id order by r.created_at))[1] as report_id,
         (array_agg(r.excerpt order by r.created_at))[1] as excerpt,
         array_remove(array_agg(r.note order by r.created_at), null) as notes,
         bool_or(r.automatic) as automatic
  from public.reports r
  where r.status = 'new'
  group by r.target, r.target_id, r.target_user;

-- ===========================================================================
-- Roles
-- ===========================================================================

-- Existing staff are moderators. The owner sets themselves (docs/MODERATION.md).
alter table public.staff add column role text not null default 'moderator' check (role in ('owner', 'admin', 'moderator'));
create unique index staff_one_owner on public.staff (role) where role = 'owner';

create function private.staff_role(p_user uuid)
returns text
language sql stable security definer
set search_path = ''
as $$
  select s.role from public.staff s where s.user_id = p_user
$$;

create function private.staff_rank(p_user uuid)
returns int
language sql stable security definer
set search_path = ''
as $$
  select case private.staff_role(p_user) when 'owner' then 3 when 'admin' then 2 when 'moderator' then 1 else 0 end
$$;

-- ===========================================================================
-- The audit log (append-only) and warnings
-- ===========================================================================

-- No foreign keys: rows outlive the people in them (deleting an account must not
-- touch the log). Handles are copied at the time.
create table public.moderation_actions (
  id uuid primary key default gen_random_uuid(),
  -- Null: Nightshift itself (automatic reports and cooldowns).
  actor_id uuid,
  actor_handle text,
  -- owner, admin or moderator at the time; 'system' for automatic ones.
  actor_role text not null,
  action text not null check (action in ('warn', 'hide', 'unhide', 'ban', 'suspend', 'lift', 'promote', 'demote', 'dismiss', 'auto_report', 'cooldown')),
  target_user uuid,
  target_handle text,
  -- What it was about: a report target ('post', 'thread', ...) or 'profile'.
  target_kind text,
  target_id uuid,
  report_id uuid,
  reason text,
  note text,
  -- Bans: 'community' or 'full', days (null: until lifted) and the end.
  scope text,
  days int,
  until timestamptz,
  -- Role changes: the new role (null when removed).
  new_role text,
  created_at timestamptz not null default now()
);
create index moderation_actions_actor_idx on public.moderation_actions (actor_id, created_at desc);
create index moderation_actions_target_idx on public.moderation_actions (target_user, created_at desc);
create index moderation_actions_created_idx on public.moderation_actions (created_at desc);
alter table public.moderation_actions enable row level security;
create policy "moderation_actions: admins and the owner read" on public.moderation_actions
  for select to authenticated using (private.staff_rank((select auth.uid())) >= 2);
revoke all on public.moderation_actions from anon, authenticated;
grant select on public.moderation_actions to authenticated;
grant select, insert on public.moderation_actions to service_role;

create function private.moderation_log_frozen()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'The moderation log can''t be changed or deleted.';
end;
$$;
create trigger moderation_actions_no_update before update or delete on public.moderation_actions
  for each row execute function private.moderation_log_frozen();
create trigger moderation_actions_no_truncate before truncate on public.moderation_actions
  for each statement execute function private.moderation_log_frozen();

create table public.moderation_warnings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  action_id uuid not null,
  reason text not null,
  note text,
  created_at timestamptz not null default now(),
  acknowledged_at timestamptz
);
create index moderation_warnings_user_idx on public.moderation_warnings (user_id, created_at desc);
alter table public.moderation_warnings enable row level security;
create policy "moderation_warnings: own, staff all" on public.moderation_warnings
  for select to authenticated using (user_id = (select auth.uid()) or private.is_admin((select auth.uid())));
revoke all on public.moderation_warnings from anon, authenticated;
grant select on public.moderation_warnings to authenticated;
grant all on public.moderation_warnings to service_role;

create function private.log_action(
  p_actor uuid, p_action text, p_target_user uuid,
  p_target_kind text default null, p_target_id uuid default null, p_report_id uuid default null,
  p_reason text default null, p_note text default null,
  p_scope text default null, p_days int default null, p_until timestamptz default null, p_new_role text default null
)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  insert into public.moderation_actions (actor_id, actor_handle, actor_role, action, target_user, target_handle, target_kind, target_id,
                                         report_id, reason, note, scope, days, until, new_role)
  values (p_actor, private.handle_of(p_actor), coalesce(private.staff_role(p_actor), 'system'), p_action, p_target_user,
          private.handle_of(p_target_user), p_target_kind, p_target_id, p_report_id,
          nullif(left(btrim(coalesce(p_reason, '')), 300), ''), nullif(left(btrim(coalesce(p_note, '')), 500), ''),
          p_scope, p_days, p_until, p_new_role)
  returning id into v_id;
  return v_id;
end;
$$;

-- A notice in the person's list (kind 'system'; the key stops doubles).
create function private.moderation_notice(p_user uuid, p_key text, p_title text, p_body text)
returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  if exists (select 1 from public.profiles p where p.id = p_user) then
    insert into public.notices (user_id, kind, key, title, body) values (p_user, 'system', p_key, p_title, left(p_body, 500))
      on conflict do nothing;
  end if;
end;
$$;

-- "25 Nov 2026, 14:00" in UK time.
create function private.uk_when(p timestamptz)
returns text
language sql stable
set search_path = ''
as $$
  select to_char(p at time zone 'Europe/London', 'FMDD Mon YYYY, HH24:MI')
$$;

-- ===========================================================================
-- Suspensions with a scope
-- ===========================================================================

alter table public.suspensions add column scope text not null default 'full' check (scope in ('community', 'full'));

-- The sentence a banned person sees. Same as banMessage() in moderation.ts.
create function private.ban_message(p_scope text, p_until timestamptz, p_reason text)
returns text
language sql stable
set search_path = ''
as $$
  select case
    when p_scope = 'full' then 'Your account is suspended, so you can''t post or message right now. You can still read and report.'
    else 'You can''t post in Community until ' || coalesce(private.uk_when(p_until), 'a moderator lifts it')
         || coalesce(': ' || nullif(rtrim(btrim(p_reason), '.'), ''), '') || '.'
  end
$$;

-- Any active ban: no public posting, event chat or connection requests.
create or replace function private.check_not_suspended(p_user uuid)
returns void
language plpgsql stable security definer
set search_path = ''
as $$
declare
  s public.suspensions;
begin
  select * into s from public.suspensions where user_id = p_user and (until is null or until > now());
  if found then raise exception '%', private.ban_message(s.scope, s.until, s.reason); end if;
end;
$$;

-- Messages, groups and 1-to-1 chats: only a full suspension stops them.
create function private.check_not_fully_suspended(p_user uuid)
returns void
language plpgsql stable security definer
set search_path = ''
as $$
declare
  s public.suspensions;
begin
  select * into s from public.suspensions where user_id = p_user and scope = 'full' and (until is null or until > now());
  if found then raise exception '%', private.ban_message(s.scope, s.until, s.reason); end if;
end;
$$;

create or replace function private.rate_hit(p_user uuid, p_kind text)
returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  if p_kind in ('message', 'group') then perform private.check_not_fully_suspended(p_user);
  elsif p_kind not in ('report', 'rate_build') then perform private.check_not_suspended(p_user);
  end if;
  delete from private.rate_hits h where h.user_id = p_user and h.kind = p_kind and h.at < now() - interval '1 day';
  insert into private.rate_hits (user_id, kind) values (p_user, p_kind);
end;
$$;
revoke execute on function private.rate_hit(uuid, text) from public, anon, authenticated;

create or replace function private.check_can_add(p_uid uuid, p_user uuid)
returns void
language plpgsql stable security definer
set search_path = ''
as $$
begin
  perform private.check_not_fully_suspended(p_uid);
  if p_user is null or p_user = p_uid then raise exception 'Pick someone else.'; end if;
  if not private.are_connected(p_uid, p_user) or private.blocked_between(p_uid, p_user) then
    raise exception 'You can only message people you''re connected with.';
  end if;
end;
$$;

-- Am I staff (and which role), and am I banned? (Settings, the banner and the composers)
drop function public.my_moderation_status();
create function public.my_moderation_status()
returns table (is_staff boolean, suspended_until timestamptz, suspended boolean, role text, scope text, reason text, message text)
language sql stable security definer
set search_path = ''
as $$
  select private.is_admin(auth.uid()),
         s.until,
         s.user_id is not null,
         private.staff_role(auth.uid()),
         s.scope,
         s.reason,
         case when s.user_id is not null then private.ban_message(s.scope, s.until, s.reason) end
  from (select auth.uid() as uid) me
  left join public.suspensions s on s.user_id = me.uid and (s.until is null or s.until > now())
  where me.uid is not null
$$;

-- ===========================================================================
-- Duplicate spam
-- ===========================================================================

-- What each person wrote in the last two days, normalised (private; never shown).
create table private.spam_log (
  user_id uuid not null references auth.users (id) on delete cascade,
  is_message boolean not null,
  -- Private chats: the conversation (the same text in one chat isn't counted).
  place uuid,
  norm text not null,
  at timestamptz not null default now()
);
create index spam_log_user_idx on private.spam_log (user_id, at desc);

-- How many times this text already went out in 24 hours: each public copy counts
-- once; private copies count once per different chat (not this one).
create function private.duplicate_places(p_user uuid, p_is_message boolean, p_place uuid, p_norm text)
returns int
language sql stable security definer
set search_path = ''
as $$
  with recent as (
    select l.is_message, l.place, l.norm from private.spam_log l
    where l.user_id = p_user and l.at > now() - interval '24 hours'
      and not (l.is_message and p_is_message and l.place is not distinct from p_place)
    order by l.at desc
    limit 500
  ), hits as (
    select * from recent r where private.near_duplicate(r.norm, p_norm)
  )
  select ((select count(*) from hits where not is_message) + (select count(distinct place) from hits where is_message))::int
$$;

create function private.spam_gate(p_user uuid, p_is_message boolean, p_place uuid, p_text text)
returns boolean
language plpgsql security definer
set search_path = ''
as $$
declare
  v_norm text := private.spam_normalise(p_text);
  v_n int;
begin
  if char_length(v_norm) < 15 then return false; end if;
  v_n := private.duplicate_places(p_user, p_is_message, p_place, v_norm);
  if v_n >= 2 then
    raise exception 'You''ve already posted that. Spamming the same message isn''t allowed.';
  end if;
  delete from private.spam_log where user_id = p_user and at < now() - interval '48 hours';
  insert into private.spam_log (user_id, is_message, place, norm) values (p_user, p_is_message, p_place, v_norm);
  return v_n >= 1;
end;
$$;

-- A recent sample of someone's public writing, for an automatic report.
create function private.recent_public_text(p_user uuid)
returns text
language sql stable security definer
set search_path = ''
as $$
  select string_agg(x.body, E'\n---\n' order by x.created_at desc)
  from (
    select left(b, 200) as body, c as created_at from (
      select p.body as b, p.created_at as c from public.posts p where p.author_id = p_user
      union all select t.title || ': ' || t.body, t.created_at from public.forum_threads t where t.author_id = p_user
      union all select r.body, r.created_at from public.forum_replies r where r.author_id = p_user
      union all select pc.body, pc.created_at from public.post_comments pc where pc.author_id = p_user
    ) a order by c desc limit 5
  ) x
$$;

-- An automatic report on the person's profile, once while one is open.
create function private.auto_report(p_user uuid, p_reason public.report_reason, p_note text)
returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  if exists (select 1 from public.reports r where r.target = 'profile' and r.target_id = p_user and r.reason = p_reason
             and r.automatic and r.status = 'new') then
    return;
  end if;
  insert into public.reports (reporter_id, target, target_id, target_user, reason, note, excerpt, automatic)
    values (null, 'profile', p_user, p_user, p_reason, p_note,
            left(coalesce(private.handle_of(p_user), '?') || E'\n' || coalesce(private.recent_public_text(p_user), ''), 1000), true);
  perform private.log_action(null, 'auto_report', p_user, 'profile', p_user, null, p_reason::text, p_note);
end;
$$;

-- The app calls this when the server refused a duplicate. It's checked again here;
-- the fifth in a day reports the person and gives them a 24-hour Community cooldown.
-- Returns 'not_duplicate', 'noted' or 'cooldown'.
create function public.record_blocked_duplicate(p_kind text, p_place uuid, p_text text)
returns text
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
  v_norm text := private.spam_normalise(p_text);
  v_until timestamptz := now() + interval '24 hours';
begin
  if p_kind not in ('post', 'comment', 'thread', 'reply', 'chat', 'message') then raise exception 'Unknown kind.'; end if;
  if char_length(v_norm) < 15 or private.duplicate_places(v_uid, p_kind = 'message', p_place, v_norm) < 2 then
    return 'not_duplicate';
  end if;
  if private.rate_count(v_uid, 'dup_strike', interval '1 day') >= 50 then return 'noted'; end if;
  delete from private.rate_hits h where h.user_id = v_uid and h.kind = 'dup_strike' and h.at < now() - interval '1 day';
  insert into private.rate_hits (user_id, kind) values (v_uid, 'dup_strike');
  if private.rate_count(v_uid, 'dup_strike', interval '1 day') < 5
     or exists (select 1 from public.moderation_actions a where a.target_user = v_uid and a.action = 'cooldown' and a.created_at > now() - interval '24 hours') then
    return 'noted';
  end if;
  perform private.auto_report(v_uid, 'spam', 'Automatic: 5 or more refused duplicate posts in 24 hours.');
  -- A longer ban already in place stays as it is.
  if not exists (select 1 from public.suspensions s where s.user_id = v_uid and (s.until is null or s.until >= v_until)) then
    insert into public.suspensions (user_id, reason, until, created_by, scope)
      values (v_uid, 'Posting the same message again and again', v_until, null, 'community')
      on conflict (user_id) do update set reason = excluded.reason, until = excluded.until, created_by = null, created_at = now(),
        scope = case when public.suspensions.scope = 'full' and (public.suspensions.until is null or public.suspensions.until > now())
                     then 'full' else 'community' end;
  end if;
  perform private.log_action(null, 'cooldown', v_uid, 'profile', v_uid, null, 'Posting the same message again and again', null, 'community', 1, v_until);
  perform private.moderation_notice(v_uid, 'cooldown:' || to_char(now(), 'YYYYMMDDHH24MISS'), 'Posting paused for 24 hours',
    private.ban_message('community', v_until, 'Posting the same message again and again'));
  return 'cooldown';
end;
$$;

-- ===========================================================================
-- Selling
-- ===========================================================================

-- Mirrors SELLING_LIMITS in moderation.ts.
create function private.check_selling_allowed(p_user uuid)
returns void
language plpgsql stable security definer
set search_path = ''
as $$
declare
  v_total int;
  v_selling int;
  v_week int;
begin
  select count(*), count(*) filter (where s), count(*) filter (where s and c > now() - interval '7 days')
    into v_total, v_selling, v_week
  from (
    select p.is_selling as s, p.created_at as c from public.posts p where p.author_id = p_user and p.created_at > now() - interval '30 days'
    union all
    select t.is_selling and t.board <> 'for_sale', t.created_at from public.forum_threads t
      where t.author_id = p_user and t.created_at > now() - interval '30 days'
  ) x;
  if (v_total >= 5 and v_selling > 0.6 * v_total) or v_week >= 3 then
    raise exception 'You''ve posted a lot of selling lately. Put things for sale on the For sale & wanted board instead.';
  end if;
end;
$$;

-- After a post or thread: 90%+ selling over 5+ posts in 30 days is reported to staff.
create function private.check_sell_only(p_user uuid)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_total int;
  v_selling int;
begin
  select count(*), count(*) filter (where s) into v_total, v_selling
  from (
    select p.is_selling as s from public.posts p where p.author_id = p_user and p.created_at > now() - interval '30 days'
    union all
    select t.is_selling or t.board = 'for_sale' from public.forum_threads t where t.author_id = p_user and t.created_at > now() - interval '30 days'
  ) x;
  if v_total >= 5 and v_selling >= 0.9 * v_total then
    perform private.auto_report(p_user, 'sell_only', 'Automatic: ' || v_selling || ' of their ' || v_total || ' posts and threads in 30 days are selling.');
  end if;
end;
$$;

-- ===========================================================================
-- The write RPCs, with the new checks (otherwise as before)
-- ===========================================================================

create or replace function public.create_thread(
  p_board public.forum_board,
  p_region text,
  p_title text,
  p_body text,
  p_photos text[] default '{}',
  p_build_id uuid default null
)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
  v_title text := btrim(coalesce(p_title, ''));
  v_body text := btrim(coalesce(p_body, ''));
  v_selling boolean;
  v_repeat boolean;
  v_id uuid;
begin
  if not exists (select 1 from public.profiles p where p.id = v_uid and p.onboarded) then
    raise exception 'Set up your profile first.';
  end if;
  if char_length(v_title) < 4 then raise exception 'Give it a title of at least 4 characters.'; end if;
  if char_length(v_title) > 120 then raise exception 'Keep the title to 120 characters or fewer.'; end if;
  if char_length(v_body) > 5000 then raise exception 'Keep it to 5,000 characters or fewer.'; end if;
  if p_board = 'local' and p_region is null then raise exception 'Pick a region for the Local board.'; end if;
  perform private.check_public_text(v_title || E'\n' || v_body);
  perform private.check_forum_photos(v_uid, p_photos);
  perform private.check_own_build(v_uid, p_build_id);
  perform private.check_not_suspended(v_uid);
  v_selling := private.is_selling(v_title || E'\n' || v_body);
  if p_board = 'for_sale' then
    if (select count(*) from public.forum_threads t where t.author_id = v_uid and t.board = 'for_sale' and t.created_at > now() - interval '7 days') >= 5 then
      raise exception 'That''s 5 listings on For sale & wanted this week, the most for 7 days. Try again in a few days.';
    end if;
  elsif v_selling then
    perform private.check_selling_allowed(v_uid);
  end if;
  perform private.forum_rate(v_uid, 'thread');
  v_repeat := private.spam_gate(v_uid, false, null, v_title || ' ' || v_body);
  insert into public.forum_threads (board, region, author_id, title, body, photos, build_id, is_selling, is_repeat)
    values (p_board, case when p_board = 'local' then p_region end, v_uid, v_title, v_body, coalesce(p_photos, '{}'), p_build_id, v_selling, v_repeat)
    returning id into v_id;
  perform private.check_sell_only(v_uid);
  return v_id;
end;
$$;

create or replace function public.reply_thread(p_thread_id uuid, p_body text, p_photos text[] default '{}', p_build_id uuid default null)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
  v_body text := btrim(coalesce(p_body, ''));
  t public.forum_threads;
  v_repeat boolean;
  v_id uuid;
begin
  select * into t from public.forum_threads where id = p_thread_id;
  if not found or (t.hidden_at is not null and t.author_id <> v_uid) or private.i_blocked(v_uid, t.author_id) then
    raise exception 'That thread isn''t there any more.';
  end if;
  if private.i_blocked(t.author_id, v_uid) then raise exception 'You can''t reply to this thread.'; end if;
  if not exists (select 1 from public.profiles p where p.id = v_uid and p.onboarded) then
    raise exception 'Set up your profile first.';
  end if;
  if v_body = '' then raise exception 'Write a reply first.'; end if;
  if char_length(v_body) > 5000 then raise exception 'Keep it to 5,000 characters or fewer.'; end if;
  perform private.check_public_text(v_body);
  perform private.check_forum_photos(v_uid, p_photos);
  perform private.check_own_build(v_uid, p_build_id);
  perform private.forum_rate(v_uid, 'reply');
  v_repeat := private.spam_gate(v_uid, false, p_thread_id, v_body);
  insert into public.forum_replies (thread_id, author_id, body, photos, build_id, is_repeat)
    values (p_thread_id, v_uid, v_body, coalesce(p_photos, '{}'), p_build_id, v_repeat)
    returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.create_post(
  p_body text,
  p_photos text[] default '{}',
  p_lat double precision default null,
  p_lng double precision default null,
  p_place_name text default null,
  p_visibility public.post_visibility default 'public',
  p_build_id uuid default null
)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
  v_body text := btrim(coalesce(p_body, ''));
  v_at extensions.geography;
  v text;
  v_selling boolean;
  v_repeat boolean;
  v_id uuid;
begin
  if not exists (select 1 from public.profiles p where p.id = v_uid and p.onboarded) then
    raise exception 'Set up your profile first.';
  end if;
  if v_body = '' and cardinality(coalesce(p_photos, '{}')) = 0 then raise exception 'Write something or add a photo.'; end if;
  if char_length(v_body) > 2000 then raise exception 'Keep it to 2,000 characters or fewer.'; end if;
  perform private.check_public_text(v_body || E'\n' || coalesce(p_place_name, ''));
  if cardinality(coalesce(p_photos, '{}')) > 4 then raise exception 'Up to 4 photos a post.'; end if;
  foreach v in array coalesce(p_photos, '{}') loop
    if v !~ ('^' || v_uid::text || '/posts/[A-Za-z0-9._-]+$') then raise exception 'That photo isn''t one of yours.'; end if;
  end loop;
  perform private.check_own_build(v_uid, p_build_id);
  if (p_lat is null) <> (p_lng is null) then raise exception 'Pick the place on the map.'; end if;
  if p_lat is not null then
    if p_lat not between 49.8 and 60.9 or p_lng not between -8.7 and 1.9 then raise exception 'Places are for the UK only.'; end if;
    v_at := private.pt(round(p_lat::numeric, 4)::double precision, round(p_lng::numeric, 4)::double precision);
    if exists (select 1 from public.profile_homes h where h.user_id = v_uid and extensions.st_dwithin(h.home, v_at, 1000)) then
      raise exception 'That''s within about 1 km of your home area, so it can''t be shared. Pick a spot further away.';
    end if;
  end if;
  perform private.check_not_suspended(v_uid);
  v_selling := private.is_selling(v_body);
  if v_selling then perform private.check_selling_allowed(v_uid); end if;
  if private.rate_count(v_uid, 'post', interval '1 hour') >= 10 then
    raise exception 'You''re posting a lot. Try again in a little while.';
  end if;
  if private.rate_count(v_uid, 'post', interval '1 day') >= 30 then
    raise exception 'That''s the most posts for one day.';
  end if;
  perform private.rate_hit(v_uid, 'post');
  v_repeat := private.spam_gate(v_uid, false, null, v_body);
  insert into public.posts (author_id, body, photos, location, place_name, visibility, build_id, is_selling, is_repeat)
    values (v_uid, v_body, coalesce(p_photos, '{}'), v_at, case when v_at is null then null else nullif(btrim(coalesce(p_place_name, '')), '') end,
            coalesce(p_visibility, 'public'), p_build_id, v_selling, v_repeat)
    returning id into v_id;
  perform private.check_sell_only(v_uid);
  return v_id;
end;
$$;

create or replace function public.comment_post(p_post_id uuid, p_body text)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
  v_body text := btrim(coalesce(p_body, ''));
  v_repeat boolean;
  v_id uuid;
begin
  if not private.can_see_post(p_post_id, v_uid) then raise exception 'That post isn''t there any more.'; end if;
  if v_body = '' then raise exception 'Write a comment first.'; end if;
  if char_length(v_body) > 1000 then raise exception 'Keep it to 1,000 characters or fewer.'; end if;
  perform private.check_public_text(v_body);
  if private.rate_count(v_uid, 'comment', interval '1 minute') >= 5 then
    raise exception 'You''re posting a lot. Try again in a few minutes.';
  end if;
  if private.rate_count(v_uid, 'comment', interval '1 day') >= 200 then
    raise exception 'That''s the most comments for one day.';
  end if;
  perform private.rate_hit(v_uid, 'comment');
  v_repeat := private.spam_gate(v_uid, false, p_post_id, v_body);
  insert into public.post_comments (post_id, author_id, body, is_repeat) values (p_post_id, v_uid, v_body, v_repeat) returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.send_message(p_conversation_id uuid, p_body text, p_photo_path text default null, p_share jsonb default null)
returns table (id uuid, created_at timestamptz)
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
  v_body text := btrim(coalesce(p_body, ''));
  v_share jsonb;
  v_other uuid;
  m public.messages;
begin
  if not private.can_post(p_conversation_id, v_uid) then
    raise exception 'You can only message people you''re connected with.';
  end if;
  if char_length(v_body) > 2000 then raise exception 'Keep it to 2,000 characters or fewer.'; end if;
  if p_photo_path is not null and p_photo_path !~ ('^' || v_uid::text || '/' || p_conversation_id::text || '/[A-Za-z0-9._-]+$') then
    raise exception 'That photo isn''t one of yours.';
  end if;
  if p_share is not null then
    if jsonb_typeof(p_share) <> 'object' or coalesce(p_share->>'kind', '') not in ('event', 'place', 'build')
       or char_length(coalesce(p_share->>'id', '')) not between 1 and 100
       or char_length(coalesce(p_share->>'title', '')) not between 1 and 120
       or char_length(coalesce(p_share->>'subtitle', '')) > 160 then
      raise exception 'That can''t be shared.';
    end if;
    v_share := jsonb_build_object('kind', p_share->>'kind', 'id', p_share->>'id', 'title', p_share->>'title', 'subtitle', coalesce(p_share->>'subtitle', ''));
  end if;
  if v_body = '' and p_photo_path is null and v_share is null then raise exception 'Write a message first.'; end if;
  if private.rate_count(v_uid, 'message', interval '1 minute') >= 20 then
    raise exception 'Slow down a little: that''s a lot of messages in a minute.';
  end if;
  if private.rate_count(v_uid, 'message', interval '1 day') >= 1000 then
    raise exception 'That''s the most messages for one day.';
  end if;
  perform private.rate_hit(v_uid, 'message');
  perform private.spam_gate(v_uid, true, p_conversation_id, v_body);
  v_other := private.direct_other(p_conversation_id, v_uid);
  if v_other is not null then
    insert into public.conversation_members (conversation_id, user_id, role, last_read_at)
      values (p_conversation_id, v_other, 'member', now() - interval '1 second') on conflict do nothing;
  end if;
  insert into public.messages (conversation_id, sender_id, body, photo_path, share)
    values (p_conversation_id, v_uid, v_body, p_photo_path, v_share) returning * into m;
  update public.conversations c set last_message_at = m.created_at where c.id = p_conversation_id;
  update public.conversation_members cm set last_read_at = m.created_at
    where cm.conversation_id = p_conversation_id and cm.user_id = v_uid;
  return query select m.id, m.created_at;
end;
$$;

-- Event chat is a direct insert: bans (with their sentence) and duplicates here.
create function private.chat_gate()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  if new.system then return new; end if;
  perform private.check_not_suspended(new.user_id);
  new.is_repeat := private.spam_gate(new.user_id, false, new.event_id, new.body);
  return new;
end;
$$;
create trigger chat_messages_gate before insert on public.chat_messages for each row execute function private.chat_gate();

-- ===========================================================================
-- Staff powers
-- ===========================================================================

-- Staff only, never on yourself, never on the same or a higher role.
create function private.check_can_act(p_actor uuid, p_target uuid)
returns void
language plpgsql stable security definer
set search_path = ''
as $$
begin
  if private.staff_rank(p_actor) = 0 then raise exception 'Only staff can do that.'; end if;
  if p_target is not null and p_target = p_actor then raise exception 'You can''t moderate yourself.'; end if;
  if p_target is not null and private.staff_rank(p_target) >= private.staff_rank(p_actor) then
    raise exception 'You can''t act on someone with the same or a higher role.';
  end if;
end;
$$;

-- Ban days a role may use: moderators 1 to 7 days, Community only.
create function private.check_ban_power(p_actor uuid, p_scope text, p_days int)
returns void
language plpgsql stable security definer
set search_path = ''
as $$
begin
  if p_scope not in ('community', 'full') then raise exception 'Pick a Community ban or a full suspension.'; end if;
  if p_days is not null and (p_days < 1 or p_days > 3650) then raise exception 'Ban for 1 to 3,650 days, or until lifted.'; end if;
  if private.staff_rank(p_actor) < 2 and (p_scope = 'full' or p_days is null or p_days > 7) then
    raise exception 'Moderators can ban from Community for up to 7 days. Ask an admin for longer bans or a full suspension.';
  end if;
end;
$$;

create function private.apply_ban(p_actor uuid, p_user uuid, p_scope text, p_days int, p_reason text, p_report_id uuid,
                                  p_target_kind text, p_target_id uuid)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_until timestamptz := case when p_days is null then null else now() + make_interval(days => p_days) end;
begin
  insert into public.suspensions (user_id, reason, until, created_by, scope)
    values (p_user, left(p_reason, 500), v_until, p_actor, p_scope)
    on conflict (user_id) do update set reason = excluded.reason, until = excluded.until, created_by = excluded.created_by,
      created_at = now(), scope = excluded.scope;
  perform private.log_action(p_actor, case when p_scope = 'full' then 'suspend' else 'ban' end, p_user, p_target_kind, p_target_id, p_report_id,
                             p_reason, null, p_scope, p_days, v_until);
  perform private.moderation_notice(p_user, 'ban:' || to_char(clock_timestamp(), 'YYYYMMDDHH24MISSUS'),
    case when p_scope = 'full' then 'Account suspended' else 'Community ban' end,
    case when p_scope = 'full'
      then 'Your account is suspended until ' || coalesce(private.uk_when(v_until), 'a moderator lifts it') || coalesce(': ' || nullif(rtrim(btrim(p_reason), '.'), ''), '') || '.'
      else private.ban_message('community', v_until, p_reason) end);
end;
$$;

-- Report queue actions: dismiss, hide, restore, or fully suspend (admins).
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
  perform private.check_can_act(v_uid, r.target_user);
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
    perform private.log_action(v_uid, case when p_action = 'hide' then 'hide' else 'unhide' end, r.target_user, r.target::text, r.target_id, r.id, p_reason);
  elsif p_action = 'suspend' then
    if r.target_user is null then raise exception 'That person isn''t on Nightshift any more.'; end if;
    perform private.check_ban_power(v_uid, 'full', p_days);
    perform private.apply_ban(v_uid, r.target_user, 'full', p_days, coalesce(p_reason, r.reason::text), r.id, r.target::text, r.target_id);
  else
    perform private.log_action(v_uid, 'dismiss', r.target_user, r.target::text, r.target_id, r.id, p_reason);
  end if;
  update public.reports
    set status = case when p_action = 'dismiss' then 'dismissed' else 'actioned' end, handled_by = v_uid, handled_at = now()
    where target = r.target and target_id = r.target_id and status = 'new';
end;
$$;

-- Warn: the person sees it next time they open the app and must acknowledge it.
create function public.warn_member(p_user uuid, p_reason text, p_note text default null)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
  v_reason text := btrim(coalesce(p_reason, ''));
  v_action uuid;
  v_id uuid;
begin
  perform private.check_can_act(v_uid, p_user);
  if not exists (select 1 from public.profiles p where p.id = p_user) then raise exception 'That person isn''t on Nightshift any more.'; end if;
  if char_length(v_reason) not between 3 and 200 then raise exception 'Give a reason (3 to 200 characters).'; end if;
  if char_length(coalesce(p_note, '')) > 500 then raise exception 'Keep the note to 500 characters or fewer.'; end if;
  v_action := private.log_action(v_uid, 'warn', p_user, 'profile', p_user, null, v_reason, p_note);
  insert into public.moderation_warnings (user_id, action_id, reason, note)
    values (p_user, v_action, v_reason, nullif(btrim(coalesce(p_note, '')), '')) returning id into v_id;
  perform private.moderation_notice(p_user, 'warn:' || v_id, 'Moderator warning', 'A moderator warned you: ' || v_reason);
  return v_id;
end;
$$;

-- Warnings I haven't acknowledged yet.
create function public.my_warnings()
returns table (id uuid, reason text, note text, created_at timestamptz)
language sql stable security definer
set search_path = ''
as $$
  select w.id, w.reason, w.note, w.created_at from public.moderation_warnings w
  where w.user_id = auth.uid() and w.acknowledged_at is null
  order by w.created_at
$$;

create function public.acknowledge_warning(p_id uuid)
returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  update public.moderation_warnings set acknowledged_at = coalesce(acknowledged_at, now())
    where id = p_id and user_id = private.require_uid();
end;
$$;

-- Ban from Community (or, admins, suspend fully) for p_days, or until lifted (null).
create function public.ban_member(p_user uuid, p_scope text, p_days int, p_reason text)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
  v_reason text := btrim(coalesce(p_reason, ''));
begin
  perform private.check_can_act(v_uid, p_user);
  if not exists (select 1 from public.profiles p where p.id = p_user) then raise exception 'That person isn''t on Nightshift any more.'; end if;
  perform private.check_ban_power(v_uid, p_scope, p_days);
  if char_length(v_reason) not between 3 and 300 then raise exception 'Give a reason (3 to 300 characters).'; end if;
  perform private.apply_ban(v_uid, p_user, p_scope, p_days, v_reason, null, 'profile', p_user);
end;
$$;

-- Lift a ban. Moderators lift Community bans of up to 7 days; admins any.
create or replace function public.lift_suspension(p_user uuid)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
  s public.suspensions;
begin
  perform private.check_can_act(v_uid, p_user);
  select * into s from public.suspensions where user_id = p_user;
  if not found then raise exception 'They aren''t banned.'; end if;
  if private.staff_rank(v_uid) < 2 and (s.scope = 'full' or s.until is null or s.until > s.created_at + interval '7 days 1 minute') then
    raise exception 'Only admins can lift that one.';
  end if;
  delete from public.suspensions where user_id = p_user;
  perform private.log_action(v_uid, 'lift', p_user, 'profile', p_user, null, null, null, s.scope);
  perform private.moderation_notice(p_user, 'lift:' || to_char(clock_timestamp(), 'YYYYMMDDHH24MISSUS'), 'Ban lifted',
    'Your ban was lifted: you can post again.');
end;
$$;

-- Make someone a moderator or admin, or remove their role (p_role null).
create function public.set_staff_role(p_user uuid, p_role text, p_reason text)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
  v_mine int := private.staff_rank(v_uid);
  v_now int := private.staff_rank(p_user);
  v_new int := case p_role when 'admin' then 2 when 'moderator' then 1 else 0 end;
  v_reason text := btrim(coalesce(p_reason, ''));
begin
  if v_mine < 2 then raise exception 'Only admins and the owner can change roles.'; end if;
  if p_user = v_uid then raise exception 'You can''t change your own role.'; end if;
  if p_role is not null and p_role not in ('admin', 'moderator') then raise exception 'Pick moderator or admin.'; end if;
  if v_now >= v_mine then raise exception 'You can''t change the role of someone with the same or a higher role.'; end if;
  if v_new >= v_mine then raise exception 'Only the owner can make admins.'; end if;
  if v_new = v_now then raise exception 'They already have that role.'; end if;
  if char_length(v_reason) not between 3 and 300 then raise exception 'Give a reason (3 to 300 characters).'; end if;
  if not exists (select 1 from public.profiles p where p.id = p_user and p.onboarded) then raise exception 'That person isn''t on Nightshift any more.'; end if;
  if p_role is null then
    delete from public.staff where user_id = p_user;
  else
    insert into public.staff (user_id, role, note) values (p_user, p_role, left(v_reason, 200))
      on conflict (user_id) do update set role = excluded.role;
  end if;
  perform private.log_action(v_uid, case when v_new > v_now then 'promote' else 'demote' end, p_user, 'profile', p_user, null, v_reason,
                             null, null, null, null, p_role);
  perform private.moderation_notice(p_user, 'role:' || to_char(clock_timestamp(), 'YYYYMMDDHH24MISSUS'),
    case when p_role is null then 'Staff role removed' else 'You''re now ' || case p_role when 'admin' then 'an admin' else 'a moderator' end end,
    case when p_role is null then 'You''re no longer on the Nightshift moderation team.'
         else 'You''re now ' || case p_role when 'admin' then 'an admin' else 'a moderator' end || ' on Nightshift. Settings › Moderation has the tools.' end);
end;
$$;

-- ===========================================================================
-- What staff read
-- ===========================================================================

-- One person: profile, counts, ban, and every moderation action about them.
create function public.member_overview(p_user uuid)
returns jsonb
language plpgsql stable security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v jsonb;
begin
  if not private.is_admin(v_uid) then raise exception 'Only staff can do that.'; end if;
  select jsonb_build_object(
    'id', p.id, 'handle', p.handle, 'display_name', p.display_name, 'region', p.region, 'joined', p.created_at,
    'role', private.staff_role(p.id),
    'rep', coalesce((select sum(f.rep) from public.forum_rep f where f.user_id = p.id), 0),
    'counts', jsonb_build_object(
      'posts', (select count(*) from public.posts x where x.author_id = p.id),
      'threads', (select count(*) from public.forum_threads x where x.author_id = p.id),
      'replies', (select count(*) from public.forum_replies x where x.author_id = p.id),
      'comments', (select count(*) from public.post_comments x where x.author_id = p.id),
      'chat', (select count(*) from public.chat_messages x where x.user_id = p.id and not x.system),
      'messages', (select count(*) from public.messages x where x.sender_id = p.id),
      'reports_against', (select count(*) from public.reports r where r.target_user = p.id),
      'warnings', (select count(*) from public.moderation_actions a where a.target_user = p.id and a.action = 'warn'),
      'bans', (select count(*) from public.moderation_actions a where a.target_user = p.id and a.action in ('ban', 'suspend', 'cooldown')),
      'selling_30d', (select count(*) from public.posts x where x.author_id = p.id and x.is_selling and x.created_at > now() - interval '30 days')
                   + (select count(*) from public.forum_threads x where x.author_id = p.id and x.is_selling and x.created_at > now() - interval '30 days')
    ),
    'ban', (select jsonb_build_object('scope', s.scope, 'until', s.until, 'reason', s.reason, 'since', s.created_at)
            from public.suspensions s where s.user_id = p.id and (s.until is null or s.until > now())),
    'log', coalesce((select jsonb_agg(jsonb_build_object(
              'id', a.id, 'action', a.action, 'actor_handle', a.actor_handle, 'actor_role', a.actor_role, 'reason', a.reason, 'note', a.note,
              'scope', a.scope, 'days', a.days, 'until', a.until, 'target_kind', a.target_kind, 'created_at', a.created_at) order by a.created_at desc)
            from (select * from public.moderation_actions a where a.target_user = p.id order by a.created_at desc limit 50) a), '[]'::jsonb)
  ) into v
  from public.profiles p where p.id = p_user;
  if v is null then raise exception 'That person isn''t on Nightshift any more.'; end if;
  return v;
end;
$$;

-- Their public writing, newest first, 30 at a time before p_before. Private
-- messages only when someone reported them (the copy staff already have).
create function public.member_history(p_user uuid, p_before timestamptz default null, p_limit int default 30)
returns table (kind text, id uuid, parent_id uuid, body text, created_at timestamptz, hidden boolean, is_selling boolean, is_repeat boolean, board text)
language plpgsql stable security definer
set search_path = ''
as $$
begin
  if not private.is_admin(auth.uid()) then raise exception 'Only staff can do that.'; end if;
  return query
  select * from (
    select 'post'::text, p.id, null::uuid, p.body, p.created_at, p.hidden_at is not null, p.is_selling, p.is_repeat, null::text
      from public.posts p where p.author_id = p_user
    union all
    select 'thread', t.id, null, t.title || E'\n' || t.body, t.created_at, t.hidden_at is not null, t.is_selling, t.is_repeat, t.board::text
      from public.forum_threads t where t.author_id = p_user
    union all
    select 'reply', r.id, r.thread_id, r.body, r.created_at, r.hidden_at is not null, false, r.is_repeat, null
      from public.forum_replies r where r.author_id = p_user
    union all
    select 'comment', c.id, c.post_id, c.body, c.created_at, c.hidden_at is not null, false, c.is_repeat, null
      from public.post_comments c where c.author_id = p_user
    union all
    select 'chat', c.id, c.event_id, c.body, c.created_at, c.hidden_at is not null, false, c.is_repeat, null
      from public.chat_messages c where c.user_id = p_user and not c.system
    union all
    select 'message', m.id, null, (select r.excerpt from public.reports r where r.target = 'message' and r.target_id = m.id order by r.created_at limit 1),
           m.created_at, m.hidden_at is not null, false, false, null
      from public.messages m
      where m.sender_id = p_user and exists (select 1 from public.reports r where r.target = 'message' and r.target_id = m.id)
  ) h (kind, id, parent_id, body, created_at, hidden, is_selling, is_repeat, board)
  where p_before is null or h.created_at < p_before
  order by h.created_at desc
  limit least(greatest(coalesce(p_limit, 30), 1), 100);
end;
$$;

-- The team: everyone on staff, their role and how many actions in 7 and 30 days.
create function public.moderation_team()
returns table (user_id uuid, handle text, display_name text, role text, added_at timestamptz, actions_7d int, actions_30d int)
language plpgsql stable security definer
set search_path = ''
as $$
begin
  if not private.is_admin(auth.uid()) then raise exception 'Only staff can do that.'; end if;
  return query
  select s.user_id, p.handle, p.display_name, s.role, s.added_at,
         (select count(*) from public.moderation_actions a where a.actor_id = s.user_id and a.created_at > now() - interval '7 days')::int,
         (select count(*) from public.moderation_actions a where a.actor_id = s.user_id and a.created_at > now() - interval '30 days')::int
  from public.staff s join public.profiles p on p.id = s.user_id
  order by case s.role when 'owner' then 0 when 'admin' then 1 else 2 end, p.handle;
end;
$$;

-- Admins and the owner: the audit log, newest first, filtered by who and what.
create function public.moderation_log(p_actor uuid default null, p_action text default null, p_before timestamptz default null, p_limit int default 50)
returns setof public.moderation_actions
language plpgsql stable security definer
set search_path = ''
as $$
begin
  if private.staff_rank(auth.uid()) < 2 then raise exception 'Only admins and the owner can read the audit log.'; end if;
  return query
  select * from public.moderation_actions a
  where (p_actor is null or a.actor_id = p_actor)
    and (p_action is null or a.action = p_action)
    and (p_before is null or a.created_at < p_before)
  order by a.created_at desc
  limit least(greatest(coalesce(p_limit, 50), 1), 200);
end;
$$;

-- ===========================================================================
-- Grants
-- ===========================================================================

revoke execute on all functions in schema private from public, anon;
grant execute on all functions in schema private to authenticated, service_role;
revoke execute on function private.rate_hit(uuid, text) from authenticated;

do $$
declare
  f regprocedure;
begin
  for f in
    select p.oid::regprocedure from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname in (
      'my_moderation_status', 'record_blocked_duplicate', 'moderate_report', 'warn_member', 'my_warnings', 'acknowledge_warning',
      'ban_member', 'lift_suspension', 'set_staff_role', 'member_overview', 'member_history', 'moderation_team', 'moderation_log')
  loop
    execute format('revoke execute on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated, service_role', f);
  end loop;
end;
$$;

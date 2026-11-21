-- Forum scope and groups: a thread is for Everyone (no region) or Local (a region, on any board),
-- and can belong to a make or model group ("seat", "seat:leon": keys from the vehicle list,
-- src/lib/forumGroups.ts). Group membership is a personal list kept on the phone, so no table.
-- Mirrors src/lib/forum.ts (threadProblem, threadsFor). Existing rows are unchanged: Local-board
-- rows keep their region, every other row has none and reads as Everyone.

alter table public.forum_threads
  add column group_key text check (group_key is null or group_key ~ '^[a-z0-9-]{1,40}(:[a-z0-9-]{1,60})?$');

-- A region now means "Local" on any board. The Local board still needs one.
alter table public.forum_threads drop constraint forum_local_region;
alter table public.forum_threads add constraint forum_local_region check (board <> 'local' or region is not null);

create index forum_threads_group_idx on public.forum_threads (group_key, last_activity_at desc) where group_key is not null;
create index forum_threads_region_idx on public.forum_threads (region, last_activity_at desc) where region is not null;

drop function if exists public.create_thread(public.forum_board, text, text, text, text[], uuid, text, int, boolean, text, text);

create function public.create_thread(
  p_board public.forum_board,
  p_region text,
  p_title text,
  p_body text,
  p_photos text[] default '{}',
  p_build_id uuid default null,
  p_listing_kind text default null,
  p_price_pence int default null,
  p_ono boolean default false,
  p_condition text default null,
  p_handover text default null,
  p_group_key text default null
)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
  v_title text := btrim(coalesce(p_title, ''));
  v_body text := btrim(coalesce(p_body, ''));
  v_listing boolean := p_board = 'for_sale';
  v_kind text := case when p_board = 'for_sale' then coalesce(p_listing_kind, 'sale') end;
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
  if p_region is not null and p_region not in ('Midlands','North West','North East','Yorkshire','East','London','South East','South West','Wales','Scotland','Northern Ireland') then raise exception 'Pick a region from the list.'; end if;
  if p_group_key is not null and p_group_key !~ '^[a-z0-9-]{1,40}(:[a-z0-9-]{1,60})?$' then raise exception 'Pick a group from the list.'; end if;
  if v_listing then
    if v_kind not in ('sale', 'wanted') then raise exception 'Say whether it''s for sale or wanted.'; end if;
    if p_price_pence is not null and (p_price_pence < 0 or p_price_pence > 100000000) then
      raise exception 'Give a price between £0 and £1,000,000.';
    end if;
    if coalesce(p_ono, false) and p_price_pence is null then raise exception 'Add a price to say "or nearest offer".'; end if;
    if p_condition is not null and p_condition not in ('new', 'like_new', 'good', 'fair', 'parts') then
      raise exception 'Pick a condition from the list.';
    end if;
    if p_handover is not null and p_handover not in ('collection', 'postage', 'either') then
      raise exception 'Pick collection, postage or either.';
    end if;
  end if;
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
  insert into public.forum_threads (board, region, group_key, author_id, title, body, photos, build_id, is_selling, is_repeat,
                                    listing_kind, price_pence, ono, condition, handover)
    values (p_board, p_region, p_group_key, v_uid, v_title, v_body, coalesce(p_photos, '{}'), p_build_id, v_selling, v_repeat,
            v_kind,
            case when v_listing then p_price_pence end,
            case when v_listing then coalesce(p_ono, false) else false end,
            case when v_listing and v_kind = 'sale' then p_condition end,
            case when v_listing then p_handover end)
    returning id into v_id;
  perform private.check_sell_only(v_uid);
  return v_id;
end;
$$;

revoke execute on function public.create_thread(public.forum_board, text, text, text, text[], uuid, text, int, boolean, text, text, text) from public, anon;
grant execute on function public.create_thread(public.forum_board, text, text, text, text[], uuid, text, int, boolean, text, text, text) to authenticated, service_role;

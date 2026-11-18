-- REVIEW-8: For sale & wanted threads become listings: for sale or wanted, a price (or a
-- budget for wanted) in pence with an optional "ONO", the condition, collection or postage,
-- and Sold. Mirrors src/lib/forum.ts (listingProblem, priceLabel). Payments never go
-- through Nightshift: these are facts on a post, nothing more.

alter table public.forum_threads
  add column listing_kind text check (listing_kind in ('sale', 'wanted')),
  add column price_pence int check (price_pence between 0 and 100000000),
  add column ono boolean not null default false,
  add column condition text check (condition in ('new', 'like_new', 'good', 'fair', 'parts')),
  add column handover text check (handover in ('collection', 'postage', 'either')),
  add column sold_at timestamptz,
  -- Listing facts only on For sale & wanted.
  add constraint forum_listing_board check (
    board = 'for_sale'
    or (listing_kind is null and price_pence is null and not ono and condition is null and handover is null and sold_at is null)
  ),
  -- "ONO" needs a price.
  add constraint forum_listing_ono check (not ono or price_pence is not null);

-- The signature grows, so the old one goes first (named calls with the old six arguments still work).
drop function if exists public.create_thread(public.forum_board, text, text, text, text[], uuid);

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
  p_handover text default null
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
  insert into public.forum_threads (board, region, author_id, title, body, photos, build_id, is_selling, is_repeat,
                                    listing_kind, price_pence, ono, condition, handover)
    values (p_board, case when p_board = 'local' then p_region end, v_uid, v_title, v_body, coalesce(p_photos, '{}'), p_build_id, v_selling, v_repeat,
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

-- Sold (or found, for a wanted listing): the author only. Marking it again keeps the first time.
create function public.set_listing_sold(p_thread_id uuid, p_sold boolean)
returns timestamptz
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
  t public.forum_threads;
begin
  select * into t from public.forum_threads where id = p_thread_id;
  if t.id is null then raise exception 'That thread isn''t there any more.'; end if;
  if t.author_id <> v_uid then raise exception 'Only the person who listed it can mark it sold.'; end if;
  if t.board <> 'for_sale' then raise exception 'Only For sale & wanted listings can be marked sold.'; end if;
  update public.forum_threads
    set sold_at = case when p_sold then coalesce(sold_at, now()) end
    where id = p_thread_id
    returning sold_at into t.sold_at;
  return t.sold_at;
end;
$$;

do $$
declare
  f regprocedure;
begin
  for f in
    select p.oid::regprocedure from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname in ('create_thread', 'set_listing_sold')
  loop
    execute format('revoke execute on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated, service_role', f);
  end loop;
end;
$$;

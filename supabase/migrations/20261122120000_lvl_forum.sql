-- Level up (forum): what a sold part went for. A seller can record the price when they mark a
-- listing sold (optional). Only a price is stored: never who bought it. The app shows a "recently
-- sold for" range for a group or a search, from these prices (and only once there are 3 or more).
-- Everything else in this release (Solved, fault codes, Common problems, "Fits your ...") is built
-- from columns that already exist, so it needs nothing here. Additive: older apps keep calling
-- set_listing_sold(p_thread_id, p_sold) and it works as before.

alter table public.forum_threads
  add column sold_price_pence int check (sold_price_pence between 0 and 100000000),
  -- A price only on a sold sale: not on wanted listings, not before it is sold.
  add constraint forum_sold_price check (sold_price_pence is null or (sold_at is not null and listing_kind = 'sale'));

create index forum_threads_sold_idx on public.forum_threads (group_key, sold_at desc) where sold_price_pence is not null;

-- The signature grows, so the old one goes first (calls with the two old arguments still work).
drop function if exists public.set_listing_sold(uuid, boolean);

create function public.set_listing_sold(p_thread_id uuid, p_sold boolean, p_price_pence int default null)
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
  if p_price_pence is not null and (p_price_pence < 0 or p_price_pence > 100000000) then
    raise exception 'Give a price between £0 and £1,000,000.';
  end if;
  perform private.check_not_suspended(v_uid);
  update public.forum_threads
    set sold_at = case when p_sold then coalesce(sold_at, now()) end,
        -- Marking it sold again keeps the first price unless a new one is given; back on sale clears it.
        sold_price_pence = case when p_sold and listing_kind = 'sale' then coalesce(p_price_pence, sold_price_pence) end
    where id = p_thread_id
    returning sold_at into t.sold_at;
  return t.sold_at;
end;
$$;

revoke execute on function public.set_listing_sold(uuid, boolean, int) from public, anon;
grant execute on function public.set_listing_sold(uuid, boolean, int) to authenticated, service_role;

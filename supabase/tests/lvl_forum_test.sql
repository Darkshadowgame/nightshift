-- Level up (forum), 20261122120000: a seller can record what a sold part went for. Only a price is
-- kept, only on a sold sale, set by the seller alone, and the old two-argument call still works.
-- Everything rolls back.
--
-- Users (made up): S seller, B someone else.

begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(14);

insert into auth.users (id, email) values
  ('ea100000-0000-0000-0000-000000000001', 'lf-s@example.test'),
  ('ea100000-0000-0000-0000-000000000002', 'lf-b@example.test');
update public.profiles set handle = 'lvlforum_' || right(id::text, 1), display_name = 'Forum ' || right(id::text, 1), region = 'Midlands', onboarded = true
  where id::text like 'ea100000-0000-0000-0000-00000000000%';

-- Table.
select has_column('public', 'forum_threads', 'sold_price_pence', 'table: sold_price_pence exists');
select throws_ok($$ insert into public.forum_threads (board, author_id, title, listing_kind, sold_price_pence) values ('for_sale', 'ea100000-0000-0000-0000-000000000001', 'Not sold yet', 'sale', 100) $$,
  '23514', null, 'table: no sold price before it is sold');
select throws_ok($$ insert into public.forum_threads (board, author_id, title, listing_kind, sold_at, sold_price_pence) values ('for_sale', 'ea100000-0000-0000-0000-000000000001', 'Wanted found', 'wanted', now(), 100) $$,
  '23514', null, 'table: no sold price on a wanted listing');
select throws_ok($$ insert into public.forum_threads (board, author_id, title, listing_kind, sold_at, sold_price_pence) values ('for_sale', 'ea100000-0000-0000-0000-000000000001', 'Too dear', 'sale', now(), 100000001) $$,
  '23514', null, 'table: a sold price is at most £1,000,000');

select is(has_function_privilege('anon', 'public.set_listing_sold(uuid, boolean, int)', 'execute'), false, 'privileges: signed-out people can''t call set_listing_sold');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"ea100000-0000-0000-0000-000000000001","role":"authenticated"}', true);

select set_config('t.sale', public.create_thread(p_board => 'for_sale', p_region => null, p_title => 'N54 charge pipe', p_body => 'Aluminium, no leaks.',
  p_listing_kind => 'sale', p_price_pence => 6000, p_group_key => 'bmw:335i')::text, true);

-- Sold with a price.
select lives_ok($$ select public.set_listing_sold(current_setting('t.sale')::uuid, true, 5500) $$, 'set_listing_sold: sold with a price');
select is((select sold_price_pence from public.forum_threads where id = current_setting('t.sale')::uuid), 5500, 'set_listing_sold: the price is kept');

-- Marking it sold again without a price keeps the first one.
select public.set_listing_sold(current_setting('t.sale')::uuid, true);
select is((select sold_price_pence from public.forum_threads where id = current_setting('t.sale')::uuid), 5500, 'set_listing_sold: sold again without a price keeps it');

-- Out of range is refused.
select throws_ok($$ select public.set_listing_sold(current_setting('t.sale')::uuid, true, 100000001) $$, 'P0001', null, 'set_listing_sold: over £1,000,000 is refused');

-- Back on sale clears it.
select public.set_listing_sold(current_setting('t.sale')::uuid, false);
select is((select sold_price_pence from public.forum_threads where id = current_setting('t.sale')::uuid), null, 'set_listing_sold: back on sale clears the price');

-- The old two-argument call works with no price.
select lives_ok($$ select public.set_listing_sold(current_setting('t.sale')::uuid, true) $$, 'set_listing_sold: the old two arguments still work');
select is((select sold_price_pence from public.forum_threads where id = current_setting('t.sale')::uuid), null, 'set_listing_sold: no price given, none kept');

-- A wanted listing never keeps a price.
select set_config('t.wanted', public.create_thread(p_board => 'for_sale', p_region => null, p_title => 'Wanted: Saxo arches', p_body => '', p_listing_kind => 'wanted')::text, true);
select public.set_listing_sold(current_setting('t.wanted')::uuid, true, 900);
select is((select sold_price_pence from public.forum_threads where id = current_setting('t.wanted')::uuid), null, 'set_listing_sold: a wanted listing keeps no price');

-- Only the seller.
select set_config('request.jwt.claims', '{"sub":"ea100000-0000-0000-0000-000000000002","role":"authenticated"}', true);
select throws_ok($$ select public.set_listing_sold(current_setting('t.sale')::uuid, true, 100) $$, 'P0001', 'Only the person who listed it can mark it sold.', 'set_listing_sold: only the seller');

select * from finish();
rollback;

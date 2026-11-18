-- For sale & wanted listings (20261118230000): price, ONO, condition, collection or
-- postage, for sale or wanted, Sold by the author only, and no listing facts on
-- other boards. Everything rolls back.
--
-- Users (made up): S seller, B buyer.

begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(22);

insert into auth.users (id, email) values
  ('e8000000-0000-0000-0000-000000000001', 'fl-s@example.test'),
  ('e8000000-0000-0000-0000-000000000002', 'fl-b@example.test');
update public.profiles set handle = 'listing_' || right(id::text, 1), display_name = 'Listing ' || right(id::text, 1), region = 'Midlands', onboarded = true
  where id::text like 'e8000000-0000-0000-0000-00000000000%';

-- The table keeps listing facts on For sale & wanted only.
select throws_ok($$ insert into public.forum_threads (board, author_id, title, price_pence) values ('cars', 'e8000000-0000-0000-0000-000000000001', 'Not a listing', 100) $$,
  '23514', null, 'table: no price off For sale & wanted');
select throws_ok($$ insert into public.forum_threads (board, author_id, title, ono) values ('for_sale', 'e8000000-0000-0000-0000-000000000001', 'No price', true) $$,
  '23514', null, 'table: ONO needs a price');
select throws_ok($$ insert into public.forum_threads (board, author_id, title, condition) values ('for_sale', 'e8000000-0000-0000-0000-000000000001', 'Odd condition', 'mint') $$,
  '23514', null, 'table: condition from the list');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"e8000000-0000-0000-0000-000000000001","role":"authenticated"}', true);

select set_config('t.sale', public.create_thread(p_board => 'for_sale', p_region => null, p_title => 'FK8 rear wing, Championship White', p_body => 'Off a 2019 car, no cracks.',
  p_listing_kind => 'sale', p_price_pence => 45000, p_ono => true, p_condition => 'good', p_handover => 'collection')::text, true);
select is((select listing_kind from public.forum_threads where id = current_setting('t.sale')::uuid), 'sale', 'create_thread: for sale');
select is((select price_pence from public.forum_threads where id = current_setting('t.sale')::uuid), 45000, 'create_thread: the price in pence');
select ok((select ono from public.forum_threads where id = current_setting('t.sale')::uuid), 'create_thread: ONO');
select is((select condition from public.forum_threads where id = current_setting('t.sale')::uuid), 'good', 'create_thread: condition');
select is((select handover from public.forum_threads where id = current_setting('t.sale')::uuid), 'collection', 'create_thread: collection');
select is((select sold_at from public.forum_threads where id = current_setting('t.sale')::uuid), null, 'create_thread: not sold yet');

select set_config('t.wanted', public.create_thread(p_board => 'for_sale', p_region => null, p_title => 'Wanted: Saxo VTS rear arches', p_body => 'Any colour.',
  p_listing_kind => 'wanted', p_price_pence => 8000, p_condition => 'good', p_handover => 'either')::text, true);
select is((select listing_kind || ' ' || price_pence || ' ' || coalesce(condition, 'none') from public.forum_threads where id = current_setting('t.wanted')::uuid), 'wanted 8000 none',
  'create_thread: wanted keeps a budget, no condition');

-- B starts the rest (three new threads in 10 minutes is the most for one person).
select set_config('request.jwt.claims', '{"sub":"e8000000-0000-0000-0000-000000000002","role":"authenticated"}', true);
select set_config('t.plain', public.create_thread('for_sale', null, 'Old style listing', 'Seats')::text, true);
select is((select listing_kind from public.forum_threads where id = current_setting('t.plain')::uuid), 'sale', 'create_thread: the old six arguments still work (for sale by default)');

select set_config('t.advice', public.create_thread(p_board => 'advice', p_region => null, p_title => 'Which clutch?', p_body => '', p_price_pence => 100, p_ono => true, p_condition => 'good')::text, true);
select is((select coalesce(listing_kind, 'none') || ' ' || coalesce(price_pence::text, 'none') || ' ' || ono from public.forum_threads where id = current_setting('t.advice')::uuid), 'none none false',
  'create_thread: listing facts are dropped off For sale & wanted');

select throws_ok($$ select public.create_thread(p_board => 'for_sale', p_region => null, p_title => 'Odd thing', p_body => '', p_listing_kind => 'swap') $$, 'P0001',
  'Say whether it''s for sale or wanted.', 'create_thread: for sale or wanted only');
select throws_ok($$ select public.create_thread(p_board => 'for_sale', p_region => null, p_title => 'Free thing', p_body => '', p_ono => true) $$, 'P0001',
  'Add a price to say "or nearest offer".', 'create_thread: ONO needs a price');
select throws_ok($$ select public.create_thread(p_board => 'for_sale', p_region => null, p_title => 'Pricey thing', p_body => '', p_price_pence => -1) $$, 'P0001',
  'Give a price between £0 and £1,000,000.', 'create_thread: no negative price');

-- Sold: the author only.
select is((select price_pence from public.forum_threads where id = current_setting('t.sale')::uuid), 45000, 'read: B sees the price');
select throws_ok(format('select public.set_listing_sold(%L, true)', current_setting('t.sale')), 'P0001',
  'Only the person who listed it can mark it sold.', 'set_listing_sold: not by someone else');
select throws_ok(format('select public.set_listing_sold(%L, true)', current_setting('t.advice')), 'P0001',
  'Only For sale & wanted listings can be marked sold.', 'set_listing_sold: For sale & wanted only');
select throws_ok($$ update public.forum_threads set sold_at = now() where id = current_setting('t.sale')::uuid $$, '42501', null, 'table: no direct updates');

select set_config('request.jwt.claims', '{"sub":"e8000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
select isnt(public.set_listing_sold(current_setting('t.sale')::uuid, true), null, 'set_listing_sold: the author marks it sold');
select ok((select sold_at is not null from public.forum_threads where id = current_setting('t.sale')::uuid), 'set_listing_sold: sold');
select is(public.set_listing_sold(current_setting('t.sale')::uuid, false), null, 'set_listing_sold: and back on sale');

select * from finish();
rollback;

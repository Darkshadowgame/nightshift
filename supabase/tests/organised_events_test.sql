-- Local meets and organised events (20261122190000_organised_events.sql; the app's rules are src/lib/organised.ts).
--
-- Users (made up): A is an admin, M a moderator, H hosts E1 (future) and E3 (finished), N hosts E2 (future),
-- V is just a member. H and N start without the organiser mark. Everything rolls back.

begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(44);

insert into auth.users (id, email) values
  ('0a000000-0000-0000-0000-00000000000a', 'oe-a@example.test'),
  ('0a000000-0000-0000-0000-00000000000b', 'oe-m@example.test'),
  ('0a000000-0000-0000-0000-00000000000c', 'oe-h@example.test'),
  ('0a000000-0000-0000-0000-00000000000d', 'oe-n@example.test'),
  ('0a000000-0000-0000-0000-00000000000e', 'oe-v@example.test');
update public.profiles set handle = 'oe_' || right(id::text, 1), display_name = 'Person ' || right(id::text, 1), region = 'East', onboarded = true
  where id::text like '0a000000-0000-0000-0000-0000000000__';
insert into public.staff (user_id, role) values
  ('0a000000-0000-0000-0000-00000000000a', 'admin'),
  ('0a000000-0000-0000-0000-00000000000b', 'moderator');

insert into public.events (id, type, title, starts_at, ends_at, reveal_minutes_before, area, area_radius_miles, area_name, invite_everyone, current_stop) values
  ('0e000000-0000-0000-0000-0000000000a1', 'meet', 'Hosted by H', now() + interval '2 days', now() + interval '2 days 3 hours', 60, private.pt(53.22, -0.52), 25, 'Lincoln', true, 0),
  ('0e000000-0000-0000-0000-0000000000a2', 'meet', 'Hosted by N', now() + interval '3 days', now() + interval '3 days 3 hours', 60, private.pt(53.22, -0.52), 25, 'Lincoln', true, 0),
  ('0e000000-0000-0000-0000-0000000000a3', 'meet', 'Finished', now() - interval '3 days', now() - interval '3 days' + interval '3 hours', 60, private.pt(53.22, -0.52), 25, 'Lincoln', true, 0);
insert into public.event_hosts (event_id, user_id) values
  ('0e000000-0000-0000-0000-0000000000a1', '0a000000-0000-0000-0000-00000000000c'),
  ('0e000000-0000-0000-0000-0000000000a2', '0a000000-0000-0000-0000-00000000000d'),
  ('0e000000-0000-0000-0000-0000000000a3', '0a000000-0000-0000-0000-00000000000c');

-- Table.
select has_table('public', 'organisers', 'table: organisers exists');
select has_column('public', 'events', 'organised', 'table: events has organised');
select has_column('public', 'events', 'ticket_url', 'table: events has ticket_url');
select is((select organised from public.events where id = '0e000000-0000-0000-0000-0000000000a1'), false, 'table: every meet is local by default');
select throws_ok($$ update public.events set ticket_pence = 1200 where id = '0e000000-0000-0000-0000-0000000000a1' $$,
  '23514', null, 'table: a local meet can''t carry a ticket price');
select throws_ok($$ update public.events set organised = true, sponsors = '[{"name":"a"},{"name":"b"},{"name":"c"},{"name":"d"}]' where id = '0e000000-0000-0000-0000-0000000000a1' $$,
  '23514', null, 'table: at most 3 sponsors');
select throws_ok($$ update public.events set organised = true, ticket_url = 'http://example.com/t' where id = '0e000000-0000-0000-0000-0000000000a1' $$,
  '23514', null, 'table: a ticket link must be https');
select has_column('public', 'events_list', 'organised', 'view: events_list lists organised');
select has_column('public', 'events_list', 'capacity', 'view: events_list still lists the older columns');
select is(has_function_privilege('anon', 'public.set_organiser(uuid, boolean, text)', 'execute'), false, 'privileges: signed-out people can''t set the mark');
select is(has_function_privilege('anon', 'public.set_event_organised(uuid, boolean, text, jsonb, integer, text)', 'execute'), false, 'privileges: signed-out people can''t mark an event');

-- H has no mark yet.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"0a000000-0000-0000-0000-00000000000c","role":"authenticated"}', true);
select throws_ok($$ select public.set_event_organised('0e000000-0000-0000-0000-0000000000a1', true, 'Sample Show Co', '[]', null, null) $$,
  null, 'Only organiser accounts can post organised events.', 'mark: a member without the mark can''t post an organised event');
select throws_ok($$ select public.set_organiser('0a000000-0000-0000-0000-00000000000c', true, 'Runs shows') $$,
  null, 'Only admins and the owner can do that.', 'staff: a member can''t grant it to themselves');
select is(public.is_organiser('0a000000-0000-0000-0000-00000000000c'), false, 'staff: H is not an organiser yet');

-- A moderator can't grant it; an admin can.
select set_config('request.jwt.claims', '{"sub":"0a000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
select throws_ok($$ select public.set_organiser('0a000000-0000-0000-0000-00000000000c', true, 'Runs shows') $$,
  null, 'Only admins and the owner can do that.', 'staff: a moderator can''t grant it');
select set_config('request.jwt.claims', '{"sub":"0a000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select throws_ok($$ select public.set_organiser('0a000000-0000-0000-0000-00000000000c', true, 'x') $$,
  null, 'Give a reason (3 to 200 characters).', 'staff: a reason is needed');
select lives_ok($$ select public.set_organiser('0a000000-0000-0000-0000-00000000000c', true, 'Runs the Sample Show Co shows') $$, 'staff: an admin grants it to H');
select is(public.is_organiser('0a000000-0000-0000-0000-00000000000c'), true, 'staff: H is now an organiser');
reset role;
select ok(exists (select 1 from public.notices where user_id = '0a000000-0000-0000-0000-00000000000c' and title = 'You can post organised events'), 'staff: H is told');

-- H posts an organised event.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"0a000000-0000-0000-0000-00000000000c","role":"authenticated"}', true);
select is(public.is_organiser('0a000000-0000-0000-0000-00000000000c'), true, 'mark: H can read their own mark');
select lives_ok($$ select public.set_event_organised('0e000000-0000-0000-0000-0000000000a1', true, '  Sample   Show Co ',
  '[{"name":"Sample Detailing","shop":"partner:demo-partner-detailing"},{"name":"Sample Tyres"}]', 1200, 'https://example.com/tickets') $$, 'event: an organiser marks their event organised');
select is((select organised from public.events where id = '0e000000-0000-0000-0000-0000000000a1'), true, 'event: it is organised');
select is((select organiser_name from public.events where id = '0e000000-0000-0000-0000-0000000000a1'), 'Sample Show Co', 'event: the organiser name is tidied');
select is((select jsonb_array_length(sponsors) from public.events where id = '0e000000-0000-0000-0000-0000000000a1'), 2, 'event: two sponsors');
select is((select sponsors -> 0 ->> 'shop' from public.events where id = '0e000000-0000-0000-0000-0000000000a1'), 'partner:demo-partner-detailing', 'event: a sponsor can link a shop');
select is((select ticket_pence from public.events where id = '0e000000-0000-0000-0000-0000000000a1'), 1200, 'event: the ticket price is kept in pence');
select throws_ok($$ select public.set_event_organised('0e000000-0000-0000-0000-0000000000a1', true, 'Sample Show Co', '[{"name":"a"},{"name":"b"},{"name":"c"},{"name":"d"}]', null, null) $$,
  null, 'An event can have up to 3 sponsors.', 'event: more than 3 sponsors is refused');
select throws_ok($$ select public.set_event_organised('0e000000-0000-0000-0000-0000000000a1', true, 'Sample Show Co', '[]', null, 'http://example.com/t') $$,
  null, 'The ticket link must start with https:// and be a web address.', 'event: a link that isn''t https is refused');
select throws_ok($$ select public.set_event_organised('0e000000-0000-0000-0000-0000000000a1', true, 'Sample Show Co', '[]', 0, null) $$,
  null, 'Pick a ticket price from £0.01 to £1,000, or leave it empty.', 'event: a price of nothing is refused');
select throws_ok($$ select public.set_event_organised('0e000000-0000-0000-0000-0000000000a1', true, 'X', '[]', null, null) $$,
  null, 'Say who is organising it (2 to 60 characters).', 'event: an organiser name is needed');
select throws_ok($$ select public.set_event_organised('0e000000-0000-0000-0000-0000000000a1', true, 'Sample Show Co', '[{"name":"Shop","shop":"bad shop!"}]', null, null) $$,
  null, 'That shop link isn''t one Slipstream knows.', 'event: a shop link has to look like a shop id');
select throws_ok($$ select public.set_event_organised('0e000000-0000-0000-0000-0000000000a1', true, 'Street racing crew', '[]', null, null) $$,
  'P0001', null, 'event: organiser text goes through the public text check');
select lives_ok($$ select public.set_event_organised('0e000000-0000-0000-0000-0000000000a1', true, 'Sample Show Co', '[{"name":"Sample Tyres"},{"name":"sample tyres"}]', null, null) $$, 'event: a repeated sponsor is accepted once');
select is((select jsonb_array_length(sponsors) from public.events where id = '0e000000-0000-0000-0000-0000000000a1'), 1, 'event: the repeat is dropped');
select throws_ok($$ select public.set_event_organised('0e000000-0000-0000-0000-0000000000a3', true, 'Sample Show Co', '[]', null, null) $$,
  null, 'This event has finished.', 'event: a finished one can''t be changed');

-- Only hosts, and clearing is open to a host without the mark.
select set_config('request.jwt.claims', '{"sub":"0a000000-0000-0000-0000-00000000000e","role":"authenticated"}', true);
select throws_ok($$ select public.set_event_organised('0e000000-0000-0000-0000-0000000000a1', false, null, '[]', null, null) $$,
  null, 'Only hosts can change that.', 'event: a member who isn''t a host can''t change it');
select is((select count(*)::int from public.organisers), 0, 'privacy: a member can''t read who the organisers are');
select throws_ok($$ select public.is_organiser('0a000000-0000-0000-0000-00000000000c') $$, null, 'Only staff can do that.', 'privacy: or ask about someone else');
select set_config('request.jwt.claims', '{"sub":"0a000000-0000-0000-0000-00000000000d","role":"authenticated"}', true);
select lives_ok($$ select public.set_event_organised('0e000000-0000-0000-0000-0000000000a2', false, 'Sneaky Co', '[{"name":"X"}]', 500, null) $$, 'event: a host without the mark can keep a meet local');
select is((select ticket_pence from public.events where id = '0e000000-0000-0000-0000-0000000000a2'), null, 'event: a local meet takes no price');

-- H goes back to a local meet: everything commercial is cleared.
select set_config('request.jwt.claims', '{"sub":"0a000000-0000-0000-0000-00000000000c","role":"authenticated"}', true);
select lives_ok($$ select public.set_event_organised('0e000000-0000-0000-0000-0000000000a1', false, null, '[]', null, null) $$, 'clear: H makes it a local meet again');
select is((select organised or sponsors <> '[]'::jsonb or organiser_name is not null from public.events where id = '0e000000-0000-0000-0000-0000000000a1'), false, 'clear: no organiser, sponsors or tickets left');

-- Staff take the mark away.
select set_config('request.jwt.claims', '{"sub":"0a000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select lives_ok($$ select public.set_organiser('0a000000-0000-0000-0000-00000000000c', false, 'No longer runs shows') $$, 'staff: an admin removes it');
select set_config('request.jwt.claims', '{"sub":"0a000000-0000-0000-0000-00000000000c","role":"authenticated"}', true);
select throws_ok($$ select public.set_event_organised('0e000000-0000-0000-0000-0000000000a1', true, 'Sample Show Co', '[]', null, null) $$,
  null, 'Only organiser accounts can post organised events.', 'staff: without the mark H can post local meets only');

select * from finish();
rollback;

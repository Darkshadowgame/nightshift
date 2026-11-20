-- Discovery: travel settings, "new event near you" notices, search_events()
-- and staff read access. Run with `npx supabase test db` (rolled back).
--
-- Places are made up, in Lincolnshire. The new-event trigger is deferred to
-- the end of the transaction, and tests never commit, so `set constraints ...
-- immediate` stands in for the commit where a test needs it to have run.
--
-- Users: H host; N near (notify, car); S near (search); X near (off); B near
-- (notify, bike only); T 15 mi away (notify, travels 10 mi); F far (Plymouth);
-- C co-host (near, notify, car); Y near with no builds; A staff (no home).

begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(75);

insert into auth.users (id, email) values
  ('a0000000-0000-0000-0000-000000000001', 'h@example.test'),
  ('a0000000-0000-0000-0000-000000000002', 'n@example.test'),
  ('a0000000-0000-0000-0000-000000000003', 's@example.test'),
  ('a0000000-0000-0000-0000-000000000004', 'x@example.test'),
  ('a0000000-0000-0000-0000-000000000005', 'b@example.test'),
  ('a0000000-0000-0000-0000-000000000006', 't@example.test'),
  ('a0000000-0000-0000-0000-000000000007', 'f@example.test'),
  ('a0000000-0000-0000-0000-000000000008', 'c@example.test'),
  ('a0000000-0000-0000-0000-000000000009', 'a@example.test'),
  ('a0000000-0000-0000-0000-00000000000a', 'y@example.test');

insert into public.profile_homes (user_id, home) values
  ('a0000000-0000-0000-0000-000000000001', private.pt(53.23, -0.54)),
  ('a0000000-0000-0000-0000-000000000002', private.pt(53.21, -0.50)),
  ('a0000000-0000-0000-0000-000000000003', private.pt(53.24, -0.55)),
  ('a0000000-0000-0000-0000-000000000004', private.pt(53.22, -0.53)),
  ('a0000000-0000-0000-0000-000000000005', private.pt(53.21, -0.51)),
  ('a0000000-0000-0000-0000-000000000006', private.pt(53.44, -0.52)),
  ('a0000000-0000-0000-0000-000000000007', private.pt(50.37, -4.14)),
  ('a0000000-0000-0000-0000-000000000008', private.pt(53.22, -0.51)),
  ('a0000000-0000-0000-0000-00000000000a', private.pt(53.21, -0.52));

insert into public.builds (owner_id, kind, make, model, stock_bhp, weight_kg) values
  ('a0000000-0000-0000-0000-000000000002', 'car', 'Honda', 'Civic Type R', 316, 1430),
  ('a0000000-0000-0000-0000-000000000003', 'car', 'Honda', 'Civic Type R', 316, 1430),
  ('a0000000-0000-0000-0000-000000000004', 'car', 'Honda', 'Civic Type R', 316, 1430),
  ('a0000000-0000-0000-0000-000000000005', 'bike', 'Yamaha', 'R6', 118, 190),
  ('a0000000-0000-0000-0000-000000000006', 'car', 'Honda', 'Civic Type R', 316, 1430),
  ('a0000000-0000-0000-0000-000000000007', 'car', 'Honda', 'Civic Type R', 316, 1430),
  ('a0000000-0000-0000-0000-000000000008', 'car', 'Honda', 'Civic Type R', 316, 1430);

-- Staff are added with the service role (here: the table owner).
insert into public.staff (user_id, note) values ('a0000000-0000-0000-0000-000000000009', 'moderator');

set local role authenticated;

-- ---------------------------------------------------------------------------
-- Willing to travel and alerts: personal settings
-- ---------------------------------------------------------------------------

select set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-000000000003","role":"authenticated"}', true);
select lives_ok($$ select public.save_travel_prefs(10, 'search') $$, 'save_travel_prefs: S travels 10 mi and will search');
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-000000000004","role":"authenticated"}', true);
select lives_ok($$ select public.save_travel_prefs(25, 'off') $$, 'save_travel_prefs: X turns alerts off');
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-000000000006","role":"authenticated"}', true);
select lives_ok($$ select public.save_travel_prefs(10, 'notify') $$, 'save_travel_prefs: T travels 10 mi');

select set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-000000000002","role":"authenticated"}', true);
select is((select travel_miles from public.save_travel_prefs(25, 'notify')), 25, 'save_travel_prefs: returns what was saved');
select is((select count(*) from public.profile_settings)::int, 1, 'profile_settings: you only see your own row');
select is((select new_event_alerts from public.profile_settings), 'notify', 'profile_settings: the owner reads their setting');
select throws_ok($$ select public.save_travel_prefs(0, 'notify') $$, 'P0001', 'Pick how far you''d travel: 1 to 300 miles.', 'save_travel_prefs: at least 1 mi');
select throws_ok($$ select public.save_travel_prefs(301, 'notify') $$, 'P0001', 'Pick how far you''d travel: 1 to 300 miles.', 'save_travel_prefs: at most 300 mi');
select throws_ok($$ select public.save_travel_prefs(2.5, 'notify') $$, 'P0001', 'Use a whole number of miles.', 'save_travel_prefs: whole miles');
select throws_ok($$ select public.save_travel_prefs(25, 'loud') $$, 'P0001', 'Pick how you hear about new events.', 'save_travel_prefs: notify, search or off');
select throws_ok($$ update public.profile_settings set travel_miles = 50 $$, '42501', null, 'profile_settings: no direct writes');
select throws_ok($$ insert into public.profile_settings (user_id) values ('a0000000-0000-0000-0000-000000000005') $$, '42501', null,
  'profile_settings: nobody writes anyone else''s');

-- ---------------------------------------------------------------------------
-- New events near you
-- ---------------------------------------------------------------------------

-- H hosts a cars-only meet tomorrow, with C as a co-host.
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
select set_config('t.meet', (public.save_event(
  jsonb_build_object('type', 'meet', 'title', 'Lincoln late meet', 'starts_at', now() + interval '1 day',
    'area', jsonb_build_object('lat', 53.22, 'lng', -0.52), 'area_radius_miles', 3, 'area_name', 'Lincoln',
    'filter', jsonb_build_object('everyone', false, 'cars', true, 'bikes', false, 'min_mods', 0, 'radius_miles', 25)),
  jsonb_build_array(jsonb_build_object('name', 'Secret car park', 'lat', 53.20, 'lng', -0.50)),
  array['a0000000-0000-0000-0000-000000000008'::uuid]) ->> 'id'), true);

reset role;
select is((select count(*) from public.notices where kind = 'nearby')::int, 0, 'nearby: nothing is queued before the transaction ends');
set constraints public.events_queue_nearby immediate;
set constraints public.events_queue_nearby deferred;

select is((select count(*) from public.notices where kind = 'nearby' and user_id = 'a0000000-0000-0000-0000-000000000002')::int, 1,
  'nearby: N (near, notify, a car that fits) hears about it');
select is((select title from public.notices where kind = 'nearby' and user_id = 'a0000000-0000-0000-0000-000000000002'), 'New meet near you',
  'nearby: the title says what kind of event');
select ok((select body like 'Lincoln late meet · % · Lincoln' and body not like '%car park%' from public.notices
           where kind = 'nearby' and user_id = 'a0000000-0000-0000-0000-000000000002'),
  'nearby: the text has the title, time and rough area, never the stop');
select is((select url from public.notices where kind = 'nearby' and user_id = 'a0000000-0000-0000-0000-000000000002'), '/event/' || current_setting('t.meet'),
  'nearby: it opens the event');
select is((select count(*) from public.notices where kind = 'nearby' and user_id = 'a0000000-0000-0000-0000-000000000003')::int, 0,
  'nearby: "I''ll search" gets no notice');
select is((select count(*) from public.notices where kind = 'nearby' and user_id = 'a0000000-0000-0000-0000-000000000004')::int, 0,
  'nearby: "Off" gets no notice');
select is((select count(*) from public.notices where kind = 'nearby' and user_id = 'a0000000-0000-0000-0000-000000000005')::int, 0,
  'nearby: a bike-only person isn''t told about a cars-only meet');
select is((select count(*) from public.notices where kind = 'nearby' and user_id = 'a0000000-0000-0000-0000-000000000006')::int, 0,
  'nearby: outside your travel distance, even inside the host''s invite radius');
select is((select count(*) from public.notices where kind = 'nearby' and user_id = 'a0000000-0000-0000-0000-000000000007')::int, 0,
  'nearby: far away gets nothing');
select is((select count(*) from public.notices where kind = 'nearby' and user_id = 'a0000000-0000-0000-0000-000000000001')::int, 0,
  'nearby: the host isn''t told about their own event');
select is((select count(*) from public.notices where kind = 'nearby' and user_id = 'a0000000-0000-0000-0000-000000000008')::int, 0,
  'nearby: nor is a co-host (the trigger waits for save_event to add them)');
select is((select count(*) from public.notices where kind = 'nearby' and user_id = 'a0000000-0000-0000-0000-00000000000a')::int, 0,
  'nearby: no builds, no invite');

-- A public show: anyone near can go, builds or not.
set local role authenticated;
select set_config('t.show', (public.save_event(
  jsonb_build_object('type', 'show', 'title', 'Lincoln show', 'starts_at', now() + interval '2 days', 'reveal_minutes_before', 0,
    'area', jsonb_build_object('lat', 53.20, 'lng', -0.50), 'area_radius_miles', 3, 'area_name', 'Lincoln showground',
    'filter', jsonb_build_object('everyone', true, 'min_mods', 0, 'radius_miles', 25)),
  jsonb_build_array(jsonb_build_object('name', 'Showground', 'lat', 53.20, 'lng', -0.50))) ->> 'id'), true);

-- Edit the meet: bikes welcome now, so B can go. N mustn't be told twice.
select lives_ok(format($$ select public.save_event(
  jsonb_build_object('id', %L, 'type', 'meet', 'title', 'Lincoln late meet (edited)', 'starts_at', now() + interval '1 day',
    'area', jsonb_build_object('lat', 53.22, 'lng', -0.52), 'area_radius_miles', 3, 'area_name', 'Lincoln',
    'filter', jsonb_build_object('everyone', false, 'cars', true, 'bikes', true, 'min_mods', 0, 'radius_miles', 25)),
  (select jsonb_agg(jsonb_build_object('id', id, 'name', name, 'lat', extensions.st_y(location::extensions.geometry), 'lng', extensions.st_x(location::extensions.geometry)))
     from public.event_stops where event_id = %L)) $$, current_setting('t.meet'), current_setting('t.meet')),
  'nearby: the host edits the meet to welcome bikes');

-- A meet made and cancelled before anyone could be told.
select set_config('t.gone', (public.save_event(
  jsonb_build_object('type', 'meet', 'title', 'Gone meet', 'starts_at', now() + interval '1 day',
    'area', jsonb_build_object('lat', 53.22, 'lng', -0.52), 'area_radius_miles', 3, 'area_name', 'Lincoln',
    'filter', jsonb_build_object('min_mods', 0, 'radius_miles', 25)),
  jsonb_build_array(jsonb_build_object('name', 'Spot', 'lat', 53.20, 'lng', -0.50))) ->> 'id'), true);
select lives_ok(format('select public.cancel_event(%L)', current_setting('t.gone')), 'nearby: the host cancels straight away');

reset role;
set constraints public.events_queue_nearby immediate;
set constraints public.events_queue_nearby deferred;

select is((select count(*) from public.notices where kind = 'nearby' and event_id = current_setting('t.show')::uuid
           and user_id in ('a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-00000000000a'))::int, 3,
  'nearby: a public show reaches everyone near on notify, builds or not');
select is((select count(*) from public.notices where kind = 'nearby' and event_id = current_setting('t.show')::uuid
           and user_id in ('a0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001'))::int, 0,
  'nearby: but not search, off, too far for them, or the host');
select is((select count(*) from public.notices where kind = 'nearby' and event_id = current_setting('t.meet')::uuid
           and user_id = 'a0000000-0000-0000-0000-000000000005')::int, 1,
  'nearby: an edit that lets someone in tells them');
select is((select count(*) from public.notices where kind = 'nearby' and event_id = current_setting('t.meet')::uuid
           and user_id = 'a0000000-0000-0000-0000-000000000002')::int, 1,
  'nearby: never twice for the same event');
select is((select count(*) from public.notices where event_id = current_setting('t.gone')::uuid)::int, 0,
  'nearby: a cancelled event tells nobody');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-000000000005","role":"authenticated"}', true);
select is((select count(*) from public.notices where user_id <> 'a0000000-0000-0000-0000-000000000005')::int, 0,
  'nearby: you only see your own notices');
select throws_ok(format('select private.queue_nearby_notices(%L)', current_setting('t.meet')), '42501', null,
  'nearby: only the trigger can queue them');

-- ---------------------------------------------------------------------------
-- Discovery: anyone signed in sees that an event exists, never its stops
-- ---------------------------------------------------------------------------

select set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-000000000007","role":"authenticated"}', true);
select is((select title from public.events where id = current_setting('t.meet')::uuid), 'Lincoln late meet (edited)',
  'discovery: someone far away can see the event exists');
select is((select area_name from public.events where id = current_setting('t.meet')::uuid), 'Lincoln',
  'discovery: with its rough area');
select is((select count(*) from public.event_stops where event_id = current_setting('t.meet')::uuid)::int, 0,
  'discovery: but not its stops');
select is((select count(*) from public.get_event_stops(array[current_setting('t.meet')::uuid]))::int, 0,
  'discovery: not even through get_event_stops');

-- ---------------------------------------------------------------------------
-- Staff: read everything for moderation, but no host powers and no homes
-- ---------------------------------------------------------------------------

select set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-000000000009","role":"authenticated"}', true);
select is((select count(*) from public.event_stops where event_id = current_setting('t.meet')::uuid)::int, 1, 'staff: read stops of any event');
select is((select count(*) from public.chat_messages where event_id = current_setting('t.meet')::uuid)::int, 1, 'staff: read any chat');
select ok((select count(*) from public.plan_changes where event_id = current_setting('t.meet')::uuid) > 0, 'staff: read the plan-change log');
select ok((select count(*) from public.notices) > 0, 'staff: read notices');
select is((select count(*) from public.staff)::int, 1, 'staff: see the staff list');
select is((select count(*) from public.profile_homes)::int, 0, 'staff: never anyone''s home');
select is((select count(*) from public.profile_settings)::int, 0, 'staff: never anyone''s travel settings');
select is(public.event_role(current_setting('t.meet')::uuid), 'none', 'staff: not a host');
select throws_ok(format('select public.cancel_event(%L)', current_setting('t.meet')), 'P0001', 'Only hosts can cancel this event.',
  'staff: cannot cancel someone''s event');
select throws_ok($$ select public.search_events() $$, 'P0001', 'Set your rough home area first, or search from where you are.',
  'search: needs a home area or a point');

select set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-000000000002","role":"authenticated"}', true);
select is((select count(*) from public.staff)::int, 0, 'staff: other people can''t see the staff list');
select throws_ok($$ insert into public.staff (user_id) values ('a0000000-0000-0000-0000-000000000002') $$, '42501', null,
  'staff: nobody makes themselves staff');
select is((select count(*) from public.chat_messages where event_id = current_setting('t.meet')::uuid)::int, 0,
  'staff: the moderation policies don''t open chat to everyone else');

-- ---------------------------------------------------------------------------
-- Find events: search_events()
-- ---------------------------------------------------------------------------

reset role;
-- More events, straight in as the table owner (one is live already, which save_event() refuses).
insert into public.events (id, type, title, starts_at, ends_at, reveal_minutes_before, area, area_radius_miles, area_name,
                           invite_min_mods, invite_cars, invite_bikes, invite_classes, invite_radius_miles, cancelled_at) values
  ('e1000000-0000-0000-0000-000000000001', 'meet', 'Live now meet', now() - interval '30 minutes', now() + interval '3 hours', 60,
     private.pt(53.21, -0.56), 3, 'Lincoln west', 0, true, false, '{}', 25, null),
  ('e1000000-0000-0000-0000-000000000002', 'cruise', 'S class cruise', now() + interval '3 days', null, 60,
     private.pt(53.25, -0.45), 3, 'Lincoln east', 0, true, true, '{S}', 25, null),
  ('e1000000-0000-0000-0000-000000000003', 'meet', 'Far meet', now() + interval '8 days', null, 60,
     private.pt(53.80, -0.52), 3, 'Humber', 0, true, true, '{}', 50, null),
  ('e1000000-0000-0000-0000-000000000004', 'meet', 'Cancelled meet', now() + interval '1 day', null, 60,
     private.pt(53.21, -0.50), 3, 'Lincoln', 0, true, true, '{}', 25, now()),
  ('e1000000-0000-0000-0000-000000000005', 'meet', 'Finished meet', now() - interval '6 hours', now() - interval '2 hours', 60,
     private.pt(53.21, -0.50), 3, 'Lincoln', 0, true, true, '{}', 25, null);
insert into public.event_stops (event_id, position, name, location) values
  ('e1000000-0000-0000-0000-000000000001', 0, 'Live car park', private.pt(53.19, -0.58)),
  ('e1000000-0000-0000-0000-000000000002', 0, 'Cruise start', private.pt(53.23, -0.43)),
  ('e1000000-0000-0000-0000-000000000003', 0, 'Far car park', private.pt(53.78, -0.50)),
  ('e1000000-0000-0000-0000-000000000004', 0, 'Gone car park', private.pt(53.19, -0.48)),
  ('e1000000-0000-0000-0000-000000000005', 0, 'Old car park', private.pt(53.19, -0.48));
insert into public.event_hosts (event_id, user_id)
  select id, 'a0000000-0000-0000-0000-000000000001' from public.events where id::text like 'e1000000-%';

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-000000000002","role":"authenticated"}', true);

select results_eq($$ select title from public.search_events() $$,
  $$ values ('Lincoln show'), ('Lincoln late meet (edited)'), ('Live now meet'), ('S class cruise') $$,
  'search: nearest first, inside your travel distance; cancelled and finished left out');
select ok((select bool_and(miles = round(miles, 1)) from public.search_events()), 'search: distances are rounded to 0.1 mi');
select ok((select miles from public.search_events() where title = 'Lincoln late meet (edited)') between 0.9 and 1.3,
  'search: the distance is to the rough area');
select is((select count(*) from public.search_events(p_max_miles => 50) where title = 'Far meet')::int, 1,
  'search: a wider distance finds the far one');
select results_eq($$ select title from public.search_events(p_types => array['cruise']::public.event_type[]) $$,
  $$ values ('S class cruise') $$, 'search: by type');
select results_eq($$ select title from public.search_events(p_can_go_only => true) $$,
  $$ values ('Lincoln show'), ('Lincoln late meet (edited)'), ('Live now meet') $$,
  'search: "I can go" drops the S-class cruise (the Civic is A class)');
select is((select can_go from public.search_events() where title = 'S class cruise'), false, 'search: says which ones you can''t just go to');
select results_eq($$ select title from public.search_events(p_vehicles => 'bikes') $$,
  $$ values ('Lincoln show'), ('Lincoln late meet (edited)'), ('S class cruise') $$,
  'search: bikes drops the cars-only meet');
select results_eq($$ select title from public.search_events(p_when => 'tonight') $$,
  $$ values ('Live now meet') $$, 'search: tonight includes what''s live now');
select results_eq($$ select title from public.search_events(p_when => 'week', p_max_miles => 100) $$,
  $$ values ('Lincoln show'), ('Lincoln late meet (edited)'), ('Live now meet'), ('S class cruise') $$,
  'search: this week leaves out the one in 8 days');
select lives_ok($$ select * from public.search_events(p_when => 'weekend') $$, 'search: the weekend window works');
select ok((select stop_name is null and stop_lat is null and stop_lng is null and area_lat is not null
           from public.search_events() where title = 'Lincoln late meet (edited)'),
  'search: a locked event comes back with its rough area only');
select is((select stop_name from public.search_events() where title = 'Lincoln show'), 'Showground',
  'search: a public show comes back with its place');
select is((select phase from public.search_events() where title = 'Live now meet'), 'live', 'search: says what''s live');
select is(
  (select array_agg(miles order by event_id) from public.search_events(p_from_lat => 53.2049, p_from_lng => -0.4951)),
  (select array_agg(miles order by event_id) from public.search_events(p_from_lat => 53.20, p_from_lng => -0.50)),
  'search: a point you send is snapped to ~1 km first');
select results_eq($$ select title from public.search_events(p_max_miles => 10, p_from_lat => 53.80, p_from_lng => -0.52) $$,
  $$ values ('Far meet') $$, 'search: from where you are instead of home');
select throws_ok($$ select public.search_events(p_from_lat => 40.7, p_from_lng => -74.0) $$, 'P0001',
  'Slipstream is UK only for now. Search from somewhere in the UK.', 'search: UK only');
select throws_ok($$ select public.search_events(p_from_lat => 53.2) $$, 'P0001', 'Send both latitude and longitude, or neither.',
  'search: both coordinates or neither');
select throws_ok($$ select public.search_events(p_when => 'someday') $$, 'P0001', 'Pick when: any time, tonight, this week or the weekend.',
  'search: known date windows only');
select throws_ok($$ select public.search_events(p_max_miles => 0) $$, 'P0001', 'Pick a distance between 1 and 600 miles.',
  'search: a sensible distance');

select set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-000000000006","role":"authenticated"}', true);
select is((select count(*) from public.search_events())::int, 0, 'search: T''s 10 mi travel distance is the default');
select ok((select count(*) from public.search_events(p_max_miles => 25)) >= 3, 'search: and can be widened');

reset role;
set local role anon;
select throws_ok($$ select public.search_events() $$, '42501', null, 'search: signed out can''t search');
select throws_ok($$ select public.save_travel_prefs(25, 'notify') $$, '42501', null, 'save_travel_prefs: signed out can''t');
reset role;

select * from finish();
rollback;

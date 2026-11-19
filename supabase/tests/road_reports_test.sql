-- Community road reports: report_road(), vote_road_report(), road_reports_near(),
-- road_closures_near(), road_rep_for(), and who can read what.
-- Users: A, B, C, D, E (all signed in). Everything rolls back.

begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(66);

insert into auth.users (id, email) values
  ('aaaaaaaa-0000-0000-0000-0000000000a1', 'ra@example.test'),
  ('bbbbbbbb-0000-0000-0000-0000000000b1', 'rb@example.test'),
  ('cccccccc-0000-0000-0000-0000000000c1', 'rc@example.test'),
  ('dddddddd-0000-0000-0000-0000000000d1', 'rd@example.test'),
  ('eeeeeeee-0000-0000-0000-0000000000e1', 're@example.test');

-- Birmingham: the report sits at (52.4862, -1.8904).

-- ---------------------------------------------------------------------------
-- Reporting
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
set local role authenticated;

select set_config('t.crash', public.report_road('crash', 52.48623, -1.89041, 92, 52.4870, -1.8904)->>'id', true);
select isnt(current_setting('t.crash')::uuid, null, 'report_road: A reports a crash from where they are');
select is((select kind::text from public.road_reports where id = current_setting('t.crash')::uuid), 'crash', 'report_road: stored as a crash');
select is((select round(extensions.st_y(point::extensions.geometry)::numeric, 5) from public.road_reports where id = current_setting('t.crash')::uuid),
  52.4862::numeric, 'report_road: the point is snapped to 4 decimal places (~10 m)');
select is((select heading from public.road_reports where id = current_setting('t.crash')::uuid), 92::smallint, 'report_road: heading kept for the direction');
select is((select expires_at - created_at from public.road_reports where id = current_setting('t.crash')::uuid), interval '2 hours', 'expiry: a crash lasts 2 hours');
select throws_ok($$ select public.report_road('hazard', 52.4862, -1.8904, null, 52.4862, -1.8904) $$, 'P0001',
  'You''ve just sent a report. Try again in a couple of minutes.', 'rate limit: one report every 2 minutes');
select throws_ok($$ select created_by from public.road_reports $$, '42501', null, 'privacy: nobody reads who reported something');
select throws_ok($$ insert into public.road_reports (kind, point, expires_at) values ('crash', 'POINT(-1.89 52.48)', now()) $$,
  '42501', null, 'reports are only made through report_road()');

select set_config('request.jwt.claims', '{"sub":"bbbbbbbb-0000-0000-0000-0000000000b1","role":"authenticated"}', true);
select throws_ok($$ select public.report_road('hazard', 52.4862, -1.8904, null, 52.55, -1.8904) $$, 'P0001',
  'You can only report within half a mile of where you are.', 'report_road: within half a mile of where you are');
select throws_ok($$ select public.report_road('hazard', 52.4862, -1.8904, null, null, null) $$, 'P0001',
  'Reporting needs your current location.', 'report_road: needs your position');
select throws_ok($$ select public.report_road('hazard', 48.85, 2.35, null, 48.85, 2.35) $$, 'P0001',
  'Reports are for UK roads only.', 'report_road: UK only');

-- C has made 30 reports today (fixtures, over 2 minutes ago): the daily limit.
reset role;
insert into public.road_reports (kind, point, created_by, created_at, expires_at)
  select 'traffic', private.pt(52.3, -1.5), 'cccccccc-0000-0000-0000-0000000000c1', now() - interval '3 hours', now() - interval '150 minutes'
  from generate_series(1, 30);
select set_config('request.jwt.claims', '{"sub":"cccccccc-0000-0000-0000-0000000000c1","role":"authenticated"}', true);
set local role authenticated;
select throws_ok($$ select public.report_road('hazard', 52.4862, -1.8904, null, 52.4862, -1.8904) $$, 'P0001',
  'That''s the most reports for one day. Thanks for helping.', 'rate limit: 30 a day');

-- D reports a police check and a mobile camera's worth of time.
select set_config('request.jwt.claims', '{"sub":"dddddddd-0000-0000-0000-0000000000d1","role":"authenticated"}', true);
select set_config('t.police', public.report_road('police', 52.4900, -1.8950, null, 52.4900, -1.8950)->>'id', true);
select is((select expires_at - created_at from public.road_reports_near(52.4862, -1.8904, 5, 'driving') where id = current_setting('t.police')::uuid),
  interval '30 minutes', 'expiry: police reports last 30 minutes');

-- ---------------------------------------------------------------------------
-- Police only in the driving view
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"bbbbbbbb-0000-0000-0000-0000000000b1","role":"authenticated"}', true);
select is((select count(*)::int from public.road_reports_near(52.4862, -1.8904, 5, 'map') where kind = 'police'), 0,
  'police: never returned for the map');
select is((select count(*)::int from public.road_reports_near(52.4862, -1.8904, 5) where kind = 'police'), 0,
  'police: the default context is the map');
select is((select count(*)::int from public.road_reports_near(52.4862, -1.8904, 5, 'driving') where kind = 'police'), 1,
  'police: returned for the driving view');
select is((select count(*)::int from public.road_reports_near(52.4862, -1.8904, 5, 'map') where kind = 'crash'), 1,
  'map: other reports are returned');
select is((select count(*)::int from public.road_reports where kind = 'police'), 0,
  'police: never readable from the table (so never in Realtime)');
select is((select count(*)::int from public.road_reports where id = current_setting('t.crash')::uuid), 1,
  'other reports are readable from the table (Realtime)');
select is((select count(*)::int from public.road_reports_near(52.6400, -1.8904, 30, 'driving') where kind = 'police'), 0,
  'police: only within 10 miles, even driving');
select is((select count(*)::int from public.road_reports_near(52.6400, -1.8904, 30, 'map') where kind = 'crash'), 1,
  'map: other reports further away with a bigger radius');
select is((select count(*)::int from public.road_reports_near(52.6400, -1.8904, 5, 'map')), 0,
  'radius: nothing from 10 miles away within 5 miles');
select throws_ok($$ select * from public.road_reports_near(52.4862, -1.8904, 5, 'event') $$, 'P0001', 'Unknown context.',
  'context: only map or driving');
select is((select mine from public.road_reports_near(52.4862, -1.8904, 5, 'map') where kind = 'crash'), false, 'near: mine is false for others'' reports');

-- ---------------------------------------------------------------------------
-- Votes
-- ---------------------------------------------------------------------------
select throws_ok(format($$ select public.vote_road_report(%L, 'still_there', 52.55, -1.8904) $$, current_setting('t.crash')::uuid),
  'P0001', 'You need to be within a mile of the report to answer.', 'vote: within a mile of the report');
select lives_ok(format($$ select public.vote_road_report(%L, 'still_there', 52.4870, -1.8910) $$, current_setting('t.crash')::uuid),
  'vote: B confirms the crash');
select throws_ok(format($$ select public.vote_road_report(%L, 'gone', 52.4870, -1.8910) $$, current_setting('t.crash')::uuid),
  'P0001', 'You''ve already answered for this one.', 'vote: one answer per person per report');
select is((select my_vote::text from public.road_reports_near(52.4862, -1.8904, 5, 'map') where kind = 'crash'), 'still_there', 'near: my_vote');
select is((select count(*)::int from public.road_report_votes), 1, 'votes: B reads only their own answers');
select is((select confirm_count from public.road_reports where id = current_setting('t.crash')::uuid), 1,
  'vote: counted (one confirmation is not enough for the reporter''s rep)');

select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
select throws_ok(format($$ select public.vote_road_report(%L, 'still_there', 52.4862, -1.8904) $$, current_setting('t.crash')::uuid),
  'P0001', 'You can''t confirm your own report.', 'vote: not on your own report');
select is((select mine from public.road_reports_near(52.4862, -1.8904, 5, 'map') where kind = 'crash'), true, 'near: mine is true for your own');
select is((select count(*)::int from public.road_rep where reason = 'reported'), 0, 'rep: no confirm bonus for an unconfirmed report (+2 for posting it: nav_report_rep_test)');

select set_config('request.jwt.claims', '{"sub":"cccccccc-0000-0000-0000-0000000000c1","role":"authenticated"}', true);
select is((public.vote_road_report(current_setting('t.crash')::uuid, 'still_there', 52.4862, -1.8904)->>'confirm_count')::int, 2,
  'vote: C confirms too (2 confirmations)');

select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
select is((select rep from public.road_rep where reason = 'reported'), 10, 'rep: +10 to the reporter once two others confirm');
select is((select reports_confirmed from public.road_rep_for(array['aaaaaaaa-0000-0000-0000-0000000000a1'::uuid])), 1, 'road_rep_for: reports confirmed');

select set_config('request.jwt.claims', '{"sub":"bbbbbbbb-0000-0000-0000-0000000000b1","role":"authenticated"}', true);
select is((select rep from public.road_rep_for(array['bbbbbbbb-0000-0000-0000-0000000000b1'::uuid])), 2, 'rep: +2 for answering');
select is((select count(*)::int from public.road_rep), 1, 'road_rep: B reads only their own rows');
select is((select array_agg(rep order by user_id) from public.road_rep_for(array[
    'aaaaaaaa-0000-0000-0000-0000000000a1'::uuid, 'bbbbbbbb-0000-0000-0000-0000000000b1'::uuid, 'cccccccc-0000-0000-0000-0000000000c1'::uuid])),
  array[12, 2, 2], 'road_rep_for: everyone''s totals (counts only; A has +2 for posting)');

-- A third confirmation doesn't pay the reporter again.
select set_config('request.jwt.claims', '{"sub":"dddddddd-0000-0000-0000-0000000000d1","role":"authenticated"}', true);
select lives_ok(format($$ select public.vote_road_report(%L, 'still_there', 52.4862, -1.8904) $$, current_setting('t.crash')::uuid), 'vote: D confirms');
select is((select reported_rep from public.road_rep_for(array['aaaaaaaa-0000-0000-0000-0000000000a1'::uuid])), 10, 'rep: the reporter is paid once per report');

-- Police reports are confirmed like the rest (owner decision) but never extended.
select set_config('request.jwt.claims', '{"sub":"bbbbbbbb-0000-0000-0000-0000000000b1","role":"authenticated"}', true);
select lives_ok(format($$ select public.vote_road_report(%L, 'still_there', 52.4900, -1.8950) $$, current_setting('t.police')::uuid), 'police: B confirms');
select set_config('request.jwt.claims', '{"sub":"cccccccc-0000-0000-0000-0000000000c1","role":"authenticated"}', true);
select is((public.vote_road_report(current_setting('t.police')::uuid, 'still_there', 52.4900, -1.8950)->>'confirm_count')::int, 2, 'police: C confirms');
reset role;
select is((select expires_at - created_at from public.road_reports where id = current_setting('t.police')::uuid), interval '30 minutes',
  'police: confirmations never extend it past 30 minutes');
select is((select rep from public.road_rep where user_id = 'dddddddd-0000-0000-0000-0000000000d1' and reason = 'reported'), 10,
  'police: confirmed reports earn rep like the others');

-- ---------------------------------------------------------------------------
-- Expiry: extended by confirmations, up to a cap
-- ---------------------------------------------------------------------------
select set_config('t.old', gen_random_uuid()::text, true), set_config('t.capped', gen_random_uuid()::text, true),
       set_config('t.expired', gen_random_uuid()::text, true), set_config('t.hazard', gen_random_uuid()::text, true);
insert into public.road_reports (id, kind, point, created_by, created_at, expires_at) values
  (current_setting('t.old')::uuid, 'crash', private.pt(52.48, -1.88), 'aaaaaaaa-0000-0000-0000-0000000000a1', now() - interval '1 hour', now() + interval '1 hour'),
  (current_setting('t.capped')::uuid, 'crash', private.pt(52.481, -1.881), 'aaaaaaaa-0000-0000-0000-0000000000a1', now() - interval '210 minutes', now() + interval '10 minutes'),
  (current_setting('t.expired')::uuid, 'hazard', private.pt(52.482, -1.882), 'aaaaaaaa-0000-0000-0000-0000000000a1', now() - interval '3 hours', now() - interval '1 minute'),
  (current_setting('t.hazard')::uuid, 'hazard', private.pt(52.483, -1.883), 'aaaaaaaa-0000-0000-0000-0000000000a1', now() - interval '10 minutes', now() + interval '110 minutes');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"bbbbbbbb-0000-0000-0000-0000000000b1","role":"authenticated"}', true);
select is((public.vote_road_report(current_setting('t.old')::uuid, 'still_there', 52.48, -1.88)->>'expires_at')::timestamptz,
  now() + interval '2 hours', 'expiry: "still there" gives it another 2 hours from now');
select is((public.vote_road_report(current_setting('t.capped')::uuid, 'still_there', 52.48, -1.88)->>'expires_at')::timestamptz,
  now() + interval '30 minutes', 'expiry: but never more than 4 hours after the report');
select is((select count(*)::int from public.road_reports_near(52.48, -1.88, 2, 'map') where id = current_setting('t.expired')::uuid), 0,
  'expiry: an expired report is not returned');
select throws_ok(format($$ select public.vote_road_report(%L, 'gone', 52.48, -1.88) $$, current_setting('t.expired')::uuid),
  'P0001', 'That report has already expired.', 'expiry: no answers on an expired report');
reset role;
select is((select status::text from public.road_reports where id = current_setting('t.expired')::uuid), 'expired', 'expiry: marked expired');

-- ---------------------------------------------------------------------------
-- Clearing: two "gone" answers with no "still there" in between
-- ---------------------------------------------------------------------------
set local role authenticated;
select is((public.vote_road_report(current_setting('t.hazard')::uuid, 'gone', 52.48, -1.88)->>'status'), 'active', 'clear: one "gone" leaves it');
select set_config('request.jwt.claims', '{"sub":"cccccccc-0000-0000-0000-0000000000c1","role":"authenticated"}', true);
select is((public.vote_road_report(current_setting('t.hazard')::uuid, 'still_there', 52.48, -1.88)->>'status'), 'active', 'clear: then "still there"');
select set_config('request.jwt.claims', '{"sub":"dddddddd-0000-0000-0000-0000000000d1","role":"authenticated"}', true);
select is((public.vote_road_report(current_setting('t.hazard')::uuid, 'gone', 52.48, -1.88)->>'status'), 'active',
  'clear: a "gone" after a "still there" starts again');
select set_config('request.jwt.claims', '{"sub":"eeeeeeee-0000-0000-0000-0000000000e1","role":"authenticated"}', true);
select is((public.vote_road_report(current_setting('t.hazard')::uuid, 'gone', 52.48, -1.88)->>'status'), 'cleared', 'clear: two "gone" in a row clear it');
select is((select count(*)::int from public.road_reports_near(52.48, -1.88, 2, 'map') where id = current_setting('t.hazard')::uuid), 0,
  'clear: a cleared report is not returned');
select throws_ok(format($$ select public.vote_road_report(%L, 'gone', 52.48, -1.88) $$, current_setting('t.hazard')::uuid),
  'P0001', 'That report has already been cleared.', 'clear: no answers once cleared');

-- ---------------------------------------------------------------------------
-- The same thing reported again nearby counts as a confirmation
-- ---------------------------------------------------------------------------
select is((public.report_road('crash', 52.4865, -1.8906, 95, 52.4866, -1.8906)->>'merged')::boolean, true,
  'report_road: the same kind within 150 m (same direction) confirms the first report');
select set_config('request.jwt.claims', '{"sub":"cccccccc-0000-0000-0000-0000000000c1","role":"authenticated"}', true);

-- ---------------------------------------------------------------------------
-- Daily rep caps
-- ---------------------------------------------------------------------------
reset role;
insert into public.road_rep (user_id, report_id, reason, rep, earned_on)
  select 'eeeeeeee-0000-0000-0000-0000000000e1', null, 'reported', 10, private.uk_day() from generate_series(1, 5);
select lives_ok($$ select private.road_award('eeeeeeee-0000-0000-0000-0000000000e1', current_setting('t.old')::uuid, 'reported') $$,
  'rep cap: a sixth confirmed report today');
select is((select rep from public.road_rep where user_id = 'eeeeeeee-0000-0000-0000-0000000000e1' and report_id = current_setting('t.old')::uuid),
  0, 'rep cap: at most 5 paid reports a day (counted, no rep)');
insert into public.road_rep (user_id, report_id, reason, rep, earned_on)
  select 'dddddddd-0000-0000-0000-0000000000d1', null, 'checked', 2, private.uk_day() from generate_series(1, 10);
select lives_ok($$ select private.road_award('dddddddd-0000-0000-0000-0000000000d1', current_setting('t.capped')::uuid, 'checked') $$,
  'rep cap: an eleventh answer today');
select is((select rep from public.road_rep where user_id = 'dddddddd-0000-0000-0000-0000000000d1' and report_id = current_setting('t.capped')::uuid),
  0, 'rep cap: at most 10 paid answers a day');

-- ---------------------------------------------------------------------------
-- Open-data closures
-- ---------------------------------------------------------------------------
insert into public.road_closures (source, source_id, kind, description, road, direction, full_closure, geom, starts_at, ends_at) values
  ('tfl', 'test-live', 'road_closure', 'TEST: Road closed for works', 'A1', 'Both directions', true,
   extensions.st_geogfromtext('SRID=4326;LINESTRING(-1.8904 52.4800, -1.8904 52.4810)'), now() - interval '1 hour', now() + interval '1 day'),
  ('tfl', 'test-ended', 'road_closure', 'TEST: Finished', 'A2', null, true,
   extensions.st_geogfromtext('SRID=4326;POINT(-1.8904 52.4805)'), now() - interval '2 days', now() - interval '1 day'),
  ('national_highways', 'test-future', 'road_closure', 'TEST: Overnight', 'M6', null, true,
   extensions.st_geogfromtext('SRID=4326;POINT(-1.8904 52.4805)'), now() + interval '1 day', now() + interval '2 days');
set local role authenticated;
-- Only this test's own rows: the live open-data import puts real closures in the table.
select is((select count(*)::int from public.road_closures_near(52.4862, -1.8904, 5) where description like 'TEST:%'), 1, 'closures: only the ones in force now');
select is((select jsonb_array_length(path) from public.road_closures_near(52.4862, -1.8904, 5) where description like 'TEST:%'), 2, 'closures: lines come back as points');
reset role;

-- ---------------------------------------------------------------------------
-- Signed out, Realtime
-- ---------------------------------------------------------------------------
set local role anon;
select throws_ok($$ select * from public.road_reports_near(52.4862, -1.8904, 5, 'map') $$, '42501', null, 'signed out: no reports');
select throws_ok($$ select * from public.road_rep_for(array['aaaaaaaa-0000-0000-0000-0000000000a1'::uuid]) $$, '42501', null, 'signed out: no rep');
reset role;
select is((select count(*)::int from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'road_reports'), 1,
  'realtime: road_reports is published (RLS keeps police out)');

select * from finish();
rollback;

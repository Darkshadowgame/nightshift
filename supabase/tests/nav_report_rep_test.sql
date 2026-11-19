-- Rep for using the app (20261121120000_nav_and_report_rep.sql): complete_navigation()
-- (plausibility, overlap, 3 paid a day), +2 for posting a road report (10 paid a day),
-- the +10 confirm bonus once only, -2 for a report cleared as wrong, and the 0 floor.
-- Users A–G, all signed in. Reports in the Highlands, away from anything real. Everything rolls back.

begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(32);

insert into auth.users (id, email) values
  ('a0000000-0000-4000-8000-0000000000a1', 'na@example.test'),
  ('b0000000-0000-4000-8000-0000000000b1', 'nb@example.test'),
  ('c0000000-0000-4000-8000-0000000000c1', 'nc@example.test'),
  ('d0000000-0000-4000-8000-0000000000d1', 'nd@example.test'),
  ('e0000000-0000-4000-8000-0000000000e1', 'ne@example.test'),
  ('f0000000-0000-4000-8000-0000000000f1', 'nf@example.test'),
  ('90000000-0000-4000-8000-000000000091', 'ng@example.test');

-- ---------------------------------------------------------------------------
-- Navigation: what counts
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-4000-8000-0000000000a1","role":"authenticated"}', true);
set local role authenticated;

select is(public.complete_navigation(1609.344, 600)->>'ok', 'false', 'navigation: under 2 miles doesn''t count');
select is(public.complete_navigation(5000, 150)->>'ok', 'false', 'navigation: under 3 minutes doesn''t count');
select is(public.complete_navigation(16093.44, 360)->>'ok', 'false', 'navigation: an implausible average (100 mph) doesn''t count');
select is(public.complete_navigation(4000, 600, 57.0, -4.0, 57.1, -4.0)->>'ok', 'false',
  'navigation: less than the straight line between start and finish doesn''t count');
select is(public.complete_navigation(1e9, 'NaN'::float8)->>'ok', 'false', 'navigation: nonsense doesn''t count');
select is(public.complete_navigation(16093.44, 360)->>'reason', 'That trip doesn''t count.', 'navigation: the reason never says a time or a speed');
select is((select count(*)::int from public.nav_rep), 0, 'navigation: nothing kept for trips that don''t count');

select is(public.complete_navigation(8046.72, 900, 57.0, -4.0, 57.05, -4.0), '{"ok": true, "rep": 5}'::jsonb,
  'navigation: 5 miles in 15 minutes pays +5');
select is(public.complete_navigation(8046.72, 900)->>'ok', 'false', 'navigation: a trip can''t overlap the last one');
select is((select count(*)::int from information_schema.columns where table_schema = 'public' and table_name = 'nav_rep'
           and column_name ~ '(lat|lng|point|distance|from|to)'), 0, 'privacy: no positions or distance kept');

-- B has already been paid for 3 trips today (fixtures, finished hours ago).
reset role;
insert into public.nav_rep (user_id, rep, duration_s, earned_on, created_at)
  select 'b0000000-0000-4000-8000-0000000000b1', 5, 900, private.uk_day(), now() - make_interval(hours => 4 - g) from generate_series(1, 3) g;
select set_config('request.jwt.claims', '{"sub":"b0000000-0000-4000-8000-0000000000b1","role":"authenticated"}', true);
set local role authenticated;
select is(public.complete_navigation(8046.72, 900), '{"ok": true, "rep": 0}'::jsonb, 'navigation cap: a fourth trip today counts but pays nothing');
select is((select count(*)::int from public.nav_rep), 4, 'nav_rep: B reads only their own rows');
select is((select array[navigations, navigation_rep] from public.road_rep_for(array['b0000000-0000-4000-8000-0000000000b1'::uuid])),
  array[4, 15], 'navigation cap: at most 3 paid a day (+15)');
select is((select navigation_rep from public.road_rep_for(array['a0000000-0000-4000-8000-0000000000a1'::uuid])), 5,
  'road_rep_for: anyone''s navigation rep (counts only)');

-- ---------------------------------------------------------------------------
-- Posting a report, and the confirm bonus once only
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"c0000000-0000-4000-8000-0000000000c1","role":"authenticated"}', true);
select set_config('t.c', public.report_road('police', 57.2000, -4.2000, null, 57.2001, -4.2001)::text, true);
select is((current_setting('t.c')::jsonb->>'rep')::int, 2, 'posting: +2 for a report (shown in the toast)');
select is((select rep from public.road_rep where reason = 'posted'), 2, 'posting: recorded once for the report');

select set_config('request.jwt.claims', '{"sub":"e0000000-0000-4000-8000-0000000000e1","role":"authenticated"}', true);
select lives_ok(format($$ select public.vote_road_report(%L, 'still_there', 57.2, -4.2) $$, current_setting('t.c')::jsonb->>'id'), 'confirm: E');
select set_config('request.jwt.claims', '{"sub":"b0000000-0000-4000-8000-0000000000b1","role":"authenticated"}', true);
select lives_ok(format($$ select public.vote_road_report(%L, 'still_there', 57.2, -4.2) $$, current_setting('t.c')::jsonb->>'id'), 'confirm: B');
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-4000-8000-0000000000a1","role":"authenticated"}', true);
select lives_ok(format($$ select public.vote_road_report(%L, 'still_there', 57.2, -4.2) $$, current_setting('t.c')::jsonb->>'id'), 'confirm: A (a third)');
select is((select array[reports_confirmed, reported_rep, posted_rep, rep] from public.road_rep_for(array['c0000000-0000-4000-8000-0000000000c1'::uuid])),
  array[1, 10, 2, 12], 'confirm: +10 once two others confirm, paid once only (+2 posting on top)');

-- Confirmed, then cleared quickly: not wrong.
select set_config('request.jwt.claims', '{"sub":"d0000000-0000-4000-8000-0000000000d1","role":"authenticated"}', true);
select lives_ok(format($$ select public.vote_road_report(%L, 'gone', 57.2, -4.2) $$, current_setting('t.c')::jsonb->>'id'), 'clear: D says gone');
select set_config('request.jwt.claims', '{"sub":"90000000-0000-4000-8000-000000000091","role":"authenticated"}', true);
select is(public.vote_road_report((current_setting('t.c')::jsonb->>'id')::uuid, 'gone', 57.2, -4.2)->>'status', 'cleared', 'clear: G too, so it''s cleared');
select is((select reports_wrong from public.road_rep_for(array['c0000000-0000-4000-8000-0000000000c1'::uuid])), 0,
  'wrong: a report two others confirmed is never wrong');

-- D has already been paid for 10 reports today: the eleventh pays nothing.
reset role;
insert into public.road_rep (user_id, report_id, reason, rep, earned_on)
  select 'd0000000-0000-4000-8000-0000000000d1', null, 'posted', 2, private.uk_day() from generate_series(1, 10);
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"d0000000-0000-4000-8000-0000000000d1","role":"authenticated"}', true);
select is((public.report_road('hazard', 57.3000, -4.3000, null, 57.3, -4.3)->>'rep')::int, 0, 'posting cap: at most 10 paid a day');

-- ---------------------------------------------------------------------------
-- Cleared as wrong: -2, once, never below 0
-- ---------------------------------------------------------------------------
-- F's report (2 minutes old) and G's (15 minutes old), both unconfirmed. F has no other road rep.
reset role;
select set_config('t.f', gen_random_uuid()::text, true), set_config('t.g', gen_random_uuid()::text, true);
insert into public.road_reports (id, kind, point, created_by, created_at, expires_at) values
  (current_setting('t.f')::uuid, 'traffic', private.pt(57.4, -4.4), 'f0000000-0000-4000-8000-0000000000f1', now() - interval '2 minutes', now() + interval '28 minutes'),
  (current_setting('t.g')::uuid, 'traffic', private.pt(57.41, -4.4), '90000000-0000-4000-8000-000000000091', now() - interval '15 minutes', now() + interval '15 minutes');
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-4000-8000-0000000000a1","role":"authenticated"}', true);
select lives_ok(format($$ select public.vote_road_report(%L, 'gone', 57.4, -4.4) $$, current_setting('t.f')), 'wrong: A says F''s report is gone');
select lives_ok(format($$ select public.vote_road_report(%L, 'gone', 57.4, -4.4) $$, current_setting('t.g')), 'wrong: and G''s');
select set_config('request.jwt.claims', '{"sub":"e0000000-0000-4000-8000-0000000000e1","role":"authenticated"}', true);
select is(public.vote_road_report(current_setting('t.f')::uuid, 'gone', 57.4, -4.4)->>'status', 'cleared', 'wrong: E too, F''s report is cleared');
select lives_ok(format($$ select public.vote_road_report(%L, 'gone', 57.4, -4.4) $$, current_setting('t.g')), 'wrong: G''s is cleared too');
select is((select array[reports_wrong, wrong_rep, rep] from public.road_rep_for(array['f0000000-0000-4000-8000-0000000000f1'::uuid])),
  array[1, -2, 0], 'wrong: -2 for one cleared within 10 minutes, but rep never below 0');
select is((select reports_wrong from public.road_rep_for(array['90000000-0000-4000-8000-000000000091'::uuid])), 0,
  'wrong: nothing taken when it was cleared after 10 minutes');
reset role;
select private.road_award('f0000000-0000-4000-8000-0000000000f1', current_setting('t.f')::uuid, 'wrong');
select is((select count(*)::int from public.road_rep where user_id = 'f0000000-0000-4000-8000-0000000000f1' and reason = 'wrong'), 1,
  'wrong: taken once per report');

-- ---------------------------------------------------------------------------
-- Signed out
-- ---------------------------------------------------------------------------
set local role anon;
select throws_ok($$ select public.complete_navigation(8046.72, 900) $$, '42501', null, 'signed out: no navigation rep');

select * from finish();
rollback;

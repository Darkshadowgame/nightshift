-- Access notes on photo spots (20261122150000_lvl_places.sql): written only through add_access_note()
-- by someone who has checked in at that photo spot, read through access_notes_for() without ever saying
-- who wrote one, one note per person per place, text checked, suspended people refused, nothing readable
-- straight from the table. Everything rolls back.
-- Users (made up): A has checked in at the photo spot, B has not.

begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(19);

insert into auth.users (id, email) values
  ('ee000000-0000-0000-0000-00000000000a', 'ln-a@example.test'),
  ('ee000000-0000-0000-0000-00000000000b', 'ln-b@example.test');

insert into public.spots (bundled_id, kind, name, description, location, path, miles, region, author_id, status, approved_at)
values
  ('test-ln-photo', 'photo', 'pgTAP notes photo spot', 'Fixture.', private.pt(53.1, -1.1), null, null, 'Test', null, 'approved', now()),
  ('test-ln-drive', 'drive', 'pgTAP notes drive', 'Fixture.', private.pt(53.0, -1.0),
   extensions.st_geogfromtext('SRID=4326;LINESTRING(-1.0 53.0, -0.98 53.0, -0.96 53.0)'), 1.4, 'Test', null, 'approved', now());

-- A has been there (checked in), as the visit function would have recorded.
insert into public.spot_completions (spot_id, user_id, completed_on)
  select id, 'ee000000-0000-0000-0000-00000000000a', current_date from public.spots where bundled_id = 'test-ln-photo';

-- Privileges.
select has_table('public', 'spot_access_notes', 'table: access notes exist');
select is(has_table_privilege('authenticated', 'public.spot_access_notes', 'select'), false, 'privileges: no direct table reads');
select is(has_function_privilege('anon', 'public.add_access_note(text, boolean, text, text, text, text)', 'execute'), false, 'privileges: signed-out people can''t add a note');
select is(has_function_privilege('anon', 'public.access_notes_for(text)', 'execute'), false, 'privileges: signed-out people can''t read notes');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"ee000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);

-- Writing.
select lives_ok($$ select public.add_access_note('test-ln-photo', true, '22:30', 'patrols', 'ok', 'Quiet at the far end.') $$, 'add: someone who has checked in can add a note');
select is((select count(*)::int from public.access_notes_for('test-ln-photo')), 1, 'read: the note shows');
select is((select closes from public.access_notes_for('test-ln-photo')), '22:30', 'read: the closing time comes back as a clock time');
select is((select mine from public.access_notes_for('test-ln-photo')), true, 'read: it is marked as yours');
select lives_ok($$ select public.add_access_note('test-ln-photo', false, null, 'none', 'scrapes', null) $$, 'add: a second note replaces the first');
select is((select low_cars from public.access_notes_for('test-ln-photo')), 'scrapes', 'add: one note each, the newer one wins (and still just one)');

-- Refusals.
select throws_ok($$ select public.add_access_note('test-ln-photo', false, '22:30', null, null, null) $$, 'P0001', 'A closing time needs a barrier or gate.', 'add: a closing time needs a barrier');
select throws_ok($$ select public.add_access_note('test-ln-photo', true, '25:99', null, null, null) $$, 'P0001', 'Enter the closing time like 22:00.', 'add: the closing time has to be a time');
select throws_ok($$ select public.add_access_note('test-ln-photo', false, null, null, null, '   ') $$, 'P0001', 'Add at least one thing you know about getting in.', 'add: at least one fact');
select throws_ok($$ select public.add_access_note('test-ln-photo', false, null, null, null, repeat('x', 121)) $$, 'P0001', 'Keep it to 120 characters.', 'add: one short line');
select throws_ok($$ select public.add_access_note('test-ln-photo', false, null, null, null, 'police spotted here') $$, 'P0001', null, 'add: the text is checked like every public text');
select throws_ok($$ select public.add_access_note('test-ln-drive', true, null, null, null, null) $$, 'P0001', 'Place not found.', 'add: only photo spots take access notes');

-- Someone who hasn't been there.
select set_config('request.jwt.claims', '{"sub":"ee000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
select throws_ok($$ select public.add_access_note('test-ln-photo', true, null, null, null, null) $$, 'P0001', 'Check in at the spot before adding a note.', 'add: you have to have checked in first');
select is((select count(*)::int from public.access_notes_for('test-ln-photo') where mine), 0, 'read: someone else''s note is never marked as yours, and shows no name');

-- Suspended people can't post.
reset role;
insert into public.suspensions (user_id) values ('ee000000-0000-0000-0000-00000000000a');
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"ee000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select throws_ok($$ select public.add_access_note('test-ln-photo', true, null, null, null, null) $$, 'P0001', null, 'add: suspended people can''t post');

select * from finish();
rollback;

-- Feedback triage: the report form's extra fields, senders reading their own,
-- feedback_status() for signed-out phones, staff-only triage, handled_at, and
-- the email trigger queueing a call to feedback-notify. Rolled back.
--
-- Users: U signed-in tester, V another tester, A staff.

begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(37);

insert into auth.users (id, email) values
  ('f1000000-0000-0000-0000-000000000001', 'u@example.test'),
  ('f1000000-0000-0000-0000-000000000002', 'v@example.test'),
  ('f1000000-0000-0000-0000-000000000003', 'a@example.test');
insert into public.staff (user_id, note) values ('f1000000-0000-0000-0000-000000000003', 'moderator');

-- The email trigger needs the functions URL in Vault; add one for this test if
-- the project hasn't got it (rolled back with everything else).
do $$ begin
  if not exists (select 1 from vault.secrets where name = 'functions_url') then
    perform vault.create_secret('https://example.invalid/functions/v1', 'functions_url');
  end if;
end $$;

select has_column('public', 'feedback', 'triage_notes', 'feedback: triage_notes');
select has_column('public', 'feedback', 'fixed_in', 'feedback: fixed_in');
select has_column('public', 'feedback', 'handled_at', 'feedback: handled_at');
select has_trigger('public', 'feedback', 'feedback_notify', 'feedback: the email trigger');

create temp table queued_before on commit drop as
  select count(*) as n from net.http_request_queue where url like '%/feedback-notify';
grant select on queued_before to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Signed out
-- ---------------------------------------------------------------------------

set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);

select lives_ok($$ insert into public.feedback (id, kind, message, screen, context)
                   values ('f1f00000-0000-4000-8000-000000000001', 'other', 'Signed-out note', 'signin',
                           '{"runtime":"1.0.0","route":"/signin","backend":"signed-out"}') $$,
  'feedback: signed out sends kind other with its own id and context');
select throws_ok($$ insert into public.feedback (id, kind, message)
                    values ('f1f00000-0000-4000-8000-000000000001', 'bug', 'Again') $$,
  '23505', null, 'feedback: the same id twice is refused (a retry can''t duplicate)');
select lives_ok($$ insert into public.feedback (kind, message, lat, lng) values ('looks_wrong', 'Pin is wrong here', 52.48, -1.89) $$,
  'feedback: location only when sent');
select throws_ok($$ insert into public.feedback (kind, message, photo_paths)
                    values ('bug', 'Look', array['f1000000-0000-0000-0000-000000000001/x/1.jpg']) $$,
  '42501', null, 'feedback: signed out can''t attach screenshots');
select throws_ok($$ insert into public.feedback (kind, message, fixed_in) values ('bug', 'Hmm', 'v1') $$,
  '42501', null, 'feedback: the sender can''t set fixed_in');
select throws_ok($$ insert into public.feedback (kind, message, triage_notes) values ('bug', 'Hmm', 'x') $$,
  '42501', null, 'feedback: the sender can''t write triage notes');
select is((select status from public.feedback_status(array['f1f00000-0000-4000-8000-000000000001'::uuid])), 'new',
  'feedback_status: a signed-out phone sees its own report''s status');
select is((select count(*) from public.feedback_status(array['f1f00000-0000-4000-8000-0000000000ff'::uuid]))::int, 0,
  'feedback_status: an unknown id gives nothing');
select throws_ok($$ select * from public.feedback $$, '42501', null, 'feedback: signed out still can''t read the table');
reset role;

select ok((select count(*) from net.http_request_queue where url like '%/feedback-notify') >= (select n from queued_before) + 2,
  'feedback: each new report queues one call to feedback-notify');

-- ---------------------------------------------------------------------------
-- Signed in
-- ---------------------------------------------------------------------------

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"f1000000-0000-0000-0000-000000000001","role":"authenticated"}', true);

select lives_ok($$ insert into public.feedback (id, kind, message, photo_paths)
                   values ('f1f00000-0000-4000-8000-000000000002', 'bug', 'Two screenshots',
                           array['f1000000-0000-0000-0000-000000000001/f1f00000-0000-4000-8000-000000000002/1.jpg',
                                 'f1000000-0000-0000-0000-000000000001/f1f00000-0000-4000-8000-000000000002/2.jpg']) $$,
  'feedback: screenshots in your own folder');
select throws_ok($$ insert into public.feedback (kind, message, photo_paths)
                    values ('bug', 'Theirs', array['f1000000-0000-0000-0000-000000000001/a/1.jpg', 'f1000000-0000-0000-0000-000000000002/a/1.jpg']) $$,
  '42501', null, 'feedback: not with someone else''s screenshot');
select throws_ok($$ insert into public.feedback (kind, message, photo_paths)
                    values ('bug', 'Five', array['f1000000-0000-0000-0000-000000000001/a/1.jpg', 'f1000000-0000-0000-0000-000000000001/a/2.jpg',
                      'f1000000-0000-0000-0000-000000000001/a/3.jpg', 'f1000000-0000-0000-0000-000000000001/a/4.jpg',
                      'f1000000-0000-0000-0000-000000000001/a/5.jpg']) $$,
  '23514', null, 'feedback: at most 4 screenshots');
select throws_ok($$ insert into public.feedback (kind, message, lat) values ('bug', 'Half a place', 52.1) $$,
  '23514', null, 'feedback: lat and lng together or not at all');
select throws_ok($$ insert into public.feedback (kind, message, context) values ('bug', 'Big', jsonb_build_object('x', repeat('y', 2100))) $$,
  '23514', null, 'feedback: context is small');
select throws_ok($$ insert into public.feedback (kind, message, context) values ('bug', 'List', '[1,2]') $$,
  '23514', null, 'feedback: context is an object');
select lives_ok($$ insert into public.feedback (kind, message) values ('idea', 'Signed-in idea') $$, 'feedback: signed in sends');
select is((select count(*) from public.feedback)::int, 2, 'feedback: you read your own (and only your own)');
select throws_ok($$ select triage_notes from public.feedback $$, '42501', null, 'feedback: but not the team''s notes');
select throws_ok($$ select notified_at from public.feedback $$, '42501', null, 'feedback: or when it was emailed');
update public.feedback set status = 'done', fixed_in = 'v9';
reset role;

select is((select count(*) from public.feedback where status = 'new' and fixed_in is null and user_id = 'f1000000-0000-0000-0000-000000000001')::int, 2,
  'feedback: a tester can''t change the status of their own report');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"f1000000-0000-0000-0000-000000000002","role":"authenticated"}', true);
select is((select count(*) from public.feedback)::int, 0, 'feedback: another tester reads none of it');
select is((select count(*) from public.feedback_status(array['f1f00000-0000-4000-8000-000000000002'::uuid]))::int, 1,
  'feedback_status: answers by id (the id is the secret)');
reset role;

-- ---------------------------------------------------------------------------
-- Staff
-- ---------------------------------------------------------------------------

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"f1000000-0000-0000-0000-000000000003","role":"authenticated"}', true);

select lives_ok($$ update public.feedback set status = 'seen' where id = 'f1f00000-0000-4000-8000-000000000002' $$, 'feedback: staff mark it seen');
reset role;
select isnt((select handled_at from public.feedback where id = 'f1f00000-0000-4000-8000-000000000002'), null::timestamptz,
  'feedback: handled_at is stamped when the status changes');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"f1000000-0000-0000-0000-000000000003","role":"authenticated"}', true);
select lives_ok($$ update public.feedback set status = 'done', fixed_in = 'v1.0.12', triage_notes = 'Overlap on small phones'
                   where id = 'f1f00000-0000-4000-8000-000000000002' $$, 'feedback: staff mark it fixed with the version and a note');
select throws_ok($$ update public.feedback set notified_at = null $$, '42501', null, 'feedback: staff can''t touch notified_at');
select throws_ok($$ update public.feedback set context = '{}' $$, '42501', null, 'feedback: staff can''t rewrite the context');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"f1000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
select is((select status || ' ' || fixed_in from public.feedback where id = 'f1f00000-0000-4000-8000-000000000002'), 'done v1.0.12',
  'feedback: the sender sees it fixed and in which version');
select is((select fixed_in from public.feedback_status(array['f1f00000-0000-4000-8000-000000000002'::uuid])), 'v1.0.12',
  'feedback_status: and so does the phone by id');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"f1000000-0000-0000-0000-000000000003","role":"authenticated"}', true);
select lives_ok($$ update public.feedback set status = 'new' where id = 'f1f00000-0000-4000-8000-000000000002' $$, 'feedback: staff can reopen it');
reset role;
select is((select handled_at from public.feedback where id = 'f1f00000-0000-4000-8000-000000000002'), null::timestamptz,
  'feedback: reopening clears handled_at');
select is((select triage_notes from public.feedback where id = 'f1f00000-0000-4000-8000-000000000002'), 'Overlap on small phones',
  'feedback: the notes are kept for the team');

select * from finish();
rollback;

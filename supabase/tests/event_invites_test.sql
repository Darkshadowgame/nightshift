-- Bring your mates (20261121090000_event_invites.sql; the app's rules are src/lib/eventInvites.ts).
--
-- M: a meet tonight hosted by H, open to cars within 25 mi, its meet point hidden for another
-- 2 hours (starts in 3, shows 60 min before). A is going and is connected to B, C, D and twenty
-- others (F01..F20). B lives far away with no car, so the invite rules leave B out. D has blocked
-- A. N isn't connected to A.

begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(27);

insert into auth.users (id, email) values
  ('e8000000-0000-0000-0000-00000000000a', 'ei-going@example.test'),
  ('e8000000-0000-0000-0000-00000000000b', 'ei-far@example.test'),
  ('e8000000-0000-0000-0000-00000000000c', 'ei-other@example.test'),
  ('e8000000-0000-0000-0000-00000000000d', 'ei-blocker@example.test'),
  ('e8000000-0000-0000-0000-00000000000e', 'ei-none@example.test'),
  ('e8000000-0000-0000-0000-00000000000f', 'ei-host@example.test');
insert into auth.users (id, email)
  select ('e8000000-0000-0000-0000-0000000001' || lpad(g::text, 2, '0'))::uuid, format('ei-f%s@example.test', g) from generate_series(1, 20) g;
update public.profiles set handle = 'ei_' || right(id::text, 3), display_name = 'Person ' || right(id::text, 3), region = 'East', onboarded = true
  where id::text like 'e8000000-0000-0000-0000-000000000%';
insert into public.profile_homes (user_id, home) values
  ('e8000000-0000-0000-0000-00000000000a', private.pt(52.96, -0.26)),
  ('e8000000-0000-0000-0000-00000000000b', private.pt(54.90, -2.90)),
  ('e8000000-0000-0000-0000-00000000000c', private.pt(52.97, -0.30)),
  ('e8000000-0000-0000-0000-00000000000f', private.pt(52.95, -0.20));

insert into public.connections (requester_id, addressee_id, status, answered_at)
  select 'e8000000-0000-0000-0000-00000000000a', x::uuid, 'accepted', now()
  from unnest(array['e8000000-0000-0000-0000-00000000000b', 'e8000000-0000-0000-0000-00000000000c', 'e8000000-0000-0000-0000-00000000000d']) x;
insert into public.connections (requester_id, addressee_id, status, answered_at)
  select 'e8000000-0000-0000-0000-00000000000a', ('e8000000-0000-0000-0000-0000000001' || lpad(g::text, 2, '0'))::uuid, 'accepted', now()
  from generate_series(1, 20) g;
insert into public.blocks (blocker_id, blocked_id) values ('e8000000-0000-0000-0000-00000000000d', 'e8000000-0000-0000-0000-00000000000a');

insert into public.events (id, type, title, starts_at, ends_at, reveal_minutes_before, area, area_radius_miles, area_name, invite_everyone, current_stop) values
  ('e8e00000-0000-0000-0000-0000000000a1', 'meet', 'Invite test meet', now() + interval '3 hours', now() + interval '6 hours', 60,
   private.pt(52.95, -0.25), 5, 'Testford', false, 0);
insert into public.event_stops (id, event_id, position, name, location) values
  ('e8500000-0000-0000-0000-0000000000a0', 'e8e00000-0000-0000-0000-0000000000a1', 0, 'Hidden car park', private.pt(52.93, -0.22));
insert into public.event_hosts (event_id, user_id) values ('e8e00000-0000-0000-0000-0000000000a1', 'e8000000-0000-0000-0000-00000000000f');
insert into public.event_going (event_id, user_id) values ('e8e00000-0000-0000-0000-0000000000a1', 'e8000000-0000-0000-0000-00000000000a');

select is((select allow_invites from public.events_list where id = 'e8e00000-0000-0000-0000-0000000000a1'), true,
  'allow_invites: on by default, and in events_list');

-- ---------------------------------------------------------------------------
-- B before anyone invites them: not in their list
-- ---------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"e8000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
select ok(not exists (select 1 from public.events_for_me() where event_id = 'e8e00000-0000-0000-0000-0000000000a1'),
  'fixture: the invite rules leave B out, so it isn''t in their list');

-- ---------------------------------------------------------------------------
-- A invites
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"e8000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select throws_ok($$ select public.invite_connections('e8e00000-0000-0000-0000-0000000000a1', array['e8000000-0000-0000-0000-00000000000e'::uuid]) $$,
  'P0001', 'You can only invite people you''re connected with.', 'a non-connection can''t be invited');
select throws_ok($$ select public.invite_connections('e8e00000-0000-0000-0000-0000000000a1', array['e8000000-0000-0000-0000-00000000000d'::uuid]) $$,
  'P0001', 'You can only invite people you''re connected with.', 'someone who blocked you can''t be invited');
select throws_ok($$ select public.invite_connections('e8e00000-0000-0000-0000-0000000000a1', array['e8000000-0000-0000-0000-00000000000c'::uuid, 'e8000000-0000-0000-0000-00000000000e'::uuid]) $$,
  'P0001', 'You can only invite people you''re connected with.', 'one bad name stops the whole invite');
select throws_ok($$ select public.invite_connections('e8e00000-0000-0000-0000-0000000000a1', array['e8000000-0000-0000-0000-00000000000a'::uuid]) $$,
  'P0001', 'You can only invite people you''re connected with.', 'you can''t invite yourself');
select throws_ok($$ select public.invite_connections('e8e00000-0000-0000-0000-0000000000a1', '{}') $$,
  'P0001', 'Pick someone to invite.', 'an empty list says so');
select is(public.invite_connections('e8e00000-0000-0000-0000-0000000000a1', array['e8000000-0000-0000-0000-00000000000b'::uuid]), 1,
  'A invites B');
select is(public.invite_connections('e8e00000-0000-0000-0000-0000000000a1', array['e8000000-0000-0000-0000-00000000000b'::uuid]), 0,
  'inviting B again does nothing');
select is((select count(*)::int from public.messages m join public.conversations c on c.id = m.conversation_id
            where c.direct_key = least('e8000000-0000-0000-0000-00000000000a'::uuid, 'e8000000-0000-0000-0000-00000000000b'::uuid)::text || ':' ||
                                 greatest('e8000000-0000-0000-0000-00000000000a'::uuid, 'e8000000-0000-0000-0000-00000000000b'::uuid)::text
              and m.share->>'kind' = 'event' and m.share->>'id' = 'e8e00000-0000-0000-0000-0000000000a1'), 1,
  'the event card is in A and B''s 1-to-1 chat, once');

-- ---------------------------------------------------------------------------
-- B, invited: sees the event, never the meet point
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"e8000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
select is((select role from public.events_for_me() where event_id = 'e8e00000-0000-0000-0000-0000000000a1'), 'shared',
  'invitee: the event is in their list (role shared)');
select is((select title from public.events_list where id = 'e8e00000-0000-0000-0000-0000000000a1'), 'Invite test meet',
  'invitee: reads the event row');
select ok(not exists (select 1 from public.get_event_stops(array['e8e00000-0000-0000-0000-0000000000a1'::uuid])),
  'invitee: no meet point rows before going');
select is((select title from public.notices where user_id = 'e8000000-0000-0000-0000-00000000000b' and event_id = 'e8e00000-0000-0000-0000-0000000000a1'),
  '@ei_00a invited you to Invite test meet', 'invitee: gets the notice');
select is((select count(*)::int from public.event_invites), 1, 'invitee: reads their own invite');
select is((select count(*)::int from public.messages where share->>'id' = 'e8e00000-0000-0000-0000-0000000000a1'), 1, 'invitee: sees the card in the chat');
select throws_ok($$ select public.invite_connections('e8e00000-0000-0000-0000-0000000000a1', array['e8000000-0000-0000-0000-00000000000a'::uuid]) $$,
  'P0001', 'Say you''re going first, then invite your connections.', 'invitee: can''t invite others before going');
select is(public.set_going('e8e00000-0000-0000-0000-0000000000a1', true), 'requested', 'invitee the rules leave out: asks to go');

select set_config('request.jwt.claims', '{"sub":"e8000000-0000-0000-0000-00000000000c","role":"authenticated"}', true);
select is((select count(*)::int from public.event_invites), 0, 'someone else can''t read the invite');

-- ---------------------------------------------------------------------------
-- H: sees who invited the request, says yes; still no meet point before the reveal
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"e8000000-0000-0000-0000-00000000000f","role":"authenticated"}', true);
select is((select inviter_id from public.request_inviters(array['e8e00000-0000-0000-0000-0000000000a1'::uuid]) where user_id = 'e8000000-0000-0000-0000-00000000000b'),
  'e8000000-0000-0000-0000-00000000000a'::uuid, 'host: the request shows who invited them');
select lives_ok($$ select public.answer_request('e8e00000-0000-0000-0000-0000000000a1', 'e8000000-0000-0000-0000-00000000000b', true) $$, 'host: says yes');

select set_config('request.jwt.claims', '{"sub":"e8000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
select ok(not exists (select 1 from public.get_event_stops(array['e8e00000-0000-0000-0000-0000000000a1'::uuid]) where visible or lat is not null),
  'invitee going: the meet point stays hidden until the reveal');

select set_config('request.jwt.claims', '{"sub":"e8000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select is((select count(*)::int from public.request_inviters(array['e8e00000-0000-0000-0000-0000000000a1'::uuid])), 0, 'not a host: request_inviters is empty');

-- ---------------------------------------------------------------------------
-- The cap: 20 per event per person
-- ---------------------------------------------------------------------------
select is(public.invite_connections('e8e00000-0000-0000-0000-0000000000a1',
  (select array_agg(('e8000000-0000-0000-0000-0000000001' || lpad(g::text, 2, '0'))::uuid) from generate_series(1, 19) g)), 19,
  'A invites 19 more (20 in all)');
select throws_ok($$ select public.invite_connections('e8e00000-0000-0000-0000-0000000000a1', array['e8000000-0000-0000-0000-000000000120'::uuid]) $$,
  'P0001', 'You can invite up to 20 people to one event.', 'the 21st invite fails');

-- ---------------------------------------------------------------------------
-- The host turns invites off
-- ---------------------------------------------------------------------------
select throws_ok($$ select public.set_event_invites('e8e00000-0000-0000-0000-0000000000a1', false) $$,
  'P0001', 'Only hosts can change that.', 'only a host can turn invites off');
select set_config('request.jwt.claims', '{"sub":"e8000000-0000-0000-0000-00000000000f","role":"authenticated"}', true);
select public.set_event_invites('e8e00000-0000-0000-0000-0000000000a1', false);
select set_config('request.jwt.claims', '{"sub":"e8000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select throws_ok($$ select public.invite_connections('e8e00000-0000-0000-0000-0000000000a1', array['e8000000-0000-0000-0000-00000000000c'::uuid]) $$,
  'P0001', 'The host has turned off invites for this one.', 'host setting off: invites stop');

reset role;
select * from finish();
rollback;

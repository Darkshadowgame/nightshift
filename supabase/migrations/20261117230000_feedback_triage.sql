-- Nightshift backend: feedback triage, "Your feedback" and the email to the team.
--
-- * Triage columns: triage_notes (the team's own notes, never shown to the
--   sender), fixed_in (the app version that fixed it, e.g. v1.0.12) and
--   handled_at (stamped when the status changes). Only staff change them
--   (the existing "feedback: staff update" policy and column grants); the
--   inbox script (scripts/feedback-inbox.mjs) does it as the service path.
-- * Senders now read their own feedback (status and fixed_in, not
--   triage_notes). Signed out there's no user, so feedback_status() answers
--   for ids the phone made itself (the id is a random UUID: knowing it means
--   you sent it). The app now picks the id, so a retry after a dropped
--   connection can't send the same report twice.
-- * The report form adds: kind 'other', up to 4 screenshots (photo_paths, in
--   the sender's own folder of the private feedback bucket), context (app
--   version, runtime, device, route, backend mode) and, only if the sender
--   ticks "include my location", lat/lng.
-- * New feedback is emailed to the team: an AFTER INSERT trigger posts the id
--   to the feedback-notify Edge Function with pg_net. The function reads the
--   row with the service role and claims it by setting notified_at, so a
--   forged call can at most send a real report's email once, early.
--   The function URL comes from Vault ('functions_url'); without it the
--   trigger does nothing. A failure here never blocks a report.

create extension if not exists pg_net with schema extensions;

alter table public.feedback
  add column if not exists triage_notes text,
  add column if not exists fixed_in text,
  add column if not exists handled_at timestamptz,
  add column if not exists photo_paths text[] not null default '{}',
  add column if not exists context jsonb not null default '{}'::jsonb,
  add column if not exists lat double precision,
  add column if not exists lng double precision,
  add column if not exists notified_at timestamptz;

alter table public.feedback drop constraint if exists feedback_kind_check;
alter table public.feedback add constraint feedback_kind_check check (kind in ('bug', 'idea', 'looks_wrong', 'other'));
alter table public.feedback drop constraint if exists feedback_triage_notes_len;
alter table public.feedback add constraint feedback_triage_notes_len check (char_length(triage_notes) <= 4000);
alter table public.feedback drop constraint if exists feedback_fixed_in_len;
alter table public.feedback add constraint feedback_fixed_in_len check (char_length(fixed_in) <= 50);
alter table public.feedback drop constraint if exists feedback_photo_paths_ok;
alter table public.feedback add constraint feedback_photo_paths_ok check (
  cardinality(photo_paths) <= 4 and array_position(photo_paths, null) is null
  and char_length(array_to_string(photo_paths, '')) <= 1200
);
alter table public.feedback drop constraint if exists feedback_context_ok;
alter table public.feedback add constraint feedback_context_ok check (jsonb_typeof(context) = 'object' and octet_length(context::text) <= 2000);
alter table public.feedback drop constraint if exists feedback_location_ok;
alter table public.feedback add constraint feedback_location_ok check (
  (lat is null) = (lng is null) and (lat is null or (lat between -90 and 90 and lng between -180 and 180))
);

create index if not exists feedback_open_idx on public.feedback (created_at desc) where status in ('new', 'seen');

-- handled_at follows the status: stamped when it changes (unless the caller
-- set it), cleared when it goes back to new.
create or replace function private.feedback_triage_stamp()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    if new.status = 'new' then
      new.handled_at := null;
    elsif new.handled_at is not distinct from old.handled_at then
      new.handled_at := now();
    end if;
  end if;
  return new;
end;
$$;
revoke execute on function private.feedback_triage_stamp() from public, anon, authenticated;

drop trigger if exists feedback_triage_stamp on public.feedback;
create trigger feedback_triage_stamp
  before update on public.feedback
  for each row execute function private.feedback_triage_stamp();

-- Email the team (through the feedback-notify Edge Function).
create or replace function private.feedback_notify()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  base text;
begin
  select s.decrypted_secret into base from vault.decrypted_secrets s where s.name = 'functions_url' limit 1;
  if base is null or base = '' then
    return null;
  end if;
  perform net.http_post(
    url := rtrim(base, '/') || '/feedback-notify',
    body := jsonb_build_object('id', new.id),
    headers := '{"Content-Type": "application/json"}'::jsonb,
    timeout_milliseconds := 15000
  );
  return null;
exception when others then
  -- Never block a report because the email couldn't be queued.
  return null;
end;
$$;
revoke execute on function private.feedback_notify() from public, anon, authenticated;

drop trigger if exists feedback_notify on public.feedback;
create trigger feedback_notify
  after insert on public.feedback
  for each row execute function private.feedback_notify();

-- Sending: as before, plus screenshots (all in the sender's own folder).
drop policy if exists "feedback: anyone sends" on public.feedback;
create policy "feedback: anyone sends" on public.feedback
  for insert to anon, authenticated
  with check (
    (user_id is null or user_id = (select auth.uid()))
    and status = 'new'
    and (
      photo_path is null
      or ((select auth.uid()) is not null and split_part(photo_path, '/', 1) = (select auth.uid())::text)
    )
    and (
      cardinality(photo_paths) = 0
      or (
        (select auth.uid()) is not null
        and not exists (select 1 from unnest(photo_paths) p where split_part(p, '/', 1) <> (select auth.uid())::text)
      )
    )
  );

-- Senders read their own (signed in). Staff still read everything.
drop policy if exists "feedback: senders read their own" on public.feedback;
create policy "feedback: senders read their own" on public.feedback
  for select to authenticated using (user_id is not null and user_id = (select auth.uid()));

-- Column privileges. Senders fill in the report; nobody but the service path
-- reads triage_notes or notified_at through the API; staff update the triage
-- columns (RLS keeps that to staff).
revoke all on public.feedback from anon, authenticated;
grant insert (id, user_id, kind, message, screen, app_version, update_id, device, photo_path, photo_paths, context, lat, lng)
  on public.feedback to anon, authenticated;
grant select (id, created_at, user_id, kind, message, screen, app_version, update_id, device, photo_path, photo_paths,
              context, lat, lng, status, fixed_in, handled_at)
  on public.feedback to authenticated;
grant delete on public.feedback to authenticated;
grant update (status, triage_notes, fixed_in, handled_at) on public.feedback to authenticated;
grant all on public.feedback to service_role;

-- "Your feedback" for the ids this phone sent (signed in or not). No message,
-- notes or sender: the phone has its own copy of what it wrote.
create or replace function public.feedback_status(p_ids uuid[])
returns table (id uuid, created_at timestamptz, kind text, status text, fixed_in text, handled_at timestamptz)
language sql stable security definer
set search_path = ''
as $$
  select f.id, f.created_at, f.kind, f.status, f.fixed_in, f.handled_at
  from public.feedback f
  where f.id = any (coalesce(p_ids[1:100], '{}'))
  order by f.created_at desc;
$$;
revoke execute on function public.feedback_status(uuid[]) from public;
grant execute on function public.feedback_status(uuid[]) to anon, authenticated;

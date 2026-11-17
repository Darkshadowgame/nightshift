-- Nightshift backend, part 9: in-app feedback ("Report a bug", "Idea",
-- "Looks wrong") from testers.
--
-- * Anyone can send feedback, signed in or not (a sign-in problem is worth
--   hearing about). Sending is insert-only: nobody can read, change or delete
--   feedback except staff (private.is_admin()), who triage it.
-- * user_id defaults to the sender (auth.uid()) and can only be the sender or
--   null, so nobody can send feedback in someone else's name.
-- * Screenshots go in their own private `feedback` bucket, not `photos`
--   (every signed-in user can read `photos`, and a screenshot can show a
--   stop or a name). Signed-in users upload to {user_id}/...; only staff
--   read them. The app sends the object path as photo_path.
-- * Inserts use return=minimal (supabase-js `insert()` without `.select()`):
--   senders can't read the row back.

create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid default auth.uid() references auth.users (id) on delete set null,
  kind text not null check (kind in ('bug', 'idea', 'looks_wrong')),
  message text not null check (char_length(message) between 1 and 4000 and btrim(message) <> ''),
  screen text check (char_length(screen) <= 200),
  app_version text check (char_length(app_version) <= 50),
  update_id text check (char_length(update_id) <= 100),
  device text check (char_length(device) <= 200),
  photo_path text check (char_length(photo_path) <= 300),
  status text not null default 'new' check (status in ('new', 'seen', 'planned', 'done', 'wont_do'))
);
create index feedback_created_at_idx on public.feedback (created_at desc);
create index feedback_user_idx on public.feedback (user_id, created_at desc) where user_id is not null;
alter table public.feedback enable row level security;

-- A cheap flood guard, since signed-out people can send: at most 20 an hour
-- per signed-in person and 300 an hour in total. Runs as definer so it can
-- count rows the sender can't read.
create function private.feedback_guard()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  if (select count(*) from public.feedback f where f.created_at > now() - interval '1 hour') >= 300 then
    raise exception 'Lots of feedback is coming in right now. Try again in a few minutes.';
  end if;
  if new.user_id is not null and (
    select count(*) from public.feedback f
    where f.user_id = new.user_id and f.created_at > now() - interval '1 hour'
  ) >= 20 then
    raise exception 'You''ve sent a lot of feedback in the last hour. Thanks! Try again later.';
  end if;
  return new;
end;
$$;

create trigger feedback_guard
  before insert on public.feedback
  for each row execute function private.feedback_guard();

-- Anyone sends. The sender is themselves or nobody, it starts as 'new', and a
-- screenshot must be in the sender's own folder of the feedback bucket.
create policy "feedback: anyone sends" on public.feedback
  for insert to anon, authenticated
  with check (
    (user_id is null or user_id = (select auth.uid()))
    and status = 'new'
    and (
      photo_path is null
      or ((select auth.uid()) is not null and split_part(photo_path, '/', 1) = (select auth.uid())::text)
    )
  );

-- Staff triage: read, set status, delete.
create policy "feedback: staff read" on public.feedback
  for select to authenticated using (private.is_admin((select auth.uid())));
create policy "feedback: staff update" on public.feedback
  for update to authenticated
  using (private.is_admin((select auth.uid())))
  with check (private.is_admin((select auth.uid())));
create policy "feedback: staff delete" on public.feedback
  for delete to authenticated using (private.is_admin((select auth.uid())));

-- Privileges. New tables get Supabase's default grants, so start from none.
-- Senders can only fill in the report columns (not id, created_at or status).
revoke all on public.feedback from anon, authenticated;
grant insert (user_id, kind, message, screen, app_version, update_id, device, photo_path)
  on public.feedback to anon, authenticated;
grant select, delete on public.feedback to authenticated;
grant update (status) on public.feedback to authenticated;
grant all on public.feedback to service_role;

revoke execute on function private.feedback_guard() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Storage: the private `feedback` bucket for screenshots (insert-only)
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('feedback', 'feedback', false, 5242880, array['image/jpeg', 'image/png', 'image/heic', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "feedback: signed-in users upload to own folder"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'feedback'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "feedback: staff read screenshots"
on storage.objects for select to authenticated
using (bucket_id = 'feedback' and private.is_admin((select auth.uid())));

create policy "feedback: staff delete screenshots"
on storage.objects for delete to authenticated
using (bucket_id = 'feedback' and private.is_admin((select auth.uid())));

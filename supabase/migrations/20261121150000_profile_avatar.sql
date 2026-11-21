-- Profile picture (owner request, 21 Nov 2026: "pick my profile picture from the photo library").
--
-- Until now the choice (your main vehicle's photo, or one of your own vehicle photos) lived on the
-- phone only, so nobody else saw it. This adds `profiles.avatar_ref`: a Storage path in the private
-- `photos` bucket, the same kind of ref every other uploaded photo uses.
--
--   {uid}/avatar/{file}                a photo picked from the library (uploaded by the app)
--   {uid}/builds/{build}/{file}        one of your own vehicle photos (must be in your build_photos)
--
-- Purely additive, so phones on the older app keep working unchanged:
--   * no existing function, view, policy or grant is replaced or dropped;
--   * profiles is already readable by every signed-in user (policy + table-level select grant), so the
--     new column is readable by everyone with no further change, and older apps list their columns
--     explicitly, so they never see it;
--   * profiles stays write-protected for the app (no insert/update grant): the only way to change the
--     column is the new set_avatar(), which only ever touches the caller's own row.
-- Photos keep the existing rules: plates are pixelated on the phone before upload, and the bucket
-- limits size (10 MB) and type. Account deletion already empties the whole {uid}/ folder.

alter table public.profiles add column avatar_ref text;
alter table public.profiles add constraint profiles_avatar_ref_check
  check (
    avatar_ref is null
    or (
      char_length(avatar_ref) <= 200
      and split_part(avatar_ref, '/', 1) = id::text
      and avatar_ref ~ '^[0-9a-f-]{36}/(avatar/[A-Za-z0-9._-]+|builds/[0-9a-f-]{36}/[A-Za-z0-9._-]+)$'
    )
  );

-- A picture must be yours: in your own avatar folder, or a photo on one of your own vehicles.
-- Null clears it. Same sentence as the forum and comment photo checks.
create function private.check_avatar_ref(p_uid uuid, p_ref text)
returns void
language plpgsql stable security definer
set search_path = ''
as $$
begin
  if p_ref is null then return; end if;
  if char_length(p_ref) > 200 then raise exception 'That photo isn''t one of yours.'; end if;
  if p_ref ~ ('^' || p_uid::text || '/avatar/[A-Za-z0-9._-]+$') then return; end if;
  if p_ref ~ ('^' || p_uid::text || '/builds/[0-9a-f-]{36}/[A-Za-z0-9._-]+$')
     and exists (select 1 from public.build_photos bp where bp.owner_id = p_uid and bp.storage_path = p_ref) then
    return;
  end if;
  raise exception 'That photo isn''t one of yours.';
end;
$$;
revoke execute on function private.check_avatar_ref(uuid, text) from public, anon, authenticated;
grant execute on function private.check_avatar_ref(uuid, text) to service_role;

-- Set (or, with null, clear) your own profile picture. Only your own row, never anyone else's.
create function public.set_avatar(p_ref text)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
  v_ref text := nullif(btrim(coalesce(p_ref, '')), '');
begin
  if not exists (select 1 from public.profiles p where p.id = v_uid and p.onboarded) then
    raise exception 'Set up your profile first.';
  end if;
  perform private.check_avatar_ref(v_uid, v_ref);
  perform private.check_not_suspended(v_uid);
  if private.rate_count(v_uid, 'avatar', interval '1 day') >= 30 then
    raise exception 'That''s the most picture changes for one day.';
  end if;
  perform private.rate_hit(v_uid, 'avatar');
  update public.profiles set avatar_ref = v_ref where id = v_uid;
end;
$$;
revoke all on function public.set_avatar(text) from public, anon;
grant execute on function public.set_avatar(text) to authenticated, service_role;

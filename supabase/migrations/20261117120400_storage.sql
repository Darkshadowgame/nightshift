-- Nightshift backend, part 5: Storage.
--
-- One private bucket, `photos`, for build photos and photo-spot visit photos.
-- * Objects live under {user_id}/... and only that user can add, replace or delete them.
-- * Any signed-in user can read them (garages are public inside the app). The
--   bucket is not public, so the app shows them through signed URLs
--   (createSignedUrl / createSignedUrls), never a permanent public link.
-- * Plates are pixelated and EXIF/GPS metadata stripped ON THE PHONE before
--   upload (modules/plate-redactor, docs/research/plate-blurring.md). The
--   server does not re-check images; see docs/BACKEND.md "Limits".

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', false, 10485760, array['image/jpeg', 'image/png', 'image/heic', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "photos: signed-in users read"
on storage.objects for select to authenticated
using (bucket_id = 'photos');

create policy "photos: upload to own folder"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'photos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "photos: replace in own folder"
on storage.objects for update to authenticated
using (
  bucket_id = 'photos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'photos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "photos: delete from own folder"
on storage.objects for delete to authenticated
using (
  bucket_id = 'photos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

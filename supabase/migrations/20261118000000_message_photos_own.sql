-- The person who sent a chat photo can always list and read it (their own
-- folder, messages/{uid}/...), even after leaving the chat, so deleting the
-- account (which removes messages/{uid}/ through the Storage API) finds them all.
create policy "messages: read own uploads" on storage.objects for select to authenticated
using (bucket_id = 'messages' and (storage.foldername(name))[1] = (select auth.uid())::text);

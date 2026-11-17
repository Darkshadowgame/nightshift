-- Nightshift backend, part 7: a notice kind for "new event near you".
--
-- On its own because Postgres can't use a new enum value inside the
-- transaction that adds it; part 8 (discovery) uses it.

alter type public.notice_kind add value if not exists 'nearby';

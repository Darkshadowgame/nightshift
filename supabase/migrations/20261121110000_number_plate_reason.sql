-- A report reason for videos (and anything else) that show a readable number plate.
-- Plates in photos are blurred on the phone; video can't be, so posting one needs the
-- "No readable number plates in this video (I've checked)" tick (20261121110100_videos.sql)
-- and three of these reports hide it until staff look, like any report (docs/SPEC.md).
-- Its own file: a new enum value can't be used in the transaction that adds it.
alter type public.report_reason add value if not exists 'number_plate';

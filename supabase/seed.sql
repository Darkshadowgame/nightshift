-- Nightshift seed data: places only, never people.
--
-- Runs on `npx supabase db reset` (local) and only goes to the hosted project
-- if you ask for it (`npx supabase db push --include-seed`). It is safe to run
-- twice.
--
-- What is here:
-- * The two SAMPLE ban zones the app already ships (src/data/seed.ts). They are
--   rough circles, not the legal boundaries: check the current orders before
--   relying on them (docs/research/legal.md).
-- * A handful of well-known UK circuits as information-only `track` places,
--   "Added by Nightshift" (no author, so nobody earns author rep). Points are
--   approximate circuit centres.
--
-- What is not here, on purpose:
-- * No sample people, builds, crews or events. The demo scene stays in the app
--   (src/data/seed.ts), clearly labelled Sample, so fake people never sit in the
--   shared database where real users would meet them.
-- * The full bundled place list (drives and photo spots in src/data/places.ts).
--   It should be imported by a one-off script generated from that file, so the
--   app and the database stay in step; see docs/BACKEND.md.

insert into public.ban_zones (id, name, centre, radius_miles, note, kind)
values
  ('bz-bham', 'Birmingham', private.pt(52.48, -1.89), 4,
   'Sample, check the current order. Rough circle round Birmingham city centre, inside the West Midlands car cruising injunction.',
   'sample'),
  ('bz-blackcountry', 'Black Country', private.pt(52.55, -2.06), 6,
   'Sample, check the current order. Rough circle for the Black Country street-racing injunction (Dudley, Sandwell, Walsall and Wolverhampton).',
   'sample')
on conflict (id) do update
  set name = excluded.name, centre = excluded.centre, radius_miles = excluded.radius_miles,
      note = excluded.note, kind = excluded.kind;

insert into public.spots (kind, name, description, location, author_id, status, approved_at, region)
values
  ('track', 'Silverstone', 'Home of the British Grand Prix. Track days run on the National and GP layouts.',
   private.pt(52.0786, -1.0169), null, 'approved', now(), 'Midlands'),
  ('track', 'Brands Hatch', 'Indy and GP circuits in Kent.',
   private.pt(51.3569, 0.2631), null, 'approved', now(), 'South East'),
  ('track', 'Donington Park', 'National and GP circuits near Castle Donington.',
   private.pt(52.8306, -1.3750), null, 'approved', now(), 'Midlands'),
  ('track', 'Oulton Park', 'Rolling parkland circuit in Cheshire.',
   private.pt(53.1781, -2.6136), null, 'approved', now(), 'North West'),
  ('track', 'Snetterton', 'Norfolk circuit with 300, 200 and 100 layouts.',
   private.pt(52.4636, 0.9456), null, 'approved', now(), 'East'),
  ('track', 'Cadwell Park', 'Tight, hilly circuit in the Lincolnshire Wolds.',
   private.pt(53.3106, -0.0597), null, 'approved', now(), 'East'),
  ('track', 'Anglesey Circuit', 'Coastal circuit (Trac Môn) on Anglesey.',
   private.pt(53.1883, -4.4975), null, 'approved', now(), 'Wales'),
  ('track', 'Knockhill', 'Scotland''s national motorsport centre, in Fife.',
   private.pt(56.1306, -3.5064), null, 'approved', now(), 'Scotland')
on conflict ((lower(name))) do nothing;

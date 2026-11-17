-- Nightshift backend, part 1: extensions, schemas, types and small helpers.
--
-- Conventions used in every migration:
-- * Points are extensions.geography(Point, 4326): longitude first, metres for distances.
-- * Everything the app calls lives in `public` (exposed by the Data API).
--   Helpers used by RLS policies live in `private`, which is not exposed.
-- * Every security definer function sets `search_path = ''` and schema-qualifies
--   every name, as the Supabase docs recommend.

create extension if not exists postgis with schema extensions;

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Enums (mirror src/lib/types.ts)
-- ---------------------------------------------------------------------------

create type public.vehicle_kind as enum ('car', 'bike');
create type public.class_letter as enum ('S', 'A', 'B', 'C', 'D');
create type public.mod_category as enum (
  'engine', 'intake', 'exhaust', 'turbo', 'suspension', 'brakes',
  'wheels', 'body', 'interior', 'lighting', 'audio', 'other'
);
create type public.crew_role as enum ('owner', 'host', 'member');
create type public.event_type as enum ('cruise', 'rolling', 'meet', 'show', 'trackday');
create type public.request_status as enum ('pending', 'approved', 'declined');
create type public.spot_kind as enum ('drive', 'photo', 'track', 'venue');
create type public.spot_status as enum ('pending', 'approved', 'rejected');
create type public.notice_kind as enum ('reveal', 'soon', 'moved', 'host', 'system');

-- ---------------------------------------------------------------------------
-- Small pure helpers
-- ---------------------------------------------------------------------------

-- Miles to metres (PostGIS geography distances are metres).
create function private.mi(miles double precision)
returns double precision
language sql immutable parallel safe
set search_path = ''
as $$ select miles * 1609.344 $$;

-- A WGS84 point from latitude and longitude.
create function private.pt(lat double precision, lng double precision)
returns extensions.geography
language sql immutable parallel safe
set search_path = ''
as $$ select extensions.st_setsrid(extensions.st_makepoint(lng, lat), 4326)::extensions.geography $$;

-- Snap a point to a 0.01 degree grid (about 1 km), like fuzz() in src/lib/geo.ts.
create function private.fuzz(p extensions.geography)
returns extensions.geography
language sql immutable parallel safe
set search_path = ''
as $$
  select private.pt(
    (round((extensions.st_y(p::extensions.geometry) / 0.01)::numeric) * 0.01)::double precision,
    (round((extensions.st_x(p::extensions.geometry) / 0.01)::numeric) * 0.01)::double precision
  )
$$;

-- Events with no end time stay "on" for 4 hours (DEFAULT_LENGTH_MS in events.ts).
create function private.event_end(starts_at timestamptz, ends_at timestamptz)
returns timestamptz
language sql immutable parallel safe
set search_path = ''
as $$ select coalesce(ends_at, starts_at + interval '4 hours') $$;

-- Shows and track days are public: anyone can see the place.
create function private.is_public_type(t public.event_type)
returns boolean
language sql immutable parallel safe
set search_path = ''
as $$ select t in ('show', 'trackday') $$;

-- updated_at bookkeeping.
create function private.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

grant execute on all functions in schema private to authenticated, service_role;

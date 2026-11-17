-- Nightshift backend, part 2: tables.
-- RLS is switched on for every table in part 3 (20261117120200_rls.sql).

-- ===========================================================================
-- People
-- ===========================================================================

-- One row per auth user, made by a trigger on auth.users. Readable by every
-- signed-in user, so it holds nothing private. Written only through
-- public.save_profile().
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  handle text unique check (handle ~ '^[a-z0-9._]{3,20}$'),
  display_name text check (char_length(btrim(display_name)) between 1 and 30),
  region text check (region in (
    'Midlands', 'North West', 'North East', 'Yorkshire', 'East', 'London',
    'South East', 'South West', 'Wales', 'Scotland', 'Northern Ireland'
  )),
  onboarded boolean not null default false,
  onboarded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_onboarded_complete check (
    not onboarded or (handle is not null and display_name is not null and region is not null)
  )
);

-- The rough home area, kept apart from profiles so RLS can make it owner-only.
-- Only used for invite matching (private.is_invited). A trigger snaps it to a
-- ~1 km grid, so even the owner's row never holds an exact place.
create table public.profile_homes (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  home extensions.geography(Point, 4326) not null,
  updated_at timestamptz not null default now()
);
create index profile_homes_home_idx on public.profile_homes using gist (home);

-- Expo push tokens (Phase 2: real push needs the paid Apple developer account).
create table public.push_tokens (
  token text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  platform text not null default 'ios' check (platform in ('ios', 'android')),
  created_at timestamptz not null default now()
);
create index push_tokens_user_idx on public.push_tokens (user_id);

-- ===========================================================================
-- Garage
-- ===========================================================================

create table public.builds (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  kind public.vehicle_kind not null,
  make text not null check (char_length(btrim(make)) between 1 and 40),
  model text not null check (char_length(btrim(model)) between 1 and 60),
  year int check (year between 1900 and 2100),
  nickname text check (char_length(nickname) <= 40),
  stock_bhp numeric not null check (stock_bhp > 0 and stock_bhp < 3000),
  -- Kerb weight for cars, wet weight for bikes.
  weight_kg numeric not null check (weight_kg > 0 and weight_kg < 10000),
  torque_lb_ft numeric check (torque_lb_ft > 0),
  -- A measured figure from a dyno sheet. Wins over stock + mods.
  dyno_bhp numeric check (dyno_bhp > 0 and dyno_bhp < 3000),
  colour text check (colour ~ '^#[0-9a-fA-F]{6}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index builds_owner_idx on public.builds (owner_id);

create table public.build_mods (
  id uuid primary key default gen_random_uuid(),
  build_id uuid not null references public.builds (id) on delete cascade,
  category public.mod_category not null,
  name text not null check (char_length(btrim(name)) between 1 and 60),
  -- Claimed power gain, used when there's no dyno figure.
  bhp_gain numeric check (bhp_gain >= 0 and bhp_gain < 2000),
  position int not null default 0,
  created_at timestamptz not null default now()
);
create index build_mods_build_idx on public.build_mods (build_id);

-- Photos live in the private `photos` Storage bucket under {owner_id}/...
-- Plates are pixelated and metadata stripped on the phone before upload.
create table public.build_photos (
  id uuid primary key default gen_random_uuid(),
  build_id uuid not null references public.builds (id) on delete cascade,
  owner_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  storage_path text not null unique,
  position int not null default 0,
  created_at timestamptz not null default now(),
  constraint build_photos_own_folder check (split_part(storage_path, '/', 1) = owner_id::text)
);
create index build_photos_build_idx on public.build_photos (build_id);

-- ===========================================================================
-- Crews (and official clubs, later)
-- ===========================================================================

create table public.crews (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 3 and 30),
  tag text not null check (tag ~ '^[A-Z0-9]{2,4}$'),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  -- Later: verified official clubs. Set by staff (service role) only.
  official_club boolean not null default false,
  -- e.g. {"website": "https://...", "instagram": "https://..."}
  club_links jsonb not null default '{}'::jsonb check (jsonb_typeof(club_links) = 'object'),
  club_verified_at timestamptz
);
create unique index crews_name_key on public.crews (lower(name));
create unique index crews_tag_key on public.crews (tag);

-- Someone is in at most one crew (unique user_id). Exactly one owner per crew.
create table public.crew_members (
  crew_id uuid not null references public.crews (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.crew_role not null default 'member',
  joined_at timestamptz not null default now(),
  primary key (crew_id, user_id),
  constraint crew_members_one_crew unique (user_id)
);
create unique index crew_members_one_owner on public.crew_members (crew_id) where role = 'owner';

-- Later: partner venues (cafés, venues that welcome meets). Always shown with
-- a visible label so paid placement is never disguised. Staff-managed.
create table public.partner_venues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  location extensions.geography(Point, 4326) not null,
  address text,
  website text,
  partner_label text not null default 'Partner' check (char_length(partner_label) between 1 and 30),
  active boolean not null default false,
  created_at timestamptz not null default now()
);
create index partner_venues_location_idx on public.partner_venues using gist (location);

-- ===========================================================================
-- Ban zones (court injunctions and PSPOs). Staff-managed, readable by all.
-- ===========================================================================

create table public.ban_zones (
  id text primary key,
  name text not null,
  centre extensions.geography(Point, 4326) not null,
  radius_miles numeric not null check (radius_miles > 0),
  note text not null,
  kind text not null default 'sample' check (kind in ('injunction', 'pspo', 'sample')),
  source_url text,
  valid_until date
);

-- ===========================================================================
-- Events
-- ===========================================================================

create table public.events (
  id uuid primary key default gen_random_uuid(),
  type public.event_type not null,
  title text not null check (char_length(btrim(title)) between 3 and 60),
  description text check (char_length(description) <= 1000),
  starts_at timestamptz not null,
  ends_at timestamptz check (ends_at > starts_at),
  reveal_minutes_before int not null default 60 check (reveal_minutes_before between 0 and 1440),
  -- Rough area shown before the reveal. Fuzzed on the phone (src/lib/area.ts)
  -- and checked by private.area_problem(): never within 0.75 mi of a stop.
  area extensions.geography(Point, 4326) not null,
  area_radius_miles numeric not null check (area_radius_miles >= 3),
  area_name text not null check (char_length(btrim(area_name)) between 1 and 60),
  -- Rolling meets: the index (event_stops.position) of the stop the meet is at now.
  current_stop int not null default 0 check (current_stop >= 0),
  crew_id uuid references public.crews (id) on delete set null,
  route_miles numeric check (route_miles >= 0),
  -- Invite filter (InviteFilter in types.ts). Empty arrays mean "any".
  invite_everyone boolean not null default false,
  invite_cars boolean not null default true,
  invite_bikes boolean not null default true,
  invite_classes public.class_letter[] not null default '{}',
  invite_min_mods int not null default 3 check (invite_min_mods between 0 and 50),
  invite_brands text[] not null default '{}',
  -- At least 10 mi (the form offers 10/25/50/100) so invites can't pin down a home.
  invite_radius_miles numeric not null default 25 check (invite_radius_miles between 10 and 300),
  created_by uuid references public.profiles (id) on delete set null,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index events_starts_idx on public.events (starts_at);
create index events_area_idx on public.events using gist (area);
create index events_crew_idx on public.events (crew_id);

-- Exact places. Direct reads are hosts only; everyone else goes through
-- public.get_event_stops(), which nulls what they may not see.
create table public.event_stops (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  position int not null check (position >= 0),
  name text not null check (char_length(btrim(name)) between 1 and 80),
  location extensions.geography(Point, 4326) not null,
  note text check (char_length(note) <= 200),
  -- Set when a host moves a rolling meet on to this stop.
  revealed_at timestamptz,
  constraint event_stops_position_key unique (event_id, position) deferrable initially deferred
);
create index event_stops_location_idx on public.event_stops using gist (location);

-- Named co-hosts. Crew events also give host rights to the crew's owner and hosts.
create table public.event_hosts (
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (event_id, user_id)
);
create index event_hosts_user_idx on public.event_hosts (user_id);

create table public.event_going (
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);
create index event_going_user_idx on public.event_going (user_id);

-- Requests from people the invite doesn't cover. Never approved automatically.
create table public.event_requests (
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  status public.request_status not null default 'pending',
  created_at timestamptz not null default now(),
  answered_at timestamptz,
  answered_by uuid references public.profiles (id) on delete set null,
  primary key (event_id, user_id)
);

-- No position is ever stored: the server checks the distance and forgets it.
create table public.check_ins (
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  stop_id uuid not null references public.event_stops (id) on delete cascade,
  checked_in_at timestamptz not null default now(),
  primary key (event_id, user_id, stop_id)
);
create index check_ins_stop_idx on public.check_ins (stop_id);
create index check_ins_user_idx on public.check_ins (user_id);

-- Audit log of every stop placed, edited, moved, removed and moved on to.
-- Hosts only (it names places). Kept for the retention period (legal.md: 12 months)
-- even after a stop is removed, so location is copied here, not referenced.
create table public.plan_changes (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  by_user uuid references public.profiles (id) on delete set null,
  at timestamptz not null default now(),
  kind text not null check (kind in ('created', 'edited', 'rename', 'move', 'remove', 'add', 'move_on', 'cancelled')),
  text text not null,
  stop_id uuid,
  stop_name text,
  location extensions.geography(Point, 4326),
  ban_zone text
);
create index plan_changes_event_idx on public.plan_changes (event_id, at);

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 500),
  -- App-written lines ("Hosts changed the plan"). Only security definer functions write these.
  system boolean not null default false,
  created_at timestamptz not null default now()
);
create index chat_messages_event_idx on public.chat_messages (event_id, created_at);

-- One vote per voter per category; a new vote replaces the old (created_at moves).
create table public.votes (
  event_id uuid not null references public.events (id) on delete cascade,
  voter_id uuid not null references public.profiles (id) on delete cascade,
  category text not null check (category ~ '^(best-in-show|best-car|best-bike|class-[SABCD]|stance|sound|paint|cleanest|newcomer)$'),
  build_id uuid not null references public.builds (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (event_id, voter_id, category)
);
create index votes_event_category_idx on public.votes (event_id, category, created_at);

-- In-app notice list (and the queue the push function reads in Phase 2).
-- Text never names a place: lock screens are public.
create table public.notices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  event_id uuid references public.events (id) on delete cascade,
  kind public.notice_kind not null,
  key text,
  title text not null,
  body text not null,
  url text,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  pushed_at timestamptz
);
create unique index notices_user_key on public.notices (user_id, key) where key is not null;
create index notices_user_idx on public.notices (user_id, created_at desc);
create index notices_unpushed_idx on public.notices (created_at) where pushed_at is null;

-- ===========================================================================
-- Drives, photo spots, tracks and venues
-- ===========================================================================

create table public.spots (
  id uuid primary key default gen_random_uuid(),
  kind public.spot_kind not null,
  name text not null check (char_length(btrim(name)) between 3 and 60),
  description text not null default '',
  location extensions.geography(Point, 4326) not null,
  -- Drives: the line of the road. Each vertex is a checkpoint.
  path extensions.geography(LineString, 4326),
  miles numeric check (miles > 0),
  -- Null for places added by Nightshift (tracks, bundled drives): nobody earns author rep.
  author_id uuid references public.profiles (id) on delete set null,
  status public.spot_status not null default 'pending',
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  ban_zone text,
  warnings text[] not null default '{}',
  region text,
  constraint spots_drive_has_path check (kind <> 'drive' or path is not null)
);
create unique index spots_name_key on public.spots (lower(name));
create index spots_location_idx on public.spots using gist (location);

-- Only the day is kept: never a time of day, a duration or a speed.
create table public.spot_completions (
  id uuid primary key default gen_random_uuid(),
  spot_id uuid not null references public.spots (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  completed_on date not null,
  -- Photo spots: a plate-pixelated photo from the visit, in the photos bucket.
  photo_path text check (photo_path is null or split_part(photo_path, '/', 1) = user_id::text),
  constraint spot_completions_once_a_day unique (spot_id, user_id, completed_on)
);
create index spot_completions_user_idx on public.spot_completions (user_id);

create table public.spot_ratings (
  spot_id uuid not null references public.spots (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  stars int not null check (stars between 1 and 5),
  rated_at timestamptz not null default now(),
  primary key (spot_id, user_id)
);

-- ===========================================================================
-- Road closures (Phase 2 import from UK open data, see functions/import-closures)
-- ===========================================================================

create table public.road_closures (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('national_highways', 'street_manager', 'tfl')),
  source_id text not null,
  kind text not null,
  description text,
  geom extensions.geography not null,
  starts_at timestamptz,
  ends_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint road_closures_source_key unique (source, source_id)
);
create index road_closures_geom_idx on public.road_closures using gist (geom);
create index road_closures_ends_idx on public.road_closures (ends_at);

-- ===========================================================================
-- Triggers
-- ===========================================================================

create trigger profiles_touch before update on public.profiles
  for each row execute function private.touch_updated_at();
create trigger builds_touch before update on public.builds
  for each row execute function private.touch_updated_at();
create trigger events_touch before update on public.events
  for each row execute function private.touch_updated_at();

-- Homes are always stored on the ~1 km grid, whoever writes them.
create function private.fuzz_home()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.home := private.fuzz(new.home);
  new.updated_at := now();
  return new;
end;
$$;
create trigger profile_homes_fuzz before insert or update on public.profile_homes
  for each row execute function private.fuzz_home();

-- A profile row for every new auth user (email OTP sign-up).
create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function private.handle_new_user();

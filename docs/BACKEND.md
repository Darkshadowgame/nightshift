# Nightshift backend (Supabase)

Status: **live on the hosted project since 17 Nov 2026** (ref
`vuftzeianmqjboivqmws`, region **eu-west-1, Ireland**, free plan, Postgres 17).
All 17 migrations and the seeds are applied and the 612 pgTAP checks pass
against the hosted database (Community added 17 Nov 2026, section 3b) (road reports added 17 Nov 2026, section 3a; Nightshift's
own drives and photo spots on the server, section 7a-4). **The app is wired to it** (17 Nov 2026): signed in,
every store action goes to the tables and RPCs below (section 5); "Try the demo
without an account" keeps the local sample scene. The end-to-end smoke test
(`scripts/supabase-smoke.mjs`, section 7c) passes 106 of 106 checks as three real
users. Sign-in emails need custom SMTP before testers other than the project team
can get one: see section 7b, "Still to do".

Everything lives in `supabase/` (Supabase CLI layout):

| Path | What it is |
|---|---|
| `supabase/config.toml` | Local stack settings (CLI 3.2.0 template): email code sign-in, `photos` bucket, functions |
| `supabase/migrations/20261117120000_base.sql` | PostGIS, the `private` schema, enums, small helpers |
| `supabase/migrations/20261117120100_tables.sql` | Every table, index and trigger |
| `supabase/migrations/20261117120200_rls.sql` | Access helpers, Row Level Security policies, table grants |
| `supabase/migrations/20261117120300_rpc.sql` | The RPC functions the app calls, the `awards` view |
| `supabase/migrations/20261117120400_storage.sql` | The `photos` bucket and its policies |
| `supabase/migrations/20261117120500_reminders.sql` | Server-side reminder queue (Phase 2 push) |
| `supabase/migrations/20261117120600_notice_kind_nearby.sql` | The `nearby` notice kind (on its own: a new enum value can't be used in the transaction that adds it) |
| `supabase/migrations/20261117120700_discovery.sql` | Staff read access, travel settings, new-event notices, `search_events()` |
| `supabase/migrations/20261117120800_feedback.sql` | In-app feedback (insert-only) and the private `feedback` screenshot bucket |
| `supabase/migrations/20261117130000_event_vehicles.sql` | The build you're bringing on `event_going` / `event_requests`, vehicle rules in `set_going()`, `answer_request()`, `check_in()` and the awards; `builds.vehicle_id`, `tune_stage`, `engine_swap` |
| `supabase/migrations/20261117170000_road_reports.sql` | Community road reports: `road_reports`, `road_report_votes`, `road_rep`, the report/vote/near RPCs, `road_closures_near()`, `road_rep_for()`, Realtime on `road_reports`; extra `road_closures` columns (section 3a) |
| `supabase/migrations/20261117150000_app_wiring.sql` | What the app needs: `events_list`, `spots_list`, `my_home` read views (lat/lng instead of geography, `security_invoker`, so RLS still decides); the Realtime publication; `delete_my_account()` |
| `supabase/migrations/20261117230000_feedback_triage.sql` | Feedback triage (`triage_notes`, `fixed_in`, `handled_at`), senders read their own, `feedback_status()`, kind `other`, screenshots list, context and opt-in location, `pg_net` and the email trigger (section 3, "Feedback"; 7e) |
| `supabase/migrations/20261117190000_bundled_places.sql` | Nightshift's own places on the server: `spots.bundled_id` (the app's stable id, unique, no author) and `limit_mph`, both in `spots_list`; `complete_drive()` uses the road's own limit; `place_rep_for()` (drives, their tier rep and photo spots per person, counts only) |
| `supabase/migrations/20261117220000_community.sql` | Community: Cars near you, connections, blocks, the forum, messages, feed posts, rate builds, reports, rate limits, the private `messages` bucket (section 3b) |
| `supabase/migrations/20261117233000_report_targets.sql` | Report targets `chat`, `event`, `crew`, `spot` (on their own: a new enum value can't be used in the transaction that adds it) |
| `supabase/migrations/20261117233100_moderation.sql` | Moderation for all user content: reports on event chat, events, crews and places; hidden chat lines; blocks in event chat; `suspensions`; `moderate_report()` with suspend; `lift_suspension()`; `my_moderation_status()` (section 3b) |
| `supabase/seed.sql` | Places only: the 2 sample ban zones and 8 UK circuits (with their bundled ids) |
| `supabase/seed_bundled_places.sql` | **Generated** by `scripts/seed-bundled-places.mjs` from `src/data/places.ts`: the 129 bundled drives and 111 photo spots, an upsert on `bundled_id` |
| `supabase/tests/rls_test.sql` | pgTAP: stop visibility, votes, home privacy (47 checks) |
| `supabase/tests/rpc_test.sql` | pgTAP: every RPC end to end, storage, reminders (63 checks) |
| `supabase/tests/discovery_test.sql` | pgTAP: travel settings, new-event notices, `search_events()`, discovery and staff (75 checks) |
| `supabase/tests/feedback_test.sql` | pgTAP: feedback sending, reading (own and staff), the screenshot bucket, the flood guard (33 checks) |
| `supabase/tests/feedback_triage_test.sql` | pgTAP: the form's fields, a retry can't duplicate, senders read their own (not the notes), `feedback_status()` by id signed out, staff-only triage, `handled_at`, the email trigger queues a call (37 checks) |
| `supabase/tests/vehicles_test.sql` | pgTAP: what you're bringing: own builds only, going vs asking per build, changing it, check-in, awards from brought builds, the garage columns (42 checks) |
| `supabase/tests/account_test.sql` | pgTAP: the read views (own home only, others' pending places hidden, refused signed out) and `delete_my_account()` (cascade, crew handed over, events only you host cancelled, places kept without an author) (20 checks) |
| `supabase/tests/road_reports_test.sql` | pgTAP: reporting rules and rate limits, police only for the driving context, votes, expiry and its cap, clearing, merging, rep and its daily caps, open-data closures, privacy (66 checks) |
| `supabase/tests/bundled_places_test.sql` | pgTAP: bundled ids (unique, format, no author), nobody signed in can add, change or delete one, finishing (with the road's own limit), visiting and rating one through the RPCs, `spot_stats` and `place_rep_for` the same for others, signed out refused (30 checks) |
| `supabase/tests/community_test.sql` | pgTAP: Cars near you (rounding, hiding, blocks), connections (requests, declines and their 30 days, rate limit), 1-to-1 and group messages only between connections, blocks, the forum (filter, Solved rep and its caps, rate limits), feed posts (never near home, connections-only), reports and staff, message photos (163 checks) |
| `supabase/tests/moderation_test.sql` | pgTAP: reports on event chat (only lines you can read), events, crews and places; blocks hide event chat; three reports hide a chat line; staff hide, reject, cancel and suspend; a suspended person can't chat, post or connect but can report; lifting it (36 checks) |
| `scripts/seed-bundled-places.mjs` | Writes `seed_bundled_places.sql` from the app's place list (`src/lib/backend/bundledSeed.ts`, unit-tested) and, with `--apply`, runs it on the hosted project |
| `scripts/supabase-smoke.mjs` | End to end against the hosted project as three throwaway users (section 7c) |
| `supabase/functions/feedback-notify/` | Emails the team about each new report through Brevo SMTP (section 7e); `message.ts` is pure and tested in Jest |
| `scripts/feedback-inbox.mjs` | The feedback inbox: list, download screenshots outside the repo, mark seen/planned/fixed (docs/FEEDBACK.md) |
| `supabase/functions/push-notices/` | Phase 2 sketch: reminders and "moved on" pushes via Expo |
| `supabase/functions/import-closures/` | UK open-data road closures: TfL (keyless) and National Highways (needs a key); `parse.ts` is pure and tested in Jest. Written and type-checked, **not deployed** (section 7d) |
| `supabase/templates/otp.html` | Sign-in email that shows the 6-digit code |

## 1. Architecture

```
iPhone app (Expo SDK 58)
  └─ src/lib/store.tsx  →  a Repository (src/lib/repository.ts) with two implementations:
        LocalRepository   (src/lib/localRepository.ts: AsyncStorage, the demo scene)
        SupabaseRepository (src/lib/backend/remote.ts: supabase-js, tables for plain
                            reads/writes, RPCs for rules, Realtime for the open event)
                │  HTTPS, publishable (anon) key + the user's session JWT
                ▼
Supabase (eu-west-1, Ireland)
  ├─ Auth: email one-time code (6 digits). Sign in with Apple later.
  ├─ Postgres 17 + PostGIS
  │    public   : tables (RLS on every one), RPC functions, `awards` view
  │    private  : helpers used by policies and RPCs (not exposed over the API)
  ├─ Storage: `photos` (private bucket, {user_id}/... folders)
  │           `feedback` (private, insert-only screenshots; staff read)
  └─ Edge Functions (Phase 2): push-notices, import-closures, run by pg_cron
```

Rules of thumb:

* **Rules live on the server.** Anything with a rule in `src/lib/*.ts` (who can
  see a stop, check in, vote, move on, change the plan, finish a drive) is an
  RPC. The RPCs raise with the **same sentence the phone shows today**, so the
  UI can show `error.message` as it is.
* **Plain data is plain tables.** Builds, mods, build photos, chat messages and
  push tokens are read and written directly, with RLS deciding whose rows.
* **Every security definer function** has `set search_path = ''` and
  schema-qualifies every name (Supabase's advice). Helpers that take a user id
  live in `private`, which the Data API doesn't expose, so nobody can call them
  with someone else's id. `anon` (signed out) can't read any table or call any function.
* **Points** are `geography(Point, 4326)`; distances are metres in SQL, miles in
  the app (1 mi = 1609.344 m). RPCs take and return plain `lat`/`lng` numbers.
* **Ids** are UUIDs. The app's string ids (`crew-…`, `sp-…`) stay for the local demo only.

## 2. Tables

| Table | Holds | Who can read | Who can write |
|---|---|---|---|
| `profiles` | handle (unique), display name, region, onboarded | signed-in users | `save_profile()` only; a trigger makes the row at sign-up |
| `profile_homes` | rough home area, **snapped to ~1 km by a trigger** | **only the owner** | `save_profile()` only |
| `profile_settings` | willing to travel (`travel_miles`, 1–300) and `new_event_alerts` (`notify` / `search` / `off`); no row means 25 and `notify` | **only the owner** | `save_travel_prefs()` only |
| `staff` | who is an admin (moderation read access) | yourself; staff see the list | service role only |
| `push_tokens` | Expo push tokens (Phase 2) | owner | owner |
| `builds`, `build_mods` | garage; `vehicle_id` (the picker's dataset id), `tune_stage`, `engine_swap` (jsonb: donor, bhp, …) | signed-in users | owner |
| `build_photos` | Storage path per photo, `{owner}/...` enforced | signed-in users | owner |
| `crews` | name, tag, `official_club`, `club_links`, `club_verified_at` | signed-in users | crew RPCs; club fields staff only |
| `crew_members` | role owner/host/member; one crew per person; one owner per crew | signed-in users | crew RPCs |
| `partner_venues` | labelled partners on the map's Shops layer (`partner_label` is required); app mapping in section 2a | signed-in users (active only) | staff only |
| `ban_zones` | injunction/PSPO circles with source and expiry | signed-in users | staff only |
| `events` | type, title, times, reveal minutes, **rough area** + radius, invite filter columns, `current_stop`, `crew_id`, `cancelled_at` | signed-in users | `save_event()`, `cancel_event()`, `move_on()`, `change_plan()` |
| `event_stops` | ordered stops with exact `location`, `revealed_at` | **hosts only** (everyone else: `get_event_stops()`) | event RPCs |
| `event_hosts` | named co-hosts | signed-in users | `save_event()` |
| `event_going` | who's going, and `build_id`: the build they're bringing (null for old rows and passengers) | self, hosts, people going | `set_going()`, `answer_request()`, `check_in()` |
| `event_requests` | pending / approved / declined, and the `build_id` they asked with | self, hosts | `set_going()`, `answer_request()` |
| `check_ins` | stop id + time. **No position is ever stored** | self, hosts, people going | `check_in()` |
| `plan_changes` | audit log of every stop placed, edited, moved, removed, moved on to (with a copy of the location) | **hosts only** | event RPCs |
| `chat_messages` | event chat, `system` flag | hosts and people going | hosts and people going (never `system`) |
| `votes` | one per voter per category | **only your own** | `cast_vote()` |
| `notices` | in-app notices and the push queue: reminders, "moved on", and `nearby` (new event near you) | owner | RPCs and triggers; owner may set `read_at` |
| `spots` | drive / photo / track / venue, `path` LineString for drives, author, pending/approved/rejected | approved ones, plus your own pending | `suggest_spot()`; approval by staff |
| `spot_completions` | **day only** (`completed_on`), optional photo path | owner | `complete_drive()`, `visit_spot()` |
| `spot_ratings` | 1–5 stars | owner | `rate_spot()` |
| `road_closures` | imported open-data closures: `road`, `direction`, `full_closure` (lanes only = false), line or point | signed-in users (`road_closures_near()` for the app) | import function (service role) |
| `road_reports` | drivers' reports: kind, point (~10 m), heading, `created_by`, expiry, status, confirm/clear counts | signed-in users, **not police** and **never `created_by`** (column grants) | `report_road()`, `vote_road_report()` |
| `road_report_votes` | one "still there" / "gone" per person per report | own answers | `vote_road_report()` (and `report_road()` merging) |
| `road_rep` | rep from road reports (reported +10 / checked +2, 0 over the daily cap) | own rows (`road_rep_for()` gives counts for anyone) | the RPCs |
| `feedback` | bug / idea / looks_wrong reports: message (1–4000), screen, app version, update id, device, optional screenshot path, `status` | **staff only** | anyone, signed in or not (insert only); staff set `status` or delete |

The invite filter is stored as columns (`invite_everyone`, `invite_cars`,
`invite_bikes`, `invite_classes`, `invite_min_mods`, `invite_brands`,
`invite_radius_miles`) rather than JSON, so the server can match on it.
`invite_radius_miles` must be 10–300 (the form offers 10/25/50/100).

## 2a. Partners on the Shops layer (`partner_venues`)

The app's `Partner` type (`src/lib/partners.ts`) is filled from `partner_venues` by
`partnerFromRow()`, which drops inactive rows and rows without a label, so a partner is
never shown unlabelled. Read it as plain lat/lng like the RPCs, e.g.
`select id, name, description, st_y(location::geometry) as lat, st_x(location::geometry) as lng, address, website, partner_label, active from partner_venues`.

| Column | `Partner` field | Notes |
|---|---|---|
| `id` | `id` | The shop screen opens `/shop/partner:<id>` |
| `name` | `name` | |
| `description` | `description` | |
| `location` | `at` | As `lat`, `lng` |
| `address` | `address` | |
| `website` | `link` | Only http(s) links open |
| `partner_label` | `label` | Shown as the badge; "Partner" is added if the label doesn't say it |
| `active` | (filter) | Only active rows; RLS already hides the rest from non-staff |
| *later:* `offer text` | `offer` | Needs a migration (not applied) |
| *later:* `categories text[]` | `categories` | Shops-layer kinds (`tuning`, `parts`, `gear`, `dealer`, `tyres`, `detailing`, `dyno`, `garage`, `coffee`); unknown values dropped; none means `coffee` (the table was first meant for meet-friendly venues). Needs a migration |
| *later:* `phone text`, `opening_hours text` | `phone`, `hours` | OSM `opening_hours` syntax, read by `src/lib/openingHours.ts`. Needs a migration |

Proposed migration (not applied): `alter table public.partner_venues add column offer text
check (char_length(offer) <= 300), add column categories text[] not null default '{}',
add column phone text, add column opening_hours text;`. The OpenStreetMap shop listings
are bundled in the app and are not stored in the database.

## 3. Visibility rules (enforced on the server)

### Exact stop locations

`event_stops` can only be read directly by the event's hosts. Everyone else
calls `get_event_stops(event_ids)`, which returns every stop row they're allowed
to know about and sets `name`, `lat`, `lng` and `note` to null with
`visible = false` when they may not see it (the app shows "Stop n"). People
with no part in a private event get no stop rows at all.

`private.can_see_stop()` is the same rule as `canSeeStop()` in `src/lib/events.ts`:

1. Hosts see every stop. Hosts are the named co-hosts plus, for crew events, the crew's owner and hosts.
2. Shows and track days are public.
3. Cancelled events reveal nothing more.
4. Otherwise you must be **going** and it must be **past the reveal time** (`starts_at − reveal_minutes_before`).
5. Cruises and meets: then every stop.
6. Rolling meets: stop 0 from the reveal. A later stop only once a host has
   **moved on** to it (`position <= current_stop`), **and** only if you
   **checked in at the stop before**.

Stop names count as location (they come from the reverse geocoder, e.g. a
street name), so they're hidden too.

### Home location

`profile_homes` is a separate table whose only policy is "owner reads own row".
It's written only by `save_profile()`, and a trigger snaps it to the 0.01° grid
(about 1 km) whatever the caller sends. Invite matching (`private.is_invited()`,
used by `events_for_me()`, `event_role()`, `set_going()`, `search_events()` and
the new-event trigger) runs as security definer and only returns yes/no.
`search_events()` returns your distance to each event's rough area, measured
from your own home inside the function; it never returns the home itself. `invite_count()` (the host form's live count)
returns counts only, reports 1–2 as `null` ("fewer than 3") and refuses a radius
under 10 mi, so narrow filters can't be used to locate one person's home.

### Votes and awards (mirrors `src/lib/awards.ts`)

`cast_vote()` checks that:

* the event isn't cancelled;
* voting is open, from the start until 24 h after the end;
* you **checked in** at the event;
* the build is one a person who checked in **brought** (`private.award_candidates()`; someone with no pick on record, e.g. a host who never tapped Going, counts with all their builds), and is the right kind or class for the category;
* it isn't **your own build**.

A new vote in the same category replaces the old one. Votes are secret (you
read only your own). `event_awards(event_id)` and the `awards` view give the
results once voting closes. `categoriesFor()` decides which awards the event
has (from the brought builds), a category needs 3 or more votes, only votes for
builds that are still candidates count, and a tie goes to the build that
reached the top count first.

### What you're bringing (mirrors `src/lib/bringing.ts`)

`event_going.build_id` and `event_requests.build_id` hold the build each person
is bringing. A composite foreign key `(build_id, user_id) → builds (id, owner_id)`
means it can only ever be **your own** build; deleting the build clears the pick
(`on delete set null (build_id)`) and keeps the place. Neither table can be
written directly; only the RPCs below change them.

* `set_going(event, true, build)`: going straight in needs `private.can_go_with()`
  (host; public event; or home inside the radius and "everyone welcome" or the
  build fits the filter). Otherwise it's a request carrying that build. No build
  keeps your earlier pick; the first time, a person with exactly one build gets it.
* Changing to a build the invite doesn't cover while going puts you **back to
  asking** a host; changing a request to a build that fits goes straight in.
* Changes are allowed until the start. After that only at check-in
  (`check_in(..., p_build_id)`, to a build the invite covers), and never once
  you've checked in ("You've checked in, so your vehicle is set for this one.").
* `answer_request()` approves with the build the request carried.
* Invites, `search_events()`, `events_for_me()` and new-event notices still use
  `private.is_invited()`, which counts **any** of your builds.

### Check-ins

`check_in(event, position, lat, lng, build)` repeats `canCheckIn()`:

* the event isn't cancelled or over;
* check-in opens 30 minutes before the start;
* you're going or a host;
* you can see the stop;
* for a rolling meet, it's the current stop;
* PostGIS `ST_DWithin` puts you within **0.5 mi** of the stop.

The position is compared and thrown away. There is no "skip the GPS check" on
the server: the demo switch only exists in local mode. The optional build says
you turned up in something else (see "What you're bringing"); a host checking
in with a build is added to `event_going` with it.

### Everything else

* Chat: hosts and people going.
* Plan-change log: hosts only.
* Requests: the person who asked, and the hosts.
* Who's going and check-ins: the person, the hosts and others going.
* Spot completions and ratings: the owner only. `spot_stats()` gives
  counts and averages without saying who or when.
* Event rows (rough area, time, filters) are readable by every signed-in
  user. This is the same as the share text, which only ever carries the rough
  area. **Decided** by the owner (section 8): every signed-in user can see that
  an event exists.

### Staff (admins)

`public.staff` lists admins; `private.is_admin()` checks it. Staff get extra
SELECT policies on every table that isn't already readable by all signed-in
users (stops, going, requests, check-ins, plan changes, chat, votes, notices,
spots of any status, completions, ratings, partner venues), so they can
moderate. They do **not** get:

* homes (`profile_homes`), travel settings (`profile_settings`) or push tokens:
  the app promises the home area is never shown to anyone, and moderation
  doesn't need them;
* host powers: `private.is_event_host()` is unchanged, so staff can't edit,
  cancel, move on or answer requests, and `event_role()` is `none` for them;
* any write access. Staff are added and removed with the service role
  (dashboard or SQL editor): `insert into public.staff (user_id, note) values ('<uuid>', 'moderator');`

### New events near you

`private.queue_nearby_notices(event)` (mirrors `isNearbyMatch()` in
`src/lib/discover.ts`) adds a `nearby` notice for each person who:

* has `new_event_alerts = 'notify'` (the default; `search` and `off` get nothing);
* has a home within their own `travel_miles` of the event's rough area
  (PostGIS `ST_DWithin` on `profile_homes`, inside the function: homes are never returned);
* can go: a show or track day, or `private.is_invited()` (a build fits the
  filter and they live inside the host's radius; "everyone welcome" skips the build check);
* isn't the creator, a host (named or crew), going, or in `event_requests`;
* and the event hasn't started and isn't cancelled.

The text is `New <type> near you` / `<title> · <Dy DD Mon HH24:MI> · <area name>`:
never a stop or a distance. The key `ns.<event>.nearby` makes it once per person
per event. A **deferred constraint trigger** on `events` runs it at the end of the
transaction (so `save_event()` has added co-hosts first), on insert and on
updates of the area, time, type or invite filter (an edit can let new people
in; people already told aren't told again). `push-notices` pushes these with the
reminders in Phase 2. Only the trigger can call it.

### Feedback

`public.feedback` takes reports from the app's Send feedback form and the
pickers' and shop screens' suggestions. Anyone can send one, signed in or not
(a sign-in problem is worth hearing about). How to work through it:
[FEEDBACK.md](FEEDBACK.md).

* **Sending is insert-only.** `anon` and `authenticated` may fill in `id` (the
  phone's UUID, so a retry is refused as a duplicate instead of sent twice),
  `kind` (`bug` / `idea` / `looks_wrong` / `other`), `message` (1–4000
  characters, not blank), `screen`, `app_version`, `update_id`, `device`,
  `context` (a small JSON object: runtime, channel, model, os, route, backend;
  under 2000 bytes), `lat`/`lng` (both or neither: only when the sender ticks
  "include my location"), `photo_path`/`photo_paths` (at most 4) and `user_id`.
  They can't set `status` (it starts as `new`), `triage_notes`, `fixed_in`,
  `handled_at` or `notified_at`.
* `user_id` defaults to `auth.uid()` and may only be the sender or null, so
  nobody can send feedback in someone else's name. Signed out it is null.
* **Senders read their own** (signed in): every column except `triage_notes` and
  `notified_at` (column grants). Signed out there's no user, so
  `feedback_status(p_ids uuid[])` (security definer, anon and authenticated)
  returns id, created_at, kind, status, fixed_in and handled_at for up to 100 ids
  the phone made itself; the random UUID is the secret. "Your feedback" in the app
  uses both.
* **Triage is staff only** (`private.is_admin()`): staff read everything, set
  `status` (`new` / `seen` / `planned` / `done` / `wont_do`), `fixed_in`,
  `triage_notes` and `handled_at`, and delete. Nobody can rewrite a message or its
  context through the API. `handled_at` is stamped by a trigger when the status
  changes and cleared when it goes back to `new`. The inbox script
  (`scripts/feedback-inbox.mjs`) does triage as the service path.
* **Flood guard:** at most 20 an hour per signed-in person and 300 an hour in
  total (a trigger; the sender sees "You've sent a lot of feedback in the last
  hour…" or "Lots of feedback is coming in right now…").
* **Screenshots** go in a separate private `feedback` bucket (5 MB, images),
  not `photos`: every signed-in user can read `photos`, and a screenshot can
  show a stop or a name. Signed-in users upload to
  `feedback/{user_id}/{feedback id}/{n}.jpg`; only staff read or delete there.
  Every path in `photo_path`/`photo_paths` must be in the sender's own folder.
  Signed-out people send text only.
* **Email to the team:** an `AFTER INSERT` trigger (`private.feedback_notify()`,
  security definer) posts `{"id": …}` to the `feedback-notify` Edge Function with
  `pg_net`, using the base URL in Vault (`functions_url`); without it, it does
  nothing, and an error there never blocks a report. The function claims the row
  (`notified_at`) with the service role and emails a summary with 7-day signed
  screenshot links (section 7e). Reports with `context.test = true` (the smoke
  test) are never emailed.

## 3a. Road reports (mirrors `src/lib/roadReports.ts`)

Owner decision, 17 Nov 2026: police reports are allowed, labelled "Police / speed check",
shown only in the driving view, 30 minutes, never on event, cruise or meet screens, and
earn rep like other reports once other drivers confirm them.

* **`report_road(p_kind, p_lat, p_lng, p_heading, p_from_lat, p_from_lng)`**: UK only;
  `p_from` (where the phone is) must be within 0.5 mi of the report and is **not stored**;
  one report every 2 minutes and 30 a day per person. The point is snapped to 4 decimal
  places (~10 m). The same kind already reported by someone else within 150 m, heading the
  same way (or no heading), becomes a "still there" for that report instead
  (`{ id, merged: true }`). Returns `{ id, merged, expires_at }`. Finished reports are deleted
  two days after they end (their rep rows stay, `report_id` set null).
* **Expiry** (`private.road_ttl` / `road_cap`): police 30 min, mobile camera 60 min, traffic
  30 min, hazard and crash 2 h, roadworks and closure 24 h. "Still there" sets
  `expires_at = least(created_at + cap, greatest(expires_at, now() + ttl))`; caps 2 h, 90 min,
  4 h, 4 h, 72 h, 72 h, and **30 min for police (never extended)**. Reports past their time are
  marked `expired` by the RPCs as they run.
* **`vote_road_report(p_report_id, p_vote, p_lat, p_lng)`**: active reports only, never your
  own, one answer each, and within 1 mi of the report (the position isn't stored). Two "gone"
  answers with no "still there" between them (ordered by `seq`) set `cleared`.
* **`road_reports_near(p_lat, p_lng, p_radius_mi = 10, p_context = 'map')`**: active reports,
  nearest first, at most 200, radius 0.1–50 mi, with `mine` and `my_vote`. **Police only
  when `p_context = 'driving'`, and then only within 10 mi.** Any other context is refused.
  The app sends `driving` from the driving view and nowhere else. The server can't know which
  screen asked, so the other safeguards matter: police rows can't be read from the table
  (RLS `kind <> 'police'`), so **Realtime never sends them**; the driving view re-reads every
  minute instead.
* **`road_closures_near(p_lat, p_lng, p_radius_mi = 10)`**: open-data closures in force now
  (`starts_at <= now() < ends_at`), with a `path` of points for lines.
* **Rep** (`road_rep`, `private.road_award`): +10 to the reporter the moment a report has 2
  confirmations (`confirmed_at`, once), at most 5 paid a day (Europe/London); +2 to anyone who
  answers, once per report, at most 10 paid a day. Over a cap the row is kept with 0 rep, so
  the counts stay right. Nothing for unconfirmed reports; nothing ever about speed.
  **`road_rep_for(p_user_ids)`** returns `reports_confirmed`, `reports_checked`,
  `reported_rep`, `checked_rep`, `rep` per person (counts only) for the app's rep ledger.
* **Who reported it** is never readable by others: `authenticated` has column-level `select`
  on everything in `road_reports` except `created_by` (PostgREST refuses
  `select=created_by`), and Realtime payloads leave it out (checked by the smoke test).
* **Realtime:** `road_reports` is in `supabase_realtime`; the app listens to any change and
  re-reads `road_reports_near()` (at most once a second).
* **Account deletion** deletes your reports, answers and rep (cascades from `auth.users`).

## 3b. Community (owner request, 17 Nov 2026)

The Community tab: Feed, People (Cars near you), Forum and Messages. Owner decision, 17 Nov
2026: **private messages only between connected people** (a request the other person
accepts); everyone else talks on the forum or under posts. Rules mirror
`src/lib/connections.ts`, `carsNear.ts`, `forum.ts`, `posts.ts`, `messages.ts` and
`moderation.ts`.

| Table | Holds | Who can read | Who can write |
|---|---|---|---|
| `profile_settings.show_in_nearby` | "Show me in Cars near you" (default on) | owner | `save_community_prefs()` |
| `connections` | requester, addressee, `pending` / `accepted` / `declined`; one row per pair | both people, **never a declined row** | `request_connection()`, `answer_connection()`, `remove_connection()`, `block_user()` |
| `blocks` | who blocked whom | the blocker only | `block_user()`, `unblock_user()` |
| `build_ratings` | like / pass per build per person | own rows (`build_likes()` gives counts) | `rate_build()` |
| `forum_threads`, `forum_replies` | board (`advice`, `builds`, `cars`, `bikes`, `detailing`, `meets`, `for_sale`, `local` + region), title, body, up to 4 photo paths (`photos/{uid}/forum/…`), linked build, counts, `solved_reply_id`, `hidden_at` | signed-in users, minus hidden posts (the author still sees theirs) and **people you blocked** | `create_thread()`, `reply_thread()`, `mark_solved()`; the author deletes |
| `forum_helpful` | "Helpful" per reply per person | own rows | `mark_helpful()` |
| `forum_rep` | +25 per thread whose Solved reply is yours (0 over a cap) | own rows (`forum_rep_for()` for anyone) | `mark_solved()` |
| `posts`, `post_likes`, `post_comments` | feed posts: text, up to 4 photo paths (`photos/{uid}/posts/…`), optional place (4 dp) and name, `public` / `connections`, counts | `can_see_post()`: public, or connections-only for connections; never across a block; hidden only to the author | `create_post()`, `like_post()`, `comment_post()`; authors delete (a post's author can delete comments on it) |
| `conversations`, `conversation_members`, `messages` | 1-to-1 (`direct_key`) and group chats (name, up to 50, admins), `last_read_at` ("Seen"), text, a photo in the private `messages` bucket, a shared card (`share`: kind event/place/build, id, title, subtitle) | **members only** (staff too: no blanket read; reports carry a copy) | RPCs only (below) |
| `reports` | target (thread, reply, message, post, comment, profile, build), reason, note, a copy of the text, status | **staff only** | `report_content()`; staff `moderate_report()` |
| `private.rate_hits` | one row per rate-limited action (kept a day) | nobody (functions only) | the RPCs |
| `private.banned_terms` | the word list for public text | nobody | staff with SQL |

**RPCs** (signed in only):

| RPC | Notes |
|---|---|
| `people_near(p_max_miles)` | `user_id`, `miles` only. Both homes snapped again to 0.05° (~5 km) and the distance rounded (`rough_miles`: under 5 → 5 "under 5 mi", to 2 under 20, to 5 under 50, to 10 beyond). Not you, not hidden people, not blocked either way; default distance is your travel distance |
| `save_community_prefs(p_show_in_nearby)` | |
| `request_connection(p_user)` | `'requested'` or `'connected'` (they'd asked you). 20 a day. Blocked either way: "You can't connect with this person." A decline isn't shown to the asker: asking again within 30 days changes nothing and `my_connections()` keeps saying `outgoing` |
| `answer_connection(p_user, p_accept)` / `remove_connection(p_user)` / `my_connections()` | `my_connections()`: `user_id`, `state` (`connected` / `incoming` / `outgoing`), `since` |
| `block_user(p_user)` / `unblock_user(p_user)` | A block deletes the connection, hides their posts, replies, comments and messages from you, and stops 1-to-1 messages both ways. Unblocking doesn't reconnect |
| `start_direct(p_user)` | Connected and no block, else "You can only message people you're connected with." One conversation per pair |
| `create_group(p_name, p_member_ids)` / `add_group_members` / `remove_group_member` / `set_group_admin` / `rename_group` / `leave_conversation` | Only your connections; up to 50 people; admins add, remove and rename; when the last admin leaves the longest-standing member takes over (trigger, also on account deletion); an empty conversation is deleted; system lines ("@a added @b") |
| `send_message(p_conversation_id, p_body, p_photo_path, p_share)` | `private.can_post()`: a group member, or in a 1-to-1 still connected with no block. 20 a minute, 1,000 a day. Photo path must be `{you}/{conversation}/…` |
| `mark_conversation_read(p_conversation_id)` / `my_conversations()` | Unread counts leave out your own lines, hidden lines and people you blocked; `can_send` |
| `create_thread`, `reply_thread`, `mark_helpful`, `mark_solved`, `forum_rep_for` | Threads: 3 in 10 minutes, 15 a day. Replies: 5 a minute, 200 a day. Solved: +25 to the reply's author, once per thread, never your own reply, at most 3 paid a day and one a week from the same thread author |
| `create_post(p_body, p_photos, p_lat, p_lng, p_place_name, p_visibility, p_build_id)` | 10 an hour, 30 a day. UK only; **refused within 1 km of your own home area** |
| `like_post`, `comment_post` | Comments: 5 a minute, 200 a day |
| `feed_posts(p_scope, p_before, p_author)` | `local` (public posts placed within your travel distance of your home area, or by people living within it), `connections` (theirs and yours) or `author`; 50 at a time; lat/lng, counts, `liked_by_me` |
| `posts_in_box(p_south, p_west, p_north, p_east)` | The map's Posts layer: posts with a place from the last 30 days, at most 200 |
| `rate_build(p_build_id, p_like)` / `build_likes(p_build_ids)` | Not your own build; 500 a day; counts only |
| `report_content(p_target, p_target_id, p_reason, p_note)` | Not yourself, only things you can see, 30 a day, once per thing. **Three different people** reporting a thread, reply, message, post or comment hides it (`hidden_at`) until staff look |
| `moderate_report(p_report_id, p_action)` | Staff only: `hide`, `restore` or `dismiss` (closes every open report on that thing) |

**Public text filter** (`private.text_problem()`, mirrored by `textProblem()` in
`src/lib/moderation.ts`; thread titles and bodies, replies, posts, comments, group names): a word
list (`private.banned_terms`: slurs and the strongest swearing, matched on whole words after
undoing 0→o, 1→i, 3→e, 4→a, 5→s, 7→t, 9→g, @→a, $→s, !→i and dots between letters), and the legal
rules: **no police spotting** ("police spotted…", "speed trap at the A15…": police reports stay
in the driving view only) and **no racing on public roads** ("street racing", "race on the A46").
Talking about the police ("pulled by police at a meet") is fine. Private messages aren't
filtered; they can be reported.

**Moderation with SQL** (dashboard SQL editor, or signed in as staff through the app's API):

```sql
-- What's waiting, most reported first (staff see it through RLS; the SQL editor sees everything)
select * from public.moderation_queue order by reports desc, first_reported;
-- Hide it (or 'restore', or 'dismiss'): as staff through the API, or in the SQL editor:
update public.forum_threads set hidden_at = now() where id = '<id>';   -- forum_replies, posts, post_comments, messages the same
update public.reports set status = 'actioned', handled_at = now() where target_id = '<id>' and status = 'new';
-- Someone who keeps breaking the rules: delete the account (cascades), or ban the auth user from the dashboard.
-- Add a word: insert into private.banned_terms (term) values ('...');
```

**Realtime:** `messages`, `conversation_members` (for "Seen") and `connections` are in
`supabase_realtime`; RLS decides who hears what, so a block or leaving a chat stops it.
**Storage:** `messages` bucket (private, 10 MB images): upload to `{you}/{conversation}/…` in a
conversation you're in; members read; you delete your own. Forum and post photos use
`photos` (signed-in users read, as for builds). **Account deletion** cascades everything
(threads, replies, posts, comments, messages, connections, blocks, ratings); the app removes
`photos/{uid}/` and `messages/{uid}/` first.

**Moderation for all user content** (`20261117233100_moderation.sql`, App Store 1.2):

* `report_content()` also takes `chat` (an event chat line you can read: you're a host or
  going), `event`, `crew` (reported against its owner) and `spot` (a suggested place, not
  Nightshift's own). Three reports hide a chat line (`chat_messages.hidden_at`), as for posts.
* **Blocks reach event chat:** a restrictive select policy on `chat_messages` leaves out lines
  from people you blocked (Realtime too) and hidden lines (their writer and staff still see them).
* **Suspensions** (`public.suspensions`: user, reason, `until` or null for "until lifted"): read
  your own (the app explains it) and staff read all; written only by `moderate_report(…,
  'suspend', p_days)` and removed by `lift_suspension()`. A suspended person can't post a thread,
  reply, post, comment, message, start a chat or group, ask to connect (all checked in
  `private.rate_hit()` and `check_can_add()`) or write in event chat (restrictive insert policy).
  They can still read, report and delete their account.
* **Staff in the app:** `my_moderation_status()` (`is_staff`, `suspended`, `suspended_until`)
  shows **Settings › Moderation** to staff only. It lists `moderation_queue` and calls
  `moderate_report(p_report_id, p_action, p_days, p_reason)`: `dismiss`; `hide` (posts, comments,
  threads, replies, messages and chat lines are hidden; an event is cancelled; a place is rejected;
  profiles, builds and crews are handled by suspending); `restore`; `suspend`. Every open report on
  the same thing closes with it.

Known gaps: photos on Connections-only posts are in `photos`, which any signed-in user can read
with the path (paths are random and never listed); the word list is short on purpose
(owner to extend); there's no appeal flow (people write to the support address); banning an
account for good is done in the dashboard (Authentication › Users › Ban).

## 4. RPC reference

All are `supabase.rpc(name, { p_…: … })`, signed in only.

| RPC | Replaces | Notes |
|---|---|---|
| `save_profile(p_handle, p_name, p_region, p_home_lat, p_home_lng)` | `saveProfile` | Same checks as `profileProblem()`; UK only; home fuzzed |
| `save_event(p_event jsonb, p_stops jsonb, p_cohost_ids uuid[])` | `saveEvent`, `editEvent` | Create when `p_event.id` is null, else edit (`canEditEvent()` rules). Returns `{ id, warnings[] }` (ban zones warn, don't block). Checks the rough area holds every stop and sits ≥ 0.75 mi from each (private types). Logs every stop to `plan_changes` |
| `cancel_event(p_event_id)` | `cancelEvent` | Hosts; system chat line |
| `set_going(p_event_id, p_going, p_build_id = null)` | `setGoing` | Returns `'going'`, `'requested'` or `'none'`. `p_build_id`: the build you're bringing (must be yours); see "What you're bringing" |
| `answer_request(p_event_id, p_user_id, p_approve)` | `answerRequest` | Hosts |
| `get_event_stops(p_event_ids uuid[])` | reading `event.stops` | See section 3 |
| `events_for_me(p_past_days = 7)` | `viewEvents()` | `event_id, role, phase, shown_stop` for every event you have a role in |
| `event_role(p_event_id)` | `roleOf()` | For an event opened from a shared link |
| `invite_count(p_filter jsonb, p_area_lat, p_area_lng)` | live count in the form | `{ people, builds }`, small counts null |
| `check_in(p_event_id, p_position, p_lat, p_lng, p_build_id = null)` | `checkIn` | 0.5 mi via PostGIS. `p_build_id`: what you actually turned up in, before your first check-in |
| `move_on(p_event_id)` | `moveOn` | Hosts, live rolling meets. Reveals the next stop, logs it, queues a "moved on" notice for the people checked in at the stop being left, and **returns their user ids** (the audience) |
| `change_plan(p_event_id, p_kind, p_stop_id, p_name, p_lat, p_lng, p_area_lat, p_area_lng, p_area_radius_miles)` | `changePlan` | `rename` / `move` / `remove` / `add`, with `applyPlanChange()`'s rules. For add/move the phone sends the new rough area from `area.ts`; the server checks it. Returns `{ warning }`; posts "Hosts changed the plan" |
| `cast_vote(p_event_id, p_category, p_build_id)` | `vote` | Only builds people brought |
| `event_awards(p_event_id)` / view `awards` | `results()` / `allAwards()` | Candidates: `private.award_candidates()` |
| `suggest_spot(p_kind, p_name, p_description, p_points jsonb)` | `suggestSpot` | `draftProblem()` rules (1.5 mi gaps, 1–80 mi). Starts pending. Returns `{ id, warning }` |
| `complete_drive(p_spot_id, p_fixes jsonb)` | `finishDrive` | `p_fixes` = one `{lat, lng, t}` per checkpoint (t in ms). Checks order, 0.2 mi per checkpoint, the time window and the 45 mph average, plus "finished within the last hour". Returns `{ ok }` or `{ ok: false, reason }`. Stores the **day only**, once a day; fixes and times are never stored or echoed |
| `visit_spot(p_spot_id, p_lat, p_lng, p_photo_path)` | `visitSpot` | 0.2 mi; photo must be in your own folder |
| `rate_spot(p_spot_id, p_stars)` | `rateSpot` | Completed it, not the author, 1–5 |
| `spot_stats(p_spot_ids uuid[])` | `statsOf()` / `averageStars()` | `people, rating_average, rating_count, completed_by_me` |
| `create_crew(p_name, p_tag)` / `join_crew(p_crew_id)` / `leave_crew()` | crew actions | One crew at a time; an owner who leaves hands over to a host, else the longest-standing member |
| `set_crew_role(p_crew_id, p_user_id, p_role)` | `setCrewHost` | Owner only; `host` or `member` |
| `mark_notices_read()` | `markNoticesRead` | |
| `save_travel_prefs(p_travel_miles, p_new_event_alerts)` | `setTravelPrefs`, and the travel fields of `saveProfile` | Same checks and sentences as `travelProblem()` / `alertProblem()`: whole miles 1–300; `notify`, `search` or `off` |
| `search_events(p_max_miles, p_types, p_when, p_can_go_only, p_vehicles, p_from_lat, p_from_lng)` | `searchEvents()` (Find events) | All optional. Distance from **your own home** (read inside, never returned), or from the point you send **snapped to ~1 km**, to each event's rough area; nearest first, then soonest; up to 100. `p_max_miles` null = your travel distance; 1–600 (600 = the app's "Any distance"). `p_when`: `any` / `tonight` (to 5am) / `week` / `weekend` (Fri 5pm–Mon 5am), Europe/London. `p_vehicles`: `any` / `cars` / `bikes`. Returns the event fields, `role`, `can_go`, `phase`, `miles` (0.1), `shown_stop`, and `stop_name`/`stop_lat`/`stop_lng` **only for a stop you may see** (null for locked events: rough area only) |
| `queue_due_reminders()` | (server only) | Service role only; used by `push-notices` |
| `report_road(p_kind, p_lat, p_lng, p_heading, p_from_lat, p_from_lng)` | `roads.report` (driving view) | Section 3a. Returns `{ id, merged, expires_at }` |
| `vote_road_report(p_report_id, p_vote, p_lat, p_lng)` | `roads.answer` ("Still there?", map card) | `still_there` / `gone`; returns `{ status, confirm_count, clear_count, expires_at }` |
| `road_reports_near(p_lat, p_lng, p_radius_mi, p_context)` | `useRoadReports()` | `map` (default, never police) or `driving` |
| `road_closures_near(p_lat, p_lng, p_radius_mi)` | `useRoadReports()` | Open-data closures in force, credited in the app |
| `road_rep_for(p_user_ids uuid[])` | rep ledger ("Road reports confirmed" / "checked") | Counts only |

## 5. The app on the backend (built 17 Nov 2026)

The screens use one `Store` (`src/lib/store.tsx`); its actions are async and
reject with a sentence the screen shows as it is. Who's using the app decides
which repository the actions go to (`src/lib/auth.tsx`):

* **Signed out:** the Sign in screen (`src/app/signin.tsx`), with "Try the demo
  without an account". Phones that used the app before accounts existed go
  straight to the demo, with their data.
* **Demo:** `LocalRepository` (`src/lib/localRepository.ts`), the code the app has
  always run, on the sample scene in AsyncStorage (`nightshift.v2.*`).
* **Signed in:** `SupabaseRepository` (`src/lib/backend/remote.ts`). The state has
  the same shape (`src/lib/localState.ts`), filled from the server by the mappers in
  `src/lib/backend/mapping.ts` (unit-tested in `__tests__/backendMapping.test.ts`
  and `__tests__/supabaseRepository.test.ts`, which mocks supabase-js).

**Reads** (one `refresh()` on launch, when the app comes to the front, and every
20 s while offline): `profiles` (onboarded people), `my_home`, `profile_settings`,
`crews` + `crew_members`, `builds` + `build_mods` + `build_photos` (signed URLs,
7 days), `events_list` (from 8 days ago) with `event_hosts`, `event_going`,
`event_requests`, `check_ins`, `plan_changes` (hosts only, by RLS), `chat_messages`
and **`get_event_stops()`** (stops are never read from `event_stops`; a locked
stop arrives with no place, so the phone's own `canSeeStop()` can't show it), your
own `votes` + the `awards` view (each award becomes that many anonymous tallies, so
`awards.ts` gives the same winners), `notices`, and `spots_list` + `spot_stats()` +
your own completions and ratings (others' are anonymous stand-ins with the right
counts and average). Rows with a `bundled_id` the app knows become progress on that
bundled place (`state.bundledServer`), not places of their own; `place_rep_for()` gives
everyone's drives and photo spots for the rep ledger (`state.placeRep`). Other people's `User.home` is a placeholder (0, 0): homes
never leave the server, so the host form's count comes from `invite_count()`.

**Actions** map like this:

| `Store` action (store.tsx) | Supabase |
|---|---|
| `saveProfile` | `rpc('save_profile')`, then `rpc('save_travel_prefs')` |
| `setTravelPrefs` | `rpc('save_travel_prefs')` (read back from `profile_settings`) |
| Find events (`searchEvents()`) | `rpc('search_events')` with the screen's filters ("Any distance" sends 600; "Where I am" sends the GPS fix, which the server snaps to ~1 km) |
| New events near you | none on the phone: the trigger writes `nearby` notices, read with the rest of `notices`. "I'll search" NEW tags: events in `search_events()` created since the last visit (keep the time on the phone) |
| `saveBuild` / `deleteBuild` | `builds` upsert/delete (`vehicleId`, `tuneStage`, `engineSwap` → `vehicle_id`, `tune_stage`, `engine_swap`), `build_mods` replace, photos: upload to `photos/{uid}/builds/{buildId}/{uuid}.jpg` then `build_photos` insert; delete dropped files with `storage.remove` |
| `saveEvent` / `editEvent` | `rpc('save_event')` (stops + co-hosts in one call) |
| `changePlan` | `rpc('change_plan')` |
| `cancelEvent` | `rpc('cancel_event')` |
| `setGoing` | `rpc('set_going', { p_event_id, p_going, p_build_id })` |
| `answerRequest` | `rpc('answer_request')` |
| `checkIn` | `rpc('check_in')` with the current GPS fix (and `p_build_id` if they turned up in something else) |
| `moveOn` | `rpc('move_on')` (the returned audience drives the host's "everyone has been told" notice) |
| `sendChat` | `chat_messages` insert `{ event_id, body }` |
| `vote` | `rpc('cast_vote')` |
| `finishDrive` | `rpc('complete_drive')` with the fixes `advanceRun()` collected (keep each checkpoint's fix and time in memory, not just a count); a bundled drive sends its server row's id |
| `visitSpot` | upload to `photos/{uid}/spots/{spotId}/{uuid}.jpg`, then `rpc('visit_spot')` (bundled photo spots too, by their server row) |
| `rateSpot` | `rpc('rate_spot')` (bundled places too, by their server row) |
| `suggestSpot` | `rpc('suggest_spot')` |
| `joinCrew` / `leaveCrew` / `createCrew` / `setCrewHost` | `rpc('join_crew' / 'leave_crew' / 'create_crew' / 'set_crew_role')` |
| `addToCrew` (demo only) | none: becomes an invite the other person accepts (not built yet) |
| `markNoticesRead` | `rpc('mark_notices_read')` |
| Send feedback | optional screenshot: upload to the `feedback` bucket at `{uid}/{uuid}.jpg` (signed in only), then `from('feedback').insert({ kind, message, screen, app_version, update_id, device, photo_path })` **without `.select()`** (senders can't read rows back, so `return=representation` fails) |
| Road reports | Not in the Repository: `src/lib/roadStore.tsx` (`RoadsProvider`, `useRoadReports()`) picks `backend/roads.ts` signed in or `roadService.ts` (demo, AsyncStorage `nightshift.roads.demo`) |
| `setSettings`, `markUnlockSeen`, `markLocationNoticeSeen`, `markNearbySeen` | stay on the phone (AsyncStorage) |
| `resetDemo`, `restartDemoEvents` | local mode only |
| `refreshReminders` | stays local until Phase 2 push |
| Delete my account (Me > Account) | remove every object under `photos/{uid}/` with the Storage API (SQL can't delete Storage rows), then `rpc('delete_my_account')`, then sign out and clear the cache |
| Host form's live count | `rpc('invite_count')` ("fewer than 3" for null) |

As built, a few rows differ from the plan above:

* **Ids.** Ids made on the phone are now UUIDs (`src/lib/ids.ts`), so a build keeps
  its id when upserted. `save_event` is told create or edit explicitly.
* **Places.** The bundled places stay in the app (it draws them from
  `src/data/places.ts`), and since 17 Nov 2026 the bundled **drives and photo spots**
  also have server rows keyed by their stable id (`spots.bundled_id`, section 7a-4).
  Signed in, finishing, visiting and rating one goes to `complete_drive` /
  `visit_spot` / `rate_spot` with that row's id, so "Driven by", the stars and rep are
  the same on every phone. Rep for drives and photo spots comes from `place_rep_for()`
  (`repLedger`'s `placeRep`), for you and for everyone else. What a phone recorded on
  a bundled place before this (old `placeProgress` for the account) is no longer
  counted anywhere; the place shows it as "Only on this phone" (`Spot.phoneOnly`).
  A bundled place without a server row can't be finished signed in ("This place isn't
  on the server yet…"). Tracks and meet spots have nothing to count, so they stay in
  the app only (the 8 seeded circuits carry their bundled ids so they show once).
  `finishDrive` sends the fixes `advanceRun()` keeps (`DriveRun.fixes`); the phone
  judges first for a quick answer, the server again (with the road's own limit,
  `spots.limit_mph`, where the app has one).
* **Suggested photo spot photos.** `spots` has no photo column, so the suggester's
  photo goes to a fixed path, `photos/{author}/spots/{spot}/suggested.jpg`, which
  the app signs when it reads the place.
* **Crews.** `addToCrew` (demo only) says an invite is needed; it isn't built.
* **GPS.** "Demo: skip the GPS check" only exists in the demo. Signed in, check-ins
  and photo spot visits always send a real fix.
* **Feedback.** The pickers' and shop screens' queued suggestions are sent to
  `feedback` (insert only, no `.select()`) with `app_version`
  (`EXPO_PUBLIC_APP_VERSION`), `update_id` (expo-updates) and `device`: signed in
  through the repository, in the demo as `anon` (the table allows it).

**Realtime.** The open event screen subscribes (one channel) to its `events` row,
`chat_messages`, `event_going`, `event_requests` and `check_ins`; a change re-reads
that event through `get_event_stops()`, so a move-on reveals the next stop only to
the people allowed it. The app also listens to your own `notices` inserts: a
"moved on" notice lands under the bell, shows as a phone notification while the app
is open, and refreshes that event. Realtime checks RLS per subscriber; `event_stops`
is not published. Real push to a locked phone is Phase 2.

**Offline.** The state is cached per account in AsyncStorage
(`nightshift.sb.<uid>.state`), shown at once on launch and refreshed in the
background; it's cleared on sign-out. A request that never reaches the server marks
the app offline (an **OFFLINE** pill at the top). Chat, build saves and deletes and
"mark read" go to an outbox (`nightshift.sb.<uid>.outbox`, `src/lib/backend/outbox.ts`)
and are sent in order when the connection's back; anything the server then refuses
is dropped with a notice. Rule-checked actions fail with "You're offline. Try again
when you have a signal." instead.

Derived things that stay pure on the phone: classes (`classes.ts`, also
mirrored in `private.build_class()`), rep and levels (`rep.ts`, fed from
`spot_stats`, `awards` and check-in counts), HUD and formatting.

Sign-in (`src/lib/auth.tsx`): `signInWithOtp({ email, options: { shouldCreateUser: true,
emailRedirectTo: 'nightshift://' } })`, then `verifyOtp({ email, token, type: 'email' })`
for the 6-digit code. Until SMTP is set up the built-in sender mails a **link**
instead; the app takes it three ways (`src/lib/authLink.ts`): the redirect
`nightshift://#access_token=…&refresh_token=…` (tapped on the phone; `setSession`),
`?code=` (PKCE), or the email's own `…/auth/v1/verify?token=…&type=magiclink` link
pasted in (`verifyOtp({ token_hash, type })`). The session lives in AsyncStorage
(`nightshift.auth`) with `autoRefreshToken`, paused in the background.

**Keys.** Only the URL and the **publishable** key are in the app, in
`src/lib/backend/config.ts` (overridable with `EXPO_PUBLIC_SUPABASE_URL` /
`EXPO_PUBLIC_SUPABASE_KEY`). Supabase's docs: publishable keys are "safe to expose
online: web page, mobile or desktop app, GitHub actions, CLIs, source code"; RLS
does the work. They are **not** in `app.json` `extra`: app.json is part of the
runtime fingerprint, and changing it would have stopped OTA updates reaching the
installed build (checked: `f9269ad…` → `a9f1a31…`). Adding `@supabase/supabase-js`
(pure JS) left the fingerprint unchanged. The secret key never goes in the app.

### Offline cache plan

* **Read-through cache:** keep the last good result of each list (events with
  stops as returned, spots, crews, my builds, notices) in AsyncStorage, keyed
  by user id. Show it at once on launch and refresh in the background, the same
  way the app opens instantly today.
* **Only cache what the server returned.** A stop that came back locked stays
  locked offline. The cache never "unlocks" anything by itself, and it's cleared
  on sign-out.
* **Writes need a connection.** Rule-checked actions (check in, move on, vote,
  finish a drive, change the plan) fail with "You're offline" rather than
  queueing: they depend on time and place, and replaying them later would be
  wrong. Simple edits (builds, chat) can use a small outbox that retries in
  order and drops anything the server rejects.
* **Drives:** the run is judged by the server at the end, so the phone keeps
  the checkpoint fixes in memory while driving and sends them when it has a
  signal. The server allows up to an hour after the last checkpoint.
* **Realtime (later):** subscribe to `chat_messages` and `notices` for the open
  event only, to stay well inside the free quotas.

## 6. Free plan limits to plan around

* **Pausing:** free projects pause after **7 days with no activity**. A paused
  project rejects all requests until someone presses Restore in the dashboard,
  which takes a few minutes, and it can't be restored after 90 days. While
  testing with a few people, open the app (or run any query) at least weekly, or
  add a weekly health-check ping. Check the current wording on the pricing page.
* **Sign-in email:** the built-in email sender only delivers to **addresses in
  the project's team**, at about **2 emails an hour**. Supabase says it isn't
  for production. That's fine for the owner testing. For mates, add custom
  SMTP (e.g. Resend, Postmark or SES free tiers) under Auth → SMTP before
  inviting anyone. Also: one code per minute per address (`max_frequency = 60s`),
  and codes last 10 minutes.
* **Email template:** the hosted project's "Magic link" and "Confirm signup"
  templates must show `{{ .Token }}` (copy `supabase/templates/otp.html`), or
  people get a link instead of a code. **Free projects can't change templates
  while they use the built-in sender** (the API answers `entitlement_required`),
  so custom SMTP has to go on first. Until then the hosted emails carry the
  default sign-in *link*, which the app can't use.
* **Quotas:** 2 free projects; 500 MB database; 1 GB file storage; 5 GB egress;
  50,000 monthly active users; 500,000 Edge Function calls a month. Photos are
  the first thing to hit a limit: keep uploads at about 1600 px JPEG (~300 KB),
  so roughly 3,000 photos fit.
* **No backups you can restore yourself** on the free plan (no point-in-time
  recovery). Take `npx supabase db dump` snapshots before big migrations.
* **Push:** real pushes need the paid Apple developer account (APNs key in
  Expo). Until then `push-notices` isn't deployed and the phone keeps its local
  reminders.

## 7. Applying it

Done on 17 Nov 2026 with the pinned CLI, `npx supabase@3.2.0`. In CLI 3.x,
commands target the **local** database unless you pass `--remote`, and changes
to the hosted project need `--yes` (or `SUPABASE_YES=1` exported in the shell).
`link` and `db push` work with just `SUPABASE_ACCESS_TOKEN`: the CLI makes a
short-lived login role through the Management API.

```bash
cd ~/nightshift
# Secrets come from the file and are never echoed, logged or committed.
set -a; . ~/.config/homelab-secrets.env; set +a   # SUPABASE_ACCESS_TOKEN, SUPABASE_DB_PASSWORD, ...

npx supabase@3.2.0 link --project-ref vuftzeianmqjboivqmws
npx supabase@3.2.0 db push --remote --dry-run                 # lists the new migrations
npx supabase@3.2.0 db push --remote --yes                     # add --include-seed only the first time
```

**New migrations** go in as new files with a later timestamp; never edit one
that has been applied (`supabase_migrations.schema_migrations` lists them).

**Tests against the hosted database.** `supabase test db --remote` does **not**
work with the token alone in CLI 3.2.0: its temporary login role is a
`NOINHERIT` member of `postgres`, so pg_prove can't see the `extensions` schema
and every file fails with `function plan(integer) does not exist`. Run
pg_prove yourself as `postgres` through the session pooler instead (the tests
roll back; nothing is kept). The DB password was reset through the Management
API on 17 Nov 2026 and lives only in the secrets file as `SUPABASE_DB_PASSWORD`.

```bash
export PGPASSWORD="$SUPABASE_DB_PASSWORD" PGHOST=aws-1-eu-west-1.pooler.supabase.com PGPORT=5432 \
       PGUSER=postgres.vuftzeianmqjboivqmws PGDATABASE=postgres PGSSLMODE=require
podman run --rm -e PGPASSWORD -e PGHOST -e PGPORT -e PGUSER -e PGDATABASE -e PGSSLMODE \
  -v "$PWD/supabase/tests:/tests:ro,Z" public.ecr.aws/supabase/pg_prove:3.36 pg_prove --ext .sql /tests
```

**Auth settings** were set with the Management API
(`PATCH https://api.supabase.com/v1/projects/vuftzeianmqjboivqmws/config/auth`),
changing only the fields below. `config push` was **not** used: it would also
push every other difference in `config.toml` (MFA, storage, API settings).

### 7a. What's live (17 Nov 2026)

* **Database:** all 10 migrations (`20261117120000` … `20261117130000`) and
  `seed.sql` (2 ban zones, 8 circuits). PostGIS 3.3.7 in `extensions`.
* **Storage:** private `photos` (10 MB) and `feedback` (5 MB) buckets with their policies.
* **Tests on the hosted database:** 260 of 260 pgTAP checks pass
  (rls 47, rpc 63, discovery 75, feedback 33, vehicles 42; last run 17 Nov 2026
  after `20261117130000_event_vehicles.sql` was pushed). Afterwards no test rows, no
  test users and no `pgtap` extension were left behind.
* **API checks with the publishable key (signed out):** reading `events`,
  `profiles`, `profile_homes`, `event_stops`, `spots` or `feedback` is refused
  (`42501`); `search_events`, `save_profile` and `queue_due_reminders` are
  refused; a feedback insert works (`201`, stored with no user and status
  `new`), but not in someone else's name, not with a status, and not with an
  unknown kind; updating or deleting feedback is refused; uploads to `photos`
  or `feedback` are refused, and listing `feedback` returns nothing.
* **Security Advisor:** no RLS or security definer view findings. It warns
  that signed-in users can run the `security definer` RPCs; that is the design
  (the RPCs are the API and check every rule). It also lists Supabase's own
  `public.rls_auto_enable()` event-trigger helper. The Performance Advisor has
  a few "multiple permissive policies" warnings (the staff read policies) and
  "unindexed foreign key" notes; fine for a test group.
* **Auth:** email sign-in on, sign-ups on, **6-digit codes, 10-minute expiry**
  (`mailer_otp_length` 6, `mailer_otp_exp` 600), one email a minute per address,
  site URL `nightshift://`, redirect URLs `nightshift://` and `nightshift://**`.
  Sign-in and verify limits stay at 30 per 5 minutes per IP. MFA (TOTP) was
  already on in the hosted project and was left alone (`config.toml` has it off).
  `exp://**` is only in the local config.

### 7a-2. What's live (17 Nov 2026, app wiring)

* **Migration** `20261117150000_app_wiring.sql` pushed with `db push --remote --yes`.
* **pgTAP:** 280 of 280 on the hosted database (the 260 above plus `account_test.sql`, 20).
* **Realtime publication** `supabase_realtime`: `events`, `chat_messages`,
  `event_going`, `event_requests`, `check_ins`, `notices`.
* **Smoke test** (section 7c): 41 of 41, cleanup left no users, events, places,
  feedback or files.
* **Web build check** (Playwright, 17 Nov 2026): sign-in screen, demo path, and a
  signed-in run with a throwaway user (profile saved on the server, Find events from
  `search_events()`, Me > Account, Delete my account back to Sign in, user gone).

### 7a-3. What's live (17 Nov 2026, road reports)

* **Migration** `20261117170000_road_reports.sql` pushed with `db push --remote --yes`
  (a `pg_dump` of `public` was taken first, kept off the repo).
* **pgTAP:** 346 of 346 on the hosted database (the 280 above plus `road_reports_test.sql`,
  66), and the same 346 in the local Podman harness first.
* **Realtime publication** now also has `road_reports`.
* **Smoke test:** 61 of 61, three throwaway users, cleanup left nothing (users, events,
  places, feedback, files, road reports, answers or rep).
* **Not deployed:** the `import-closures` function and its schedule (section 7d), so
  `road_closures` is empty and the app shows drivers' reports only.

### 7a-4. What's live (17 Nov 2026, Nightshift's own places on the server)

* **Migration** `20261117190000_bundled_places.sql` pushed with `db push --remote --yes`
  (a `pg_dump` of `public` was taken first, kept off the repo).
* **Seed** `seed_bundled_places.sql` applied through the Management API
  (`node --import ./scripts/lib/resolve-ts.mjs scripts/seed-bundled-places.mjs --apply`):
  **129 drives and 111 photo spots**, plus the 8 seeded circuits given their bundled ids
  (248 rows with a `bundled_id`, none with an author). Every photo spot is seeded, the
  unvetted ones too: the app still keeps those off the map by id (`photoVetting.ts`).
  Run the script again after changing a bundled drive or photo spot; a place taken out
  of the app keeps its row (and history), and an app that doesn't know a bundled id
  shows that row as an ordinary place.
* **pgTAP:** 376 of 376 on the hosted database (the 346 above plus
  `bundled_places_test.sql`, 30), checked first in a rolled-back transaction on the
  hosted database with the migration and seed applied inside it.
* **Smoke test:** 65 of 65 (the 61 above plus a bundled drive finished and rated by A,
  B reading the same stats and `place_rep_for`, and the cleanup counting place progress).
  One earlier run that day stopped at 62 of 65; three runs after it passed 65 of 65.
* Afterwards: no test users, completions, ratings, fixtures or `pgtap` extension left.

### 7a-5. What's live (17 Nov 2026, Community)

* **Migration** `20261117220000_community.sql` pushed with `db push --remote --yes` (a
  `pg_dump` of `public` taken first, kept off the repo). Checked first in a rolled-back
  transaction on the hosted database with the migration applied inside it.
* **pgTAP:** 539 of 539 on the hosted database (the 376 before plus `community_test.sql`, 163).
  `rls_test.sql`'s first check now counts only its own test users: the hosted database has
  real people now.
* **Smoke test:** 93 of 93 (the 65 before plus Cars near you, a connection request heard on
  Realtime, a 1-to-1 chat only once accepted, a message heard on Realtime, unread and Seen,
  C locked out of the chat and its photo, the forum and Solved rep, feed posts (never near
  home, connections-only, the map box), likes and comments, a report, and a block). Cleanup
  checks no community rows or message photos are left.

### 7a-6. What's live (17 Nov 2026, feedback triage and email)

* **Migration** `20261117230000_feedback_triage.sql` pushed with `db push --remote --yes`
  (a `pg_dump` of `public` was taken first, kept off the repo). It installed `pg_net`
  (schema `extensions`).
* **Vault:** `functions_url` = `https://vuftzeianmqjboivqmws.supabase.co/functions/v1`
  (not a secret; the feedback trigger and later cron jobs read it).
* **Edge Function secrets set** (Management API, values never printed):
  `BREVO_SMTP_HOST`, `BREVO_SMTP_PORT`, `BREVO_SMTP_USER`, `BREVO_SMTP_KEY`.
* **pgTAP:** 576 of 576 on the hosted database (the 539 above plus
  `feedback_triage_test.sql`, 37). Checked first in rolled-back transactions with
  the migration applied inside them.
* **Smoke test:** 103 of 103 (the 93 above plus 10 feedback checks: own id, retry
  refused, the sender reads their own but not the notes and can't change the status,
  signed-out sending, `feedback_status()` showing "Fixed in" by id, `handled_at`).
* **End to end:** an anonymous report through the REST API, a screenshot, the inbox
  listing it and downloading the screenshot to `~/nightshift-feedback/<id>/`,
  `--mark … fixed --version …` seen by the anonymous `feedback_status()`, the trigger's
  `pg_net` call reaching the functions gateway, then `--delete`; nothing left.
* **Not live yet:** the `feedback-notify` function itself (the CLI asks the owner to
  confirm a deploy) and the email settings: section 7e.

### 7e. Feedback email: TODO for the owner

The `feedback-notify` function is written and type-checked (Deno 2.9) but **not
deployed**, and it needs two settings the owner chooses. Until then each new report
still lands in the table (the trigger's call gets a 404 and nothing else happens),
and the inbox script works.

**Brevo refused the SMTP login** (17 Nov 2026: `535 5.7.8 Authentication failed` on
ports 465 and 587, for the `BREVO_SMTP_USER` / `BREVO_SMTP_KEY` in the secrets file).
Check the Brevo account is activated for transactional email, then in Brevo › SMTP &
API › SMTP make a new SMTP key and put it in the secrets file as `BREVO_SMTP_KEY`
(this also blocks custom SMTP for sign-in codes, section 7b item 1).

Then, once (add the two lines to `~/.config/homelab-secrets.env` first:
`FEEDBACK_NOTIFY_EMAIL=you@example.com` and `BREVO_SENDER_EMAIL=` the sender
verified in Brevo):

```bash
cd ~/nightshift && set -a && . ~/.config/homelab-secrets.env && set +a
# 1. The function's secrets (values go through stdin, never on screen):
jq -n --arg to "$FEEDBACK_NOTIFY_EMAIL" --arg from "$BREVO_SENDER_EMAIL" --arg k "$BREVO_SMTP_KEY" '[{name:"FEEDBACK_NOTIFY_EMAIL",value:$to},{name:"BREVO_SENDER_EMAIL",value:$from},{name:"BREVO_SMTP_KEY",value:$k}]' | curl -sS -o /dev/null -w '%{http_code}\n' -X POST -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" -H "Content-Type: application/json" https://api.supabase.com/v1/projects/vuftzeianmqjboivqmws/secrets --data @-
# 2. Deploy it (verify_jwt = false comes from config.toml):
npx supabase@3.2.0 functions deploy feedback-notify --use-api --project-ref vuftzeianmqjboivqmws
# 3. Try it: send feedback from the app (or Settings › Send feedback in the web build), then
node scripts/feedback-inbox.mjs            # copy its id, and if no email arrived within a minute:
node scripts/feedback-inbox.mjs --notify <id>
```

Expect `201` from step 1. The function logs (dashboard › Edge Functions ›
feedback-notify › Logs) say `not configured (missing …)` when a setting is missing,
`emailed <id>` when it worked, and `SMTP AUTH password refused: 535 …` when the Brevo
key is wrong. Edge Functions can't use ports 25 or 587, so it always connects to
Brevo on 465 (implicit TLS), whatever `BREVO_SMTP_PORT` says. More than one
recipient: comma-separate `FEEDBACK_NOTIFY_EMAIL`.

### 7a-7. What's live (18 Nov 2026, moderation for all content)

* **Migrations** `20261117233000_report_targets.sql` and `20261117233100_moderation.sql`
  pushed with `db push --remote --yes` (a `pg_dump` of `public` taken first, kept off the repo).
* **pgTAP:** 612 of 612 on the hosted database (the 576 above plus `moderation_test.sql`, 36).
* **Smoke test:** 106 of 106 (adds: a block hides the blocker's view of event chat, an event
  reported, a suspension stops a new thread and `my_moderation_status()` says so).

### 7c. The smoke test

```bash
set -a; . ~/.config/homelab-secrets.env; set +a
node scripts/supabase-smoke.mjs
```

There's no service role key on the dev machine, so the script makes two throwaway
users with SQL through the Management API (`POST /v1/projects/<ref>/database/query`
with `SUPABASE_ACCESS_TOKEN`): a row in `auth.users` (bcrypt password via
`extensions.crypt`, confirmed, the token columns as empty strings, which GoTrue
needs) and one in `auth.identities`, on the reserved `.invalid` domain so nothing is
ever emailed. It signs in with that password and the publishable key, so everything
after that goes through the same API, RLS and RPCs as the app: profile and travel
settings, `my_home`, a build with a mod and a photo (and B can't upload into A's
folder, but can read it signed), a rolling meet with 3 stops, no stop rows before
going, every stop locked before the reveal, only stop 1 once live (the start is moved
into the past with SQL: a fixture, the app never does this), check-in refused from
3 mi away and at a locked stop, then accepted, Realtime (the event row, chat and the
"moved on" notice reach B, and the notice never names the place), `move_on` returning
the audience, stop 2 unlocking for B only, votes (not your own, secret), `event_awards`
empty before voting closes, `search_events`, crews, a pending suggestion only its
author sees, notices marked read, feedback inserted without a read-back. Cleanup:
Storage first, `delete_my_account()` for both, then a SQL sweep and a count that must
be all zeros. It never prints a key, token or password.

Road reports (a third user, C): B listens on Realtime; A reports a crash (and is refused a
second within 2 minutes), C is refused from 3 mi away and reports a police check; B hears
the crash on Realtime **without `created_by`** and never hears the police report; B's
`road_reports_near` has the crash but no police for `map`, and the police check for
`driving`; B can read the crash row but not the police row, and can't read `created_by`;
A can't confirm their own report, B can't from 3 mi away, B confirms once (a second answer
is refused), the reporter has no rep after one confirmation and +10 after C's, B and C +2
each; `road_closures_near` answers; signed out is refused.

Feedback: B sends a report with its own id and context (a retry with the same id is
refused), reads it back but not `triage_notes`, and can't change its status; a signed-out
client sends one (kind `other`) and can't read the table; after the team marks it fixed
(SQL, as the inbox script does), the signed-out client's `feedback_status()` shows
`done` and the version, with no message or notes. Both are marked `context.test`, so
they're never emailed.

Bundled places: B reads Nightshift's own drives and photo spots by `bundled_id`; A
finishes the Snake Pass (`dr-snake-pass`) with fixes on the seeded line and rates it; B
sees one more person and a rating in `spot_stats` (never who), and A's drive rep
(medium, 100) in `place_rep_for`. The cleanup also checks no completions or ratings are
left for the test users.

### 7b. Still to do

1. **Custom SMTP (Brevo). TODO for the owner:** add `BREVO_SENDER_EMAIL`
   (the sender address verified in the Brevo account) to the secrets file. The
   Brevo host, port, login and key are already there. Then set SMTP and, now
   allowed, the code template, and raise the email limit for the test group:

   ```bash
   jq -n --rawfile t supabase/templates/otp.html \
     --arg host "$BREVO_SMTP_HOST" --arg port "$BREVO_SMTP_PORT" --arg user "$BREVO_SMTP_USER" \
     --arg pass "$BREVO_SMTP_KEY" --arg from "$BREVO_SENDER_EMAIL" '{
       smtp_host: $host, smtp_port: $port, smtp_user: $user, smtp_pass: $pass,
       smtp_admin_email: $from, smtp_sender_name: "Nightshift", smtp_max_frequency: 60,
       rate_limit_email_sent: 30,
       mailer_subjects_magic_link: "Your Nightshift code", mailer_templates_magic_link_content: $t,
       mailer_subjects_confirmation: "Your Nightshift code", mailer_templates_confirmation_content: $t }' \
   | curl -sS -o /dev/null -w '%{http_code}\n' -X PATCH \
       -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" -H "Content-Type: application/json" \
       https://api.supabase.com/v1/projects/vuftzeianmqjboivqmws/config/auth --data @-
   ```

   Then request a code for the sender address itself
   (`POST $SUPABASE_URL/auth/v1/otp` with `{"email": …, "create_user": true}`)
   and check it arrives as a 6-digit code. Until this is done the built-in
   sender only mails the project's team (about 2 an hour) and sends a link,
   not a code.
2. **Signed-in check on a real iPhone:** done with real sessions by the smoke test
   and the web build; on the phone it needs the owner to sign in with the email link
   (README "Try this tomorrow", step 2). Mates need item 1 first.
3. **Open-data closures:** deploy and schedule `import-closures`, and register for a
   National Highways key (section 7d).
4. **`SUPABASE_ACCESS_TOKEN` expires** about 30 days after 17 Nov 2026. Make a
   new one (scoped to this project) before the next migration.
5. Phase 2 (below) and the gaps in section 9.

**Phase 2 (functions and schedules), later:**

```bash
npx supabase@3.2.0 secrets set CRON_SECRET="$(openssl rand -hex 32)"   # also store it in Vault, below
npx supabase@3.2.0 functions deploy push-notices
npx supabase@3.2.0 functions deploy import-closures
```

Then in the SQL editor, turn on `pg_cron` and `pg_net`, store the URL and the
secret in Vault, and schedule:

```sql
select cron.schedule('push-notices', '*/5 * * * *', $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'functions_url') || '/push-notices',
    headers := jsonb_build_object('x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')),
    body := '{}'::jsonb)
$$);
-- import-closures: the same, every 15 minutes (section 7d). TfL needs no key.
```

### 7d. Open-data closures: deploy and schedule (TODO for the owner)

`supabase/functions/import-closures` is written, type-checked with Deno and its parsers are
tested in Jest against a real TfL answer and National Highways' own examples. It is **not
deployed**: setting the project's `CRON_SECRET` was held back for the owner (it's a new
project secret). To turn it on:

```bash
set -a; . ~/.config/homelab-secrets.env; set +a
# 1. A shared secret for the scheduler: generate it, keep it only in the secrets file.
#    (Add NIGHTSHIFT_CRON_SECRET=<openssl rand -hex 32> to ~/.config/homelab-secrets.env.)
npx supabase@3.2.0 secrets set "CRON_SECRET=$NIGHTSHIFT_CRON_SECRET" --project-ref vuftzeianmqjboivqmws
npx supabase@3.2.0 functions deploy import-closures --use-api --project-ref vuftzeianmqjboivqmws
# 2. Try it once (expect {"imported":{"tfl":~120},...}):
curl -sS -X POST -H "x-cron-secret: $NIGHTSHIFT_CRON_SECRET" \
  https://vuftzeianmqjboivqmws.supabase.co/functions/v1/import-closures
```

Then in the SQL editor: enable `pg_cron` and `pg_net`, put `functions_url`
(`https://vuftzeianmqjboivqmws.supabase.co/functions/v1`) and `cron_secret` in Vault
(`select vault.create_secret('<value>', 'cron_secret');`), and schedule it every 15 minutes
with the `cron.schedule(...)` pattern in section 7 (`'*/15 * * * *'`, path
`/import-closures`). About 2,900 calls a month, well inside the free quota. Turn it off with
`select cron.unschedule('import-closures');`.

* **TfL: on, no key.** `GET /Road/all/Street/Disruption?startDate&endDate` (50 requests a
  minute without a key; checked 17 Nov 2026: 126 closed street segments in London, each with
  a line). `TFL_APP_KEY`, if set, raises the limit; not needed.
* **National Highways: wired, off until a key exists. TODO for the owner:** register on the
  [Developer Portal](https://developer.data.nationalhighways.co.uk/) (self-service, free,
  Open Government Licence v3.0 per the portal's API listing), subscribe to **Road and Lane
  Closures Data Service v2**, then `npx supabase@3.2.0 secrets set NATIONAL_HIGHWAYS_KEY=…`.
  The code calls `GET https://api.data.nationalhighways.co.uk/roads/v2.0/closures` with
  `closureType=planned` and `unplanned`, `Ocp-Apim-Subscription-Key` and
  `X-Response-MediaType: application/json`, follows `x-next` (at most 4 pages a type: the key
  allows 10 calls a minute) and maps `roadClosed` / `carriagewayClosures` (or no open lanes)
  to full closures, other lane closures to roadworks. Without a key the endpoint answers 401
  "Invalid Subscription Key" (checked); the parser was built from the portal's published
  examples, so check it against the first real response.
* **Street Manager** (England's local roads) pushes through AWS SNS and needs its own
  endpoint: not built.
* Each run upserts by `(source, source_id)`, deletes that source's rows it didn't see again
  (lifted early), and deletes closures that ended over a day ago. The app shows full closures
  as **Closure** and lane closures as **Roadworks**, credited per source, and reroutes round
  full closures only.

**Local test harness used while writing this.** The SQL was checked in a
throwaway `postgis/postgis:17-3.5` Podman container. A small stub stood in for
Supabase's `auth` and `storage` schemas and its roles, and pgTAP 1.3.3 was
loaded as plain SQL. All 10 migrations and the seed applied cleanly, and the 260
pgTAP checks passed (47 + 63 + 75 + 33 + 42). The new-event trigger is deferred, and the
tests never commit, so `discovery_test.sql` uses `set constraints
public.events_queue_nearby immediate` to stand in for the commit. The same 260 checks also pass on the hosted
database (section 7a), which is the check that counts. The Edge Functions type-check with Deno 2.9.

## 8. Owner decisions (17 Nov 2026)

1. **Event discovery: decided.** Every signed-in user, and admins, can see that
   an event exists: title, type, time, rough area and the invite filter summary
   (the `events` row, readable by `authenticated`). Exact stops stay hidden by the
   reveal rules in section 3; finding an event never reveals a stop.
   `search_events()` lists them nearest first, and shared links and "Request to
   go" work for anyone.
2. **Admins** (`staff`) read everything for moderation, except homes, travel
   settings and push tokens, and never get host powers (section 3, "Staff").
3. **Willing to travel** (5/10/25/50/100 mi or custom, 1–300) is stored per
   person in `profile_settings`, readable only by its owner.
4. **New-event alerts:** "Notify me" (a `nearby` notice, pushed in Phase 2),
   "I'll search" (no notice; they browse) or "Off". Worked out on the server
   with PostGIS against `profile_homes` (section 3, "New events near you").
5. **Search:** `search_events()` mirrors the app's Find events screen.

## 9. Limits and known gaps

* **Don't carry sample-derived rep across.** The demo's rep includes sample data:
  trophies from seeded votes, the sample Golf R's mods, sample events. When a
  person's local data moves to the server, only their own builds, mods, places
  and track times go; rep is recomputed on the server from real rows, never
  copied from the phone's ledger. Mod rep follows the app's rule (road-legal mods
  only, each kind once per build, at most 10 per build: `src/lib/legality.ts`).
* **Local save shape.** The phone saves in slices (`nightshift.v2.*`, schema 3):
  bundled places are never copied in, only progress per place id
  (`placeProgress`), so the move only uploads what people did. Shop references
  use stable ids (`<tile>:<osm type><osm id>`).

* **GPS is client-reported.** Check-ins, photo spot visits and drive fixes
  are positions the phone sends, so a modified client could fake them. The
  server enforces the rules (distance, order, timing, who, when) but can't
  prove the phone was there. Mitigations for later: Apple App Attest, plausibility
  logs (many check-ins far apart in minutes), and moderation.
* **Plate redaction happens on the phone** before upload. The server
  doesn't re-check images; a modified client could upload an unredacted photo.
  Reporting and takedown cover this until there is a server-side check.
* **The rough area is computed on the phone** (`area.ts`) and only *checked* on
  the server (holds every stop; private types ≥ 0.75 mi from each stop). A
  modified client could pick an area that hints at the place. Porting
  `roughArea()` to SQL would close this.
* **`events_for_me()` scans every recent event.** It's fine for a test group.
  At scale it should filter by distance from the caller's home first, and the
  helpers may need caching. `search_events()` already filters by distance first
  (gist index on `events.area`), then works out roles for what's left.
* **New-event notices fan out in the saving transaction.** The trigger checks
  every home within each person's travel distance (at most 300 mi) when an event
  is saved. Fine for a test group; at scale, move it to a queue the
  `push-notices` job drains. The `nearby` key stops repeats.
* **"I'll search" has no server state.** The NEW tags in Find events are kept on
  the phone (`nearby.unseen` in the local store); with the backend, compare
  `events.created_at` with the last time the phone opened Find events.
* **Staff have no app screens yet.** Their read access is there for the
  dashboard, SQL or a later moderation screen; the app doesn't check `staff`.
* **Spot approval** has no moderator UI: approve by setting `spots.status` in
  the dashboard (service role). The demo's 10-second auto-approve doesn't exist
  on the server.
* **Account deletion** (Apple 5.1.1(v)) is built: Me > Account > Delete my account
  removes the person's Storage files (Storage API), then `delete_my_account()`
  (security definer, owned by `postgres`) hands over their crew, cancels unfinished
  events only they host and deletes the auth user; everything else cascades. If the
  app is killed between the two steps, the files are gone and the account isn't:
  deleting again finishes it. Files can't be deleted from SQL, so a client that
  skipped step one would leave orphans under `photos/{uid}/` (a scheduled cleanup
  with the secret key would catch them; not written).
* **Reads at scale.** Signed in, `refresh()` reads every onboarded profile, every
  build and every event from the last 8 days (with their parts and chat). Fine for a
  test group; before a public launch, page these by distance (`events_for_me()`,
  `search_events()`) and load people and builds on demand.
* **Retention** (legal.md: check-ins 90 days, chat 90 days after the event,
  stop logs 12 months) isn't automated yet. Add a daily pg_cron job before launch.
* **Ban zones only warn**, as the owner decided. legal.md recommends hard
  blocks for cruises and rolling meets inside injunction areas at night; the
  data (`kind`, `source_url`, `valid_until`) is ready for that.
* **Reveal on the server is exact to the minute; the phone's clock isn't.**
  The app should use the server's answer (`visible`), not its own clock, to
  show a stop.
* The Edge Functions read `SUPABASE_SERVICE_ROLE_KEY` from the runtime. With
  the new `sb_secret_` keys, check that variable is still injected. If not, use
  the secret key variable the dashboard documents.
* The National Highways parser in `import-closures` follows the portal's published examples;
  check it against the first real response once a key exists (section 7d).
* **Road report positions are client-reported**, like check-ins: the server checks distance,
  rate and answers, but a modified client could report from anywhere. The police `driving`
  context is likewise the app's word; the 10-mile limit, the table's RLS and the 30-minute
  life are the server-side safeguards.

## 10. Open decisions for the owner

1. **Event discovery:** decided 17 Nov 2026 (section 8): everyone signed in sees
   that an event exists; stops stay hidden.
2. **Seeding:** done 17 Nov 2026. The database seed has places only (ban zones,
   circuits, and the bundled drives and photo spots in `seed_bundled_places.sql`,
   generated from `src/data/places.ts` by `scripts/seed-bundled-places.mjs` so the
   two lists stay in step; section 7a-4). Sample people and events stay in the app's
   demo mode, so real users never meet fake people.
3. **Check-in demo switch:** none on the server. Testing in a back garden
   means a fake event near you, or a host-only test flag (not added).

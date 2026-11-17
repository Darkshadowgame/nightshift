# Nightshift backend (Supabase)

Status: **live on the hosted project since 17 Nov 2026** (ref
`vuftzeianmqjboivqmws`, region **eu-west-1, Ireland**, free plan, Postgres 17).
All 10 migrations and the seed are applied and the 260 pgTAP checks pass
against the hosted database. The app still runs on the local store until it is
wired to Supabase. Sign-in emails need custom SMTP before testers can get a
code: see section 7a, "Still to do".

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
| `supabase/seed.sql` | Places only: the 2 sample ban zones and 8 UK circuits |
| `supabase/tests/rls_test.sql` | pgTAP: stop visibility, votes, home privacy (47 checks) |
| `supabase/tests/rpc_test.sql` | pgTAP: every RPC end to end, storage, reminders (63 checks) |
| `supabase/tests/discovery_test.sql` | pgTAP: travel settings, new-event notices, `search_events()`, discovery and staff (75 checks) |
| `supabase/tests/feedback_test.sql` | pgTAP: feedback sending, staff-only reading, the screenshot bucket, the flood guard (33 checks) |
| `supabase/tests/vehicles_test.sql` | pgTAP: what you're bringing: own builds only, going vs asking per build, changing it, check-in, awards from brought builds, the garage columns (42 checks) |
| `supabase/functions/push-notices/` | Phase 2 sketch: reminders and "moved on" pushes via Expo |
| `supabase/functions/import-closures/` | Phase 2 sketch: UK open-data road closures |
| `supabase/templates/otp.html` | Sign-in email that shows the 6-digit code |

## 1. Architecture

```
iPhone app (Expo SDK 58)
  └─ src/lib/store.tsx  →  (next) a Repository with two implementations:
        LocalRepository   (AsyncStorage, today's code, used for the demo scene)
        SupabaseRepository (supabase-js: tables for plain reads/writes, RPCs for rules)
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
| `partner_venues` | later: labelled partner venues (`partner_label` is required) | signed-in users (active only) | staff only |
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
| `road_closures` | imported closures (Phase 2) | signed-in users | import function |
| `feedback` | bug / idea / looks_wrong reports: message (1–4000), screen, app version, update id, device, optional screenshot path, `status` | **staff only** | anyone, signed in or not (insert only); staff set `status` or delete |

The invite filter is stored as columns (`invite_everyone`, `invite_cars`,
`invite_bikes`, `invite_classes`, `invite_min_mods`, `invite_brands`,
`invite_radius_miles`) rather than JSON, so the server can match on it.
`invite_radius_miles` must be 10–300 (the form offers 10/25/50/100).

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

`public.feedback` takes reports from the app's feedback sheet. Anyone can send
one, signed in or not (a sign-in problem is worth hearing about), and that is
all they can do:

* **Insert only.** `anon` and `authenticated` may fill in `kind`
  (`bug` / `idea` / `looks_wrong`), `message` (1–4000 characters, not blank),
  `screen`, `app_version`, `update_id`, `device`, `photo_path` and `user_id`.
  They can't set `id`, `created_at` or `status` (it starts as `new`).
* `user_id` defaults to `auth.uid()` and may only be the sender or null, so
  nobody can send feedback in someone else's name. Signed out it is null.
* Nobody reads, changes or deletes feedback except staff
  (`private.is_admin()`): they read it all, set `status`
  (`new` / `seen` / `planned` / `done` / `wont_do`) and delete. Staff can't
  rewrite a message.
* **Flood guard:** at most 20 an hour per signed-in person and 300 an hour in
  total (a trigger; the sender sees "You've sent a lot of feedback in the last
  hour…" or "Lots of feedback is coming in right now…").
* **Screenshots** go in a separate private `feedback` bucket (5 MB, images),
  not `photos`: every signed-in user can read `photos`, and a screenshot can
  show a stop or a name. Signed-in users upload to `feedback/{user_id}/...`;
  only staff read or delete there. `photo_path` must be in the sender's own
  folder. Signed-out people send text only.

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

## 5. Moving the app off the local store

`store.tsx` says "moving to Supabase later only replaces this file". The plan
is to keep the `Store` interface the screens use and put a **repository**
behind it:

```ts
interface Repository {
  // reads
  loadMe(): Promise<{ profile; home; crewId }>;
  listEvents(): Promise<EventView[]>;            // events_for_me + events + get_event_stops + hosts/going
  listSpots(bbox): Promise<Spot[]>;               // spots (RLS) + spot_stats
  listCrews(): Promise<Crew[]>;                   // crews + crew_members
  listBuilds(ownerIds?): Promise<Build[]>;        // builds + build_mods + build_photos
  chat(eventId): Promise<ChatMessage[]>;          // chat_messages (+ Realtime later)
  notices(): Promise<Notice[]>;
  // writes: one per Store action below
}
```

`LocalRepository` wraps today's code and keeps the labelled sample scene.
`SupabaseRepository` maps the actions like this:

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
| `finishDrive` | `rpc('complete_drive')` with the fixes `advanceRun()` collected (keep each checkpoint's fix and time in memory, not just a count) |
| `visitSpot` | upload to `photos/{uid}/spots/{spotId}/{uuid}.jpg`, then `rpc('visit_spot')` |
| `rateSpot` | `rpc('rate_spot')` |
| `suggestSpot` | `rpc('suggest_spot')` |
| `joinCrew` / `leaveCrew` / `createCrew` / `setCrewHost` | `rpc('join_crew' / 'leave_crew' / 'create_crew' / 'set_crew_role')` |
| `addToCrew` (demo only) | none: becomes an invite the other person accepts (not built yet) |
| `markNoticesRead` | `rpc('mark_notices_read')` |
| Send feedback | optional screenshot: upload to the `feedback` bucket at `{uid}/{uuid}.jpg` (signed in only), then `from('feedback').insert({ kind, message, screen, app_version, update_id, device, photo_path })` **without `.select()`** (senders can't read rows back, so `return=representation` fails) |
| `setSettings`, `markUnlockSeen`, `markLocationNoticeSeen`, `markNearbySeen` | stay on the phone (AsyncStorage) |
| `resetDemo`, `restartDemoEvents` | local mode only |
| `refreshReminders` | stays local until Phase 2 push |

Derived things that stay pure on the phone: classes (`classes.ts`, also
mirrored in `private.build_class()`), rep and levels (`rep.ts`, fed from
`spot_stats`, `awards` and check-in counts), HUD and formatting.

Sign-in: `supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } })`,
then `supabase.auth.verifyOtp({ email, token, type: 'email' })`. Store the
session with AsyncStorage (`auth.storage`) and turn on `autoRefreshToken`.
Use the publishable key only; it's safe in the app because RLS does the work.
The key lives in a secrets file outside the repo on the dev machine and goes
into the app through `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_KEY` in an
untracked `.env`. The service role or secret key never goes in the app.

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
2. **Signed-in API check from the app:** the pgTAP suite covers every signed-in
   path on the hosted database, but no real session has been used yet (that
   needs a code by email, item 1).
3. **`SUPABASE_ACCESS_TOKEN` expires** about 30 days after 17 Nov 2026. Make a
   new one (scoped to this project) before the next migration.
4. Phase 2 (below) and the gaps in section 9.

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
-- import-closures: the same, every 15 minutes, once TFL_APP_KEY / NATIONAL_HIGHWAYS_KEY are set.
```

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
* **Account deletion** (Apple 5.1.1(v)) needs an Edge Function using the
  admin API to delete the auth user. Profile rows cascade. Photos in Storage
  need deleting too. Not written yet.
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
* TfL and National Highways endpoints in `import-closures` are sketches: check
  them against each portal's docs before relying on them.

## 10. Open decisions for the owner

1. **Event discovery:** decided 17 Nov 2026 (section 8): everyone signed in sees
   that an event exists; stops stay hidden.
2. **Seeding:** the database seed has places only (ban zones and circuits).
   Sample people and events stay in the app's demo mode, so real users never
   meet fake people. The bundled drives and photo spots (`src/data/places.ts`)
   should be imported by a one-off script generated from that file, so the two
   lists stay in step.
3. **Check-in demo switch:** none on the server. Testing in a back garden
   means a fake event near you, or a host-only test flag (not added).

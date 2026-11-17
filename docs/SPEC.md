# Nightshift: Phase 1 spec

Working name. A live map of the UK modified car and bike scene that plays like an
open-world racing game.

Audience: the owner and their mates first (sideloaded test builds), then a public
App Store launch. UK only, iPhone first, late-night meet scene, cars **and** bikes,
with the focus on modified builds.

## Phase 1 scope

| In | Out (later phases) |
|---|---|
| Garage: car and bike builds, mods, specs, photos | Live "cruise mode" presence of other users |
| Class letter (S/A/B/C/D) per build | Swipe-to-match, follows, DMs |
| Map with game-style pins: events, photo spots, drives, tracks | Crew chat |
| Events: cruise, rolling meet, meet, show, track day | Badges, leaderboards (never for public roads) |
| Invite filters: class, cars/bikes, brands, min mods, radius, "everyone welcome" | Drive mode, cameras and hazards, push-to-talk |
| Co-hosts and crew-owned events | Real push notifications (need a paid Apple developer account) |
| RSVP, check-in, timed reveal, rolling "Move on" | Backend sync between phones (Supabase, next step) |
| Event chat (local only for now) | Sign in with Apple |

Phase 1 runs on **local demo data** stored on the phone (AsyncStorage) with a
seeded Midlands scene. All app logic goes through `src/lib/store.tsx`, so swapping
in Supabase later changes one layer only.

## Classes

Every build gets a letter from a performance figure. Cars and bikes use separate
scales, so a litre superbike and an M4 Competition both land in S.

* **Power:** a dyno-verified figure wins. Otherwise it's the stock bhp plus the
  claimed gain of each logged mod.
* **Car figure:** effective bhp = bhp × √(1450 kg ÷ kerb weight). Heavier cars
  pay a mild penalty and lighter cars get a mild boost.
  S ≥ 420 · A ≥ 290 · B ≥ 190 · C ≥ 125 · D below.
* **Bike figure:** bhp per tonne of wet weight.
  S ≥ 850 · A ≥ 580 · B ≥ 380 · C ≥ 200 · D below.
* 600 cc supersports (R6, CBR600RR, ZX-6R) land in A, with Golf R and Type R level cars.
* **"Modified":** 3 or more logged mods. Meet filters use this.

Code: `src/lib/classes.ts`, tests in `__tests__/classes.test.ts`.

## Events

| Type | Places | Who sees the place, and when |
|---|---|---|
| Cruise | Start, regroup stops, finish (a route) | Everyone going sees the whole route from the reveal time |
| Rolling meet | Every stop planned before the event (checked against ban zones) | Stop 1 shows from the reveal time. Once the meet is live, a host taps **Move on**, and only people checked in at the current stop see the next one |
| Meet | One spot | Everyone going, from the reveal time |
| Show | One spot | Public: always visible |
| Track day | A circuit | Public: always visible |

* Before the reveal, invited people see only the **area**, a circle a few miles
  wide, plus the time and the filters.
* **Reveal time** is set by the host, as minutes before the start (default 60).
* **Hosts:** one or more named co-hosts, or a whole crew (any crew member can
  host). Hosts always see every stop and can move on, edit and cancel.
* **Rolling meets:** every stop is placed when the event is created, and nothing is
  picked on the night (owner's decision after the legal research, 17 Nov 2026).
  Stops stay hidden until a host moves on.
* **Changing the plan on the night** (owner request, 17 Nov 2026): hosts can rename,
  move or remove stops the meet hasn't reached, or add one on the end. Each change
  is checked against ban zones (warning, not a block), logged on the event for
  hosts (who, when, what), and posts "Hosts changed the plan" in chat without
  saying where. Stops the meet has left, or with people checked in, can't move.
* **Editing:** hosts can edit an event until it starts, if nobody has checked in.
  **Share** sends the title, time, rough area and a `nightshift://event/<id>` link.
* **Ban zones:** the app shows a warning (it doesn't block) when a stop of any
  event type is inside a sample injunction or PSPO zone, explaining that
  organisers have been taken to court.
* **Drives** (formerly "sprints"): rated roads, never timed or ranked.
* **Check-in:** you must be within 0.5 mi of the current stop, from 30 minutes
  before the start until the end. Before then the event shows when check-in opens. On the demo build a "simulate" switch in Settings skips the GPS check.
* **Invites:** someone is invited when any of their builds matches the filter and
  they live within the radius of the area. "Everyone welcome" skips the build
  filter but keeps the radius.

Code: `src/lib/events.ts` and `src/lib/invites.ts`, with tests.

## Drives and photo spots (built, demo)

* Drives and photo spots live in the store with an author, a status (pending or
  approved), completions and 1–5 star ratings. Tap a pin on the map to open one.
* **Start drive:** each point of the drive's line is a checkpoint (within 0.2 mi).
  Pass every checkpoint in order to finish, using GPS (`watchPositionAsync`) or,
  with **Simulate GPS** on, a button that walks the checkpoints at a legal pace.
  A run that would average over 60 mph for the distance, or takes far longer than
  the drive allows, doesn't count. **The app only ever says pass or fail**: no
  time or speed is shown or stored, and a completion keeps the day only.
* **Photo spot visit:** check in within 0.2 mi (or simulate), then an optional
  photo that goes through the plate review and is saved pixelated with no metadata.
* After a drive or visit, a 1–5 star prompt. One rating each, the latest counts.
* **Suggest a place:** long-press the map to draw a drive (start to finish) or
  drop a photo spot, and name it. It starts **pending**; the demo approves it after
  about 10 seconds. A point inside a ban zone shows a warning, not a block.

Code: `src/lib/spots.ts`, tests in `__tests__/spots.test.ts`.

## Author rep for drives and photo spots

Anyone can suggest a drive or a photo spot. Once it's approved, the author gets **+50 rep**.
After each GPS-checked completion, the driver or rider is asked to rate the route
from 1 to 5 stars. The author then earns rep **per person who has completed it**
(repeat drives by one person count once), scaled by the route's average rating:

| Average rating | Rep per completion |
|---|---|
| 5 stars | 20 |
| 4 stars | 12 |
| 3 stars | 5 |
| 2 stars | 1 |
| 1 star | 0 |

Photo spots work the same way: a GPS-checked visit counts as a completion. Spots
pay half (10 / 6 / 2 / 0 / 0) because stopping for a photo is easier than driving
a whole route.

Anti-gaming rules:
* Only people who completed the route can rate it, and only once (the latest rating counts).
* The author can't rate their own route, and gets no driver rep for driving it.
* The average starts as if five people had already given 3 stars, so a few mates
  giving 5 stars can't push a route to the top.

## Rep and levels (built)

| Source | Rep |
|---|---|
| Each event you checked in at | 150 |
| Each finished event you hosted | 400 with 10+ checked in, otherwise 100 |
| Each drive, first time you finish it | 100 |
| Each photo spot, first visit | 50 |
| Places you suggested | author rep above |
| Trophies | 500 / 300 / 200 / 150 (see below) |
| Each logged mod | 20 |

Level n starts at 250 × (n − 1) × n ÷ 2 rep: level 2 at 250, 3 at 750, 4 at 1,500.
Me shows the total, level, a progress bar and the breakdown; profiles show the level.

Code: `repLedger` and `levelFor` in `src/lib/rep.ts`, tests in `__tests__/rep.test.ts`.

## Crews (built, demo)

* A crew has a name, a 2–4 character tag and members. You can be in one crew at a time.
* Crew page: members (tap for profiles, with levels), crew events, combined rep
  and the average member's level, and Join / Leave.
* Start a crew from Me or the crews list: you become its first member.
* Reach crews from Me, people's profiles and the "hosted by" line on events.
* Event co-hosts are picked from your crew.

Code: `src/lib/crews.ts`, tests in `__tests__/crews.test.ts`.

## Post-meet voting and trophies (built)

* Only people who checked in can vote, once per award, never for their own build.
  Voting opens at the start and closes 24 hours after the end. An award needs at
  least 3 votes.
* Awards: **Best in show**, **Best car** and **Best bike** (when both turn up),
  **Best per class** (meets with 12+ people checked in, and 2+ builds in that
  class) and the style awards: stance, sound, paint, cleanest build, newcomer.
* Rewards:
  * **Cover shoot:** Best in show, Best car and Best bike winners get an original
    magazine-style cover of their build, pinned to their garage.
  * **Trophy cabinet** on the build page.
  * **Rep:** Best in show 500, Best car or bike 300, class 200, style 150.
  * **Legend badge:** Best in show winners carry a "Legend" badge for a week.
* Ties go to the build that reached the top count first.

Code: `src/lib/awards.ts`, tests in `__tests__/awards.test.ts`.

## Research findings that change the plan (Nov 2026)

Full reports are in `docs/research/`.

* **Map and traffic data** (`data-sources.md`):
  * Google and Waze can't supply closures. Google data can't be shown on an
    Apple map, and Waze only shares feeds with public bodies.
  * Apple's traffic layer is on, but it only colours congestion.
  * Closures and roadworks will come from UK open data (National Highways
    closures, DfT Street Manager, TfL) through our own small backend.
  * Live incidents for drive mode: TomTom or HERE free tiers.
  * Speed cameras: OpenStreetMap (credit OSM, and keep camera data separate from
    user reports) or a paid PocketGPSWorld licence.
  * "Open in Waze / Apple Maps" deep links for navigation.
  * DVLA and DVSA MOT lookups can fill in make, model and colour from a
    registration, called from the backend only.
* **Plate blurring** (`plate-blurring.md`):
  * A small Swift module using Apple's text recognition, matched to UK plate
    formats, with heavy pixelation (light blur can be reversed). Every upload is
    re-saved with no metadata.
  * A review screen lets people add, move or remove boxes.
  * Built: `modules/plate-redactor` (Swift). Every photo goes through a review
    screen with the detected boxes, then is saved pixelated with no metadata.
    Web and Expo Go fall back to re-saving without metadata. Still untested on
    a real iPhone, because the GitHub build is blocked by billing.
* **Other apps, design and branding** (`competitors-design-branding.md`):
  * UK meet apps are calendars. None has classes, rep, voting or rolling meets.
  * Never time or rank public-road routes. No police spotting.
  * Plan how the app makes money early, since Drivetribe and Zenly both closed.
  * Don't use "Need for Speed", "NFS" or "Underground" in the name. "Nightshift"
    clashes with Apple's Night Shift feature and a 2026 UK trademark filing for
    vehicle lights, so it stays a working name only. Name shortlist: Sodium Nights,
    Slipstreet, Nitelane.
* **UK law** (`legal.md`): car-cruise injunctions cover organising and promoting
  meets (Black Country, Birmingham, Enfield and others). Rolling meets with hidden
  next stops look like evading police. Timed or "sprint" road routes clash with
  App Store rule 1.4.4. The Online Safety Act applies from launch. Live location
  needs a data protection impact assessment (DPIA). Owner's decisions:
  rolling-meet stops are all planned ahead, ban zones warn but don't block,
  "sprints" are renamed "Drives", and "Nightshift" stays the working name.
  Before a public launch: proper age checks, a DPIA, the ICO fee, Online Safety
  Act paperwork, a trademark search and a solicitor's review.

## Privacy and safety in Phase 1

* Other people's home locations are never shown, only the event area.
* Plates: no plate field at all. Photos are the owner's responsibility until
  automatic blurring arrives (Phase 2).
* Meet-ban zones (PSPOs): a small sample is included. Pinning a meet or rolling
  meet stop inside one shows a warning. The full list is a later data task.
* Cruises never record speed or arrival order.

## Screens

1. **Map:** a dark map, game-style hexagon pins, filter chips (events, spots,
   drives, tracks), a "Suggest a place" chip, and a peek card that opens the
   event, drive, photo spot or track.
2. **Events:** Going, Invited, Hosting and Public lists, with a create button.
3. **Event detail:** hero, hosts, invite filter summary, the stops timeline
   (locked or revealed), RSVP, check-in, Move on (hosts), attendees and chat.
4. **New event:** type, name, time, area, stops, filters with a live count of
   matching builds, hosts and the reveal time.
5. **Garage:** your builds as cards showing the class letter.
6. **Build:** a game-style stats screen with specs, mods by category and photos.
7. **Edit build:** car or bike, make, model, year, nickname, stock bhp, weight,
   dyno figure, and the mods list with bhp gains.
8. **Me:** profile, rep and level with a breakdown, crew, your suggested places, privacy toggles for later phases, demo controls
   (simulate GPS, reset data).

9. **Drive / photo spot:** details, map, Start drive or Check in, rating, photos.
10. **Suggest a place:** draw a drive or drop a photo spot on the map.
11. **Crews:** browse crews, crew page, start a crew.

## Next steps after Phase 1

1. Supabase project with PostGIS: auth, builds, events, RSVPs, check-ins and chat.
2. A paid Apple developer account, then TestFlight and real push notifications
   for Move on.
3. Phase 2: cruise mode presence, crews, matching.

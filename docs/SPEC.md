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
| Map with game-style pins: events, photo spots, sprint routes, tracks | Crew pages and crew chat |
| Events: cruise, rolling meet, meet, show, track day | Rep, levels, badges, leaderboards |
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
| Rolling meet | Every stop planned before the event (checked against ban zones) | Stop 1 shows from the reveal time. A host taps **Move on**, and only people checked in at the current stop see the next one |
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
* **Check-in:** you must be within 0.5 mi of the current stop while the event is
  on. On the demo build a "simulate" switch in Settings skips the GPS check.
* **Invites:** someone is invited when any of their builds matches the filter and
  they live within the radius of the area. "Everyone welcome" skips the build
  filter but keeps the radius.

Code: `src/lib/events.ts` and `src/lib/invites.ts`, with tests.

## Route and photo spot rep (Phase 3, scoring logic already built)

Anyone can suggest a sprint route or a photo spot. Once it's approved, the author gets **+50 rep**.
After each GPS-checked completion, the driver or rider is asked to rate the route
from 1 to 5 stars. The author then earns rep **per completion by someone else**,
scaled by the route's average rating:

| Average rating | Rep per completion |
|---|---|
| 5 stars | 20 |
| 4 stars | 12 |
| 3 stars | 5 |
| 2 stars | 1 |
| 1 star | 0 |

Photo spots work the same way: a GPS-checked visit with a photo taken there counts
as a completion. Spots pay half (10 / 6 / 2 / 0 / 0) because stopping for a photo
is easier than driving a whole route.

A great route that lots of people drive earns far more than a poor one few take.
Anti-gaming rules:
* Only people who completed the route can rate it, and only once (the latest rating counts).
* The author can't rate or score their own route.
* The average starts as if five people had already given 3 stars, so a few mates
  giving 5 stars can't push a route to the top.

Code: `src/lib/rep.ts`, tests in `__tests__/rep.test.ts`.

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
   sprints, tracks), and a peek card for the selected pin.
2. **Events:** Going, Invited, Hosting and Public lists, with a create button.
3. **Event detail:** hero, hosts, invite filter summary, the stops timeline
   (locked or revealed), RSVP, check-in, Move on (hosts), attendees and chat.
4. **New event:** type, name, time, area, stops, filters with a live count of
   matching builds, hosts and the reveal time.
5. **Garage:** your builds as cards showing the class letter.
6. **Build:** a game-style stats screen with specs, mods by category and photos.
7. **Edit build:** car or bike, make, model, year, nickname, stock bhp, weight,
   dyno figure, and the mods list with bhp gains.
8. **Me:** profile, crew, privacy toggles for later phases, demo controls
   (simulate GPS, reset data).

## Next steps after Phase 1

1. Supabase project with PostGIS: auth, builds, events, RSVPs, check-ins and chat.
2. A paid Apple developer account, then TestFlight and real push notifications
   for Move on.
3. Phase 2: cruise mode presence, crews, matching.

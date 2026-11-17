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
| Events: cruise, rolling meet, meet, show, track day | Badges; leaderboards beyond track times (never for public roads) |
| Invite filters: class, cars/bikes, brands, min mods, radius, "everyone welcome" | Hazard reports, push-to-talk (turn-by-turn and camera alerts are built: see "Driving view") |
| Co-hosts and crew-owned events | Real push notifications (need a paid Apple developer account) |
| RSVP, check-in, timed reveal, rolling "Move on" | Real push to a locked phone (Phase 2) |
| Event chat (live when signed in) | Sign in with Apple |
| Email sign-in (one-time code or link), demo without an account, delete account | |

Phase 1 runs two ways (Nov 2026):

* **Signed in** (email one-time code, or the sign-in link while custom SMTP isn't set
  up): the live Supabase backend. Profiles, homes (fuzzed, owner-only), garages and
  photos, events, going, requests, check-ins, chat, votes, crews, suggested places and
  notices are shared; every rule is checked again on the server. The current event's
  chat, going, check-ins and stop reveals update live (Supabase Realtime). Reads are
  cached on the phone; chat, garage edits and "mark read" queue while offline.
* **Demo** ("Try the demo without an account"): **local demo data** stored on the
  phone (AsyncStorage). The map, your position and place names are real; the other
  people and their events are a clearly labelled sample scene drawn round your own
  home area (see "Real places and location" below).

All app logic goes through `src/lib/store.tsx`, which sends writes to a Repository
(`src/lib/repository.ts`): `LocalRepository` for the demo, `SupabaseRepository`
(`src/lib/backend/remote.ts`) signed in. Account deletion is in the app (Me ›
Account), as Apple requires.

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

## Vehicle picker, tune stages, mods and engine swaps (built, Nov 2026)

* **Vehicle picker:** quick search or make → model → generation/engine, for cars and
  bikes. Picking a variant fills stock bhp, kerb/wet weight, torque and year; all
  stay editable. Anything not listed is free-typed. The bundled dataset lives in
  `src/data/vehicles.cars.ts` and `vehicles.bikes.ts` (compact text, parsed and
  searched by `src/lib/vehicles.ts`; sources in each file's header). Power is
  stored as the maker quotes it; PS → bhp is ×0.986 everywhere.
* **Tune stage:** one of Stock, Stage 1, 2, 2+, 3, 4 or Custom, with what the stage
  usually includes (bike stages are bike parts: end can and flash, full system,
  internals). The estimate uses a tuner's figure for that exact variant where the
  dataset has one, else a cautious percentage by engine type (turbo petrol, diesel,
  non-turbo, supercharged; bikes separately). It's saved as a "Stage N tune" engine
  mod carrying the gain, so classes, older saves and the backend see it; the gain
  is editable. "Add typical parts" adds the stage's road-legal parts with no gain of their own.
* **Road legality** (review 4): parts that are illegal on UK roads or fail the MOT
  (decat / cat delete, straight-through with no cat, bike de-cat link pipe,
  de-restricting, pops-and-bangs and anti-lag maps, and typed-in names that mean the
  same) are tagged **Not road legal — track/off-road only** in the chips, the mod
  list and on the build page. Logging them is allowed (people do own them), but "Add
  typical parts" never adds them: parts often fitted at a stage that aren't road
  legal are offered separately as optional, with the tag. Stage descriptions don't
  suggest them ("downpipe with a sports cat", "full system, with its cat").
  Code: `src/lib/legality.ts`.
* **Mods:** quick-pick chips by group (engine, intake, exhaust, turbo, fuel, cooling,
  suspension, brakes, wheels, body, aero, interior, bike controls, lighting,
  audio), car or bike only where it matters. Groups map onto the saved categories
  (fuel and cooling → engine, aero → body, controls → other). Free-typed mods stay.
* **Engine swap:** the chassis keeps its name, year and weight (plus an optional
  ± kg); stock bhp and torque come from the donor (an engine from the engines list
  or any vehicle in the dataset). Stages apply to the donor. Saved as
  `engineSwap` on the build and as an "… engine swap" engine mod, so it counts as a
  mod and shows on cards ("Bandit 1200 swap").
* **Suggest a missing car/bike or mod:** a short form in both pickers, queued on
  the phone as `pendingFeedback` (kind idea, screen vehicle-picker or mod-picker)
  for sending to the backend's feedback table.

Code: `src/lib/vehicles.ts`, `tune.ts`, `swap.ts`, `feedbackQueue.ts`, tests in
`__tests__/vehicles.test.ts`, `vehicleData.test.ts`, `tune.test.ts`, `swap.test.ts`.

## Events

| Type | Places | Who sees the place, and when |
|---|---|---|
| Cruise | Start, regroup stops, finish (a route) | Everyone going sees the whole route from the reveal time |
| Rolling meet | Every stop planned before the event (checked against ban zones) | Stop 1 shows from the reveal time. Once the meet is live, a host taps **Move on**, and only people checked in at the current stop see the next one |
| Meet | One spot | Everyone going, from the reveal time |
| Show | One spot | Public: always visible |
| Track day | A circuit | Public: always visible |

* Before the reveal, invited people see only the **area**, a circle at least 3 mi
  across in radius, plus the time and the filters. The area is never the place:
  it's the stops' centre snapped to a ~2 mi grid, then moved 1–2 mi in a direction
  picked from the event id, at least 0.75 mi from every stop. The circle still
  contains every stop (`src/lib/area.ts`). Hosts name the area (default: the
  nearest region).
* **Reveal time** is set by the host, as minutes before the start (default 60).
* **Hosts:** one or more named co-hosts, or a crew. For crew events only the crew's
  owner and the hosts the owner picks get host rights; joining a crew makes you a
  plain member. Hosts always see every stop and can move on, edit and cancel.
* **Request to go:** someone the invite doesn't cover (wrong class, too far, a
  shared link) can ask. It's a pending request, never "going", until a host
  approves it on the event. Declined people can't ask again. Requests are never
  approved automatically.
* **What you're bringing:** with two or more builds, **I'm going** (or **Request to
  go**) asks which one: class badge, make and model, swap and tune stage. It starts
  on the last one you brought if the invite covers it, else the first it covers.
  Builds the invite doesn't cover are shown, marked "doesn't match the invite", and
  picking one makes it a request. One build is used without asking. With none
  you're asked to add one, or go as a passenger (no vehicle). You can change it
  until the start, and at check-in if you turned up in something else (a build the
  invite covers), never after checking in. Changing to a build the invite doesn't
  cover puts you back to asking a host. The Going list, requests, class counts on
  event cards, votes and trophies use the build each person brought (all their
  builds only for old data with no pick). Invites, alerts and Find events still
  count any of your builds.
* **Chat** is for hosts and people going (it can carry "far end of the car park").
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
* **Ban zones (car-meet order areas):** shown only where you host: the event form's
  map, the stop picker and Change the plan, as council outlines for borough-wide
  orders and circles for smaller ones. A stop inside one gets a short warning line
  (it doesn't block); tapping it, a zone's pin or the line under the crosshair opens
  an info card: the zone's name and id, the kind of order (court injunction, PSPO,
  police dispersal orders), what it bans in plain words, hours if known, the
  source, "Sample — check the current order", and what it means for the host
  (Nightshift only warns; hosts are responsible). They are not a layer on the
  main map. Places inside one show a single line, "Inside a car-meet order area —
  see details", opening the same card.
* **Drives** (formerly "sprints"): rated roads, never timed or ranked.
* **Check-in:** you must be within 0.5 mi of the current stop, from 30 minutes
  before the start until the end. Before then the event shows when check-in opens. Check-ins use a real GPS fix (never stored). For testing, Me › Settings › **Demo: skip the GPS
  check** skips the distance check; it is off by default.
* **Invites:** someone is invited when any of their builds matches the filter and
  they live within the radius of the area. "Everyone welcome" skips the build
  filter but keeps the radius.

Code: `src/lib/events.ts` and `src/lib/invites.ts`, with tests.

## Finding events (built, Nov 2026)

Owner's decisions, 17 Nov 2026:

* **Anyone signed in can see that an event exists:** its title, type, time, rough
  area and invite filter summary. Exact stops stay hidden by the reveal rules above,
  so finding an event never shows where it is. Admins (staff) can read everything
  on the backend for moderation, but get no host powers.
* **Willing to travel:** each person sets how far they'd go for an event: 5, 10, 25,
  50 or 100 mi, or a custom whole number from 1 to 300 (default 25). It's personal:
  only you see it.
* **New events near you:** each person picks **Notify me** (default: a notice under the
  bell and, if notifications are allowed, a phone notification), **I'll search** (no
  notification; new ones get a NEW tag in Find events) or **Off** (nothing). You hear
  about an event once, when it appears, if:
  * you can go: it's a show or track day, or you match the invite (a build fits the
    filter and you live inside the host's radius; "everyone welcome" skips the build
    check). This is the same "invited" rule as the Events tab;
  * its rough area is within your travel distance of your home area;
  * you aren't already hosting, going, waiting on a request or turned down;
  * it hasn't started and isn't cancelled.
  The message has the title, the time and the area name only: never a stop, a street
  or how far it is from home. Several at once make one phone notification ("3 new
  events near you") that opens Find events.
* **Find events** (Events tab header and the map): every upcoming or live event you can
  see, nearest first (then soonest), measured from your home area or, if you choose,
  where you are (rounded to about 1 km). Filters: distance (starts at your travel
  distance; 5–100 mi or any), type (cruise, rolling meet, meet, show, track day), when
  (tonight to 5am, the next 7 days, or the weekend from Friday 5pm to Monday 5am), "I can
  go" or everything, and cars, bikes or both. Distances are to the rough area, so locked
  events only ever show that area. Tapping a result opens the event.
* Settings: on the profile form (first run and Edit profile) and on Me under
  **Events near you**.

Code: `src/lib/discover.ts`, tests in `__tests__/discover.test.ts`. Backend:
`search_events()`, `save_travel_prefs()` and the new-event trigger (docs/BACKEND.md).

## Drives and photo spots (built, demo)

* Drives and photo spots live in the store with an author, a status (pending or
  approved), completions and 1–5 star ratings. Tap a pin on the map to open one.
* **Navigate the drive** (the drive page's one primary button) opens the driving view, and
  passing every checkpoint in order counts the drive. Each point of the drive's line is a
  checkpoint (within 0.2 mi). Where Nightshift's own directions aren't available (web, an
  older install, or another directions app chosen in Settings) a secondary **Count without
  directions** runs the same checkpoint check with GPS (`watchPositionAsync`); with **Demo: skip
  the GPS check** on, **Simulate the drive** walks the checkpoints at a legal pace.
  A run that would average over 45 mph along the drawn route (or the stated road
  length, if longer; or the road's own limit on national-limit A-roads, 60 mph), or takes far longer than
  the drive allows, doesn't count, and says only "This run looks too quick to count" (never
  that anyone broke a limit). **The app only ever says pass or fail**: no
  time or speed is shown or stored, and a completion keeps the day only.
* **Photo spot visit:** check in within 0.2 mi by real GPS (or skip the check in the demo), then an optional
  photo that goes through the plate review and is saved pixelated with no metadata.
* After a drive or visit, a 1–5 star prompt. One rating each, the latest counts.
* **Suggest a place:** on a full-screen map with a fixed crosshair, add checkpoints
  along a drive (start to finish, with Undo) or set one photo spot, and name it. The
  same picker (search, my location, tap to drop, nearby places and ban zones drawn
  faintly, a live address under the crosshair) places event stops, plan changes and
  the rough home area. Drive points must be no more than 1.5 mi apart,
  so the line follows the road; the app shows which gap is too long. It starts **pending**; the demo approves it after
  about 10 seconds. A point inside a ban zone shows a warning, not a block.

Code: `src/lib/spots.ts`, tests in `__tests__/spots.test.ts`.

## Speed cameras, nearby photos, circuits and track times (built, Nov 2026)

Owner's requests, 17 Nov 2026. Legal basis: `docs/research/legal.md` section 3 and the
App Store notes (camera *sites* from a database are legal in the UK; police positions are not
shown; no timing on public roads).

* **Cameras layer** (the map's layers button > **Speed cameras**, and Me › Settings › Map layers › **Speed cameras**;
  one setting, off by default, turned off once for older installs). Fixed speed cameras and average-speed zones for the whole UK from OpenStreetMap
  (`highway=speed_camera`; `type=enforcement` relations with `device`/`from`/`to`), fetched at
  build time into `src/data/cameras.ts` and decoded a 1° tile at a time. They only show once
  the map is zoomed in to driving distance (about 35 miles top to bottom), at most 120 pins,
  nearest the middle first; zoomed out, a note says to zoom in. Pins are small red cameras;
  average-speed zones are a thin red dashed line that follows the road between the zone's start
  and end (routed over OpenStreetMap roads at build time), with an average-speed camera at each end. Tapping says the
  limit and the direction where OSM has them, that the data may be incomplete, and the credit.
  Wording is speed-limit information only. The OSM data stays a separate dataset (ODbL),
  never merged with drivers' road reports (see "Road reports" below). Credit on the map and
  in the README.
* **Photo spots are for car and bike photos** (owner, 17 Nov 2026). Bundled photo spots show
  on the map only with evidence that cars or bikes are photographed or meet there: a car or bike
  source (PistonHeads, Porsche Roads, BestBikingRoads, The Biker Guide…), a description that
  says so, or a short list of well-known locations with the reason (`src/data/photoVetting.ts`).
  Scenic-only spots stay in the data but off the map. Suggesting a photo spot needs a photo taken
  there with a car or bike in it (cropped, plates reviewed), shown on the pending spot.
* **Photos on a place** come in two sections: **Photos** (the suggester's and check-in
  photos, plate-blurred) and **Nearby photos** from Wikimedia Commons, only those whose title,
  description or categories show cars, bikes or motorsport; the section hides when none qualify.
* **Nearby photos** on photo spot, drive and track screens: your own (plate-blurred) visit
  photos first, then public photos from Wikimedia Commons' geosearch near the place (800 m
  for spots, 1.5 km for tracks, round the middle of a drive), each with its author and licence
  and opening its Commons page. Maps, logos, diagrams, SVGs and tiny files are dropped; photos
  whose title names the place come first. Only the place's coordinates are sent, to
  commons.wikimedia.org only. Answers are cached for a week; offline or empty is said plainly.
* **Circuits:** the main layout's outline from OpenStreetMap raceway ways (the loop closest to
  the published main-layout length; the longest line for hill climbs), on the track screen and
  on the main map when zoomed right in. Track details: what runs there (cars, bikes, karts),
  length, current layouts, and the official lap records published on each circuit's Wikipedia
  page (outright and fastest bike class, holder, vehicle, year, source link). Records the page
  isn't clear about are left out.
* **Tracks ▾** (Cars / Bikes, either or both): filter the circuits on the map by what runs
  there. Every track is tagged (cars, bikes) from the circuit's own site or Wikipedia; sprint
  courses and hill climbs are cars. **Racing to watch** (off by default) adds the spectator
  venues (speedway, oval stock cars, closed-road races), which run no track days.
* **No kart tracks** (owner decision, 17 Nov 2026): the kart circuits were taken out, with
  Karts in the Tracks filter and kart track times. Saved filters drop Karts and saved kart
  times are dropped with their proof photos.
* **Track times:** entered by hand only at a bundled track with known details (circuit, sprint
  course or hill climb; never a drive, photo spot, venue, spectator or closed-public-road
  venue). The rule fails closed: it reads the venue's own facts, and a track with no details
  takes no times. With the layout, the
  date (in the last two years, not in the future), the vehicle type, the build (its class is
  taken from it) and a proof photo of the timing sheet or timing app
  that goes through the plate review. Times quicker than the published outright record are
  refused as typos. The leaderboard is per track, layout, vehicle type and class, best time per
  person. Kept on the phone and marked **unverified**; verification against the proof arrives
  with the server. Times are never worked out from GPS, and drives stay untimed.

Code: `src/lib/cameras.ts`, `cameraCodec.ts`, `cameraZones.ts`, `commons.ts`, `outline.ts`,
`tracks.ts`, `laptimes.ts`, with tests. Data scripts: `scripts/fetch-cameras.mjs`,
`scripts/fetch-circuits.mjs`.

## Shops layer and partners (built, Nov 2026)

Owner's request, 17 Nov 2026: "Add another toggle on the map — Shops, which can be the
sponsors — and filter the shops you want to see." Money model: no ads and no paywalls;
local businesses can pay to be a **labelled partner**, never disguised as an ordinary listing.

* **Shops** in the map's layers button (and Me › Settings › Map layers). A tap turns the layer on or
  off (off by default; kept in settings). **Kinds ›** opens a small floating menu
  with nine kinds, any mix (never none): Tuning & modifications, Parts & accessories, Bike
  gear (helmets, leathers), Dealers (car and bike), Tyres & wheels, Detailing, wraps & tints,
  Dyno & rolling road, Garages & MOT, Coffee & meet spots; plus **Partners only**. The
  choice is kept, and the Shops row shows it when narrowed ("Tuning",
  "4 kinds", "Partners"). Each shop's id is its tile and OpenStreetMap element
  (`52_-2:n12018556`), stable across refreshes. The data is an app asset
  (`assets/data/shops.nsdata`) read the first time the layer is used.
* **Listings** are real UK businesses from OpenStreetMap (ODbL, credited on the map and on
  every shop screen, kept as their own dataset: nothing typed in the app is merged into it).
  Only public business details: name, kinds, position, and opening hours, website, phone
  and brand where they're tagged. Categories come from OSM tags (`shop=car_repair`,
  `car_parts`, `car`, `motorcycle`, `motorcycle_repair`, `tyres`, `amenity=car_wash`,
  `vehicle_inspection`, `craft=car_painter`/`vehicle_wrap`, `service:vehicle:*`,
  `motorcycle:clothes`, `clothes=motorcycle`…) and from names and descriptions for the rare
  ones (tuning, "dyno"/"rolling road", detailing). A business can be in more than one kind;
  the main one picks its small pin glyph. Cafés count only when tagged or named for bikers or
  drivers (biker, motorcycle, truck stop, Moto café, "Pit Stop Café"…; never pizza, sushi or
  cycle cafés), and the bundled meet spots show under Cafés and meet spots too.
  Plain hand car washes are left out.
* Shops show once the map is zoomed in to about 20 miles top to bottom, at most 90 pins,
  nearest the middle first, decoded one 1° tile at a time. Zoomed out, a note says to zoom in.
* **Shop screen:** name, kinds, brand, "Open now · closes 17:30" or "Closed · opens Mon 08:00"
  when the hours can be read (the week is listed, days with the same hours joined; bank
  holidays are noted and never guessed; other formats are shown as tagged), website and call
  buttons, directions in Apple Maps or Waze, a small map, and **Suggest an edit or a missing
  shop** (queued on the phone as feedback, kind idea, screen `shop`).
* **Partners:** a gold star pin, a "Partner" badge on the card and screen, the offer and their
  link, and a line saying partners pay to be highlighted. A partner always matches the kinds
  filter like any shop, comes first within the pin cap, and replaces its own OSM listing.
  Production partners will come from the backend's `partner_venues` table (mapping in
  docs/BACKEND.md); until then the list is empty and the demo shows two made-up "Sample
  partner" businesses near your home area, labelled as made up.

Code: `src/lib/shopCategories.ts` (kinds and OSM tag rules), `shopCodec.ts`, `shops.ts`,
`shopData.ts`, `openingHours.ts`, `partners.ts`, with tests in `__tests__/shops.test.ts`,
`openingHours.test.ts` and `shopData.test.ts`. Data: `scripts/fetch-shops.mjs`
(`scripts/shops-from-pbf.py` when Overpass is down).

## Driving view: turn-by-turn navigation (built, Nov 2026)

Owner's request, 17 Nov 2026. Legal basis: `docs/research/legal.md` sections 2, 3 and 7
(camera sites from a database are legal in the UK; no police positions; Apple 1.4.4 and
1.4.5; reg 110 hand-held phone use) and the App Store notes.

* **Entry points:** **Start navigation** on events (once their stops are revealed to you: a
  cruise through every stop you can see, in order; a rolling meet only to the stop it's at
  now; a meet to the spot), drives (**Navigate the drive**: to the start, then through the
  checkpoints), tracks, meet spots, photo spots and shops. It opens Nightshift's driving view by
  default. **Open in another app ›** offers Apple Maps, Google Maps (app, else website), Waze
  or the share sheet, with **Always use this**; Me › Settings › **Navigation** changes the default.
  Other apps get the first stop's coordinates only, never a stop or event name.
* **Directions:** Apple MapKit (`MKDirections`, driving, no alternatives), one request per
  leg, chained in order, two at a time, retried with backoff when Apple throttles. Only
  coordinates are sent. Long drives route through at most 30 of their checkpoints.
* **Guidance:** a big arrow, distance and instruction; spoken at 1 mile (after a long
  straight), a quarter of a mile, 200 yards and at the turn, in an en-GB voice that ducks
  other audio. Miles and yards. Off the route (over 50 m, or the GPS accuracy if worse, for
  over 5 s, or heading the wrong way along it) it reroutes from where you are through the
  stops still to come, at most every 20 s. Arrival is per stop: cruise and meet stops with
  check-in offer **Check in** once you've stopped; drive checkpoints are called out, and
  passing all of them in order counts the drive (pass or fail, never timed).
* **Map:** heading-up and centred on you. It faces your GPS course above about 2.5 m/s
  (5.6 mph); slower or stopped, the phone's compass; the route's bearing only as a last
  resort; turns are eased and jitter under 3° ignored (`src/lib/heading.ts`). The camera
  sits on the route line only while you're moving along it within 15 m.
* **Cameras and zones:** fixed cameras within 40 m of the route and up to about half a mile
  ahead (a camera tagged as facing across your road is left out), and average-speed zones
  driven in their own direction. Spoken as "Speed camera ahead, 30 miles per hour" and
  "Average speed zone starts / ends". In a zone the panel shows your running average
  through it. Your GPS speed is compared with the camera's or zone's limit only (there's no
  road speed-limit data); above it the speed box turns red with one soft chime and a buzz,
  at most every 10 s. On by default; Me › Settings › Navigation turns the alerts off.

**Safety rules for the driving view** (code-level, keep them):

1. **Nothing about speed or time is stored, scored, ranked or shared.** Speed is shown live
   and thrown away. The zone average lives only while you're in the zone. No "fastest",
   no trip times, no leaderboards. A drive finished by navigation records the day only.
2. **Speed-limit information only:** cameras and zones are OpenStreetMap data with the
   caveat and credit, kept apart from drivers' reports. Drivers' "Police / speed check"
   reports (owner decision, 17 Nov 2026) appear only here, under the safeguards in
   "Road reports" below.
3. **Minimal interaction while moving:** no panning, zooming or menus on the map; two big
   buttons (voice, **END**); check-in only appears once you've stopped. Large text, dark.
   Set the route before setting off; the phone belongs in a cradle (reg 110).
4. **Foreground only:** GPS runs while the driving screen is open and the app is in front;
   leaving the app or pressing END stops it. No background location permission.
5. **Over the limit is a warning, never a reward:** red and one chime, no sounds or visuals
   that celebrate speed. The demo drive (Me › Settings › Demo: skip the GPS check) never counts.

Code: `src/lib/nav.ts` (engine, tests in `__tests__/nav.test.ts` with a fixture route),
`navPlan.ts`, `directions.ts`, `src/app/drive.tsx`, `components/DriveMap.tsx`,
`NavLaunch.tsx`, and the native module `modules/nav-directions` (Swift: MapKit directions,
AVSpeechSynthesizer, system chime). Needs a new IPA (the fingerprint changes).

## Where to? (owner request, 17 Nov 2026)

Nightshift as an everyday sat nav: **Find › Where to?** searches any address, postcode or
place (UK first, then anywhere), shows it on the map, and **Go here** starts the driving view
(or the app picked with **Always use this**). Recent places (10, with **Clear**), **Home** and
**Work** are kept in the phone's settings only. Lookups go to Apple's geocoder alone
(expo-location); searches are never logged or sent to our server. Code: `src/lib/whereTo.ts`,
`src/lib/location.ts`, `src/app/where.tsx`.

## Road reports (built, 17 Nov 2026)

Owner's request (BACKLOG queue item 3), with the owner's police decision of 17 Nov 2026.
Waze-style: drivers report what's on the road, other drivers confirm or clear it, and
reports run out on their own.

* **Reporting** is in the driving view only: a big **REPORT** button, then one of seven big
  tiles: Crash, Hazard, Roadworks, Closure, Traffic, Mobile camera, **Police / speed check**.
  Two taps, "Thanks, reported" spoken (with voice on), and **UNDO** for 5 seconds before it's
  sent. The report is where the phone is (its direction too, so the other carriageway isn't
  warned), snapped to about 10 m. The server checks it's within half a mile of the phone's
  position, which it compares and throws away. At most one report every 2 minutes and 30 a day.
  The same kind already reported within 150 m (same direction) counts as a confirmation.
* **Lifetimes:** police 30 min, mobile camera 60 min, traffic 30 min, hazard and crash 2 h,
  roadworks and closure 24 h. Each "still there" gives a report its usual time again from
  then, up to a cap (camera 2 h, traffic 90 min, hazard and crash 4 h, roadworks and closure
  72 h). **Police reports are never extended:** 30 minutes from the report.
* **"Still there?"** Just after you drive past someone's report the driving view asks, with
  big **YES** / **NO, GONE** buttons; it goes by itself after 8 s and ignoring it costs
  nothing. On the map's report card, **Still there** / **Gone** show when you're within a
  mile. One answer per person per report, never on your own. Two "gone" in a row (no "still
  there" between) clear it.
* **Alerts ahead:** reports within 40 m of the route, up to about three quarters of a mile
  ahead, are said once ("Crash reported ahead, half a mile") and shown in a coral strip
  under the turn banner for 10 s. Turn instructions come first.
* **Closures and rerouting:** a driver's closure confirmed by 2 others, or an open-data full
  closure, on the leg you're driving: MapKit can't be told to avoid a road, so the app tries
  detour points 0.5 and 1 km either side of the closure, square to the road, and takes the
  first route that keeps 100 m clear of it (checked on the phone). If none does: **Road closed
  ahead — follow diversion signs** (shown and said). Off the detour, it starts again from where
  you are. Lane closures don't reroute.
* **Main map:** a **Road reports** layer under the layers button, off by default: crashes,
  hazards, roadworks, closures, traffic and mobile cameras (coral pins; open-data closures as
  lines), each with a card: age ("12 min ago"), confirmations, when it ends, and the answer
  buttons when you're near. Open-data closures carry their credit (e.g. "Powered by TfL
  Open Data").
* **Police safeguards** (keep them): labelled "Police / speed check"; shown **only in the
  driving view** (the app asks the server with context `driving` from that screen alone; the
  server returns them only then and only within 10 miles; they can't be read from the table,
  so Realtime never sends them); 30-minute expiry, never extended; **never on the map, and
  never on event, cruise or meet screens** (none of those screens read road reports at all);
  rep only once two other drivers confirm, like every other report. Nothing about speed is
  recorded, scored or rewarded.
* **Rep:** +10 to the reporter when two other drivers confirm a report (at most 5 a day),
  +2 for answering "Still there?" either way (once per report, at most 10 a day). Nothing
  for an unconfirmed report. The rep ledger shows **Road reports confirmed** and **Road
  reports checked**.
* **Privacy:** who made a report is never readable by anyone else (column grants; Realtime
  payloads leave it out, checked by the smoke test). Reports are deleted two days after they
  end; rep rows stay. Deleting your account deletes your reports and answers.
* **Demo:** sample reports round your home area (one of each kind, a confirmed closure, and a
  police check for the driving view), your own reports kept on the phone, and two sample
  drivers confirm yours 20 s after you send it so the rep shows.
* **Open data (server):** `supabase/functions/import-closures` imports TfL street closures
  (keyless) and, once the owner adds a key, National Highways road and lane closures into
  `road_closures` (docs/BACKEND.md). Not deployed yet.

Code: `src/lib/roadReports.ts` (rules, alerts, prompts, detours; tests in
`__tests__/roadReports.test.ts`), `roadService.ts`, `roadStore.tsx`, `backend/roads.ts`,
`components/RoadReportControls.tsx`, `src/app/drive.tsx`, the map's layer in
`src/app/(tabs)/index.tsx`; server in `supabase/migrations/20261117170000_road_reports.sql`
with `supabase/tests/road_reports_test.sql`.

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
| Each logged mod: road-legal only, each kind once per build, at most 10 per build | 20 |
| Each road report of yours two other drivers confirmed (at most 5 a day) | 10 |
| Each "Still there?" answer, once per report (at most 10 a day) | 2 |

Level n starts at 250 × (n − 1) × n ÷ 2 rep: level 2 at 250, 3 at 750, 4 at 1,500.
Me shows the total, level, a progress bar and the breakdown; profiles show the level.

Code: `repLedger` and `levelFor` in `src/lib/rep.ts`, tests in `__tests__/rep.test.ts`.

## Crews (built, demo)

* A crew has a name, a 2–4 character tag and members. You can be in one crew at a time.
* Crew page: members (tap for profiles, with levels), crew events, combined rep
  and the average member's level, and Join / Leave.
* Start a crew from Me or the crews list: you become its **owner**. The owner makes
  members **hosts** (or takes it away). Joining makes you a plain member. If the
  owner leaves, a host (or the longest-standing member) takes over.
* Only the owner and hosts host crew events.
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
  * **Trophies** on the build page.
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
  * Never time or rank public-road routes. No police spotting (the owner later allowed
    drivers' "Police / speed check" reports in the driving view only, with the safeguards in
    "Road reports").
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

## Real places and location (built, Nov 2026)

Owner's request: "Obviously you need to use real maps and location."

* **Map:** Apple Maps (react-native-maps) on iPhone. The Map tab asks for
  when-in-use location the first time, centres on you with the blue dot and has a
  locate-me button. If location is denied it shows your home area and says so once.
* **Real GPS by default:** check-ins, drives and photo spot visits use the phone's
  position. "Demo: skip the GPS check" (Me) is for testing only and is off by
  default; old saves were switched off once.
* **Home area:** first run offers "Use my current location" and a postcode or town
  search. Either way the point is snapped to a ~1 km grid (`fuzz`) before it is
  saved, so the exact place is never stored. "Use the demo area" stays as a testing
  option.
* **Place search and names:** the host form, Suggest a place and Change the plan
  have a search box (postcode, town or place, UK only, debounced) that jumps the
  map. Dropped stops and spots are named from the phone's reverse geocoder (e.g.
  "Ventura Park Rd, Tamworth", never a house number) and the host can edit the
  name; a typed name is never overwritten. Geocoding is expo-location only (Apple's
  geocoder on iOS): nothing goes to any other web service.
* **Bundled UK places** (`src/data/places.ts`): every major circuit and the main
  sprint and hill-climb venues; well-known driving and riding roads as untimed
  Drives whose lines follow the real road with points at most 1.5 mi apart
  (OpenStreetMap, ODbL), with warnings for single-track, steep or snow-gated roads;
  photo spots only at public car parks and viewpoints. They are "Added by
  Nightshift", so nobody earns author rep for them. A `venue` kind exists for
  meet spots: cafés and museums that welcome meets (information only, like tracks).
* **Sample scene near you:** the sample people and events (labelled Sample) are
  moved onto your home area keeping each point's distance and direction; cruises
  run on the nearest real drives and the show and track day are at the nearest
  real venues. Sample stops start with neutral names ("Retail park car park") and
  are renamed from the geocoder. Rough areas still follow `area.ts` (never on a
  stop) and demo times still shift. The scene is redrawn when your home area
  changes and on "Restart the demo events".
* **Regional research:** East Anglia, Kent and London drives, photo spots, tracks
  and meet-friendly venues from `docs/research/regional-places.md`, with their
  sources and warnings. Medium-confidence entries say so; Rockingham (closed) and
  duplicates of the bundled circuits are left out; Surrey reference venues are
  marked as outside the area.
* **Ban zones** (`src/data/banZones.ts`), round real orders only. Borough- and
  city-wide ones use simplified council boundaries from OpenStreetMap
  (`src/data/zoneBoundaries.ts`): Birmingham (whole city, injunction to 27 Feb
  2027), the Black Country injunction (Wolverhampton, Sandwell and Walsall, 3pm to
  7am, to 1 Mar 2027), Dudley's borough-wide PSPO (it left the injunction in Feb
  2026), Coventry's city-wide nuisance-vehicle PSPO, and Broadland and South
  Norfolk; and, from the Nov 2026 sweep (`docs/research/ban-zones-checked.md`),
  Stevenage (injunction to 31 Jan 2028), Brent, Southend, Braintree, Breckland, East
  Cambridgeshire, Milton Keynes, Bassetlaw (12 noon to 6am), Ashfield, Newcastle-under-Lyme,
  West Northamptonshire, Redcar and Cleveland and North Somerset. Gedling's
  Netherfield order uses the council's own map. Solihull now has a street-racing PSPO
  on Damson and Bickenhill Parkways (a circle). The rest are circles: the Westminster and Kensington
  injunction (revving and dangerous driving 18:00–07:00), Enfield, Great Yarmouth,
  Felixstowe, Norwich, Broadland and South Norfolk, Cromer, Halstead and Polhill,
  and the Medway, Dartford and Sheerness dispersal hotspots. Each is marked
  "Sample — check the current order" with its source, and a point in several shows
  all of them, the smallest first. Whether a place is in one is worked out when the
  app reads it, so a zone added in an update reaches every phone.

## Privacy and safety in Phase 1

* Other people's home locations are never shown, only the event area. Your travel
  distance and alert setting are private too. Your own
  home is always saved fuzzed to ~1 km; your live position is used for the map's
  blue dot and distance checks and is never stored.
* Plates: no plate field at all. Photos are the owner's responsibility until
  automatic blurring arrives (Phase 2).
* Meet-ban zones (PSPOs): a small sample is included. Pinning a meet or rolling
  meet stop inside one shows a warning. The full list is a later data task.
* Cruises never record speed or arrival order.

## Screens

1. **Map:** a dark map, game-style hexagon pins (events filled, places outlined; a
   number on a pin is a group of places when zoomed out, tap to zoom in). Top row: the
   wordmark, a white **N live** pill, **Find** (with a new-events badge) and the bell. Under
   it the four core layer pills (Events, Photos, Drives, Tracks; ▾ or long-press on Tracks
   for options), which share the row and go icon-only on narrow screens or larger text, so
   nothing scrolls sideways (`src/lib/mapLayers.ts`). Right column: locate, the layers button
   (Meet spots, Shops with its kinds, Speed cameras, Road reports, **Suggest a place** and the
   map key) and **Near me**. All layer choices are saved. Bottom: Next up, or "Nothing on near
   you tonight" with Find events, Host one and Suggest a place; a one-time hint explains
   the pins and buttons. A slot bottom right for a small widget, and a peek card that opens
   the event, drive, photo spot, track or meet spot. Only what's in view is drawn, at most
   40 of a kind (`src/lib/mapPlaces.ts`).
2. **Events:** a segmented control: Mine (hosting, going, requested), Invited, Public (shows
   and track days), Past (finished, cancelled, declined); header actions **Find** and **+ Host**.
3. **Event detail:** hero, hosts, invite filter summary, the stops timeline
   (locked or revealed), RSVP, check-in, Move on (hosts), attendees and chat.
4. **New event:** type, name, time, area, stops, filters with a live count of
   matching builds, hosts and the reveal time.
5. **Garage:** your builds as cards showing the class letter.
6. **Build:** a game-style stats screen with specs, mods by category and photos.
7. **Edit build:** car or bike, vehicle picker (make, model, generation) that fills
   stock specs, year, nickname, engine swap, stock bhp, weight, dyno figure, tune
   stage, quick-pick mod chips and the mods list with bhp gains.
8. **Me:** profile, rep and level with a breakdown, crew and your places (Suggest a place).
   **Settings** (header button): map layers, events near you (willing to travel, new-event
   alerts), reminders, navigation, privacy, account, demo controls (demo only: skip the GPS
   check, restart the demo events, reset data) and app updates.

9. **Drive / photo spot:** details, map, **Navigate the drive** or **Check in here**, rating, photos.
10. **Suggest a place:** draw a drive or drop a photo spot on the map.
11. **Crews:** browse crews, crew page, start a crew.
12. **Find:** a **Where to?** box (any address or place, then Go here), then events: filters
    and results nearest first; opens the event.

## Words and design system (REVIEW-5, 17 Nov 2026)

One vocabulary, in `src/lib/glossary.ts` (screens import it rather than writing their own):

| Use | Not |
|---|---|
| **event** (cruise, rolling meet, meet, show, track day) | "meet" as the generic word |
| **Hosting**, **Going**, **Requested**, **Invited**, **Public**, **Declined** (`roleLabel()`) | You host, Asked to go, Open to all |
| **Request to go** / **Cancel request** | Ask to go, Withdraw request |
| **Public · anyone within N mi** (invite line) | Everyone welcome |
| the stop **unlocks** | reveal, revealed (UI copy) |
| **stop** (a point on an event) | place, spot, location |
| **drive** (a road to enjoy); **route** only for a cruise's line | route for drives |
| **meet spot** (cafés and museums that welcome meets) | venue |
| **check in** (events and photo spots) | visit (in buttons) |
| "and" in labels | "&", "+" |
| menu paths with "›": Me › Settings › Demo | "Me > Demo" |

Design rules (`src/theme.ts`, `src/components/ui.tsx`):

* **Colour roles.** `BRAND` (sodium) for primary buttons, links, eyebrows, unread and
  selected chips. `LAYER` colours only on the map and a place's own header. `STATE`: live
  (white with a red dot), success (green), warning (amber), danger (red), info. `CLASS`:
  a metal ladder (steel D, bronze C, silver B, gold A, platinum S), not layer hexes.
  `SURFACE`: glass and scrim alphas, `borderStrong` for inputs (3:1).
* **Buttons.** One **primary** per screen; **secondary** is an outline; **danger** only
  destroys or cancels (joining a crew isn't). On a live event, Check in is primary and
  navigation secondary; on a drive, Navigate the drive is primary.
* **Type.** `Txt` variants h1 28, h2 20, h3 16, body 15, muted 14, caption 13, label 12,
  micro 11 (credits and tags), mono 13. 11 is the smallest. Body text scales with the iOS
  text size; map chrome, pills, tags and stat tiles cap at 1.3x, the driving view at 1.2x.
* **Components.** `Card` (solid, raised, glass, muted for finished things: never opacity),
  `Tag`, `SampleTag`, `LegendTag`, `ConfirmBox` ("{Verb} it / Keep it"), `InlineError`
  (under the control that failed), `Notice`, `EmptyState`, `NotFound` (with Go back),
  `ToggleRow`, `ListRow`, `LinkText` ("Open ›"), `HeaderAction`, `Segmented`, `CrewCard`.
* **Headers.** Detail screens are blank (the hero carries the title); list and form
  screens use `title(SCREEN_TITLES.x)` in capitals ("ADD A CAR OR BIKE" / "EDIT BUILD").
* **Icons.** Drive is a winding road, track and track day a chequered flag; tab icons
  (folded map, calendar, car, person) never reuse a map layer glyph. Pulse means live only.

## Next steps after Phase 1

1. ~~Supabase project with PostGIS: auth, builds, events, RSVPs, check-ins and chat.~~
   Live and wired into the app (17 Nov 2026). Left: custom SMTP so mates get a code,
   importing the bundled drives and photo spots, crew invites.
2. A paid Apple developer account, then TestFlight and real push notifications
   for Move on.
3. Phase 2: cruise mode presence, crews, matching.

## Drive length tiers (17 Nov 2026)

Drives pay rep by length, both to the driver (first completion) and to the
person who suggested it (per completion by others, on top of the star scale):

| Tier | Length | Driver rep | Author multiplier |
|---|---|---|---|
| Short | under 10 mi | 50 | ×0.5 |
| Medium | 10–25 mi | 100 | ×1 |
| Long | 25–50 mi | 175 | ×1.75 |
| Epic | 50 mi and over | 250 | ×2.5 |

Still never timed or ranked by speed. Code: `driveTier` in `src/lib/rep.ts`.

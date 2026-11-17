# Review 4: real-iPhone risks, data consistency and polish (17 Nov 2026)

A fresh, critical pass after the big data drop since Review 3: real places for every UK region, speed
cameras, circuit outlines and lap records, kart tracks, photo-spot vetting and Commons photos, the vehicle
picker (2,134 variants, 180 donor engines), tune stages, swaps, mod chips, bringing a vehicle, travel radius
and Find events, the map picker, photo crop, the Shops layer and versioned OTA updates.

**Method**

* Read `README.md` ("Try this tomorrow"), `docs/SPEC.md`, `docs/BACKEND.md`, `docs/REVIEW*.md`, the map,
  store, data, vehicle, tune, rep, lap-time, shop and photo code, `app.json` and the two workflows.
* `npx tsc --noEmit` passes. `npx jest --ci`: 39 suites, 465 tests, all pass.
* Bundles: `CI=1 npx expo export --platform web` (with source maps, sizes attributed per module) and
  `--platform ios` (the real Hermes bundle an OTA update ships).
* Data checks run with Node against the real data files: duplicate ids, near-duplicate places, ban-zone
  overlaps, drive lengths, vehicle parsing, shop tile sizes, the size of the saved state.
* Web preview at 400x820 with storage cleared: first run, map with each layer and both menus, Show
  everything, live and invited events, the bring-vehicle picker, voting, host form and map picker, garage,
  new bike build with a stage and typical parts, crop, track, kart track, drive, shop, partner, Find events
  and Me. Screenshots: `~/.playwright-mcp/rv4-*.png`. The web map is a flat stand-in, so map performance
  points come from the code plus marker counts measured in the preview.

**Headline numbers**

| What | Measured |
|---|---|
| iOS Hermes bundle (what every OTA update downloads) | **6.9 MB** (`entry-*.hbc`) |
| iOS assets | 69 files, 4.5 MB, of which **46 are font files; the app uses 9** |
| Web `__common` chunk | 2.2 MB, of which `src/data/shops.ts` is **847 KB** and the regional place files 187 KB |
| Web build-edit chunk | 152 KB, of which vehicle data is 125 KB |
| Saved state (`nightshift.v1`) on first run | **315 KB**, of which the 418 copied bundled places are **291 KB (93%)** |
| Map markers in the preview, live-meet zoom, Shops on | **555** pressable markers (120 cameras + 435 others) |
| Map markers after **Show everything** | about 440 (every bundled place plus events) |
| Bundled places | 418 (84 tracks, 129 drives, 111 photo spots, 94 venues), 2,217 path points |
| Ban zones | 33; 9 overlapping pairs, 2 fully inside another zone |

---

## Fix pass status (17 Nov 2026)

Every blocker and major is fixed; most minors too. Checked with `npx tsc --noEmit`, `npx jest`
(48 suites, 540 tests), a web export, `npx expo-doctor` (20/20) and Playwright screenshots
(`~/.playwright-mcp/fx4-*.png`) on a clean worktree.

| Finding | Status |
|---|---|
| **B1** map performance | **Fixed.** Places cut to the view plus a margin, at most 40 of a kind; count pins per kind when zoomed out (grid cells, tap to zoom); drive lines only zoomed in or selected; markers, lines, circles and outlines memoised with stable coordinates; region updates debounced and snapped; the 30 s clock moved to its own context and the pins only rebuild when an event's phase changes. Web preview, Tamworth demo, SVG pins on screen: first map 355 → 90, live-meet zoom 474 → 26 (cameras now off by default), with Shops and cameras 564 → 236, "Show everything"/Near me 354 → 134, UK zoom 354 → 58. Image pins (behind a native build) not done. **Confirm on the phone.** |
| **M1** bundled places copied into the save | **Fixed.** Bundled places are read from the bundle; the save keeps per-place progress (completions, ratings) and suggested places; ban zones are worked out on read and stored as ids. Old saves migrated. |
| **M2** whole state saved on every change | **Fixed.** Debounced 500 ms (flushed when the app goes to the background), split into six slices so a change only rewrites its slice; the demo is built only when there's no save; `migrate` runs only for older schema versions. First-run save 314 KB → 23 KB. |
| **M3** check-in records a different vehicle | **Fixed.** One rule, `checkInBuild` in `bringing.ts`, with the test from the review. The check-in area shows one line. |
| **M4** venue pins look like meet pins | **Fixed.** Events filled, places outlined; venues mint with a building-and-flag glyph; shows blue with a trophy; track days white; a map key in the layers menu. |
| **M5** ban zones under-cover the orders | **Fixed.** Checked against the Feb 2026 judgments: Birmingham (whole city) and the Black Country order (Wolverhampton, Sandwell, Walsall) as council outlines; Dudley's borough-wide PSPO and Coventry's city-wide PSPO added; Solihull has no current order (so the National Motorcycle Museum gets no notice, Coventry Transport Museum does). `bz-bham` removed; Broadland and South Norfolk are the two districts, not a circle over Norwich. Every zone a point is in shows, smallest first. Owner decision: zones only draw where you host, with an info card. |
| **M6** road-illegal mods, rep per chip | **Fixed.** Tagged "Not road legal — track/off-road only", never added by "Add typical parts" (offered as optional), no rep; mod rep once per kind per build, at most 10. |
| **M7** 6.9 MB OTA bundle, unused fonts | **Fixed.** 9 font weights (69 assets → 33); shop data moved to an asset loaded on first use. iOS Hermes bundle 6.92 MB → 5.30 MB (5.38 MB with the navigation code since added). Vehicle data (410 KB) stays in the bundle for now: the garage editor uses it synchronously. Bundle diffing needs a native build: not done. |
| **M8** silent fingerprint mismatch | **Fixed.** Me › App updates shows the runtime and channel; the IPA build records its fingerprint; the OTA job prints its own and warns on a mismatch; README says what to do and which changes need a new IPA. |
| **M9** shop ids are positions | **Fixed.** Ids are tile + OpenStreetMap element; regenerated from the same extract; queued suggestions with old numbers are marked. |
| m1 lap guard fails open | **Fixed.** `canTimeAt` reads the venue's facts and fails closed; North West 200 test; Bishopscourt has details. |
| m2 pace check says you sped | **Fixed.** "This run looks too quick to count"; national-limit drives use 60 mph. |
| m3 doubled years in bike names | **Fixed.** Year-only (or year-suffixed) generations left out of labels; saved names tidied. |
| m4 vehicle ids depend on order | Not done: needs an explicit id column in the vehicle data; next data batch. |
| m5 fuzzy search noise | **Fixed.** Substring matches only at word starts. |
| m6 check-in area repeats the vehicle | **Fixed** (with M3). |
| m7 class tallies mix scales | **Fixed.** "Cars 2A 1B · Bikes 1A". |
| m8 first open nags about cameras | **Fixed.** Cameras (and Shops) off by default, under the layers button; the zoom note only after you turn them on; one short credit line. |
| m9 camera pins with no information | **Fixed.** No-limit cameras smaller and dimmer. |
| m10 spectator venues fill Tracks | **Fixed.** Tracks ▾ › "Racing to watch", off by default. |
| m11 partner pins near event orange | **Fixed.** "P" badge on partner pins. |
| m12 settings for features that don't exist | **Fixed.** Removed, with a "coming later" note; Shops next to Speed cameras under Map. |
| m13 "sent with the next sync" | **Fixed** (copy). Sending to the live feedback table: not done. |
| m14 photo files left behind | **Fixed.** Reset deletes build, visit and lap-proof photos; removing a time deletes its proof. |
| m15 rep counts sample data | **Fixed** (noted in BACKEND.md). |
| m16 traffic lines on | **Fixed.** Off. |
| m17 crop starts on Free | **Fixed.** A build's first photo starts on Cover. |
| m18 near-duplicate places | Checked: both pairs are separate real venues. Swaffham Raceway is now under "Racing to watch", so that pair no longer overlaps by default; Loomies and The Hut separate when zoomed in. |
| m19 web only | No action (web isn't a target). |
| Owner decisions in this pass | Kart tracks removed (filters and lap times migrated); Shops and Speed cameras behind a round layers button under locate-me (off by default, turned off once for existing installs); ban zones only in hosting flows with an info card, and a single line on places inside one; a slot bottom right for a future speed widget. |

**Needs the iPhone:** map smoothness (pan Tamworth with Shops on); Shops loading the data asset in the installed app; tapping zone pins on the host maps (Apple Maps markers); the layers menu position under the button on notched phones; the cluster badge font.

## Findings, ranked

### Blocker (likely; confirm on the phone first)

**B1. The map draws every bundled place as a custom SVG marker, all the time, and re-renders all of them on
every pan, zoom and 30-second clock tick.** This is the most likely thing to make the iPhone map stutter or
stall on the first proper go.

*Evidence.*
* `src/app/(tabs)/index.tsx:213-218` pushes a pin for every place in `places` (418 of them) with no
  viewport check. Only cameras and shops are cut to the view (`camerasForView`, `shopsForView`). Every drive
  also adds a polyline (`:217`), so 129 polylines and 2,217 points are always on the map.
* At the live-meet zoom with Shops on, the preview had **555** markers (120 cameras, up to 90 shops, every
  place, events). After **Show everything** it had about 440, piled over the UK (`rv4-03-show-everything.png`).
* Each marker is a `react-native-svg` `<Svg>` with paths (`src/components/Pin.tsx:33-39`), not an image.
  `tracksViewChanges` (`NightMap.tsx:89`) only applies to Google Maps and Android. On Apple Maps each marker
  is a live React Native view, so the "only live pins track changes" saving does nothing on iPhone.
* The pins memo depends on `region` and `views` (`index.tsx:222`). `views` depends on `now`, and the store
  bumps `now` every 30 s for the whole app (`store.tsx:324-327`). So every pan or zoom (`onRegion={setRegion}`,
  `NightMap.tsx:54-58`) and every 30 s builds about 600 new pin objects with new `coordinate` objects. Every
  `Marker`, its `Pin` SVG, every `Polyline` (`coordinates={p.coords.map(...)}`, `NightMap.tsx:78`) and every
  `Circle` re-render and re-send their props to native. Nothing is memoised.

*Fix (in this order, all JS-only, so they can go out over the air):*
1. Cut places to the view like cameras: only places inside `viewBox(region)` padded by about 50%, capped at
   about 150. At wide zoom (span above about 1.5) show one count badge per region ("Peak District · 14") and
   zoom in when tapped. Make **Show everything** fit what's near you (for example the 60 nearest), not the whole UK.
2. Only draw drive lines when zoomed in (span at or below about 0.6) or for the selected drive.
3. Precompute each place's `{latitude, longitude}` coordinate and path array once (a `useMemo` over
   `places`, or in `placeSpots`), and pass the same objects every render.
4. Wrap the marker in `React.memo` keyed on `id`, `glyph`, `colour`, `size` and `live`. Do the same for `Pin`.
5. Take `now` off the map's dependencies. The map only needs the phase, so recompute `views` when a phase
   could change, not every 30 s. Or split the store context into a slow "data" context and a ticking "clock"
   context, so screens that don't show a countdown don't re-render.
6. Later, behind a native rebuild: use the marker `image` prop with pre-rendered PNG pins for camera, shop and
   place glyphs (about 25 images). MapKit then draws them natively and only live and selected pins stay as views.

Measure before and after on the phone: open the map at Tamworth with Shops on and pan for 10 s; the React
DevTools profiler or `PerformanceObserver` marks around the pins memo are enough.

### Major

**M1. Bundled places are copied into the save once, so place, warning and ban-zone fixes shipped over the air
never reach an existing install.**
*Evidence.* `placeSpots()` freezes each place, including its `banZone` tag (`src/data/places.ts:1051-1054`),
into `state.spots`. On load, `migrate` only adds places whose id isn't already saved (`src/lib/store.tsx:281-284`).
A corrected position, new warning ("single-track", "average-speed cameras"), new description, new region or
**a ban zone added later** never updates the copy the phone already has. The ban-zone warning is a legal
guardrail. The regional commits added zones in batches (`git log`: "Birmingham city-wide zone", "2 zones",
"9 ban zones"), so a place first saved before its zone existed shows no warning. The spot screen also looks the zone
up by name (`src/app/spot/[id].tsx:80`), so renaming a zone silently drops its warning card.
*Fix.* Keep only per-person data in the save: `{ id, completions, ratings }` for bundled places, plus full
records for places people suggest. Join with `PLACES` at read time (one `useMemo` in the store). Work out
`banZone` at read time from the current `BAN_ZONES` and store the zone **id**, not the name. Migrate by
reducing saved bundled copies to their per-person fields. This also fixes M2's size problem.

**M2. The whole state, 315 KB of it, is turned into JSON and written to AsyncStorage on every change, with no
debounce.**
*Evidence.* `store.tsx:319-322` writes `JSON.stringify(state)` in an effect on `[state]`. Toggling a map
layer, ticking a shop kind, every chat message, every check-in and every geocoded stop name rewrites 315 KB
(93% of it unchanged bundled places). On load the same blob is parsed, then `migrate` builds a whole fresh demo
(`fresh()` at `:216`), seeds the scene again (`:267`) and runs `placeSpots` again (`:283`). Before that,
`useState<Persisted>(fresh)` (`:295`) has already built a full demo state that is thrown away when a save
exists. In Node that's about 25 ms of seeding plus JSON. On Hermes on a phone, expect several times that on
the startup path.
*Fix.* After M1 the blob drops to roughly 25 KB. Also debounce the write (about 500 ms, and flush on
`AppState` going to the background). Start `useState` from a cheap placeholder and only call `fresh()` when
there's no save. Run `migrate` only when a stored `schemaVersion` is older than the current one.

**M3. Check-in can record a different vehicle from the one the screen says you're bringing.**
*Evidence.* After adding a second build (an R6) and going to **Coffee and cars** with it, the live **Late
rolling meet** showed "**In the Yamaha YZF-R6 2017-2020 · Stage 2**" above the check-in button and
"**You're bringing Volkswagen Golf R Mk7.5**" just below it (preview text, event `ev-rolling-live`). The seed
event has you going with no `vehicles[me]`. `broughtBuild` falls back to the first build the invite covers
(`src/lib/bringing.ts:82-87`), but the check-in line uses `defaultBuild`, which prefers the **last build
brought to another event** (`bringing.ts:69-77`, used at `src/app/event/[id].tsx:96-98`). Tapping Check in
then saves the R6 as a "something else" vehicle (`event/[id].tsx:138`), which changes the Going list, the
class counts and the award candidates. This happens for every event saved before vehicle picks, and for
anyone going with more than one build.
*Fix.* One rule: `atCheckIn = picked at check-in ?? chosen ?? broughtBuild(...)`. Add a test for "going with
no pick, two builds, last brought differs".

**M4. Venue pins look exactly like meet pins, and other layers share colours with event types.**
*Evidence.* `SPOT_COLOURS.venue` is `C.sodium` like meets, cruises and rolling meets (`src/theme.ts:30-43`),
and the `venue` glyph is the same four dots as `meet` and `show` (`src/components/Pin.tsx:44-55`). On the
first map (`rv4-02-map.png`) most orange "meet" hexagons are cafés and museums. Shows are magenta like photo
spots; track days are lime like tracks. The Events and Venues chips also use the same glyph and colour. On a
map whose point is "what's on tonight", a person can't tell a meet from a café.
*Fix.* Give venues their own glyph (a cup or a flag over a roof) and a colour no event uses (for example a
muted amber outline with a dark fill, or teal). Give events a solid fill and places an outline, so "something
happening" reads differently from "somewhere to go". Make the show glyph differ from meet.

**M5. Ban-zone circles under-cover the orders they stand for, and two meet venues inside the cited
West Midlands injunction carry no warning.**
*Evidence.* `bz-bham`'s own note says it sits "inside the West Midlands car cruising injunction", but only
Birmingham (6.5 mi circle, labelled "whole city") and the Black Country (6 mi) have zones. **Coventry
Transport Museum** (`mw-v-coventry-transport-museum`) and the **National Motorcycle Museum, Bickenhill**
(Solihull, `mw-v-national-motorcycle-museum`) are listed as meet-friendly venues with no `banZone`. A 6.5 mi
circle round the centre also misses parts of Birmingham itself (Longbridge is about 6.9 mi out; Sutton
Coldfield, next to the demo home area, is right on the edge). `bz-bham` (4 mi) sits entirely inside
`bz-mw-birmingham` (same centre), and `bz-norwich` sits inside `bz-broadland-south-norfolk`, so the first match
(and its note) depends on array order (`src/data/banZones.ts`).
*Fix.* Check which boroughs the current West Midlands order covers and add those zones (Coventry, Solihull,
Walsall, Wolverhampton, Dudley, Sandwell if they're in it). For borough- or city-wide orders, use the
council boundary polygon (simplified, from ONS or OSM) instead of a circle, and keep circles for small
PSPOs. Remove `bz-bham`. When a point is in more than one zone, show all of them. Add a test that every
`venue` within an order's council area carries the warning.

**M6. "Add typical parts" and the mod chips add road-illegal mods in one tap, and every mod pays 20 rep.**
*Evidence.* Bike Stage 2 says "Often de-cat and de-restrict" and its typical parts include **De-cat link
pipe** and **De-restricted** (`src/lib/tune.ts:62`, `src/data/catalog.ts:93,123`). The car catalogue has
**Downpipe / decat**, **Pops and bangs map** and **Launch control / anti-lag** (`catalog.ts:95,96,116`).
Removing a catalyst from a road vehicle is an MOT failure and illegal on the road, and pops-and-bangs noise is
exactly what the PSPOs in the ban-zone list target. In the preview, picking Stage 2 then **Add typical
parts (5)** added six mods. Me then showed **"Mods logged ×12, +240"** (six on the sample Golf R, six on
the new bike), so those two taps were worth +120 rep (`src/lib/rep.ts:185,194`). A 25-chip build is +500 rep and nothing checks any of it.
*Fix.* Mark road-illegal parts in the catalogue (`roadLegal: false`), show them with a "Track or off-road
only" tag, never auto-add them with typical parts, and leave them out of the stage descriptions. Cap mod rep
(for example 20 each for the first 10 per build, and none for parts added by "typical parts"), or pay it only
for mods backed by a photo or dyno sheet once the backend can check one.

**M7. Every OTA update ships 6.9 MB of Hermes bytecode, and the install carries about 4 MB of fonts it never
uses.**
*Evidence.* `src/app/_layout.tsx:1-3` imports from the package roots of `@expo-google-fonts/barlow`,
`barlow-condensed` and `chakra-petch`. Each package's `index.js` `require`s every weight (`node_modules/@expo-google-fonts/barlow/index.js`),
so the iOS export lists **46 `.ttf` assets** for the 9 the app loads. The `.hbc` is 6.9 MB and includes the
847 KB shops dataset, 410 KB of vehicle text and about 290 KB of places. `ota.yml` publishes on every push
to `main`, so a data typo fix costs every phone a 6.9 MB download.
*Fix.* Import each font from its subpath (`@expo-google-fonts/barlow/400Regular`), which removes 37 assets.
Check whether EAS Update bundle diffing (bsdiff patches) is available on SDK 58 and turn it on. That's a
native config change, so it needs the next IPA. Move `shops.ts` to a JSON asset loaded with
`expo-asset` + `expo-file-system` on first use of the Shops layer, or fetched per tile later from the backend.
The bytecode then only changes when code changes.

**M8. A fingerprint mismatch between the OTA job and the installed IPA would be silent.**
*Evidence.* `runtimeVersion.policy` is `fingerprint` (`app.json`), which is the right guard. But the OTA job
works out the fingerprint on Linux (`ota.yml`) and the IPA on macOS (`build-ios.yml`), and nothing records,
compares or shows either one. If they differ (a native dependency bump, a config plugin, a platform
difference in autolinking), every update publishes "successfully" and no phone ever gets it. Me › App
updates would keep saying "Up to date" with no clue why.
*Fix.* In `build-ios.yml`, run `npx expo-updates fingerprint:generate --platform ios` and write the hash
to the job summary and an artifact. In `ota.yml`, generate the same hash and print it. Fail or warn when it
doesn't match the latest IPA's ("This update needs a new IPA"). Show `Updates.runtimeVersion` (shortened) in
Me › App updates.

**M9. Shop ids are positions in a tile, so they break or point at a different business after a data refresh.**
*Evidence.* `decodeTile` gives each shop the id `${tile}:${index}` (`src/lib/shopCodec.ts`, `decodeTile`).
Records are sorted by encoded position, so adding or removing one shop renumbers the rest of its tile. A
shared link, a saved selection or the queued "Suggest an edit" message, which carries `name · 52_-2:10`
(`src/app/shop/[id].tsx:174`), then names another business after the next OTA. The preview already shows
the failure mode for a missing id ("This shop is no longer on the map").
*Fix.* Store the OSM element (`n123456` / `w789`) in each record (about 7 more characters each, about 150
KB raw, compresses well) and use it as the id. Keep tile lookup by putting the tile key in front
(`52_-2:n123456`).

### Minor

**m1. The lap-time spectator guard fails open.** `canTimeAt(spot, spectatorOnly = false)`
(`src/lib/laptimes.ts:104`) only refuses spectator venues if the caller says so, and `TrackPanel.tsx:258`
builds `ctx` without `spectatorOnly`. Today the form is hidden for spectator venues (`TrackPanel.tsx:143`), so
times can't be entered for the North West 200 (public roads) or Aberdare Park. But the pure rule is the one the
backend will copy. `tr-bishopscourt` has no `TRACK_INFO` entry at all. *Fix:* have `canTimeAt` read
`isSpectatorVenue(spot.id)` itself and refuse tracks with no `TRACK_INFO` entry. Add a test for `sni-t-nw200`.

**m2. The pace check says people broke the limit when they didn't.** `MAX_AVERAGE_MPH = 45`
(`src/lib/spots.ts:24`) fails a run with "quicker than these roads allow at the speed limits"
(`spots.ts:101-102`). On national-speed-limit A-roads (A9 Berriedale, A87 Glen Shiel, A835) a legal run can
average over 45 mph. *Fix:* reword to "That was quicker than we count for this drive" or set a per-drive
ceiling from its limits. Never imply the person sped.

**m3. Bike generation labels are year ranges, so years show twice.** 135 variants (all bikes) use only
years as their generation (for example `bike:yamaha:yzf-r6:2017-2020:…`). The picker line reads "2017-2020 · 599cc inline-4 ·
2017–2020 · 117 bhp", and the saved build is titled **Yamaha YZF-R6 2017-2020** on the garage card, Going
lists and votes (`modelLabel`, `src/lib/vehicles.ts:270`). *Fix:* when `gen` is only years, leave it out of
`modelLabel` and `variantLine` (keep it in the id), or give bikes real generation names (RJ27 and so on).

**m4. Vehicle ids depend on order.** 39 variant ids only differ by an appended year, and the first of a
clash gets the plain id (`vehicles.ts:149-151`). Inserting a line above an existing one in a later data
batch moves a saved `vehicleId` to a different variant (wrong stock bhp and stages). *Fix:* always append
`:from` when the base id would clash in any batch, or add an explicit id column. Add a test that checks
all ids against a committed snapshot of ids.

**m5. Fuzzy search noise.** "r6 2017" also returns the Honda CBR650F because the squashed text "cbr650f"
contains "r6" (`matchScore`, `vehicles.ts:211-213`). *Fix:* only use squashed matching for queries with a
digit-letter join like "mk7", or need it to start at a word boundary.

**m6. The live check-in area repeats the vehicle.** "In the Volkswagen Golf R Mk7.5" and then a card
"You're bringing Volkswagen Golf R Mk7.5" (`rv4-09-event-live.png`). *Fix:* show one line: "Checking in
with … · Something else?".

**m7. Class tallies mix car and bike scales.** "3A 2B" on cards and Going lists counts a bike A and a car A
the same, although the garage says the scales differ. *Fix:* "Cars 2A 1B · Bikes 1A", or a small bike glyph
before bike letters.

**m8. First open nags about cameras.** Cameras are on by default (`src/lib/settings.ts`), and the home-area
start span is 1.4 (`index.tsx:66`) against a 0.5 limit, so the first map always says **ZOOM IN TO SEE SPEED
CAMERAS**. With Shops on there are two stacked notes and a long credit
(`rv4-06-live-zoom-shops.png`). For a car-meet app, a camera prompt as the first message is also a poor look.
*Fix:* default cameras off, or don't show the "zoom in" note until the person has turned the layer on. Put the
credits in one short line ("© OSM").

**m9. Most camera pins carry no information.** In the preview, most cameras round Tamworth say "limit not
recorded". *Fix:* draw those smaller and dimmer, or only show cameras with a limit or a direction unless
zoomed right in.

**m10. Spectator venues fill the Tracks layer.** 26 of 84 tracks are speedway, oval stock-car, motocross or
closed-road race venues with no track days. *Fix:* a "Racing to watch" choice in the Tracks ▾ menu, off by
default, or show them under Venues.

**m11. Partner pins sit close to event orange.** Partner gold `#ffd23f` next to sodium on a dark map reads as
"event" (`rv4-06-live-zoom-shops.png`). The shop and partner screens label partners properly. *Fix:* give
the partner pin a small "P" or "Partner" tab under the hexagon so the label is on the map too.

**m12. Settings promise features that don't exist.** Me › Privacy has **Cruise mode** ("Arrives in Phase 2"),
**Hide my home area** ("Never show you on the map within a mile of home"; no one is ever shown) and
**Walkie-talkie with strangers**. *Fix:* hide them until they do something, or move them under a "Coming
later" note. Put **Shops** next to **Speed cameras** under Map, as it's also a saved map setting.

**m13. "Sent to the Nightshift team with the next sync" is never true yet.** `SuggestMissing.tsx:73`;
nothing reads `pendingFeedback` except to store it. *Fix:* "Saved on your phone. It'll be sent once the app
has its server." Or send it to the live `feedback` table now, which already exists (`20261117120800_feedback.sql`).

**m14. Photo files can be left behind.** **Reset everything** (`store.tsx:591`) doesn't delete build or
visit photos, and `removeLap` (`lapStore.ts:47`) doesn't delete the proof photo. *Fix:* collect every photo
reference before the reset and call `deletePhotos`. Delete the proof when a time is removed.

**m15. Rep counts sample data.** Me shows "Trophies ×2 +450" and the sample Golf R's six mods as your rep.
It's fine for the demo, but the migration to the backend must not carry sample-derived rep across. Note it in
`BACKEND.md`.

**m16. `showsTraffic` is on** (`NightMap.tsx:59`). Red and amber traffic lines compete with red cameras and
amber events on a night map. *Fix:* turn it off, or make it a Map setting.

**m17. Crop starts on Free for build photos** although the garage card uses the Cover shape. *Fix:*
start on Cover for a build with no photos yet.

**m18. Near-duplicate places.** `tr-llandow` and `kt-llandow` are 0.16 mi apart (two venues, fine). But
`ea-t-swaffham` and `ea-t-hit-the-dirt` (0.25 mi) and `sws-v-loomies` and `sws-v-cm-hut` (0.08 mi) draw
pins on top of each other. *Fix:* check whether each pair is one site. If they're both real, offset the pins
slightly or merge them into one pin with two entries.

**m19. Web only (no action for the phone).** Starting the image picker logs `NotFoundError: Failed to execute
'removeChild'` (expo-image-picker on web). The stand-in map's +/- buttons sit over pins. On web, `shops.ts`
lands in the shared `__common` chunk, so every route loads 847 KB. Load it with `import()` if the web preview
ever becomes a real target.

### Checked and fine

* No duplicate place ids across the four regional files and `places.ts`. Every drive has `miles`, starts on
  its path, and its length matches its line. No duplicate ban-zone ids or names.
* Vehicle data: all 2,134 candidate lines parse (none skipped). No duplicate ids across the three files, no
  odd weights or years, every tuner stage is above stock and in order. Fully electric variants only carry a
  maker unlock figure. Parsing takes about 20 ms in Node, once.
* Shop tiles: the largest (London, `51_-1`) is 2,517 records and decodes in about 5 ms in Node. Tiles are
  decoded lazily and kept.
* Privacy: home saved to about 1 km. Find events gives distances to the fuzzed area only. Commons sends only
  the place's coordinates. Picker photos use `exif: false`, and the plate module writes JPEGs with no
  metadata. People screens never show a location.
* Legal: drives are pass or fail only and the copy never gives a time or speed. Cameras are OSM speed-limit
  data with a caveat and credit, and there's no way to report police. Partners are labelled everywhere,
  including "Sample partner". Spectator venues hide the lap-time form.
* OTA: native-only things (plate module, notifications, image picker) are behind the fingerprint, and
  `ota.yml` typechecks and tests before publishing.

---

## Ten improvements, ranked by impact

1. **Make the map scale (B1).** Viewport culling, clustering at wide zoom, memoised markers, no 30 s map
   re-render, image pins later. Everything else on the map depends on this feeling smooth.
2. **Stop copying bundled data into the save (M1 + M2).** Keep only what each person did, join with the
   bundled data at read time, debounce writes, and add a `schemaVersion`. Data fixes then reach every phone,
   startup gets faster, and the backend swap gets simpler.
3. **A clear map legend.** Events filled, places outlined, one colour per layer, distinct venue and show glyphs
   (M4), and a "?" button that shows the legend.
4. **Ban zones as real boundaries (M5).** Council polygons for borough-wide orders, every zone a point sits
   in, and a "last checked" date on each zone shown in the warning.
5. **Smaller, data-light OTA updates (M7).** Font subpaths, data as assets, bundle diffing, and the
   fingerprint printed and compared in CI (M8).
6. **Road-legal by default in the garage (M6).** Tag track-only parts, keep them out of typical parts, and
   cap or verify mod rep before rep means anything between phones.
7. **Stable ids for external data (M9, m4).** OSM ids for shops and explicit ids for vehicles, with snapshot
   tests so a data refresh can't move people's saved choices.
8. **"Near me tonight" map preset.** One tap: Events and Venues within your travel radius, everything else
   off, and the map fitted to them. That suits the core night-time use better than **Show everything**.
9. **Split the build form into steps.** Vehicle, then Tune (stage, swap, chips), then Photos. The single
   form is now very long (tune stage, engine type, 14 quick-add groups, 12 "something else" categories,
   photos, colour).
10. **Send the queued feedback now (m13).** The table is live, so suggestions for missing cars, mods and
    shops could start arriving from testers today.

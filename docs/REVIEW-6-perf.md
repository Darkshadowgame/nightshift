# Review 6: performance and bug sweep

18 Nov 2026. Static review of the code, then runtime tests of the web export
(`npx expo export --platform web`) in headless Chromium at 393×852 (and 375 wide,
an emulated 1.3× text size, offline, and with a lot of data), using a Playwright script.
No design changes. The iOS fingerprint is still `50073bfef31086c23966e54402238e2827128cd6`.
`tsc` passes and Jest passes (832 tests before, 847 after).

Web timings are from desktop Chrome (V8 with a JIT). An iPhone running Hermes bytecode is
slower, so read them as relative numbers, not as phone numbers.

## Measurements, before and after

| What | Before | After |
|---|---|---|
| Cold load to the sign-in screen (web) | ~1.0 s, one 81–93 ms long task | the same |
| Ban-zone tagging of the 401 bundled places at first render (`bundledSpots`) | 36 ms in Chrome, 366 ms in Jest | 15 ms in Chrome, 59 ms in Jest |
| Map: pins rebuilt on renders that change nothing | every map render rebuilt every pin (2 of 2 in the scripted run) | none (0 of 2) |
| Map: memoised `NightMap` re-rendered on every screen render | yes (inline `compass` object) | no |
| Map: event markers drawn | every visible event in the UK | only events in the view plus a margin, and the selected one |
| Lots of data (1,200 events, 120 builds, 500 chat lines). Opening Find, total long-task time | 1,288 ms / 1,513 ms (worst single task 982 / 1,106 ms) | 369 ms / 277 ms (worst 121 / 105 ms) |
| Same data, typing "night cruise" in Find | 885 ms / 873 ms (worst 686 ms) | 0 ms |
| Same data, Events tab | 531 ms / 448 ms | 329 ms / 308 ms |
| Same data, leaving Find for Notifications | 784 ms / 873 ms | 0 ms |
| Same data, first map render (web stand-in map, every event in one area) | ~1.5 s | ~1.45 s (culling can't help when everything is in view) |
| Console errors and warnings across 40 routes, the demo and offline | 0 (one blocked Commons photo when offline, which the screen handles) | 0 |

Bundle (iOS Hermes export with source map): `entry.hbc` is **5.66 MB**. By source size,
the largest parts are react-native at 2.2 MB, expo-router at 1.3 MB, Reanimated at 0.83 MB,
app data at 0.88 MB (`vehicles.cars` 186 KB, `vehicles.bikes` 132 KB, `places` 96 KB,
`vehicles.everyday` 94 KB, the four region files 53–59 KB each), Supabase at 0.85 MB
(auth-js alone is 441 KB, including `GoTrueAdminApi`, which the app never uses), app
lib at 0.58 MB, and react-native-svg at 0.27 MB. The shop dataset (1.0 MB) is an
asset that is only loaded when the layer is first turned on. Nothing is unexpectedly large.
These fixes don't change the bundle size noticeably.

## Bugs found and fixed (all pushed to main)

| # | Bug | Fix |
|---|---|---|
| B1 | **"Try the demo" opened Credits, with no way out.** Reloading `/` did the same. `credits` was the only route not declared in the root Stack, so it was always allowed. When the screen on show became protected, the router opened the first route still allowed, and that was Credits. | Credits is declared with the signed-in screens. Feedback (the one route open to everyone) is declared last. Checked: Try the demo now opens Welcome, then the map. A brand-new email account goes through the same guard (`!signedOut && !onboarded`), so it's covered by the same change, but it wasn't run against the real backend. |
| B2 | Checking in at stop 2 of the demo's live rolling meet failed with "You've checked in, so your vehicle is set". The seed recorded no vehicle, so the screen sent the fallback build as a "change". | The seed now records the build. The screen only sends a build when one is on record and it differs, or before the first check-in. `checkIn()` records a fitting build when none was on record and never throws for that. Reproduced on the old build and confirmed fixed on the new one; there's a regression test. |
| B3 | Duplicate builds each added mod rep. | Mod rep counts each vehicle (kind, make, model, year) once, with its copies' mods counted together (`vehicleKey`, `duplicateBuild` in `rep.ts`, tested). Adding the same vehicle again shows a warning above Save. |
| B4 | A host could exclude their own vehicle with no warning, and Find said "you can go" for their own event. | The host form warns when none of your builds fits the invite (`hostLeftOut`, tested). Find says "you're hosting" or "you're going". The fuller summary before "Send invites" is left for the redesign. |
| B5 | After the "near home" refusal, the post went out with no place and nothing on screen said so. | The map stays open and shows the reason as its hint. |
| B6 | Tab bar labels were clipped at the bottom. The bar gives the label 10 pt under a 28 pt icon box, and 11 pt capitals need 12. | The icon box is 26 pt (the icons' size) and the label line height is 12. Measured: the label box is 12 px with 12 px of content, so nothing is clipped. |
| B7 | The "new near you" notice and the event showed different times. When the demo's times moved forward, the notice kept the old time in its text. | When the demo is refreshed, each sample nearby notice is rewritten from the moved event (`retimeNearbyNotices`, tested). The notice isn't re-sent. |
| B8 | Another person's build said "Upload a dyno sheet to verify". | Only the owner sees that line. Everyone else sees "Not dyno verified." |
| B9 | "My outgoing request isn't listed". | **Not reproduced.** After tapping Connect, Connections shows a "Sent (1)" section, but at the bottom, below Connections. That's an information-architecture issue, so it's left for the redesign. |
| B10 | A new build's id was regenerated on every render. When the form was opened from a link (no history), `back()` did nothing, so a second save added a second copy. | The id is made once, and with no history the form closes to the Garage. |
| P1 | Road reports and Posts returned a new `[]` on every render while their layers were off (the default), so the map rebuilt and sorted every pin on every render. | One stable empty array for each. An already-empty list isn't replaced. |
| P2 | An inline `compass={{…}}` defeated the `memo` on `NightMap`. | A module constant. |
| P3 | Every visible event got a marker, wherever it was in the UK. On iPhone each marker is a live native view. | `inViewOnly()` in `mapPlaces.ts` (tested) keeps events whose pin, or any stop of a cruise, is in the view plus a margin, and always keeps the selected event. |
| P4 | Find with nothing typed built a card for every upcoming event (up to the server's cap of 1,000) and tore them all down on the second keystroke. Events › Past only grows. A long meet chat redrew every line on each keystroke in its message box. | `firstPage`/`lastPage` in `paging.ts` (tested). Each list shows 30 at a time (chat shows the newest 60), with a "Show N more ›" link. |
| P5 | Ban-zone tests ran ray casting over every polygon for every point. | Each ring has a bounding box, and circles get a latitude check first. A test checks the answers against the plain version for every bundled place point and a grid over the UK. |
| P6 | Drive: if the screen closed (or the app went to the background) while the demo's simulated GPS was reading the first position, the 250 ms timer started after cleanup and never stopped. | It now returns if the screen has closed or the app isn't active. |

## Checked and fine

- **Location watches.** The drive screen (GPS and compass) and the spot screen's drive counter both remove their watches on unmount, on background and on a second start.
- **Realtime channels.** Signed in, the app always holds 3 channels (notices, community, road reports), plus 1 per open event screen. Each one is removed in its effect's cleanup, and channel names are unique, so a remount never reuses a channel that's closing.
- **Timers.** The store's 30 s tick, the clock, the 20 s offline retry and the road-report refresh are all cleared. The 30 s clock lives in its own context, so it doesn't re-render the whole store.
- **AsyncStorage in the demo.** Only changed slices are written, debounced by 500 ms, and saved straight away when the app goes to the background.
- **Empty data** (no events, builds, crews or other people), **long names** (90 characters with no spaces), **0 or 1 items**, **offline** (Supabase and tile hosts blocked) and **not-found ids** on every detail route: no crashes, no errors, and no sideways scrolling at 375 wide. The only things that overflow to the right are the chip scroller in Add build and the photo-credit strip on place pages, which are both horizontal scrollers by design.

## Remaining risks (not fixed)

1. **The one store context.** Every `useStore()` consumer, including the Roads and Community providers and every mounted tab, re-renders on any state change: a chat line, a notice, or a settings toggle. Selectors (for example `useSyncExternalStore` with slices) would fix this, but it's a refactor across about 60 files. It's the biggest remaining performance lever.
2. **The signed-in cache writes the whole state as one JSON string** (up to 1,000 events, 2,000 chat lines and 2,000 builds) on every change, debounced by 500 ms. During a busy meet chat, that's a large `JSON.stringify` up to twice a second on the JS thread. Android also has a 2 MB-per-item limit. The demo's per-slice writes should be used for accounts too, but that needs a cache migration.
3. **The road-reports Realtime channel listens to every change in the country.** Each change makes every client re-read the reports in its view and call `road_rep_for` for every user it knows (up to 2,000 ids), throttled to once a second. The cost grows with clients × reports. It should be filtered (by area, or only while a road layer or a drive is open) or debounced much longer.
4. **Zoomed right out**, every event in the UK still gets a marker (there's no event clustering). Culling only helps once you zoom in.
5. **The server's `check_in` RPC** still refuses a build sent after a check-in with none on record. The client no longer sends one (B2), but a migration should relax the rule to match `lib/events.ts`.
6. **Startup on iPhone.** expo-router loads every route module at launch, which includes about 410 KB of vehicle data source and the place and region data. It hasn't been measured on a device. A startup trace in a release build would show whether lazy routes or lazy data are worth doing.
7. **Web preview only:** the stand-in map's zoom buttons sit under the map's right-hand button stack (a z-index problem). With the emulated 1.3× text size, the Community badge clips. Neither affects the iPhone app.
8. **Lists that are still plain ScrollViews** (People, forum, crews) are capped by the server (60 to 500 rows). They're fine at today's data sizes, but they aren't virtualised.

## Commits

`3d3f08f` B1 · `bb4199e` map pins and culling · `bf06abd` ban zones · `825194c` paging ·
`f85760f` drive timer · `8222deb` B2 · `cb230dc` B3/B10 · `63f2dd5` B4 · `e0113f0` B5 ·
`552bb18` B6 · `88f3d20` B7 · `3f3df01` B8.

# Review: code and web preview (17 Nov 2026, before the iPhone test)

Reviewed: `docs/SPEC.md`, `docs/BACKLOG.md`, `src/`, `modules/plate-redactor/`, `app.json`, `package.json`,
`.github/workflows/build-ios.yml`, plus a full click-through of the web export at 400×820
(screenshots `~/.playwright-mcp/rv-*.png`). Chunks G–I were being built at the same time, so
line numbers are from the working tree at review time. Findings already fixed during the
review (moveOn throwing inside a setState updater, Events notices captured once) are left out.

## Fix pass (17 Nov 2026)

Every finding below was checked against the code after chunks G–I. All 24 are fixed or were
already fixed; none were left as won't fix. Each has a **Status** line.

## Findings, ranked

### Blockers

**1. The plate-redactor Swift module is not in git, so the GitHub iPhone build ships without plate blurring.**
`.gitignore:44` has `ios/` (meant for the generated native folder). It also matches
`modules/plate-redactor/ios/`: `git check-ignore -v modules/plate-redactor/ios/PlateRedactorModule.swift`
→ `.gitignore:44:ios/`. `git ls-files modules/` lists only `expo-module.config.json` and `index.ts`.
On the runner, autolinking finds no podspec (`expo-modules-autolinking/.../apple.js:147` returns early),
so the build succeeds, `plateRedactorAvailable` is false, and every photo is only re-encoded, with plates
visible (`src/lib/photos.ts:26-30`). The README and SPEC say plates are always blurred.
*Fix:* replace lines 41–44 with root-anchored patterns (`/ios/` and `/android/`), then `git add modules/plate-redactor/ios`.
Add a CI step that fails when `modules/plate-redactor/ios/PlateRedactor.podspec` is missing.

> **Status:** Fixed (earlier commit dc26375: root-anchored `/ios/` and `/android/`, sources tracked). This pass added the CI guard: `check.yml` and `build-ios.yml` fail if the podspec or Swift file is missing.

**2. The "rough area" is the exact secret location.**
`src/components/EventForm.tsx:101-104` sets `area` to the average of the placed stops. For a meet or
a one-stop rolling start, that is the exact spot. `index.tsx:56-57` and `event/[id].tsx` then draw the
locked pin and the 3-mile circle centred on it for everyone invited, before the reveal. I checked this in
the preview: the new meet saved `area` = `stops[0].at` to every decimal place. The seed has the same leak:
`ev-meet-tam` area (52.62, -1.72) is 0.3 mi from Ventura Park. On the map, the locked pin sits next to the
live rolling meet's revealed Ventura Park pin (`rv-05-map-peek.png`).
*Fix:* when an event is saved, offset `area` by a random bearing and 1–2.5 miles from the centroid, and keep
it (don't recompute it on every render). Snap it to a 0.05° grid. Use the same offset in the seed.

> **Status:** Fixed. `src/lib/area.ts`: the stops' centre is snapped to a ~2 mi grid and pushed 1–2 mi in a direction picked from the event id, at least 1 mi from every stop (tests check ≥ 0.75 mi over 400 random events and every seed event). The circle is ≥ 3 mi and contains every stop (`areaRadiusMiles`). Worked out once at save, seed uses the same function, and old saves with a leaky area are recomputed on load.

**3. Saved photos live in temp/cache directories, so they disappear.**
The Swift module writes to `FileManager.default.temporaryDirectory/redacted/` (`PlateRedactorModule.swift:226`).
The fallback writes to the ImageManipulator cache (`photos.ts:39`). The `file://` URI is then kept in
AsyncStorage (`build.photos`, `completion.photo`). iOS purges tmp/caches. A Sideloadly reinstall also
changes the app container UUID, which breaks every absolute path. Expect blank build photos within days,
or straight after the next IPA install.
*Fix:* run `npx expo install expo-file-system`. In `finishPhoto`, copy the result into
`Paths.document/photos/<uuid>.jpg` and store only the relative name. Resolve it against `Paths.document`
when rendering.

> **Status:** Fixed. `finishPhoto` copies the redacted or re-encoded file into `Paths.document/photos/` (expo-file-system `File`/`Directory`/`Paths`) and stores only the file name; `photoUri` resolves it at render time. Old absolute paths are migrated best effort (paths into our folder become names; temp files that still exist are rescued).

### Major

**4. Joining any crew gives full host powers over its events, including hidden stops.**
`isHost` (`src/lib/events.ts:20-27`) treats every crew member as a host, and `joinCrew`
(`src/lib/crews.ts:37`) needs no approval. In the preview, one tap on "Join Peak Chasers" made
"Cat and Fiddle sunrise ride" show the full route, Edit and Cancel (`rv-29-crew-join-host.png`). In the real
app, anyone could join a crew and read every secret stop.
*Fix (demo-safe):* make crew hosting opt-in per event, using the named `hostIds` plus crew members who joined
before the event was created. Or make crew joins "requested" until an existing member approves.

> **Status:** Fixed. Crews now have an owner (the creator) and hosts the owner picks. `isHost` only gives crew-event rights to the owner and hosts; joining makes you a plain member. Crew page shows roles with Make host / Remove as host for the owner; the owner leaving hands over to a host. Seed: NightRunners owner @dan_r, hosts @mo.rs3 and you; Peak Chasers @sully_zx + @liv_on_two; Torque Street @kez_typer + @cal_focusrs.

**5. "Request to go" bypasses the invite filter.**
`event/[id].tsx:186`: for someone who isn't invited (role `none`, for example from a shared
`nightshift://event/<id>` link), the button only calls `setGoing(true)`. They become "going" and then see
the place at the reveal time, whatever the class, mods or radius filter says.
*Fix:* for role `none`, add a `requests` list on the event that hosts approve, or show
"You don't match this invite" with the reason (`describeFilter`). Don't add them to `going`.

> **Status:** Fixed. For people the invite doesn't cover, the button makes a pending request (`requests` on the event) with the reason shown; it never adds them to `going`. Hosts see Requests with Approve / Decline; declined people can't ask again. Never auto-approved. Demo: two requests on the Peak District cruise and one on NightRunners late one.

**6. Drive speed check is weak on user-drawn drives.**
A suggested drive can be just two points 23.5 mi apart (`rv-23-suggest.png`). `miles` is the straight
line (`spots.ts:233`), and `judgeRun` allows up to 60 mph over that (`spots.ts:76-78`). On the real road,
which is longer, a "valid" run can average well over the limit. That cuts against the rule that drives
never reward speed (SPEC, App Store 1.4.4).
*Fix:* in `draftProblem`, require a point every ≤2 mi (or ≥1 point per 2 mi of length). Multiply straight-line
miles by about 1.3 for the road estimate, or lower `MAX_AVERAGE_MPH` to 45 for community drives.

> **Status:** Fixed. Suggested drives need points no more than 1.5 mi apart (the long gap is drawn red with the reason; no auto-densifying). Distance is measured along the drawn route (or the stated length if longer), and `MAX_AVERAGE_MPH` is now 45. Still pass or fail only.

**7. Meet copy tells hosts how to avoid police.**
`EventForm.tsx:193`: "Static meets get moved on by police more often, so consider a cruise or rolling
meet." `docs/research/legal.md` says rolling meets with hidden stops already look like evading police, and
SPEC rules out anything police-related. In-app text that steers people to rolling meets *because* they dodge
police is exactly what an injunction hearing would quote.
*Fix:* "One spot. Pick somewhere with permission or a venue that welcomes meets." Also reword seed
`ev-rolling-live` ("Check in at each spot to get the next one" is fine) and the seed track day
(`seed.ts:321` promises "Lap times go on the leaderboard", but there is no leaderboard).

> **Status:** Fixed. Meet copy is now "One spot. Pick somewhere with permission or a venue that welcomes meets." The seed track day no longer promises a leaderboard, and "Retail park takeover" became "Late S/A meet" (arranged with the site).

**8. "Cancel event" has no confirmation.**
`event/[id].tsx:388`: one tap cancels the event for everyone and navigates away, with no undo. Build delete,
crew leave and demo reset all ask first.
*Fix:* use the same two-step pattern ("Cancel event" → "Yes, cancel it" / "Keep it"), and post a system chat line.

> **Status:** Already fixed (two-step confirm in chunk I). This pass also posts "Hosts cancelled the event" in chat.

**9. Build edit has no keyboard handling.**
`src/app/build/edit.tsx:122`: the ScrollView lacks `automaticallyAdjustKeyboardInsets` (every other form has
it). The working tree now has `keyboardDismissMode="interactive"`, but that doesn't move content. On an iPhone
the mod name and bhp-gain inputs at the bottom will sit under the keyboard.
*Fix:* add `automaticallyAdjustKeyboardInsets`.

> **Status:** Already fixed (`automaticallyAdjustKeyboardInsets` added in chunk I).

**10. Demo times go stale after the first launch.**
`seed(new Date())` is only called by `fresh()` (`store.tsx:113`). After that the saved events keep absolute
times. A few hours after install, "Lichfield rolling meet" is over and there's nothing live. The day after,
the crew rolling meet and the "tonight" content are past. If the owner installs tonight and tests tomorrow
evening, the demo looks dead.
*Fix:* store `seededAt` and, on load, shift every seed event (ids `ev-*` from the seed), seed chat and
seed votes by `now - seededAt`. Or add a "Refresh demo times" button next to Reset on Me.

> **Status:** Fixed. `seededAt` is stored. On load (`src/lib/demoTime.ts`), if the scene is still the untouched demo, or is older than 6 hours, seeded events move back to where a fresh seed would put them, with their stop reveals, plan changes and votes moving with them, and seed-event chat moving by the time since. Events made on the phone aren't touched. Tested.

### Minor

**11.** `findPlates` returns `{width:1,height:1}` on a native error (`photos.ts:21`). The callers use
`found?.width || a.width`, and 1 is truthy, so the review image becomes square and the tap-to-add boxes land
in the wrong place. *Fix:* return `null` in the catch.

> **Status:** Fixed: `findPlates` returns `null` on error.

**12.** Editing an event whose reveal is "Straight away" silently changes it to 60 minutes:
`useState(initial?.revealMinutesBefore || 60)` (`EventForm.tsx:96`). *Fix:* use `??`.

> **Status:** Fixed: `??`.

**13.** `areaName` is the host's region ("Midlands"), not where the event is (`EventForm.tsx:152`).
A Peak District cruise shows "· MIDLANDS". *Fix:* add an "Area name" input defaulting to the nearest
`REGIONS` entry to the fuzzed area.

> **Status:** Fixed: an Area name field, defaulting to the region nearest the fuzzed area.

**14.** An unnamed stop is saved as "Place" (`EventForm.tsx:117-121`). Event cards then read "Place"
(`rv-30-events.png`). *Fix:* require a name, or default to "Meet spot" / "Stop 1".

> **Status:** Fixed: unnamed stops default to "Meet spot", "Show venue" or "Circuit" (cruise and rolling labels as before).

**15.** Switching type from cruise to meet keeps the hidden second stop in `placed`
(`EventForm.tsx:101`), so it still shifts `area` and can raise ban-zone warnings for a stop that isn't
shown. *Fix:* compute `placed` from `visibleStops`.

> **Status:** Fixed: `placed` (area, ban warnings) only uses the stops the type shows.

**16.** Me says "3 EVENTS HOSTED" while the rep breakdown says "Events hosted ×0" (`me.tsx:27,41`). The
first counts future and crew events. *Fix:* label it "HOSTING" or count only finished events, as
`publicProfile` does.

> **Status:** Fixed: Me shows "HOSTING n" for current events you host (as worked out by `isHost`).

**17.** Headings are italic on web but upright on the iPhone. RN iOS only uses italic faces that exist
(`RCTFont.mm` matches `isItalic` to loaded faces, then falls back to `names[0]`), and only
ChakraPetch_700Bold/600SemiBold upright are loaded (`ui.tsx:29`, `ClassBadge` `ui.tsx:116`). *Fix:* load
`ChakraPetch_700Bold_Italic` from `@expo-google-fonts/chakra-petch` and use it as `F.displayItalic`, or
drop `fontStyle` and use `transform: [{ skewX: '-8deg' }]` as the badges do.

> **Status:** Fixed: Chakra Petch 700 and 600 italics are loaded and used as `F.displayItalic` / `F.displayMedItalic` everywhere headings were italic; no `fontStyle` left.

**18.** Best car needs `cars >= 2 && bikes >= 1`, but Best bike only needs `bikes >= 2`
(`awards.ts:89-90`). An all-bike meet gets "Best bike", but an all-car meet never gets "Best car". SPEC
says both apply "when both turn up". *Fix:* `bikes >= 2 && cars >= 1`.

> **Status:** Fixed: Best bike now needs `bikes >= 2 && cars >= 1`, the same rule as Best car. Tested.

**19.** Live events put the full voting block (7 award rows of horizontal cards) above Chat
(`event/[id].tsx:318` vs `:336`). During a live rolling meet, chat is where people look, and it's buried.
*Fix:* during `live`, collapse voting into one "Vote (7 awards) ›" row, or move it under chat until the end.

> **Status:** Fixed: while the event is on, voting is one row ("Vote (n awards) ›") that expands on tap, so chat isn't buried.

**20.** The podspec has no `swift_version` (`modules/plate-redactor/ios/PlateRedactor.podspec`). It
inherits the app target's version, which works today. Expo's own modules pin `5.9`, and
`static let patterns` (`PlateRedactorModule.swift:80`) would be a Swift 6 strict-concurrency error if the
default ever changes. *Fix:* add `s.swift_version = '5.9'`. The rest of the Swift (AsyncFunction + `Promise`
as the last argument, `VNRecognizeTextRequest`, `CIPixellate`, `CGImageDestination` with no metadata,
`UTType.jpeg`) checks out against the Expo Modules API and the iOS 16.4 target.

> **Status:** Already fixed (`s.swift_version` added to the podspec).

**21.** A new user is pre-joined to NightRunners and owns a pre-made Golf R with two trophies they didn't
win (`seed.ts:41-46`). It's confusing on a real first run ("whose car is this?"). *Fix:* after welcome, show
a one-line card in the Garage: "This is a sample build. Edit it or add your own". Or leave ME out of the crew
and the votes.

> **Status:** Fixed (light touch): a one-line card in the Garage says the Golf R and its trophies are a sample, until you edit it. The demo user stays in NightRunners so hosting can be tried.

**22.** App icon and splash are still the Expo template (`assets/icon.png` is the blue "A" on graph paper).
There's no `expo-splash-screen` config, so the launch screen won't match the dark theme. *Fix:* a 1024 px
sodium-orange hexagon icon on `#0b0f17`, and add a splash `{ image, backgroundColor: '#0b0f17' }` to
app.json.

> **Status:** Fixed. Original icon (`assets/icon.png`, 1024 px, no alpha; source `assets/brand/icon.svg`): sodium-orange hexagon badge in the pin style with a moon over a road, on asphalt. Dark splash via the `expo-splash-screen` config plugin (`#0b0f17`, the badge at 200 pt). Android adaptive icon and favicon regenerated to match.

**23.** Handles are uppercased inside vote cards ("@DAN_R") but lowercase everywhere else, because
`Txt v="label"` uppercases. *Fix:* use `v="mono"` with `textTransform: 'none'` for handles.

> **Status:** Fixed: handles in vote cards use the mono style without uppercasing.

**24.** Chat is open to anyone who can open the event, including people who aren't going or invited
(`event/[id].tsx:336-`). The placeholder says "Message everyone going". *Fix:* show chat only to
hosts and people going (it can carry "here, far end of the car park" detail).

> **Status:** Fixed: chat shows only to hosts and people going; others see why.

## Improvement ideas for tomorrow's test (max 8)

1. **Fix items 1–3 before building the IPA.** Plate blur, location privacy and photo persistence are the
   things a real iPhone exposes that the web preview can't.
2. **"Refresh demo times" on Me.** It keeps a live rolling meet, a meet unlocking soon and a past meet
   with trophies on screen whenever the owner opens the app.
3. **A real icon and a dark splash.** It's the first thing seen on the home screen, and right now it says "Expo template".
4. **Put check-in first on live events.** Make "Check in" the primary button above "Going ✓". Shrink "Going" to a
   small toggle once checked in. On a live meet, show the current stop name big at the top.
5. **Map: tap empty space to close the peek card, and make overlapping pins tappable.** Track day events sit
   exactly on top of their track pins (Curborough, Donington), and stacked pins are hard to hit.
6. **First-run follow-up.** After "Let's go", go to the Garage with "Add your car or bike" in place of the sample Golf R,
   so invites and class letters feel like *theirs*.
7. **Confirm every destructive or public action in one place.** Cancel event, Move on and Leave crew should
   use one shared confirm row component, with haptics from chunk H.
8. **Name the stops for people.** Defaulting to "Place" makes cards look unfinished. Prefill names from the
   picked known spot (already done for grey pins) and otherwise require one.

# Review 6: one design language (18 Nov 2026)

A design-only audit. The question is not "is each screen OK" (Review 5 did that) but "does the app
speak one language". It doesn't. Nothing in `src/` was changed.

**Method.** Read `src/theme.ts`, `src/components/ui.tsx`, every component in `src/components` and
every route in `src/app`, plus `docs/REVIEW-5.md` and `docs/MAP-REDESIGN.md`. Counted patterns with
grep across `src/app` and `src/components` (the counts below are from that, at commit `30a34ae`).
Built the web preview (`npx expo export --platform web`, served with an SPA fallback), and took 117
screenshots at 393x852 @3x with a standalone Playwright script, in the demo, of every route and the
main states (sheet detents, layers panel, selected pin, every segment of Events, Community and Find,
scrolled pages). Screenshot names are quoted below as `name.png`; they live in a local scratch folder
and are not committed (re-run the script to regenerate). The web map has no Apple tiles; ignored.

---

## Verdict

1. The **parts** are strong (sodium on asphalt, hexagon pins, condensed caps, HUD stat tiles), but there is **no grammar**: every screen re-invents how to show a person, a build, an event and a place, so the same thing looks different two taps apart.
2. `ui.tsx` is a **kit nobody is forced to use**: `SPACE` has 0 uses, `ListRow` 16, `Segmented` 5 against ~40 chips doing its job, 80 raw `<Text>`, 135 colour overrides on `Txt`, 20 radius values.
3. **Every screen shouts.** Caps on titles, caps on buttons, caps on tags, caps on meta, eyebrows on every block, 5–6 stacked full-width buttons on an event, a left accent bar with seven meanings. When everything is emphasised, nothing is.
4. **Navigation has no owner**: Find has 8 doors, people have 2 directories, settings live in 3 places, the bell is on 2 of 5 tabs, and tapping "Try the demo" drops you on the **Credits** page.
5. Fixable in a week of component work, not a redesign: one entity anatomy, one row, one control per job, three button tiers, sentence-case content, and a lint rule that stops the drift coming back.

---

## 1. Patterns used for the same job

Counts are JSX call sites in `src/app` + `src/components`.

### 1.1 Showing a person (7 variants)

| # | Variant | Where | Screenshot |
|---|---|---|---|
| P1 | Hex letter `Avatar` (sodium outline) + `@handle` + tags | feed `Community.tsx:20`, post, forum `forum/[id].tsx:107,134`, connections `connections.tsx:41`, user hero `user/[id].tsx:112` | `20-community-feed.png`, `88-connections.png` |
| P2 | **Class badge standing in for the person** + `@handle` + build line | event Going and Requests `event/[id].tsx:552,599`, crew members `crew/[id].tsx:141` | `50-event-live-s1.png`, `75-crew.png` |
| P3 | Build-first `PersonCard` (photo, class stamp, distance, then avatar) | Community › People `Community.tsx:74` | `21-community-people.png` |
| P4 | Handle text only, no mark | New chat `chat/new.tsx:64` | `87-chat-new.png` |
| P7 | The **Me tab icon** as the avatar, name as title, handle as subtitle | Find › People `find.tsx:215` | `95-find-typed.png` |
| P5 | Avatar on the **right**, handle left, Admin tag | Group info `chat/info.tsx:63-70` | `86-chat-info.png` |
| P6 | Sodium caps handle above a bubble | event chat `event/[id].tsx:669`, chat `chat/[id].tsx:128` | `50-event-live-s2.png`, `85-chat-group.png` |

Avatar sizes in use: 28, 34, 36, 42, 76 (5 sizes). "You" is written `You` (event, crew),
`@reviewer (you)` (group info) and `@reviewer` (Me). Missing build: "No vehicle" (event), "No build yet"
(crew), "no builds yet" (People), "No builds yet." (profile).

### 1.2 Showing a build (8 variants)

| # | Variant | Where | Screenshot |
|---|---|---|---|
| B1 | `BuildHero` (art, class stamp, trophy tag) + caps `h2` name + 3 `Stat`s | Garage `garage.tsx:44-56` | `30-garage.png` |
| B2 | `BuildHero` + `h1` name + 3 *different* stats + `StatBar`s | Build `build/[id].tsx` | `70-build.png` |
| B3 | `BuildLine` (class badge, sentence-case name, caps mono "583 BHP · 4 MODS") | feed, post, forum `Community.tsx:50` | `20-community-feed.png`, `82-forum-thread.png` |
| B4 | Photo + stamp inside `PersonCard` | People `Community.tsx:83` | `21-community-people.png` |
| B5 | Grid tile (art + name + mono) | profile garage | `72-user.png` |
| B6 | Swipe card with sentence-case `h2` (caps switched off) | Rate builds `rate.tsx:96` | `77-rate.png` |
| B7 | Trophy cover art (`Cover`) | build, past event | `70-build-s1.png`, `54-event-past.png` |
| B8 | Share card with "BUILD" eyebrow inside a bubble | chat | `85-chat-group.png` |

The stat triplet itself differs: Garage shows *bhp · dyno / bhp per tonne / mods*, Build shows
*bhp · est. / lb-ft / bhp per tonne*. The mono line is caps ("583 BHP · 4 MODS", hard-coded in
`Community.tsx:56,112`, `rate.tsx:97`) although Review 5 m2 said mono keeps its case.

### 1.3 Showing an event (7 variants)

| # | Variant | Where | Screenshot |
|---|---|---|---|
| E1 | `EventCard`: pin, type label in layer colour, Sample tag, role tag, **caps h3 title**, mono when-line, place, filter caption, note | Events, Find, crew `EventCard.tsx` | `10-events-mine.png`, `91-find.png` |
| E2 | Sheet `EventRow`: pin, **sentence-case** title, caption meta, role tag | Map sheet `index.tsx:906` | `04-map-sheet-half.png` |
| E3 | Sheet `LeadRow`: pulse pin, eyebrow, h3, mono, countdown `h2` on the right | Map peek `index.tsx:933` | `03-map.png` |
| E4 | Selected-pin card: caps title, meta line in the layer colour (sodium for events), ✕, primary "Open event" | Map `index.tsx:718-730` | `08-map-selected.png` |
| E5 | Notification card: sodium accent, eyebrow "STARTING SOON · 2 MIN AGO", body, "Open event ›" | `notifications.tsx:66` | `90-notifications.png` |
| E6 | Event hero: type eyebrow, italic caps `h1`, mono, stats, embedded map | `event/[id].tsx:249` | `50-event-live.png` |
| E7 | Chat share card | chat | `85-chat-group.png` |

The same event title is "NIGHTRUNNERS LATE ONE" in E1, "NightRunners late one" in E2, and
"NightRunners late one starts in 30 min" in E5.

### 1.4 Showing a place (7 variants)

| # | Variant | Where | Screenshot |
|---|---|---|---|
| L1 | `ListRow` + pin, "Track · Staffordshire · 9.9 mi" | Map sheet "Places on the map" `index.tsx:816` | `04-map-sheet-half.png` |
| L2 | `ListRow` "Drive · waiting for approval" | Me › Your places `me.tsx:85` | `40-me-s1.png` |
| L3 | `ListRow` with location pin | Where to? `where.tsx:167-205` | `67-where.png` |
| L4 | Place hero: layer eyebrow, italic caps h1, caps meta, "Before you go" card, map, actions | `spot/[id].tsx:112` | `60-spot-drive.png`, `62-spot-track.png` |
| L5 | Shop hero: "★ SAMPLE PARTNER" tag instead of eyebrow, hours table | `shop/[id].tsx:94` | `65-shop-partner.png` |
| L6 | `ZoneCard` (amber accent, mono kind + **raw id**) | `ZoneCard.tsx:23` | `66-zone.png` |
| L7 | Map selected card | `index.tsx` | `08-map-selected.png` |

The order of blocks on a place page changes per kind: the map comes before the actions on a drive,
after "Before you go" on a photo spot, and before actions on a track, venue and shop.

### 1.5 Lists, rows and cards

| Job | Variants | Notes |
|---|---|---|
| List row | **12**: `ListRow` (16 uses in 9 files), `EventRow`, `LeadRow`, `ThreadRow`, `ConversationRow`, `BuildLine`, going row (`event/[id].tsx:599`), request row (`:552`), crew member row (`crew/[id].tsx:141`), connection row (`connections.tsx:41`), new-chat row (`chat/new.tsx:64`, Add button), group member row (`chat/info.tsx:63`) | `ListRow` has no leading avatar, no meta line, no trailing tag slot, so every screen with a person or event rolls its own |
| Card | `Card` 116 uses in 46 files; variants solid/raised/glass/muted; plus bespoke surfaces: map hint (`index.tsx` `st.hint`), sheet action tiles (`st.action`), `PersonCard`, `PostCard`, LayersPanel tiles, rate card | Cards nest cards (Me › Rep, crew hero inside a card while event/place heroes sit on the page: `75-crew.png` vs `50-event-live.png`) |
| Card accent bar | 36 uses, **7 meanings**: brand ×14 (crew, rep, notices, active stop), warning ×5, success ×4, event type, layer (drive, track, partner), danger (confirm), "fresh" notification | `40-me.png`, `74-crews.png`, `52-event-hosting-s1.png`, `82-forum-thread-s1.png` |

### 1.6 Headers and section titles

| Job | Variants |
|---|---|
| Screen header | Tab header (caps by style, `(tabs)/_layout.tsx:150`); stack header (caps by `title()` string); chat header **sentence case** (`chat/[id].tsx:69`); blank header + hero (event, place, build, user, post, forum); no header, map pill instead (Map); custom full-screen with its own "BACK" box (`drive.tsx:149`, `99-drive.png`); Report has header "REPORT" **and** an `h2` "REPORT THIS POST" (`report.tsx:108`, `89-report.png`) |
| Section title | `Section` eyebrow + hairline (115 uses); `SheetSection` fog `micro`, no rule (`index.tsx:893`, "TONIGHT", "THIS WEEK" in `04-map-sheet-half.png`); `Section colour=` in layer or live colour (3: `62-spot-track.png` "THE TRACK" in lime); bare `Txt v="eyebrow"` outside `Section` (12: hero kinds, "How the map works", "What are you bringing?", Rep, crew); in-card fog `label` ("MOVE", "RENAME" in `58-event-plan.png`; "LAP RECORDS" in `62-spot-track-s1.png`) |
| Form field label | Section eyebrow per field (`ProfileForm.tsx:97,111,122`, EventForm; `01-welcome.png`, `56-event-new.png`); fog `label` above input (`EventForm.tsx:396` "AREA NAME", build `Field` `build/edit.tsx:336`); label **inside** the box (`SearchSelect.tsx:63` "MAKE", `71-build-new.png`) |

### 1.7 Actions

| Job | Variants |
|---|---|
| Primary | `Button` primary (one per screen by rule) — broken on Connections (an orange **Accept** per row, `88-connections.png`) and on the map first-run (`02-map-first-run.png`: the sheet plus "Got it") |
| Secondary | `Button` secondary; `ghost` is an alias that is still accepted (`ui.tsx:144`); outlined "ADD" mini-buttons (`87-chat-new.png`); "Change" small button in a bespoke row (`55-event-cruise.png`); sheet action tiles (`index.tsx:884`) |
| Tertiary / link | `LinkText` 45 uses (sodium caps "Open ›"); "Open ›" as plain `Txt` (Garage, CrewCard, not a link role); `HeaderAction` (7); fog centred caps "REPORT THIS EVENT" (`50-event-live-s2.png`); "···" text as an icon (4 screens) |
| Destructive | `Button` danger (outline red): "Decline", "Block", "Leave the group", "Reset demo data", "Remove this stop". Approve next to Decline is **secondary**, so the only coloured choice is the destructive one (`52-event-hosting-s1.png`) |
| Disabled | Kerb fill + fog text reads as a fourth button style, with no reason shown: "SEND FEEDBACK" (`96-feedback.png`), "COMMENT" (`80-post.png`), "PICK SOMEONE" (`87-chat-new.png`), "CHECK FOR UPDATES" (`41-settings-s5.png`) |
| Button stacks | Event (going, live): Check in, Start navigation, Open in another app ›, Can't make it, Share = **5**; hosting adds Change the plan and Edit = **6** (`52-event-hosting.png`) |

### 1.8 Tags, chips, tabs

| Job | Variants |
|---|---|
| Tag | `Tag` 47 uses (tone or raw colour, outline or solid); `SampleTag` 15; `LegendTag` 4; `LevelTag` (its own skewed box, `Rep.tsx:38`); class stamp inside `BuildHero`; trophy count tag; "• LIVE NOW" tag; pill badges (map "N new", tab badge, unread count circles in Messages) |
| Single choice | **~40 `Chip`s used as radio buttons** (`grep "on={x === "`: settings nav map, travel, alerts, region, report reason, feedback kind, event type/day/time, stop picker, forum sort, feed scope, car/bike, drive/photo spot, layouts…) vs `Segmented` **5** (Events, Community, Find, post visibility, share picker). The `Chip` docstring says "multi-select" (`ui.tsx:72`) |
| Same choice, two controls | Feed scope "Near you / Connections" = chips (`CommunityFeed.tsx:21`); post visibility "Public / Connections" = segmented (`post/new.tsx:91`). Compare `20-community-feed.png` and `81-post-new.png` |
| Chip colour | Sodium by rule, but layer colours on chips: lime CARS/BIKES on tracks (`62-spot-track-s1.png`, Layers panel `07-map-layers.png`), cyan DRIVE (`spot/new.tsx:99`, `64-spot-new.png`) |
| Case | Caps chips next to raw-case chips in one row: "CARS BIKES S A B" then "Audi BMW Citroën" (`21-community-people.png`); feedback kind chips are raw (`96-feedback.png`), report reasons are raw full-width chips used as a radio list (`89-report.png`) |

### 1.9 States: empty, loading, error, confirm

| Job | Variants |
|---|---|
| Empty | `EmptyState` 22 uses in 16 files; ~22 bare muted lines ("No comments yet." `post/[id].tsx:98`, "Nobody yet." `event/[id].tsx:593`, "No members yet." `crew/[id].tsx:134`…); a centred bell + h3 (`notifications.tsx:47`); the sheet's own h3 + links (`index.tsx:760`); Find › Places is a hint line with nothing to browse (`93-find-places.png`) |
| Loading | Spinner in a button (`busy`); spinner at the right of an input (`where.tsx:147`, `PlaceSearch.tsx:68`); centred spinner (`CommonsStrip.tsx:37`, root gate); "Loading threads…" text (`CommunityForum.tsx:55`), "Loading reports…", "Loading the listing…"; label swaps "Checking…" / "Finding you…" / "Blocking…" **and** `busy` spinner at once (`spot/[id].tsx:553`, `report.tsx:103`). No skeletons anywhere |
| Error | `InlineError` 64 uses (good, one style); errors also inside the map note line ("COULDN'T LOAD SHOPS", caps, `index.tsx:508`). Copy: "Could not" ×57 vs "Couldn't" ×21 |
| Confirmation | `ConfirmBox` 9 uses (in-place); Approve/Decline pairs without confirm; destructive "Leave the group" (`86-chat-info.png`) and "Reset demo data" open a ConfirmBox, "Decline" and "Block" on Connections act at once |
| Success | `feel.success()` + toast-less text; check-in burst only on events (`event/[id].tsx:319`), not on spots (`spot/[id].tsx:345` buzzes only); green "Starts Tonight 22:30" (`56-event-new.png`), green "HOME AREA SET" + green map border (`73-profile-edit.png`) |

### 1.10 Sheets, modals, search, stats

| Job | Variants |
|---|---|
| Sheet / modal | Native modal route (11: host, edit, build edit, profile, suggest, crew new, feedback, post new, forum new, chat new, report); native push for similar jobs (change the plan, settings, group info, connections); `fullScreenModal` (drive); RN `<Modal>` ×8: slide ×5, fade ×1 (`OptionsSheet`, `Community.tsx:280`), none ×1, reduced-motion switch ×1; `presentationStyle` fullScreen ×2, pageSheet ×1, transparent bottom panel ×4 (Layers, NavLaunch, DriveHud picker, OptionsSheet). The Map's own `MapSheet` is a fifth thing |
| Search field | Map pill (a button, not a field, `index.tsx:658`); Find (`find.tsx:164`); Where to? (`where.tsx:137`, own screen, also a row inside Find); `PlaceSearch`; `SearchSelect` (label inside); forum "Search thread titles"; `SharePicker`; `VehiclePicker` "Quick search". Only Where to? has a search icon; none has a clear button |
| Stat | `Stat` tile (15); `StatBar` (5); Me's inline caps "1 BUILD · HOSTING 2 NOW · 2 TROPHIES" (`me.tsx:53`); crew's "4 MEMBERS · 2 EVENTS · 2,235 REP COMBINED" with a sodium number (`75-crew.png`); rep "720" `h1` + `LevelTag` (`40-me.png`); map countdown `h2` (`03-map.png`); lap times `h3` tabular (`62-spot-track-s1.png`) |
| Tabs in a screen | `Segmented` (sodium fill) vs chip rows vs the Layers panel's tiles (`07-map-layers.png`) |

---

## 2. Tokens

| Token | Defined | Used outside | Detail |
|---|---|---|---|
| Colour (hex) | `C`, `LAYER`, `STATE`, `CLASS`, `SURFACE` | **24** raw hex in 11 files | 9 in `build/edit.tsx:22` (the card colour list is the raw layer and state hexes: `#3fd6ff` drive, `#ff4fa3` photo, `#9dfa5a` track, `#ff4d4d` danger); `#111827` twice (`Cover.tsx:55`, `BuildArt.tsx:9`) — a sixth surface colour not in `SURFACE`; `#0b0f17` re-declared as `INK` in `Pin.tsx:53` and `NavIcon.tsx:6`; `CAMERA_DIM #c45a5a` (`index.tsx:70`); DriveHud `#3a0d0d`, `#d61f1f`, `#111111` |
| Colour (rgba) | `SURFACE.glass/glassRaised/scrim` | **7** | 6 different scrims/overlays (`Cover.tsx:24` 0.35, `CropEditor.tsx:235` 0.66, `PlateReview.tsx:73`, `MapPicker.tsx:326`, `motion.tsx:357`, `#000` scrim in `motion.tsx:327`) — `SURFACE.scrim` is used by none of them |
| Alpha suffixes | none | **19** | `${c}1f` ×9, `99` ×6, `66`, `40`, `22`, `1c`: 6 alphas for "tint", "line" and "outline" |
| Font size | `TYPE` (9 steps), `DRIVE_TYPE` | **35** literals, 14 distinct values (9…66) | Outside the driving view: `ui.tsx:199` button 18/13, `ui.tsx:553` input 16, headers 17 (`_layout.tsx:51`, `(tabs)/_layout.tsx:150`, `chat/[id].tsx:69`), tab label 11, `Pin.tsx` 11, `SearchSelect`, `ModPicker`, `BuildHero`, `signin` |
| Font family | `F` (9 faces) | **94** inline `fontFamily` | labelBold ×25, display ×22, bodyBold ×16, label ×14 — mostly on raw `<Text>` |
| Text component | `Txt` (10 variants) | **80** raw `<Text>` in 19 files | DriveHud 21, RoadReportControls 10, `ui.tsx` 8, `Cover` 8, `SearchSelect` 5, `Community` 4 |
| `Txt` overrides | — | 33 override size/family, **135 override colour** | colour overrides: `BRAND` ×30, chalk ×24, warning ×13, fog ×10, danger ×6, success ×5 |
| Case overrides | — | `textTransform: 'none'` ×23, `'uppercase'` ×28 | plus hard-coded caps strings: "NOT HOSTING" and `.toUpperCase()` (`me.tsx:51-53`), "CHECKED IN" (`spot/[id].tsx:119`), "HOME AREA SET…" (`ProfileForm.tsx:141`), "NOT PLACED", "DRAW THE DRIVE" (`spot/new.tsx:154,239`), "PLACE THE NEW STOP" (`event/plan.tsx:242`), "ZOOM IN TO SEE…" (`index.tsx:509`), "MODS"/"BHP" mono |
| Spacing | `SPACE` {16, 20, 8, 12, 40} | **0 uses** | `gap` takes 16 values (1, 2, 3, 4, 6, 8, 10, 12, 14, 16, 18, 20, 24, 28…); padding 23 values. Screens use `gap: 18` (Garage) and `gap: 20` and `gap: 28` (Welcome) for the same section rhythm |
| Radius | `RADIUS` {4, 8, 12, 999} | 62 token uses vs **44 literals, 20 values** | 12 ×10 (DriveHud, RoadReportControls, map embeds), 4 ×6, 8 ×5, **6 ×4** (cover, sign-in checkbox, commons strip, plate review), **10 ×2** (`spot/new.tsx:123`, `BuildArt.tsx:9`), 3, 9, 11, 13, 15, 17, 20, 22, 24, 29, 48 |
| Shadow | none | 3 | `MapSheet.tsx:171` (0.5/16), `index.tsx:977` (0.4/10), `index.tsx:984` (0.4/8): three shadows for one layer of floating chrome |

**Type styles in use** (`Txt v=`): caption 153, body 98, muted 136, label 97, mono 55, h3 27, micro 19,
eyebrow 13, h2 12, h1 11. Three secondary-text styles (muted 14, caption 13, mono 13) are used
interchangeably for the same meta line: the event's meta is `mono` in `EventCard`, `caption` in the
sheet's `EventRow` and sodium `label` in the selected card.

**Eyebrows, mono and capitals.** `label`, `micro`, `eyebrow`, `chip`, `tag`, `Button`, `HeaderAction`,
`LinkText`, `Stat` label, `StatBar` label, `h1`, `h2`, `h3` are **all uppercase**. Only body, muted,
caption and mono are not. Result: on `50-event-live.png` 14 of 22 text runs are caps. Content titles
(events, builds, places, crews) are caps through `h1`–`h3`, except where someone switched it off (thread
titles, chat headers, rate card, handles), so user content is randomly shouted or not.

**Colour meaning vs use**

| Token | Intended (`theme.ts`) | Also used for |
|---|---|---|
| Sodium `BRAND` | primary buttons, links, eyebrows, unread, selected | 25 info lines (`about 1 mi from home · you can go` in `91-find.png`; "Rolling meet · Going · Live · ends in 3h" in `08-map-selected.png`); the **event layer**, so every event pin, tag and accent is the action colour; avatars (every person is sodium); rep, level and "Legend"; the "Open ›" that isn't a link |
| `STATE.success` | checked in, saved, going | going tag, "Solved", success accent bars, form summaries ("Starts Tonight 22:30"), map border when home is set |
| `STATE.warning` | before you go, ban zones, waiting | Requests card, "Your rep" level, crew-leave consequences in amber body text (`76-crew-new.png`) |
| Layer colours | map and place identity only | chips (lime, cyan), section titles (lime "THE TRACK"), build card colours (`build/edit.tsx:22`) |
| `STATE.live` (white) | live | the "LIVE NOW" tag, the countdown, and also any `Tag tone="live"` — white reads as plain text |

---

## 3. Iconography

| Family | What | Where | Style |
|---|---|---|---|
| Hex pins (`Pin.tsx`, ~45 glyphs) | map layers, events, shops, road reports, tab icons, empty states, sheet action tiles, list rows | everywhere | filled hex (events) or outlined hex (places), 2.5 stroke; **13 sizes in use** (18–56) |
| Line icons | search (`FindIcon`), layers, near me (`index.tsx:90-109`), bell (`NoticeBell.tsx:7`) | map chrome, Events header | thin stroke, no hex |
| Turn icons | `NavIcon.tsx` (19 paths) | driving view | filled arrows |
| Illustrations | `BuildArt` silhouettes, `Cover` trophy art, `Wordmark` | Garage, build, People, trophies | outline car with glow |
| Unicode as icons | `›` ×88, `…` ×42, `✓` ×7, `⚠` ×5, `★` ×5, `▾` ×3, `−` ×3, `✕` ×2, `♥`/`♡` ×3, `▲`/`△` (forum Helpful, `forum/[id].tsx:157`), `···` as a header button (4), `+` prefixed into labels ("+ Host", "+ Post", "+ Add a car or bike") | text | depends on the font: `♥` and `△` sit in Barlow, `✕` in Chakra |

Mixed in one view: `20-community-feed.png` has a hex letter avatar, a skewed class badge, a Unicode
heart, a text "···" and a sodium "›". The tab bar uses hex-framed glyphs while the header bell next to
it is a bare line icon (`10-events-mine.png`). Close is a `✕` text glyph (`index.tsx:729`); remove is a
red `✕` (`ModPicker.tsx:214`); back is the native chevron.

---

## 4. Navigation model

**Tabs** (`(tabs)/_layout.tsx`): Map, Events, Community, Garage, Me.

| Tab | Header | Header actions |
|---|---|---|
| Map | none (search pill + bell on the map) | — |
| Events | "EVENTS" | bell, Find, + Host (3) |
| Community | "COMMUNITY" | **one action that changes per segment**: + Post / Requests 2 / + Thread / + Chat (`community.tsx:34-38`) |
| Garage | "GARAGE" | **none**; add is a secondary button at the bottom of the list |
| Me | "ME" | Settings (and an "All settings ›" link at the bottom, `me.tsx:104`) |

**Stacks and modals.** 33 stack routes. Create flows are modals except "Change the plan" (push) and
"Start a crew" (modal) vs "Rate builds" (push). Detail screens have a blank title and a hero, except
crew, whose hero is a card, and Report, which has both a header and a hero title.

**Where similar things live in different places**

| Thing | Places | Fix |
|---|---|---|
| Find events | Map search pill, Map sheet action "Find events", sheet "All events ›", sheet empty "Find events ›", Events header "Find", 2 Events empty states, Settings "Find events ›" (**8**) | Map pill and Events header only |
| People | Find › People (`94-find-people.png`), Community › People (`21-community-people.png`), New chat list, Connections | One directory: Community › People with the search field; Find › People jumps there |
| Search | Find (events, places, people, addresses), Where to? (own screen **and** a row in Find), forum thread search, share picker, vehicle quick search | One `SearchField`; Where to? becomes Find's address mode, not a screen |
| Settings | Me header, Me "All settings ›", notifications "Open settings ›" | Me header only |
| Map layers | Layers panel (`07-map-layers.png`) and Settings › Map layers (`41-settings.png`) | Layers panel only (MAP-REDESIGN says "people set layers once") |
| Send feedback | Me card, Settings section, sign-in link | Settings (+ sign-in) |
| Willing to travel / New events near you | Settings and the welcome form | Same component, fine; but say once where it lives |
| Connections and requests | Community header (People), People "See requests ›", Messages "See requests ›", Messages "Connections 3 ›", People bottom link, Settings › Community link (**6**) | Community header badge + Connections row in People |
| Notifications | bell on Map and Events only | Bell on every tab header, or only Map; not 2 of 5 |
| Crews | Me only, plus links on events | Community › People (crews are people) |
| Rate builds | People "Rate builds ›" only | Garage, where builds live |

**Bug found while shooting:** tapping "Try the demo without an account" lands on **Credits**
(`00b-after-demo-tap.png`). `credits` is not declared in `_layout.tsx`, so it sits outside every
`Stack.Protected` guard; when `signin` is removed and `welcome` isn't routed to, the router falls
back to it. Declare `credits` (and any other unlisted route) inside a guard, and `router.replace('/welcome')`
after `startDemo()`.

---

## 5. Copy and voice

| Concept | Words in use | Pick |
|---|---|---|
| Can't do it | "Could not" ×57, "Couldn't" ×21 | "Couldn't" (it's the voice everywhere else) |
| No build | No vehicle / No build yet / no builds yet / No builds yet. | "No car or bike yet" |
| Ban area | ban zone (event, plan), car-meet order (zone header), order area (`MapPicker.tsx:265`), Court injunction (kind), "bz-blackcountry" (**raw id shown**, `ZoneCard.tsx:23`) | "Meet ban" as the noun; kind in the detail |
| Rep | YOUR REP 720 / 755 REP / 755 rep points / +100 REP / 2,235 REP COMBINED | "720 rep" everywhere |
| Awards | Trophies / awards ("VOTE (7 AWARDS)") / Best in show | "Trophies"; "Vote for trophies" |
| Roles in a group | Owner, Host (crew); Admin (chat); Hosting (event) | Owner and Host only |
| Navigation | Start navigation / Navigate the drive / Get there (section) / Open in another app › / Count without directions | "Navigate", one section name "Get there" |
| Demo data | Sample (tag), Example build (edit me), Demo: …, Sample partner, Sample area, Sample offer | "Sample" only; the tag, never prose |
| Find | Find / Where to? / Search / Find events / All events | "Search" for the field, "Events near you" for the list |
| Open | Open › / Open event › / Profile › / Show › / See requests › / Change › | fine as links; but "Open ›" on Garage and CrewCard isn't a link |

**Tone shifts.** Sign-in and empty states are warm and short. Settings hints run 3–4 sentences
(`41-settings.png` Speed cameras: 4 lines of caveat). The zone page is legal prose
(`66-zone.png`). Crew-leave copy is amber body text, which reads as a warning colour for an ordinary
sentence (`76-crew-new.png`). Map chrome is shouting ("ZOOM IN TO SEE SHOPS", "COULDN'T LOAD SHOPS").
The demo explains itself in 6 places (welcome, garage sample caption, crew "Bring people in", chat
footer, Settings › Demo, Find note).

**Jargon** left for newcomers: "rep", "LVL", "class S/A/B", "stop locked", "unlocks", "rolling meet",
"PSPO" (zone), "S/A meet", "2A 2B" in mono (`11-events-invited.png`: "4 going · 2A 2B" is a class mix
nobody can read without help).

---

## 6. Motion and feedback

| Thing | State |
|---|---|
| Haptics | `feel.*` in **9 files** (success 15, select 11, tap 8, warning 3, thump 1). 41 files with buttons have none. Map buttons buzz (`index.tsx:871`), sheet actions don't. Event and spot check-ins buzz; Like (♥), Helpful (▲), Rate builds Like/Pass, Accept/Decline connection, Send message and Post don't |
| Press feedback | **6 variants**: opacity 0.8 ×28, 0.7 ×12, 0.85 ×8, kerb background ×2, kerbHi background ×1, opacity + scale 0.99 ×1 (Garage only) |
| Entry animation | `FadeUp` on Garage, build and the wordmark only; Events, Find, Community, notifications just appear |
| Celebration | Check-in burst on events (`CheckInMark`), not on photo spots or drives; `UnlockReveal` on event unlock; `RevealIn` on trophies; `ClassUpMoment` on build save |
| Live | `PulseRing` on EventCard, LeadRow and map pins (consistent, good) |
| Sheets | Map sheet springs; Layers panel slides; options sheet fades; share picker is a page sheet; NavLaunch slides; crop editor full screen |

---

## 7. Top 20 inconsistencies, ranked

| # | Problem | Screenshots | Fix |
|---|---|---|---|
| 1 | **Demo lands on Credits**: first impression is a licence page | `00b-after-demo-tap.png` | Declare every route in `_layout.tsx` inside a guard; `router.replace('/welcome')` after `startDemo()`; add a test that each `src/app` file is declared |
| 2 | **One event, seven faces**: caps card, sentence row, peek, selected card, notification, hero, share | `10-events-mine.png`, `04-map-sheet-half.png`, `08-map-selected.png`, `90-notifications.png`, `50-event-live.png` | `EntityCard` + `ListRow` (below); delete `EventRow`, `LeadRow`, the selected card body and the notification card |
| 3 | **A class badge stands in for a person** in Going, Requests and crew lists; hex avatar elsewhere; avatar on the right in group info; none in new chat | `50-event-live-s1.png`, `75-crew.png`, `86-chat-info.png`, `87-chat-new.png`, `20-community-feed.png` | Person = `Avatar` + `@handle` always, leading; class goes in the subtitle as a small badge |
| 4 | **Single choice built from chips** ~40 times, `Segmented` 5; the same "Near you / Connections" choice is chips on the feed and a segmented control when posting | `20-community-feed.png`, `81-post-new.png`, `41-settings-s1.png`, `89-report.png`, `96-feedback.png` | `SegmentedControl` for 2–4 view switches, `ChoiceGroup` (radio list or wrapping pills with a ● mark) for one-of-many settings; `Chip` only for multi-select filters |
| 5 | **Button soup**: 5–6 full-width buttons on an event; 3 buttons and a primary per row on Connections | `52-event-hosting.png`, `50-event-live.png`, `88-connections.png` | Max one primary and one secondary per screen region; the rest go in a "···" `Sheet` (Share, Edit, Can't make it, Open in another app, Report). Connections rows: one trailing "Accept" secondary + swipe/"···" |
| 6 | **Capitals are random for content**: event "NIGHTRUNNERS LATE ONE" vs "NightRunners late one"; build caps in Garage, sentence in feed and Rate; thread titles sentence; 23 `textTransform:'none'` patches | `10-events-mine.png` vs `04-map-sheet-half.png`; `30-garage.png` vs `77-rate.png`; `82-forum-thread.png` | Caps for **chrome only** (headers, eyebrows, buttons, tags, tab labels). Content titles are always as typed, in Chakra 600, never uppercased. New `Txt v="title"` |
| 7 | **"Start navigation" changes tier**: primary on track, meet spot, shop; secondary on photo spot and events; "Navigate the drive" on drives | `62-spot-track.png`, `63-spot-venue.png`, `61-spot-photo.png`, `53-event-show.png`, `60-spot-drive-s1.png` | Places: Navigate is the primary. Events: Going/Check in is the primary, Navigate secondary. One label "Navigate" |
| 8 | **Three form-label styles** (sodium Section eyebrow per field, fog label above, label inside the box) | `01-welcome.png`, `56-event-new-s1.png`, `71-build-new.png` | `Field` component: fog `label` above, hint below, `InlineError` below that. Sections group fields, they don't label one |
| 9 | **Left accent bar means seven things** (event type, crew, rep, warning, success, danger, unread) | `40-me.png`, `74-crews.png`, `52-event-hosting-s1.png`, `82-forum-thread-s1.png`, `90-notifications.png` | Accent = layer identity of an entity only. States use `Notice` tones (tinted background + icon), unread uses a dot |
| 10 | **Tab headers have no rule**: 3 actions on Events, a shape-shifting action on Community, nothing on Garage, Settings twice on Me, bell on 2 of 5 | `10-events-mine.png`, `21-community-people.png`, `22-community-forum.png`, `30-garage.png`, `40-me.png` | `ScreenHeader`: title + at most one text action + the bell on every tab. Events: "+ Host"; Community: "+ New" opening a sheet (post, thread, chat); Garage: "+ Add"; Me: Settings |
| 11 | **Find has 8 doors; people have 2 directories; Where to? is a screen and a row** | `91-find.png`, `94-find-people.png`, `21-community-people.png`, `67-where.png` | See §4 table. One search field per surface; Find's People tab links to Community › People |
| 12 | **Settings in three places, layers in two, feedback in three** | `41-settings.png`, `07-map-layers.png`, `40-me-s1.png` | Remove Settings › Map layers and Me's feedback card and "All settings ›" |
| 13 | **Four section-title styles**: eyebrow+rule, fog micro (sheet), layer-coloured, in-card fog label; plus a duplicated `h2` under the header on Report | `04-map-sheet-half.png`, `62-spot-track.png`, `58-event-plan.png`, `89-report.png` | `Section` only (sodium eyebrow + rule), no `colour` prop; in-card groups use `ListRow` headers or `Field` labels |
| 14 | **Disabled primary looks like another button style** and never says why | `96-feedback.png`, `80-post.png`, `87-chat-new.png`, `41-settings-s5.png` | Disabled keeps its tier shape (sodium outline at 40%, fog text) and the button gets a one-line `hint` ("Write something first") |
| 15 | **Empty states**: card, bare line, centred bell, sheet's own; Find › Places is empty with no browse | `80-post.png`, `90-notifications.png`, `93-find-places.png`, `22-community-forum.png` | `EmptyState` with `variant="inline"` (one line, optional link) and `variant="block"` (glyph, title, line, one action). Find › Places shows "Near you" places by default |
| 16 | **Colour roles leak**: sodium on 25 info lines, layer colours on chips and section titles, green for form summaries, raw layer hexes as build colours | `91-find.png`, `08-map-selected.png`, `62-spot-track-s1.png`, `56-event-new.png`, `73-profile-edit.png`, `71-build-new-s2.png` | Lint: `BRAND` only via Button/LinkText/eyebrow/selected; `LAYER.*` only in Pin, LayersPanel, hero eyebrow; build colours get their own `PAINT` palette |
| 17 | **Internal id on screen** ("Court injunction · bz-blackcountry") and three names for a ban | `66-zone.png` | Drop `z.id` (`ZoneCard.tsx:23`); glossary term "Meet ban" |
| 18 | **Five sheet/modal mechanisms**, push vs modal chosen per screen, slide/fade/none | `07-map-layers.png`, `86-chat-info.png`, `89-report.png` | `Sheet` (bottom, one animation, grabber, title, Done) for pickers and options; modal route only for create/edit forms; push for everything you read |
| 19 | **Tokens exist but aren't used**: `SPACE` 0 uses, 20 radii, 16 gaps, 35 literal font sizes, 80 raw `<Text>`, 6 alphas, 3 shadows | all | Token changes below + ESLint `no-restricted-syntax` for numeric `fontSize`, `borderRadius`, `gap`, `padding*` and hex/rgba in `src/app` and `src/components` (driving view exempt) |
| 20 | **Feedback is accidental**: haptics in 9 files, 6 press styles, FadeUp on one list, check-in burst on events only | `30-garage.png` vs `10-events-mine.png` | `Pressable_` everywhere with one press style; haptics by rule (below); `FadeUp` on every first list render or none |

---

## 8. Proposed design system v2

Small on purpose: 16 components. Each replaces named variants above. Everything lives in
`src/components/ui/` (split `ui.tsx`), and screens import only from there.

### 8.1 Components

**`ScreenHeader`** (native header options helper)
```ts
screenHeader({ title?: string; action?: { label: string; icon?: Glyph; onPress(): void; a11y?: string }; bell?: boolean; menu?: SheetOption[] })
```
Title in caps (chrome). At most one text action plus the bell plus a `···` menu. Detail screens pass no
title (the `Hero` carries it) and a `menu`. Chat titles are content, so they use `Hero`-style
sentence case in the header (the one exception, documented).

**`Hero`** (detail screens: event, place, shop, zone, build, person, crew, thread)
```ts
{ kind: { label: string; colour: string /* LAYER only */ }; title: string; meta?: string; tags?: TagProps[];
  media?: ReactNode /* map, BuildHero, photo */; stats?: StatProps[]; primary?: ButtonProps; secondary?: ButtonProps }
```
Order is fixed: kind eyebrow → title (`Txt v="title"`, as typed) → meta (mono, one line) → tags →
media → stats (max 4) → primary → secondary → everything else in Sections. Crew loses its card,
Report loses its duplicate `h2`.

**`Section`** (existing) — drop `colour`. Title is an eyebrow, `right` is a `LinkText` or a `Tag`,
never a mono value (move "Cars 1S 4A 1B" into the first row or a `StatBlock`).

**`ListRow` v2** — the one row.
```ts
{ leading?: { avatar: User } | { pin: Glyph; colour: string } | { classBadge: ClassLetter } | { icon: Glyph };
  title: string; subtitle?: string; meta?: string /* mono */; trailing?: ReactNode /* Tag | value | small Button */;
  chevron?: boolean; unread?: boolean; onPress?(): void; onLongPress?(): void; a11y?: string }
```
Min height 56 with a leading mark, 44 without. Replaces `EventRow`, `ThreadRow`, `ConversationRow`,
`BuildLine`, the going/request/crew/connection/new-chat/group-member rows and notification cards.

**`EntityCard`** — one anatomy for person, build, event and place.
```ts
type Entity = { kind: 'event' | 'place' | 'build' | 'person'; id: string };
{ entity: Entity; media?: 'none' | 'thumb' | 'cover'; tag?: TagProps /* role or state, one */;
  note?: string; onPress?(): void }
```
Anatomy, top to bottom: `media` (cover only for builds and people with a photo) → row: leading mark
(pin for event/place, `Avatar` for person, `ClassBadge` for build) + kind eyebrow (`label`, layer
colour) + `Sample` tag + one trailing tag → title (`v="title"`, as typed, 2 lines) → meta (mono, 1 line:
when · going · distance for events; region · distance for places; bhp · mods for builds; level ·
distance for people) → detail (muted, 1 line) → optional `note` (muted, not sodium). Accent bar = the
layer colour, events and places only. Kinds get a `toEntityView(entity)` adapter in `lib/`, so the
Map sheet, Events, Find, crew, notifications and People all render the same card.

**`Avatar`** — `{ user; size: 'sm' 28 | 'md' 40 | 'lg' 76; badge?: ClassLetter }`. Hex letter tile in
**chalk on kerb** (not sodium: a person isn't an action). Optional class badge at the bottom-right. Always
leading.

**`Button`** — tiers `primary | secondary | tertiary | destructive`; sizes `sm | md | lg`.
`tertiary` replaces `LinkText` inside actions and the fog "REPORT THIS EVENT". Remove `ghost`.
`hint?: string` shows under a disabled button. Disabled keeps its shape. `IconButton` for map chrome
(48, glass, one shadow) and header icons (44, no fill).

**`Chip`** — multi-select filters **only**; always sodium when on; `raw` for proper nouns.
**`ChoiceGroup<K>`** — `{ options; value; onChange; layout: 'pills' | 'list' }`. One-of-many: travel
distance, alerts, nav app, region, report reason, feedback kind, event type, day, time. Pills show a
filled dot when on; list is a radio list (report reasons).
**`SegmentedControl<K>`** — switches the view below it, 2–4 options, counts allowed ("Mine 3").
Used for Events, Community, Find, feed scope, post visibility, car/bike, drive/photo spot.

**`Tag`** — `{ label; tone }` outline, caps, 11. Tones are states only. `RoleTag`, `SampleTag`,
`LiveTag` (dot + "Live"), `LevelTag` become presets of `Tag`; `LevelTag` loses its own box.

**`Notice`** — `{ tone: 'info' | 'warning' | 'success' | 'danger'; title?; body; action?; onDismiss? }`.
Tinted background, tone icon, no accent bar. Replaces the map hint card, "Before you go", the
requests banner, crew-leave warning, "Bring people in", demo explanations and success cards.

**`EmptyState`** — `variant: 'inline' | 'block'`. Inline: one muted line + optional `LinkText`
(inside a Section). Block: glyph, title, one line, one primary action (whole-tab empties).

**`Loading`** — `Spinner` (inline, fog) and `SkeletonRow` (ListRow-shaped). Rule: a list loads with 3
skeleton rows; a button loads with `busy` and keeps its label.

**`Sheet`** — `{ title; visible; onClose; children; detents?: ('content' | 'half' | 'full')[] }`.
Bottom, grabber, title + Done, slides (fade with reduced motion). Replaces `OptionsSheet`,
`LayersPanel` shell, `NavLaunch` picker, `SharePicker`, `VoicePicker`, DriveHud icon picker.

**`SearchField`** — `{ value; onChange; placeholder; loading?; onClear; onSubmit; autoFocus? }`.
Search icon left, spinner or clear right, 48 tall, pill radius. Find, forum, share picker, vehicle
search, place search. The map pill is a `SearchField` rendered read-only.

**`Field`** — `{ label; hint?; error?; children /* TextInput | ChoiceGroup | SearchSelect */ }`. Fog
caps label above, hint and `InlineError` below. Replaces Section-as-label, build `Field`, the label
inside `SearchSelect`.

**`StatBlock`** — `{ stats: { value: string; unit?: string; label: string; tone?: 'live' | 'brand' }[] }`.
2–4 tiles in a row, one height. Fixed sets: build = *bhp, bhp/tonne, mods* everywhere; event =
*starts in / ends in, going, stop n of m*; person = *builds, events, rep*. Me's and crew's inline caps
stat lines become `StatBlock`s.

### 8.2 Token changes (`theme.ts`)

* **Space:** replace `SPACE` with a 4-pt scale `{ xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 }`
  and two aliases `screen = lg`, `section = xl`. Lint numeric `gap`/`padding`/`margin` outside it.
* **Radius:** `{ tag: 4, control: 8, card: 12, sheet: 16, pill: 999 }`. Cards go to 12 (map embeds already
  are), buttons, inputs and chips stay 8. Delete 3, 6, 9, 10, 11, 13, 15, 17, 20, 22, 24, 29, 48.
* **Elevation:** `ELEVATION.float = { shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: {0,3} }`; one for the sheet.
* **Alpha:** `tint(c) = c + '1f'`, `line(c) = c + '40'`, `outline(c) = c + '99'` helpers; ban other suffixes.
* **Surfaces:** add `SURFACE.media = '#111827'` (or fold into `raised`); delete the local `INK` copies
  and use `SURFACE.bg`; use `SURFACE.scrim` for every dim layer.
* **Type:** add `title` (Chakra 600, 18, sentence case: content titles in rows and cards) and
  `display` keeps caps italic for hero titles of **app-made** things only (screen names, trophies).
  Hero titles of user content use `title` at 24. Add `buttonSm` and `input` sizes to `TYPE` so `ui.tsx`
  has no literals. Remove `micro` from body copy (credits and badges only).
* **Colour:** `AVATAR` = chalk on kerb. `PAINT` palette for build colours (8 swatches, not layer
  hexes). Keep `BRAND` off info text: a `TEXT.emphasis = C.chalk` for "you can go" style notes.
* **Press:** `PRESS = { opacity: 0.8 }` and `PRESS_CARD = { opacity: 0.9, scale: 0.98 }`.

### 8.3 One way to do X

1. **A person** is `Avatar` + `@handle`, leading, everywhere. "You" for yourself. A class badge is never a face.
2. **A build** is `ClassBadge` + "Make Model" (as typed) + mono "bhp · mods". The stats are always bhp, bhp/tonne, mods.
3. **An event, place, build or person in a list** is `ListRow`; **on a browse surface** it is `EntityCard`. No third way.
4. **A detail screen** is `Hero` in its fixed order, then `Section`s.
5. **Content is never uppercased.** Titles, names, handles, places and messages appear as typed. Capitals are for chrome.
6. **One primary per screen**, max two full-width buttons in any block; the rest go in the `···` sheet.
7. **Places: Navigate is primary. Events: the RSVP or check-in is primary.**
8. **One of many → `ChoiceGroup` or `SegmentedControl`. Many of many → `Chip`.** Never chips as radios.
9. **A form field is `Field`.** Sections group fields; they don't label one.
10. **Status is a `Tag`; a message is a `Notice`; an error is `InlineError`.** Accent bars are layer identity only.
11. **Sodium means "you can tap this" or "selected".** Not info, not people, not levels.
12. **Empty is `EmptyState` inline or block.** Loading is skeleton rows for lists, `busy` for buttons.
13. **Pick from options in a `Sheet`; create or edit in a modal route; read in a pushed screen.**
14. **Search is `SearchField`.** One per surface. Addresses live in Find.
15. **Every tab header: title, at most one action, the bell.** Settings is only behind Me's header.
16. **Haptics:** `select` on every toggle, chip, segment and like; `success` on anything saved, sent or checked in; `warning` on destructive confirms; `tap` only on map chrome. Wire it into `Button`, `Chip`, `ChoiceGroup`, `SegmentedControl` and `ToggleRow` so screens don't call `feel` directly.
17. **Motion:** `FadeUp` on the first render of every list or nowhere; celebrations (burst) on every check-in kind; every sheet slides with the same timing.
18. **Words:** the §5 table goes into `lib/glossary.ts`; "Couldn't", "rep", "Sample", "Navigate", "Meet ban", "Trophies".
19. **No literals** in `src/app` and `src/components` for colour, size, radius or spacing (ESLint rule), except the driving view, which keeps `DRIVE_TYPE`.
20. **Every route is declared in `_layout.tsx` inside a guard**, with a test.

### 8.4 Build order

1. Route guard fix and test (§7 #1). Half a day.
2. Tokens + lint rule in warn mode; fix `ui.tsx` itself first. One day.
3. `Avatar`, `ListRow` v2, `Field`, `ChoiceGroup`, `Sheet`, `SearchField`. Two days; migrate Community, Connections, chat, forms.
4. `EntityCard` + `toEntityView` adapters; replace EventCard, the sheet rows, PersonCard, notification card, garage card. Two days.
5. `Hero` + `StatBlock`; migrate event, place, shop, zone, build, user, crew. Two days.
6. Header and navigation clean-up (§4 table), copy pass (§5), haptics in components. One day.
7. Turn the lint rule to error. Re-shoot the same 117 screens and compare.

# Redesign 2: one plan for the whole app

18 Nov 2026. Written after Reviews 6 to 10 (first-time user) and Review 6 (design). This replaces
patch rounds: the next build does all of it at once, in five parallel work packages, then one review
against the fixed scorecard at the end of this document.

**Target:** every score 8 or more (clarity, coherence, look) and every scorecard task passed, at
midday and in the evening, on a 375x667 screen.

**Sources:** the five first-user reviews, `REVIEW-6-design.md`, `DESIGN-SYSTEM.md`, `SPEC.md`, every
route in `src/app`, `src/components/ds` and `src/theme.ts`. No new screenshots were taken for this plan
(the reviews hold over 300 of them); the plan names screens and files instead.

**Start point:** `main` after the REVIEW-10 fix pass lands. Where this plan and a REVIEW-10 fix
disagree, this plan wins.

---

## 1. Why the scores are stuck

1. **Too much at the top level.** About 15 features are one tap from a first-time user: meets, five
   event types, drives, photo spots, tracks, shops, cameras, road reports, turn-by-turn, posts, forum,
   for sale, chats, crews, rate builds, rep, levels, eight trophy types, dyno runs. Every review
   wanders across all of it, finds 15 new small faults, and the fix round spreads thin. The core loop
   is a fifth of the app and gets a fifth of the polish.
2. **The demo depends on the real clock and real GPS.** The loop (going, check in, vote) only works
   in the evening and near the meet. Every review hit this in a new form: demo lands on Credits (R6),
   the rolling meet dead-ends (R7), check-in needs GPS (R8), midday "Tonight" shows lunchtime meets
   (R9), nothing is live at 13:20 (R10). The demo is a data seed, not a scripted night.
3. **Four scoring systems nobody asked for.** Class S to D, rep and levels (Newcomer to Legend), eight
   trophy types, and three power figures (whp, bhp/tonne, "car scale", plus claimed vs proven). Each
   one needs a paragraph, so screens explain themselves four or five times and still confuse.
4. **Rules are added, never enforced as screen shapes.** DESIGN-SYSTEM.md grew from 19 rules to 33 by
   appending "Added after Review N". There are components but no screen templates, so each screen
   still picks its own header, back, selector, sheet or push, and empty state. R10 still counts four
   selector styles, two date pickers and two stacked tab bars.
5. **The look is text-led and the web preview has no map.** Cards are text and grey silhouettes, every
   label is in capitals, and the map (the hero of the pitch) is a grid on web, where all reviews are
   done. Look stays at 6 to 7 because reviewers never see a real map or a photo-first screen.

---

## 2. The cut list

Nothing is deleted from the backend or from `src/lib`. "Hidden" means no entry point in the UI; the
route stays declared (so old links still open) and the data keeps flowing.

**First-run experience = the core loop only:** see tonight → I'm going → go there → check in → vote
and photos → connect.

### Screens and routes

| What | Decision |
|---|---|
| `rate.tsx` (Rate builds, swipe) | **Hidden.** No link from People or anywhere. |
| `crews.tsx`, `crew/new.tsx` | **Hidden.** No Crew section on Me, no "Find a crew". A crew page (`crew/[id]`) still opens from an event's "Hosted by" line. |
| `shop/[id].tsx` | ~~**Hidden.** Shops layer removed from the map. Page stays for old links.~~ **Owner decision, 18 Nov 2026:** back. Opens from a shop or partner pin on Tonight's Shops layer (Layers, off by default). |
| `zone/[id].tsx` | **Moved:** only reachable from the host flow's meet-ban warning. |
| `spot/new.tsx` (Suggest a place) | **Moved:** one row at the bottom of Search › Places. Not in any "+ New" sheet, not on Me. |
| `find.tsx`, `where.tsx`, `events.tsx` | Stay as redirects (already). |
| `credits.tsx` | **Moved:** Settings › About only. |
| `moderation*.tsx`, `member/[id].tsx` | Staff only, under Settings › Staff, which shows only to staff. |
| `dev/components.tsx` | Unchanged (dev only). |
| Forum (`forum/*`) and For sale | **Merged** into one entry: a "Forum and for sale" row at the top of Community › Feed. No longer a Community segment. |
| Community "Near you / Connections" second bar | **Cut.** One feed (near you plus your connections, newest first). |
| Me › Your places | **Cut** from Me. Your suggested places show in Search › Places with a "Yours" tag. |
| Me › Crew | **Cut.** |
| Me › rep, level, "to Level 3", Public view button | **Cut.** |
| Tonight "+ New" sheet (Host, Suggest a place, Sell a part) | **Cut to one action:** "+" goes straight to Host a meet. |

### Settings

| Setting | Decision |
|---|---|
| Navigate opens (Nightshift / Apple / Google / Waze) | **Kept**, as the only Navigation setting: "Directions open in". |
| The driving map (heading up / north up) | **Moved** into the driving view's own `···` sheet. |
| Your icon on the map (hatchback, saloon…) | **Moved** into the driving view's `···` sheet. |
| Spoken directions / voice | **Moved** into the driving view's `···` sheet. |
| Speed camera alerts | **Hidden** from Settings. The driving view keeps its own alerts switch in its `···` sheet. ~~Cameras never show on the Tonight map.~~ **Owner decision, 18 Nov 2026:** Speed cameras are an optional Tonight layer (Layers, off by default, only when zoomed in). |
| Map layers in Settings | **Cut** (the map's Layers sheet is the only place). |
| Skip the GPS check (demo) | **Cut.** The demo never checks distance. |
| Send a test reminder, reset demo data, runtime and data versions | Developer group: dev builds or a long press on the version line only (as now). |
| Show me in People near you | **Kept, default OFF**, asked once on the People screen. |
| Willing to travel (radius) | Kept once, under Notifications ("New meets within 25 mi"). |
| Feedback, How Nightshift works, legal, credits | One "About" group. |

### Map layers

The Tonight map shows **events only** by default. The Layers sheet keeps three switches: **Drives**, **Photo
spots**, **Tracks** (all off by default). **Hidden:** ~~shops, partners,~~ venues, ~~speed cameras,~~ road
reports, ~~posts,~~ meet-spot clusters. ~~Cameras and~~ Road reports stay inside the driving view only.

> **Owner decision, 18 Nov 2026 (supersedes the cut above):** the owner had asked for Shops and Speed
> cameras behind the small layers button on the right edge, off by default (BACKLOG queue item 1), and
> the redesign took them away. They are back as optional layers in the Layers sheet, next to Drives,
> Photo spots, Tracks and Posts (section 9, point 7): **Shops** (OpenStreetMap listings and labelled
> partners) and **Speed cameras** (fixed and average-speed, only when zoomed in), **both off by
> default**. Road reports stay drive-view only, and the driving view keeps its own camera alerts.
> **Reviewers: these layers are not breaks of the redesign. Do not count them as such.**

### Event types

Hosts can create **Meet**, **Cruise** and **Rolling meet**. **Hidden from the host form:** Show and
Track day (existing ones still display, labelled "Show" and "Track day").

### Scores, trophies and numbers

| Thing | Decision |
|---|---|
| Rep points | **Hidden everywhere.** The ledger keeps counting in the background. No "+150 rep" promises. |
| Levels (Newcomer … Legend) | **Hidden everywhere** (Me, People, forum, event lists, profiles). |
| Class S to D | **Kept**, as a badge only. One line explains it, on a tap of the badge (a Sheet): "Class is your build's power for its weight. S is the quickest." |
| Trophy types | **Cut to three:** Best in show, Best car, Best bike (car and bike only when both turned up). **Hidden:** per-class awards, Best stance, Best sound, Best paint, Cleanest build, Best newcomer. |
| Cover shoot | Kept for the three winners (it is the best visual reward). |
| Power figures | **One number per build: bhp.** Plus "✓ Dyno" when a sheet proves it. **Hidden from first level:** whp, bhp/tonne, "car scale", "claimed". They appear only on the build's Power and dyno page. |
| Typed dyno runs | Never change the class. Only a run with a sheet photo does. (Owner decision needed only if the REVIEW-10 pass did the opposite.) |
| Stage N + ECU remap | Count as one mod (tune stage replaces a remap). |
| "Modified" (3+ mods) and minimum-mods invite filter | Filter **hidden from the host form**; existing events keep it. |
| Mix line "Cars 1S 4A 1B" | **Cut.** The going strip says "7 going · 5 cars, 2 bikes". |
| "Sample" tags | **Cut** on cards. One "Demo night" tag in the Tonight header instead (see section 3.1). |
| "You can go" / "INVITED" | **Cut.** Only the opposite shows: "Not open to your car" on events you can't join. |

### Notifications and badges

* The demo starts with **zero** notifications and **zero** badges. No seeded "New meet near you".
* Kept notice types: event reminder, location shown, host said yes, voting open, you won a trophy,
  connection accepted. Messages count on the Community tab, not in the bell.

---

## 3. Screen by screen

Five screen templates. Every screen is one of them. A screen that doesn't fit a template is a bug.

| Template | Header | Body | Primary action |
|---|---|---|---|
| **T1 Tab** | Tab header (section 4.1) | Sections of PhotoCards or ListRows | Header "+" only |
| **T2 Map** | Tab header + search pill + Map/List | Map with one MapSheet | In the sheet's top card |
| **T3 Detail** | Back, optional Share, `···` | Hero → facts → sections | `ActionBar` pinned to the bottom |
| **T4 Form / wizard** | Back (asks before losing work), step "2 of 4" | Fields in Cards | `ActionBar` pinned to the bottom |
| **T5 List of settings** | Back + caps title | Groups of ListRow / SwitchRow | None |

New DS components named below (`ActionBar`, `PhotoCard`, `Hero`, `GoingStrip`, `DateTimeSheet`,
`LocationLine`) are specified in section 6, WP-A.

### 3.1 Sign-in and demo

* **Purpose:** say what Nightshift is in one line and get you in.
* **Order:** wordmark → tagline "What's on tonight near you. Go with your car." → one full-bleed demo
  photo (a meet at night, from `samplePhotos`) behind a gradient → three short lines (See tonight's
  meets / Say you're going with your car / Check in and vote for the best build) → `ActionBar`.
* **ActionBar (both visible at 375x667 with no scroll):** primary **Try the demo**; secondary
  **Sign in**. Sign in opens the email step as a pushed screen (T4).
* **Legal:** the 18+ and terms tick sits above the ActionBar, one line.
* **DS:** `Hero` (photo variant), `DsText`, `ActionBar`, `Button`, `SwitchRow`-style tick.
* **Must NOT show:** the email field on the first screen, feedback link, version, credits.

```
┌───────────────────────────────┐
│ ◇ NIGHTSHIFT                  │
│ ░░░░░░░ meet photo ░░░░░░░░░░ │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│ What's on tonight near you.   │  hero 30/34
│ Go with your car.             │
│                               │
│ • See tonight's meets         │
│ • Say you're going            │
│ • Check in, vote for the best │
│                               │
│ ☐ I'm 18+ and agree to Terms  │
├───────────────────────────────┤
│ [      TRY THE DEMO       ]   │  primary
│ [        SIGN IN          ]   │  secondary
└───────────────────────────────┘
```

**The demo is a scripted night.** In demo mode the app runs on a virtual clock that starts at
**Friday 21:10** whatever the real time, and moves on in real time from there. The Tonight header
carries one tag, **DEMO NIGHT**; tapping it opens a Sheet: "The demo always runs on a Friday night,
so you can try everything. Nothing leaves this phone." The seeded night is fixed:

| Event | Time (virtual) | Why it's there |
|---|---|---|
| Car park meet-up (Meet, open to anyone) | live, 20:30–23:00, location shown | The "Start here" pick: going, check in and vote work at once |
| Late rolling meet (Rolling meet) | 22:00–00:30, location at 21:30 | Shows the location countdown, then "Move on" |
| Friday night cruise (Cruise, Class A and up) | Tomorrow 20:00 | Shows "Not open to your car" for slow builds |
| Sunday coffee and cars (Meet) | Sun 10:00 | Shows a daytime meet in "This week" |
| Last week's meet (ended) | ended, voting closed | Shows results, trophies and photos |

Check-in in the demo never checks distance and says so once in the toast: "Checked in (demo: no
location check)". Sample people accept a connection after 3 seconds with a toast "@tomtom_gr
accepted". The real-user (signed-in) app uses the real clock.

### 3.2 Onboarding (two steps)

* **Purpose:** know your car and roughly where you live, in under 60 seconds.
* **Step 1 of 2, "What do you drive?"** → Car / Bike `SegmentedControl` → one `SearchField`
  ("Type a make or model, e.g. Fiesta ST") → results as ListRows → once picked, the picked card
  replaces the results: `BuildThumb`, "Ford Fiesta ST Mk8 · 197 bhp", `ClassBadge` animating in. Make
  and model dropdowns are cut (search only; "Can't find it? Enter it yourself" opens the full form).
  ActionBar: primary **Next**, secondary **Skip for now**.
* **Step 2 of 2, "Where's home?"** → map (real tiles) with the area circle → one line "Saved to about
  1 km. Never your address." → handle field, pre-filled with a suggestion. In the demo, home is
  already set to the sample area ("Use my location instead" is a tertiary button). ActionBar: primary
  **Show me tonight**. Back is in the header, never at the bottom.
* **DS:** `ScreenHeader` (step), `SegmentedControl`, `SearchField`, `ListRow`, `PhotoCard` (small),
  `ClassBadge`, `Field`, `TextField`, `ActionBar`.
* **Must NOT show:** the pitch again, region, travel radius, notification choices, "Standard figures
  are…" copy, a developer Tamworth button in release builds, any error before the user acts.

### 3.3 Tonight: map (T2)

* **Purpose:** what's on near me now and next, on a real map.
* **Order:** tab header ("TONIGHT", DEMO NIGHT tag in the demo, "+" and the bell) → search pill →
  `SegmentedControl` Map / List → map (events only) → right-side controls: Layers, Locate (two only)
  → `MapSheet`.
* **MapSheet peek (about 35% at 375x667):** one `PhotoCard` for the pick: Live now, else the next
  meet you can go to. With no car, the same pick. Peek never shows a second card. Drag up: the same
  sections as the List view.
* **Tapping a pin:** the sheet's top card becomes that event (same `PhotoCard`), with ✕. No separate
  "selected card" design.
* **Primary:** **I'm going** on the pick card (the only primary on the screen). Once going, the card's
  button becomes **Open** (secondary) and the tag says Going.
* **DS:** `ScreenHeader`, `SearchField` (read-only), `SegmentedControl`, `IconButton glass`, `MapSheet`,
  `PhotoCard`, `Tag`.
* **Must NOT show:** a "How the map works" tip, "Start here" as a second sheet, action tiles, places
  lists, more than one card at peek, zoom buttons (pinch only), translucent sheet over pins.

```
┌───────────────────────────────┐
│ TONIGHT  [DEMO NIGHT]   +  🔔 │
│ ( 🔍 Search meets, places… )  │
│ [  MAP  |  list  ]            │
│      ⬢        ·    ⬢          │  real dark map
│   ⬢ (live pulse)         [≡]  │  layers
│          ·      ⬢        [◎]  │  locate
├───────────────────────────────┤
│ ░░░░░ host build photo ░░░░░░ │  PhotoCard
│ ● LIVE · MEET                 │
│ Car park meet-up              │
│ Live · until 23:00 · 2 mi · 9 │
│ [       I'M GOING        ]    │
└───────────────────────────────┘
│ Tonight  Community Garage  Me │
```

### 3.4 Tonight: list (T1 body under the T2 header)

* **Purpose:** every event near you, in time order, one list.
* **Order:** Live now (PhotoCards) → Tonight (PhotoCards) → This week (ListRows) → Later (ListRows,
  first 5, then "See all"). Your events stay in place with a Going or Hosting tag. With no car, a
  single inline row at the top: "Add your car to see what you can join ›".
* **Primary:** none (each card opens its event). Header "+" hosts.
* **DS:** `Section`, `PhotoCard`, `ListRow`, `Tag`, `EmptyState inline`.
* **Must NOT show:** a separate "Your events" block, "you can go", class mixes, distance "from the
  map's centre" (always "from you" or "from home").

```
┌───────────────────────────────┐
│ TONIGHT  [DEMO NIGHT]   +  🔔 │
│ ( 🔍 Search meets, places… )  │
│ [  map  |  LIST  ]            │
│ LIVE NOW ──────────────────── │
│ ░░░░░░ photo ░░░░░░░░░░░░░░░░ │
│ ● LIVE · MEET       [GOING]   │
│ Car park meet-up              │
│ Live · until 23:00 · 2 mi · 9 │
│ TONIGHT ───────────────────── │
│ ░░░░░░ photo ░░░░░░░░░░░░░░░░ │
│ ROLLING MEET                  │
│ Late rolling meet             │
│ 22:00 · about 6 mi · 4 going  │
│ THIS WEEK ─────────────────── │
│ ⬢ Friday night cruise       › │
│   Tomorrow 20:00 · about 9 mi │
│   Not open to your car        │
│ ⬢ Sunday coffee and cars    › │
│   Sun 10:00 · about 4 mi      │
└───────────────────────────────┘
```

### 3.5 Event page (T3), all states

* **Purpose:** decide, then do the one next thing.
* **Fixed order, every state:**
  1. Header: back, **Share**, `···` (Can't make it, Open in another app, Report, and for hosts Edit,
     Change the plan, Cancel).
  2. `Hero` with photo (host's build photo, else the meet photo, else the map): kind eyebrow, title,
     one meta line "Tonight 22:00–00:30 · Around Tamworth".
  3. **Status line** (`LocationLine`, one sentence, the only place the countdown appears).
  4. `GoingStrip`: up to 6 avatars, "9 going · 7 cars, 2 bikes ›" (opens the Going list).
  5. Map (`MediaFrame`, real tiles): circle before the location shows, pin after.
  6. Photos (live and ended): posts placed at the meet point during the event, as a 3-up grid,
     "+ Add a photo" for people checked in.
  7. Vote (checked in, from the start until 24 h after the end).
  8. Chat preview (going and hosts): the last 2 lines → push to the event chat.
  9. Hosting (hosts only): requests, Move on, invite summary.
  10. About: description, "Hosted by", "Open to: Anyone within 25 mi".
  11. `ActionBar`.

| State | Status line | ActionBar primary | ActionBar secondary |
|---|---|---|---|
| Not going, location hidden | "Location shows at 21:30 to people going." | **I'm going** | — |
| Not open to your car | "Open to Class A and up. Ask a host to let you in." | **Ask to go** | — |
| Going, location hidden | "Location shows at 21:30 (in 20 min)." and, under it, the switch "Remind me at 21:30" | (none: a status pill that just says "Going") | **Can't make it** |
| Going, location shown, before check-in opens | "Leisure park car park, Tamworth. Check-in opens at 21:30." | **Navigate** | — |
| Going, check-in open (live or 30 min before) | "Leisure park car park, Tamworth. You're 2 mi away." | **Check in** | **Navigate** |
| Checked in | "You're checked in. Voting is open until 23:00 tomorrow." | **Vote for best in show** | **Add a photo** |
| Voted | "You voted. Results at 23:00 tomorrow." | **Add a photo** | — |
| Ended, results out | "Ended. Best in show: @dan_r's Golf R." | — (secondary only) | **See photos** |
| Cancelled | "Cancelled by the host." | — | — |

* **Must NOT show:** "See as a guest", the plan-change log (`···` › Plan changes, hosts only), the
  class explainer paragraph, mix codes, rep, "Stop", "unlocks", a disabled primary, "Can't make it"
  as a button except on a going meet whose location is still hidden (there it's the ActionBar's
  secondary, next to the "Going" pill; Review 16), the countdown twice, the location time twice (it's
  in the status line only, never in the pill).

```
 GOING, LOCATION HIDDEN                CHECKED IN (LIVE)
┌───────────────────────────────┐    ┌───────────────────────────────┐
│ ←                 SHARE   ··· │    │ ←                 SHARE   ··· │
│ ░░░░░░░ host photo ░░░░░░░░░░ │    │ ░░░░░░░ host photo ░░░░░░░░░░ │
│ ROLLING MEET                  │    │ ● LIVE · MEET                 │
│ Late rolling meet             │    │ Car park meet-up              │
│ Tonight 22:00–00:30 ·         │    │ Live · until 23:00 · Tamworth │
│ Around Tamworth               │    │ ✓ You're checked in. Voting   │
│ Location shows at 21:30       │    │   is open until 23:00 tmrw.   │
│ (in 20 min).                  │    │ ◯◯◯◯◯◯ 9 going · 7 cars › │
│ ◯◯◯◯ 4 going · 3 cars, 1 bike│    │ PHOTOS ───────────────────── │
│ ┌───────────────────────────┐ │    │ [▒▒] [▒▒] [▒▒]  + Add       │
│ │   dark map, circle ~3 mi  │ │    │ VOTE ─────────────────────── │
│ └───────────────────────────┘ │    │ [photo][photo][pho→          │
│ CHAT ───────────────────────  │    │ CHAT ─────────────────────── │
│ @dan_r: far end by the lights │    │ @em_i30n: by the lights      │
├───────────────────────────────┤    ├───────────────────────────────┤
│ (✓ Going)  [CAN'T MAKE IT]    │    │ [ VOTE FOR BEST IN SHOW ]     │
│                               │    │ [      ADD A PHOTO      ]     │
└───────────────────────────────┘    └───────────────────────────────┘
```

**Vote** opens a Sheet, not a long section: one trophy per page, always in the order Best car, Best
bike, Best in show (the sheet, the progress row and the results; Review 16). It opens on the trophy
you tapped; the ActionBar's Vote opens the first you haven't voted in, Best car first (Best car and
Best bike only when both turned up), cards are `PhotoCard` builds in a 2-column grid, tap to vote,
toast "Voted". Never your own build.

**I'm going** with one build: no picker, toast "You're going with your Fiesta ST · Change". With two
or more: a Sheet "What are you bringing?" (`ListRow` with `ClassBadge`) then the toast. With none: a
Sheet with **Add your car** (primary) and **Go as a passenger** (secondary).

### 3.6 Host flow (T4, four steps)

* **Purpose:** post a meet in under 2 minutes without getting the invite wrong.
* **Step 1 "What and when":** type `ChoiceGroup pills` (Meet, Cruise, Rolling meet; default Meet) →
  name `TextField` → `DateTimeSheet` field "Starts" (day list for 14 days + any time in 15-minute
  steps) → "Ends" (same control, default start + 3 h).
* **Step 2 "Where":** `MapPicker` with real tiles, crosshair, the place name under it (never
  coordinates). Meet bans: a **court injunction blocks** the step ("You can't host here: a court
  order bans car meets in Birmingham. See the order ›"); other orders warn in one line. For rolling
  meets, "Add another meet point".
* **Step 3 "Who can come":** one summary line, "Anyone within 25 mi · 41 people", and **Limit who
  can come** (tertiary) which reveals Vehicles, Class and Brands `ChipGroup`s (nothing picked = all)
  and Radius `ChoiceGroup`. If the host's own car is left out: one line naming the row. "More
  options" (collapsed): location shows (default 1 h before), co-hosts.
* **Step 4 "Check and post":** summary rows with Edit each → ActionBar **Post meet**.
* **After posting:** a success page (T3 shape): "It's up. Share it so people come." ActionBar primary
  **Share**, secondary **Open the meet**.
* **Back:** from any step after step 1 with changes, a `ConfirmSheet` "Discard this meet?"
  (Discard it / Keep editing).
* **Must NOT show:** Show and Track day types, minimum mods, "Public" switch, raw coordinates, "3 mi
  circle" vs "6 mi across" (always "about 6 mi across"), the guest preview.

### 3.7 Community (T1)

* **Purpose:** see the scene's photos and talk to people you met.
* **Header:** "COMMUNITY", "+" (Sheet: Post a photo, Ask the forum, Sell a part, New message), bell.
* **Segments (one bar, never two):** Feed / People / Chats.
* **Feed:** first row "Forum and for sale ›" (`ListRow` with icon) → posts as photo-first cards:
  photo 4:5, then avatar + handle + build line, caption (3 lines), ♡ count and comment count. No
  credit text over photos (ⓘ corner only).
* **People:** if you have requests, one row "2 people want to connect ›" → "Your connections (3) ›"
  → "People near you": only after you opt in. Before that, an inline card: "See car people near you?
  You'll be shown to them too, as a rough distance." **Show me** (secondary) / **Not now**. People are
  `ListRow`s: avatar, @handle, build line with `ClassBadge`, distance. Filters (Cars/Bikes, Class,
  Make) in a Sheet behind "Filter".
* **Chats:** `ListRow` per chat, unread dot, "New message" in the header "+" sheet.
* **Forum and for sale** (pushed, T1 shape): board `ChipGroup` (Advice, Builds, For sale, Local;
  none picked means every board, per 4.4) → thread rows. "+" opens New thread; "Sell a part" opens the listing form with the
  board fixed to For sale.
* **Post page / thread page:** T3 (back, `···`), content, comments, comment field in the ActionBar.
* **Profile (`user/[id]`):** T3: `Hero` with their best build photo, avatar, @handle, build line →
  Connect / Message in the ActionBar → their garage (PhotoCards) → their posts. No level, no rep, no
  location.
* **Must NOT show:** a second segmented bar, levels, Rate builds, "Requests" in three places (one
  row), a requests banner and a header link at once, empty sample feed photos.

### 3.8 Garage (T1)

* **Purpose:** your car (or bike), looking its best, with what's done to it.
* **Order:** header "GARAGE", "+" (Add a car or bike), bell → main build as a big `PhotoCard`
  (4:3 photo; with no photo, the silhouette on a paint-colour gradient and "Add a photo" tertiary)
  with `ClassBadge`, "Ford Fiesta ST Mk8", "197 bhp ✓ Dyno · 3 mods" and one secondary **Add a mod**
  → other builds as `ListRow`s with `BuildThumb`.
* **Empty:** `EmptyState block`: "Add your car or bike" (primary), one line "It's how you say what
  you're bringing to a meet."
* **Must NOT show:** whp next to bhp/tonne, sample-car captions, three stats, "Mods · Modified".

```
┌───────────────────────────────┐
│ GARAGE                   +  🔔│
│ ┌───────────────────────────┐ │
│ │░░░░░░░░ build photo ░░░░░░│ │
│ │░░░░░░░░░░░░░░░░░░░░░░░░░░░│ │
│ │ [A] Ford Fiesta ST Mk8    │ │  title on gradient
│ └───────────────────────────┘ │
│ 197 bhp ✓ Dyno · 3 mods       │
│ [        ADD A MOD        ]   │
│ OTHER BUILDS ──────────────── │
│ ▣ Yamaha MT-07  [C]         › │
│   73 bhp · stock              │
└───────────────────────────────┘
```

### 3.9 Build page (T3)

* **Order:** `Hero` photo with `ClassBadge` and name → `StatBlock`: **bhp** (with ✓ Dyno), **Class**,
  **Mods** → Mods (grouped: Engine, Suspension, Wheels, Looks), "+ Add a mod" → Photos grid →
  Trophies (covers, if any) → "Power and dyno ›" row.
* **Add a mod:** a Sheet: category `SegmentedControl` → common parts as `ChoiceGroup list` → optional
  gain field → **Add**. Never the whole Edit build form.
* **Power and dyno** (pushed, T5): how the bhp is worked out in one line, dyno runs as `ListRow`s,
  **Add a dyno run** (form with `DateTimeSheet` date, never "YYYY-MM-DD"), and here only: whp, bhp per
  tonne, "claimed" for runs without a sheet ("Add the sheet photo to get ✓ Dyno").
* **Someone else's build:** the same page with no owner actions and no instructions to them.
* **Edit build** (`···` › Edit): T4 form, unchanged fields, with the discard confirm.
* **Must NOT show:** "car scale", three power numbers, "Upload a dyno sheet to verify" to a visitor,
  a bike with Turbo or Stage options.

### 3.10 Me (T1)

* **Purpose:** you, your meets and your trophies.
* **Order:** header "ME", Settings gear, bell → avatar (lg), @handle, main build line → `StatBlock`: **Meets** (checked
  in), **Hosted**, **Trophies** → Your meets: Next (Going / Hosting / Checked in tags) then Past (Went
  / Hosted) → Trophies (cover thumbnails) → `ListRow`s: Edit profile, Settings, How Nightshift works,
  Send feedback.
* **Primary:** none.
* **Must NOT show:** rep, level, crew, your places, Public view, "Find more".

```
┌───────────────────────────────┐
│ ME                         🔔 │
│ ⬡  @ek_fk8                    │
│    Honda Civic Type R FK8 [A] │
│ ┌────────┬────────┬────────┐  │
│ │   3    │   1    │   1    │  │
│ │ MEETS  │ HOSTED │TROPHIES│  │
│ └────────┴────────┴────────┘  │
│ YOUR MEETS ────────────────── │
│ ⬢ Car park meet-up  [CHECKED IN]
│ ⬢ Sunday coffee     [GOING]   │
│ TROPHIES ──────────────────── │
│ [cover] Best in show · 14 Nov │
│ Edit profile                › │
│ Settings                    › │
│ How Nightshift works        › │
│ Send feedback               › │
└───────────────────────────────┘
```

### 3.11 Settings (T5)

* **Groups, in order:** Account (sign in / out, delete) → Privacy (show me in People near you,
  default off; connections and blocked people; second so it's on the first screen, Review 12) →
  Profile (handle, name, home area) → Notifications (event reminders; new meets near me + radius) →
  Directions ("Directions open in": Nightshift, Apple
  Maps, Google Maps, Waze) → About (How Nightshift works, Send feedback, Terms, Privacy, Community
  rules, Open data and credits, version) → Demo (demo only: Restart the demo night) → Staff (staff
  only).
* **Must NOT show:** map heading, map icon, voice, speed cameras, layers, "build 11 or later", demo
  GPS skip, roadmap text, any hint over one line.

### 3.12 Search (T1 shape, pushed from the pill)

* **Purpose:** find a meet, a place, a person or an address from one box.
* **Order:** `SearchField` (focused) → `SegmentedControl` All / Meets / Places / People → results
  grouped in that order; addresses are place results with **Go here**. Nothing typed: Meets near you
  (All, Meets), nearest places with kind `ChipGroup` (Places), connections (People). People match on
  handle **and** make/model ("golf" finds @bex_gti). No results: `EmptyState inline` "Nothing called
  that near you." Bottom of Places: "Know a great road or photo spot? Suggest it ›".
* **Must NOT show:** Home/Work saved places, "Search needs the iPhone app" as the only empty line,
  "Home: Not set" when home is set.

### 3.13 Notifications (T1 shape, pushed from the bell)

* **Order:** Today → Earlier, each a `ListRow` (pin or avatar, one sentence, time) → opens the event,
  person or chat.
* **Empty:** `EmptyState block`: "Nothing yet. Say you're going to a meet and we'll remind you."
* **Must NOT show:** seeded notices, "New … near you" for events already on Tonight, cards with accent
  bars.

### 3.14 Second-level screens (template only, no redesign)

Drive and photo spot pages (`spot/[id]`), the driving view (`drive.tsx`), crew page, shop and zone
pages, connections, chat, group info, report, feedback, help, credits: apply the template (T3 or T5),
the header and back rules, and the wording rules. Drive page: primary **Start** (one button; it
navigates and counts the drive); "Count it without directions" and "Simulate" become one action.
Photo spot: the photo first; no internal data notes ("Medium confidence…").

---

## 4. Pattern rulebook

Short and absolute. These replace the conflicting rules in `DESIGN-SYSTEM.md` named after each one.
WP-A rewrites DESIGN-SYSTEM.md's "One way to do X" and "Added after Review N" sections as this list.

### 4.1 Headers *(replaces rules 15, 21, 28)*
* Every tab header: caps title on the left; on the right, "+" (only on Tonight, Community and
  Garage) then the bell. Always this order. Never a text action ("+ New", "+ Host") in a tab header.
  Me has no "+": its Settings gear sits in that place, before the bell (owner decision, Review 12).
* Every pushed screen: back on the left; on the right at most one text action (Share) and `···`.
* Detail screens have no header title. Forms and settings have a caps title.
  *Note (19 Nov 2026, Review 19 gap 20):* once a detail screen's hero title has scrolled out of view
  (the event page scrolls to the map for the location moment), the header shows a compact copy of
  it, in the content's own case, so you always know which meet this is. It never shows while the
  hero's title is on screen, so it isn't said twice.

### 4.2 Back *(replaces rule 27)*
* Always the root layout's back `IconButton` at the top left. Never a back button in the body.
* With no history, back goes to the tab that owns the screen.
* Back from a form with changes always asks first (`ConfirmSheet`: "Discard it" / "Keep editing").
* **Exception:** the full-screen driving view has no back arrow; its **End** button is its back
  (like every sat nav). Reviewers must not count it.
* **Exception (19 Nov 2026, Review 19 gap 32):** the full-screen photo crop (`CropEditor`) keeps ✕ at
  the top left. It is 4.5's Cancel on a step that loses work (the crop), like every phone's image
  editor, and the one image-editor exception; its `···` (Rotate, Reset) is named in its first line.
  Reviewers must not count it as a second back style.

### 4.3 Buttons *(replaces rules 6, 7)*
* One primary per screen. On T3 and T4 it lives in the `ActionBar`, pinned above the home indicator,
  so it is always visible at 375x667.
* At most one secondary next to it. Everything else goes in `···`.
* Never a disabled primary. If the action isn't possible yet, the ActionBar shows a status pill
  that says where you stand ("Going"; the time is in the status line, said once) and a secondary
  that helps (Can't make it).
* Destructive actions live only in `···` or a `ConfirmSheet`.
* Cards never carry a primary; at most one secondary.

### 4.4 Selectors *(replaces rules 8, 22 and the R10 list)*
* Switch the view below: `SegmentedControl`, 2 to 4 options, **one per screen, never nested**.
  *Exception (owner features, 19 Nov 2026):* a settings-style panel (the Tonight Layers sheet) may have one
  `SegmentedControl` per labelled section (When, Map style). Reviewers must not count it.
* One of many in a form or setting: `ChoiceGroup` (pills up to 5 options, list beyond).
* Many of many (filters): `ChipGroup`. Nothing picked means everything.
* A date or time: `DateTimeSheet`, everywhere (host flow, dyno run, track day). Never a typed date.
* A make or model: `SearchField` with results. Never a dropdown.

### 4.5 Sheets vs pushes *(replaces rules 13, 20)*
* Read something: push. Create or edit: a modal route (T4). Pick from options, confirm, the `···`
  menu, vote, filters: a `Sheet`.
* Never a sheet on top of a sheet. Never a modal on top of a modal.
* A Sheet closes with **Done** (or the action it exists for). **Cancel** only on forms that lose work.
* **One confirm pattern (Review 13 decision):** `ConfirmSheet` is the only confirm, with no header
  Cancel (or Done): its two buttons are in the body. Leaving a form with changes: **"Discard it" /
  "Keep editing"**. Every other destructive confirm: **"{Verb} it" / "Keep it", unless the verb is
  ambiguous; then say both outcomes in plain words** (leaving a meet: "Yes, I can't go" / "I'm
  still going", since "Leave it" also means "leave it alone"). Only the meet-ban warning (9.3)
  differs: "Change location" first, then "Post anyway".

### 4.6 Empty states
* Whole screen empty: `EmptyState block`: glyph, one line, one primary.
* A section empty: `EmptyState inline`: one line, optional link. Never "Nothing yet" with nothing
  under it, never a developer or demo note.

### 4.7 Toasts *(extends rule 10)*
* Every done action gets a toast: going, checked in, voted, posted, saved, sent, request sent.
* One line, 3.2 s, sits above the ActionBar or tab bar, never over the primary.
* One at a time; gone when the screen changes; it never takes a tap (only its Undo does). *(Review 13)*
* "Undo" on leave and remove. Never an error in a toast (errors stay under the thing that failed).

### 4.8 Badges
* A number badge only for things waiting for you: unread messages plus requests (Community tab) and
  unread notices (bell). One badge per thing, in one place.
* Badges use `COLOR.state.liveDot` (red), never sodium.
* The demo starts with zero badges.

### 4.9 Numbers and units *(replaces rules 24, 33)*
* Distance: "2 mi from you" (GPS) or "2 mi from home"; a hidden meet is "about 6 mi from you". Under
  1 mi: "under 1 mi from you". Never "from the map's centre", never a bare "2 mi".
  *Note (20 Nov 2026, Review 20, owner decision 14):* every distance names its origin (`format.ts`
  `distanceText`). The demo's distances are from its home (your real town when the phone is near), said "from home".
* Power: "197 bhp", plus the "✓ Dyno" tag when proven. whp, bhp per tonne and "claimed" only on the
  Power and dyno page.
* Counts: "9 going", "1 person", "3 mods": always `plural()`. Mix: "7 cars, 2 bikes".
* Money: "£450". ONO is a switch, not text.
* Numbers in stats and meta lines use tabular figures. No sodium numbers.

### 4.10 Time wording *(new; owned by `src/lib/when.ts`)*
* 24-hour clock, UK: "21:30".
* Today before 17:00: "Today 14:00". Today from 17:00 (or after midnight until 05:00): "Tonight 22:00".
* Tomorrow: "Tomorrow 20:00". Within 6 days: "Sat 10:00". Beyond: "Sat 28 Nov, 10:00".
* Live: "Live · until 23:00". Ended: "Ended 23:00" (today) or "Ended Fri".
* Relative only under 60 minutes, in brackets after a clock time: "21:30 (in 20 min)".
* One countdown per screen. Never "In 2 days", "Next week", "2h 40m", or a countdown on a card.

### 4.11 Location-reveal wording *(replaces rule 26; owned by `glossary.ts`)*
* The place is the **meet point**; before it shows, the meet is **"Around {Area}"**.
* Not going: "Location shows at 21:30 to people going."
* Going, hidden: "Location shows at 21:30 (in 20 min)."
* Shown: "{Meet point name}, {Town}." For a rolling meet: "Now at {name}. Next location when the host
  moves on."
* Host view: "People going see it at 21:30 (1 h before)."
* Never: stop, unlock(s), unlocked, locked, padlock, rough area, Sample area, reveal.

### 4.12 Words that never appear on a first-level screen
stop, unlock, locked, rough area, Sample area, Sample (as a tag), rep, level, Legend, whp, bhp/tonne,
car scale, claimed, invited, you can go, Find, Where to?, + Host, Count it without directions.
`__tests__/glossary.test.ts` greps `src/app` and `src/components` for them.

**Exception (owner decision, section 9.1):** "rep" and "level" are allowed in exactly three places:
the one level line on Me, the ladder sheet it opens, and the "+150 rep" moment after check-in.
The ladder sheet may also name the levels themselves (e.g. "Legend").
Reviewers must not count those as breaks.

**Added 19 Nov 2026 (owner decision):** the small toast at the moment rep is earned in the driving
view ("+5 rep · Drive complete" on arriving, "+2 rep · Thanks for the report") counts as a moment
like check-in. Its words live in `src/lib/navRep.ts`; Help explains it without the word "rep".

**Added 19 Nov 2026 (owner decision, section 9.9):** "Tap anywhere to stop" under the route preview's
auto-start countdown may use "stop" (it stops the countdown; it isn't a meet's stop). Reviewers must
not count it.

---

## 5. Look upgrade

All within existing tokens except the token changes listed at the end.

### 5.1 Photo-led cards
* `PhotoCard` (new DS component, replaces `EntityCard` on browse surfaces): photo on top, full width
  of the card, 16:9 for events, 4:3 for builds, 4:5 for posts; `RADII.card`; title on a bottom
  gradient (SVG `LinearGradient`, `react-native-svg` is already installed) for builds and the Tonight
  peek card; meta below the photo for events in lists.
* **Every event gets a picture:** the host's build photo, else the event's first post photo, else a
  dark map snapshot of the area circle (the Pin in the middle). Never a grey silhouette on an event.
* Builds without a photo: the silhouette on a gradient of the build's `paint` colour, never on grey.
* Demo data: every sample build, post and meet has a licensed photo that matches its caption and
  model (`samplePhotos.ts`); credits only through the ⓘ corner.
* At 375x667, every first-level screen shows a photo or the real map above the fold.

### 5.2 Type scale use
* Per screen: one `hero` or `titleLg`, then `title` for cards, `body`/`secondary` for text, `meta`
  for facts. **At most three type sizes per card.**
* Capitals only for chrome (header, eyebrow, button, tag, segment). Section eyebrows stay, but at most
  one eyebrow per section and none inside cards except the kind line.
* The italic display face: wordmark, trophy covers and the class-up moment only.

### 5.3 Spacing rhythm
* Page gutter `SPACING.screen` (16). Between sections `SPACING.section` (24). Inside a card
  `SPACING.md` (12). Between rows 0 with a hairline; between cards `SPACING.md`.
* Card text block padding: `SPACING.md` horizontal, `SPACING.md` top, `SPACING.lg` bottom.
* Every scroll view ends with ActionBar height + `SPACING.xl` of padding, so nothing hides behind it.

### 5.4 One accent rule
* **Sodium is for the one primary button and for "selected"** (segment, chip, tab). Nothing else:
  not links (links are `text.primary` with an underline-free chevron), not eyebrows (eyebrows become
  `text.secondary`), not avatars, not badges, not numbers.
* Red (`state.liveDot`) means "now": the live dot and unread badges.
* Green (`state.success`) only for done: Checked in, Going tag, ✓ Dyno.
* Layer colours only on pins and the kind eyebrow of an event or place.
* Result: on any screen the eye lands on one orange thing, and it is the next step.

### 5.5 Motion moments (four, and only four, celebrations)
1. **I'm going:** the button morphs into the "Going" tag (`MOTION.morph`), your avatar slides into
   the `GoingStrip`, success haptic, toast.
2. **Location shows:** the circle on the map shrinks to the pin (`UnlockReveal`, kept), haptic.
3. **Check in:** the burst (`CheckInMark`) on events, photo spots and drive finishes alike.
4. **Trophy won:** the cover flips in (`RevealIn`) when you first open the event or Me after results.

Plus, everywhere: `FadeUp` on the first render of every list (one stagger, 30 ms), the same sheet
slide, the same toast. Reduced motion: all of it becomes a `MOTION.fast` fade.

### 5.6 Token changes (`src/theme.ts`)

| Change | Value | Why |
|---|---|---|
| Add `TYPE_SCALE.hero` | `F.display`, 30/34, not caps, `scale: 'chrome'` | Titles on photos and the sign-in tagline |
| `TYPE_SCALE.label.letterSpacing` | 1.4 → 1.0 | Less shouting in chrome |
| `TYPE_SCALE.eyebrow.letterSpacing` | 2 → 1.5 | Same |
| `TYPE_SCALE.eyebrow` colour rule | `text.secondary` (was sodium via `Section`) | Accent rule |
| Add `COLOR.surface.photoFade` | `['rgba(11,15,23,0)', 'rgba(11,15,23,0.9)']` | The one gradient over photos |
| Add `COLOR.badge` | `{ bg: STATE.liveDot, fg: '#ffffff' }` | Badges are red, not sodium |
| `COLOR.action.link` | sodium → `C.chalk` | Accent rule |
| Add `ELEVATION.bar` | `boxShadow: '0px -2px 12px rgba(0,0,0,0.45)'` | The ActionBar |
| Add `MOTION.morph` | 260 | Button → tag |
| Add `MOTION.stagger` | 30 | List FadeUp |
| Add `ASPECT` | `{ event: 16/9, build: 4/3, post: 4/5 }` | PhotoCard |
| Remove `RADIUS`, `SPACE` | deprecated, unused | Clean-up |

---

## 6. Implementation: five work packages

Rules for every package:
* **Over the air only.** No new native modules, no `app.json` change, no config plugin. Before and
  after, run `npx expo-updates fingerprint:generate --platform ios` and compare the hash; it must not
  change. Pure-JS packages are allowed (adding `@supabase/supabase-js` left it unchanged).
* **No file in two packages.** If a package needs a change in another's file, it writes it in its PR
  description and the owner of that file does it.
* `npx tsc --noEmit`, `npx jest` and `npx expo lint` pass before merge.
* WP-A merges first. WP-B, C, D and E code against the component APIs below from day one (stub them
  locally if WP-A isn't merged yet; never commit the stub).

### WP-A: Foundation (design system, words, clock, layouts)

**Builds:** the token changes (5.6); new DS components; the rulebook in DESIGN-SYSTEM.md; the time
and location wording; the app clock; header, back and tab-bar rules in the layouts; lint tests.

New components (all in `src/components/ds/`, exported from the barrel):
* `ActionBar({ primary?, secondary?, status? })`: pinned bottom bar, safe-area aware, `ELEVATION.bar`.
* `PhotoCard({ kind, photo | fallback, title, eyebrow, meta, tag, live, action, onPress, titleOnPhoto })`.
* `Hero({ photo | media, eyebrow, title, meta, tag })` (replaces `DetailHero`).
* `GoingStrip({ people, summary, onPress })`.
* `LocationLine({ state, area, time, minutesTo, point })`: renders the 4.11 wording only.
* `DateTimeSheet({ value, onChange, minDate, days = 14, stepMinutes = 15, mode: 'datetime' | 'date' })`.
* `Gradient` (SVG) used by PhotoCard and Hero.

**Files:**
`src/theme.ts`; `src/components/ds/*` (all, plus the new files); `src/components/Detail.tsx`;
`src/components/motion.tsx`; `src/components/Wordmark.tsx`; `src/components/PhotoCredit.tsx`;
`src/components/Cover.tsx`; `src/lib/glossary.ts`; `src/lib/when.ts`; `src/lib/format.ts`;
`src/lib/appClock.ts` (new: `appNow()` and `setClockOffset(ms)`; every package replaces
`new Date()` in its own files with `appNow()`); `src/app/_layout.tsx`; `src/app/(tabs)/_layout.tsx`;
`src/app/dev/components.tsx`; `docs/DESIGN-SYSTEM.md`; `__tests__/designLint.test.ts`,
`designSystem.test.ts`, `headerLint.test.ts`, `glossary.test.ts`, `callout.test.tsx`, `routes.test.ts`.

**Moves criteria:** K1, K2, K3, K4, L2, L4, C4 (section 7).

### WP-B: Tonight, the event and the demo night

**Builds:** 3.3, 3.4, 3.5, 3.13, the demo night (3.1 table and virtual clock), voting cut to three
trophies, the I'm going sheet, the photos block on events, map layers cut, the drive page's single
Start, the driving view's `···` (heading, icon, voice), zero seeded notices.

**Files:**
`src/app/(tabs)/index.tsx`; `src/app/event/[id].tsx`; `src/app/notifications.tsx`;
`src/app/drive.tsx`; `src/app/spot/[id].tsx`; `src/app/shop/[id].tsx`; `src/app/zone/[id].tsx`;
`src/components/MapSheet.tsx`, `TonightCards.tsx`, `LayersPanel.tsx`, `MapWidgetSlot.tsx`,
`AwardsSection.tsx`, `BringPicker.tsx`, `NavLaunch.tsx`, `NavIcon.tsx`, `DriveHud.tsx`,
`VoicePicker.tsx`, `RoadReportControls.tsx`, `TrackPanel.tsx`, `NoticeBell.tsx`, `OfflinePill.tsx`,
`Pin.tsx`, `NightMap.tsx`, `DriveMap.tsx`; `src/lib/eventAction.ts`, `eventView.ts`, `events.ts`,
`awards.ts`, `demoTime.ts`, `clock.tsx`, `scene.ts`, `firstRun.ts`, `mapLayers.ts`, `mapPlaces.ts`,
`notice.ts`, `reminders.ts`, `bringing.ts`, `driveView.ts`, `spots.ts`; `src/data/seed.ts`,
`src/data/samplePhotos.ts`; tests for those libs (`eventAction`, `events`, `awards`, `demoTime`,
`demoSeed`, `mapLayers`, `bringing`, `driveView`).

**Moves criteria:** C1–C3 (tasks 2–6), C5, C6, L1, L4.

### WP-C: First run, hosting and search

**Builds:** 3.1 sign-in screen and ActionBar, 3.2 onboarding, 3.6 host flow (types cut, DateTimeSheet,
injunction block, Who can come summary, discard confirm, success page with Share), 3.12 Search
(people by car, empty line, suggest-a-place row, no Home/Work).

**Files:**
`src/app/signin.tsx`; `src/app/welcome.tsx`; `src/app/profile.tsx`; `src/app/event/new.tsx`;
`src/app/event/edit.tsx`; `src/app/event/plan.tsx`; `src/app/search.tsx`; `src/app/find.tsx`;
`src/app/where.tsx`; `src/app/events.tsx`; `src/app/spot/new.tsx`; `src/components/ProfileForm.tsx`,
`VehiclePicker.tsx`, `SearchSelect.tsx`, `EventForm.tsx`, `MapPicker.tsx`, `BrandPicker.tsx`,
`ZoneCard.tsx`, `PlaceSearch.tsx`, `SuggestMissing.tsx`; `src/lib/invites.ts`, `whereTo.ts`,
`discover.ts`, `brands.ts`, `profile.ts`, `zones.ts`, `legality.ts`; tests (`invites`, `discover`,
`brands`, `profile`, `legality`, `planChanges`).

**Moves criteria:** C1 (5-second test), C2 (tasks 1 and 9), K1, K2 (DateTimeSheet), C6.

### WP-D: Community, Garage, build, Me and Settings

**Builds:** 3.7 to 3.11: one Community bar, forum as a row, People opt-in, photo-first feed; Garage
and build page with one power number, Add a mod sheet, Power and dyno page; Me without rep, level,
crew, places; Settings cut to the 3.11 groups; Rate builds and crews unlinked; demo connection
accept toast.

**Files:**
`src/app/(tabs)/community.tsx`, `(tabs)/garage.tsx`, `(tabs)/me.tsx`; `src/app/settings.tsx`,
`help.tsx`, `feedback.tsx`, `credits.tsx`, `connections.tsx`, `user/[id].tsx`, `post/*`, `forum/*`,
`chat/*`, `build/*`, `crew/*`, `crews.tsx`, `rate.tsx`, `report.tsx`, `moderation.tsx`,
`moderation-log.tsx`, `moderation-team.tsx`, `member/[id].tsx`; `src/components/Community.tsx`,
`CommunityFeed.tsx`, `CommunityForum.tsx`, `CommunityMessages.tsx`, `CommunityPeople.tsx`,
`ComposerParts.tsx`, `ListingCard.tsx`, `BuildHero.tsx`, `BuildArt.tsx`, `DynoSection.tsx`,
`DynoBadge.tsx`, `ModPicker.tsx`, `PhotoFlow.tsx`, `PhotoManager.tsx`, `CropEditor.tsx`,
`PlateReview.tsx`, `CommonsStrip.tsx`, `Rep.tsx`, `AboutSection.tsx`, `AppUpdates.tsx`,
`TravelPrefs.tsx`, `StaffOnly.tsx`, `UserLink.tsx`, `Stars.tsx`, `SharePicker.tsx`,
`ModerationGate.tsx`; `src/lib/classes.ts`, `dyno.ts`, `tune.ts`, `carsNear.ts`, `settings.ts`,
`communityService.ts`, `connections.ts`, `people.ts`; `src/data/communitySeed.ts`; tests
(`classes`, `dyno`, `community`, `communityService`, `settings`).

If one agent can't carry it, split at the line: **D1** Community (community, post, forum, chat,
connections, user, report, moderation and their components) and **D2** Garage, build, Me, Settings
(the rest). No file is shared between D1 and D2.

**Moves criteria:** C2 (tasks 7, 8, 10), C4, K3, K5, L1, L2.

### WP-E: A fair web preview (real maps on web)

**Why:** every reviewer marks "look" down because the web map is a grid. This makes the web preview
show what an iPhone user sees, so look scores measure the real app.

**Builds (web only):**
* `NightMap.web.tsx` and `DriveMap.web.tsx` render a real slippy map with **Leaflet** (about 42 KB
  gzipped, pure JS, `npx expo install leaflet`; imported only from `*.web.tsx` and loaded with
  `import()` so native bundles never include it). Its CSS is injected by the component.
* **Tiles:** CARTO "Dark Matter" raster tiles (`https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png`),
  OpenStreetMap data, no API key. Attribution always visible: "© OpenStreetMap contributors © CARTO"
  in the `credit` slot, in `DsText caption`. A CSS filter on the tile pane tints them to match Apple's
  dark map and the app's navy (start: `brightness(0.85) contrast(1.05) sepia(0.15) hue-rotate(185deg)
  saturate(1.3)`; tune side by side with an iPhone screenshot until roads, water and labels read the
  same).
* **Pins and clusters look the same as on iPhone:** each `MapPin` is a Leaflet `divIcon` whose DOM node
  renders the existing `Pin` component (react-native-web renders it to DOM; mount it with
  `react-dom`'s `createRoot`). Clusters are the app's own (`pins` with `count`), so no cluster
  plugin. Live pins keep `PulseRing`. Paths, circles and polygons use the same colours and widths.
* The full `NightMapProps` contract works: `centre`/`span` ↔ zoom, `onRegion` on move end (so clusters
  re-group), `onSelect`, `onPressMap`, `onLongPress`, `picked`, `recentreKey`, the `animateTo` and
  `region()` handle (so `MapPicker`'s crosshair works).
* If tiles fail to load (offline), fall back to the current grid drawing.
* Pan and pinch work with touch at 393x852; no zoom buttons (matches the native map).
* Licence note in `docs/BACKEND.md` or README: CARTO basemaps are free for development and
  low-traffic use; revisit before a public web launch.

**Files:** `src/components/NightMap.web.tsx`, `src/components/DriveMap.web.tsx`, new
`src/components/webmap/leaflet.web.ts`, `src/components/webmap/PinMarker.web.tsx`,
`src/components/webmap/tiles.web.ts`; `package.json` and `package-lock.json` (only WP-E touches them);
`README.md` (the licence note); a new `__tests__/webMap.test.ts` for the span ↔ zoom maths.

**Fingerprint:** confirm unchanged (Leaflet has no native code; nothing is autolinked).

**Moves criteria:** L3, and makes L1 and L5 judgeable on web.

### Merge order

1. **WP-A** (everything else uses its components and words).
2. **WP-E** (independent; merging early makes every later screenshot fair).
3. **WP-B** (the core loop; the scorecard depends most on it).
4. **WP-C**.
5. **WP-D** (D1 then D2 if split).

Then one OTA update and **Review 11**, run with the scorecard below and nothing else. No fix round
before Review 11 unless a task is blocked.

### Which package moves which 8+ criterion

| Criterion (section 7) | A | B | C | D | E |
|---|---|---|---|---|---|
| C1 5-second purpose | | | ● | | |
| C2 10 tasks, no hints | ○ | ● | ● | ● | |
| C3 within time limits | ○ | ● | ● | ● | |
| C4 no banned words | ● | ● | ● | ● | |
| C5 each fact once | ○ | ● | ● | ● | |
| C6 no dead ends | ● | ● | ● | ○ | |
| K1 zero pattern exceptions | ● | ● | ● | ● | |
| K2 one selector per job | ● | | ● | ● | |
| K3 same thing, same look | ● | ● | | ● | |
| K4 every screen is a template | ● | ● | ● | ● | |
| K5 one power number | | | | ● | |
| L1 photo or map above the fold | ○ | ● | ● | ● | ● |
| L2 look checklist | ● | ● | ● | ● | |
| L3 real map on web | | | | | ● |
| L4 four motion moments | ● | ● | | | |
| L5 screenshot test | ● | ● | | ● | ● |

● = this package does the work. ○ = provides the component or rule it relies on.

---

## 7. Fixed scorecard (use for every review from Review 11 on)

### 7.1 Set-up
* Web export served with SPA fallback, Playwright, **375x667** (touch, @2x). Cleared storage before
  each run. Demo mode.
* **Two runs:** browser clock at **12:30** and at **20:30** (local UK time). The demo night must make
  both runs identical; any difference is a fail of the task it shows up in.
* The tester reads nothing before testing and gets **no hints**. A hint (or reading code) fails the
  task.
* Record: pass or fail, seconds, taps, and the screenshot at any hesitation over 5 seconds.

### 7.2 Time to understand
* **TTU-1:** seconds from the sign-in screen appearing until the tester says, in their own words,
  what the app is for. Target **≤ 5 s**. Pass if the words cover "car meets", "near me / tonight" and
  "go with my car".
* **TTU-2:** seconds from tapping Try the demo to the first **I'm going** tap. Target **≤ 60 s**.

### 7.3 The ten tasks

| # | Task (read to the tester exactly) | Pass when | Time limit |
|---|---|---|---|
| 1 | "Start the demo and set it up with a Ford Fiesta ST." | Tonight opens with the Fiesta ST in the Garage | 60 s |
| 2 | "What's on near you right now? Open it." | The live meet's page is open | 20 s |
| 3 | "Say you're going, with your car." | Going with the Fiesta ST; toast seen | 15 s |
| 4 | "Get directions there, then come back." | Directions opened (in-app or hand-off sheet) and back on the event | 20 s |
| 5 | "You've arrived. Check in." | Checked in; burst and toast seen | 15 s |
| 6 | "Vote for the best car and add a photo from the meet." | Vote recorded; photo posted and shown in the event's Photos | 90 s |
| 7 | "Find someone who's at this meet, connect, and send them a message." | Message sent in a chat with them | 60 s |
| 8 | "Add a cold air intake to your car. What class and power is it now?" | Mod added; tester reads the class and bhp correctly | 45 s |
| 9 | "Host a meet for this Sunday at 10:00, open to anyone, and share it." | Event posted at Sun 10:00, open to anyone; share sheet opened | 120 s |
| 10 | "You can't make the Sunday coffee meet after all. Sort that out, then find where you'd stop people near you seeing you." | Left the event (or not going); Privacy switch found | 45 s |

A task **fails** on any of: a hint, a dead end, the wrong outcome (e.g. wrong event type, wrong
time), over twice the time limit, or a crash or console error that shows on screen.

### 7.4 Scores, with anchors

Score each from 1 to 10. Give the number of the highest anchor whose every line is true; a score
between anchors means "all of the lower anchor, most of the higher". Cite the criteria by id.

**Clarity:** do I know what to do and why?

| Score | Anchor |
|---|---|
| 10 | All of 8, and the tester explains check-in, the location reveal and voting back correctly without being asked. |
| 8 | C1–C6 all true: TTU-1 ≤ 5 s, TTU-2 ≤ 60 s, 10/10 tasks pass at both times, no banned word, each fact said once, no dead end. |
| 6 | Purpose clear in 10 s; 8/10 tasks pass; at most 3 hesitations over 5 s caused by wording. |
| 4 | Purpose clear but the core loop (tasks 2–6) fails once or more. |
| 2 | Tester can't say what the app is for after a minute. |

**Coherence:** does it speak one design and UX language?

| Score | Anchor |
|---|---|
| 10 | All of 8, and the tester predicts where a control will be on a screen before seeing it, twice. |
| 8 | K1–K5 true: zero exceptions on the rulebook checklist (7.5) across every screen met in the tasks; one selector per job; each kind of thing has one look; every screen matches a template; one power number. |
| 6 | 1–5 rulebook exceptions. |
| 4 | 6–15 exceptions, or two navigation patterns for the same job (e.g. two back styles). |
| 2 | Screens feel like different apps. |

**Look:** would I show this to a mate?

| Score | Anchor |
|---|---|
| 10 | All of 8, and the tester picks three screens they'd post as screenshots without being asked. |
| 8 | L1–L5 true: a photo or real map above the fold on every first-level screen at 375x667; every screen passes the look checklist (7.5); the four motion moments seen; real map on web; tester names at least three screens they'd share. |
| 6 | Consistent and tidy, but text-led or with placeholder art on a first-level screen. |
| 4 | Visible clipping, overlap or misalignment on 375x667 or at 1.3x text. |
| 2 | Looks broken or unfinished. |

### 7.5 Checklists used by the scores

**Rulebook checklist (per screen):** header per 4.1 · back per 4.2 · one primary, in the ActionBar on
T3/T4 · no disabled primary · selectors per 4.4 · sheet vs push per 4.5 · empty state per 4.6 · toasts
per 4.7 · badges per 4.8 · numbers per 4.9 · time per 4.10 · location wording per 4.11 · no word
from 4.12.

**Look checklist (per screen):** photo or real map above the fold (first-level screens) · at most
three type sizes per card · sodium on one primary and selected states only · spacing from
`SPACING` only (gutter 16, sections 24, inside cards 12) · no capitals on content · no credit text on
photos · nothing clipped or overlapping at 375x667 and at 1.3x text · the ActionBar never hides
content.

### 7.6 Report format
One table of the ten tasks at each time (pass/fail, seconds, taps), TTU-1 and TTU-2, the three
scores with the anchor and criteria cited, then a list of every rulebook or look-checklist exception
with the screen and the rule. Nothing else is needed; bugs outside the tasks go to `docs/BACKLOG.md`.

### 7.7 Automated scorecard: run before pushing UI changes
Reviews 11–18 kept finding regressions that came in with new features. `e2e/scorecard/` plays this
section's set-up and the ten tasks with Playwright, so most of them show up before a review does:

* `npm run scorecard`: four runs (12:30 and 20:30, each at 1.0x and 1.3x text) plus the Busy night
  pass, about 3 minutes. `npm run scorecard:quick`: 20:30 at 1.0x only, about 2 minutes; CI runs it
  on every push to main.
* Set-up as 7.1: a `--clear` web export served with SPA fallback, 375x667, touch, @2x, cleared
  storage, demo mode, location granted. 1.3x text multiplies each element's computed font size and
  px line height once (text that inherits its size and SVG tspans are left alone, so nothing
  compounds).
* Human pace: about 4 s reading a sheet and 3.4 s watching a toast before the next tap. A sheet
  that opens by itself over the next step is read, closed with Done and noted.
* Each task passes on 7.3's "Pass when" (task 3 and 5 need their toast readable for 2 s) and fails
  over twice its limit. Times are the script's, at human pace; they are not the tester's.
* Rule checks, each failure with a screenshot: **4.3** no disabled primary anywhere (a busy one with
  a spinner is fine); **4.7** every toast on screen, unfaded and uncovered by a sheet or scrim, for
  2 s at a stretch, with no action but Undo; **C5** on the event page "Going", "Live", each HH:MM and
  the meet point's name at most once (toasts and sheets left out); **L2** no text cut off (ellipsis
  or line clamp) at either size; **4.12** no banned word (`BANNED_WORDS` in `glossary.ts`, minus the
  owner exceptions above); no console errors.
* Review 19's checks (`checks-more.cjs`; its problem numbers in brackets): **MAP** on every map,
  pins, the route's end and text over the map clear of the credit chips and map buttons, text over
  the map on a chip with a backing, no meet pin cut by the map's own edge (26, 15, 42); **EDGE** no
  bright sliver (a cut label or tile) in the top 4 px of a small map card (5, 21); **T1** a toast's
  message on one line at 1.0x (52); **CANCEL** no button or menu row that just says "Cancel" (24;
  the script opens your new meet's `···` menu after task 9 for this); **C5+** the route preview and
  Settings say each distance once, Me's Meets stat equals the meets listed, Tonight's "N meets
  tonight" equals the tonight cards and says why the rest are hidden (27, 51, 47, 7); **ME** no two
  meets of one name in Me, and the host form's Name example isn't a meet on show (41, 49); **L4** a
  results or trophy line on the event page after the vote (16); **TILE** every photo in a grid
  fills its tile (30); **HEAD** one section header style per screen (48); **K3** an event's card has
  its title in the same place on Tonight's map sheet and in the List (8); **ART** (full run only,
  after task 10 of the 20:30 1.0x run) Busy night on, Tonight's map passes MAP and no List card
  shows the grid placeholder art (13). Each finding's screenshot outlines what it found in red.
* Allow-lists, each entry with its reason: `e2e/scorecard/allow/` (`c5.json`, `overflow.json`,
  `words.json`, `console.json`, `map.json`, `cancel.json`, `tiles.json`, `headers.json`,
  `trophy.json`). Adding to one is a decision like an owner exception: say why. Screenshots are JPEG.
* It can't judge clarity, look or TTU; the human review still scores those.

---

## 8. What an 8+ looks like

Concrete and checkable. Review 11 passes when every line below is true.

**Clarity 8+**
* **C1** A new user says what the app is for within 5 seconds of the sign-in screen (TTU-1).
* **C2** All 10 scorecard tasks pass with no hint, at 12:30 and at 20:30.
* **C3** Every task is inside its time limit; TTU-2 ≤ 60 s.
* **C4** None of the 4.12 words appear on any screen met in the tasks (glossary test plus a Playwright
  text scan).
* **C5** Each fact is said once per screen: one countdown, one location line, one class explanation
  (behind the badge).
* **C6** No dead ends: no disabled primary anywhere; every error says what to do next.

**Coherence 8+**
* **K1** Zero exceptions on the rulebook checklist across every screen met in the tasks.
* **K2** One selector per job: lint test finds no `Chip` used as a radio, no nested
  `SegmentedControl`, no typed date field, no dropdown for make or model.
* **K3** An event looks the same on Tonight, Search, Me and notifications (PhotoCard or ListRow); a
  person is always avatar + @handle; a build is always ClassBadge + name + "bhp".
* **K4** Every screen is one of the five templates (WP-A's header lint extends to check it).
* **K5** One power number per build everywhere outside the Power and dyno page.

**Look 8+**
* **L1** Every first-level screen (Tonight map and list, Community feed, Garage, Me, an event page)
  shows a real photo or the real map above the fold at 375x667.
* **L2** Every screen passes the look checklist (7.5).
* **L3** The web preview shows a real dark map with the same pins and clusters as the iPhone.
* **L4** The four motion moments happen in the tasks (going, location shows, check in, trophy).
* **L5** The tester names at least three screens they would share as screenshots.

---

## 9. Owner decisions (settled 18 Nov 2026; these win over anything above)

The plan's first defaults were checked against what the owner has already asked for. Where they
clashed, the owner's earlier decisions stand:

1. **Rep and levels:** kept as **one line on Me** ("Level 3 · Regular", tap for the ladder sheet), and
   the "+150 rep" moment after check-in stays. Hidden everywhere else (cards, profiles, lists).
2. **Trophies:** Best in show, Best car, Best bike only (as planned). Other trophy data kept, hidden.
3. **Court-injunction areas warn with a confirm, never block** (owner: ban zones warn, not block). The
   existing "Publish anyway?" sheet with "Change location" as the main button stays.
4. **Show and Track day:** not creatable in the host form (as planned).
5. **People near you:** opt-in (as planned).
6. **Speed cameras and road reports:** stay in the **driving view only**, off the Tonight map, with
   their switches in the drive view's `···` menu (owner asked for Waze-style driving). Not in Settings.
   **Owner decision, 18 Nov 2026:** Shops and Speed cameras are back on Tonight as optional layers in
   the Layers sheet, both **off by default** (cameras only show zoomed in). Road reports stay drive-view
   only; the driving view keeps its own camera alerts. Reviewers must not count these layers as breaks.
7. **Posts on the map:** the Posts layer stays available in Layers, off by default (owner asked for
   posts with locations people can see on the map).
8. **Forum and For sale:** reachable from one row at the top of the Feed (as planned); the owner asked
   for a forum, so it must stay one tap from Community.
9. **Route preview auto-start (owner decision, 19 Nov 2026):** with one route, the route preview
   starts the driving view by itself, like Waze. It stays, and reviewers must not count it as a
   break. It must read clearly: the countdown starts only once the route is drawn, the button says
   "Starting in 5" (counting down), and "Tap anywhere to stop" shows under it; any touch stops it.
   That hint's "stop" is allowed (4.12 exception).
10. **Review 19 fixes (owner decisions, 19 Nov 2026):**
    * **Trophy moment (L4):** in the demo, voting in one trophy plays that trophy's result reveal as
      soon as the vote sheet closes, under "Demo: how Best car went"; the other trophies stay open
      ("2 more to vote"), and Vote steps down to the secondary. Inside task 6, no extra taps. Signed
      in, results come at the real time.
    * **Demo clock:** said once, clearly: Tonight's header tag reads "Demo · Fri 21:10" (the demo's
      clock) and its sheet explains it. Times elsewhere stay as they are.
    * **Count line:** "2 meets tonight · 4 hidden by your filters · Show". Show turns every filter
      off and leaves "Filters off · Reset", so there's always a way back.
    * **Toasts:** one line at 1.0x on a 375-wide phone; short copy ("Not going · Undo"); the green
      tick only on success (leaving, removing and notes get a neutral mark).
    * **Event cards:** one card look on Tonight's map sheet and list (title on the photo, I'm going
      when you can simply go). The meet's pin glyph never changes when you go or its place shows.
    * **Route preview:** one credit chip; the route and its destination are fitted clear of the
      chip and the map buttons (map padding), never under them.
11. **Review 19 path to 10: sign-in, onboarding, hosting, Me, Settings, Garage (owner decisions, 19 Nov
    2026):**
    * **Sign-in:** the 18+ tick sits inside the ActionBar, right above Try the demo, so it's seen
      before either button (3.1 said "above the ActionBar").
    * **"It's up" after posting** is its own route (`event/posted`) with **no back arrow** (a 4.2
      exception): the form is finished, so the header's **Done** closes it; Share (primary) and Open
      the meet are the two ways on. Its hero is the meet's own PhotoCard, as on Tonight.
    * **Host form:** the Name example never matches a seeded meet ("e.g. Friday night car park
      meet"; `__tests__/placeholders.test.ts`). The Starts and Ends sheets show the evening (17–23)
      first; "Show earlier hours" adds the rest. Step 3 says "people", never "drivers". Step 2's
      prompt is a solid chip, never text printed over the map's labels.
    * **Your own meet's `···`:** "Cancel this meet…" (its type) in red, then the ConfirmSheet
      "Cancel the meet?" (Cancel it / Keep it).
    * **Me:** the Meets stat counts exactly the rows under Coming up and Past meets (Hosted is the part
      of them you host). Past meets is its own section with the same header. Two meets with one name
      add where they are to the meta line. Distances: "about" only while the meet point is hidden.
    * **Settings:** "New meets within [25 mi]" is one row; the distance is its tappable value (a
      How far sheet), not a second row.
    * **Garage:** the header's add is a car with a plus (not the bare "+", which hosts on Tonight);
      it's still in the "+" place (4.1). Under the main build: its mods and Power and dyno.
12. **Review 19 fixes: people, Community and photos (owner decisions, 19 Nov 2026):**
    * **Photo tiles always fill:** in photo grids and strips (an event's Photos, thumbnails, build
      photos, a composer's row, chat grids) every tile is cover-fit (`FitImage fit="cover"`). The
      whole-photo-over-a-blur fit is only for heroes and single-photo views.
    * **Car-photo avatars:** a person's Avatar shows their main build's photo by default (in the demo
      its stand-in); initials only for someone with no car or bike. Still "avatar + @handle" (K3).
    * **A tab bar on a profile and a chat:** both keep a copy of the tab bar under their ActionBar, so
      a tab is always one tap away (the chat hides it while you type). The owning tab (Community) is lit.
    * **Demo clock in chats:** a chat's day label reads "Demo · Fri" in the demo, like Tonight's tag.
    * **Photos:** no solid boxes over plates (plates are filled with the panel round them, or the photo
      shows none); night or dusk photos for the sample meets; one photo on at
      most two screens in the normal demo (a post shows its own photo, not its build's); every bundled
      photo at least as large as it's shown (1200 x 900, meets 1600 x 900, posts 1080 x 1350).
13. **Review 20 fixes: event page, route preview, Tonight, vote (owner decisions, 20 Nov 2026):**
    * **Host clash warning:** hosting at a time you're already going to a meet asks first, with the
      ConfirmSheet "Time clash": "You're going to Sunday coffee and cars then. Host anyway?", **Change
      time** as the primary and **Host anyway** under it (secondary). Like the meet-ban warning, it is
      the second confirm whose safe way back comes first (4.5); reviewers must not count it.
    * **Seeded demo meets:** a meet the demo put you down for says "You're going (demo)" on its row
      (in place of the Going tag) and in the Demo night sheet. Tonight lists your meets after tonight
      under "Coming up", at the top of the sheet and the List.
    * **Route preview:** the root back arrow at the top left is its way back (4.2); "Not now" is gone,
      so Start is the only button. The demo route says it starts from home and its arrival carries
      "(Demo · Fri)".
    * **Event page:** "Checked in" is the ActionBar's status line after check-in (as "Going with your
      …" is before); the "+150 rep" card fades, then folds its height. "Location shown" sits at the
      top of the map, clear of the toast, over the map pin itself (which never leaves). A cancelled
      meet says so once, "The host cancelled this meet.", with no status tag, "Was 1 going" and a
      grey pin.
    * **Demo distances** are measured from the demo's home and said "from home" (4.9).
14. **Review 20 path to 10: sign-in, onboarding, Garage and Me, hosting, wording (owner decisions, 20 Nov
    2026):**
    * **Distances (4.9):** every distance names its origin, "2 mi from you" or "2 mi from home". In the
      demo, onboarding with a phone within 15 mi of the sample meets starts home at the phone, named after
      its real nearest town ("Around Lichfield"), and the sample scene stays on its real roads; the demo's
      distances are from that home, said "from home" (13 above), so they're honest wherever the phone is.
      With no location, or a phone far away, the demo's own home is said once in onboarding:
      "Demo home: Tamworth".
    * **"It's up":** a real picture, never the placeholder grid: your build's photo, else its stand-in
      (credited as similar), else the night meet art (the sign-in hero's photo).
    * **Starts and Ends hours:** all 24 hours in clock order, a 6 x 4 grid (00–05, 06–11, 12–17, 18–23),
      with the evening (17–23) lit. No "Show earlier hours": morning meets (Sunday coffee) are common.
      This replaces 11's "evening first".
    * **Small map cards:** the web map's tiles fade out at every edge (no clipped label or shield shows as
      a sliver); Host step 2's chip has a halo in the map's dark for the same reason. Step 2 opens on
      home's area (about 5 mi) and closes in on a placed point (about 2 mi).
    * **Meet point name:** named from a known place within a mile ("Near Ventura Park"), else left empty
      for the host; never "{Town} meet point".
    * **Header "+":** one icon per job: a calendar with a plus hosts (Tonight), a speech bubble with a plus
      posts (Community), a car with a plus adds a build (Garage).
    * **Me:** the avatar is a close crop of your car photo when your car's card is right under it.
    * **Meet, not event:** "Meet options", "Meet reminders", "Share this meet"; `__tests__/glossary.test.ts`
      ratchets "event" off screens.

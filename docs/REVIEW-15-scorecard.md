# Review 15: fixed scorecard

Scored against `REDESIGN-2.md` section 7 (fixed scorecard) and section 8 (8+ criteria), read before
testing. Section 4 (the rulebook, with its owner exceptions) and section 9 were read only after the
task runs, to count rule breaks. Review 14 was read last, for the comparison only.

**Set-up:** `bde9bce` on main. `npx expo export --platform web --clear` into
`~/nightshift-wt/r15-web`, served with SPA fallback on port 8915 (killed by PID afterwards). My own
headless Chromium (Playwright 1.57, Node script, not the shared MCP browser): 375x667, touch and
mobile emulation, @2x, Europe/London, en-GB, demo mode, no location permission. Four scored runs,
each from cleared storage: browser clock 12:30 and 20:30 on Wed 18 Nov, each at 1.0x and 1.3x text.
Then free exploration at 393x852. Screenshots are in `~/nightshift-wt/r15-shots`:

* `x-` is the first, unscripted walk-through, step by step. The hesitations and human times come
  from it.
* `1230-10-`, `2030-10-`, `1230-13-` and `2030-13-` are the scored runs (`-tN` is the end of task N).
* `e-` and `b-` are the exploration (393x852, plus a few 375x667 checks).

**Limits:**
* Human times are my estimate from the walk-through: reading, choosing and tapping, at about 1.5 s a
  tap plus reading. The script's wall time is given next to them.
* 1.3x text is simulated by multiplying every CSS font size and line height (the React Native Web
  style rules and inline styles) by 1.3. React Native Web ignores the OS text size and any
  `maxFontSizeMultiplier`, so text the iPhone app caps (tab labels, perhaps the trophy cover) is
  scaled here too.
* Web Share: I gave the page a `navigator.share` like iOS Safari's. Share called it with the meet's
  title, "Sun 10:00" and the link, so I counted the share sheet as opened. Without it, the web build
  copies the link and says "Link copied".

## 1. Task table

All four runs gave identical visible text and outcomes, apart from the random demo handle. The demo
night (Fri 20 Nov, about 21:10) makes 12:30 and 20:30 the same. No crash and no on-screen error. The
console showed a "502" for one resource during the drive view (all runs), and once at 1.3x a Leaflet
`_leaflet_pos` TypeError while the drive view closed. Neither showed on screen.

### 12:30 and 20:30, 1.0x text (identical)

| # | Result | Human | Script | Taps | Notes (shots) |
|---|---|---|---|---|---|
| 1 | Pass | 31 s | 9.8 s | 8 + typing | First I tapped Try the demo without ticking 18+: "Tick the box to say you're 18 or over first." (x-02-demo). Search "Fiesta ST": "Ford Fiesta ST · 5 versions" (five rows), then a separate "Ford Fiesta · 1 version". Which one is mine? (about 6 s, x-04-search). Mk8, Next, step 2 "Around Tamworth", Show me tonight. Garage shows "Ford Fiesta ST Mk8, 197 bhp · Stock" with a real photo (x-24-garage). |
| 2 | Pass | 4 s | 1.6 s | 1 | The live "Car park meet-up" card leads the map sheet. Tapping it pushes the event page (x-07-tonight-2030, x-08-event). |
| 3 | Pass | 3 s | 0.7 s | 1 | The pin animates, then "LOCATION SHOWN · Leisure park car park". The toast "You're going · CHANGE" comes at once, on one line, and "Going with your Fiesta ST Mk8" sits above Check in (x-09-going-0/1). |
| 4 | Pass | 9 s | 2.9 s | 2 | Navigate, then the in-app drive view ("Arrive 21:15", "Demo night: Friday's clock · 4× speed"), then End, back on the event (x-10-nav). |
| 5 | Pass | 3 s | 0.6 s | 1 | The ring bursts, the "+150 rep · For turning up." card shows, and the "Checked in" toast. Vote becomes the primary (x-12-checkin-0/2). |
| 6 | Pass | 30 s | 10.3 s | 5 + file | Vote opens "Vote: Best in show". I tapped the i30 N: "✓ Your vote" and the toast "Voted for Hyundai i30 N", with "Next: Best car" as the primary. Must I vote all three? (about 5 s). Done. The page behind the sheet said "Results tomorrow 23:00." but now says "Results are in." with a "DEMO RESULTS" cover. Add a photo, file, crop, Use this crop, "Photo posted". "Photo by You" is first in Photos (x-14-voted-1, x-15-afterdone, x-18-photos). |
| 7 | Pass | 24 s | 10.3 s | 6 + typing | "11 going", @em_i30n, Connect, "Request sent". "Waiting for @em_i30n to accept" with Cancel request for about 3 s, then CONNECTED and Message. Typed, Send, toast "Sent". The demo replies (x-19-goinglist, x-21-connect-1/2, x-23-sent). |
| 8 | Pass | 22 s | 9.1 s | 8 | Chat has no tab bar, so it took 4 backs (chat, profile, going list, event) to reach Tonight. Then Garage, Add a mod, Cold air intake, "Add Cold air intake". The toast "Added. Now 201 bhp, Class B" answers the question directly (x-26-picked, 1230-10-t8b-toast). |
| 9 | Pass | 48 s | 17.3 s | 14 + typing | "+" on Tonight, Name, Starts Change, Sun 22, 10, Done (ends Sun 13:00). Step 2: tap the map, read the three-line instruction, Set meet point here (the names are pre-filled). Step 3: "Who can come: Everyone / Who we'll tell: drivers within 25 mi · about 18 people". Step 4, Post meet, "Invites sent to 18 people nearby", Share, and the share sheet is called with "Sun 10:00" (x-28 to x-38). |
| 10 | Pass | 20 s | 9.5 s | 7 | Back to Tonight, then Me. Your meets, "Sunday coffee and cars · GOING", "CAN'T MAKE IT", ConfirmSheet "Leave it", then "You're not going to Sunday coffee and cars · UNDO". Back, gear: Privacy is the second group, "Show me in People near you" (already off) (x-41 to x-45). |

**12:30: 10/10. 20:30: 10/10.**

### 12:30 and 20:30, 1.3x text

| # | 12:30 | 20:30 | Script | Notes |
|---|---|---|---|---|
| 1–10 | 10/10 | 10/10 | Same as 1.0x (±0.1 s) | Same outcomes and toasts. Clipping on two task screens: the onboarding search placeholder is cut to "e.g. Fies" (2030-13-t1a-onb1), and the trophy cover's wordmark is cut to "NIGHTSHIF", with the title split "Hyundai i30 / N" (2030-13-t6c-results). The Add a mod segments wrap to a 2x2 grid (2030-13-t8a-sheet). The drive view's route credit becomes a two-line block over the map (2030-13-t4a-drive). The "It's up" status line ends under the toast (2030-13-t9f-posted). |

## 2. Time to understand

| Measure | Result | Target | Pass? |
|---|---|---|---|
| TTU-1 | About 3 s. "What's on tonight near you. Go with your car." over a photo, with "See tonight's meets near you / Say you're going, with your car" under it. That covers car meets, near me and tonight, and going with my car (x-01-signin). | ≤ 5 s | Pass |
| TTU-2 | About 24 s from Try the demo to the first I'm going tap, including the 18+ error and the Fiesta choice. | ≤ 60 s | Pass |

**Hesitations over 5 s:**
1. Task 6, vote: after one vote the sheet offers "Next: Best car". Do I have to do all three? Then
   "Results tomorrow 23:00." turns into "Results are in." the moment I tap Done. *Wording.*
2. Task 9, step 3 and after: the host picks "Who can come: Everyone", but the posted meet says
   "Open to: Anyone within 25 mi" and "0 requests · Anyone within 25 mi" (e-83-open-meet). So is it
   open to anyone or not? *Wording.*
3. Task 1: five Fiesta ST versions. Which one is mine? *A choice, not wording.*

**Shorter hesitations (under 5 s):**
* "Waiting for @em_i30n to accept" for about 3 s;
* the four backs from the chat to the tab bar in task 8;
* the place picker's three-line instruction;
* the meet card says "Not open to your car" on two meets, but the reason only shows when you open
  them.

## 3. Scores

### Clarity: **7**

| Criterion | Result | Evidence |
|---|---|---|
| C1 TTU-1 ≤ 5 s | **Met** | About 3 s. |
| C2 10/10 at both times | **Met** | 10/10 at 12:30 and 20:30, at 1.0x and 1.3x. No hints. |
| C3 inside the limits; TTU-2 ≤ 60 s | **Met** | The closest are task 9 (48 of 120 s) and task 7 (24 of 60 s). TTU-2 is about 24 s. |
| C4 no 4.12 word | **Met** | A text scan of every task screen in all four runs finds only "+150 rep" (event page after check-in), "Level 1 · Newcomer" (Me) and "Can't find it?" (onboarding, which isn't a first-level screen). All are allowed. |
| C5 each fact said once | **Missed** | After voting, the live event says the winner three times: "Results are in." above, the cover "BEST IN SHOW · Hyundai i30 N", and the row "Best in show · @em_i30n · Hyundai i30 N · 6 votes" (x-15-afterdone). The page behind the vote sheet says "Results tomorrow 23:00." until you tap Done (x-14-voted-1). The past meet says its winner in the status line, on the cover and in a row (e-38-past-meet). Who can come is said two different ways: "Everyone" in the host flow, "Anyone within 25 mi" on the event (x-36-host3, e-83-open-meet). |
| C6 no dead ends; errors say what to do | **Met** | Every error I hit says what to do: 18+, "Tap the map to place the meet point.", "Pick a part, or tap Something else to type one.", "Write a message first.", "Write something first." (feedback). Bad links (`/nope`, `/event/…`, `/user/…`, `/chat/…`) show a titled not-found screen with "See tonight's meets", and back works. Back from a changed form asks "Discard it / Keep editing" (host flow and Your profile, which now has Save). The weakest spot is Search with no results (see problem 9), but it does say towns work. |

Anchor 6 is fully true: purpose clear in 10 s, 10/10 tasks, 2 wording hesitations over 5 s.
Anchor 8 has 5 of its 6 lines (only C5 is missed). All of 6 and most of 8 gives **7**.

### Coherence: **6**

Rulebook exceptions on the screens met in the tasks: **3** (section 4), so anchor 6 (1–5) applies.
No line of anchor 4 is true:
* Review 14's map-sheet preview is gone. A card in the sheet and the same card in List both push the
  event page.
* The one non-chevron exit in the tasks is the crop screen's ✕. It's the Cancel that 4.5 allows on a
  form that loses work, not a second back style.

Coherence 8+ criteria:
* **K1** zero exceptions: **missed** (3).
* **K2** one selector per job: **met**.
  * One SegmentedControl per screen (Map/List, Feed/People/Chats, Car/Bike, Engine/Suspension/
    Wheels/Looks, All/Meets/Places/People).
  * ChoiceGroup pills for type, radius and directions app; ChipGroup for forum boards.
  * DateTimeSheet for the start; a SearchField for make and model.
  * Add a car or bike now has one SegmentedControl and a switch for Engine swap.
* **K3** one look per kind of thing: **missed**.
  * Events look the same everywhere (PhotoCard on Tonight, ListRow with the kind glyph on Search
    and Me). Builds are always ClassBadge + name + bhp.
  * But a person isn't always avatar + @handle. The chat header is the @handle alone (x-23-sent),
    and the event chat preview lines are "@em_i30n · 20:45" with no avatar (x-09-going-1 text).
* **K4** every screen matches a template: **missed**. The chat (a titled pushed screen that is
  neither T3 nor T5) and the place picker (its primary in a floating card, not the ActionBar) don't
  fit.
* **K5** one power number: **met**. 197 bhp, then 201 bhp after the mod, everywhere. bhp per tonne
  and "claimed" appear only on Power and dyno.

That's 2 of 5 lines of anchor 8 (K2, K5), not most of them, so **6**.

### Look: **5**

* **L1** a photo or real map above the fold on every first-level screen at 375x667: **met**.
  Tonight map and list, Community feed, Garage, Me and every event page (b-list, b-community, b-me,
  b-garage, x-08-event).
* **L2** the look checklist on every screen: **missed**.
  * Clipping at 1.3x on task screens: the trophy cover's wordmark "NIGHTSHIF" and the split title
    "Hyundai i30 / N" (2030-13-t6c-results), and the onboarding search placeholder "e.g. Fies"
    (2030-13-t1a-onb1).
  * Misalignment at 1.3x: the Add a mod SegmentedControl breaks into a 2x2 grid
    (2030-13-t8a-sheet). The drive view's route credit grows into a two-line block beside Report
    (2030-13-t4a-drive).
  * At 1.0x: during the location reveal a second, dimmer pin sits under the orange one on the event
    map (x-09-going-1).
  * Exploration at 393: the Demo night and Map layers sheets stack over the Tonight map sheet, with
    two grab handles showing (e-03-demobadge, e-05-layers).
* **L3** a real dark map on web with the same pins and clusters: **met**. Stadia dark tiles, a "2"
  cluster, the live pin and the area circle, with the pins kept above the sheet.
* **L4** the four motion moments: **met**.
  * Going: the pin animates and the toast comes at once.
  * Location shows: the "LOCATION SHOWN" card.
  * Check in: the ring bursts into the tick.
  * Trophy: the results cover appears after Done.
* **L5** three screens I'd share: **met**: the trophy cover (x-15-afterdone), the Garage card with
  the Fiesta photo (x-24-garage) and the live event hero (x-08-event). All the demo photos are still
  daytime street shots.

Anchor 4's line, "visible clipping, overlap or misalignment … at 1.3x text", is true: the trophy
cover and the onboarding placeholder. So anchor 6's "consistent and tidy" can't be fully true. All of
4 and most of 6 gives **5**. It's the top of the band. With the cover and the placeholder fixed at
1.3x, and the Add a mod segments kept on one row, anchor 6 holds. L1, L3, L4 and L5 are already met,
so that would make 7.

### 8+ criteria summary

| Met | Missed |
|---|---|
| C1, C2, C3, C4, C6, K2, K5, L1, L3, L4, L5 | **C5, K1, K3, K4, L2** |

## 4. Rule breaks, counted

Owner exceptions not counted:
* "+150 rep" after check-in;
* the level line on Me;
* the ladder sheet with its level names (including "Legend");
* the drive view's End as its back.

**On screens met in the tasks: 3.**

| # | Rule | Screen | Break | Shot |
|---|---|---|---|---|
| 1 | 4.3 (and 3.5 "Must NOT show") | Event, going, location hidden (task 10) | "CAN'T MAKE IT" is the only button in the ActionBar. Destructive actions belong in `···` or a ConfirmSheet, and 3.5 says Can't make it is never a button. The state should show the status pill and Remind me. The `···` menu holds only Report. | x-41-sunday, 1230-10-t10c-left |
| 2 | 4.1 | Chat with @em_i30n (task 7) | The pushed chat has a header title, "@em_i30n", in mixed case. Detail screens have no title, and forms and settings have a caps title. It's also a person without an avatar (K3). | x-22-chat, x-23-sent |
| 3 | 4.3 | Host step 2, Place the meet point (task 9) | The primary "Set meet point here" sits in a floating card over the map, not in the pinned ActionBar used on every other T4 step. | x-34-place |

**Outside the tasks: 2.**

| # | Rule | Screen | Break | Shot |
|---|---|---|---|---|
| 4 | 4.5 sheet on sheet | Tonight: Demo night, Map layers | Both open as a second sheet over the Tonight map sheet, with two grab handles stacked. | e-03-demobadge, e-05-layers |
| 5 | 4.6 / 3.12 | Search, no results ("qwxyz") | The only line is "Full address search works in the iPhone app; towns work here.": a platform note instead of "Nothing called that near you." | e-11-search-zzz, b-search-none |

**Total: 5** (3 on task screens).

**Borderline, not counted:**
* The "+150 rep" card stays on the event page for the rest of the night (t8back2), beyond the moment
  itself.
* The map cluster's "2" is a number badge in sodium (4.8 says number badges are red and only for
  things waiting for you). I took it as part of the pin.
* The going toast's "CHANGE" takes a tap (4.7 allows only Undo), but 3.5 specifies "· Change".
* The Tonight header row is shorter than the other tab headers (problem 14).

Look-checklist exceptions (counted under L2, not as rulebook breaks):
* the trophy cover at 1.3x;
* the onboarding placeholder at 1.3x;
* the Add a mod segments at 1.3x;
* the drive view's route credit at 1.3x;
* the double pin during the reveal;
* the stacked sheets at 393.

## 5. Problems, ranked

| # | Severity | Screen | Steps | What's wrong | Shot |
|---|---|---|---|---|---|
| 1 | Medium | Host step 3 and the posted meet | Host a meet, choose nothing on step 3, post, Open the meet | Step 3 says "Who can come: Everyone", but the meet page says "Open to: Anyone within 25 mi" and "0 requests · Anyone within 25 mi". The demo meets say "Open to: Anyone within 30 mi". The invite radius is shown as an entry limit, which is the confusion step 3 was rewritten to fix (C5, hesitation 2). | x-36-host3, e-83-open-meet, e-83b-open-meet-bottom |
| 2 | Medium | Live event, voting and results | Check in, Vote, pick one, Done | The page behind the sheet says "Results tomorrow 23:00." Done flips it to "Results are in." with demo winners. The winner is then said three times (line, cover, row). It's unclear whether the other two trophies still need a vote: "2 more to vote" disappears (C5, hesitation 1). | x-14-voted-1, x-15-afterdone |
| 3 | Medium | Trophy cover at 1.3x | 1.3x text, check in, vote, Done | The wordmark is clipped to "NIGHTSHIF" and the car name breaks "Hyundai i30 / N" on the cover people are meant to share (L2). The same clipping applies to the past meet's cover. It may be capped on iOS; on web it isn't. | 2030-13-t6c-results |
| 4 | Medium | Event, going, location hidden | Me, Sunday coffee and cars | "CAN'T MAKE IT" is the ActionBar's only button, and `···` has only Report. Spec 3.5: a status pill "Location at 09:00" and Remind me, with Can't make it in `···` (break 1). | x-41-sunday |
| 5 | Low | Chat | Connect, Message | The header is a bare "@em_i30n" title, and the event chat preview shows "@handle · time" with no avatars (4.1, K3). | x-23-sent, x-09-going-1 |
| 6 | Low | Host step 2, Place the meet point | Host, Next, tap the map | The primary sits in a floating card rather than the ActionBar. The instruction runs to three lines ("Move the map so the crosshair is… or tap a grey pin… Orange outlines are meet bans.") (4.3, K4). | x-34-place |
| 7 | Low | Chat to tab bar | Task 7 then task 8 | Four backs (chat, profile, going list, event) to reach any tab. Nothing is wrong, but it's slow, and the stack from Message goes through the profile and the going list. | 1230-10-t8back0–3 |
| 8 | Low | Tonight sheets | Tap Demo night or Map layers | The new sheet opens over the map sheet, with two grab handles visible (break 4). | e-03-demobadge, e-05-layers |
| 9 | Low | Search | Search "qwxyz" | No "nothing found" line, only a platform note about the iPhone app (break 5). Search "fiesta" finds only @jordST, not my own Fiesta or Fiesta meets. | e-11-search-zzz, e-12-search-fiesta |
| 10 | Low | 1.3x text, onboarding and Add a mod | 1.3x, Try the demo; Garage, Add a mod | The search placeholder is cut to "e.g. Fies". The four mod segments wrap into a 2x2 block that no longer reads as one control. | 2030-13-t1a-onb1, 2030-13-t8a-sheet |
| 11 | Low | Tonight with location on | Allow location while away from home (for example in London) | Distances switch to the phone's position ("about 101 mi"), while the map and "Around Tamworth" stay on home. "Near you" cards 100 miles away, with no hint why (seen with a London geolocation; the scored runs had location off). | x-07-tonight-1230 |
| 12 | Low | Event map during the reveal | I'm going on the live meet | A second, dimmer pin sits under the orange pin while "LOCATION SHOWN" shows. | x-09-going-1 |
| 13 | Low | Drive view | Navigate | Heading-up, but the orange route trails behind and to the left of the arrow, so the way ahead isn't obvious. At 1.3x the route credit is a two-line block beside Report. | x-10-nav, 2030-13-t4a-drive |
| 14 | Low | Tab headers | Switch Tonight to Garage | Tonight's header row is shorter: the title, "+" and bell sit about 6 pt higher than on Community, Garage and Me, so the header jumps when you change tab. | x-07-tonight-2030, x-24-garage |
| 15 | Low | Platform notes | Settings, bottom; Add a car or bike, Photos | "Check for updates" is a disabled button ("Updates work in the installed iPhone app, not in this preview."). Add a car says "(Automatic plate detection only works in the iPhone app.)". Settings says "On the web, these show under the bell only." | e-41-settings-bottom, e-b2-addcar-bottom |
| 16 | Low | Me, Trophies | Check in, then open Me | "None yet. Check in at a meet, and the people there vote…" is still shown after checking in and seeing a result. | 1230-10-t10b-me |
| 17 | Low | Demo photos | Any | Every photo is a daytime street shot, not a night meet. | x-08-event, x-24-garage |

## 6. Compared with Review 14

Review 14 scored **Clarity 7, Coherence 5, Look 5**, with 10/10 at each time and size. Review 15
scores **Clarity 7, Coherence 6, Look 5**, again with 10/10 at each time and size.

**Fixed since Review 14 (checked):**
* **Map-sheet preview (R14 #1):** a card in the Tonight sheet now pushes the event page, the same as
  in List. This was the anchor 4 line that held Coherence at 5.
* **Your profile (R14 #3):** it has Save, and back with a change asks "Discard your changes?"
  (Discard it / Keep editing).
* **Going toast (R14 #4):** "You're going · CHANGE" shows straight away, on one line.
* **"Waiting for…" (R14 #6):** it now has a Cancel request button.
* **Host step 3:** "Who can come: Everyone / Who we'll tell: drivers within 25 mi" separates the two.
  Step 4's location row uses "People going see it at 09:00 (1 h before)."
* **"It's up" page:** the hero map fills its box. The credits at 1.3x stay on one line on the small
  maps.
* **Class:** explained one way, by bhp for its weight, on Add a car, Power and dyno and Help.
* **Add a car or bike:** one SegmentedControl, with Engine swap as a switch (K2 now met).
* **Onboarding:** "Ford Fiesta ST · 5 versions" above five rows, with the plain Fiesta in its own
  group.
* **Smaller fixes:**
  * The forum says "Tonight 01:10".
  * Notifications has a glyph and an action.
  * The "LOCATION SHOWN" eyebrow is grey, not sodium.
  * The profile hero is avatar + @handle.
  * The feed meta line isn't cut at 393.
  * The "Sent" toast no longer covers the bubble at 1.3x.
  * The credits name Stadia/OpenStreetMap and OSRM.
* **Breaks:** on task screens they dropped from 5 to 3, and none of Review 14's 10 breaks remains.

**New or worse:**
* **The posted meet says "Open to: Anyone within 25 mi"** after the host chose "Everyone". The fix
  to step 3 moved the confusion to the meet page (problem 1).
* **The trophy cover clips at 1.3x** ("NIGHTSHIF", "i30 / N"). Review 14 saw the cover fine at 1.3x.
* **"Can't make it" is the ActionBar button** on a going, location-hidden meet (break 1). Review 14
  didn't count it.
* **Not counted or noticed in Review 14:**
  * the chat header title;
  * the place picker's floating primary;
  * sheets stacking on the map sheet;
  * the Search platform note.

**Still there:**
* **Results:** the "Results tomorrow 23:00" line against demo results, and the winner said more than
  once (C5).
* **1.3x layout:** the Add a mod segments wrap, and the drive credit is large.
* **Photos:** daytime demo photos.

**Net:**
* **Clarity** stays at 7. C6 is met again, so only C5 is missed. Fixing the results wording and the
  "Open to" line would make C5 true and give 8.
* **Coherence** goes up from 5 to 6. Three breaks remain on task screens and no anchor 4 line is
  true. Removing the three breaks, and giving the chat header an avatar, would meet K1, K3 and K4.
* **Look** stays at 5, held only by clipping at 1.3x: the trophy cover and the onboarding
  placeholder. Fixing those two (and the Add a mod segments) makes anchor 6 fully true. With L1 and
  L3–L5 met, that gives 7.

# Review 18: fixed scorecard

Scored against `REDESIGN-2.md` section 7 (fixed scorecard) and section 8 (8+ criteria), read before
testing. Section 4 (the rulebook, with its owner exceptions) and section 9 were read only after the
task runs, to count rule breaks. Review 17 was read last, for the comparison only.

**Set-up:** `a2add70` on main. `npx expo export --platform web --clear` into
`~/nightshift-wt/r18-web`, served with SPA fallback on port 8618 and killed by PID afterwards. My own
headless Chromium (Playwright from Node scripts, not the shared MCP browser): 375x667, touch and
mobile emulation, @2x, Europe/London, en-GB, demo mode, Busy night off. **Location permission was
granted** (a fixed point in Birmingham, about 15 mi from the demo's Tamworth meets), so Tonight's
distances are "from you" here, unlike Review 17, which ran without location. Four scored runs, each
from cleared storage: browser clock 12:30 and 20:30 on Thu 19 Nov, each at 1.0x and 1.3x text. Then
free exploration at 393x852, then one pass with Busy night on (not scored). Screenshots are in
`~/nightshift-wt/r18-shots`:

* `t1-…` to `t10-…` and `x-…`: the first, unscripted walk-through at 12:30, 1.0x. The hesitations and
  human times come from it.
* `run-1230-1-…`, `run-2030-1-…`, `run-1230-1.3-…`, `run-2030-1.3-…`: the scored runs, numbered by
  step.
* `e-…`: exploration and follow-up checks. `b-…`: Busy night.

**Limits:**
* Human times are my estimate from the walk-through (reading, choosing and tapping, about 1.5 s a tap
  plus reading). The script's wall time is given next to them.
* 1.3x text is simulated by multiplying each element's computed font size and line height by 1.3,
  once per element, through a MutationObserver. SVG `tspan`s inside a `text` are skipped so nested
  text isn't scaled twice.
* Web Share: headless Chromium has no `navigator.share`, so the web build opened its own "Share this
  meet" sheet (link and Copy link). That counts as the share sheet.

## 1. Task table

All four runs gave the same outcomes. The visible text at every step was diffed between 12:30 and
20:30: the only differences are the random demo handle (`@fiesta_NNNN`) and my hosted meet's
distance (12 mi or 11 mi, from where the map crosshair landed), neither of which follows the clock.
The demo night (Fri 20 Nov, about 21:10) makes both clocks the same. No crash, no on-screen error and
**no console errors** in any run.

### 12:30 and 20:30, 1.0x text (identical)

| # | Result | Human | Script | Taps | Notes (shots) |
|---|---|---|---|---|---|
| 1 | Pass | 30 s | 9.1 s | 6 + typing | Try the demo before the 18+ tick: "Tick the box to say you're 18 or over first." (t1-a). "Fiesta ST" gives "Ford Fiesta ST · 5 versions": which is mine? (about 4 s, t1-c). Mk8 shows as a photo row (t1-d). Next, "Where's home? Around Tamworth", handle filled in, Show me tonight (t1-e, t1-f). Garage has the Fiesta with a photo (t8-a). |
| 2 | Pass | 4 s | 2.1 s | 1 | The live "Car park meet-up" card leads the map sheet. Tap it: the event page (t2-a). |
| 3 | **Fail** | 8 s | 3.1 s | 2 | I'm going works ("Going with your Fiesta ST Mk8" in the ActionBar after) but an **Invite connections** sheet slides up at once, over the page (t3-a). The "You're going" toast is drawn under the sheet; the pin animation and the location reveal play under its scrim (x-going strip). I read the sheet for about 5 s and tapped Done: the toast had gone (t3-c). The script, tapping Done after 2.3 s, does see it (run-1230-1-09-going-after). At human pace the toast is not seen, so the task fails on "toast seen". |
| 4 | Pass | 10 s | 3.4 s | 2 | Navigate opens the route preview ("6 min 2.9 mi · Arrive 21:16", t4-a). The primary is **START · 5**, counting down: while I read the demo note it started turn-by-turn on its own (t4-b). End brought me back to the event (t4-c). |
| 5 | Pass | 3 s | 1.5 s | 1 | The ring bursts into a tick, "+150 rep · For turning up.", toast "Checked in". Vote becomes the primary (t5 frames). |
| 6 | Pass | 30 s | 7.0 s | 6 + file | Vote opens "Vote: Best car" (t6-a). BMW M4, "✓ Your vote", toast "Voted for BMW M4 Competition", Done. The page shows "Results are in." with the Best car cover (t6-c). Add a photo, file, "Crop the photo", Use this crop, "Photo posted"; "Photo by You" is first in Photos (t6-g). |
| 7 | Pass | 35 s | 9.7 s | 5 + typing | "11 going · 8 cars, 3 bikes", @dan_r, Connect, "Request sent", "Waiting for @dan_r to accept" for about 4 s with nothing saying it will be quick, then CONNECTED and Message. Typed, Send, toast "Sent" (t7-a to t7-f). |
| 8 | Pass | 15 s | 6.0 s | 7 | Three backs from the chat to the tab bar, Garage, Add a mod, Cold air intake, "Add cold air intake". Toast "Added. Now 201 bhp, Class B"; the card says "201 bhp · 1 mod" with the B badge (t8-a to t8-d). |
| 9 | Pass | 60 s | 10.9 s | 14 + typing | "+" on Tonight, name, Starts Change, Sun 22, 10 (ends Sun 13:00), Done. Step 2: Next before placing gives "Tap the map to place the meet point." Tap the map, Set meet point here, names filled in. Step 3 "Who can come: Everyone". Step 4 "Sun 10:00–13:00 … Everyone", Post meet, toast "Invites sent to 18 people nearby", Share, "Share this meet" sheet (t9-a to t9-k). |
| 10 | Pass | 25 s | 6.6 s | 9 | Back to Tonight; Sunday coffee and cars is below the fold of the map sheet, so List and scroll (about 4 s). ActionBar "Going" + **Can't make it**; ConfirmSheet "Yes, I can't go / I'm still going"; toast "You're not going to Sunday coffee and cars · UNDO". Back, Me, gear: "Show me in People near you" first under Privacy (t10-b to t10-h). |

**12:30: 9/10. 20:30: 9/10.**

### 12:30 and 20:30, 1.3x text

| # | 12:30 | 20:30 | Script | Notes |
|---|---|---|---|---|
| 1–10 | 9/10 | 9/10 | Same as 1.0x (±0.2 s) | Same outcomes; task 3 fails the same way. Nothing clipped on a task screen: an overflow scan at every step found no cut text (only the date strip in the Starts sheet, which scrolls sideways by design). Me's meet rows now wrap to three lines instead of the Review 17 ellipsis (e-me-13). The drive title wraps to two lines cleanly. The Community badge sits over the corner of its tab icon (as at 1.0x). |

## 2. Time to understand

| Measure | Result | Target | Pass? |
|---|---|---|---|
| TTU-1 | About 3 s. "What's on tonight near you. Go with your car." over a photo, then "See tonight's meets near you / Say you're going, with your car / Check in and vote for the best build" (x-start). Covers car meets, near me and tonight, and going with my car. | ≤ 5 s | Pass |
| TTU-2 | About 30 s from Try the demo to the first I'm going tap (the 18+ tick, the Fiesta choice, step 2, the live card). | ≤ 60 s | Pass |

**Hesitations over 5 s:**
1. Task 3: the Invite connections sheet appears the moment I say I'm going. Do I have to invite
   someone? Invite is greyed out ("pick someone first"); Done is the way out. About 5 s. *Wording and
   flow.*

**Hesitations under 5 s:**
* Task 1: tapped Try the demo before ticking 18+ (the message says what to do); five Fiesta ST
  versions to choose from.
* Task 4: the route preview starts navigating by itself after 5 s.
* Task 7: "Waiting for @dan_r to accept" for about 4 s.
* Task 8: three backs from the chat before the tab bar shows.
* Task 10: the Sunday meet is below the fold of the map sheet; List and scroll to find it.

## 3. Scores

### Clarity: **6**

| Criterion | Result | Evidence |
|---|---|---|
| C1 TTU-1 ≤ 5 s | **Met** | About 3 s. |
| C2 10/10 at both times | **Missed** | 9/10 at 12:30 and 20:30, at 1.0x and 1.3x: task 3's toast is hidden by the Invite connections sheet. |
| C3 inside the limits; TTU-2 ≤ 60 s | **Met** | Closest: task 9 (60 of 120 s), task 7 (35 of 60 s), task 10 (25 of 45 s). TTU-2 about 30 s. |
| C4 no 4.12 word | **Met** | A scan of the visible text at every scored step finds only "+150 rep" after check-in and "Level 2 · Regular" on Me, both owner exceptions. |
| C5 each fact said once | **Missed** | On a live meet, "live" twice: "● LIVE · MEET" on the photo and "Live · until 23:00" under it, on the Tonight card and the event page (t1-f, t2-a). On the live meet I'm going to, "going" twice: the GOING badge on the photo and "Going with your Fiesta ST Mk8" in the ActionBar (x-going-0). |
| C6 no dead ends; errors say what to do | **Missed** | A disabled primary: the Invite connections sheet's **Invite** ("Invite: pick someone first"), met in task 3 on every run. Every error does say what to do (18+, "Give the meet a name.", "Pick a part, or tap Something else to type one.", "Tap the map to place the meet point."), and every bad link (`/event/…`, `/user/…`, `/chat/…`, `/post/…`, `/drive?…`, `/settings/zzz`, `/this/is/bad`) gets a not-found screen with a way back. |

Anchor 6 is fully true: purpose clear in 10 s, 9/10 (8/10 needed), one wording hesitation over 5 s.
Anchor 8 has 3 of its 6 lines (C1, C3, C4): not most. **6.** (Anchor 4's line, "the core loop fails
once or more", is also true; the method gives the highest anchor whose every line holds, which is 6.)

### Coherence: **7**

Rulebook exceptions on the screens met in the tasks: **2** (section 4), so anchor 6 (1–5) applies.
One back style (the chevron; the crop screen's ✕ is the Cancel 4.5 allows on a step that loses work,
and the drive view's End is the owner exception).

* **K1** zero exceptions: **missed** (2, both from the Invite connections sheet after I'm going).
* **K2** one selector per job: **met**. One SegmentedControl per screen (Map/List, Feed/People/Chats,
  Car/Bike, Engine/Chassis/Wheels/Looks, All/Meets/Places/People), never nested; the Layers sheet's
  two are the owner exception. ChoiceGroup pills for meet type, How far and Open in. DateTimeSheet for
  the start. SearchField for make and model. Chips only for Layers' type filter (nothing on = all).
* **K3** one look per kind of thing: **met** on what I saw. An event row is a hex glyph + name +
  "Meet · Sun 10:00 · …" on Tonight's "This week", Search and Me; a person is avatar + @handle
  everywhere; a build is ClassBadge + name + bhp on the Going list, vote sheet, chat header, profile,
  feed and Garage.
* **K4** every screen matches a template: **met** on the task screens as far as I can see.
* **K5** one power number: **met**. 197 bhp, then 201 bhp after the mod, everywhere.

4 of 5 lines of anchor 8 with all of anchor 6: **7**.

### Look: **7**

* **L1** a photo or real map above the fold on every first-level screen at 375x667: **met**. Tonight
  map and list, Community feed, Garage, Me and every event page (t1-f, e-community, t8-a, e-me-13,
  t2-a).
* **L2** the look checklist on every screen: **missed**. The Invite connections sheet's disabled
  Invite has a dark sodium outline: sodium on a state that is neither the primary nor selected
  (t3-a). Nothing else on the task screens broke the checklist: no clipping at 1.3x, three type
  sizes per Tonight card (11/18/13 px), credits behind the (i) button, no capitals on content.
* **L3** a real dark map on web with the same pins and clusters: **met**. Stadia dark tiles, a "2"
  cluster at 375 wide, the live pin's pulse, area circles.
* **L4** the four motion moments: **missed**. Check in (ring into tick) and trophy (the results cover)
  are clear. Going and location shows play under the Invite connections sheet's scrim, so I didn't
  see them; the event page has already scrolled to the place when the sheet closes (x-going strip).
* **L5** three screens I'd share: **met**: the trophy cover (t6-c), the event page with its hero
  photo (t2-a) and the drive view (t4-b).

Anchor 6 ("consistent and tidy") holds and no line of anchor 4 is true (nothing clipped or
overlapping at 375x667 or 1.3x). L1, L3 and L5 met is most of anchor 8: **7**.

### 8+ criteria summary

| Met | Missed |
|---|---|
| C1, C3, C4, K2, K3, K4, K5, L1, L3, L5 | **C2, C5, C6, K1, L2, L4** |

Four of the six misses (C2, C6, K1, L4, and the L2 item) come from one thing: the Invite connections
sheet that opens by itself after I'm going.

## 4. Rule breaks, counted

Owner exceptions not counted: "+150 rep" after check-in; the level line on Me; check-in; the drive
view's End as its back; the Layers sheet's two SegmentedControls; Shops and Speed cameras as optional
layers (both off by default).

**On screens met in the tasks: 2.**

| # | Rule | Screen | Break | Shot |
|---|---|---|---|---|
| 1 | 4.3 | Invite connections sheet, after I'm going (task 3) | A disabled primary: **Invite** ("Invite: pick someone first"). "Never a disabled primary." | t3-a |
| 2 | 4.7 | Live event, right after I'm going (task 3) | "Every done action gets a toast", one that sits above the ActionBar. The "You're going" toast is drawn under the Invite connections sheet that opens at the same moment, so it isn't seen unless Done is tapped within about 3 s. | x-going strip, t3-c |

**Outside the tasks: 0 found.** Re-checked the Review 17 breaks: the forum has no "+" in its header
(e-forum), Send feedback asks "Discard it / Keep editing" (e-fb-back), Edit profile has no Region
pills any more (e-editprofile).

**Borderline, not counted:**
* The crop screen's ✕ (Cancel) at top left, where every other screen has the chevron. 4.5 allows
  Cancel on a step that loses work; Review 17 read it the same way.
* The route preview has no back arrow ("Not now" is its way out) and counts down to start by itself.
  It is part of the drive view, whose End is the owner exception.
* "DEMO RESULTS" as the section label on a live meet's results, and "Home area set: the demo area
  (Tamworth)" on Edit profile: the demo naming itself.
* The Going list has a caps title on a pushed list screen (4.1 names only detail screens and forms).

**Total: 2.**

## 5. Problems, ranked

| # | Severity | Screen | Steps | What's wrong | Shot |
|---|---|---|---|---|---|
| 1 | High | Event, I'm going | Car park meet-up, I'm going | The Invite connections sheet opens by itself on every I'm going. It hides the "You're going" toast (task 3 fails, break 2), covers the going and location-shows motion (L4), and its primary is disabled (break 1, C6). Showing the toast and the reveal first, and offering "Bring your mates" as a secondary or a row on the page, would clear C2, C6, K1 and L4. | t3-a, x-going strip, t3-c |
| 2 | Medium | Route preview | Event, Navigate | "START · 5" counts down and starts turn-by-turn while you're still reading; "Not now" disappears. A first-time user asked to "get directions, then come back" is put into navigation without asking for it. | t4-a, t4-b |
| 3 | Medium | Tonight, drive view, Me | Location allowed, open Tonight, Navigate, Me | One meet, three distances: Tonight "about 15 mi" (from my GPS), the route "2.9 mi" (it starts from a demo spot near Tamworth, not from me), Me and Search "2 mi from home". Each follows 4.9 on its own, but together they don't add up. The demo route should start from the same place Tonight measures from. | t1-f, t4-a, t10-g |
| 4 | Medium | Tonight map sheet | First open; after hosting; after leaving | "3 meets tonight · 4 hidden by filters" counts Sunday's coffee meet as tonight (yours always show). After hosting a Sunday meet it says "4 meets tonight"; after leaving the coffee meet it says "5 hidden by filters". | t1-f, t10-a |
| 5 | Low | Tonight card, event page | Any live meet | "Live" twice: "● LIVE · MEET" over the photo and "Live · until 23:00" under it (C5). | t1-f, t2-a |
| 6 | Low | Live event, going | I'm going | "Going" twice: the GOING badge on the photo and "Going with your Fiesta ST Mk8" in the ActionBar (C5). The Sunday meet, also going, has no badge: the two pages differ. | x-going-0, t10-d |
| 7 | Low | Connect | Profile, Connect | "Waiting for @dan_r to accept" for about 4 s, then it flips to Message. Nothing says the demo will accept, so a tester may leave. | t7-c, t7-d |
| 8 | Low | Tonight map sheet | Task 10 | Only the first card shows above the fold; a meet you're going to on Sunday needs List and a scroll. | t10-b, t10-c |
| 9 | Low | Photos | Sign-in, Car park meet-up, Friday night meet (Busy) | Plate-blur boxes sit in the background as grey smudges (sign-in hero, top middle; event hero, top right; a large one on Friday night meet). They read as damage, not privacy. | x-start, t2-a, b-event |
| 10 | Low | Vote | Vote one trophy, Done | Done ends voting for you: Vote leaves the ActionBar and "Results are in." shows, with Best bike and Best in show never voted. Only How Nightshift works explains it's a demo shortcut. | t6-c, e-help |
| 11 | Low | Small maps | Onboarding step 2, Sunday coffee and cars | A white sliver at the top edge of the map card (a clipped road label). | t1-e, t10-d |
| 12 | Low | Garage header | Garage tab | "+" adds a car here, hosts a meet on Tonight and posts on Community: same place, three jobs (allowed by 4.1). | t8-a |

## 6. Busy night (Settings › Demo › Busy night; not scored)

No crash, no console error, no broken screen. Notes:

* **Invite connections gets worse:** with 9 connections the sheet fills the screen, "Share another
  way" goes below the fold and the disabled Invite sits at the bottom (b-going-tap).
* **Badge:** Community jumps straight to **15** (5 connection requests plus unread chats), while the
  Chats list shows three unread dots (b-chats, b-people). The bell stays empty: Busy night adds no
  notices.
* **Count line:** "8 meets tonight · 4 not open to your car · 17 hidden by filters" wraps to two
  lines; after Show all the line disappears and there's no way to see what the filters were hiding
  versus not (b-tonight, b-showall).
* **Same area name everywhere:** Friday night meet, Car park meet-up and Sunday coffee and cars are all
  "Around Tamworth".
* **Photo blur:** Friday night meet's hero has a large blurred box over the background (b-event).
* **Going state:** once, a reload under a second after I'm going on Friday night meet lost the going
  state; with a short pause it kept it. Not something a phone user would hit.
* **Map:** fine. Clusters ("5", "6", "3", "2") and pins don't overlap; the Coventry pin sits next to the
  map controls.

## 7. Compared with Review 17

Review 17 scored **Clarity 7, Coherence 7, Look 7**, with 10/10 at each time and size and 1 break on
the task screens. Review 18 scores **Clarity 6, Coherence 7, Look 7**, with 9/10 at each time and size
and 2 breaks on the task screens. No console errors in either.

**Fixed since Review 17 (checked):**
* **Going toast's CHANGE (R17 break 1, #6):** the toast is now "You're going" with no action.
* **Me at 1.3x (R17 #2):** the meet rows wrap; no ellipsis.
* **"Results are in." next to "1 of 3 voted" (R17 #3):** no longer side by side; How Nightshift works
  explains the demo shortcut (problem 10 is what's left).
* **Sunday meet said twice (R17 #4):** no GOING badge on its photo, no "Remind me at 09:00"; one
  "Going" pill and one "Location shows at 09:00."
* **LOCATION SHOWN card (R17 #5):** not left on the map after going.
* **Breaks outside the tasks (R17 2 to 6):** the forum's "+", Send feedback's back and Region's pills
  are fixed (re-checked). I didn't re-check Settings › Sign in or the past meet's trophy rows.
* **Onboarding car row (R17 #13):** a real photo now (t1-d). The check-in ring stays inside its card.
* **Me stats (R17 #10):** the counts match the meets listed.

**New or worse:**
* **Invite connections after I'm going (problem 1):** new with "Bring your mates" (`13030f9`). It
  causes both task-screen breaks, fails task 3 at human pace, hides two motion moments and adds a
  disabled primary. It alone takes Clarity from 7 to 6 and keeps K1, L2 and L4 from being met.
* **Route preview countdown (problem 2):** not reported in Review 17.
* **Distances with location on (problem 3) and the "meets tonight" count (problem 4):** Review 17 ran
  without location, so the GPS distances never showed; the count line may have been there before.

**Still there:**
* **C5:** "live" twice on live meets, and "going" twice on the live meet I'm going to.
* **Daytime demo photos, the five Fiesta ST versions, three backs from a chat to the tab bar, the
  same "+" for three jobs.**

**Net:**
* **Clarity** drops to 6: task 3 now fails, and the Invite sheet's disabled Invite misses C6.
  Showing the toast and the reveal before offering invites (not in a sheet that opens itself), and
  saying "live" and "going" once, would meet C2, C5 and C6 and give 8.
* **Coherence** stays at 7. The two breaks are both the Invite sheet; fixing it meets K1 and gives 8.
* **Look** stays at 7, with different misses: Review 17's 1.3x clip and ring spill are fixed, but the
  Invite sheet now hides the going and location-shows moments (L4) and puts sodium on a disabled
  button (L2). Fixing the sheet would leave all five L lines met.

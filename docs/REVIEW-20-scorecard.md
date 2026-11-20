# Review 20: fixed scorecard and path to 10

Scored against `REDESIGN-2.md` section 7 (fixed scorecard) and section 8 (8+ criteria), read before
testing. Section 4 (rulebook, with its owner exceptions) and section 9 (owner decisions) were read
only after the scored runs, to count breaks. Review 19 was read last, for the comparison and its
path-to-10 list.

**Set-up:** `2bbbb95` on main. `npx expo export --platform web --clear` into `~/nightshift-wt/r20-web`,
served with SPA fallback (the scorecard's own `serve()`, in its own process, killed by PID at the
end). My own headless Chromium from a Node Playwright script: 375x667, touch and mobile emulation,
@2x, Europe/London, en-GB, cleared storage per run, demo mode, Busy night off, **location granted**
at a point about 15 mi north of the demo area (just outside Lichfield). Four scored runs: browser
clock 12:30 and 20:30 on Thu 19 Nov, each at 1.0x and 1.3x text (the scorecard's own scaler). Then
free exploration at 393x852 and one Busy night pass (not scored). JPEG screenshots in
`~/nightshift-wt/r20-shots`:

* `a…`: the first, unscripted walk-through at 12:30, 1.0x. Hesitations and human times come from it.
* `b-…` (20:30, 1.0x), `c-…` (12:30, 1.3x), `d-…` (20:30, 1.3x): the other three runs, scripted at
  human pace (about 2.5–4 s reading each screen, 3.4 s watching each toast), same step names.
  `sheet-c0..3.jpg` are contact sheets of the 1.3x run.
* `e…`: exploration and Busy night at 393x852. `f-…`: follow-up checks.

**Limits:** human times are my estimate from the walk-through (about 1.5 s a tap plus reading); the
scripted runs' times are wall time at a set human pace, so they are lower bounds. Headless Chromium
has no `navigator.share`, so the web "Share this meet" sheet counts as the share sheet; the photo
picker is the web file chooser. In the scripted runs I already knew the app, so they can't show
hesitation; they show outcomes, text and layout at each time and size.

## 1. Task table

The demo night (Fri 20 Nov, about 21:10) makes 12:30 and 20:30 identical: the same outcomes and the
same text at every step, apart from the random handle and the chat stamp. **No console errors, no
on-screen error, no crash** in any run.

### 12:30, 1.0x text (first walk-through)

| # | Result | Human | Taps | Notes (shots) |
|---|---|---|---|---|
| 1 | Pass | 45 s | 7 + typing | Tapped Try the demo before the 18+ tick (the box is grey on grey): "Tick the box to say you're 18 or over first." (a02). "Fiesta ST" lists five versions, the ST180 marked "Most common" (a04). The picked row's photo looks like a Mk8 ST, not a Mk7 (a05). Step 2: "Where's home? Around Tamworth" although the phone is near Lichfield, with "Use my location instead" under it (a06). Show me tonight; the Garage has the Fiesta (a31). |
| 2 | Pass | 4 s | 1 | The live "Car park meet-up" card leads the map sheet (a07); tap, event page (a08). |
| 3 | Pass | 4 s | 1 | I'm going: the page scrolls to the map, toast "You're going", "Going with your Fiesta ST Mk7 ST180" in the ActionBar (a09). The "Location shown" chip draws in huge spaced letters and sits behind the toast; the pin vanishes for a moment and drops back (a09-going1/2, a10). |
| 4 | Pass | 12 s | 2 | Navigate: route preview "6 min 2.9 mi drive · Arrive 21:17", "Starting in 3" (a11). While I read, it started turn-by-turn (owner exception 9.9, a12). End brought me back to the event (a13). |
| 5 | Pass | 5 s | 1 | Check in: "+150 rep · For turning up. It shows on your profile." with a tick ring, toast "Checked in"; Vote primary, Add a photo secondary (a14-checkin1). As the card fades it overlaps the going row (a14-checkin3); then nothing on the page says I'm checked in (a15). |
| 6 | Pass | 40 s | 6 + file | Vote, "Vote: Best car", BMW M4, "✓ Your vote", toast "Voted for BMW M4 Competition", Done (a16, a17). The page now shows "Demo: how Best car went" with a SLIPSTREAM trophy card for the M4 and "2 more to vote" (a18): the trophy moment. Add a photo, file, "Crop the photo", Use this crop, toast "Photo posted" (a21, a22). My photo is first in Photos and fills its tile, **but every other tile in the grid is a blown-up corner of a photo: a car roof, grass, a white pillar, a wall** (a23, a24, f-eventgrid). |
| 7 | Pass | 30 s | 6 + typing | "11 going · 8 cars, 3 bikes", @jordST, Connect, toast "Request sent", "Demo: @jordST will accept in a few seconds", CONNECTED, toast "@jordST accepted. Say hello.", Message, type, Send, toast "Sent" (a25 to a30). Send on an empty box says "Write a message first." (a29). |
| 8 | Pass | 20 s | 4 | Garage tab (the chat keeps the tab bar now), Add a mod, Cold air intake (ticked, "Power gain, bhp (optional)"), "Add Cold air intake". Toast "Added. Now 183 bhp, Class B"; card "183 bhp · 1 mod" with the B badge (a31 to a34). |
| 9 | Pass | 85 s | 14 + typing | "+" on Tonight, name, Starts Change, Sun 22, Show earlier hours, 10, Done (ends Sun 13:00), Next; Next without a point says "Tap the map to place the meet point." (a42); tap the map, Set meet point here, Next, "Who can come: Everyone", Next, Check and post, Post meet, toast "Sent to 18 people nearby", Share, "Share this meet" sheet (a35 to a48). The "It's up" hero is a drawn grid with an orange dot, not a photo or the real map (a47). |
| 10 | **Fail** | 60 s | 9 | I had named my meet "Sunday coffee and cars" (my own words, not the example). "The Sunday coffee meet" read as the Sunday 10:00 meet I had just hosted, so I opened it, `···`, "Cancel this meet…", "Cancel the meet?", Cancel it, toast "Meet cancelled" (a49 to a52). Then Me, gear, "Show me in People near you" under Privacy (a56). Me still listed **"Sunday coffee and cars · GOING"**: a seeded meet the demo had put me down for, which I had never seen (a54, a55). Wrong outcome: still going to the intended meet. Once I knew, Can't make it, "Yes, I can't go", toast "Not going · UNDO" worked (a57 to a59). |

**12:30, 1.0x: 9/10.** Task 10 fails on the wrong outcome; see problem 2.

### 20:30 1.0x, 12:30 1.3x, 20:30 1.3x (scripted at human pace)

All three: same screens and text as the walk-through, **10/10** on the intended path (I named the
meet "Morning meet at the services" and went Me › Sunday coffee and cars › Can't make it). As a
fresh tester the 20:30 run would have the same task-10 trap, since the demo is identical.

| # | Script time (each run) | Taps | Limit |
|---|---|---|---|
| 1 | 29 s | 6 + typing | 60 s |
| 2 | 3 s | 1 | 20 s |
| 3 | 4 s | 1 | 15 s |
| 4 | 8 s | 2 | 20 s |
| 5 | 5 s | 1 | 15 s |
| 6 | 18 s | 6 + file | 90 s |
| 7 | 18 s | 6 + typing | 60 s |
| 8 | 14 s | 4 | 45 s |
| 9 | 43 s | 14 + typing | 120 s |
| 10 | 23 s | 7 | 45 s |

At 1.3x: no cut text on a task screen. The map on Tonight shrinks to a strip about 150 px tall and
the count line wraps; the route preview's title wraps to two lines and a red hazard marker is cut by
the map's top edge; the "It's up" meta line sits under the ActionBar until you scroll (sheet-c0..3).

## 2. Time to understand

| Measure | Result | Target | Pass? |
|---|---|---|---|
| TTU-1 | About 4 s. "What's on tonight near you. Go with your car." over a night photo, then "See tonight's meets near you / Say you're going, with your car / Check in and vote for the best build" (a01). | ≤ 5 s | Pass |
| TTU-2 | About 48 s from the first Try the demo tap to I'm going (the 18+ error, the Fiesta version, step 2, the live card, I'm going on the event page). Script: 37 s. | ≤ 60 s | Pass |

**Hesitations over 5 s (walk-through):**
1. **Task 10, which Sunday meet** (about 10 s, then the wrong one). Nothing in tasks 1–9 showed me I
   was going to a seeded "Sunday coffee and cars"; the host flow let me post my own Sunday 10:00 meet
   with no clash warning. *Wording and demo data.*
2. **Onboarding step 2** (about 6 s): "Where's home? Around Tamworth" for a phone near Lichfield, and
   "Use my location instead" under it. Is it using my location or not? *Wording.*
3. **The trophy card right after my vote** (about 6 s): "Demo: how Best car went" shows the car I
   voted for as Best car the moment I close the sheet. Did my one vote decide it? *Wording.*
4. **Starts sheet** (about 6 s): the hour row is 17–23; 10 needs "Show earlier hours", which then
   adds three uneven rows (00–05, 06–11, 12–16). *Layout.*
5. **Route preview** (about 5 s): driving started while I read. *Owner exception 9.9; noted, not
   counted.*

**Under 5 s:** the 18+ tick; "2 meets tonight · 4 hidden by your filters" when I set no filters;
after check-in, did it stick? (nothing on the page says so once the card fades).

## 3. Scores

Method as Reviews 11–19: the highest anchor whose every line is true; a score between anchors means
all of the lower anchor and most of the higher one's lines.

### Clarity: **7**

| Criterion | Result | Evidence |
|---|---|---|
| C1 TTU-1 ≤ 5 s | **Met** | About 4 s. |
| C2 10/10 at both times | **Missed** | 9/10 in the first walk-through at 12:30 (task 10, wrong outcome). The 20:30 demo is identical, so a fresh tester meets the same trap. |
| C3 inside limits; TTU-2 ≤ 60 s | **Met** | Closest: task 9 (85 of 120 s), task 1 (45 of 60 s). TTU-2 about 48 s. |
| C4 no 4.12 word | **Met** | Only "+150 rep", "Level 2 · Regular" and "Tap anywhere to stop" (owner exceptions). |
| C5 each fact said once | **Missed** | The cancelled meet's page says it three times: "Cancelled · Sun 10:00–13:00 · Around Tamworth", the location line "Cancelled by the host.", and the chat line "Hosts cancelled the event · 21:16" (a52). The event page, route preview, Settings and Me are clean now. |
| C6 no dead ends; errors say what to do | **Met** | No disabled primary. "Tick the box…", "Write a message first.", "Tap the map to place the meet point." |

Anchor 6 is fully true (purpose clear in 10 s; 9/10; three wording hesitations over 5 s, the most it
allows). Anchor 8 has 4 of 6 lines. **7.** Not 8: C2 and C5. Not 10: I can explain check-in and the
location reveal, and now voting (the trophy card), but the reveal's own chip is hidden by a toast.

### Coherence: **7**

Rulebook exceptions on the screens met in the tasks: **4** (section 4): anchor 6.

* **K1** zero exceptions: **missed** (4).
* **K2** one selector per job: **met.** One SegmentedControl per screen (Map/List, Car/Bike,
  Engine/Chassis/Wheels/Looks, Feed/People/Chats); ChoiceGroup pills for meet type; DateTimeSheet
  for Starts; SearchField for make and model.
* **K3** one look per kind of thing: **met.** One event card on Tonight's map sheet and List (title on
  the photo, I'm going), ListRows with the meet glyph in Me and "This week"; the pin glyph stays the
  same after going; people are car-photo avatar + @handle; builds are ClassBadge + name + bhp.
* **K4** every screen is a template: **met** as far as I can see.
* **K5** one power number: **met.** 179 bhp, then 183 bhp, everywhere.

All of anchor 6 and 4 of 5 lines of anchor 8: **7.** Not counted (owner exceptions): the drive
view's End, the crop screen's ✕, "It's up" with no back, the lit Community tab on a profile and
chat. Not 10: the meet's noun changes between screens ("Event options", "Event reminders", "Hosts
cancelled the event"), which breaks prediction.

### Look: **5**

* **L1** a photo or real map above the fold on every first-level screen at 375x667: **met.** Tonight
  map and list, Community feed, Garage, Me, every event page.
* **L2** the look checklist on every screen: **missed.** The event page's Photos grid shows each
  sample photo at its full 1200 x 900 size inside a 112 px tile, so every tile is a meaningless
  corner (a roof, grass, a pillar, a wall), at 1.0x and 1.3x, before and after you post (a23, a24,
  f-eventgrid). Overlaps: the "+150 rep" card overlaps the going row as it fades (a14-checkin3); the
  "Location shown" chip sits behind the "You're going" toast (a09-going1). Slivers: the onboarding
  map card's top right (a06, c-04) and under Host step 2's chip (a44).
* **L3** a real dark map on web: **met.**
* **L4** the four motion moments: **met, with a flaw.** Going (toast, scroll), location shows (pin
  drop; its chip hidden by the toast), check-in (tick card), trophy ("Demo: how Best car went").
* **L5** three screens I'd share: **met.** The trophy card (a18), the Community feed's M4 post (e04),
  Tonight's List on a busy night (e10).

The 6 anchor ("consistent and tidy") is not true of the event page: its photo grid looks broken,
which is anchor 4's "visible clipping on 375x667 or at 1.3x", on a task screen (task 6's pass
condition is "shown in the event's Photos"). Review 19 gave 6 with one small overlap; this is a
bigger, permanent defect on the core screen. So the highest anchor fully true is 4, with most of 6
(consistent, photo-led, no placeholder on a first-level screen) and most of 8 lines met: **5.**
Fixing the grid alone gives 6; fixing it and the two overlaps gives 7. Not 10: nothing I'd post
unedited from the event page.

### 8+ criteria summary

| Met | Missed |
|---|---|
| C1, C3, C4, C6, K2, K3, K4, K5, L1, L3, L4, L5 | **C2, C5, K1, L2** |

## 4. Rule breaks, counted

Owner exceptions not counted: "+150 rep" after check-in; the level line on Me; "Tap anywhere to
stop" and the route preview's auto-start (9.9); the drive view's End; the crop screen's ✕; "It's
up" with no back (11); the tab bar with Community lit on a profile and chat (12); "2 meets tonight ·
4 hidden by your filters · Show" (10).

**On screens met in the tasks: 4.**

| # | Rule | Screen | Break | Shot |
|---|---|---|---|---|
| 1 | 4.2 | Route preview (task 4) | No back at the top left. The header has a large ◉ and the place name; the way back is "Not now" in the ActionBar, a back in the body. The 4.2 exception covers only the driving view's End. | a11 |
| 2 | 4.9 | Tonight (task 2) | "about 2 mi" is measured from the demo home (Tamworth), not from the phone, which is about 8 mi away. 4.9: "2 mi" from you (GPS) or "2 mi from home". | a07 |
| 3 | 4.9 | Me (task 10) | Same: "2 mi", "about 1 mi" from home without "from home". | a54 |
| 4 | 4.9 | "It's up" (task 9) | Same: "Sun 10:00 · 2 mi · 1 going". | a47 |

**Look-checklist exceptions on task screens: 6.** Event Photos grid (blown-up corners); "+150 rep"
card over the going row while it fades; "Location shown" chip behind the toast; onboarding map's
top-right sliver; Host step 2's sliver under its chip, with the pin over the town label; at 1.3x the
route preview's hazard marker cut by the map's top edge.

**Also counted under Clarity:** C5 on the cancelled meet (said three times).

**Borderline, not counted:**
* "Starting in 3" draws its countdown as a dark fill, so for the first second it looks disabled (a11).
* The Going list's caps title on a pushed list screen (4.1 names only detail screens and forms).
* Host step 1's Type pills (ChoiceGroup, allowed).
* Every Tonight card carries an outlined I'm going (4.3 allows one secondary on a card).

**Outside the tasks (exploration):** Busy night map at 393x852, the "Rolling meet: north" pin is cut
by the map's left edge (e09).

**Total on task screens: 4 rulebook + 6 look.**

## 5. Problems, ranked

| # | Severity | Screen | Steps | What's wrong | Shot |
|---|---|---|---|---|---|
| 1 | **High** | Event page, Photos | Open any meet, scroll to Photos | Every sample tile shows a blown-up corner of its photo: the `<img>` renders at 1200 x 900 inside a 112 px tile. Came in with `2bbbb95` (samples re-saved at 1200 x 900). The TILE check passes because the tile is filled. | a23, a24, f-eventgrid |
| 2 | Medium | Tasks 9–10, Me, host flow | Host a Sunday 10:00 meet, then "can't make the Sunday coffee meet" | The demo silently has you going to a seeded "Sunday coffee and cars", Sun 10:00. Nothing in tasks 1–9 shows it (it's below the fold in Me and at the bottom of List). Hosting your own meet at the same time gives no clash warning. I cancelled my own meet; the seeded one stayed GOING. Task 10 fails. | a47, a52, a55 |
| 3 | Medium | Onboarding, Tonight, Me, route | Location granted away from Tamworth | "Where's home? Around Tamworth" for a phone near Lichfield; distances ("about 2 mi") and the route's start are from the demo home, not the phone, and never say "from home" (4.9). "Use my location instead" is the only clue. | a06, a07, a11 |
| 4 | Medium | Event page, check-in | Check in | The "+150 rep" card overlaps the going row as it fades; afterwards nothing on the page says you're checked in ("Going with your Fiesta" goes too). Only Tonight's card and Me say CHECKED IN. | a14-checkin3, a15 |
| 5 | Medium | Event page, going | I'm going | The location moment is hidden: "Location shown" draws in huge spaced letters, then sits behind the "You're going" toast; the pin disappears for a moment. | a09-going1, a09-going2 |
| 6 | Medium | Cancelled meet | Your meet, `···`, Cancel it | "Cancelled" three times (C5); "Hosts cancelled the event" (plural, and "event"); the page still shows HOSTING, "1 going · 1 car" and an orange pin as if it's on. | a52 |
| 7 | Medium | Photos, cross-app | Normal demo and Busy night | Photos that don't match their words: Ace Cafe London's sign on a Tamworth meet (a57); a race R1 on paddock stands captioned "still road legal" (e06); a Tour de France caravan i30 N-Line as "i30 N washed and ready" (e06b); @dan_r's build is a green M4, his post a black one (e04); the Mk7 ST180 pick shows a Mk8 (a05); Busy: an MX-5 owner with a motorbike avatar (e15). A car person notices each one. | a57, e06, e06b, e04, a05, e15 |
| 8 | Low | "It's up" | Post meet | The hero is a drawn grid with an orange dot (placeholder art), while the meet's own page shows the real map. | a47 |
| 9 | Low | Route preview | Navigate | No back arrow (4.2); "Not now" is the back; the countdown fill makes the primary look disabled for a second. | a11 |
| 10 | Low | Starts sheet | Host, Starts | 10:00 needs "Show earlier hours"; the grid then has rows of 7, 6, 6 and 5 in the order 17–23, 00–16. | a38 |
| 11 | Low | Wording | Event options, Settings, chat | The noun changes: "Event options", "Event reminders", "Hosts cancelled the event", "Share this event" (label), while everything else says meet. | a50, a56, a52 |
| 12 | Low | Vote sheet, trophy | Vote Best car, Done | The picked card gets only "✓ Your vote" text, no selected state; the results card then shows your own pick as the winner straight away, which reads as "my vote decided it". | a17, a18 |
| 13 | Low | Sign-in | Try the demo | The 18+ box is still easy to miss (grey on dark, light label); the first tap errors. | a02 |
| 14 | Low | Tonight | First open | "4 hidden by your filters" when a new user has set none. | a07 |
| 15 | Low | Host step 2 | Next from step 1 | The map opens zoomed out (Lichfield to Walsall); after placing, a white shield sliver peeks under "Tap to move the meet point" and the pin covers "Tamworth". | a41, a44 |
| 16 | Low | Onboarding map | Step 2 | White sliver at the top right; "LICHFIELD" touches the top edge. | a06, c-04 |
| 17 | Low | Me | Open Me | The avatar is the same photo as the car card right under it. | a54 |
| 18 | Low | 1.3x | Tonight, route, It's up | Tonight's map shrinks to a strip; a hazard marker cut by the route preview's top edge; "It's up" meta line under the ActionBar. | sheet-c0, sheet-c3, sheet-c2 |

## 6. Busy night (Settings › Demo › Busy night; not scored)

393x852. No crash, no console error.

* **Toast:** "Busy night on · 3 people want to connect" (one line). Community badge 6.
* **Map:** "7 meets tonight · 21 hidden by your filters"; clusters readable; the "Rolling meet:
  north" pin is cut by the map's left edge, and another sits off screen (e09). A bright speck at the
  map's top-left corner above the credit chip.
* **List:** every card has a photo now (no grid placeholder art, R19 13 fixed), title on the photo,
  I'm going on each (e10 to e14). Several "night" meets use daytime photos (Hot hatch takeover,
  Midnight cruise, Late rolling meet: east side, a GSX-R in a garden). "This week" shows the seeded
  Sunday coffee and cars as GOING at the very bottom (e14): the one place on Tonight that would have
  saved task 10.
* **Feed:** whole-car photos now, but the words often don't match them (problem 7); post times
  "Tonight 17:41" and "Today 16:10" side by side follow 4.10 but read oddly.
* **Demo chip:** still "Demo · Fri 21:10"; nothing says Busy night is on after the toast.

## 7. Compared with Review 19

Review 19: **Clarity 7, Coherence 7, Look 6**; 10/10 at each time and size; 2 rulebook breaks and 4
look exceptions on task screens.
Review 20: **Clarity 7, Coherence 7, Look 5**; 9/10 in the first walk-through (10/10 scripted);
4 rulebook breaks and 6 look exceptions on task screens. No console errors in either.

**Fixed since Review 19 (checked):** the trophy moment (L4 now met); one event card look and one pin
glyph (K3 now met); the route preview's single credit chip with the route clear of it; the demo clock
named on Tonight and in chats; car-photo avatars and the tab bar on profile and chat; "Most common"
on the Fiesta list; "Cancel this meet…" with its ConfirmSheet; one-line, neutral leave toast; Me's
stats matching its rows; Settings' How far as one row; Host form's example name, evening hours
first, "people", no back on "It's up"; plates filled instead of boxed; my own photo cover-fit.
40 of Review 19's 56 gaps are fixed (section 8).

**New or worse:**
* **Event Photos grid (problem 1):** a regression from the 1200 x 900 photo commit; it is what takes
  Look from 6 to 5.
* **Task 10 (problem 2):** Review 19 took the old example name and found two same-named meets in Me;
  the example is fixed, but the trap is the seeded Sunday meet itself, which a tester's own Sunday
  meet will shadow. C2 missed.
* **Distances from the demo home (problem 3):** probably there before (R19's tester was close to
  Tamworth, so it didn't show); counted now as three 4.9 breaks.
* **Check-in and reveal moments (problems 4, 5):** both play, but the rep card's exit overlaps and
  the reveal chip is under the toast.
* **Cancelled meet page (problem 6):** C5 fails here (R19's C5 failures are all fixed).
* **Route preview back (break 1):** R19 didn't count it.

**Net:** Clarity the same (C5 fixed in four places, missed in one new one; C2 now missed).
Coherence the same score with K3 fixed but more 4.9 breaks. Look down one on the photo-grid
regression.

## 8. Review 19's path to 10, item by item

| # | Review 19 gap | Status | Now |
|---|---|---|---|
| 1 | Sign-in hero daytime saloon | Fixed | Night shot, tail lights, no plate (a01). Soft and dark. |
| 2 | Try the demo before the 18+ tick | Partly | Tick now in the ActionBar right above the button; I still missed it (grey box). |
| 3 | Five Fiesta ST versions, no default | Fixed | "Most common" on the ST180. |
| 4 | "Use my location instead" | Not fixed | Still there, and the home it shows isn't my location (problem 3). |
| 5 | Onboarding map sliver | Not fixed | Top right, 1.0x and 1.3x (a06, c-04). |
| 6 | 1.3x helper line under ActionBar | Fixed | Visible at 1.3x (c-04). |
| 7 | "4 hidden" with no reason | Fixed | "4 hidden by your filters · Show" (owner decision 10). |
| 8 | Two event card looks | Fixed | Same card on map sheet and List. |
| 9 | Pin glyph changes after going | Fixed | Same four-dot glyph. |
| 10 | Pins on town labels | Not fixed | Fazeley, Tamworth under pins (a07, a10). |
| 11 | Demo clock only in a sheet | Fixed | "Demo · Fri 21:10" chip. |
| 12 | Daytime live card with plate box | Fixed | Night Peugeot 306, plate filled. |
| 13 | Busy List placeholder art | Fixed | Photos on every card (e10–e14). |
| 14 | Busy "Not open to your car" with no car | Not checked | I added a car first. |
| 15 | Busy pin cut by the edge | Not fixed | Now the left edge (e09). |
| 16 | No trophy moment | Fixed | "Demo: how Best car went", Vote steps down. |
| 17 | "Vote for 3 trophies." under location | Fixed | Gone. |
| 18 | "rep" unexplained | Fixed | "For turning up. It shows on your profile." |
| 19 | Plate boxes on heroes | Fixed | Plates filled with the panel. |
| 20 | Title off screen after going | Fixed | Compact title in the header. |
| 21 | Event small-map sliver | Fixed | Not seen on the event map. |
| 22 | "Tamworth meet point, Tamworth." | Fixed | "Tamworth meet point." |
| 23 | Navigate primary days ahead | Fixed | "Invite connections" on your own future meet. |
| 24 | "Cancel" in Event options | Fixed | "Cancel this meet…" and "Cancel the meet?". |
| 25 | Busy eligibility in the location row | Not checked | Not met in this pass. |
| 26 | Route end under the credit chip | Fixed | One chip; route fitted clear. |
| 27 | "2.9 mi" twice | Fixed | Said once ("2.9 mi drive"). |
| 28 | "Arrive 21:16" with no demo clock | Partly | Tonight's chip explains it; the preview itself still doesn't. |
| 29 | Report and End colours | Fixed | Report is a round icon button; End the only red. |
| 30 | Own photo letterboxed | Fixed | Cover-fit; but see problem 1 for every other tile. |
| 31 | Same M4 shot everywhere | Partly | The post now has its own photo; builds' photos still double as meet Photos tiles, vote rows and profile heroes. |
| 32 | Crop ✕ | Fixed | Written into 4.2 as the image-editor exception. |
| 33 | Letter avatars | Fixed | Car-photo avatars. |
| 34 | CONNECTED tag far from the name | Fixed | Next to @jordST. |
| 35 | Three backs from chat | Fixed | Tab bar on chat and profile. |
| 36 | Chat "TODAY 21:13" | Fixed | "Demo · Fri". |
| 37 | "+" means three things | Partly | Garage's is a car-with-plus; Community's "+" still posts and Tonight's hosts. |
| 38 | "Add a photo of your car" over a stock photo | Fixed | "Sample photo. + Add yours". |
| 39 | Half-empty Garage | Fixed | Mods and Power and dyno below. |
| 40 | Add a mod primary with nothing picked | Fixed | Appears once a part is picked. |
| 41 | Example name equals a seeded meet | Fixed | "e.g. Friday night car park meet" (but see problem 2). |
| 42 | Step 2 map zoomed out; prompt over labels | Partly | Prompt is a solid chip; still opens zoomed out. |
| 43 | "drivers" | Fixed | "people". |
| 44 | 24-box hour grid | Fixed | Evening first; the expanded grid is uneven (problem 10). |
| 45 | Thin map strip after posting | Partly | A PhotoCard now, but with placeholder grid art. |
| 46 | Back arrow after posting | Fixed | Done only. |
| 47 | Me stats disagree | Fixed | 3 and 4 Meets equal the rows. |
| 48 | Two section-header styles in Me | Fixed | One style. |
| 49 | Same-name meets look the same in Me | Not checked | No duplicate appeared (I cancelled mine before opening Me). |
| 50 | Settings demo line | Fixed | "Leave it at the bottom of this page." |
| 51 | "New meets within 25 mi" + How far | Fixed | One row, tappable value. |
| 52 | Two-line leave toast, green tick | Fixed | "Not going · UNDO", neutral mark. |
| 53 | Feed odd crops, upscaled | Fixed | Whole-car photos (but problem 7). |
| 54 | People and Chats text-only | Not checked | Not opened this time. |
| 55 | Every photo daytime | Partly | Normal-demo meets are night or dusk; builds, posts and most Busy meets are daytime. |
| 56 | Demo clock surprises | Fixed | Named on Tonight, chats, Starts and the drive view. |

**Fixed 40, partly 7, not fixed 4, not checked 5.**

## 9. Path to 10

Every gap I found between the app as tested and the top anchor of each score. **K** = clarity,
**C** = coherence, **L** = look. Effort: **S** small (copy, a style, one prop), **M** medium (one
screen or flow), **L** large (data, art or a cross-app pattern). Items carried over from Review 19
keep its number in brackets.

What a 10 needs overall:
* **Clarity 10:** C1–C6 true (today C2 and C5 miss), and a tester explains check-in, the reveal and
  voting back unprompted. Check-in and voting now explain themselves; the reveal is hidden by a toast.
* **Coherence 10:** K1–K5 true (today K1 misses on 4.2 and 4.9), and a tester predicts where a control
  is twice. The meet/event noun and the "+" doing two jobs still trip prediction.
* **Look 10:** L1–L5 true (today L2 misses), and a tester picks three screens to post unprompted.
  The event page has to be postable: a clean Photos grid and photos that match their words.

### Sign-in

| # | | What's wrong | What a 10 looks like | Effort |
|---|---|---|---|---|
| 1 | K | The 18+ box is grey on dark; first tap on Try the demo errors (R19 2). | A clearly bordered box with the label in body colour, or "I'm 18+" as part of the button's own tap with the Terms link beside it. | S |
| 2 | L | The hero is dark and soft; hard to see what's in it. | A sharper night meet shot with a lit, modified car filling the frame. | M |

### Onboarding

| # | | What's wrong | What a 10 looks like | Effort |
|---|---|---|---|---|
| 3 | K | "Where's home? Around Tamworth" for a phone elsewhere; "Use my location instead" unexplained (R19 4). | Say it: "The demo is set around Tamworth" with "Use my location instead" under it; signed in, default to the phone's area. | S |
| 4 | L | Map card's top-right sliver; label touching the top edge (R19 5). | No clipped label or shield at any map card edge. | S |
| 5 | L | The Mk7 ST180 row's photo is a Mk8. | Each version's stand-in shows that generation. | M |

### Tonight

| # | | What's wrong | What a 10 looks like | Effort |
|---|---|---|---|---|
| 6 | C | Distances from the demo home without "from home" (break 2). | "2 mi from home", or measure from the phone when location is granted. | S |
| 7 | K | "4 hidden by your filters" when a new user set none. | Name the default filter ("4 for bikes or other cars"), or start with nothing hidden. | S |
| 8 | K | The Sunday meet you're going to is the last row of List and not on the map sheet. | A "You're going" row near the top of the sheet for upcoming meets you've said yes to. | M |
| 9 | L | Pins on town labels (R19 10). | Labels that dodge pins, or a quieter label layer at this zoom. | M |
| 10 | L | At 1.3x the map is a 150 px strip. | Keep at least a third of the screen for the map at 1.3x, or start the sheet lower. | S |
| 11 | L | Busy: pins cut by the map's edge (R19 15). | Fit bounds with padding; run MAP at 393x852 too. | S |

### Event page

| # | | What's wrong | What a 10 looks like | Effort |
|---|---|---|---|---|
| 12 | L | **Photos grid shows blown-up corners** (problem 1). | Each tile shows the whole photo cover-fit (img at 100% of the tile). | S |
| 13 | L | Meet Photos are the builds' photos (also on vote rows, profiles) (R19 31). | Sample meet photos of their own, at night. | L |
| 14 | L | "Location shown" chip behind the "You're going" toast; pin vanishes for a moment. | The toast waits until the reveal has played, or sits above the chip; the pin never disappears. | S |
| 15 | L | "+150 rep" card overlaps the going row as it fades. | Collapse its height as it fades (layout animation), never overlap. | S |
| 16 | K | After check-in nothing on the page says "Checked in". | A "Checked in" status in the ActionBar's status line (like "Going with your Fiesta"). | S |
| 17 | K | Cancelled meet: "Cancelled" three times; HOSTING, "1 going" and a live-looking pin. | One "Cancelled" in the status line; no HOSTING badge, a grey pin, "Nobody's going". | S |
| 18 | C | "Hosts cancelled the event". | "You cancelled the meet" (or "@host cancelled the meet"). | S |
| 19 | L | Ace Cafe London photo on a Tamworth meet. | Photos with no readable place signs, or signs that match. | M |

### Route preview and drive

| # | | What's wrong | What a 10 looks like | Effort |
|---|---|---|---|---|
| 20 | C | No back arrow; "Not now" is the back (break 1). | The root back at top left (Not now can stay as the secondary), or add the preview to 4.2's driving-view exception. | S |
| 21 | L | The countdown fill makes "Starting in 3" look disabled for a second. | Full sodium button with a progress line, not a dark fill. | S |
| 22 | K | "Arrive 21:17" with no demo clock on the preview (R19 28). | "Demo · Fri" by the arrival time. | S |
| 23 | L | 1.3x: hazard marker cut by the map's top edge. | Fit markers with top padding. | S |
| 24 | K | The route starts from the demo home, not the phone. | Start from the phone when location is granted, or say "From home". | S |

### Vote and trophy

| # | | What's wrong | What a 10 looks like | Effort |
|---|---|---|---|---|
| 25 | L | The picked build has no selected state, only "✓ Your vote". | Selected card border and tick, like other selections. | S |
| 26 | K | Results show your own pick as the winner the moment you close the sheet. | "Demo: how Best car went · 23 votes" with a vote count, so it's clearly everyone's votes. | S |

### Going list, profile and chat

| # | | What's wrong | What a 10 looks like | Effort |
|---|---|---|---|---|
| 27 | L | People and Chats not re-checked (R19 54). | Car-photo rows with no half-empty screen. | M |

### Garage and Me

| # | | What's wrong | What a 10 looks like | Effort |
|---|---|---|---|---|
| 28 | C | Distances in Me from home without "from home" (break 3). | As 6. | S |
| 29 | L | Me's avatar is the car card's photo right under it. | Avatar the person (or a close crop); the card the car. | S |
| 30 | C | "+" still posts on Community and hosts on Tonight (R19 37). | A labelled icon per job, or one "New…" sheet. | M |

### Host a meet

| # | | What's wrong | What a 10 looks like | Effort |
|---|---|---|---|---|
| 31 | K | No clash warning when you host at the same time as a meet you're going to. | On Check and post: "You're going to Sunday coffee and cars at Sun 10:00." with "Post anyway". | M |
| 32 | K | Hour grid rows of 7, 6, 6, 5; 17–23 then 00–16. | One even grid in clock order with the evening highlighted, or two labelled rows (Evening, Earlier). | S |
| 33 | L | Step 2 map opens zoomed out (R19 42); white sliver under the chip; pin over the town label. | Open on the home area; chip with clean edges. | S |
| 34 | L | "It's up" hero is placeholder grid art. | The real map tile (as on the meet's page) or the host's car photo. | S |
| 35 | C | "It's up": distance without "from home" (break 4); at 1.3x the meta line sits under the ActionBar. | As 6; content padding equal to the ActionBar. | S |
| 36 | K | Default meet point name "Tamworth meet point" for any spot. | Use the nearest named place (retail park, pub car park) or leave it empty with an example. | M |

### Settings and wording

| # | | What's wrong | What a 10 looks like | Effort |
|---|---|---|---|---|
| 37 | C | "Event options", "Event reminders", "Share this event" while the app says meet. | "Meet options", "Meet reminders", "Share this meet"; add "event" to the glossary scan. | S |

### Community and demo art

| # | | What's wrong | What a 10 looks like | Effort |
|---|---|---|---|---|
| 38 | L | Posts whose photo contradicts the words (race R1 "road legal", TdF i30 N-Line, black vs green M4). | Each post's photo matches its caption and its build. | M |
| 39 | L | Builds, posts and many Busy meets are daytime (R19 55). | Night or dusk photos for meets and heroes. | L |
| 40 | L | Busy: an MX-5 owner with a motorbike avatar. | Avatar from the person's own main build. | S |

**Count: 40 gaps: 28 S, 10 M, 2 L.**

### Suggested new automated checks

* **IMG-SCALE (1, 12):** for every `<img>` in a photo grid, strip or card, its rendered box must not
  be more than 1.05x its clipping container. TILE checks that the tile is filled; this checks that
  the photo is scaled to it.
* **CLASH (2, 31):** after task 9, if the new meet overlaps a meet you're going to, expect a warning on
  Check and post.
* **HOME-DIST (3, 6, 24, 28, 35):** with location granted far from home, every distance on Tonight, Me,
  "It's up" and the route preview either matches the phone's distance or carries "from home".
* **C5 on cancel (17):** after task 9's `···` check, cancel the meet and fail if "cancel" appears more
  than once on the page (toast left out).
* **CHECKED-IN (16):** 10 s after check-in, the event page still shows "Checked in".
* **REVEAL (14):** after I'm going, the location chip is visible and uncovered by the toast for 2 s.
* **EXIT-OVERLAP (15):** sample the event page every 100 ms for 6 s after check-in; fail if any two
  text boxes overlap.
* **PLACEHOLDER (34):** extend ART to the "It's up" route.
* **EDGE everywhere (4, 33):** run EDGE on every small map card (onboarding, host step 2), all edges,
  not just the top 4 px.
* **MAP at 393x852 (11):** run the Busy night MAP check at a second phone size.
* **WORDS (37):** add "event" to the words scan (allow-list labels that need it).
* **PHOTO-REUSE (13):** in the normal demo, count screens per image `src`; fail over two (the owner's
  rule in 9.12).

Not automatable: whether photos match their captions and builds (5, 19, 38, 40), night mood (2, 39),
whether the trophy card reads as everyone's votes (26), and whether a tester predicts a control.

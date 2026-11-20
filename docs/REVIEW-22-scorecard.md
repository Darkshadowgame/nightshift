# Review 22: fixed scorecard and path to 10

Scored against `REDESIGN-2.md` section 7 (fixed scorecard) and section 8 (8+ criteria), read before
testing. Section 4 (rulebook, with its owner exceptions) and section 9 (owner decisions) were read
only after the scored runs, to count breaks. Review 21 was read last, for the comparison and its
path-to-10 list.

**Set-up:** `d3695da` on main (after `git pull`). `npx expo export --platform web --clear` into
`~/nightshift-wt/r22-web`, served with SPA fallback (the scorecard's `serve()` in its own process,
killed by PID at the end; the export deleted afterwards). My own headless Chromium, driven by a Node
Playwright control script one step at a time: 375x667, touch and mobile emulation, @2x,
Europe/London, en-GB, cleared storage per run, demo mode, Busy night off, **location granted** at a point
about 15 mi south of the demo home, Tamworth), so onboarding keeps "Demo home:
Tamworth". Four scored runs (browser clock Thu 19 Nov): 12:30 and 20:30, each at 1.0x and 1.3x text
(the scorecard's own scaler). Two extra 1.0x runs (12:30, 20:30) and two host-only runs to check a
difference (problem 1). Then free exploration and one Busy night pass at 393x852 (not scored).
JPEG screenshots in `~/nightshift-wt/r22-shots`:

* `a-…`: the first walk-through, 12:30, 1.0x, one tap at a time after reading each screen. Human
  times and hesitations come from it.
* `b-…` (20:30, 1.3x), `c-…` (20:30, 1.0x), `d-…` (12:30, 1.3x): the same steps, scripted at
  human pace (0.3–4 s per screen, 3–5 s per toast). `e-…`, `f-…`, `g-…`, `h-…`: the repeat runs.
* `x-…`: exploration and Busy night at 393x852. `y-…`: cancelling your own meet.

**Limits:** times are my estimate of a first-timer's pace from the walk-through (reading plus about
1.5 s a tap); the scripted runs prove outcomes, text and layout, not hesitation. Headless Chromium
has no `navigator.share`, so the web "Share this meet" sheet counts as the share sheet; the photo
picker is the web file chooser. No console errors in any run.

## 1. Task table

### 12:30, 1.0x (walk-through)

| # | Task | Result | Time (limit) | Taps | Notes |
|---|---|---|---|---|---|
| 1 | Demo with a Fiesta ST | Pass | ~28 s (60) | 5 | The search placeholder's example is "Fiesta ST"; "Most common" on the ST180. |
| 2 | Open what's on now | Pass | ~6 s (20) | 1 | The live card is first in the sheet. |
| 3 | Going, with your car | Pass | ~5 s (15) | 1 | "You're going" toast; "Going with your Fiesta ST Mk7 ST180"; "Location shown". |
| 4 | Directions, then back | Pass | ~16 s (20) | 2 | **Hesitation (>5 s):** the preview started driving after 5 s while I was still reading its four lines (a-10drive); End brought me back. Owner exception 9.9, not counted. |
| 5 | Check in | Pass | ~6 s (15) | 1 | "+150 rep" card and "Checked in" toast. |
| 6 | Vote and add a photo | Pass | ~35 s (90) | 5 | Trophy reveal with the split (3/1/1/1); photo first in Photos with "Photo posted". |
| 7 | Find someone, connect, message | Pass | ~32 s (60) | 6 | Going row → @dan_r → Connect (demo accepts in ~4 s) → Message → Send. |
| 8 | Cold air intake; class and power | Pass | ~20 s (45) | 4 | "Added. Now 183 bhp, Class B" and the card says 183 bhp, B. |
| 9 | Host Sun 10:00, open, share | Pass on its own terms, **fails 7.1** (see below) | ~85 s (120) | 18 | One deliberate Next without a meet point name ("Name it the way people know it…", in red). **Hesitation:** step 2's small map is dark and nameless; I only knew where I was after opening the picker. Time clash sheet → Host anyway. |
| 10 | Leave Sunday coffee; find Privacy | Pass | ~38 s (45) | 7 | **Hesitation:** "Coming up" sits under the lowered map sheet's fold, only its heading above the tab bar; I switched to List. Can't make it → "Yes, I can't go" → "Not going · Undo"; Me → gear → "Show me in People near you". |

### All four runs

| # | 12:30 1.0x | 20:30 1.0x | 12:30 1.3x | 20:30 1.3x |
|---|---|---|---|---|
| 1–8, 10 | Pass | Pass | Pass | Pass |
| 9 | Pass | **Fail (7.1)** | Pass | **Fail (7.1)** |

**Why task 9 fails at 20:30.** Section 7.1: "The demo night must make both runs identical; any
difference is a fail of the task it shows up in." With the same steps and the crosshair on the same
spot in central Tamworth (sheets: a-32place and the c/b/d `25place` shots are the same view), the
posted meet came out **"1 mi from home"** at 12:30 and **"2 mi"** (1.0x) / **"3 mi"** (1.3x) at
20:30, on "It's up", Tonight and Me. It isn't the clock: two repeat runs gave 1 mi at 20:30 and 2 mi
at 12:30, and the saved points were 52.614 and 52.598 N, about 2 and 4 km **south** of the crosshair
(Tamworth centre is about 52.633 N). So the point that's saved is not the point under the crosshair,
and it moves from run to run. The task's own "Pass when" (Sun 10:00, open to anyone, share sheet)
was met every time, but the runs aren't identical, so by 7.1 the task fails in the runs where it
differs. I've counted the 20:30 runs; it could as well be the 12:30 ones.

## 2. Time to understand

* **TTU-1: about 4 s. Pass.** "What's on tonight near you. Go with your car." over a night shot of a
  modified 350Z, then "See tonight's meets near you · Say you're going, with your car · Check in and
  vote for the best build". In my words: "car meets near me tonight; say I'm going in my car, check
  in and vote." Covers all three parts.
* **TTU-2: about 36 s. Pass** (Try the demo → search → pick → Next → Show me tonight → open the live
  card → I'm going).

## 3. Scores

Method as Reviews 11–21: the highest anchor whose every line is true; between anchors means all of
the lower one and most of the higher one's lines.

### Clarity: **7**

| Criterion | Result | Evidence |
|---|---|---|
| C1 TTU-1 ≤ 5 s | **Met** | About 4 s. |
| C2 10/10 at both times | **Missed** | Task 9's result differs between the 12:30 and 20:30 runs (1 vs 2–3 mi from home; the saved point isn't the crosshair's). 9/10 at 20:30. |
| C3 inside limits; TTU-2 ≤ 60 s | **Met** | Closest: task 4 (~16 of 20 s, because of the auto-start), task 10 (~38 of 45 s), task 9 (~85 of 120 s). TTU-2 ~36 s. |
| C4 no 4.12 word | **Met** | Only "+150 rep", "Level 2 · Regular" and "Tap anywhere to stop" (owner exceptions). |
| C5 each fact said once | **Met** | Event page: one "Live · until 23:00", one location line, one status line; the compact header title only once the hero has gone. "It's up", Me, Settings, the cancelled meet ("You cancelled this meet.") clean. |
| C6 no dead ends; errors say what to do | **Met** | No disabled primary anywhere. The meet point error says what to type. Every ActionBar has a way on ("Going" + Can't make it). |

Anchor 6 is fully true (purpose clear in 10 s; 9/10 tasks pass; 3 hesitations, only one of them
about wording: the lowered sheet hiding Coming up). Anchor 8 misses C2: **7.** Without the task 9
difference this would have been 10: I can explain check-in ("for turning up, shows on your
profile"), the location reveal ("shows to people going", "Location shown", "at 09:00") and voting
(the result now shows the room's split, 3/1/1/1) back unprompted.

### Coherence: **7**

Rulebook exceptions on task screens: **0** (section 4). That is better than anchor 6 (1–5).

* **K1** zero exceptions: **met.**
* **K2** one selector per job: **met.** Map/List, Car/Bike, Engine/Chassis/Wheels/Looks,
  Feed/People/Chats are single SegmentedControls; meet type is a ChoiceGroup; Starts and Ends use the
  DateTimeSheet; make and model a SearchField.
* **K3** one look per kind of thing: **missed.** Your own hosted meet's page is a different screen
  from every other meet's: a dim map as the hero, a grey caps "MEET" label above a 24 px title
  under the hero, where every other meet has its photo, the kind on a dark pill and a 30 px title on
  the photo (a-49mymeet vs a-07event). And the same meet shows your Fiesta photo on "It's up"
  (a-38itsup) but a map on its own page.
* **K4** every screen a template: **met.**
* **K5** one power number: **met** (179, then 183 bhp everywhere; posts no longer add a second).

All of anchor 6 (and more) and 4 of 5 lines of anchor 8: **7.** Not 10: K3, and I could predict
most controls (ActionBar primary, `···` top right, Done in sheets), but not where my own meet's
title would be.

### Look: **8**

* **L1** a photo or real map above the fold on every first-level screen at 375x667: **met.**
  Tonight map and List, Community feed, Garage, Me, every event page.
* **L2** the look checklist on every screen: **met.** The small map cards now draw no labels, so
  nothing is cut at their edges; the "● MEET" kind sits on a solid pill; toasts no longer land on
  the vote card or the new mod row; nothing clipped at 1.0x or 1.3x. (Below the bar but not on the
  checklist, see problems 2, 5, 9, 10.)
* **L3** a real dark map on web: **met.**
* **L4** the four motion moments: **met.** Going (toast, scroll to the map), location shows
  ("Location shown" over the pin), check-in (tick card, then "Checked in"), trophy ("Demo: how Best
  car went").
* **L5** three screens I'd share: **met.** The trophy card (a-15trophy), the Car park meet-up page
  with its night Peugeot hero (a-07event), Busy night's List (x-06busylist).

All of anchor 8: **8.** Not 10: I'd post the trophy card unprompted, but the dim, stained-looking
small maps (problem 2) and the smudges round the Tonight pins (problem 5) keep the rest from being
screens I'd volunteer.

### 8+ criteria summary

| Met | Missed |
|---|---|
| C1, C3, C4, C5, C6, K1, K2, K4, K5, L1, L2, L3, L4, L5 | **C2, K3** |

## 4. Rule breaks, counted

Owner exceptions not counted: "+150 rep" after check-in; the level line on Me; the route preview's
auto-start and "Tap anywhere to stop" (9.9); the drive view's End; the crop screen's ✕; "It's up"
with no back (11); the tab bar with Community lit on a profile and chat (12); the Time clash confirm
(13); "You're going (demo)" and Coming up first (13); your own car's photo on Garage, Me, Me's avatar
and "It's up" (14, 15); radius distances "within 25 mi" (the DIST-ORIGIN allow-list).

**On screens met in the tasks: 0 rulebook breaks, 0 look-checklist exceptions.**

Not rulebook breaks, but counted against the scores above:

| # | Criterion | Screen | What | Shot |
|---|---|---|---|---|
| 1 | 7.1 / C2 | Host step 2 → "It's up", Tonight, Me | The saved meet point is 2–4 km south of the crosshair and moves run to run, so the meet's distance reads 1, 2 or 3 mi from home for one spot. | a-38itsup, b-29itsup, g1.log/g2.log |
| 2 | K3 | Your hosted meet's page | A second event-page look (map hero, grey kind label, title below the hero, 24 px). | a-49mymeet |

**Borderline, not counted:**
* The Tonight pin's "dark pool" (owner decision 17) still half-hides "Tamworth", the demo's home
  town, under the live pin (a-06tonight).
* Car/Bike in onboarding is a SegmentedControl in a form; it switches the search below it, so I
  read it as 4.4's "switch the view below".
* The trophy card's five type sizes (it's a poster, as R21 said).
* The vote sheet's footer ("Next: Best bike") half-covers the sixth row when the sheet opens; the list
  scrolls (a-13vote).

**Outside the tasks (exploration, not scored):**
* **People near you (Busy):** every row says "Under 5 mi from home" and the list is alphabetical, so
  distance tells you nothing; @996_oscar shows an initial "O" although he has a 996 (owner decision
  12: initials only for no car); @a35_aisha and @a45_amir share one grey Mercedes photo (x-13near).
* **Busy map:** the "5" cluster sits on LICHFIELD and a pin on WOLVERHAMPTON (x-05busytonight).

## 5. Problems, ranked

| # | Severity | Screen | Steps | What's wrong | Shot |
|---|---|---|---|---|---|
| 1 | High | Host step 2 (place the meet point) | Host, Tap to place, Set meet point here | The point saved isn't the one under the crosshair: 2–4 km south of it, and different each run. A host who places a meet at a car park would post it in the wrong place; here it also makes the runs differ (task 9, C2). | a-32place, a-38itsup, b-29itsup |
| 2 | Medium | Small map cards (event page, Host step 2, onboarding, hosted meet hero) | Open any meet | Label-free now, but so dim and vignetted they read as placeholder art; rivers and lakes show as black stains (one under the live meet's pin card looks like a smear). Your hosted meet's page has this as its hero. | a-12dlater, a-31step2, a-49mymeet |
| 3 | Medium | Your hosted meet's page | Open the meet | A different page look from every other meet (K3); the photo "It's up" showed for it is gone. | a-49mymeet, a-38itsup |
| 4 | Medium | Tonight map sheet | Task 10 | At 375x667 the lowered sheet shows the live card, and "Coming up" (your Sunday meet) is only a heading under the tab bar. Dragging the sheet is the only way on the map view; I went to List. | a-41scroll, a-43list |
| 5 | Medium | Tonight map | First open, Busy | The pins' dark pools look like smudges on the map and still hide the town under the live pin (Tamworth); on Busy the cluster and a pin sit on LICHFIELD and WOLVERHAMPTON. | a-06tonight, x-05busytonight |
| 6 | Low | Tonight count line | First open, List | "2 meets tonight · 4 later · Show later", but the List already shows two later meets (yours) under Coming up. After leaving Sunday coffee: "5 later". Which later meets are hidden? | a-43list |
| 7 | Low | Route preview | Navigate | Auto-start after 5 s while the summary has four lines to read (time, distance, arrival, demo note, road reports); I was driving before I'd read it. Owner decision 9.9 stands; noting the hesitation only. | a-09nav, a-10drive |
| 8 | Low | Event page after check-in | Check in | The "+150 rep" card fades out and leaves an empty gap for about a second before the page closes up. | a-12ccheckin |
| 9 | Low | 1.3x wraps | Going list, Tonight card, Garage | Lines now break before the dot, so they start with "· 179 bhp", "· 10 going"; Garage leaves "it." alone on a line. | b sheets (b2) |
| 10 | Low | Event pages with a photo | Any meet | A 64 px empty black band (the header) above every hero photo; the hero starts a third of the way down at 1.3x. | a-07event, a-44coffee |
| 11 | Low | Vote sheet | Vote | The footer half-covers the sixth build when the sheet opens. | a-13vote |
| 12 | Low | People near you (Busy) | Community, People, Show me | Same "Under 5 mi from home" on every row, alphabetical; an initial avatar for a man with a car; one photo for two Mercedes. | x-13near |
| 13 | Low | Demo art | Garage, profile, Feed | Builds and posts are still daytime shots (the Fiesta stand-in, @dan_r's M4 under autumn trees, the Civic in the Feed); meets are night. | a-23garage, a-19profile, x-09community |

## 6. Busy night (Settings › Demo › Busy night; not scored)

393x852, 20:30. No crash, no console error.

* **Switch:** "Busy night on · 3 people want to connect"; Community badge 6 (3 requests + 3 chats).
* **Map:** "7 meets tonight · 17 later, 4 not for your car · Show all" (the button names what it
  shows). Regional zoom from Stoke to Leicester; the "5" cluster on LICHFIELD and a pin on
  WOLVERHAMPTON (problem 5). No pin under the lowered sheet. **Show where I am** now draws a blue
  "You are here" dot (on Solihull) and fits you and the nearest meets (x-10whereami).
* **List:** a photo on every card, title on the photo, all night or dusk shots now (Hot hatch
  takeover, Late rolling meet, Late rolling meet: east side, Midnight cruise). Coming up above Live
  now and Tonight, as decided (x-06…08).
* **Layers:** the first switch is "Meets · Cruises and rolling meets too. Yours always show"
  (x-11layers).
* **Community:** Feed leads with the FK2; @dan_r's post is "Office car park", @mo.rs3's "Rolling
  road" (no second power number); the R1 post has a softened background, no blur box (x-14r1).
  People near you: problem 12.

## 7. Compared with Review 21

Review 21: **Clarity 9, Coherence 7, Look 7**; 10/10 at both times and sizes; 1 rulebook break and
3 look exceptions on task screens.
Review 22: **Clarity 7, Coherence 7, Look 8**; 10/10 on each task's own "Pass when", but task 9
differs between runs (7.1); 0 rulebook breaks and 0 look exceptions on task screens.

**Fixed since Review 21 (checked):** no tick on sign-in (the line in the ActionBar is the
agreement); label-free small map cards (no cut labels or shields); "● MEET" on a solid pill; "Show
later" / "Show all"; Show where I am's you-dot; the route preview with no header title; the vote
split and a winner that isn't simply yours; the going row on two lines ("10 going" / "7 cars, 3
bikes"); full-strength hours with the evening "shaded"; Done stepping away in Add a mod; "Meets" in
Layers; People near you with an origin; posts' captions and power; your own cancelled meet ("You
cancelled this meet.", no Share or Say hello); Me's "Now"; toasts clear of what they confirm.

**New or worse:**
* **The meet point isn't the crosshair (problem 1):** new to me; it shows now because the distance
  under "It's up" is exact enough to differ between runs. It's what takes Clarity from 9 (R21) to 7
  here, under the same 7.1 rule R21 used.
* **The hosted meet's page (problem 3):** R21 didn't count it; I count it under K3, so Coherence stays
  7 even with the last rulebook break gone.
* **Small maps now dim and stained (problem 2):** the label-free base fixed the cut labels (L2 met,
  Look up one) but made the cards look unfinished.
* **Leading-dot wraps (problem 9):** the fix for trailing dots moved the dot to the start of the
  next line.

**Net:** Clarity down two (C2, on a real hosting bug); Coherence the same (K1 now met, K3 now
missed); Look up one (L2 met).

## 8. Review 21's path to 10, item by item

| # | Review 21 gap | Status | Now |
|---|---|---|---|
| 1 | First tap on Try the demo errors on the 18+ tick | Fixed | No tick: "By going on, you confirm you're 18 or over and agree to the Terms." above both buttons. |
| 2 | Onboarding map: cut labels at the edges | Fixed | Label-free map; no slivers. (Dim: problem 2.) |
| 3 | "● MEET" unreadable on bright photos | Fixed | Solid dark pill on Tonight cards, the event hero and "It's up". |
| 4 | "Show" with no object | Fixed | "Show later" (normal), "Show all" (Busy). (The count still confuses: problem 6.) |
| 5 | Pins on town labels | Partly | Dark pools fade the label under a pin, but look like smudges; Busy LICHFIELD, WOLVERHAMPTON still under pins. |
| 6 | Show where I am: no you-marker | Fixed | Blue "You are here" dot, map fits you and the nearest meets. |
| 7 | Busy pin under the lowered sheet at 393x852 | Fixed | None under the sheet. |
| 8 | Event map card cut labels | Fixed | Label-free. (Dim: problem 2.) |
| 9 | Own cancelled meet says "The host cancelled", offers Say hello and Share | Fixed | "You cancelled this meet.", "Was 1 going", no Share or Say hello (y-cancelled). |
| 10 | "10 going · 7 cars, 3" / "bikes" wrap | Fixed | Count and mix on two lines. |
| 11 | Route preview header title | Fixed | No title; "2.9 mi drive to Leisure park car park" in the summary. |
| 12 | Demo result always your pick | Fixed | Split shown (3/1/1/1); the winner comes from the room's votes plus yours. |
| 13 | Trophy card dangling "·" at 1.3x | Fixed | No dangling dot on the card. (Five type sizes stay: borderline.) |
| 14 | Chat header meta wrap at 1.3x | Fixed | "BMW M4 Competition · 583 bhp" on one line at 1.3x. |
| 15 | Me's Coming up holds a live meet | Fixed | "Now: Car park meet-up · Checked in". |
| 16 | Host step 2 shield sliver | Fixed | Label-free. |
| 17 | Morning hours dim | Fixed | All hours full strength; "Evening (17–23) is shaded". |
| 18 | "Under the crosshair" card see-through | Fixed | Opaque card. |
| 19 | Layers "Events" | Fixed | "Meets · Cruises and rolling meets too. Yours always show". |
| 20 | People near you bare "About 8 mi" | Fixed | "Under 5 mi from home". (Same for everyone: problem 12.) |
| 21 | @mo.rs3 "470 at the hubs" | Fixed | "Rolling road", no second figure. |
| 22 | @dan_r "old airfield" over an office car park | Fixed | "Office car park". |
| 23 | R1 post blur box | Fixed | Softened background only. |
| 24 | Daytime photos for night meets and builds | Partly | Busy meets are night or dusk now; builds and posts are still day (problem 13). |
| 25 | Busy MX-5 owner's avatar not checked | Not checked | Didn't open @na_ollie; but @996_oscar shows an initial despite his 996 (problem 12). |
| 26 | Toasts land on what they confirm | Fixed | The vote toast sits under the voted card; Garage scrolls the new mod row clear. |

**Fixed 23, partly 2, not checked 1. None not fixed.**

## 9. Path to 10

Every gap I found between the app as tested and the top anchor of each score. **K** = clarity,
**C** = coherence, **L** = look. Effort: **S** small (copy, a style, one prop), **M** medium (one
screen or flow), **L** large (data, art or a cross-app pattern).

What a 10 needs overall:
* **Clarity 10:** C2 back (the meet point is the crosshair's point, every run), then the explanations
  already hold. Fewer hesitations: Coming up reachable on the map sheet; a count line that agrees
  with the list.
* **Coherence 10:** K3 (one event-page look, your own meet included), then a tester predicting a
  control twice.
* **Look 10:** small maps that look finished, pins without smudges, and builds in night light, so a
  tester volunteers three screens.

### Host a meet

| # | | What's wrong | What a 10 looks like | Effort |
|---|---|---|---|---|
| 1 | K | The saved meet point is 2–4 km south of the crosshair and varies run to run (problem 1). | Take the point from the crosshair's own screen position (unproject it, allowing for the map's padding and the bottom card), only after the map has settled; the same spot gives the same point and the same "N mi from home" every time. | M |

### Tonight

| # | | What's wrong | What a 10 looks like | Effort |
|---|---|---|---|---|
| 2 | K | Coming up is below the lowered sheet's fold at 375x667 (problem 4). | The lowered sheet shows your next meet as a compact row (or puts Coming up first, as the List does), above the tab bar. | M |
| 3 | K | "4 later · Show later" while two later meets already show (problem 6). | A count that matches what's drawn: "2 meets tonight · 2 of yours coming up · 4 more later · Show". | S |
| 4 | L | Dark pools read as smudges; labels still under Busy pins (problem 5). | Smaller, softer pools, or labels that dodge pins (collision) on the big map. | M |

### Event page

| # | | What's wrong | What a 10 looks like | Effort |
|---|---|---|---|---|
| 5 | C | Your hosted meet's page has its own look (K3, problem 3). | The same hero as every meet: the photo "It's up" used (your build, credited), kind on the pill, title on the photo; the map stays further down. | M |
| 6 | L | Small map cards dim, vignetted, with black water (problem 2). | A brighter label-free base: roads and land with more contrast, a lighter edge fade, water in a dark blue. Same on Host step 2 and onboarding. | S |
| 7 | L | Gap left as the "+150 rep" card fades (problem 8). | Fold the height while it fades, so the page never shows a hole. | S |
| 8 | L | Empty 64 px header band above every hero photo (problem 10). | The hero runs up under a transparent header, with a top scrim for the icons. | M |

### Route preview

| # | | What's wrong | What a 10 looks like | Effort |
|---|---|---|---|---|
| 9 | K | Auto-start in 5 s while four lines are still being read (problem 7; owner decision 9.9). | Owner call: keep the auto-start, but start counting when the summary is fully drawn and give it 8 s, or trim the summary to two lines. | S |

### Vote and trophy

| # | | What's wrong | What a 10 looks like | Effort |
|---|---|---|---|---|
| 10 | L | Footer half-covers the sixth build on open (problem 11). | Bottom padding equal to the footer, so the last visible row is whole. | S |

### Cross-app

| # | | What's wrong | What a 10 looks like | Effort |
|---|---|---|---|---|
| 11 | L | Wrapped meta lines start with "·"; lone "it." in Garage (problem 9). | A meta line that drops the separator at a wrap (neither end nor start shows a dot); no one-word last line in short notes. | S |

### People near you and demo art

| # | | What's wrong | What a 10 looks like | Effort |
|---|---|---|---|---|
| 12 | K | Every row "Under 5 mi from home", alphabetical (problem 12). | Rough bands that differ ("Under 5 mi", "About 10 mi", "About 20 mi from home"), sorted nearest first. | S |
| 13 | C | @996_oscar has an initial though he has a car (owner decision 12). | Every person with a build shows its photo. | S |
| 14 | L | @a35_aisha and @a45_amir share one photo. | One photo per build. | S |
| 15 | L | Builds and posts in daylight (R21 24, problem 13). | Night or dusk photos for the demo's builds and posts. | L |

**Count: 15 gaps: 9 S, 5 M, 1 L.**

### Suggested new automated checks

* **PLACE-STABLE (1):** host the task 9 meet twice in one run (or once in each of two runs); the saved
  coordinates must match each other and lie within 100 m of the point under the crosshair (read the
  map's own unproject of the crosshair's centre).
* **RUNS-IDENTICAL (1):** diff every distance and time string the four runs saw on the same screens
  (Tonight, "It's up", Me); any difference fails, as 7.1 says.
* **SHEET-FOLD (2):** at 375x667, with a seeded meet you're going to, its row (or "Your next meet") is
  fully drawn above the tab bar on Tonight's lowered sheet.
* **COUNT-MATCH (3):** the count line's "N later" equals the later meets that are hidden, not ones
  shown under Coming up.
* **EVENT-HERO (5):** your hosted meet's page uses the same hero as other meets (a photo with the
  kind pill and the title on it) and the same image as "It's up".
* **MAP-CARD-LUMA (6):** a small map card's mean luminance and road-to-land contrast stay above a
  floor, and no near-black blob over 1% of the card.
* **FOLD-GAP (7):** sampled every 100 ms for 8 s after check-in, the space between the location line
  and the going row never exceeds 32 px.
* **LEAD-DOT (11):** no rendered line starts with "·" (DOT-WRAP checks only line ends).
* **SHEET-FOOTER (10):** when a sheet opens, no list row is under its footer by more than 8 px.
* **AVATAR-PHOTO (13) and PEOPLE-SORT (12):** People near you rows with a build show its photo; the
  list is sorted by distance and the distances aren't all one value.

Not automatable: whether the maps look finished (6), whether the pools read as smudges (4), night
mood (15), and whether a tester predicts a control.

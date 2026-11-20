# Review 17: fixed scorecard

Scored against `REDESIGN-2.md` section 7 (fixed scorecard) and section 8 (8+ criteria), read before
testing. Section 4 (the rulebook, with its owner exceptions) and section 9 were read only after the
task runs, to count rule breaks. Review 16 was read last, for the comparison only.

**Set-up:** `1311ad7` on main (three more commits, up to `e6526d8`, landed on main while I was
testing; they are not in this build). `npx expo export --platform web --clear` into
`~/nightshift-wt/r17-web`, served with SPA fallback on port 8717 and killed by PID afterwards. My own
headless Chromium (Playwright from Node scripts, not the shared MCP browser): 375x667, touch and
mobile emulation, @2x, Europe/London, en-GB, demo mode, no location permission, Busy night left off.
Four scored runs, each from cleared storage: browser clock 12:30 and 20:30 on Wed 18 Nov, each at
1.0x and 1.3x text. Then free exploration at 393x852. Screenshots are in `~/nightshift-wt/r17-shots`:

* `x…` is the first, unscripted walk-through, one step per script. The hesitations and human times
  come from it.
* `r-1230-10-`, `r-2030-10-`, `r-1230-13-` and `r-2030-13-` are the scored runs (`t1` to `t10` is the
  task).
* `e-…` is the exploration and the follow-up checks.

**Limits:**
* Human times are my estimate from the walk-through: reading, choosing and tapping, at about 1.5 s a
  tap plus reading. The script's wall time is given next to them.
* 1.3x text is simulated by multiplying each element's computed font size and line height by 1.3,
  once per element. SVG `tspan`s are skipped so nested text isn't scaled twice.
* Web Share: headless Chromium has no `navigator.share`, so the web build opened its own "Share this
  meet" sheet (link and Copy link). That counts as the share sheet.

## 1. Task table

All four runs gave the same outcomes, and the visible text at the end of every task was the same at
12:30 and 20:30 (diffed), apart from the random demo handle (`@fiesta_NNNN`), which changes on every
run and doesn't follow the clock. The demo night (Fri 20 Nov, about 21:10) makes both clocks the
same. No crash, no on-screen error and **no console errors** in any run.

### 12:30 and 20:30, 1.0x text (identical)

| # | Result | Human | Script | Taps | Notes (shots) |
|---|---|---|---|---|---|
| 1 | Pass | 30 s | 5.8 s | 6 + typing | Try the demo without the 18+ tick gives "Tick the box to say you're 18 or over first." (x2-a). "Fiesta ST" gives "Ford Fiesta ST · 5 versions": which is mine? (about 5 s, x2-c). Mk8, Next, "Where's home? Around Tamworth" with a handle filled in, Show me tonight. Garage has the Fiesta with a photo (x2-f, x8-a). |
| 2 | Pass | 4 s | 0.9 s | 1 | The live "Car park meet-up" card leads the map sheet. Tap it: the event page (x3-b). |
| 3 | Pass | 3 s | 0.5 s | 1 | The pin animates, the page scrolls to "Leisure park car park, Tamworth.", toast "You're going · CHANGE", ActionBar "Going with your Fiesta ST Mk8" over Check in (x4-a, x4-b). |
| 4 | Pass | 8 s | 2.6 s | 2 | Navigate opens the drive view ("Arrive 21:15", "Demo night: Friday's clock · 4× speed"). End brings me back to the event (x5-a). |
| 5 | Pass | 3 s | 0.5 s | 1 | The ring bursts, "+150 rep · For turning up.", toast "Checked in". Vote becomes the primary (x5-c). |
| 6 | Pass | 30 s | 5.8 s | 5 + file | Vote opens "Vote: Best car" (x6-a). Hyundai i30 N, toast "Voted for Hyundai i30 N", Done. The page then says "Results are in." with a Best car cover, and "1 of 3 voted · Best bike next" under it (about 5 s: is voting over or not? x6-c). Add a photo, file, crop, Use this crop, "Photo posted"; "Photo by You" is first in Photos (x6-e, x6-f). |
| 7 | Pass | 30 s | 7.8 s | 5 + typing | "11 going · 8 cars, 3 bikes", @dan_r, Connect, "Request sent", "Waiting for @dan_r to accept" for about 3 s, then CONNECTED and Message. Typed, Send, toast "Sent" (x7-a to x7-g). |
| 8 | Pass | 15 s | 6.8 s | 7 | Three backs from the chat to Tonight, Garage, Add a mod, Cold air intake, "Add cold air intake". The toast "Added. Now 201 bhp, Class B" answers the question; the card says "201 bhp · 1 mod" with the B badge (r-2030-10-t8-toast). |
| 9 | Pass | 55 s | 12.2 s | 13 + typing | "+" on Tonight, name, Starts Change, Sun 22, 10, Done (ends Sun 13:00). Step 2: tap the map, Set meet point here, names filled in. Step 3: "Who can come: Everyone". Step 4 "Sun 10:00–13:00 … Everyone", Post meet, toast "Invites sent to 18 people nearby", Share, "Share this meet" sheet (x9-a to x9-k). |
| 10 | Pass | 20 s | 7.9 s | 8 | Done, back, Me, Sunday coffee and cars. The ActionBar has "Going" and **Can't make it**. ConfirmSheet "Yes, I can't go / I'm still going", toast "You're not going to Sunday coffee and cars · UNDO". Back, gear: "Show me in People near you" is first under Privacy (x10-b to x10-f). |

**12:30: 10/10. 20:30: 10/10.**

### 12:30 and 20:30, 1.3x text

| # | 12:30 | 20:30 | Script | Notes |
|---|---|---|---|---|
| 1–10 | 10/10 | 10/10 | Same as 1.0x (±0.1 s) | Same outcomes and toasts. One clip on a task screen: on Me (task 10), the checked-in meet's meta line is cut to "Meet · Live · until 23:00 · 2 mi from …" (e-me-13). The trophy cover's wordmark now fits ("SLIPSTREAM" whole, car name wraps "Hyundai / i30 N", e-cover-1.3). "583 bhp" stays together on the Going list. The drive view's bottom row is tight ("21:15 2.9 mi 6 min" next to END) but nothing is cut (r-2030-13-t4-drive). |

## 2. Time to understand

| Measure | Result | Target | Pass? |
|---|---|---|---|
| TTU-1 | About 3 s. "What's on tonight near you. Go with your car." over a photo, then "See tonight's meets near you / Say you're going, with your car / Check in and vote for the best build" (x1-signin). That covers car meets, near me and tonight, and going with my car. | ≤ 5 s | Pass |
| TTU-2 | About 27 s from Try the demo to the first I'm going tap (the 18+ tick, the Fiesta choice, step 2, the live card). Script: 8.5 s. | ≤ 60 s | Pass |

**Hesitations over 5 s:** none clearly over 5 s.

**Hesitations of about 5 s:**
1. Task 6: after one vote the page says "Results are in." and shows a Best car cover, but right under
   it "1 of 3 voted · Best bike next", and the meet is live until 23:00. Is voting over? *Wording and
   state.*
2. Task 1: five Fiesta ST versions. Which is mine? *A choice, not wording.*

**Shorter hesitations (under 5 s):**
* Task 1: I tapped Try the demo before ticking 18+ (the message says what to do).
* Task 7: "Waiting for @dan_r to accept" for about 3 s, with nothing to say it will be quick.
* Task 8: three backs from the chat before the tab bar shows.
* Task 9: the "+" on Tonight hosts a meet; on Garage the same "+" adds a car, on Community it posts.
  Same place, three jobs (the rule allows it).

## 3. Scores

### Clarity: **7**

| Criterion | Result | Evidence |
|---|---|---|
| C1 TTU-1 ≤ 5 s | **Met** | About 3 s. |
| C2 10/10 at both times | **Met** | 10/10 at 12:30 and 20:30, at 1.0x and 1.3x. No hints. |
| C3 inside the limits; TTU-2 ≤ 60 s | **Met** | Closest: task 9 (55 of 120 s), task 7 (30 of 60 s), task 6 (30 of 90 s), task 10 (20 of 45 s). TTU-2 about 27 s. |
| C4 no 4.12 word | **Met** | A scan of the visible text on Tonight (map and list), Community (Feed, People, Chats), Garage, Me and the event page finds only "Level 1 · Newcomer" on Me (owner exception). "+150 rep" after check-in is the other exception. |
| C5 each fact said once | **Missed** | On a meet I'm going to (task 10), "going" is said twice: the GOING badge on the photo and the "Going" pill in the ActionBar; and 09:00 twice: "Location shows at 09:00." and the "Remind me at 09:00" switch under it (x10-b). Right after I'm going (task 3), the place is said twice: "Leisure park car park, Tamworth." and the "LOCATION SHOWN · Leisure park car park" card on the map, which stays until tapped (x4-b). After one vote, "Results are in." and "1 of 3 voted · Best bike next" contradict each other (x6-c). |
| C6 no dead ends; errors say what to do | **Met** | Every error says what to do: 18+, "Give the meet a name.", "Add the make and model.", "Write something first." No disabled primary. Bad links (`/this/does/not/exist`, `/event/…`, `/user/…`, `/build/…`) show a not-found screen with a glyph and "See tonight's meets". Back from a changed host form or profile asks "Discard it / Keep editing". (Settings › Sign in loses its back arrow, but Try the demo gets you out: problem 1.) |

Anchor 6 is fully true: purpose clear in 10 s, 10/10, no wording hesitation over 5 s. Anchor 8 has 5
of its 6 lines; only C5 is missed. All of 6 and most of 8: **7**.

### Coherence: **7**

Rulebook exceptions on the screens met in the tasks: **1** (section 4), so anchor 6 (1–5) applies.
No line of anchor 4 is true: one back style (the chevron), the crop screen's ✕ is the Cancel 4.5
allows on a form that loses work, and the drive view's End is the owner exception.

* **K1** zero exceptions: **missed** (1: the going toast's CHANGE).
* **K2** one selector per job: **met** on its own test. One SegmentedControl per screen (Map/List,
  Feed/People/Chats, Car/Bike, Engine/Chassis/Wheels/Looks, All/Meets/Places/People), never nested.
  ChoiceGroup pills for meet type, How far, Open in and feedback kind. DateTimeSheet for the start.
  SearchField for make and model. (Edit profile's Region has 11 pills; that's a 4.4 break, counted in
  section 4, not a Chip-as-radio.)
* **K3** one look per kind of thing: **missed**, outside the tasks only. On a past meet the Best bike
  and Best in show rows show a build as "@aimee.r1 · Yamaha YZF-R1": no ClassBadge, no bhp
  (e-past-trophies). On the task screens it holds: an event row is "Meet · Sun 10:00 · about 1 mi
  from home" on Tonight, Search and Me; a person is avatar + @handle everywhere, including me on the
  Going list ("@fiesta_… · You · Checked in"); a build is ClassBadge + name + bhp on the Going list,
  vote sheet, chat header, profile, feed and Garage.
* **K4** every screen matches a template: **met** on the task screens as far as I can see.
* **K5** one power number: **met**. 197 bhp, then 201 bhp after the mod, everywhere.

3 of 5 lines of anchor 8 (K2, K4, K5) with all of anchor 6: **7**.

### Look: **7**

* **L1** a photo or real map above the fold on every first-level screen at 375x667: **met**. Tonight
  map and list, Community feed, Garage, Me and every event page (x2-f, e-list, e-community, x8-a,
  x10-a, x3-b; my hosted meet leads with its map, e-openmeet).
* **L2** the look checklist on every screen: **missed**.
  * Clipping at 1.3x on a task screen: Me's meet row cut to "… 2 mi from …" (e-me-13).
  * Overlap at 1.0x: the check-in burst ring spills past the left edge of the "+150 rep" card for a
    moment (x5-c).
  * Placeholder art on a task screen: the onboarding car row is an outline drawing, not a photo
    (x2-d; not a first-level screen).
  * Outside the tasks: a sentence in capitals on Edit profile, "SET FROM YOUR HOME AREA. CHANGE IT IF
    IT'S WRONG." (e-region).
* **L3** a real dark map on web with the same pins and clusters: **met**. Stadia dark tiles, a "3"
  cluster at 375 wide (separate pins at 393), the live pin's pulse, area circles.
* **L4** the four motion moments: **met**. Going: the pin animates and the toast comes at once.
  Location shows: the "LOCATION SHOWN" card. Check in: the ring bursts into the tick. Trophy: the
  results cover appears with sparks round it.
* **L5** three screens I'd share: **met**: the trophy cover (e-cover-1), the event page with its hero
  photo (x3-b) and the Garage card (x8-a). The demo photos are still daytime street shots.

Anchor 6 ("consistent and tidy") holds: the 1.3x cut on Me is a clean ellipsis on one meta line,
not cut glyphs or overlapping text, and the ring spill lasts a moment. Anchor 4's line (visible
clipping, overlap or misalignment) is not true in the sense it was applied in Review 16 (cut glyphs
in the wordmark). With L1, L3, L4 and L5 met, all of 6 and most of 8 gives **7**. If the Me ellipsis
is read as anchor-4 clipping, Look would be 5; I don't think it is.

### 8+ criteria summary

| Met | Missed |
|---|---|
| C1, C2, C3, C4, C6, K2, K4, K5, L1, L3, L4, L5 | **C5, K1, K3, L2** |

## 4. Rule breaks, counted

Owner exceptions not counted: "+150 rep" after check-in; the level line on Me; the ladder sheet and
its level names; check-in; the drive view's End as its back; Shops and Speed cameras as optional
layers in Map layers (both off by default).

**On screens met in the tasks: 1.**

| # | Rule | Screen | Break | Shot |
|---|---|---|---|---|
| 1 | 4.7 | Live event, after I'm going (task 3) | The toast "You're going" carries a CHANGE button. 4.7: a toast "never takes a tap (only its Undo does)". | x4-a |

**Outside the tasks: 5.**

| # | Rule | Screen | Break | Shot |
|---|---|---|---|---|
| 2 | 4.2 | Settings › Sign in or create an account | Opens the first-run landing (Try the demo / Sign in) with no back arrow. The way out is Try the demo; the email form is one more tap. | e-signin-from-settings, e-s5-signin |
| 3 | 4.2 | Send feedback | With a message typed, back leaves at once and drops it. "Back from a form with changes always asks first." (The host form and Edit profile do ask.) | e-fb-typed, e-fb-back |
| 4 | 4.1 | Forum and for sale | A "+" on the right of a pushed screen's header. Pushed screens get at most Share and `···`. | e-forum |
| 5 | 4.4 | Edit profile, Region | 11 options as pills. ChoiceGroup is pills up to 5, a list beyond. | e-region |
| 6 | 4.11 | Past meet (Me › Last week's meet) | The location line (pin icon) reads "Results are in." instead of "{Meet point}, {Town}." or "Around Tamworth". | e-past |

**Total: 6** (1 on task screens).

**Borderline, not counted:**
* On the live event after check-in, the location block has a second line, "Vote for 3 trophies.",
  then "Results are in." It mixes vote status into the location line (4.11), but the place itself is
  worded right.
* The drive view shows "6 min" without a clock time in brackets and "2.9 mi" twice. That's sat-nav
  convention, and the drive view is the owner's exception for back.
* The Going list, Search, Notifications and Credits have caps titles on pushed screens. 4.1 only names
  detail screens (no title) and forms and settings (caps title). Credits also repeats itself:
  "CREDITS" then "OPEN DATA AND CREDITS".
* "DEMO RESULTS" as the section label on a live meet's results: the demo is saying it's a demo.

Look-checklist exceptions (counted under L2, not as rule breaks): Me's meet row at 1.3x; the burst
ring; the outline car on onboarding; the caps sentence on Edit profile.

## 5. Problems, ranked

| # | Severity | Screen | Steps | What's wrong | Shot |
|---|---|---|---|---|---|
| 1 | Medium | Sign in from Settings | Me, gear, Sign in or create an account | Lands on the first-run landing with no back arrow (break 2). It offers "Try the demo" as the primary to someone who asked to sign in; Sign in is one more tap. `e6526d8` ("Settings: … Back to my account") landed after this build and may change it. | e-signin-from-settings |
| 2 | Medium | Me at 1.3x | 1.3x text, go and check in, Me | The meet row's meta is cut to "Meet · Live · until 23:00 · 2 mi from …". It's a task screen, and the only clip left at 1.3x (L2). Two lines for the meta, or shorter wording ("Live · until 23:00 · 2 mi"), fixes it. | e-me-13 |
| 3 | Medium | Live event after one vote | Check in, Vote, pick a car, Done | "Results are in." and a Best car cover, while the next line says "1 of 3 voted · Best bike next", the meet is live until 23:00, and How Slipstream works says voting runs until 24 h after the end. It reads as over and not over at once (hesitation 1, C5). | x6-c, e-cover-1, e-help |
| 4 | Low | Event, going, location hidden | Me, Sunday coffee and cars | "Going" twice (the badge on the photo and the ActionBar pill) and 09:00 twice ("Location shows at 09:00." and "Remind me at 09:00"). Keeping one of each makes C5 true here. | x10-b |
| 5 | Low | Live event right after I'm going | Car park meet-up, I'm going | The place twice: the line "Leisure park car park, Tamworth." and the "LOCATION SHOWN · Leisure park car park" card on the map, which stays until tapped (C5's "one location line"). Letting the card fade after the motion moment fixes it. | x4-b |
| 6 | Low | Going toast | I'm going | "You're going · CHANGE": a toast with an action that isn't Undo (break 1). | x4-a |
| 7 | Low | Send feedback | Me, Send feedback, type, back | The message is dropped without asking (break 3). | e-fb-typed, e-fb-back |
| 8 | Low | Past meet | Me, Last week's meet | The pin line says "Results are in." (break 6). The Best bike and Best in show rows show a build with no class or bhp (K3). It still says "9 going" and "Who we'll tell: drivers within 30 mi" a week after it ended. | e-past, e-past-trophies |
| 9 | Low | Edit profile | Me, Edit profile | Region is 11 pills (break 5) under a caps sentence (L2). "New meets within 25 mi" and How far are here and in Settings: one setting in two places. | e-region, e-editprofile |
| 10 | Low | Me stats | Me after onboarding | "0 MEETS" while Your meets › Past lists Last week's meet with Results. A brand-new demo user has a past meet but no meets. | x10-a |
| 11 | Low | Forum | Community, Forum and for sale | "+" in a pushed screen's header (break 4). | e-forum |
| 12 | Low | Check-in moment | Check in | The burst ring spills past the "+150 rep" card's left edge for a moment (L2). | x5-c |
| 13 | Low | Onboarding car row | Search "Fiesta ST", pick one | The picked car is an outline drawing; Garage then shows a real photo (L2). | x2-d |
| 14 | Low | Demo handle | Any two runs | `@fiesta_NNNN` is random each run, so two runs are never identical (it doesn't follow the clock, so no task fails). | x2-e, x7-a |
| 15 | Low | Demo photos | Sign-in, events, Garage | Daytime street and field shots, not night meets. The sign-in hero is a red car on grass in daylight under "What's on tonight". | x1-signin |
| 16 | Low | Garage | Garage tab | "+ ADD A PHOTO" under the car card doesn't say a photo of what. | x8-a |
| 17 | Low | Drive view at 1.3x | Navigate, 1.3x | "21:15 2.9 mi 6 min" nearly touch each other and END. Nothing is cut, but it's the tightest row in the app. | r-2030-13-t4-drive |

## 6. Compared with Review 16

Review 16 scored **Clarity 7, Coherence 7, Look 5**, with 10/10 at each time and size. Review 17
scores **Clarity 7, Coherence 7, Look 7**, again with 10/10 at each time and size, and no console
errors.

**Fixed since Review 16 (checked):**
* **Leaving a meet (R16 #1):** Can't make it is back in the ActionBar next to the Going pill. Task 10
  went from about 35 s with two dead taps to about 20 s with none.
* **"Leave it / Keep it" (R16 #4):** now "Yes, I can't go / I'm still going".
* **Vote order (R16 #3):** the sheet opens on Best car.
* **Trophy wordmark at 1.3x (R16 #2):** "SLIPSTREAM" is whole; the car name wraps cleanly.
* **bhp split from its number at 1.3x (R16 #5):** "583 bhp" stays together on the Going list.
* **Event rows (R16 #6) and live time (R16 break 1, #7):** one format, "Meet · Sun 10:00 · about 1 mi
  from home", on Tonight, Search and Me; "Live · until 23:00" on the card and the event page.
* **Search's platform note (R16 break 2, #10):** gone; "Nothing for 'zzzz' / Try a town, or a car
  like 'Golf'."
* **Not-found screens (R16 break 3, #9):** all have the glyph and sit the same way.
* **Hosted meet (R16 break 4, #12):** "Tamworth meet point, Tamworth." and "People going see it at
  09:00 (1 h before)." The HOSTING pill is the same on the "It's up" page and the meet page (R16 #11).
* **Going list (R16 #15):** I'm "@fiesta_… · You · Checked in".
* **Breaks on task screens:** still 1, but a different one; the four R16 breaks are all fixed.

**New or worse:**
* **Me at 1.3x (problem 2):** showing the distance on Me's rows (part of the event-row fix) cuts the
  checked-in meet's meta line at 1.3x.
* **Settings › Sign in (problem 1)** and **Send feedback's back (problem 7):** not in Review 16; both
  outside the tasks.
* **Not counted or noticed in Review 16:** the going toast's CHANGE (4.7), the forum's "+", Region's
  11 pills, the past meet's location line and trophy rows, Me's "0 MEETS" next to a past meet.

**Still there:**
* **C5:** "going" and the 09:00 time are each said twice on a going meet; the place is said twice
  right after I'm going.
* **"Results are in." after one vote** while the meet is live (Review 16 counted the line as a fix;
  next to "1 of 3 voted" it reads as a contradiction).
* **The burst ring spill, the outline car on onboarding, daytime demo photos, the ambiguous "+ ADD A
  PHOTO".**

**Net:**
* **Clarity** stays at 7. Only C5 is missed. Saying "going" and the place once (drop the photo badge
  or the pill; let the LOCATION SHOWN card fade) and holding "Results are in." until voting closes
  would make C5 true and give 8.
* **Coherence** stays at 7. One break on the task screens (the toast's CHANGE) and the past meet's
  trophy rows (K3). Making the going toast's action Undo, and using ClassBadge + bhp on every trophy
  row, would meet K1 and K3 and give 8, if the five breaks outside the tasks are fixed too.
* **Look** goes up from 5 to 7: the 1.3x wordmark clip that held it at 5 is fixed. The Me row at 1.3x,
  the burst ring and the onboarding outline car are what stand between it and 8.

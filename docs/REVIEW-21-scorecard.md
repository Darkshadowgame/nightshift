# Review 21: fixed scorecard and path to 10

Scored against `REDESIGN-2.md` section 7 (fixed scorecard) and section 8 (8+ criteria), read before
testing. Section 4 (rulebook, with its owner exceptions) and section 9 (owner decisions) were read
only after the scored runs, to count breaks. Review 20 was read last, for the comparison and its
path-to-10 list.

**Set-up:** `08b379c` on main (`git pull`: already up to date). `npx expo export --platform web
--clear` into `~/nightshift-wt/r21-web`, served with SPA fallback (the scorecard's own `serve()` in
its own process, killed by PID at the end; the export deleted afterwards). My own headless Chromium
from a Node Playwright control script: 375x667, touch and mobile emulation, @2x, Europe/London,
en-GB, cleared storage per run, demo mode, Busy night off, **location granted** at a point about
15 mi south of the demo home (Tamworth), so onboarding keeps the demo home. Four scored runs:
browser clock 12:30 and 20:30 on Thu 19 Nov, each at 1.0x and 1.3x text (the scorecard's own
scaler). Then free exploration at 393x852 and one Busy night pass (not scored). JPEG screenshots in
`~/nightshift-wt/r21-shots`:

* `a12-…`, `b12-…`: the first, unscripted walk-through at 12:30, 1.0x, driven one tap at a time
  after reading each screen. Hesitations and human times come from it. (My first harness didn't
  answer the web file picker, so I restarted the walk-through at task 6 with one that does: `a12`
  covers tasks 1–5, `b12` tasks 6–10. A harness limit, not an app fault.)
* `c20-…` (20:30, 1.0x), `d12-…` (12:30, 1.3x), `d20-…` (20:30, 1.3x): the other three runs, scripted
  at human pace (0.7–4 s on each screen, 3–4 s on each toast), same steps.
* `e-…`: exploration and Busy night at 393x852. `f-…`: follow-up checks (cancelling your own meet,
  the Feed, Busy People near you).

**Limits:** human times are my estimate from the walk-through (about 1.5 s a tap plus reading time);
the scripted runs show outcomes, text and layout, not hesitation, since by then I knew the app.
Headless Chromium has no `navigator.share` and no clipboard permission, so the web "Share this meet"
sheet counts as the share sheet and "Copy link" can't confirm; the photo picker is the web file
chooser.

## 1. Task table

The demo night (Fri 20 Nov, from 21:10) makes 12:30 and 20:30 identical: the same outcomes and the
same text at every step, apart from the random handle and the chat stamp. **No console errors, no
on-screen error, no crash** in any run.

### 12:30, 1.0x text (first walk-through)

| # | Result | Human | Taps | Notes (shots) |
|---|---|---|---|---|
| 1 | Pass | 40 s | 7 + typing | Read the hero, went straight for Try the demo: "Tick the box to say you're 18 or over first." (a12-demo1). Ticked, Try the demo, "What do you drive?", typed "Fiesta ST": five versions, the ST180 marked "Most common" (a12-search); picked, Next. Step 2: "Demo home: Tamworth · The demo's sample meets are round here." with Use my location instead (a12-step2). Show me tonight. The Garage has the Fiesta ST Mk7 ST180, 179 bhp, Stock (b12-garage). |
| 2 | Pass | 5 s | 1 | The live "Car park meet-up" card leads the map sheet, "Live · until 23:00 · about 2 mi from home · 10 going" (a12-tonight); tap, event page (a12-event). |
| 3 | Pass | 4 s | 1 | I'm going: the page scrolls to the map, toast "You're going", "Location shown" chip at the top of the map over the pin, "Going with your Fiesta ST Mk7 ST180" in the ActionBar, the place now "Leisure park car park, Tamworth." (a12-going1, a12-going2). |
| 4 | Pass | 12 s | 2 | Navigate: route preview "6 min 2.9 mi drive · Arrive 21:16 (Demo · Fri)", "Demo: a sample route from home…", "Starting in 4", "Tap anywhere to stop" (a12-nav). While I read, it started turn-by-turn (owner exception 9.9). End brought me back to the event (a12-navend). |
| 5 | Pass | 5 s | 1 | Check in: "+150 rep · For turning up. It shows on your profile." with the tick ring, toast "Checked in", "Checked in" in the ActionBar status line, Vote primary, Add a photo secondary (a12-checkin1/2). |
| 6 | Pass | 35 s | 5 + file | Vote, "Vote: Best car · Tap the build you think wins.", Ford Focus RS Mk3: orange border, "✓ Your vote", toast "Voted for Ford Focus RS Mk3" (which covers the card it confirms, a12-voted). Done: "Demo: how Best car went · 6 votes" with the SLIPSTREAM trophy card, "2 more to vote", Add a photo now primary (a12-addphoto). Add a photo, file, "Crop the photo", Use this crop, toast "Photo posted"; my photo first in Photos, every tile a whole photo (b12-crop2). |
| 7 | Pass | 35 s | 7 + typing | Scrolled up, "11 going · 8 cars, 3 bikes", @dan_r, Connect, toast "Request sent", "Demo: @dan_r will accept in a few seconds" (b12-connect), Connected, Message, typed, Send, toast "Sent" (b12-sent). |
| 8 | Pass | 15 s | 4 | Garage tab, Add a mod, Cold air intake (ticked, "Leave it empty to use about +4 bhp."), "Add Cold air intake". Toast "Added. Now 183 bhp, Class B" (over the new mod row), card "183 bhp · 1 mod" with the B badge (b12-modded, c20-20modded). |
| 9 | Pass | 85 s | 16 + typing | Tonight, the calendar "+", name, Starts Change, Sun 22, 10, Done (Ends Sun 13:00), Next, tap the map, "Place the meet point", Set meet point here, meet point name, Next, "Who can come: Everyone", Next, "Check and post", Post meet. **"Time clash · You're going to Sunday coffee and cars then. Host anyway?"** (b12-post). Host anyway, "It's up. Share it so people come." with my Fiesta's photo, "Sun 10:00 · 2 mi from home · 1 going" (b12-posted2), Share, "Share this meet" sheet (b12-share). |
| 10 | Pass | 30 s | 8 | Done, Tonight. The map sheet's "Coming up" shows my own meet first; List shows "Sunday coffee and cars · Meet · Sun 10:00 · about 1 mi from home · You're going (demo)" (b12-list). Open it, Can't make it, "Take yourself off Sunday coffee and cars?", "Yes, I can't go", toast "Not going · Undo", "4 going" (b12-left). Back, Me, gear: Privacy, "Show me in People near you", off (b12-settings). |

**12:30, 1.0x: 10/10.**

### 20:30 1.0x, 12:30 1.3x, 20:30 1.3x (scripted at human pace)

All three: the same screens, text and outcomes as the walk-through, **10/10** each. Taps as above.
Script wall times sat between half and two thirds of the human times above (they don't hesitate).

At 1.3x: no cut text on a task screen. The map keeps the same height (the sheet starts at the same
place). Lines wrap with a dangling separator in places: the trophy card's "@cal_focusrs · 400 bhp ·"
then "4 mods", the chat header's "BMW M4 Competition ·" then "583 bhp", Host step 3's "within 25" then
"mi" (d12 contact sheets). On Tonight's card the "● MEET" label sits on the brightest part of the
yellow car and is barely legible (d12-29back).

## 2. Time to understand

| Measure | Result | Target | Pass? |
|---|---|---|---|
| TTU-1 | About 4 s. "What's on tonight near you. Go with your car." over a night shot of a modified 350Z, then "See tonight's meets near you / Say you're going, with your car / Check in and vote for the best build" (a12-signin). Car meets, tonight near me, go with my car: all three. | ≤ 5 s | Pass |
| TTU-2 | About 40 s from the first Try the demo tap to I'm going (the 18+ error, the Fiesta version, step 2, the live card, I'm going on the event page). | ≤ 60 s | Pass |

**Hesitations over 5 s (walk-through):**
1. **Route preview** (about 5 s): "Starting in 4" counted down while I read. *Owner exception 9.9;
   noted, not counted.*
2. **Task 10, finding the Sunday coffee meet** (about 6 s): after hosting, the map sheet's "Coming
   up" leads with my own Sunday meet and the seeded one sits below the fold; I switched to List,
   where both show. *Layout, not wording.*

**Under 5 s:** the 18+ tick (the first tap on Try the demo errors); the Starts sheet's morning hours
drawn dim, so 10 looks unavailable for a moment ("Evening hours are lit"); the Add a mod sheet's
Done next to "Add Cold air intake" (which one saves?); "2 meets tonight · 4 later · Show": show what?

No hesitation over 5 s was caused by wording.

## 3. Scores

Method as Reviews 11–20: the highest anchor whose every line is true; a score between anchors means
all of the lower anchor and most of the higher one's lines.

### Clarity: **9**

| Criterion | Result | Evidence |
|---|---|---|
| C1 TTU-1 ≤ 5 s | **Met** | About 4 s. |
| C2 10/10 at both times | **Met** | 10/10 in the walk-through at 12:30 and in the 20:30 run (and both 1.3x runs). The clash warning in task 9 names "Sunday coffee and cars", so task 10's meet is known before it's asked for. |
| C3 inside limits; TTU-2 ≤ 60 s | **Met** | Closest: task 9 (85 of 120 s), task 1 (40 of 60 s), task 10 (30 of 45 s). TTU-2 about 40 s. |
| C4 no 4.12 word | **Met** | Only "+150 rep", "Level 2 · Regular" and "Tap anywhere to stop" (owner exceptions). |
| C5 each fact said once | **Met** | Event page: one "Live · until 23:00", one location line, one "Checked in" (status line; the toast is left out); the compact header title only once the hero title has gone. Route preview, Me, Settings, "It's up" and the cancelled meet ("The host cancelled this meet.", once) are clean. |
| C6 no dead ends; errors say what to do | **Met** | No disabled primary anywhere. "Tick the box to say you're 18 or over first." Every ActionBar has a way on ("Going" + Can't make it). |

Anchor 8 is fully true. Anchor 10 adds one line: explain check-in, the location reveal and voting
back unprompted. Check-in ("For turning up. It shows on your profile.", then Vote and Add a photo)
and the reveal ("Location shows to people going.", "Location shown", "Location shows at 09:00.")
I can explain. Voting I can explain too, but the demo result undercuts it: the build I voted for wins
the instant I close the sheet, "6 votes", in both runs where I tried it (R20 voted the M4 and the M4
won), which reads as "my vote decided it". Most of the 10 line: **9.** Not 10: the vote result.

### Coherence: **7**

Rulebook exceptions on the screens met in the tasks: **1** (section 4): anchor 6.

* **K1** zero exceptions: **missed** (1: the route preview's header title, 4.1).
* **K2** one selector per job: **met.** One SegmentedControl per screen (Map/List, Car/Bike,
  Engine/Chassis/Wheels/Looks, Feed/People/Chats; the Layers sheet's per-section ones are an owner
  exception); ChoiceGroup pills for meet type; DateTimeSheet for Starts; SearchField for make and
  model.
* **K3** one look per kind of thing: **met.** One meet card on Tonight's map sheet and List (title on
  the photo, I'm going), ListRows with the meet glyph for Coming up and in Me; people are car-photo
  avatar + @handle everywhere; builds are ClassBadge + name + bhp (vote rows, going list, Garage, Me).
* **K4** every screen is a template: **met** as far as I can see.
* **K5** one power number: **met** in the tasks (179, then 183 bhp everywhere). Outside them, a Feed
  post gives @mo.rs3's RS3 a second one (see section 4).

All of anchor 6 and 4 of 5 lines of anchor 8: **7.** Not counted (owner exceptions): the drive
view's End, the crop screen's ✕, "It's up" with no back and Done, the lit Community tab on a profile
and chat, the Time clash confirm, "You're going (demo)", Coming up above Live now. Not 10: K1, and
prediction still trips on small things (Done next to the Add button in the Add a mod sheet; the
count line's "Show").

### Look: **7**

* **L1** a photo or real map above the fold on every first-level screen at 375x667: **met.** Tonight
  map and List, Community feed, Garage, Me, every event page.
* **L2** the look checklist on every screen: **missed** (3 exceptions, all small map cards; section
  4). Also below the bar but not on the checklist: the "● MEET" label unreadable on a bright photo;
  toasts that cover the very thing they confirm (the voted card, the new mod row).
* **L3** a real dark map on web: **met.**
* **L4** the four motion moments: **met.** Going (toast, scroll to the map), location shows ("Location
  shown" chip over the pin, clear of the toast), check-in (tick card, then "Checked in" in the
  ActionBar), trophy ("Demo: how Best car went").
* **L5** three screens I'd share: **met.** The trophy card (a12-addphoto), the Car park meet-up page
  with its night Peugeot hero (a12-event), Tonight's List on Busy night (e-busy-list-mid).

Anchor 6 ("consistent and tidy") is true: the Photos grid is fixed, the reveal and check-in moments
no longer collide, "It's up" has a real photo. Anchor 4's "visible clipping" is only the map cards'
edge labels and one shield sliver, small next to Review 20's photo grid. All of 6 and 4 of 5 lines of
8: **7.** Fixing the map edges gives 8. Not 10: I'd post the trophy card and the event page, but not
yet unprompted; the "MEET" label and the daytime Busy photos hold it back.

### 8+ criteria summary

| Met | Missed |
|---|---|
| C1, C2, C3, C4, C5, C6, K2, K3, K4, K5, L1, L3, L4, L5 | **K1, L2** |

## 4. Rule breaks, counted

Owner exceptions not counted: "+150 rep" after check-in; the level line on Me; "Tap anywhere to
stop" and the route preview's auto-start (9.9); the drive view's End; the crop screen's ✕; "It's up"
with no back (11); the tab bar with Community lit on a profile and chat (12); the Layers sheet's
SegmentedControl per section; the Time clash confirm (13); "You're going (demo)" and Coming up first
(13); Me's avatar as a close crop of your own car, and your own car's photo repeating (14, 15).

**On screens met in the tasks: 1 rulebook break.**

| # | Rule | Screen | Break | Shot |
|---|---|---|---|---|
| 1 | 4.1 | Route preview (task 4) | A large header title in content case ("Leisure park car park", 24 px). Pushed detail screens have no header title; forms and settings have a caps title; the compact title (4.1 note) is only for a hero title that has scrolled away, and this screen has none. | a12-nav |

**Look-checklist exceptions on task screens: 3** ("nothing clipped", and owner decision 14: "no
clipped label or shield shows as a sliver" at any small map card edge).

| # | Screen | What | Shot |
|---|---|---|---|
| 1 | Event page small map (tasks 2–5, 10) | Town labels cut by the card's left edge, bright and readable: "HFIELD" (Car park meet-up), "twood" (Sunday coffee and cars). The fade is too narrow to hide them. | a12-event, b12-coffee |
| 2 | Host step 2 small map (task 9) | A white road-shield sliver ("8") cut at the top-left corner, before a point is placed. | b12-step2 |
| 3 | Onboarding step 2 map (task 1) | "ntwood" and "ldridge" cut at the left edge, "LICHFIELD" against the top. | a12-step2 |

**Borderline, not counted:**
* The Going list's caps title on a pushed list screen (4.1 names only detail screens and forms; as R20).
* The trophy card has five type sizes (34, 21, 13, 12, 11 px); it's a poster made to be shared, not
  a content card.
* The Add a mod sheet has both Done and its primary "Add Cold air intake" (4.5 allows either).
* "Under the crosshair" on the meet point picker: faint map labels show through its backing.
* Tonight's map: the live meet's pin sits on "Tamworth" (pins on basemap labels, a carried gap).

**Outside the tasks (exploration, not scored):**
* **Words:** the Layers sheet's first switch is "Events · Meets, cruises and rolling meets…"
  (owner decision 14: meet, not event) (e-layers).
* **4.9:** Busy night, People near you: every row says a bare "About 8 mi" (no origin, and the same
  for everyone) (f-busypeople).
* **K5:** Feed, @mo.rs3 "Audi RS3 8V · 395 bhp" and the post "Back from the rolling road: 470 at the
  hubs after the map." Two power numbers for one build, and 470 at the hubs from a 395 bhp car reads
  as wrong to anyone who knows dynos (f-feed4).

**Total on task screens: 1 rulebook + 3 look.**

## 5. Problems, ranked

| # | Severity | Screen | Steps | What's wrong | Shot |
|---|---|---|---|---|---|
| 1 | Medium | Small map cards: event page, Host step 2, onboarding | Open any meet; host; onboard | Labels and shields still cut at the card edges ("HFIELD", "twood", a white "8" shield, "ntwood", "ldridge"). Owner decision 14's fade isn't wide or strong enough. Takes Look from 8 to 7. | a12-event, b12-step2, a12-step2 |
| 2 | Medium | Route preview | Navigate | A big content-case header title (4.1); the only rulebook break left on a task screen. Takes Coherence from 8 to 7. | a12-nav |
| 3 | Medium | Tonight cards | Open Tonight | The "● MEET" type label is grey on the yellow Peugeot's bonnet: barely legible at 1.0x, worse at 1.3x where the photo is shorter. Same risk on every light photo. | a12-tonight, d12-06tonight, d12-29back |
| 4 | Medium | Vote and trophy | Vote, Done | The demo's result always crowns the build you voted for ("6 votes"), straight away. It reads as rigged, and it's what stops Clarity 10. The vote toast also covers the "✓ Your vote" card it confirms. | a12-voted, a12-addphoto |
| 5 | Medium | Tonight map | Tap Show where I am | The map moves to the phone's area but draws no "you" marker, and leaves every meet off screen with a pin cut by the top edge. Going back to Tonight later (Busy night) keeps that empty view. | e-whereami, e-busy-tonight |
| 6 | Low | Toasts, cross-app | Vote; add a mod | A toast lands on the change it confirms: the voted card's border and tick; the new "Cold air intake +4 bhp" row (at 1.3x its text peeks out from under the toast). | a12-voted, d12-20modded |
| 7 | Low | Tonight count line | First open | "2 meets tonight · 4 later · Show": Show what? (Owner decision 10's "hidden by your filters" wording has changed to "later" and the button no longer says what it does.) | a12-tonight |
| 8 | Low | Host, Starts sheet | Starts, Change | Morning hours drawn dim next to "Evening hours are lit", so 10 looks unavailable for a moment. | b12-starts, b12-sun |
| 9 | Low | Wording outside the tasks | Layers, People near you, cancelled meet, Me | "Events" in Layers; "About 8 mi" with no origin; your own cancelled meet says "The host cancelled this meet." above "Hosted by you", and still offers "Say hello." and Share; Me's "Coming up" holds a meet that's live now. | e-layers, f-busypeople, f-cancelled, b12-me |
| 10 | Low | Community art and words | Feed | @mo.rs3's "470 at the hubs" against 395 bhp (K5); @dan_r's "parked up at the old airfield car park" over an office-block car park under autumn trees; the R1 post has a large blur box over the riders and background. | f-feed4, e-community, f-feed2 |
| 11 | Low | 1.3x wraps | Trophy card, chat header, Host step 3, event going row | Lines that wrap leave a dangling "·" at a line end, or an orphan "mi" / "bikes" ("10 going · 7 cars, 3" / "bikes" even at 1.0x). | d12 sheets, a12-event |
| 12 | Low | Map pins on labels | Tonight, event map, Busy | Pins and clusters sit on town names (Tamworth, LICHFIELD, WOLVERHAMPTON). | a12-tonight, e-busy-tonight2 |
| 13 | Low | Busy night map at 393x852 | Busy on, Tonight | "Rolling meet: north" pin sits under the lowered sheet's top edge, out of sight. | e-busy-tonight2 |
| 14 | Low | Sign-in | Try the demo | The 18+ box is clearer now, but a first-timer still goes for the big button first and gets the error. | a12-demo1 |
| 15 | Low | Busy night photos | Busy List | Midnight cruise (GR Yaris) and Rolling meet: north (BMW 1 Series) are daytime car-park shots; the builds' own photos are daytime. | e-busy-list-s2, e-busy-list-s3 |

## 6. Busy night (Settings › Demo › Busy night; not scored)

393x852, 20:30. No crash, no console error.

* **Badges:** Community 6 = "3 people want to connect" on People plus three unread chats. Matches.
* **Map (default framing after a reload):** "7 meets tonight · 17 later, 4 not for your car · Show"
  (says why the rest are hidden). Regional zoom; the "5" cluster sits on LICHFIELD and a pin on
  WOLVERHAMPTON; Shropshire's "Midnight cruise" pin is whole at the left edge; "Rolling meet: north"
  is under the sheet's top edge (problem 13). After Show where I am (problem 5) the map stays on an
  empty area with a pin cut by the top edge until you reload.
* **List:** a photo on every card, title on the photo, I'm going on each. Hot hatch takeover (black
  306) and Late rolling meet (white M3) are night shots now; Midnight cruise and Rolling meet: north
  are still daytime; Late rolling meet: east side is a covered car at dusk. "Coming up" (Sunday coffee
  and cars, You're going (demo)) above "Live now" and "Tonight", as decided.
* **Community:** Feed leads with @fk2_frankie's "Fresh from a wash, ready for tonight."; Chats lists
  three new group and one-to-one chats; People near you (after Show me) is a long list of car-photo
  rows, every one "About 8 mi" (section 4).

## 7. Compared with Review 20

Review 20: **Clarity 7, Coherence 7, Look 5**; 9/10 in the first walk-through (10/10 scripted);
4 rulebook breaks and 6 look exceptions on task screens.
Review 21: **Clarity 9, Coherence 7, Look 7**; 10/10 at both times and both sizes; 1 rulebook break and
3 look exceptions on task screens. No console errors in either.

**Fixed since Review 20 (checked):** the event Photos grid (whole photos, cover-fit, the meet's own
night shots); the clash warning, which also names the seeded Sunday meet before task 10 asks for it;
"Coming up" at the top of the sheet and List; every distance "from home" with "Demo home: Tamworth"
said in onboarding; the route preview's back arrow, "(Demo · Fri)" and "a sample route from home";
the "Location shown" chip clear of the toast; "Checked in" in the ActionBar; the cancelled meet said
once; "Meet options", "Meet reminders", "Share this meet"; the 6 x 4 hour grid with no "Show earlier
hours"; "It's up" with your car's photo; one icon per "+" job; an empty meet point name with an
example; the vote card's selected border and the vote count. 31 of Review 20's 40 gaps are fixed
(section 8).

**New or worse:**
* **Route preview title (break 1):** there before; counted now that the back arrow is fixed and the
  title is the only thing off-rule on the screen.
* **Vote result always your pick (problem 4):** there before (R20 problem 12), now the one thing
  between Clarity 9 and 10.
* **Small map edges (problem 1):** the sliver Review 20 saw at the onboarding map's top right is gone,
  but the edge fade still lets cut labels and one shield through on three cards.
* **"MEET" label legibility, toasts over the change, "Show where I am" with no marker (problems 3, 5,
  6):** first noticed here.

**Net:** Clarity up two (C2 and C5 now met: the clash warning removes task 10's trap, the cancelled
meet says it once). Coherence the same score with three fewer breaks (one left). Look up two: the
photo-grid regression is fixed and the moments no longer overlap.

## 8. Review 20's path to 10, item by item

| # | Review 20 gap | Status | Now |
|---|---|---|---|
| 1 | 18+ box grey on dark; first tap errors | Partly | Bordered box, body-colour label; my first tap still errored. |
| 2 | Sign-in hero dark and soft | Fixed | A sharp night shot of a modified 350Z, wheel and tail lights filling the frame. |
| 3 | "Around Tamworth" for a phone elsewhere | Fixed | "Demo home: Tamworth · The demo's sample meets are round here." |
| 4 | Onboarding map sliver, label at the top edge | Partly | No shield sliver; "ntwood", "ldridge" cut at the left, LICHFIELD against the top. |
| 5 | Mk7 ST180 row shows a Mk8 | Fixed | The stand-in is a blue Mk7 ST. |
| 6 | Tonight distances without "from home" | Fixed | "about 2 mi from home". |
| 7 | "4 hidden by your filters" with none set | Fixed | "2 meets tonight · 4 later". (New: "Show" is unclear, problem 7.) |
| 8 | The Sunday meet you're going to hidden | Fixed | Under "Coming up" at the top of the sheet and List, "You're going (demo)". |
| 9 | Pins on town labels | Not fixed | Tamworth under the live pin; LICHFIELD under the Busy cluster. |
| 10 | 1.3x map a 150 px strip | Fixed | Same map height at 1.3x. |
| 11 | Busy pins cut by the map's edge | Partly | None cut by the edge at 393x852; "Rolling meet: north" hides under the sheet's top. |
| 12 | Photos grid blown-up corners | Fixed | Whole photos, cover-fit, at 1.0x and 1.3x. |
| 13 | Meet Photos are the builds' photos | Fixed | The meet's own night shots (Alpine, a red coupé's rear, headlights). |
| 14 | "Location shown" behind the toast | Fixed | At the top of the map, over the pin, clear of the toast. |
| 15 | "+150 rep" card overlaps as it fades | Fixed | Not seen; it folds away (EXIT-OVERLAP passes). |
| 16 | Nothing says "Checked in" | Fixed | "Checked in" in the ActionBar status line. |
| 17 | Cancelled meet said three times | Fixed | "The host cancelled this meet." once, "Was 1 going · 1 car", grey pin, no HOSTING. |
| 18 | "Hosts cancelled the event" | Fixed | Gone. (On your own meet it says "The host cancelled", problem 9.) |
| 19 | Ace Cafe photo on a Tamworth meet | Fixed | Sunday coffee's hero is a row of French hatches in a car park, no sign. |
| 20 | Route preview has no back | Fixed | Root back at top left; Start the only button. |
| 21 | Countdown fill looks disabled | Fixed | Full sodium button, progress line above "Tap anywhere to stop". |
| 22 | "Arrive" with no demo clock | Fixed | "Arrive 21:16 (Demo · Fri)". |
| 23 | 1.3x hazard marker cut at the top | Fixed | Whole at 1.3x (d12-09nav). |
| 24 | Route starts from the demo home unsaid | Fixed | "Demo: a sample route from home, with real lane markings." |
| 25 | No selected state on the voted card | Fixed | Orange border and "✓ Your vote" (the toast covers it, problem 6). |
| 26 | Result reads as "my vote decided it" | Fixed | "· 6 votes" added, as asked; but your pick still always wins (problem 4). |
| 27 | People and Chats not checked | Fixed | Car-photo avatar rows, no half-empty screen. |
| 28 | Me distances without "from home" | Fixed | "2 mi from home". |
| 29 | Me avatar = car card photo | Fixed | A close crop of your car (owner decision 14). |
| 30 | "+" does two jobs | Fixed | Calendar-plus hosts, speech-bubble-plus posts, car-plus adds a build. |
| 31 | No clash warning | Fixed | "Time clash" ConfirmSheet with Change time first. |
| 32 | Uneven hour grid | Fixed | 6 x 4, clock order, evening lit. (Morning looks dim, problem 8.) |
| 33 | Step 2 zoomed out; sliver; pin on label | Partly | Opens on home's area; a white "8" shield sliver at the top-left corner. |
| 34 | "It's up" placeholder art | Fixed | Your Fiesta's photo with HOSTING. |
| 35 | "It's up" distance; 1.3x meta line | Fixed | "2 mi from home"; visible at 1.3x. |
| 36 | "Tamworth meet point" default | Fixed | Empty, "Needed. What people know it by, e.g. the car park or venue." |
| 37 | "Event" wording | Partly | Meet options, Meet reminders, Share this meet; Layers still says "Events". |
| 38 | Post photos contradict words | Partly | The i30 N post is a real i30 N now; @dan_r's "old airfield" sits over an office car park; @mo.rs3's "470 at the hubs"; the R1 post is a blurred street shot. |
| 39 | Daytime builds, posts, Busy meets | Partly | Hot hatch takeover and Late rolling meet are night; Midnight cruise, Rolling meet: north and the builds are day. |
| 40 | Busy MX-5 owner with a bike avatar | Not checked | No MX-5 owner in the rows I opened. |

**Fixed 31, partly 7, not fixed 1, not checked 1.**

## 9. Path to 10

Every gap I found between the app as tested and the top anchor of each score. **K** = clarity,
**C** = coherence, **L** = look. Effort: **S** small (copy, a style, one prop), **M** medium (one
screen or flow), **L** large (data, art or a cross-app pattern). Items carried over from Review 20
keep its number in brackets.

What a 10 needs overall:
* **Clarity 10:** C1–C6 are all true now. The last line is a tester explaining voting back; the
  demo result has to look like everyone's votes, not a reflection of yours.
* **Coherence 10:** K1 (the route preview title) and a tester predicting a control twice. Small
  inconsistencies trip prediction: Done beside a primary in a sheet, "Show" with no object.
* **Look 10:** L2 (map card edges), then a tester posting three screens unprompted: the Tonight card
  label legible on any photo, night photos for night meets, no toast over the moment it confirms.

### Sign-in

| # | | What's wrong | What a 10 looks like | Effort |
|---|---|---|---|---|
| 1 | K | First tap on Try the demo still errors on the 18+ tick (R20 1). | The tick is part of Try the demo's own tap ("I'm 18+ · Try the demo") with the Terms link beside it, or the error and the tick shown together without a failed tap. | S |

### Onboarding

| # | | What's wrong | What a 10 looks like | Effort |
|---|---|---|---|---|
| 2 | L | Cut labels at the map card's left and top edges (R20 4). | A wider, stronger edge fade (or labels hidden near the edge) on every small map card. | S |

### Tonight

| # | | What's wrong | What a 10 looks like | Effort |
|---|---|---|---|---|
| 3 | L | "● MEET" label unreadable on bright photos. | A scrim under the type label as well as the title, or the label on a dark chip. | S |
| 4 | K | "2 meets tonight · 4 later · Show": show what? | "Show 4 later" (and "Hide later" after), so the button names its object. | S |
| 5 | L | Pins on town labels (R20 9). | Labels that dodge pins, or a quieter label layer at this zoom. | M |
| 6 | K | Show where I am draws no "you" marker and strands the map away from every meet. | A you-marker (and accuracy ring); fit both you and the nearest meets; Tonight reopens on the meets. | S |
| 7 | L | Busy: "Rolling meet: north" under the lowered sheet at 393x852 (R20 11). | Fit bounds with bottom padding equal to the lowered sheet. | S |

### Event page

| # | | What's wrong | What a 10 looks like | Effort |
|---|---|---|---|---|
| 8 | L | Small map card shows cut town labels at its left edge. | Same fix as 2. | S |
| 9 | K | Your own cancelled meet says "The host cancelled this meet." above "Hosted by you", and still offers "Say hello." and Share. | "You cancelled this meet." for the host; no chat prompt or Share on a cancelled meet. | S |
| 10 | L | "10 going · 7 cars, 3" / "bikes" wraps at 1.0x. | Keep the count on one line (smaller avatar stack) or break at the dot. | S |

### Route preview

| # | | What's wrong | What a 10 looks like | Effort |
|---|---|---|---|---|
| 11 | C | Header title in content case (4.1, break 1). | No header title (the place name in the summary under the map, "6 min · 2.9 mi drive to Leisure park car park"), or write the preview into 4.1 as a named exception. | S |

### Vote and trophy

| # | | What's wrong | What a 10 looks like | Effort |
|---|---|---|---|---|
| 12 | K | The demo result always crowns your pick (R20 26). | A fixed demo winner with a vote split ("Focus RS 3 · M4 2 · yours 1"), so your vote is one of many. | S |
| 13 | L | Trophy card wraps leave a dangling "·" at 1.3x; five type sizes. | Wrap at separators (drop the trailing dot), three sizes. | S |

### Going list, profile and chat

| # | | What's wrong | What a 10 looks like | Effort |
|---|---|---|---|---|
| 14 | L | Chat header meta wraps as "BMW M4 Competition ·" / "583 bhp" at 1.3x. | One shared meta-line component that never ends a line on "·". | S |

### Garage and Me

| # | | What's wrong | What a 10 looks like | Effort |
|---|---|---|---|---|
| 15 | K | Me's "Coming up" holds a meet that's live now. | "Now and coming up", or a "Live now" row above it as on Tonight. | S |

### Host a meet

| # | | What's wrong | What a 10 looks like | Effort |
|---|---|---|---|---|
| 16 | L | Step 2 map: white "8" shield sliver at the top-left corner (R20 33). | Same fix as 2. | S |
| 17 | K | Morning hours drawn dim; 10 looks unavailable. | All hours full strength; the evening ones marked (a dot or tint), not the rest dimmed. | S |
| 18 | L | "Under the crosshair" card lets map labels show through. | An opaque backing. | S |

### Settings and wording

| # | | What's wrong | What a 10 looks like | Effort |
|---|---|---|---|---|
| 19 | C | Layers sheet: "Events" (R20 37). | "Meets" ("Meets, cruises and rolling meets"); the glossary scan covers sheets. | S |
| 20 | C | People near you: a bare "About 8 mi", the same for everyone (4.9). | "8 mi from you", from each person's own rough place. | S |

### Community and demo art

| # | | What's wrong | What a 10 looks like | Effort |
|---|---|---|---|---|
| 21 | C | @mo.rs3's post "470 at the hubs" against 395 bhp (K5). | Post copy without a second power number, or one that agrees with the build. | S |
| 22 | L | @dan_r's "old airfield car park" over an office car park (R20 38). | Caption that matches ("parked up outside work") or a matching photo. | S |
| 23 | L | R1 post: a large blur box over the riders and background. | A photo that needs no blur. | M |
| 24 | L | Daytime photos for Midnight cruise, Rolling meet: north and the builds (R20 39). | Night or dusk photos for night meets and heroes. | L |
| 25 | L | Busy: the MX-5 owner's avatar not checked (R20 40). | Avatar from the person's own main build. | S |

### Cross-app

| # | | What's wrong | What a 10 looks like | Effort |
|---|---|---|---|---|
| 26 | L | Toasts land on the change they confirm (voted card, new mod row). | The toast sits above the ActionBar or tab bar, and the changed item scrolls clear of it first. | M |

**Count: 26 gaps: 22 S, 3 M, 1 L.**

### Suggested new automated checks

* **EDGE-LABEL (2, 8, 16):** on every small map card, sample a 10 px band inside each edge; fail if
  label-bright pixels (near-white text or shields) reach the edge at more than 30% opacity. EDGE
  today looks for slivers in the top 4 px; cut words further in still pass.
* **HEADER-TITLE (11):** on every pushed screen, a header title must be either a caps form title or
  the compact copy of a hero title that has scrolled away.
* **ON-PHOTO-CONTRAST (3):** for text drawn over a photo (type label, title), sample the photo behind
  its box and require 4.5:1 contrast.
* **TOAST-OVER-CHANGE (26):** after vote and add-a-mod, the element that changed (selected card, new
  row) must not intersect the toast.
* **DOT-WRAP (10, 13, 14):** no rendered line ends with "·" and no line holds a lone unit ("mi",
  "bhp", "bikes"), at 1.0x and 1.3x.
* **VOTE-RESULT (12):** in the demo, the trophy winner after your vote must not always be your pick,
  or the card shows a split with yours as one of several.
* **WORDS on sheets (19):** run the "event" scan on every sheet the script opens, Layers included.
* **DIST-ORIGIN everywhere (20):** extend HOME-DIST to People near you and every list that shows a
  distance.
* **POWER-ONE in posts (21):** fail when a post's text has a power figure ("at the hubs", "whp",
  "bhp") that differs from its build's.
* **YOU-MARKER (6):** after Show where I am, a you-marker is drawn inside the map.
* **SHEET-PIN (7):** a meet pin that intersects the lowered sheet counts as cut (MAP-393).

Not automatable: whether photos match their captions (22, 23), night mood (24), whether the vote
result reads as everyone's votes (12), and whether a tester predicts a control.

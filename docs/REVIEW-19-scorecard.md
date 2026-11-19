# Review 19: fixed scorecard and path to 10

Scored against `REDESIGN-2.md` section 7 (fixed scorecard) and section 8 (8+ criteria), read before
testing. Section 4 (rulebook, with its owner exceptions) and section 9 (owner decisions) were read
only after the scored runs, to count breaks. Review 18 was read last, for the comparison only.

**Set-up:** `e060c95` on main. `npx expo export --platform web --clear` into `~/nightshift-wt/r19-web`,
served with SPA fallback (the scorecard's own `serve()`), killed by PID afterwards. My own headless
Chromium driven from Node Playwright, one step at a time: 375x667, touch and mobile emulation, @2x,
Europe/London, en-GB, demo mode, Busy night off, **location granted** at a point north of Tamworth
(onboarding read it as "Around Tamworth"; the live meet showed as "about 2 mi"). Four scored runs from
cleared storage: browser clock 12:30 and 20:30 on Thu 19 Nov, each at 1.0x and 1.3x text (the
scorecard's own scaler). Then free exploration at 393x852, then one pass with Busy night on (not
scored). Compressed screenshots in `~/nightshift-wt/r19-shots`:

* `A1230-…`: the first, unscripted walk-through at 12:30, 1.0x. Hesitations and human times come
  from it.
* `B2030-…`, `C1230x13-…`, `D2030x13-…`: the other three scored runs, named by task (`t3-going`…).
  `sheet13-1..4.jpg` are contact sheets of the 1.3x run.
* `E393-…`: exploration and Busy night. `F-…`: follow-up checks.

**Limits:** human times are my estimate from the walk-through (about 1.5 s a tap plus reading). The
script's wall time isn't given: I drove the runs step by step, so wall time includes my own
thinking. Headless Chromium has no `navigator.share`, so the web "Share this meet" sheet counts as
the share sheet. The photo picker is the web file chooser.

## 1. Task table

All four runs gave the same outcomes and the same visible text at each step, apart from the random
handle and the clock-independent elapsed time in chat stamps (21:13 vs 21:10). The demo night (Fri
20 Nov, about 21:10) makes 12:30 and 20:30 identical. **No console errors, no on-screen error, no
crash** in any run.

### 12:30 and 20:30, 1.0x text (identical)

| # | Result | Human | Taps | Notes (shots) |
|---|---|---|---|---|
| 1 | Pass | 30 s | 7 + typing | Tapped Try the demo before the 18+ tick: "Tick the box to say you're 18 or over first." (A1230-02). "fiesta st" gives five versions; which is mine? (about 4 s, A1230-04). Mk8 shows as a photo row, Next, "Where's home? Around Tamworth", handle filled, Show me tonight (A1230-05/06/07). Garage has the Fiesta (A1230-29). |
| 2 | Pass | 4 s | 1 | The live "Car park meet-up" card leads the map sheet; tap, event page (A1230-08). |
| 3 | Pass | 3 s | 1 | I'm going: the page scrolls to "Leisure park car park, Tamworth.", the pin drops in, toast "You're going" above the ActionBar, "Going with your Fiesta ST Mk8" (A1230-09). No sheet over it any more. |
| 4 | Pass | 12 s | 2 | Navigate: route preview "6 min 2.9 mi drive · Arrive 21:16", **Starting in 5**. While I read the demo note it started turn-by-turn (owner exception 9.9, A1230-10/11). End brought me back to the event (A1230-12). The destination marker is hidden under the "© OSM, OSRM" chip (A1230-10). |
| 5 | Pass | 3 s | 1 | Check in: tick card "+150 rep · For turning up.", toast "Checked in"; Vote becomes the primary, Add a photo the secondary (A1230-13). |
| 6 | Pass | 25 s | 6 + file | Vote, "Vote: Best car", BMW M4, "✓ Your vote", toast "Voted for BMW M4 Competition", Done (A1230-14/15). Add a photo, file, "Crop the photo", Use this crop, toast "Photo posted", my photo first in Photos (A1230-18/19). The page shows "You voted · Best car · 1 of 3 voted · Best bike next" and keeps Vote as the primary: no trophy moment. |
| 7 | Pass | 30 s | 6 + typing | "10 going · 7 cars, 3 bikes" row, @dan_r, Connect, toast "Request sent" with "Demo: @dan_r will accept in a few seconds" (fixes R18 #7), CONNECTED, Message, type, Send, toast "Sent" (A1230-20 to 27). |
| 8 | Pass | 12 s | 7 | Three backs from chat to the tab bar, Garage, Add a mod, Cold air intake, "Add cold air intake". Toast "Added. Now 201 bhp, Class B"; card "201 bhp · 1 mod" with the B badge (A1230-29 to 32). |
| 9 | Pass | 65 s | 13 + typing | "+" on Tonight (Garage's "+" would have added a car), name, Starts Change, Sun 22, 10 (ends Sun 13:00), Done, Next, tap the map, Set meet point here, Next, "Who can come: Everyone", Next, Check and post, Post meet, toast "Invites sent to 18 people nearby", Share, "Share this meet" sheet (A1230-35 to 44). |
| 10 | Pass | 35 s | 8 | **Hesitation about 8 s.** I had named my meet "Sunday coffee and cars", the host form's own example (A1230-35). Me now lists two "Sunday coffee and cars", both "Meet · Sun 10:00", one HOSTING and one GOING (A1230-50). I first opened mine, saw "Cancel" in its `···`, backed out, then opened the GOING one: ActionBar "Going" + **Can't make it**, ConfirmSheet "Yes, I can't go / I'm still going", toast "You're not going to Sunday coffee and cars · UNDO" (two lines). Back, Me, gear: "Show me in People near you" under Privacy (A1230-51 to 54). |

**12:30: 10/10. 20:30: 10/10.**

### 12:30 and 20:30, 1.3x text

| # | 12:30 | 20:30 | Notes |
|---|---|---|---|
| 1–10 | 10/10 | 10/10 | Same outcomes. No cut text on a task screen. The drive title wraps to two lines; Me's rows wrap to three; the post-success map shrinks to a thin strip (sheet13-4). The route's end is still under the credit chip (sheet13-1). Step 2 of onboarding and of hosting push their last helper line under the ActionBar (it scrolls; nothing is lost). |

## 2. Time to understand

| Measure | Result | Target | Pass? |
|---|---|---|---|
| TTU-1 | About 3 s. "What's on tonight near you. Go with your car." over a photo, then "See tonight's meets near you / Say you're going, with your car / Check in and vote for the best build". | ≤ 5 s | Pass |
| TTU-2 | About 40 s from Try the demo to the first I'm going (18+ tick, Fiesta choice, step 2, the live card, I'm going on the event page). | ≤ 60 s | Pass |

**Hesitations over 5 s:**
1. Task 10: two meets with the same name and time in Me, because the host form suggested that name.
   About 8 s. *Wording (the example name) and demo data.*
2. Task 4: the countdown started navigation while I read "Demo: a sample route…". About 5 s to
   find End. *Owner exception 9.9; noted, not counted.*

**Under 5 s:** the 18+ tick; five Fiesta ST versions; "2 meets tonight · 4 hidden" (hidden how?);
"Use my location instead" when it already used my location; three backs from chat to the tab bar;
the "+" meaning a different thing on each tab; "Cancel" in Event options (cancel the menu or the
meet?).

## 3. Scores

Method as Reviews 11–18: the highest anchor whose every line is true; a score between anchors means
all of the lower anchor and most (3 of 5, or 4 of 6) of the higher one's lines.

### Clarity: **7**

| Criterion | Result | Evidence |
|---|---|---|
| C1 TTU-1 ≤ 5 s | **Met** | About 3 s. |
| C2 10/10 at both times | **Met** | 10/10 at 12:30 and 20:30, at 1.0x and 1.3x. |
| C3 inside limits; TTU-2 ≤ 60 s | **Met** | Closest: task 9 (65 of 120 s), task 10 (35 of 45 s), task 7 (30 of 60 s). TTU-2 about 40 s. |
| C4 no 4.12 word | **Met** | Only "+150 rep", "Level 2 · Regular" and "Tap anywhere to stop", all owner exceptions. |
| C5 each fact said once | **Missed** | The event page is clean now (no LIVE badge, no GOING badge). But other task screens repeat a fact: the route preview says "2.9 mi" in its title and "2.9 mi drive" under the map (A1230-10); Settings says "New meets within 25 mi" and then "How far: 25 mi" just below (A1230-54); Me's stats say "2 Meets" above a list of three upcoming and one past meet (A1230-50), so the same fact is given two ways and they disagree. |
| C6 no dead ends; errors say what to do | **Met** | No disabled primary seen. Errors say what to do: "Tick the box…", "Write a message first.", "Discard this meet? / Test isn't posted yet." on back from the host form. |

Anchor 6 is fully true (purpose clear in 10 s, 10/10, one wording hesitation over 5 s). Anchor 8 has
5 of 6 lines. **7.** Not 8: C5. Not 10: no screen tells me what voting leads to (I never saw a
trophy), so I couldn't explain voting back.

### Coherence: **7**

Rulebook exceptions on the screens met in the tasks: **2** (section 4 below): anchor 6.

* **K1** zero exceptions: **missed** (2).
* **K2** one selector per job: **met.** One SegmentedControl per screen (Map/List, Car/Bike,
  Engine/Chassis/Wheels/Looks, Feed/People/Chats, All/Meets/Places/People); ChoiceGroup pills for
  meet type and How far; DateTimeSheet for the start; SearchField for make and model.
* **K3** one look per kind of thing: **missed.** An event on Tonight has two looks on the same tab:
  the map sheet's card has its title over the photo and an I'm going button (A1230-07); the List
  card has the title under the photo and no button (E393-06). The same meet's map pin is the
  four-dot meet glyph on Tonight and on the event map before going, then a ring/tyre glyph on the
  event map after going (A1230-09 vs A1230-17).
* **K4** every screen is a template: **met** as far as I can see.
* **K5** one power number: **met.** 197 bhp, then 201 bhp, everywhere.

All of anchor 6 and 3 of 5 lines of anchor 8: **7.** The crop screen's ✕ is read as 4.5's Cancel
on a step that loses work (as Reviews 17 and 18 did), so it isn't counted as a second back style.

### Look: **6**

* **L1** a photo or real map above the fold on every first-level screen at 375x667: **met.** Tonight
  map and list, Community feed, Garage, Me, every event page.
* **L2** the look checklist on every screen: **missed.** Overlap: the route preview's destination
  marker sits under the "© OSM, OSRM" chip at 1.0x and 1.3x (A1230-10, sheet13-1); on Host step 2,
  "Tap to place the meet point" is printed over the map's town labels (WOLVERHAMPTON, LICHFIELD,
  A1230-38). My own photo is letterboxed with grey bands in a grid of full-bleed tiles (A1230-19). A
  white sliver still shows at the top edge of the small maps (A1230-06 top right, A1230-53).
* **L3** a real dark map on web: **met.** Stadia dark tiles, clusters, pulse, area circles.
* **L4** the four motion moments: **missed.** Going and location shows (the scroll and pin drop) and
  check-in (the tick card) are seen. The **trophy** moment is not: after voting Best car the page
  says "1 of 3 voted · Best bike next" and nothing else; no results cover appears in the tasks.
* **L5** three screens I'd share: **met, just**: the vote sheet (A1230-14), the Garage card
  (A1230-29), the event hero (A1230-08). Each is a daytime photo with a black or white box over the
  plate, which I'd crop before posting.

Anchor 6 ("consistent and tidy") holds as a whole, but anchor 4's line ("visible overlap on
375x667 or at 1.3x") is also true here (the route end under the credit chip), which Review 18
didn't have. With L2 and L4 missed and an overlap on a task screen I don't give "most of 8".
**6.** Not 10: nothing I'd post without editing.

### 8+ criteria summary

| Met | Missed |
|---|---|
| C1, C2, C3, C4, C6, K2, K4, K5, L1, L3, L5 | **C5, K1, K3, L2, L4** |

## 4. Rule breaks, counted

Owner exceptions not counted: "+150 rep" after check-in; the level line on Me; "Tap anywhere to
stop" and the route preview's auto-start (9.9); the drive view's End as its back; the Layers sheet's
SegmentedControls; Shops and Speed cameras layers.

**On screens met in the tasks: 2.**

| # | Rule | Screen | Break | Shot |
|---|---|---|---|---|
| 1 | 4.5 | Event options sheet (`···`) on a meet you host (task 10) | The last item is just **Cancel**, in red, under a Done header. 4.5: "Cancel only on forms that lose work"; in a sheet "Cancel" reads as "close this". It means "cancel the meet"; it should say so ("Cancel the meet"). | A1230-46 |
| 2 | 4.7 | Sunday coffee and cars, after Yes, I can't go (task 10) | Toasts are **one line**. "You're not going to Sunday coffee and cars" + UNDO wraps to two lines at 375 wide (and the tick is the green "done" tick on a leave). | A1230-53 |

**Look-checklist exceptions on task screens: 4** (L2 above): route end under the credit chip;
overlay text over map labels on Host step 2; letterboxed own photo; white sliver on small maps.

**Outside the tasks (exploration):**
* 4.11: on a meet not open to your car (Busy night, JDM night) the location row's pin icon carries
  "Open to cars only. Ask a host to let you in.": eligibility in the location line (E393-21).
* 4.8: Busy night shows Community **8** at once (5 requests + 3 unread chats); the rule's "demo starts
  with zero badges" is about the normal demo, so noted only.

**Borderline, not counted:**
* The crop screen's ✕ at top left (4.5 Cancel on a step that loses work; same reading as R17/R18).
* The "DEMO NIGHT" chip in Tonight's header (4.1 doesn't forbid it; it's how the demo explains itself).
* The Going list's caps title on a pushed list screen (4.1 names only detail screens and forms).
* The chat's "Sent" toast under a bubble that already shows the message (4.7 asks for it).

**Total on task screens: 2 rulebook + 4 look.**

## 5. Problems, ranked

| # | Severity | Screen | Steps | What's wrong | Shot |
|---|---|---|---|---|---|
| 1 | Medium | Host step 1, Me | Host a meet, take the example name | The Name placeholder is "e.g. Sunday coffee and cars", the name of the seeded meet you're going to. Many testers will copy it; Me then lists two "Sunday coffee and cars · Sun 10:00", and task 10's "the Sunday coffee meet" is ambiguous. Caused the only wording hesitation over 5 s. | A1230-35, A1230-50 |
| 2 | Medium | Event page after voting | Vote Best car, Done | No trophy moment in the tasks (L4). "1 of 3 voted · Best bike next" and Vote stays the primary, so the loop feels unfinished and I couldn't say what voting leads to (Clarity 10). Review 18 had "Results are in." here. | A1230-19 |
| 3 | Medium | Route preview | Event, Navigate | The destination marker is under the "© OSM, OSRM" chip (1.0x and 1.3x); two credit chips on one map; HEAD/sound/`···` buttons sit on the route line. You can't see where you're going. | A1230-10, sheet13-1 |
| 4 | Medium | Demo clock everywhere | Any run at 12:30 | The demo is Friday about 21:10 whatever the phone says. At 12:30 you see "Live · until 23:00", "Arrive 21:16", a chat stamp 21:13 under "TODAY", and the Starts sheet's "Today Fri 20". Only the drive view ("Demo night: Friday's clock · 4× speed") and the Starts sheet say so; the Demo night sheet on Tonight says "always runs on a Friday night" but not "the clock is set to 21:10". | A1230-10, A1230-27, A1230-36 |
| 5 | Medium | Tonight | First open | "2 meets tonight · 4 hidden": hidden by what? Show all removes the line and gives no way back or explanation; one more pin appears. | A1230-07, E393-05 |
| 6 | Low | Event options sheet | Your meet, `···` | "Cancel" (break 1). | A1230-46 |
| 7 | Low | Toast after leaving | Can't make it, Yes | Two-line toast with a green tick (break 2). | A1230-53 |
| 8 | Low | Tonight | Map vs List | Two event card looks on one tab (K3); and the meet pin glyph changes after going (K3). | A1230-07, E393-06, A1230-09 |
| 9 | Low | Me | After task 9 | Stats "2 Meets" above three upcoming and one past meet; distances "2 mi" on one row and "about 1 mi" on the next. | A1230-50 |
| 10 | Low | Photos | Everywhere | Plates covered by solid black or white boxes (Hyundai, M4, Yaris, Golf), daytime photos for a night app, the same green M4 shot on the profile hero, profile post, vote sheet, Community feed and a Tonight card, and an upscaled, soft crop in the feed. | A1230-21, E393-07 |
| 11 | Low | Host step 2 | Next from step 1 | The map opens zoomed out on the whole Midlands and "Tap to place the meet point" is printed over town labels. | A1230-38 |
| 12 | Low | Distances | Tonight card, route, Me | "about 2 mi" (card), "2.9 mi" (route), "2 mi" (after going). Each follows 4.9, but the route number doesn't match the card. | A1230-07/10/28 |
| 13 | Low | Tab headers | Tonight, Garage, Community | "+" hosts a meet, adds a car, or posts, depending on the tab (allowed by 4.1, but I tapped Garage's "+" thinking of hosting in my head first). | A1230-29 |
| 14 | Low | Settings | Task 10 | "Leave it from Demo, at the bottom of Settings." is awkward; "New meets within 25 mi" repeats How far. | A1230-54 |
| 15 | Low | Onboarding step 2 | Location granted | "Use my location instead" when the map already shows my location ("Around Tamworth"). | A1230-06 |

## 6. Busy night (Settings › Demo › Busy night; not scored)

No crash, no console error. Notes (393x852, no car added):

* **Placeholder art on Tonight List:** many meets (JDM night and others) have a flat grid "map" with a
  sodium circle instead of a photo or the real map (E393-12). That's anchor 6's "placeholder art on a
  first-level screen" if it ever shows in a scored run.
* **"Not open to your car"** on most cards when I haven't added a car at all (E393-12, E393-19).
* **Map:** clusters "3", "6", "2" readable; one pin is cut by the right edge behind the map controls;
  the Birmingham cluster sits on the BIRMINGHAM label (E393-10).
* **Header:** still "DEMO NIGHT"; nothing says Busy night is on except the toast when switched.
* **Badge:** Community 8 at once (5 requests + 3 unread chats; matches the People and Chats tabs).
* **Feed:** odd crops (half a bonnet, a windscreen) and one upscaled photo (E393-15).
* **People:** text-only, half the screen empty; the "See car people near you?" card is a second home
  for the Privacy switch (good for task 10, if found first).
* **JDM night:** a real map hero, one photo, "Ask to go" as the primary; eligibility uses the
  location pin row (E393-21).

## 7. Compared with Review 18

Review 18: **Clarity 6, Coherence 7, Look 7**, 9/10 at each time and size, 2 breaks on task screens.
Review 19: **Clarity 7, Coherence 7, Look 6**, 10/10 at each time and size, 2 rulebook breaks plus 4
look exceptions on task screens. No console errors in either.

**Fixed since Review 18 (checked):**
* **Invite connections sheet after I'm going (R18 #1):** gone. "Bring your mates" is a row on the
  page; the toast, scroll and pin drop are seen. Task 3 passes; C2, C6 and L4's first two moments
  are back.
* **"Live" and "going" said twice (R18 #5, #6):** the photo badges are gone; the event page passes C5.
* **Connect wait (R18 #7):** "Demo: @dan_r will accept in a few seconds".
* **Route preview (R18 #2):** reads as the owner asked: "Starting in 5" and "Tap anywhere to stop".
* **Sunday meet below the fold (R18 #8):** I found it from Me instead; not re-checked on Tonight.
* **Plate-blur smudges (R18 #9):** the grey smudges are now solid boxes; tidier, but they show.

**New or worse:**
* **No trophy moment (problem 2):** R18 saw "Results are in." after one vote; now voting one of three
  leaves the loop open, so L4 is missed for a new reason.
* **Route end under the credit chip (problem 3):** an overlap on a task screen; this is what moves
  Look from 7 to 6.
* **Two "Sunday coffee and cars" (problem 1):** the host form's example name collides with the
  seeded meet. Probably there before; it only bites when a tester takes the example.
* **Breaks:** "Cancel" in Event options and the two-line leave toast (R18 didn't open the host's
  `···` or count the toast's length).
* **Me stats** now disagree with the list (R18 said they matched).

**Still there:** five Fiesta ST versions, three backs from chat to the tab bar, the same "+" for three
jobs, "4 hidden" unexplained, distances that don't add up between card and route, daytime photos,
the small-map sliver.

**Net:** Clarity up one (task 3 fixed, only C5 left). Coherence the same (K1 and now K3). Look down
one (an overlap on a task screen and no trophy moment).

## 8. Path to 10

Every gap I found between the app as tested and the top anchor of each score. **K** = clarity,
**C** = coherence, **L** = look. Effort: **S** small (copy, a style, one component prop), **M**
medium (one screen or flow), **L** large (data, art or a cross-app pattern).

What a 10 needs overall:
* **Clarity 10:** C1–C6 true, and a tester explains check-in, the location reveal and voting back
  without being asked. Today the reveal and check-in explain themselves; voting doesn't (no outcome).
* **Coherence 10:** K1–K5 true, and a tester predicts where a control is twice. Today "+" and the
  meet pin change meaning between screens, which breaks prediction.
* **Look 10:** L1–L5 true, and a tester picks three screens to post unprompted. Today every hero is a
  daytime phone photo with a box over the plate.

### Sign-in

| # | | What's wrong | What a 10 looks like | Effort |
|---|---|---|---|---|
| 1 | L | Hero is a red saloon in a daytime field car park with other family cars; nothing says "modified" or "night". | A night meet shot (lit cars, modified stance) with no plate visible, cropped so no box is needed. | L |
| 2 | K | Try the demo before ticking 18+ gives an error. | Either tick inline in the same tap ("I'm 18+, try the demo") or put the tick next to the button so it's seen first. | S |

### Onboarding (Get started)

| # | | What's wrong | What a 10 looks like | Effort |
|---|---|---|---|---|
| 3 | K | "fiesta st" gives five versions with no default; the tester has to know their Mk. | Most common version first, marked "Most common", or group by Mk with photos so it's picked by sight. | M |
| 4 | K | "Use my location instead" when the map already shows my location. | When location is granted: "Move it" only, and say "From your location". | S |
| 5 | L | White sliver at the top right edge of the map card. | No clipped label or marker at map edges. | S |
| 6 | L | At 1.3x the handle's helper line sits under the ActionBar until you scroll. | Content padding equals ActionBar height at any text size. | S |

### Tonight (map and list)

| # | | What's wrong | What a 10 looks like | Effort |
|---|---|---|---|---|
| 7 | K | "2 meets tonight · 4 hidden": no reason given; Show all removes the line with no way back. | "2 meets tonight · 4 not for your car" (or whatever the filter is), and after Show all "6 meets tonight · Show mine". | S |
| 8 | C | Two event card looks: map sheet (title over photo + I'm going) vs List (title under photo, no button). | One PhotoCard for an event on both, same title position and the same action. | M |
| 9 | C | The meet pin's glyph changes after going (four dots to a ring) on the event map. | One meet glyph everywhere; "going" shown by a ring or colour around the same glyph. | S |
| 10 | L | Pins sit on town labels (Fazeley, Birmingham); a cluster badge "2" overlaps its pin. | Pins with a dark outline and labels that dodge them, or a style with fewer labels at this zoom. | M |
| 11 | K | "DEMO NIGHT" chip explains the Friday clock only in its sheet; at 12:30 "Live · until 23:00" reads wrong. | The chip says the demo time ("Demo · Fri 21:10"), so every time on screen makes sense. | S |
| 12 | L | Tonight's live card is a daytime grey hatchback with a white plate box. | Night photos for every seeded meet. | L |
| 13 | L | Busy night: grid placeholder art instead of a photo on many List cards. | A real photo or the real map tile for every card. | M |
| 14 | K | Busy night: "Not open to your car" with no car added. | "Add your car to see if you can go" until a car exists. | S |
| 15 | L | Busy night: a pin cut by the right edge behind the map controls. | Fit bounds with padding for the controls. | S |

### Event page

| # | | What's wrong | What a 10 looks like | Effort |
|---|---|---|---|---|
| 16 | K | After voting one trophy: "1 of 3 voted · Best bike next", Vote stays primary, no outcome. | After the first vote, a trophy/results moment (the R18 "Results are in." cover) or a clear "Results at 23:00" line; Vote becomes secondary once you've voted. | M |
| 17 | K | "Vote for 3 trophies." is a grey sub-line under the location line, as if it were about the place. | Its own row near Vote, or just the ActionBar's Vote. | S |
| 18 | K | "rep" appears once ("+150 rep") with nothing saying what rep is for. | One line under it: "Rep shows on your profile" or the ladder link (owner allows the word here). | S |
| 19 | L | Hero photos have black or white plate boxes. | Photos chosen or cropped so no plate shows; no boxes. | L |
| 20 | L | The live page jumps straight past the hero to the location after I'm going (title off screen). | Keep the title visible (sticky compact title in the header) while the reveal plays. | M |
| 21 | L | Small map: white sliver at the top edge. | Same as 5. | S |
| 22 | K | Hosted meet: location line "Tamworth meet point, Tamworth." repeats the town. | Default meet point name from the place picker isn't "{Town} meet point"; or drop the town when the name contains it. | S |
| 23 | K | Hosted meet two days away has Navigate as its one primary. | Host's primary before the day: Share (or Invite); Navigate on the day. | S |
| 24 | C | Event options: "Cancel" item (break 1). | "Cancel the meet", opening a ConfirmSheet "Cancel it / Keep it". | S |
| 25 | K | Busy: eligibility ("Open to cars only…") in the location pin row. | Its own row with its own icon; the location row only ever talks about the place. | S |

### Route preview and drive view

| # | | What's wrong | What a 10 looks like | Effort |
|---|---|---|---|---|
| 26 | L | Destination marker under "© OSM, OSRM"; two credit chips; round buttons on the route line. | One combined credit chip in a corner the route avoids; fit the route with padding for the buttons and chips. | S |
| 27 | K | "2.9 mi" twice (title and "2.9 mi drive"); the card said "about 2 mi". | Say the drive distance once; the card's "about" distance and the route agree, or the card says "2.9 mi drive". | S |
| 28 | K | "Arrive 21:16" at 12:30 phone time; "Friday's clock" only appears after it starts. | Say "Demo night · Fri" next to the arrival time on the preview. | S |
| 29 | C | Report is a coral pill and End a red one: two extra button colours. | Report as a secondary icon button; End the only red. | S |

### Vote sheet and photos

| # | | What's wrong | What a 10 looks like | Effort |
|---|---|---|---|---|
| 30 | L | My uploaded photo is letterboxed with grey bands among full-bleed tiles. | Cover-fit tiles like the others (crop already chosen). | S |
| 31 | L | Same green M4 shot on profile hero, profile post, vote, feed, Tonight list. | A different photo per use, or at least per screen. | M |
| 32 | C | Crop screen closes with ✕ where every other screen uses the chevron; its `···` is unexplained. | Chevron with the 4.2 discard confirm, or keep ✕ but write that into 4.2 as the one image-editor exception. | S |

### Going list, profile and chat

| # | | What's wrong | What a 10 looks like | Effort |
|---|---|---|---|---|
| 33 | L | Every person is a grey letter avatar: Going list, chat, chats list, people. | Car-photo avatars (their build's photo) by default. | M |
| 34 | L | Profile: CONNECTED tag floats top-left of the photo, far from the name; "Dan" alone on a line. | Tag next to @handle; real name in the same block. | S |
| 35 | K | Three backs from a chat to reach a tab bar. | Chat and profile keep the tab bar, or a tab tap is always visible. | M |
| 36 | K | Chat stamp "21:13" under "TODAY" at 12:30 phone time. | Same as 11: the demo clock is named once and visible. | S |

### Garage

| # | | What's wrong | What a 10 looks like | Effort |
|---|---|---|---|---|
| 37 | C | "+" adds a car here, hosts on Tonight, posts on Community. | A labelled icon per job, or one "+" that opens one "New…" sheet everywhere. | M |
| 38 | K | "Add a photo of your car" under a card that already shows a car photo (a stock one). | Say it's a stand-in: "Sample photo · Add yours". | S |
| 39 | L | Half the screen empty below one car. | The build sheet (mods, class, power) below the card. | M |
| 40 | K | Add a mod sheet with nothing picked still shows primary "Add". | The sheet opens on the parts list with no primary; the "Add {part}" button appears once a part is picked. | S |

### Host a meet

| # | | What's wrong | What a 10 looks like | Effort |
|---|---|---|---|---|
| 41 | K | Name placeholder "e.g. Sunday coffee and cars" equals the seeded meet. | An example that matches no seeded meet ("e.g. Friday night at the retail park"). | S |
| 42 | L | Step 2 map opens on the whole Midlands; "Tap to place the meet point" over the labels. | Open on home area; the prompt in a chip with a backing, like step 2's "Tap to move the meet point". | S |
| 43 | K | Step 3 "drivers within 25 mi" leaves out riders. | "People within 25 mi". | S |
| 44 | K | 24-box hour grid with greyed past hours. | Evening hours first (17–23), "Earlier" to expand. | M |
| 45 | L | Post-success: thin map strip, large empty middle; at 1.3x the map is a sliver. | The meet's PhotoCard (or a full-width map) as the hero, then Share. | M |
| 46 | K | Post-success back arrow: where does it go (form or Tonight)? | No back; "Done" and the two actions. | S |

### Me

| # | | What's wrong | What a 10 looks like | Effort |
|---|---|---|---|---|
| 47 | K | "2 Meets" above three upcoming and one past. | Label says what it counts ("2 went to"), or count all. | S |
| 48 | C | "YOUR MEETS" header has a rule line, "PAST" doesn't. | One section-header style. | S |
| 49 | K | Two meets with the same name and time show no other difference but the tag. | Add the area ("Around Tamworth") or host to the meta line. | S |

### Settings

| # | | What's wrong | What a 10 looks like | Effort |
|---|---|---|---|---|
| 50 | K | "Leave it from Demo, at the bottom of Settings." | "You're trying the demo. Leave it at the bottom of this page." | S |
| 51 | K | "New meets within 25 mi" then "How far: 25 mi". | "New meets near you", with How far underneath. | S |

### Toasts (all screens)

| # | | What's wrong | What a 10 looks like | Effort |
|---|---|---|---|---|
| 52 | C | Leave toast wraps to two lines; uses the green done tick. | "Not going · UNDO" on one line; neutral icon for leave/remove. | S |

### Community (exploration)

| # | | What's wrong | What a 10 looks like | Effort |
|---|---|---|---|---|
| 53 | L | Feed photos: odd crops (half a bonnet, a windscreen), one upscaled and soft. | Whole-car crops at source resolution. | M |
| 54 | L | People and Chats are text-only with half the screen empty. | Car-photo avatars (33) and a People near you preview row. | M |

### Demo data and art (cross-app)

| # | | What's wrong | What a 10 looks like | Effort |
|---|---|---|---|---|
| 55 | L | Every photo is daytime; the app is "Nightshift". | A night set for heroes (Tonight, event pages, sign-in). | L |
| 56 | K | The demo's Friday 21:10 clock surprises at any other phone time. | One visible "Demo · Fri 21:10" everywhere times show (11, 28, 36). | S |

**Count: 56 gaps: 37 S, 15 M, 4 L.**

### What e2e/scorecard could catch

* **Overlap with map chrome (26, 15, 42):** for every map, check that pins, the route's end and any
  overlay text don't intersect the credit chips or control buttons (bounding boxes of
  `[data-testid=map-credit]`, controls, markers).
* **Toast length (52):** fail when a toast's text box is taller than one line at 375 wide (extend the
  4.7 probe).
* **"Cancel" label (24):** fail on any button or menu row whose whole text is "Cancel" outside a form
  that loses work (the crop screen allow-listed).
* **Same fact twice (27, 51, 47):** extend C5 beyond the event page to the route preview and
  Settings: a distance or radius value at most once per screen; Me's stat counts equal to the rows
  listed.
* **Duplicate names in Me (41, 49):** after task 9, fail if Me lists two meets with the same name.
* **Trophy moment (16):** after task 6, check that a results or trophy element appears (L4).
* **Letterboxed tiles (30):** in Photos grids, the `<img>` must cover its tile (`object-fit: cover`
  or equal aspect).
* **Placeholder art (13):** in Busy night, fail when a Tonight card renders the grid placeholder.
* **Section header style (48):** every section header on a screen uses the same component (testID).
* **Edge slivers (5, 21):** screenshot diff of the top 4 px of each small map card for bright pixels.
* **Card look (8):** the Tonight map-sheet card and List card share a testID and title position.

Not automatable: photo quality and night mood (1, 12, 19, 31, 53, 55), the "+" meaning (37), avatars
(33), whether a tester can explain voting (16) or predict a control.

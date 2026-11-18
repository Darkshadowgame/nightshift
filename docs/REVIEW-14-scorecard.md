# Review 14: fixed scorecard

Scored against `REDESIGN-2.md` section 7 (fixed scorecard) and section 8 (8+ criteria), which I read
before testing. I read section 4 (the rulebook, with its owner exceptions) and section 9 only after
the task runs, to count rule breaks. I read Review 13 last, for the comparison only.

**Set-up:** `05eeed6` on main. `npx expo export --platform web --clear` into
`~/nightshift-wt/r14-web`, served with SPA fallback on port 8914 (killed by PID afterwards). My own
headless Chromium through a Node Playwright script: 375x667, touch and mobile emulation, @2x,
Europe/London, en-GB, demo mode. Four scored runs, each from cleared storage: browser clock 12:30 and
20:30 on Wed 18 Nov, each at 1.0x and 1.3x text. Then free exploration at 393x852.
Screenshots are in `~/nightshift-wt/r14-shots`:

* `x-` is the first, unscripted walk-through, where the hesitations and human times come from.
* `r1230-10-`, `r2030-10-`, `r1230-13-` and `r2030-13-` are the scored runs.
* `e-` is the exploration at 393x852.

**Limits:**
* Human times come from the unscripted walk-through: my steps, reading and taps. The script's wall
  time is given next to them.
* 1.3x text is simulated by scaling each text element's font size and line height in the page.
  React Native Web ignores the OS text size, so this is a stand-in for Dynamic Type.
* On web, Share opens the in-app "Share this meet" sheet (link and Copy link). I counted that as the
  hand-off sheet.

## 1. Task table

All four runs gave the same visible text and the same outcomes. The only differences were:
* the random demo handle;
* map tiles still loading in a few shots;
* where the new meet point landed under the crosshair.

The demo night (Fri 20 Nov, about 21:10) makes 12:30 and 20:30 the same. No crash and no on-screen
error. One console "502" for a resource appeared in the walk-through only, and the user doesn't see
it.

### 12:30 and 20:30, 1.0x text (identical)

| # | Result | Human | Script | Taps | Notes (shots) |
|---|---|---|---|---|---|
| 1 | Pass | 30 s | 6.4 s | 7 + typing | Try the demo before ticking 18+ says "Tick the box to say you're 18 or over first." (x-02). "Fiesta ST" gives six rows under "5 versions of the Fiesta ST": one is a plain Fiesta Mk8 ST-Line. Which one is mine? (hesitation, x-04-search). Step 2 "Around Tamworth", Show me tonight. The Fiesta ST Mk8 is in the Garage, "197 bhp · Stock" (x-08-garage). |
| 2 | Pass | 4 s | 1.4 s | 1 | The live card leads the Tonight sheet, over a map with visible pins (x-07-tonight). |
| 3 | Pass | 5 s | 3.7 s | 1 | The page jumps to the location card, the pin animates and "LOCATION SHOWN · Leisure park car park" appears. The toast "You're going with your Fiesta ST Mk8 · Change" only arrives about 2.2 s after the tap, on two lines. For those 2 s the GOING tag is scrolled out of view: did it work? (x-10-going-a/b, x-61-g9). |
| 4 | Pass | 9 s | 2.8 s | 2 | Navigate opens the in-app drive view ("Arrive 21:17", "Demo night: Friday's clock · 4× speed"). End returns to the event (x-12-nav, x-13-endnav). |
| 5 | Pass | 4 s | 2.6 s | 1 | The ring bursts, then the "+150 rep · For turning up." card and a "Checked in" toast (x-14-strip). |
| 6 | Pass | 45 s | 7.3 s | 7 + file | I was asked to vote for the best car, but Vote opens on "Best in show" (hesitation). I voted for the BMW M4. "Vote counted. Next: Best car" moves the tab on by itself, so I voted the M4 again and tapped Done. The page then shows "DEMO RESULTS" with winners, under a place line that says "Results tomorrow 23:00" (x-18b, x-18). Add a photo, file, crop, Use this crop, "Photo posted here and in Community". The photo is first in Photos, a scroll down (x-21, x-22-photos). |
| 7 | Pass | 30 s | 8.7 s | 7 + typing | "11 going", @jordST, Connect, "Request sent". For about 3 s the ActionBar shows only "Waiting for @jordST" with a calendar icon. Then "@jordST accepted. You can message now.", Message, Send (x-23, x-24, x-25-strip, x-27b-sent). |
| 8 | Pass | 20 s | 5.0 s | 7 | Back three times to reach the tab bar, then Garage, Add a mod, Cold air intake, "Add cold air intake". Toast "Added Cold air intake. Now 201 bhp, Class B". The card reads "201 bhp · 1 mod" with the B badge (x-30, x-31, x-32). |
| 9 | Pass | 85 s | 12.6 s | 14 + typing | Unlabelled "+" on Tonight (the Garage "+" adds a car), name, Starts: Change, Sun 22, 10, Done (ends at 13:00). On step 2, tapping the map opens the picker ("Near Tamworth"), then Set meet point here. The name is pre-filled as "Tamworth meet point". Step 3 says "Open to everyone · We'll invite drivers within 25 mi · about 18 people": is that a limit? (hesitation). Step 4, Post meet, "Invites sent to 18 people nearby", Share, "Share this meet" sheet (x-33 to x-44). Tonight lists "Sunday morning hot hatches · Sun 10:00 · HOSTING". |
| 10 | Pass | 30 s | 8.0 s | 9 | Back to Tonight. Tapping "Sunday coffee and cars" in the map sheet opens a preview card that fills the sheet and hides the map, so it takes another tap (Open) to reach the page (x-46-sunday). From List it opens directly (r2030-10-t10-list). "Can't make it", "Leave it", then "You're not going to Sunday coffee and cars · Undo". Me, gear, Settings: "Show me in People near you", already off (x-47 to x-51). |

**12:30: 10/10. 20:30: 10/10.**

### 12:30 and 20:30, 1.3x text

| # | 12:30 | 20:30 | Script | Notes |
|---|---|---|---|---|
| 1–10 | 10/10 | 10/10 | Same as 1.0x (±0.1 s) | Same outcomes and toasts. Several things wrap to two lines: the going, mod and photo toasts, and the map credit on small maps. The "Sent" toast covers the message you just sent (r1230-13-t7-end), and the "Checked in" toast sits over the attendee row (r1230-13-t5-end). Names no longer clip mid-word on the vote sheet (r1230-13-t6-vote). |

## 2. Time to understand

| Measure | Result | Target | Pass? |
|---|---|---|---|
| TTU-1 | About 3 s. "What's on tonight near you. Go with your car." plus "See tonight's meets near you / Say you're going, with your car" covers car meets, near me / tonight and going with my car (x-01-signin). | ≤ 5 s | Pass |
| TTU-2 | About 33 s from Try the demo to the first I'm going tap, including the 18+ error and the Fiesta choice. | ≤ 60 s | Pass |

**Hesitations over 5 s:**
1. Task 6, vote: asked for the best car, but the sheet opens on Best in show. It then moves to the
   next trophy by itself and shows finished results under "Results tomorrow 23:00". *Wording.*
2. Task 9, host step 3: "Open to everyone · We'll invite drivers within 25 mi". *Wording.*
3. Task 1, onboarding: "5 versions of the Fiesta ST" above six rows. Which one? *Wording (the count)
   and choice.*
4. Task 9 start: which "+" hosts a meet. *Unlabelled icon, not wording.*

**Shorter hesitations:**
* the going toast comes about 2 s late, after the page has jumped;
* "Waiting for @jordST" for about 3 s;
* the map-sheet preview card in task 10 needs a second tap;
* "Arrive 21:17" against a 12:30 phone clock (explained by the drive view's footer);
* the privacy switch is already off, so task 10 needs no action.

## 3. Scores

### Clarity: **7**

| Criterion | Result | Evidence |
|---|---|---|
| C1 TTU-1 ≤ 5 s | **Met** | About 3 s. |
| C2 10/10 at both times | **Met** | 10/10 at 12:30 and 20:30, at 1.0x and at 1.3x. No hints. |
| C3 inside the limits; TTU-2 ≤ 60 s | **Met** | Task 9 is the closest (85 s of 120 s). TTU-2 is about 33 s. |
| C4 no 4.12 word | **Met** | A text scan of every task screen in all four runs finds only "+150 rep" (after check-in) and "Level 1 · Newcomer" (Me), and both are allowed. |
| C5 each fact said once | **Missed** | Checked-in event: the place line says "Results tomorrow 23:00", but "DEMO RESULTS" shows the winners now, and the votes are listed twice: in the results rows and again under "You voted" (x-18, x-22). The vote sheet title "VOTE: BEST IN SHOW" repeats the selected segment. Class is explained two ways: Add a car or bike says "Class A at 316 bhp (standard plus mods)", while the Power page and Help say class comes from bhp per tonne (e-29, e-32, e-35). The empty Garage says "Add your car or bike" as the heading and again as the button (e-26). |
| C6 no dead ends; errors say what to do | **Missed** | Task errors are good: 18+, pick your car, handle, meet point, empty feedback. Bad links show a not-found screen with "See tonight's meets". But outside the tasks: "Show where I am" with location off does nothing and says nothing (e-41). Search promises "or an address", yet "Birmingham" returns "Nothing called that near you." with no next step (e-20). Your profile has no Save and drops your edit when you go back (e-48). |

Anchor 6 is fully true: purpose clear in 10 s, 10/10 tasks, and exactly 3 wording hesitations over
5 s. Anchor 8 has 4 of 6 lines true (C1–C4). All of 6 and most of 8 gives **7**.

### Coherence: **5**

Rulebook exceptions on the screens met in the tasks: **5** (listed in section 4). That puts the count
in anchor 6's band (1–5).

Anchor 4's other line is also true: **two navigation patterns for the same job**. Opening an event
card on Tonight pushes the event page from List. From the map sheet, the same card first becomes an
in-sheet preview that hides the map, and a second tap opens the page (x-46-sunday, e-50-maprow).
Anchor 6 means "only 1–5 small exceptions". Since a line of anchor 4 holds, I can't give all of 6.
All of 4 and most of 6 gives **5**.

Coherence 8+ criteria:
* **K1** zero exceptions: **missed** (5).
* **K2** one selector per job: **missed**.
  * Add a car or bike picks the mod category from a 14-tab scrolling strip, but the Add a mod sheet
    picks it with a four-option SegmentedControl (Engine, Suspension, Wheels, Looks).
  * The same form has two SegmentedControls (Car/Bike and Original engine/Engine swap) and a
    six-pill ChoiceGroup for the engine type (e-52).
  * The make/model dropdown from Review 13 is gone: it's a search now.
* **K3** one look per kind of thing: **missed**. The profile hero pairs the class badge with
  "@jordST", with the avatar and name on a line below (x-24-profile), so a person isn't avatar +
  @handle there. Events otherwise match: PhotoCard on Tonight, a ListRow with the kind glyph on
  Search and Me.
* **K4** every screen matches a template: **met as far as visible**.
* **K5** one power number: **met**. 201 bhp everywhere after the mod. bhp per tonne and "claimed"
  appear only on Power and dyno.

### Look: **5**

* **L1** a photo or real map above the fold on every first-level screen at 375x667: **met**.
  * Tonight map and list, Community feed and the event pages have photos or the real map.
  * Garage and Me now show a real photo of a Fiesta ST Mk8 (x-08-garage, x-50-me).
  * But a Civic Type R FK8 added in exploration shows an older FK2 (e-31-build), and the past meet
    reuses the Sunday meet's GR Yaris hero (e-43).
* **L2** the look checklist on every screen: **missed**.
  * Misalignment at 375x667: on the "It's up" page after posting a meet, the hero map stops about
    45 pt short of its box and leaves a blank band (x-43-posted-1). On the Tonight map, a selected
    card blows the sheet up to full height, hides the map and leaves most of the screen empty
    (x-46-sunday, e-50-maprow).
  * Overlap at 1.3x: the map credit wraps to two lines and covers part of the small maps: host step
    2, the "It's up" hero (where it sits over the meet circle) and onboarding step 2
    (r2030-13-t9-step2, r2030-13-t9-posted). The "Sent" toast covers the bubble you just sent
    (r1230-13-t7-end).
  * Sodium off the primary: the "LOCATION SHOWN" eyebrow on the event map is sodium (x-10-going-b).
  * At 393x852 the feed post's meta line is cut to "BMW M4 Competition · 583 bhp · O…" (e-21).
  * The map's control panel is translucent, and road labels show through it (e-41).
* **L3** a real dark map on web with the same pins and clusters: **met**. It's dark, with a "2"
  cluster and the live pin. The framing now keeps the pins above the sheet at 375x667 and at 1.3x.
* **L4** the four motion moments: **met**.
  * Going: the avatar joins the going strip, the ActionBar changes and the toast comes, but the
    GOING tag is scrolled out of view.
  * Location shows: the pin animates and "LOCATION SHOWN" appears.
  * Check in: the ring bursts.
  * Trophy: the cover appears with particles.
* **L5** three screens I'd share: **met**: the trophy cover (x-18), the live event page after the
  location shows (x-10-going-b) and my Garage card (x-08). All the demo photos are daytime street
  shots, with wheelie bins and terraces, not night meets.

Anchor 4's line, "visible clipping, overlap or misalignment on 375x667 or at 1.3x text", is true: the
blank band under the posted-meet map, the full-height empty sheet on Tonight, and the map credits and
toasts over content at 1.3x. Anchor 6's "consistent and tidy" is therefore not fully true, although
its placeholder-art line no longer applies. All of 4 and most of 6 gives **5**. It sits at the top
of the band: three layout fixes would make anchor 6 fully true. With L1, L3, L4 and L5 met, the
score would then be 7.

### 8+ criteria summary

| Met | Missed |
|---|---|
| C1, C2, C3, C4, K4 (as far as visible), K5, L1, L3, L4, L5 | **C5, C6, K1, K2, K3, L2** |

## 4. Rule breaks, counted

I didn't count the owner exceptions:
* "+150 rep" after check-in;
* the level line on Me;
* the ladder sheet with its level names, including "Legend";
* the drive view's End as its back.

**On screens met in the tasks: 5.**

| # | Rule | Screen | Break | Shot |
|---|---|---|---|---|
| 1 | 4.3 | Profile after Connect (task 7) | For about 3 s the ActionBar shows only the status pill "Waiting for @jordST", with a calendar icon and no secondary that helps (e.g. cancel the request). | x-25-strip |
| 2 | 4.7 one line | Event after I'm going (task 3) | The going toast wraps to two lines at 1.0x: "You're going with your Fiesta ST / Mk8 · Change". At 1.3x the mod and photo toasts wrap too. | x-61-g9, r1230-13-t8-toast |
| 3 | 4.11 | Event place line (tasks 3–6) | The shown wording is "{Meet point name}, {Town}.", but the line adds other facts: "Check-in is open.", "Voting is open until tomorrow 23:00." and then "Results tomorrow 23:00." The last one contradicts the results shown below it. | x-10-going-b, x-14-strip, x-18b |
| 4 | 4.11 | Host step 4 (task 9) | The review row says "Location shows 1 h before, to people going". The host-view wording is "People going see it at 09:00 (1 h before).", which the next page does use. | x-42-host4, x-43-posted-1 |
| 5 | 4.5 read = push | Tonight map sheet (task 10) | Tapping an event card opens an in-sheet preview instead of pushing the event page, unlike the same card in List. Two navigation patterns for one job. | x-46-sunday, e-50-maprow |

**Outside the tasks: 5.**

| # | Rule | Screen | Break | Shot |
|---|---|---|---|---|
| 6 | 4.2 | Your profile (Settings → Handle, name and home area) | There's no Save. Change the handle and go back: nothing asks first and the change is lost. | e-48-profile |
| 7 | 4.4 | Add a car or bike | Two SegmentedControls on one screen (Car/Bike and Original engine/Engine swap). | e-52-addcar-form |
| 8 | 4.4 | Add a car or bike | The engine type is a six-pill ChoiceGroup (Turbo petrol … Electric). The limit is five; beyond that it should be a list. | e-52-addcar-form |
| 9 | 4.10 | Forum and for sale | "Today 01:10". After midnight it should be "Tonight 01:10". | e-25-forum |
| 10 | 4.6 | Notifications (empty) | No glyph. "Nothing yet. Say you're going to a meet and we'll remind you." shows while you're already going to two meets. | e-16-notifs |

**Total: 10** (5 on task screens).

Look-checklist exceptions (counted under L2, not as rulebook breaks):
* the blank band under the posted-meet hero map;
* the full-height empty sheet with a selected card on Tonight;
* the map credit over small maps at 1.3x;
* the "Sent" toast over the sent bubble at 1.3x;
* the sodium "LOCATION SHOWN" eyebrow;
* the feed meta line cut off at 393;
* the translucent map controls.

## 5. Problems, ranked

| # | Severity | Screen | Steps | What's wrong | Shot |
|---|---|---|---|---|---|
| 1 | High | Tonight map sheet | Open the app, tap any event card in the sheet | The card becomes a preview, the sheet grows to full height and the map disappears behind a mostly empty panel, and you need another tap (Open). The same card in List opens the page at once. Two navigation patterns, which holds Coherence at 5, plus a layout break. | x-46-sunday, e-50-maprow |
| 2 | Medium | Event after voting | Check in, Vote, pick, Done | The place line says "Results tomorrow 23:00", but "DEMO RESULTS" shows the winners at once, and "You voted" lists the same picks again. Vote opens on Best in show when you're after the best car, then moves on to the next trophy by itself. Did my vote count, and for what? (C5) | x-15-vote, x-18b, x-18, x-22-photos |
| 3 | Medium | Your profile | Me, gear, Handle, name and home area, change the handle, back | No Save and no "Discard it / Keep editing". The change is silently lost (4.2, C6). The page also carries a demo note: "In the demo, the people and meets you see are made up…". | e-48-profile |
| 4 | Medium | Event, I'm going | Live meet, I'm going | The page jumps to the location card and the GOING tag scrolls out of view. The going toast arrives about 2.2 s later, on two lines (4.7). On a non-live meet it's instant and lasts about 3.25 s, which is right. | x-10-going-a, x-61-g9, x-60-going-toast |
| 5 | Medium | "It's up" page, host and onboarding maps | Post a meet; 1.3x text | The hero map doesn't fill its box and leaves a blank band. At 1.3x the map credit wraps to two lines and covers the meet circle and a quarter of the small maps (L2). | x-43-posted-1, r2030-13-t9-posted, r2030-13-t9-step2 |
| 6 | Medium | Profile after Connect | Connect | For about 3 s there's only "Waiting for @jordST" with a calendar icon and nothing to do (4.3). | x-25-strip |
| 7 | Medium | Search, Tonight map | Search "Birmingham"; tap "Show where I am" with location off | The search box says "or an address", but a city gets "Nothing called that near you." and no next step. The location button fails silently (C6). | e-20-search-bham, e-41-whereami |
| 8 | Medium | Add a car or bike, Power and dyno, Help | Garage "+", pick a car | Class is "at 316 bhp (standard plus mods)" on the form but "from bhp per tonne" on Power and dyno and in Help. Two explanations of one fact (C5). | e-29-addcar-picked, e-32-power, e-35-how |
| 9 | Low | Host steps 3 and 4 | Host, Next ×2 | "Open to everyone · We'll invite drivers within 25 mi" still reads like a limit (fourth review running). Step 4's location row doesn't use the 4.11 host wording. | x-41-host3, x-42-host4 |
| 10 | Low | Onboarding | Type "Fiesta ST" | "5 versions of the Fiesta ST" sits above six rows, one of which is a plain Fiesta Mk8 ST-Line. Nothing says which is the common one. | x-04-search |
| 11 | Low | Add a car or bike | Garage "+" | Mod categories in a 14-tab strip here, four segments in the Add a mod sheet. Two SegmentedControls and a six-pill group on one form (K2, 4.4). | e-52-addcar-form |
| 12 | Low | Stand-in photos | Add a Civic Type R FK8; open last week's meet | The FK8 shows an older FK2. The past meet reuses the Sunday meet's GR Yaris photo. Every photo is a daytime street shot, not a night meet. | e-31-build, e-43-lastweek |
| 13 | Low | Notifications, Me Trophies | Say you're going or check in, then open them | Stale guidance: "Say you're going to a meet and we'll remind you" while you're going (and no glyph, 4.6), and "Check in at a meet…" after you've checked in. | e-16-notifs, x-50-me |
| 14 | Low | Chat at 1.3x | Send a message | The "Sent" toast covers the bubble you just sent. | r1230-13-t7-end |
| 15 | Low | Forum | Community, Forum and for sale | "Today 01:10" should be "Tonight 01:10" (4.10). | e-25-forum |
| 16 | Low | Event map | I'm going | The "LOCATION SHOWN" eyebrow is sodium (5.4): two orange things on screen with Check in. | x-10-going-b |
| 17 | Low | Profile hero | Open any profile | The class badge sits next to the @handle, with the avatar and name on the line below (K3). | x-24-profile |
| 18 | Low | Header "+" | Task 9 | The unlabelled "+" hosts on Tonight, adds a car on Garage and posts on Community. Allowed by 4.1, but a newcomer hunts for "host". | x-07-tonight, x-08-garage |
| 19 | Low | Tonight list | Open List | "This week" includes next Wednesday and Thursday (25–26 Nov). | x-07-tonight |
| 20 | Low | Community feed at 393 | Feed | The meta line is cut to "· O…". | e-21-feed |
| 21 | Low | Tonight map | Open the app | The map controls are translucent, and labels ("Wood End") show through. | e-12-tonight-nocar |
| 22 | Low | Credits | Settings, Open data and credits | It says "Map, place search, place names and routes: Apple Maps", but the web build uses Stadia/OpenStreetMap tiles and OSRM routes. | e-36-Opendataandc |

## 6. Compared with Review 13

Review 13 scored **Clarity 7, Coherence 4, Look 5**, with 10/10 at each time. Review 14 scores
**Clarity 7, Coherence 5, Look 5**, with 10/10 at each time and size.

**Fixed since Review 13 (checked):**
* **Toasts:** a non-live going toast lasts about 3.25 s (it was about 5.5 s). None followed me to
  the next screen, and none sat over End or a primary. This was Review 13's #1 and two of its
  exceptions.
* **Garage and Me:** both show a real Fiesta ST Mk8 photo, not a placeholder silhouette, so L1 is
  now met.
* **"Can't make it":** it's a ConfirmSheet with "Leave it / Keep it". The "11 going" list is now a
  pushed screen, not a sheet.
* **Units:** onboarding says "Saved to about half a mile", not "about 1 km".
* **Add a car or bike:** make and model come from a search, with no Make/Model dropdowns.
* **Vote sheet at 1.3x:** names wrap instead of clipping mid-word.
* **Trophy cover:** a ClassBadge, the name not in capitals, and the "4 mods" line no longer wraps
  alone.
* **Maps:** the radius and area circles are grey, not sodium. The Tonight map keeps the pins above
  the sheet, at 1.3x too, so the L3 caveat is gone.
* **Host step 2:** no unexplained hexagons on the preview. The picker says "Near Tamworth", not
  "Somewhere in Midlands", and the meet point name comes pre-filled.
* **Location shows:** the moment is now seen (map to pin, then "LOCATION SHOWN"), so L4 is met.
* Exceptions on task screens dropped from 6 to 5. Review 13's six are all gone. The five here are
  different ones.

**New or worse:**
* **Tonight map sheet:** an event card opens an in-sheet preview that hides the map, while List
  pushes the page. Two navigation patterns. This is now the top problem, and it's why Coherence is 5
  rather than 6.
* **Going toast on a live meet:** it now waits about 2.2 s, until the location reveal ends. With the
  page scrolled to the map, the GOING tag is out of view in that gap, and the toast wraps to two
  lines.
* **Your profile:** it silently drops your edit. There's no Save and no discard confirm.
* **Class:** explained two ways (bhp on the add-car form, bhp per tonne on Power and in Help).
* **Onboarding count:** "5 versions" above six rows.
* **"It's up" page:** a blank band under the hero map. At 1.3x the map credit covers the small maps.

**Still there:**
* **Fact said twice:** a results line in the place row ("Results tomorrow 23:00") against results
  shown now. It's in a different form, but it's still C5.
* **Host step 3:** "within 25 mi" still reads as a limit.
* **"Waiting for…" pill:** the calendar icon and no action.
* **"Sent" toast:** it still covers the sent bubble at 1.3x.
* **Profile hero:** the class badge sits next to the handle.
* **Unlabelled "+":** it means a different job on each tab.
* **Demo photos:** daytime street photos only.

**Net:**
* **Clarity** stays at 7. C5 is still missed, and C6 is now missed too, on screens outside the tasks.
* **Coherence** goes up from 4 to 5. The count (5) is in anchor 6's band, and only the map-sheet
  preview keeps it below 6. Removing that preview, so a card always pushes, gives 6. Also fixing the
  four wording and ActionBar breaks reaches K1.
* **Look** stays at 5, but for smaller reasons. The placeholder art and mid-word clipping are gone.
  What's left is the posted-meet map band, the full-height empty map sheet, and the map credit and
  toasts covering content at 1.3x. Fixing those three makes anchor 6 fully true. With L1, L3, L4 and
  L5 already met, that's a 7.

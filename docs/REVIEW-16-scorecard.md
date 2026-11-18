# Review 16: fixed scorecard

Scored against `REDESIGN-2.md` section 7 (fixed scorecard) and section 8 (8+ criteria), read before
testing. Section 4 (the rulebook, with its owner exceptions) and section 9 were read only after the
task runs, to count rule breaks. Review 15 was read last, for the comparison only.

**Set-up:** `53ceebe` on main. `npx expo export --platform web --clear` into
`~/nightshift-wt/r16-web`, served with SPA fallback on port 8961 (killed by PID afterwards). My own
headless Chromium (Playwright, Node scripts, not the shared MCP browser): 375x667, touch and mobile
emulation, @2x, Europe/London, en-GB, demo mode, no location permission. Four scored runs, each from
cleared storage: browser clock 12:30 and 20:30 on Wed 18 Nov, each at 1.0x and 1.3x text. Then free
exploration at 393x852. Screenshots are in `~/nightshift-wt/r16-shots`:

* `x-` is the first, unscripted walk-through, one step per script. The hesitations and human times
  come from it.
* `r-1230-10-`, `r-2030-10-`, `r-1230-13-` and `r-2030-13-` are the scored runs (the number after the
  run is the task).
* `e-`, `c-` and `k-` are the exploration and the follow-up checks (393x852 and 375x667).

**Limits:**
* Human times are my estimate from the walk-through: reading, choosing and tapping, at about 1.5 s a
  tap plus reading. The script's wall time is given next to them.
* 1.3x text is simulated by multiplying every element's computed font size and line height by 1.3.
  React Native Web ignores the OS text size and any `maxFontSizeMultiplier`, so text the iPhone app
  may cap is scaled here too.
* Web Share: headless Chromium on Linux has no `navigator.share`, so the web build opened its own
  "Share this meet" sheet (link and Copy link). With a stubbed `navigator.share` like iOS Safari's,
  Share called it with the meet's title, "Sun 10:00" and the link. Either way a share sheet opened.

## 1. Task table

All four runs gave the same outcomes and the same visible text, apart from three random things: the
demo handle (`@fiesta_NNNN`), the demo's chat reply ("Cheers!", "Nice one, thanks.", …), and the
hosted meet's distance ("1 mi" or "2 mi from home", from where the crosshair lands). None of them
follows the clock. The demo night (Fri 20 Nov, about 21:10) makes 12:30 and 20:30 the same. No
crash, no on-screen error and **no console errors at all** in any run.

### 12:30 and 20:30, 1.0x text (identical)

| # | Result | Human | Script | Taps | Notes (shots) |
|---|---|---|---|---|---|
| 1 | Pass | 30 s | 7.0 s | 6 + typing | Try the demo without ticking 18+ gives "Tick the box to say you're 18 or over first." (x02). Search "Fiesta ST": "Ford Fiesta ST · 5 versions". Which is mine? (about 6 s, x04). Mk8 facelift, Next, step 2 "Around Tamworth" with the handle pre-filled, Show me tonight. Garage shows the Fiesta with a real photo (x28, r-…-01d-garage). |
| 2 | Pass | 4 s | 0.7 s | 1 | The live "Car park meet-up" card leads the map sheet. Tapping it pushes the event page (x07b, x08). |
| 3 | Pass | 3 s | 0.8 s | 1 | The pin animates and the page scrolls to "Leisure park car park, Tamworth." Toast "You're going · CHANGE", and "Going with your Fiesta ST Mk8 facelift" above Check in (x09a, x09b). |
| 4 | Pass | 8 s | 3.4 s | 2 | Navigate opens the drive view ("Arrive 21:15", "Demo night: Friday's clock · 4× speed"). End puts me back on the event (x10b, x11). |
| 5 | Pass | 3 s | 1.0 s | 1 | The ring bursts, then the "+150 rep · For turning up." card and the "Checked in" toast. Vote becomes the primary, Add a photo the secondary (x12a, x12c). |
| 6 | Pass | 35 s | 6.0 s | 6 + file | Vote opens "Vote: Best in show", not Best car. I was asked for the best car (about 6 s). "Next: Best car", Focus RS, toast "Voted for Ford Focus RS Mk3", Done. Add a photo, file, crop, Use this crop, "Photo posted". "Photo by You" is first in Photos (x13, x15, x19). |
| 7 | Pass | 30 s | 12.4 s | 6 + typing | "11 going · 8 cars, 3 bikes", @jordST, Connect, "Request sent", "Waiting for @jordST to accept" for about 3 s, then CONNECTED and Message. Typed, Send, toast "Sent". The demo replies (x20 to x26b). |
| 8 | Pass | 15 s | 6.1 s | 6 | The chat has no tab bar. Back from the chat lands on the event (not the profile), one more back reaches Tonight. Garage, Add a mod, Cold air intake, "Add Cold air intake". The toast "Added. Now 201 bhp, Class B" answers the question (x29 to x31). |
| 9 | Pass | 55 s | 15.4 s | 13 + typing | "+" on Tonight, Name, Starts Change, Sun 22, 10, Done (ends Sun 13:00). Step 2: tap the map, Set meet point here (now in the ActionBar), names pre-filled. Step 3: "Who can come: Everyone". Step 4, Post meet, "Invites sent to 18 people nearby", Share (x32 to x43b). |
| 10 | Pass | 35 s | 10.1 s | 10 + 2 dead | Back to Tonight, Sunday coffee and cars. The ActionBar says "Going · location at 09:00" and Remind me, with no way out. I tapped the status line, then the GOING pill: nothing (about 8 s). `···` › Can't make it › ConfirmSheet "Leave it / Keep it" (about 3 s on which is which). Toast "You're not going to Sunday coffee and cars · UNDO". Me, gear: "Show me in People near you" is the first row under Privacy (x45 to x52). |

**12:30: 10/10. 20:30: 10/10.**

### 12:30 and 20:30, 1.3x text

| # | 12:30 | 20:30 | Script | Notes |
|---|---|---|---|---|
| 1–10 | 10/10 | 10/10 | Same as 1.0x (±0.1 s) | Same outcomes and toasts. One clip on a task screen: the trophy cover's wordmark loses the top of "SHIFT" (it reads "SHIH"), on the cover people are meant to share (r-1230-13-06c-results, r-2030-13-06c-results). On the Going list, power splits from its unit: "583 / bhp", "197 / bhp" (r-2030-13-07a-going). The ActionBar status on a going meet wraps to two lines, which is fine (r-1230-13-10b-sunday). The onboarding placeholder, Add a mod segments and drive credits all fit. |

## 2. Time to understand

| Measure | Result | Target | Pass? |
|---|---|---|---|
| TTU-1 | About 3 s. "What's on tonight near you. Go with your car." over a photo, with "See tonight's meets near you / Say you're going, with your car / Check in and vote for the best build" under it. That covers car meets, near me and tonight, and going with my car (x01). | ≤ 5 s | Pass |
| TTU-2 | About 26 s from Try the demo to the first I'm going tap (the 18+ tick, the Fiesta choice, step 2, then I'm going on the live card). | ≤ 60 s | Pass |

**Hesitations over 5 s:**
1. Task 10: on a meet I'm going to, the ActionBar has only "Going · location at 09:00" and Remind me.
   Leaving is in `···`. I tried the status line and the GOING pill first. *Where, not wording.*
2. Task 6: asked to vote for the best car, the sheet opens on Best in show. Is this the one? *Order
   and wording.*
3. Task 1: five Fiesta ST versions. Which one is mine? *A choice, not wording.*

**Shorter hesitations (under 5 s):**
* "Leave it / Keep it" in the Can't make it confirm: in everyday British English "leave it" also means
  "don't bother, leave it as it is". *Wording* (the rulebook prescribes these labels).
* "Waiting for @jordST to accept" for about 3 s.
* Back from the chat skips the profile and the going list and lands on the event: quicker, but not
  where I expected.
* Add a mod has both DONE in its header and a primary "Add Cold air intake". Does Done save?

## 3. Scores

### Clarity: **7**

| Criterion | Result | Evidence |
|---|---|---|
| C1 TTU-1 ≤ 5 s | **Met** | About 3 s. |
| C2 10/10 at both times | **Met** | 10/10 at 12:30 and 20:30, at 1.0x and 1.3x. No hints. |
| C3 inside the limits; TTU-2 ≤ 60 s | **Met** | The closest are task 9 (55 of 120 s), task 10 (35 of 45 s) and task 7 (30 of 60 s). TTU-2 is about 26 s. |
| C4 no 4.12 word | **Met** | A text scan of every task screen in all four runs finds only "+150 rep" (event after check-in) and "Level 1 · Newcomer" (Me), both owner exceptions. "Can't find it? Enter it yourself" is on onboarding, which isn't a first-level screen, and isn't the banned "Find" label. |
| C5 each fact said once | **Missed** | On a meet I'm going to with the location hidden (task 10), the location time is said twice: "Location shows at 09:00." under the time, and "Going · location at 09:00" in the ActionBar (x45, r-1230-13-10b-sunday). 4.3 asks for the pill and 4.11 for the line, so the rulebook itself creates the repeat. Outside the tasks, the build page says the class twice: the badge by the name and a "B · CLASS" tile (c-build). |
| C6 no dead ends; errors say what to do | **Met** | Every error says what to do: 18+, "Tap the map to place the meet point.", "Pick a part, or tap Something else to type one.", "Write a message first." No disabled primary. Bad links (`/nope-nothing`, `/event/…`, `/user/…`, `/chat/…`, `/build/…`) show a not-found screen with "See tonight's meets", and back goes to the owning tab. Back from a changed host form asks "Discard this meet? · Discard it / Keep editing". |

Anchor 6 is fully true: purpose clear in 10 s, 10/10 tasks, at most 2 wording hesitations over 5 s.
Anchor 8 has 5 of its 6 lines (only C5 is missed). All of 6 and most of 8 gives **7**.

### Coherence: **7**

Rulebook exceptions on the screens met in the tasks: **1** (section 4 below), so anchor 6 (1–5)
applies. No line of anchor 4 is true: there is one back style (the chevron), the crop screen's ✕ is
the Cancel 4.5 allows on a form that loses work, and the drive view's End is the owner exception.

Coherence 8+ criteria:
* **K1** zero exceptions: **missed** (1: the live time wording).
* **K2** one selector per job: **met**. One SegmentedControl per screen (Map/List, Feed/People/Chats,
  Car/Bike, Engine/Chassis/Wheels/Looks, All/Meets/Places/People), never nested. ChoiceGroup pills
  for meet type, How far and Open in. DateTimeSheet for the start. SearchField for make and model.
  Car/Bike is borderline: it is a choice in a form, but it switches the search list under it.
* **K3** one look per kind of thing: **missed**.
  * An event row looks three ways. Tonight list: "Sun 10:00 · about 1 mi from home", one meta line,
    no kind. Search: "Meet · Sun 10:00", then a bolder second line "about 1 mi from home". Me:
    "Meet · Sun 10:00" with no distance and a white glyph instead of grey (k-tonight-list-rows,
    k-search-rows, k-me-rows).
  * The live time is "Until 23:00" on the Tonight card and event page, "Live · until 23:00" on
    Search and Me.
  * The HOSTING pill is green on the "It's up" page and grey on the meet page (x42-posted,
    k-open-meet).
  * On the Going list I'm "You" with no @handle (x20).
  * Builds are always ClassBadge + name + bhp, and the chat header is now avatar + @handle.
* **K4** every screen matches a template: **met** on the task screens as far as I can see. The chat
  is now back + `···` with an avatar row (T3 shape, composer in the ActionBar), and the place
  picker's primary is in the ActionBar.
* **K5** one power number: **met**. 197 bhp, then 201 bhp after the mod on Garage, Me and the build
  page.

That's 3 of 5 lines of anchor 8 (K2, K4, K5), which is most of them, with all of anchor 6, so **7**.

### Look: **5**

* **L1** a photo or real map above the fold on every first-level screen at 375x667: **met**.
  Tonight map and list, Community feed, Garage, Me and every event page (x07b, e-01, e-08, x28,
  x51, x08).
* **L2** the look checklist on every screen: **missed**.
  * Clipping at 1.3x on a task screen: the trophy cover's wordmark, "SHIFT" cut at the top
    (r-1230-13-06c-results).
  * Misalignment at 1.3x: power split from its unit on the Going list, "583 / bhp"
    (r-2030-13-07a-going).
  * Overlap at 1.0x: the check-in burst ring spills past the left edge of the "+150 rep" card for a
    moment (x12a).
  * Placeholder art: the onboarding car row shows an outline car, not a photo (x05). It's not a
    first-level screen.
* **L3** a real dark map on web with the same pins and clusters: **met**. Stadia dark tiles, a "3"
  cluster, the live pin with its pulse and the area circles.
* **L4** the four motion moments: **met**. Going: the pin animates and the toast comes at once.
  Location shows: the "LOCATION SHOWN" card on the map. Check in: the ring bursts into the tick.
  Trophy: the results cover appears after Done, with sparks round it.
* **L5** three screens I'd share: **met**: the trophy cover at 1.0x (x16), the Garage card with the
  Fiesta photo (x28) and the Tonight map with the live pin (x07b). The demo photos are still daytime
  street shots.

Anchor 4's line, "visible clipping, overlap or misalignment … at 1.3x text", is true: the trophy
cover's wordmark. So anchor 6's "consistent and tidy" can't be fully true. All of 4 and most of 6
gives **5**, the top of the band. With the wordmark fixed at 1.3x (and bhp kept with its number),
anchor 6 holds, and with L1, L3, L4 and L5 met that would make **7**.

### 8+ criteria summary

| Met | Missed |
|---|---|
| C1, C2, C3, C4, C6, K2, K4, K5, L1, L3, L4, L5 | **C5, K1, K3, L2** |

## 4. Rule breaks, counted

Owner exceptions not counted:
* "+150 rep" after check-in;
* the level line on Me;
* the ladder sheet with its level names (including "Legend");
* the drive view's End as its back.

**On screens met in the tasks: 1.**

| # | Rule | Screen | Break | Shot |
|---|---|---|---|---|
| 1 | 4.10 | Tonight map sheet card and live event page (task 2) | The live meet's time is "Until 23:00", with "LIVE · MEET" as a separate eyebrow. 4.10 says "Live · until 23:00", which is what Search and Me show. | x07b, x08, k-search-rows |

**Outside the tasks: 3.**

| # | Rule | Screen | Break | Shot |
|---|---|---|---|---|
| 2 | 4.6 | Search, no results ("zzqx") | "Nothing for 'zzqx' / Try a town, or a car like 'Golf'." is good, but it ends with a platform note: "Full address search works in the iPhone app." | e-07-search-none |
| 3 | 4.6 | Not-found screens (`/nope-nothing`, `/event/…`, `/user/…`, `/chat/…`, `/build/…`) | The whole-screen empty state has no glyph (Notifications has one), and it sits in two places: centred on the unknown-page screen, at the top on the four "… not found" screens. | e-20-bad_nope-nothing, e-20-bad_event_does-not-exist |
| 4 | 4.11 | My hosted meet, opened after posting | The shown location is "Tamworth meet point." The pattern is "{Meet point name}, {Town}." | k-open-meet |

**Total: 4** (1 on task screens).

**Borderline, not counted:**
* "Location shows at 09:00." plus the "Going · location at 09:00" pill on the same screen: both are
  what 4.11 and 4.3 ask for, so I counted it under C5, not as a break.
* Back from a chat opened from a profile goes to the event, skipping the profile and the going list.
  4.2 doesn't say back must pop one screen, but it's the one place back doesn't go where you came
  from.
* The Car/Bike SegmentedControl on onboarding is a choice in a form (4.4 says ChoiceGroup), but it
  switches the search list below it.
* The Going list, Search and Notifications are pushed screens with caps titles. 4.1 only names
  detail screens (no title) and forms and settings (caps title).
* "Leave it / Keep it" is the rulebook's own wording, so I didn't count it, though it slowed me down.

Look-checklist exceptions (counted under L2, not as rulebook breaks):
* the trophy cover wordmark at 1.3x;
* bhp split from its number on the Going list at 1.3x;
* the burst ring spilling out of the rep card;
* the outline car on the onboarding row.

## 5. Problems, ranked

| # | Severity | Screen | Steps | What's wrong | Shot |
|---|---|---|---|---|---|
| 1 | Medium | Event, going, location hidden | Tonight, Sunday coffee and cars | The way out is only in `···`. The ActionBar shows "Going · location at 09:00" and Remind me, neither of which leaves. I tried the status line and the GOING pill before `···` (hesitation 1). The location time is also said twice, in the line and the pill (C5). | x45-sunday, x47-more |
| 2 | Medium | Trophy cover at 1.3x | 1.3x text, check in, vote, Done | The wordmark loses the top of "SHIFT", so it reads "NIGHTSHIH" on the cover people are meant to share (L2, anchor 4). It's what keeps Look at 5. | r-1230-13-06c-results |
| 3 | Medium | Vote sheet | Check in, Vote | Asked to vote for the best car, the sheet opens on "Vote: Best in show", and Best car is behind "Next". The page says "Vote for 3 trophies." but the sheet doesn't say there are three steps until you vote once (hesitation 2). | x13-vote, x15-best-car |
| 4 | Low | Can't make it confirm | `···`, Can't make it | "Leave it / Keep it": "leave it" also means "leave it alone". "Take me off it / Keep it" or "I can't go / Keep it" can't be misread. The labels come from rule 4.5, so the rule needs changing too. | x48-cant |
| 5 | Low | Going list at 1.3x | 1.3x, event, "11 going" | Power splits from its unit: "197 / bhp", "583 / bhp" (L2). Review 15's fix for this doesn't hold here. | r-2030-13-07a-going |
| 6 | Low | Event rows | Tonight list, Search, Me | The same event is a row in three formats (one meta line; kind plus a bold distance line; kind and no distance, with a white glyph) (K3). | k-tonight-list-rows, k-search-rows, k-me-rows |
| 7 | Low | Live time | Tonight card vs Search | "Until 23:00" on the card and event, "Live · until 23:00" on Search and Me (break 1, K3). | x07b, k-search-rows |
| 8 | Low | Chat back | Event, going list, profile, Message, back | Back from the chat skips the profile and the going list and lands on the event. It saves taps (Review 15 had four backs), but it isn't where I came from. | x27-back-from-chat |
| 9 | Low | Not-found screens | Open `/nope-nothing` and `/event/does-not-exist` | No glyph, and the block is centred on one and at the top on the others (break 3). | e-20-bad_nope-nothing, e-20-bad_event_does-not-exist |
| 10 | Low | Search, no results | Search "zzqx" | The empty state ends with "Full address search works in the iPhone app.", a platform note (break 2). | e-07-search-none |
| 11 | Low | HOSTING pill | Post a meet, then Open the meet | Green on the "It's up" page, grey on the meet page (K3). | x42-posted, k-open-meet |
| 12 | Low | Hosted meet page | Open the meet | "Tamworth meet point." without ", Town" (break 4). The host's line "People going see it at 09:00 (1 h before)." from step 4 isn't on the meet page; it says "Check-in opens at 09:30." instead. | k-open-meet |
| 13 | Low | Check-in moment | Check in | The burst ring spills past the rep card's left edge for a moment (L2). | x12a-checkin-instant |
| 14 | Low | Add a mod sheet | Garage, Add a mod | DONE in the header and a primary "Add Cold air intake" together: does Done save the pick? The power field's placeholder "4" looks like a typed value. | x30-cai-selected |
| 15 | Low | Going list | Event, "11 going" | I'm "You" with no @handle, while everyone else is avatar + @handle (K3). | x20-going-list |
| 16 | Low | Build page | Garage, tap the car | Class said twice: the badge by the name and the "B · CLASS" tile (C5, outside the tasks). | c-build |
| 17 | Low | Garage | Garage tab | "+ ADD A PHOTO" under the car card doesn't say a photo of what (the car, or a post?). | x28-garage |
| 18 | Low | Onboarding car row | Search "Fiesta ST", pick one | The picked car is an outline drawing; the Garage then shows a real photo. | x05-picked |
| 19 | Low | Demo chat reply | Message @jordST at the live meet | The random reply can be "Cheers, see you at the next one." while you're both at this one. | x26b-sent-later |
| 20 | Low | Demo photos | Any | Every photo is a daytime street shot, not a night meet. | x08, x28 |

## 6. Compared with Review 15

Review 15 scored **Clarity 7, Coherence 6, Look 5**, with 10/10 at each time and size. Review 16
scores **Clarity 7, Coherence 7, Look 5**, again with 10/10 at each time and size.

**Fixed since Review 15 (checked):**
* **"Open to: Anyone within 25 mi" (R15 #1):** my posted meet now says "Who can come: Everyone /
  Who we'll tell: drivers within 25 mi", the same as step 3 (k-open-meet).
* **Results said three times (R15 #2):** before voting the page says "Vote for 3 trophies."; after
  Done, "Results are in.", one cover and one row per other trophy. No "Results tomorrow 23:00" left.
* **Can't make it as the ActionBar button (R15 break 1, #4):** the ActionBar now has the status pill
  and Remind me, and Can't make it is in `···` with a ConfirmSheet and an Undo toast.
* **Chat header (R15 break 2, #5):** no title; an avatar + @handle row instead. The event chat
  preview has avatars.
* **Place picker (R15 break 3, #6):** Set meet point here is in the ActionBar, with a one-line hint.
* **Four backs from chat (R15 #7):** now two.
* **Sheets on the map sheet (R15 break 4, #8):** Demo night and Map layers no longer stack two grab
  handles (k-demo-sheet).
* **Search with no results (R15 #9):** it now says "Nothing for 'zzqx'" and suggests a town or a car.
  The platform note is still there (break 2).
* **1.3x layout (R15 #10, #13):** the onboarding placeholder fits, the Add a mod segments stay on
  one row, the drive credit stays one line.
* **Me Trophies (R15 #16):** after check-in it says "Winners show here when the voting at your meets
  ends.", and Meets counts 1.
* **Platform notes in Settings (R15 #15):** gone.
* **Console:** no errors in any run (Review 15 had a 502 and a Leaflet TypeError in the drive view).
* **Breaks on task screens:** down from 3 to 1.

**New or worse:**
* **C5 moved, not fixed:** with the status pill back in the ActionBar, the hidden location time is
  said twice on a going meet ("Location shows at 09:00." and "Going · location at 09:00").
* **Leaving is harder to find** (problem 1): it was a visible button, now it's only in `···`. That's
  the rule, but the task took me about 35 s of 45.
* **Back from chat skips screens** (problem 8). The fix for four backs went to the other extreme.
* **Power splits from its unit at 1.3x** on the Going list (Review 15 reported it fixed).
* **Not counted or noticed in Review 15:** the live time wording (break 1), the three event-row
  formats, the not-found screens' layout, the HOSTING pill colours, the hosted meet's location line.

**Still there:**
* **Trophy cover at 1.3x:** the wordmark still clips, now at the top of "SHIFT" rather than the end.
  The car name wraps whole ("Ford / Focus RS Mk3") instead of "i30 / N".
* **Search's platform note** and **daytime demo photos.**

**Net:**
* **Clarity** stays at 7. Only C5 is missed. Saying the hidden location time once on a going meet
  (keep the pill or the line, not both) would make C5 true and give 8.
* **Coherence** goes up from 6 to 7. One break remains on task screens and K4 is now met. Using
  "Live · until 23:00" on the Tonight card and event, and one event-row format on Tonight, Search
  and Me, would meet K1 and most of K3.
* **Look** stays at 5, held by the trophy cover's wordmark at 1.3x. Fixing it (and keeping bhp with
  its number) makes anchor 6 fully true, which with L1 and L3 to L5 met gives 7.

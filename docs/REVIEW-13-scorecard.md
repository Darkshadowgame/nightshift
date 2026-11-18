# Review 13: fixed scorecard

Scored against `REDESIGN-2.md` section 7 (fixed scorecard) and section 8 (8+ criteria). I read
sections 7 and 8 before testing. I read section 4 (the rulebook, including the 4.12 owner exception
for rep and level) and section 9 only after both task runs, to count rule breaks. I read Review 12
last, for the comparison only.

**Set-up:** `0ac6953` on main. `npx expo export --platform web --clear`, served with SPA fallback on
port 8913 (killed by PID afterwards), driven by my own headless Chromium through a Node Playwright
script: 375x667, touch and mobile emulation, @2x, Europe/London, en-GB. Two task runs with the browser
clock at 12:30 and 20:30 on Wed 18 Nov, each from cleared storage, in demo mode. Free exploration at
393x852. A 1.3x text pass at 375x667. Screenshots are in `~/nightshift-wt/r13-shots` (`e-` = first
walk-through, `run-1230-` / `run-2030-` = scored runs, `x-` = exploration at 393x852, `s13-` = 1.3x
text, `p01-`, `f-` = problem reproductions).

**Limits of this test:** seconds in the task table are what a first-time human would take, judged
from my steps, reading and taps. The script's own wall time is given alongside. 1.3x text was
simulated by scaling every text element's font size and line height by 1.3 in the page. React Native
Web ignores the OS text size, so this is a close stand-in, not the iPhone's Dynamic Type. On web,
Share opens the in-app "Share this meet" sheet (link and Copy link), which I counted as the hand-off
sheet.

## 1. Task table

The visible text at the end of every task was identical in the 12:30 and 20:30 runs, apart from the
random demo handle and the new event's id. The demo night (Fri 20 Nov, about 21:10) makes both runs
the same.

### 12:30

| # | Result | Time (human) | Script | Taps | Notes (shots) |
|---|---|---|---|---|---|
| 1 | Pass | 38 s | 11.6 s | 9 + typing | Tapping Try the demo before ticking 18+ gives "Tick the box to say you're 18 or over first." (e02). Typing "Fiesta ST" gives six rows (Mk8 facelift, Mk8, Mk8 ST-Line, Mk7 ST200, Mk7 ST180, Mk6 ST150): which one? (hesitation, e04-fiesta). Step 2 "Around Tamworth", Show me tonight. The Fiesta ST is in the Garage (e07-garage). |
| 2 | Pass | 5 s | 2.0 s | 1 | The live card leads the Tonight sheet (e06-tonight-1230). |
| 3 | Pass | 4 s | 1.8 s | 1 | Toast "You're going with your Fiesta ST Mk8 facelift" with Change. The place line becomes "Leisure park car park, Tamworth. Check-in is open." (e09-going). |
| 4 | Pass | 9 s | 4.6 s | 2 | Navigate opens the in-app drive view, End returns to the event (e11-navigate). If you tap End within about 5 s of saying you're going, the going toast is still on screen over End and swallows the tap (p01-toast-over-end). I only passed because I paused to read first. |
| 5 | Pass | 4 s | 2.3 s | 1 | Ring fills, "+150 rep · For turning up." card, "Checked in" toast (e13-checkin-250, e13-checkin-settled). |
| 6 | Pass | 55 s | 15.3 s | 9 + file | Vote opens on Best in show; I wanted the best car, so Best car tab, BMW M4. The sheet jumps to Best bike on its own (e15-voted-300). Done scrolls the page to Trophies, where winners are already shown with "6 votes" each (e16-after-done): did my vote count? (hesitation). Add a photo, file picker, crop, Use this crop, "Photo posted". The photo is first in Photos, two scrolls down (e19-scroll1). |
| 7 | Pass | 35 s | 10.9 s | 7 + typing | "11 going" row, sheet, @dan_r, Connect, "Request sent", "Waiting for @dan_r" (with a calendar icon) for about 3 s, then Message. Send, "Sent" toast covers the message bubble (e20, e21, e22-connected, e25-sent). |
| 8 | Pass | 22 s | 9.0 s | 7 | Back three times to reach the tab bar, Garage, Add a mod, Cold air intake, "Add cold air intake". Toast: "Added Cold air intake. Now 201 bhp, Class B." The card says "201 bhp · 1 mod" with the B badge (e28-added). |
| 9 | Pass | 95 s | 18.4 s | 16 + typing | "+" on Tonight (unlabelled; the same "+" in Garage adds a car), name, Starts: Change, Sun 22, 10, Done (ends at 13:00). Step 2: the preview map is covered in unexplained hexagons (e32-step2), tap it, "Somewhere in Midlands" under the crosshair (e34-picker), Set meet point here, Next gives "Name it the way people know it" (e36-step3), name it, Next. Step 3: "Anyone can come · within 25 mi of the meet": is that "anyone"? (hesitation, e37-step3). Next, Post meet, "Invites sent to 18 people nearby" toast, Share, "Share this meet" sheet (e38-step4, e39-posted-400, e40-share). |
| 10 | Pass | 30 s | 11.0 s | 10 | Done, back, List, Sunday coffee and cars (marked Going), "Can't make it", sheet, Leave it, "You're not going to Sunday coffee and cars" with Undo (e44, e45, e46-left). Me, gear, Settings: "Show me in People near you", already off (e48-settings). |

**12:30: 10/10.**

### 20:30

| # | Result | Time (human) | Script | Taps | Notes |
|---|---|---|---|---|---|
| 1 | Pass | 38 s | 11.6 s | 9 + typing | Same screens. |
| 2 | Pass | 5 s | 2.0 s | 1 | Same: "Until 23:00 · about 2 mi from home · 10 going". |
| 3 | Pass | 4 s | 1.8 s | 1 | Same toast. |
| 4 | Pass | 9 s | 4.6 s | 2 | Same drive view, "Arrive 21:15" (demo clock). Same toast-over-End risk. |
| 5 | Pass | 4 s | 2.4 s | 1 | Same. |
| 6 | Pass | 55 s | 15.3 s | 9 + file | Same flow and hesitation. |
| 7 | Pass | 35 s | 10.9 s | 7 + typing | Same. |
| 8 | Pass | 22 s | 9.0 s | 7 | "Now 201 bhp, Class B." |
| 9 | Pass | 95 s | 18.4 s | 16 + typing | "Sun 10:00–13:00 · Around Tamworth". |
| 10 | Pass | 30 s | 11.0 s | 10 | Same. |

**20:30: 10/10.** No crash and no console error on screen. The console logged one "502" for a
resource (map tile or route) in each run, not visible to the user.

## 2. Time to understand

| Measure | Result | Target | Pass? |
|---|---|---|---|
| TTU-1 | About 4 s. "What's on tonight near you. Go with your car." plus "See tonight's meets near you" covers car meets, near me / tonight and going with my car (e01-signin). | ≤ 5 s | Pass |
| TTU-2 | About 37 s from Try the demo (after the tick box) to the first I'm going tap. Script: 23.5 s including 3 s reading pauses. | ≤ 60 s | Pass |

**Hesitations over 5 s (both runs):**
1. Vote: opens on Best in show, jumps to Best bike after my vote, then Done lands on finished
   results. Caused by wording and flow.
2. Host step 2: hexagons on the map with no legend until the picker; the crosshair reads "Somewhere
   in Midlands". Caused by wording.
3. Host step 3: "Anyone can come · within 25 mi of the meet". Caused by wording.
4. Task 9 start: which "+" hosts a meet. Caused by an unlabelled icon, not wording.
5. Onboarding: which of six Fiesta ST rows is mine. Caused by choice, not wording.

**Shorter hesitations:** "Waiting for @dan_r" for about 3 s; "Arrive 21:15" against a 12:30 phone
clock (explained only behind the "Demo night" pill); the privacy switch is already off, so there is
nothing to do; "People going see it at 09:00" (what is "it"?).

## 3. Scores

### Clarity: **7**

| Criterion | Result | Evidence |
|---|---|---|
| C1 TTU-1 ≤ 5 s | **Met** | About 4 s. |
| C2 10/10 at both times | **Met** | 10/10 at 12:30 and at 20:30, no hints. |
| C3 inside the limits; TTU-2 ≤ 60 s | **Met** | Every task inside its limit (task 9 at 95 s of 120 s is the closest); TTU-2 about 37 s. |
| C4 no 4.12 word | **Met** | Text scan of every task screen finds only "Level 1 · Newcomer" on Me and "+150 rep" after check-in, both allowed. ("Legend" appears on the Levels sheet, outside the tasks; see section 4.) |
| C5 each fact said once | **Missed** | Checked-in event: "Results tomorrow 23:00" in the place line and "Demo: the results now. For real, they show tomorrow 23:00." in Trophies (e26-back1). Who can come: "Open to: Anyone within 30 mi" and "Open to any car or bike" in About (e08-event-scroll). Add a photo twice on one screen: the ActionBar and "+ Add a photo" on the Photos header (e19-scroll0). |
| C6 no dead ends; errors say what to do | **Met** | Every error says what to do next (18+, pick your car, meet point name, empty message). Bad links show a not-found screen with "See tonight's meets". |

Anchor 6 is fully true: purpose clear in 10 s, 10/10 tasks, exactly 3 wording hesitations over
5 s. Anchor 8 has 5 of its 6 lines true (only C5 is missed). "All of the lower, most of the higher"
gives **7**.

### Coherence: **4**

Rulebook exceptions on screens met in the tasks (each counted once):

1. **4.7 never over the primary.** The going toast is carried onto the drive view and sits over End,
   and it intercepts the tap (p01-toast-over-end; Playwright reports the toast "intercepts pointer
   events").
2. **4.7 3.2 s.** Toasts stay about 5.5 s (measured on the real clock: shown at 0.17 s, gone at
   5.5 s) and travel with you to the next screen: the going toast onto the drive view, the leave toast
   onto Me over "Your meets" (e47-me), the accept toast onto the chat (e24-chat).
3. **4.2 back.** The drive view (`/drive`) has no back IconButton at the top left; only END at the
   bottom right (e11-navigate).
4. **4.5 Cancel only on forms that lose work.** The "Can't make it" confirm sheet closes with
   "Cancel" (e45-cantmake), while the host discard sheet uses "Keep editing" (e52-host-back). Two
   confirm patterns.
5. **4.5 read = push.** The "11 going" list is a read-only list shown as a Sheet, and a profile is
   then pushed from inside it (e20-going-list).
6. **4.9 units.** Onboarding says "Saved to about 1 km. Never your address." Everything else is in
   miles (e05-step2; also Help and Your profile).

**6 exceptions**, inside the 6–15 band, so anchor 4 is true and anchor 6 (1–5) is not. If the owner
decides the full-screen drive view needs no back button, this becomes 5 and Coherence 6. As the
rulebook stands, it is **4**.

Coherence 8+ criteria:
* **K1** zero rulebook exceptions: **missed** (6).
* **K2** one selector per job: **missed**. Garage "+" (Add a car or bike) has a search field and,
  under it, Make and Model fields with chevrons that act as dropdowns (x-garage-plus). That is two
  selectors for one job and a dropdown for make and model. Not on a task screen, but K2 is app-wide.
* **K3** one look per kind of thing: **missed**. The trophy cover writes the class as text ("Class A")
  instead of the ClassBadge (e16-after-done). The status badge sits top left on the Tonight card
  ("CHECKED IN", e26-back2) and top right on the event hero. The profile header pairs the class badge
  with @handle, with the avatar and name on a separate line below (e21-profile).
* **K4** every screen matches a template: **met as far as visible.**
* **K5** one power number: **met**. 201 bhp everywhere after the mod.

### Look: **5**

* **L1** a photo or real map above the fold on every first-level screen at 375x667: **missed**.
  Garage and Me show a blue placeholder silhouette for your Fiesta (e07-garage, e47-me). Tonight
  (map and list), Community and the event pages lead with photos or the real map.
* **L2** look checklist on every screen: **missed**.
  * Overlap at 375x667: toasts cover content for about 5.5 s: the location card as it appears
    (f-going-strip), the attendee row after check-in (e13-checkin-settled), the message you just sent
    (e25-sent), "Your meets" on Me (e47-me).
  * Clipping at 1.3x: vote cards cut "Competitio" and "Volkswager" mid-word (s13-vote). On Me the car
    name runs over the silhouette's wheels (s13-me). The map credit wraps to two lines over the
    Tonight map (s13-tonight).
  * Sodium on content: the big filled radius circle and area circles on the Tonight, event and host
    maps (e06-tonight-1230, e39-posted-400), and the sodium "BEST IN SHOW" tag on the trophy cover.
  * Capitals on content: "HYUNDAI I30 N" on the trophy cover, where "2 mods" also wraps alone onto a
    second line (e16-after-done).
  * Onboarding step 2: a white map label is clipped at the top-right edge of the small map (e05-step2).
* **L3** real dark map on web with pins and clusters: **met, with a caveat.** The map is real and
  dark with a "3" cluster and a live pin. But at 375x667 the map is framed north of home, so both sit
  at the very top edge of the bottom sheet. You see a big orange circle and almost no meets
  (e06-tonight-1230). At 1.3x they are gone entirely (s13-tonight).
* **L4** the four motion moments: **missed**. Check-in ring and trophy cover: seen. Going: the badge
  and toast appear. Location shows: the event map animates to the pin, but under the going toast, so
  you don't see it (f-going-strip).
* **L5** three screens I'd share: **met**. The live event page (e08-event), the vote grid (e14-vote)
  and the trophy cover (e16-after-done).

Anchor 6's "placeholder art on a first-level screen" is true (Garage, Me). Its "tidy" is only partly
true. Anchor 4's line, "visible clipping, overlap or misalignment on 375x667 or at 1.3x text", is
fully true: mid-word clipping at 1.3x and toasts over content at 375x667. That is all of 4 and most of
6, so **5**.

### 8+ criteria summary

| Met | Missed |
|---|---|
| C1, C2, C3, C4, C6, K4 (as far as visible), K5, L3 (caveat), L5 | **C5, K1, K2, K3, L1, L2, L4** |

## 4. Rule breaks, counted

**On screens met in the tasks: 6.**

| # | Rule | Screen | Break |
|---|---|---|---|
| 1 | 4.7 | Event → drive view | Going toast over End, intercepting taps. |
| 2 | 4.7 | All toasts | About 5.5 s, not 3.2 s, and carried to the next screen. |
| 3 | 4.2 | Drive view | No back at the top left (End only). |
| 4 | 4.5 | "Can't make it" sheet | Closes with Cancel. |
| 5 | 4.5 | "11 going" list | A read-only list as a Sheet. |
| 6 | 4.9 | Onboarding step 2 | "about 1 km". |

**Outside the tasks: 2.**

| # | Rule | Screen | Break |
|---|---|---|---|
| 7 | 4.12 / 9.1 | Levels sheet (Me → Level 1) | "Level 8 · Legend and up". The exception allows only "rep" and "level" on the ladder sheet, not "Legend" (x-me-level). |
| 8 | 4.4 | Add a car or bike (Garage "+") | Make and Model chevron fields under a search field: a dropdown for make and model (x-garage-plus). |

**Total: 8.** Also noted but not counted: Your profile (Settings → Handle, name and home area) says
"Rough home area" and "sample people and events (marked Sample)", but nothing is marked Sample any
more (x-settings-profile). Not counted because it isn't a first-level screen and isn't exact 4.11
wording.

## 5. Problems, ranked

| # | Severity | Screen | Steps | What's wrong | Shot |
|---|---|---|---|---|---|
| 1 | High | Event, drive view | I'm going, then Navigate within about 5 s, then End | The going toast follows you onto the drive view, covers End and swallows the tap. Toasts last about 5.5 s everywhere, follow you to the next screen, and cover content (4.7). | p01-toast-over-end, e47-me |
| 2 | High | Garage, Me | Set up with any car | Your car is a blue placeholder silhouette on both first-level screens (L1). At 1.3x the name runs over it on Me. Review 12 had a real (if wrong) photo here. | e07-garage, e47-me, s13-me |
| 3 | Medium | Tonight map | Open the app at 375x667 | The map is framed north of home, so the pins and cluster sit under the sheet's top edge. What you see is a big orange radius circle, not meets. At 1.3x the map credit wraps over the map and no pin shows. | e06-tonight-1230, s13-tonight |
| 4 | Medium | Event → location card | I'm going | The location-shows motion (map to the pin) plays under the going toast, so the second of the four motion moments is never seen (L4). | f-going-strip |
| 5 | Medium | Vote sheet, Trophies | Check in, Vote, Best car, pick, Done | It jumps to Best bike on its own. Done scrolls to finished results ("6 votes" each, ticks on all three), with a demo note. "You voted" then lists "Best in show · Not voted yet". It's hard to tell whether your vote counted. | e15-voted-300, e16-after-done, e19-scroll1 |
| 6 | Medium | Event (checked in) | Check in, vote | Facts twice on one screen (C5): the results time in the place line and in Trophies; who can come in "Open to:" and in About; Add a photo in the ActionBar and in the Photos header. | e26-back1, e08-event-scroll, e19-scroll0 |
| 7 | Medium | Vote sheet at 1.3x | Larger text, Vote | Car names cut mid-word: "Competitio", "Volkswager". | s13-vote |
| 8 | Medium | Host step 2 | Host, Next | The preview map is covered in hexagons (meet-ban areas) with no legend until you open the picker. The crosshair label reads "Somewhere in Midlands". The name is required, but you only find out after Next. | e32-step2, e34-picker, e36-step3 |
| 9 | Medium | Sheets | Can't make it; 11 going | Two confirm patterns ("Cancel" here, "Keep editing" in host discard), and a read-only attendee list shown as a sheet with a push inside it (4.5). | e45-cantmake, e52-host-back, e20-going-list |
| 10 | Low | Host step 3 | Host, Next ×2 | "Anyone can come · within 25 mi of the meet" still reads like a limit, not "open to anyone" (third review running). | e37-step3 |
| 11 | Low | Drive view | Navigate | No back at the top left (4.2). "Arrive 21:15" against a 12:30 phone clock is explained only behind the "Demo night" pill. | e11-navigate |
| 12 | Low | Onboarding, Help, Your profile | Step 2 | "Saved to about 1 km" in an app that uses miles everywhere else (4.9). | e05-step2, x-help |
| 13 | Low | Levels sheet | Me, tap Level 1 | "Level 8 · Legend and up". "Legend" is a 4.12 word and not covered by the exception. | x-me-level |
| 14 | Low | Add a car or bike | Garage, "+" | A search field and Make/Model dropdowns for the same job (K2, 4.4). It differs from onboarding, which has only the search. | x-garage-plus |
| 15 | Low | Trophy cover | Vote, Done | Car name in capitals, class as text ("Class A") not the badge, "2 mods" wraps alone, a sodium tag on content, and a soft, low-resolution photo. | e16-after-done |
| 16 | Low | Tonight, event, host maps | Open any map | Sodium fills content: the large radius and area circles. | e06-tonight-1230, e44-sunday |
| 17 | Low | Demo photos | Open the live event, vote sheet | Real dealers' signs are readable on demo photos ("Murley Auto…" on the live meet hero, a Kawasaki dealer behind the R6). In a public repo, a demo shouldn't put real businesses' names next to a "car park meet-up". | e08-event, e15-voted-300 |
| 18 | Low | Header "+" | Task 9 | The unlabelled "+" means host on Tonight, add a car on Garage and New on Community. It's allowed by 4.1, but the newcomer hunts for "host". | e06-tonight-1230, e07-garage |
| 19 | Low | Settings privacy | Me, gear | Only the 40x20 toggle is tappable, not the row. The switch is already off, so "stop people near you seeing you" needs no action, which is mildly confusing. | e49-priv-tap |
| 20 | Low | Profile after Connect | Connect | "Waiting for @dan_r" shows a calendar icon. | e22-connected |
| 21 | Low | Community feed | Add a photo from the meet | The meet photo also goes to the public feed without saying so ("Photo posted" doesn't say where). | e54-feed-after-photo |
| 22 | Low | Your profile | Settings, Handle, name and home area | "Rough home area" and a stale note about events "marked Sample". | x-settings-profile |
| 23 | Low | Onboarding | Type "Fiesta ST" | Six Fiesta rows with no hint which is the common one; a white label clipped at the map edge on step 2. | e04-fiesta, e05-step2 |

## 6. Compared with Review 12

Review 12 scored **Clarity 7, Coherence 4, Look 6**, with 10/10 at each time. Review 13 scores
**Clarity 7, Coherence 4, Look 5**, with 10/10 at each time.

**Fixed since Review 12 (checked):**
* The meet point no longer leaks into the public feed post. The build line ends at "197 bhp"
  (Review 12 #1).
* The meet point stays named after check-in: "Leisure park car park, Tamworth. Voting is open until
  tomorrow 23:00." (Review 12 #2).
* Voting moves on to the next trophy instead of closing, and there is now a trophy moment in the
  tasks (Review 12 #3, L4 trophy).
* The Tonight card's I'm going is an outlined secondary, not a filled primary (Review 12 #5).
* Settings is a gear in the Me header (Review 12 #6). Task 10 no longer needs scrolling to find it.
* Host step 2 now starts with a map to tap, not a fake field (Review 12 #4, partly).
* Chat send gets a "Sent" toast. The host success uses a toast for "Invites sent", and Share opens a
  sheet (Review 12 #12, #15).
* The Add a mod sheet closes with Done. The host type is now pills (ChoiceGroup). The Levels names are
  no longer duplicated. (I saw no scrollbars over hero photos, but my run used mobile emulation,
  which hides them, so Review 12's scrollbar finding is unverified here.)
* Exceptions on task screens dropped from 9 to 6.

**New or worse:**
* Toasts now last about 5.5 s, follow you across screens, and in one case block the primary (End).
  This is the top problem and accounts for 2 of the 6 exceptions.
* Garage and Me went from a wrong stock photo to a placeholder silhouette, so L1 is now missed.
* With 1.3x text tested for the first time, the vote card clips names mid-word. Together with the toast
  overlaps, anchor 4's "visible clipping or overlap" line is fully true. That is why Look drops from 6
  to 5. Review 12 kept 6 while calling anchor 4 "technically true". It couldn't test 1.3x, and I'm
  scoring the anchor as written.
* "Legend" on the Levels sheet, and the Add a car or bike make/model dropdown (K2 now missed).

**Still there:** facts said twice (C5, now different facts), "within 25 mi" read as a limit on host
step 3, the demo clock on the drive view, "Somewhere in Midlands" in the picker, sodium on map
content, and capitals and text class on the trophy cover.

**Net:** Clarity is unchanged at 7 (only C5 stands between it and 8). Coherence stays at 4, but now
at the bottom edge of its band (6). Fixing the toast timing and placement alone would remove two
exceptions and reach 6. Look falls to 5 because of the placeholder car art and the 1.3x clipping.

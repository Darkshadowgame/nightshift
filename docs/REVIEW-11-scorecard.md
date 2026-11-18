# Review 11: fixed scorecard after Redesign 2

Scored against `REDESIGN-2.md` section 7 (fixed scorecard) and section 8 (8+ criteria). The tester
read only sections 7 and 8 before testing. Section 4 (the rulebook, including the 4.12 word list) was
read **after** all task runs were finished, only to count checklist exceptions for the scores.

## Set-up

* Commit `ac6abb3` (Redesign 2 WP-B), web export (`expo export --platform web --clear`), served with an
  SPA fallback on a local port.
* Playwright (Chromium), 375x667, cleared storage before each run, demo mode, Europe/London.
* **Run A:** browser clock 18 Nov 2026 12:30. **Run B:** browser clock 18 Nov 2026 20:30.
* Free exploration: 393x852, every tab, Settings, Help, Search, notifications, bad links, back.
* Screenshots: `~/nightshift-wt/r11-shots/` (outside the repo). `A*` = run A, `B*` = run B,
  `C-*` = exploration, `M-*` = motion frames.
* Times are newcomer seconds: the Playwright steps plus a realistic reading time per screen, rounded up.
  Hesitations are the points where a first-time user would stop to read or look for something.
* Limits of the web preview: no touch device or Dynamic Type, so the **1.3x text check was not run**.
  `navigator.share` doesn't exist in this Chromium, which matters for task 9 (see below).

## 1. Task table

The demo always runs as a Friday night, about 21:10, in both runs. Every screen matched between the two
runs **except the in-app navigation ETA**. That ETA uses the real device clock: "Arrive 12:32" in run A
and "20:31" in run B. Under 7.1, any difference between the runs fails the task where it shows up, so
task 4 fails at both times.

### Run A: 12:30

| # | Result | Time | Taps | Notes |
|---|---|---|---|---|
| 1 | Pass | 25 s | 5 + typing | Try the demo, type "Fiesta ST", pick from 5 near-identical "Ford Fiesta ST" rows (hesitation: which one?), Next, Show me tonight. Fiesta is in the Garage (A08-garage). The demo starts without ticking the 18+ box. |
| 2 | Pass | 4 s | 1 | The live card is in the bottom sheet on Tonight. The pins are hidden behind the sheet (A01e-tonight). |
| 3 | Pass | 3 s | 1 | One car, so no picker. Toast: "You're going with your Fiesta ST Mk8 facelift" (A03-going-tap). |
| 4 | **Fail** | 10 s | 2 | Navigate opens the in-app drive and End returns to the event (A04*). Fails on the run-difference rule: ETA "12:32" here, "20:31" in run B, while the rest of the demo says ~21:10. The route is a straight orange line through buildings. |
| 5 | Pass | 3 s | 1 | Tick burst (M-checkin-0..3) and toast "Checked in (demo: no location check)". The toast carries a demo note. |
| 6 | Pass | 40 s | 7 + file | Hesitation over 5 s: "Best in show · 1 of 3" opens when I was asked for the best car. It moves on to "Best car · 2 of 3" with no confirmation of the first vote. The photo goes straight to the file picker, then to a heavy crop screen (6 shapes, Rotate, Reset, Use, Skip, Cancel). Shown in Photos (A06g-post). |
| 7 | Pass | 30 s | 6 | Going list, then @dan_r, who is **already "Connected"**, so the "connect" part can't be done with the most obvious person (hesitation). With @jordST: Connect, then "Request sent. Waiting…" pill, then auto-accepted in about 5 s, then Message, then sent (A07*). |
| 8 | Pass | 15 s | 3 | Garage, Add a mod, Cold air intake chip, Add. Toast reads "Now 201 bhp, Class B". The answer is easy to read. |
| 9 | **Fail** | 75 s | 14 + typing | Posted at Sun 10:00–13:00. "Open to anyone" is the default but is worded "Anyone within 25 mi · 18 people" (hesitation). The date picker shows "Today 20" while the phone says Wed 18 (hesitation). **Share opens no share sheet**: "Couldn't open sharing on this device. Send people the meet's name and time instead." There is no copy-link fallback. On the event page, Share says only "Couldn't open the share sheet." (A09l, A09n). Wrong outcome, so fail. |
| 10 | Pass | 25 s | 4 | The coffee meet is **not** marked going in the demo, so "sort that out" is already done. A newcomer stops to work out why it says "I'm going" (hesitation). Privacy: Me, Settings, scroll to "Show me in People near you" (A10d-settings). |

**Run A: 8/10.**

### Run B: 20:30

| # | Result | Time | Taps | Notes |
|---|---|---|---|---|
| 1 | Pass | 25 s | 5 + typing | Same as run A (B01-tonight). |
| 2 | Pass | 4 s | 1 | Same text and order as run A (B02-event). |
| 3 | Pass | 3 s | 1 | Same (B03-going). |
| 4 | **Fail** | 10 s | 2 | ETA "20:31", different from run A (B04-nav). |
| 5 | Pass | 3 s | 1 | Same (B05-checkin). |
| 6 | Pass | 40 s | 7 + file | Same flow and the same hesitation (B06-photo). |
| 7 | Pass | 30 s | 6 | @jordST, connect, message. The auto-reply "I'll be there." arrives (B07-chat). |
| 8 | Pass | 15 s | 3 | Same toast (B08-mod). |
| 9 | **Fail** | 75 s | 14 + typing | Same share failure (B09-share). The date picker is identical ("Today 20"). |
| 10 | Pass | 30 s | 6 | Also tested the real leave path after marking going. Leave is only under `···`, then "Can't make it", then a sheet with Leave it / Keep it / Cancel, then an Undo toast (B10c..f). That took 8 s of hunting, because the ActionBar shows only a "Location at 09:00" pill and Remind me. |

**Run B: 8/10.**

Same tasks pass and fail at both times: 1, 2, 3, 5, 6, 7, 8, 10 pass; 4 and 9 fail.

## 2. Time to understand

| Measure | Result | Target | Pass? |
|---|---|---|---|
| TTU-1 | ~4 s. "What's on tonight near you. Go with your car." plus "See tonight's meets near you" covers car meets, near me / tonight, and going with my car. | ≤ 5 s | Pass |
| TTU-2 | ~30 s from Try the demo to the first I'm going tap. | ≤ 60 s | Pass |

## 3. Scores

### Clarity: **6**

* C1 TTU-1 ≤ 5 s: **met**.
* C2 10/10 at both times: **missed**. 8/10 at each time (tasks 4 and 9).
* C3 inside time limits, TTU-2 ≤ 60 s: **met**. Every task is inside its limit, including the failed ones.
* C4 no 4.12 word: **missed**. "+150 rep" on the event page after check-in (A05-checkin); "Level 1 ·
  Newcomer" on Me (A10c-me); padlock glyphs on Tonight map pins (C-Tonight) and a padlock animation on
  the event map when you go (M-going-0). 4.11 bans "padlock".
* C5 each fact said once: **missed**. On the event page, the area is said twice ("Until 23:00 · Around
  Tamworth" then "Around Tamworth. The meet point shows…"). After check-in, "checked in" is said four
  times on one screen: badge, status line, big card, toast. Step 2 of the host form shows its error
  twice. The 18+ / Terms checkbox appears on the sign-in screen and again on the email screen.
* C6 no dead ends, every error says what to do: **missed**. `/drive?kind=event&id=…` with no history
  shows "Nothing to navigate to" and a Back button that does nothing (C-bad-7). Event-page Share error
  "Couldn't open the share sheet." gives no next step.

Anchor 6 is fully true: purpose clear in 10 s, 8/10 tasks pass, and exactly 3 wording hesitations over
5 s ("Best in show 1 of 3" for "best car", "Anyone within 25 mi" for "open to anyone", "Today 20" on a
Wednesday). Only 2 of the 6 lines for anchor 8 are met, so it is not "most of 8": **6**.

### Coherence: **4**

Rulebook exceptions on screens met in the tasks (each is counted once):

1. 4.12 "rep" on the event page.
2. 4.12 "level" on Me.
3. 4.11 padlock glyph on Tonight pins and the event map.
4. 4.9 one meet, four distances. Car park meet-up is "about 2 mi" before going, "1.8 mi from home"
   after going, and "2.2 mi from home" in Search. The host's own meet is "under 1 mi from home" on
   Tonight but "2.1 mi from home" in Search.
5. 4.11 the hosted event says "Midlands" in one place and "Around Midlands" in another
   (A09k vs A09m).
6. 4.10 "Meet · Started 20:30" on Me is not wording from the time rules.
7. 4.3 the crop screen has one primary and four secondaries (Skip, Cancel, Rotate 90°, Reset).
8. 4.4 Add a mod: picking one part from 8 chips is a chip used as a radio, with more than 5 options.
9. 4.4 Crop "Shape": 6 pills in a one-of-many choice (more than 5, should be a list).
10. 4.5 the "Can't make it" sheet has both Cancel and Keep it.
11. 4.7 voting gets no toast. Each vote silently moves to the next category.
12. 4.6 / 4.7 a demo note in a toast: "Checked in (demo: no location check)".
13. K3 a build is not always ClassBadge + name + bhp. The going list uses text "Class A · Hyundai
    i30 N · 311 bhp". The Search person row shows the badge with no bhp.
14. K4 two step-indicator templates: "STEP 1 OF 2" caps in the header (onboarding) vs a small
    "Step 1 of 4" in the body (host form).

That makes 14 exceptions, inside the 6–15 band. The two back styles are also present (header back plus
a body "Go back" button on every not-found screen, and a body-only Back on the drive not-found).
Anchor 4 is true and anchor 6 is not. K1, K3 and K4 are **missed**. K2 is **missed** (chips used as
radios). K5 is **met**: one bhp number per build everywhere seen. **4**.

### Look: **5**

* L1 photo or real map above the fold on every first-level screen: **missed**. Garage and Me show a
  grey car silhouette for the user's car (A08-garage, A10c-me). A hosted event's page shows a drawn
  vector placeholder (grid lines and a dot), not the real map (A09n). Tonight map and list, Community
  and the demo event pages are good.
* L2 look checklist: **missed**. "Search meets, pla…" is cut off at 375. The Add-a-mod primary is
  clipped by the sheet bottom at 375x667 (A08c-cai). A white rectangular focus ring sits inside the
  rounded search pill (A01b, C-search). The map credit text runs under the header on "Place the meet
  point" (A09f). "Checked In" is in title case. At the small meta size, "mi" reads as "ml"
  ("about 2 ml", A01e, C-search-empty).
* L3 real dark map on web with pins and clusters: **partly**. The map is real, dark and good. Pins don't
  cluster: at the default zoom, five hex and padlock pins pile on top of each other over Tamworth
  (C-Tonight).
* L4 four motion moments: **missed**. Going (padlock opens on the map), location shows and the check-in
  burst were seen (M-*). No trophy moment happens in the tasks, because results come "at 23:00
  tomorrow".
* L5 three screens to share: **met**. Tonight list (C-tonight-list), the live event page (A02-event)
  and the vote sheet (A06-vote) are good enough to post.

Anchor 4's line (visible overlap or clipping at 375x667) is true: pins overlap, the placeholder and the
sheet button are clipped, and the focus ring is out of line. Most of anchor 6 holds: the screens are
consistent, there's placeholder art on a first-level screen, and they are mostly tidy. **5**.

### 8+ criteria summary

| Met | Missed |
|---|---|
| C1, C3, K5, L5 (L3 partly) | C2, C4, C5, C6, K1, K2, K3, K4, L1, L2, L4 (L3 clusters) |

## 4. Problems, ranked by severity

| # | Severity | Screen | Steps | What's wrong | Shot |
|---|---|---|---|---|---|
| 1 | High (fails task 9) | Host success, Event | Host a meet, Post, Share | On web, Share does nothing useful. There's no copy-link fallback, and the event-page error gives no next step. | A09l-share, A09n-event-share |
| 2 | High (fails task 4) | In-app drive | Event, Navigate | The ETA uses the real clock (12:32 / 20:31) while the demo night is Friday ~21:10, so the two runs differ. The route is a straight line through buildings. | A04-navigate, B04-nav |
| 3 | High | Drive not-found | Open `/drive?kind=event&id=x` cold | Dead end: Back does nothing, and there is no tab bar or header. | C-bad-7 |
| 4 | High | Tonight map, Event map | Open Tonight; tap I'm going | Padlock glyphs on pins and a padlock animation, banned by 4.11. Pins don't cluster and pile up over Tamworth. | C-Tonight, M-going-0 |
| 5 | Medium | Tonight, Event, Search | Compare the same meet across screens | The same meet shows different distances (about 2 / 1.8 / 2.2 mi; under 1 / 2.1 mi). In the small meta font, "mi" looks like "ml". | A01e, C-search-empty |
| 6 | Medium | Vote sheet | Checked in, Vote for best in show | Opens on "Best in show" when users think "best car". It auto-advances with no toast or confirmation. After voting, the card still says "Vote for the best builds". | A06-vote, A06b-voted, A06d |
| 7 | Medium | Event (going, not live) | Go to Sunday coffee, try to leave | Leaving is buried in `···`. The ActionBar has only a status pill and Remind me. The demo doesn't pre-set "going" for the meet task 10 refers to. | B10c, B10d |
| 8 | Medium | Event (checked in), Me | Check in; open Me | Banned words "+150 rep" and "Level 1 · Newcomer". The demo note sits in the check-in toast. | A05-checkin, A10c-me |
| 9 | Medium | Garage, Me, hosted event | After set-up | Placeholder silhouette and a fake vector map above the fold on first-level screens. | A08-garage, A10c-me, A09n |
| 10 | Medium | Host step 1, step 3 | Host a meet, Starts | "Today 20" on a Wednesday (the demo's Friday leaks into the picker with no hint). "Anyone within 25 mi · 18 people" doesn't read as "open to anyone". Ends shows "Tonight 01:00". | A09b-start, A09h-step3 |
| 11 | Medium | Event header and body | Open any event | The location or area is said twice. After check-in, "checked in" is said four times. | A02-event, A05-checkin |
| 12 | Low | Going list, Search people | Event, N going | Builds shown as "Class A ·" text instead of a ClassBadge; the Search row has no bhp. | A07-going-list, C-search-golf |
| 13 | Low | Photo crop | Add a photo | 6 shape pills plus 5 buttons. Too heavy for "add a photo from the meet". | A06f-photo |
| 14 | Low | Add a mod sheet | Garage, Add a mod | Chips used as single choice; the primary is clipped at 375x667; the chips reflow when one is picked. | A08c-cai |
| 15 | Low | Profile (demo) | Going list, @dan_r | The most obvious person is already "Connected", so "connect" can't be done. @jordST's photo is on the event, but his profile says "No posts yet". | A07b-profile, A07h-wait |
| 16 | Low | Community feed | After posting a meet photo | The public feed post names the meet point ("Leisure park car park"), which 4.11 says only people going see. Check this is intended. | C-Community |
| 17 | Low | Me | Host a meet, open Me | "0 Hosted" while "Hosting" the Sunday meet. | A10c-me |
| 18 | Low | Search, onboarding inputs | Focus a search field | A white rectangular focus ring inside the rounded pill; the Tonight search placeholder is truncated. | A01b-typed, C-search-empty |
| 19 | Low | Sign-in | Tap Try the demo | The 18+ checkbox is ignored by the demo and repeated on the email screen, so it looks optional. | 00-first, C-signin-unticked |
| 20 | Low | Place the meet point | Host, Choose on the map | The map credit text sits under the header bar. "Address search works in the iPhone app" is a preview note in the UI. | A09f-picker |

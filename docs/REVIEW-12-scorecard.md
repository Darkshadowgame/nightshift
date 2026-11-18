# Review 12: fixed scorecard

Scored against `REDESIGN-2.md` section 7 (fixed scorecard) and section 8 (8+ criteria). I read
sections 7 and 8 before testing. I read section 4 (rulebook, including the 4.12 owner exception for
rep and level) and section 9 only after both task runs, to count rule breaks. I read Review 11 last,
for the comparison only.

**Set-up:** `fc04b98` on main. `npx expo export --platform web --clear`, served with SPA fallback on
port 8712 (killed by PID afterwards), driven with Playwright. Tasks ran at 375x667, with the browser
clock at 12:30 (run A) and 20:30 (run B), Europe/London, from cleared storage each time, in demo mode.
Then I explored freely at 393x852. Screenshots are in `~/nightshift-wt/r12-shots` (`a-` = run A,
`b-` = run B, `c-`/`d-`/`e-` = exploration).

**Limits of this test:** the browser had no touch emulation (mouse clicks only). On web, Share copies
the link and shows "Link copied"; no native share sheet can open, so I counted that as the hand-off
sheet. I did not test 1.3x text, because React Native Web ignores the OS text size, so that part of L2
is unverified. Seconds are what a first-time human would take, judged from my steps and reading time,
not from tool latency.

## 1. Task table

### Run A: 12:30

| # | Result | Time | Taps | Notes (shots) |
|---|---|---|---|---|
| 1 | Pass | 30 s | 6 + typing | If you tap Try the demo before ticking 18+, a clear red line says what to do (a02). Type "Fiesta ST" and get 5 rows: Mk8 facelift, Mk8, Mk8 ST-Line, Mk7 ST200, Mk7 ST180. Which one? (short hesitation, a04). Next, then Where's home ("Around Midlands"), then Show me tonight. The Fiesta is in the Garage (a24). |
| 2 | Pass | 4 s | 1 | The live card sits in the Tonight bottom sheet over a real map (a07). |
| 3 | Pass | 2 s | 1 | Toast: "You're going with your Fiesta ST Mk8" with Change. The place appears: "Leisure park car park, Tamworth. Check-in is open." (a09) |
| 4 | Pass | 6 s | 2 | In-app drive view with a real route, then End takes you back to the event (a10, a11). ETA shows 21:16, demo time, not the 12:30 phone clock. |
| 5 | Pass | 2 s | 1 | Check-in burst, "+150 rep" card and "Checked in" toast (a12). |
| 6 | Pass | 25 s | 4 + file | Vote opens on "Best in show". I was asked for the best car, so I went for the Best car tab. Tapping a car voted Best in show and closed the sheet (hesitation over 5 s, a13, a14). Then: file picker, crop, Use this crop, posted, and shown first in Photos with a "Photo posted" toast (a16, a17). |
| 7 | Pass | 30 s | 5 + typing | Going list, @jordST, Connect, "Request sent" (toast and pill), then auto-accepted in about 4 s, Message, Send (a18–a23). |
| 8 | Pass | 12 s | 4 | Garage, Add a mod, Cold air intake, then "Add cold air intake". Toast: "Added Cold air intake. Now 201 bhp, Class B." Easy to read (a25–a27). |
| 9 | Pass | 75 s | 14 + typing | +, name, Starts: Change, Sun 22, 10, Done, Next. Step 2: "Choose it on the map first" looks like a text field. Choose on the map, Set meet point here, Next, then an error ("Give the meet point a name") whose red line covers the helper text. Name it, Next. Step 3: "Open to anyone within 25 mi": is that anyone? (hesitation). Next, Post meet, Share, "Link copied" (a28–a38). |
| 10 | Pass | 30 s | 6 | List, Sunday coffee and cars (marked Going), "Can't make it" in the ActionBar, sheet, Leave it, toast with Undo (a41–a43). Privacy: Me has no settings icon, so scroll to Settings at the bottom of Me (hesitation over 5 s), then scroll to "Show me in People near you" (a44–a46). |

**Run A: 10/10.**

### Run B: 20:30

| # | Result | Time | Taps | Notes |
|---|---|---|---|---|
| 1 | Pass | 30 s | 6 + typing | Same screens (b-01..b-03). |
| 2 | Pass | 4 s | 1 | Same text: "Until 23:00 · about 2 mi from home · 10 going" (b-04). |
| 3 | Pass | 2 s | 1 | Same toast (b-05). |
| 4 | Pass | 6 s | 2 | Same drive view. ETA 21:15 (demo clock), not the 20:30 phone clock (b-06). |
| 5 | Pass | 2 s | 1 | "You're checked in. Voting is open until 23:00 tomorrow." Same (b-07). |
| 6 | Pass | 25 s | 4 + file | Same flow and same hesitation (b-08). |
| 7 | Pass | 30 s | 5 + typing | Same flow (b-09). |
| 8 | Pass | 12 s | 4 | "Added Cold air intake. Now 201 bhp, Class B." (b-11) |
| 9 | Pass | 75 s | 14 + typing | Same check-and-post text (b-13, b-14). |
| 10 | Pass | 30 s | 6 | Same; the privacy switch was found (b-15, b-16). |

**Run B: 10/10.** Pixel diffs between the runs differ only in map tiles and animation frames. The
demo night (Fri 20 Nov) makes both runs the same.

## 2. Time to understand

| Measure | Result | Target | Pass? |
|---|---|---|---|
| TTU-1 | About 3 s. "What's on tonight near you. Go with your car." plus "See tonight's meets near you" covers car meets, near me / tonight and going with my car (a01). | ≤ 5 s | Pass |
| TTU-2 | About 35 s from Try the demo (with the tick box) to the first I'm going tap. | ≤ 60 s | Pass |

**Hesitations over 5 s (both runs):**
1. Vote sheet opens on "Best in show" when asked for the best car. Caused by wording.
2. Host step 2: "Choose it on the map first" in a field, and the area is "Midlands". Caused by wording.
3. Host step 3: "Open to anyone within 25 mi". Is that "anyone"? Caused by wording.
4. Settings sits at the bottom of Me, below the fold. Caused by layout.

**Shorter hesitations:** which Fiesta ST row to pick; waiting about 4 s for the connect request to be
accepted; the drive ETA (21:16) doesn't match the phone clock unless you tap "Demo night".

## 3. Scores

### Clarity: **7**

| Criterion | Result | Evidence |
|---|---|---|
| C1 TTU-1 ≤ 5 s | **Met** | About 3 s. |
| C2 10/10 at both times | **Met** | 10/10 at 12:30 and at 20:30. |
| C3 inside the limits; TTU-2 ≤ 60 s | **Met** | Every task is well inside its limit; TTU-2 is about 35 s. |
| C4 no 4.12 word | **Met** | A text scan of Tonight (map and list), Community, Garage, Me, two event pages, a profile, Settings, Search and Help finds only "Level 1 · Newcomer" on Me and "+150 rep" after check-in, both allowed by the 4.12 exception. |
| C5 each fact said once | **Missed** | Sunday event: "Location shows at 09:00." in the body and the "Location at 09:00" pill (a41). Connect: "Request sent" toast plus "Request sent. Waiting for @jordST." bar (a20). After check-in: "CHECKED IN" badge, "You're checked in" line and "Checked in" toast (a12). |
| C6 no dead ends; errors say what to do | **Met** | Every error says what to do next (18+, meet point name). Bad links go to a not-found screen with a way out. `/drive` with a bad id goes to Tonight. |

Anchor 6 is fully true: purpose clear in 10 s, 10/10 tasks pass, and exactly 3 wording hesitations
over 5 s. 5 of anchor 8's 6 lines are true; only C5 is missed. "All of the lower, most of the higher"
gives **7**. It is not 8, because C5 fails on three task screens.

### Coherence: **4**

Rulebook exceptions on screens met in the tasks (each counted once):

1. **4.3** The Tonight sheet card carries a filled sodium "I'm going" primary. Cards never carry a
   primary (a07).
2. **4.11** After check-in, the event header goes back to "Until 23:00 · Around Tamworth" and the meet
   point line ("Leisure park car park, Tamworth") disappears. Once shown, the meet point should stay
   named (a09 vs a12).
3. **4.11** For a live meet you're not going to, the line says "The meet point shows to people going."
   That is not glossary wording (a08).
4. **4.10** "Voting is open until 23:00 tomorrow" and "Results at 23:00 tomorrow". The time rule form
   is "Tomorrow 23:00" (a12, a14).
5. **4.4** Host form Type (Meet / Cruise / Rolling meet) uses a SegmentedControl for one choice of
   many in a form; that should be a ChoiceGroup (a28).
6. **4.4** Settings "Open in" (Nightshift / Apple Maps / Google Maps / Waze) uses a SegmentedControl
   for a setting. "Google Maps" also wraps onto two lines (a46).
7. **4.5** The Add a mod picker sheet closes with "Cancel". Picker sheets close with Done; Cancel is
   only for forms that lose work (a25).
8. **4.7** Sending a chat message gets no toast. "sent" is on the toast list (a23).
9. **4.7** After posting a meet, "Invites sent to 18 people nearby", and then "Link copied", show as an
   inline card in the body that swaps its text, not as a toast (a37, a38).

**9 exceptions**, inside the 6–15 band, so anchor 4 is true and anchor 6 (1–5) is not.

Outside the tasks (not counted in the score, listed for the backlog):
* 4.2: every not-found screen has a body "Go back" button (c-07..c-09).
* 4.2: back from the host form with changes gives three exits (Stay, Keep draft, Discard it) instead
  of Discard it / Keep editing. On reload, the browser's own "Leave site?" dialog also appears (e-04).
* 4.10: relative times without a clock time: Chats "4m", "24m", Feed "1m", Forum "20h", "1d", "2d"
  (e-01, c-02, d-03).
* 4.4: Forum filters have an "All" chip. In a ChipGroup, nothing picked means everything (d-03).

Coherence 8+ criteria:
* **K1** zero rulebook exceptions: **missed** (9).
* **K2** one selector per job: **met** by its stated test. No Chip used as a radio, no nested
  SegmentedControl, no typed date, no make dropdown. The SegmentedControl misuse is counted under K1.
* **K3** one look per kind of thing: **missed**. The same meet is "GOING" on the Tonight card but
  "CHECKED IN" on its page and on Me (a39 vs a12, d-07). Event, person and build looks are otherwise
  consistent.
* **K4** every screen matches a template: **met as far as visible**. The step indicators now match.
* **K5** one power number: **met**. 201 bhp everywhere after the mod.

### Look: **6**

* **L1** photo or real map above the fold on every first-level screen at 375x667: **met**. Tonight
  map and list, Community, Garage, Me and the event pages all lead with a photo or a real map. The
  hosted meet shows a real map. One caveat: "your" Fiesta ST Mk8 is shown with a stock photo of a black
  Mk7, the same photo as @jordST's profile hero (a24, a19).
* **L2** look checklist on every screen: **missed**.
  * The web scrollbar overlaps the right edge of hero photos on the event page, profile, Settings,
    host form and onboarding results (a08, a19, a28, a04).
  * The host step 2 error line covers the helper text above the ActionBar (run A; screenshot
    overwritten, so it needs a reshoot).
  * Sodium is used on content, not only the primary and selected states: the "MEET" type label on the
    event page and the category hexagons in Search (a41, c-11).
  * The privacy blur block on the Sunday hero sits right after the word "and" in the title, so it looks
    like a smudge (a41).
  * The vote card breaks "Hyundai i30" / "N" over two lines (a13).
  * The time picker uses three different selected looks in one sheet: day outlined, hour tinted,
    minutes filled (a30).
  * 1.3x text is untested.
* **L3** real dark map on web with pins and clusters: **met**. A "3" cluster shows, plus live and
  area circles (a07).
* **L4** the four motion moments: **missed**. The going toast, the location appearing and the
  check-in burst were seen. No trophy moment happens in the tasks, because results come "at 23:00
  tomorrow".
* **L5** three screens I'd share: **met**. The live event page, the in-app drive view (a10) and the
  Community feed photo card (c-02).

Anchor 4's line (visible overlap at 375x667) is technically true, because of the scrollbar overlap and
the error overlap. But the app is consistent, photo-led and mostly tidy, so anchor 6 holds. Only 3 of
anchor 8's 5 lines are met, and the two missed ones (L2, L4) are core to it. That is not "most of 8",
so: **6**.

### 8+ criteria summary

| Met | Missed |
|---|---|
| C1, C2, C3, C4, C6, K2, K4 (as far as visible), K5, L1, L3, L5 | **C5, K1, K3, L2, L4** |

## 4. Rule breaks, counted

* **On screens met in the tasks: 9** (listed under Coherence: 4.3 ×1, 4.11 ×2, 4.10 ×1, 4.4 ×2,
  4.5 ×1, 4.7 ×2).
* **Outside the tasks: 4 more** (4.2 ×2, 4.10 ×1, 4.4 ×1).
* **Total seen: 13.** None of them is a 4.12 word; rep and level appear only where the owner exception
  allows them.

## 5. Problems, ranked

| # | Severity | Screen | Steps | What's wrong | Shot |
|---|---|---|---|---|---|
| 1 | High (privacy) | Community feed | Check in, Add a photo, open Community | The public feed post's build line ends "· Leisure park car p…", so the meet point is shown to everyone, not only to people going (4.11). It was flagged in Review 11 and is still there. | c-02 |
| 2 | High | Event (checked in) | Go, Check in | The meet point vanishes after check-in, and the header goes back to "Around Tamworth". The user is standing there and the app hides where "there" is. | a09, a12 |
| 3 | Medium | Vote sheet | Check in, Vote | Tapping a car records Best in show and closes the sheet at once. The Best car and Best bike tabs need reopening, and the task asked for the best car. | a13, a14 |
| 4 | Medium | Host step 2 | Host, Next | "Choose it on the map first" sits in a field that looks typeable, next to a duplicate map tap target and button. The area defaults to "Midlands", which gives "Around Midlands" (also in onboarding). The name error covers the helper text. | a32, a34, a06 |
| 5 | Medium | Tonight card | Go to a meet, check in, back to Tonight | The card carries a filled primary (4.3) and still says GOING after check-in, while the event and Me say CHECKED IN. | a07, a39 |
| 6 | Medium | Me, Settings | Task 10 | Settings is only at the bottom of Me, below the fold, with no header entry. The privacy switch is a second scroll down Settings. | a44, a46 |
| 7 | Medium | Garage, Me, build page | Set up with Fiesta ST Mk8 | "Your" car uses a stock photo of a different car (a black Mk7), the same photo as @jordST's profile. It reads as someone else's car. | a24, a19, d-05 |
| 8 | Medium | Event, profile | Sunday meet; Connect; Check in | Facts said twice or three times (C5): location pill plus line; request-sent toast plus bar; checked-in badge, line and toast. | a41, a20, a12 |
| 9 | Medium | Many pushed screens (web) | Open an event, profile, Settings, host form | The browser scrollbar shows and overlaps the right edge of hero photos and cards. The sheets were fixed but the pages weren't. | a08, a19, a28 |
| 10 | Low | Levels sheet | Me, tap Level 1 | Level 4 and Level 5 are both "Local name"; Level 6 and Level 7 are both "Scene veteran". | d-09 |
| 11 | Low | Host step 3 | Host, Next ×2 | "Open to anyone within 25 mi · about 18 people nearby" doesn't clearly read as "open to anyone" (same as Review 11). | a35-host-step3 |
| 12 | Low | Host success | Post meet, Share | Feedback is an inline card that swaps "Invites sent…" for "Link copied", not a toast (4.7). On web there is no share sheet, only a copied link. | a37, a38 |
| 13 | Low | Settings | Scroll to Directions | "Open in" is a SegmentedControl for a setting, and "Google Maps" wraps onto two lines. | a46 |
| 14 | Low | Sunday event hero | Open Sunday coffee and cars | The plate blur block sits next to the title text and looks like a smudge. | a41 |
| 15 | Low | Chat | Send a message | No toast. The demo auto-reply "Ha, fair." doesn't follow "Hi, nice ST!". | a23, b-09-chat-pre |
| 16 | Low | Chats, Feed, Forum | Open Community | Relative times only ("4m", "1d"), unlike the clock times everywhere else (4.10). | e-01, c-02, d-03 |
| 17 | Low | Not-found screens | Open a bad event, user or chat link | A body "Go back" button instead of the header back (4.2). | c-07, c-08, c-09 |
| 18 | Low | Host form | Type a name, tap back | A three-way sheet (Stay / Keep draft / Discard it), and the browser's "Leave site?" dialog on reload. | e-04 |
| 19 | Low | Drive view | Navigate at 12:30 | "Arrive 21:16" against a 12:30 phone clock. The runs match, but only the "Demo night" pill explains why. | a10 |
| 20 | Low | Onboarding | Pick a car | A sedan silhouette for a hatchback; "Sign in instead" shows during the demo; a visible scrollbar on the results. | a05, a04 |
| 21 | Low | Time picker | Host, Starts, Change | Three different selected looks (day, hour, minutes) in one sheet. | a30 |
| 22 | Low | Event, Search | Open them | Sodium on content: the "MEET" label and the Search category hexagons. | a41, c-11 |

## 6. Compared with Review 11

Review 11 scored Clarity 6, Coherence 4 and Look 5, with 8/10 tasks at each time (tasks 4 and 9
failed). Review 12 is clearly better on clarity and look. Both runs now pass 10/10, because the drive
ETA uses the demo clock and Share falls back to "Link copied". The padlocks are gone, and so is the
demo note in the check-in toast. The Garage, Me and hosted-event placeholders are gone, pins cluster,
the 18+ box is enforced, task 10's coffee meet starts as Going with "Can't make it" in the ActionBar,
and the distance wording is now consistent ("about 2 mi" hidden, "2 mi" known). So Clarity moves 6 →
7 and Look 5 → 6. Coherence stays at **4**. Exceptions dropped from 14 to 9, but that is still in the
6–15 band. New breaks appeared (the card primary, the meet point vanishing after check-in, the inline
host feedback), and several older themes remain: facts said twice (C5), no trophy moment (L4), "Best
in show" first in the vote, "within 25 mi" for "anyone", and the public feed post naming the meet
point. Review 11's problem 16 is now my top problem.

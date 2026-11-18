# Review 7: first-time user, harsh critic

Tested 18 Nov 2026 (09:00–09:40 local) on the web export of `main` at `f1dde43`, demo mode, with my own Playwright script.
Viewports: 393×852 @3x (iPhone, touch) and 375×667 @2x (small phone). Text-size check: every text node scaled to 1.3×.
I read no docs before testing. I read code only afterwards, to explain bugs.
Screenshots are in the session scratchpad (`review7/`); names below are those file names.
Web-only gaps (no map tiles, no place search, no turn-by-turn, no address search) are listed but not scored.

## 10-second impression

The sign-in screen says it plainly: *"What's on tonight near you. Go with your car."* Three lines underneath cover meets, going with your car and voting for builds. Within 10 seconds I knew it was a UK car and bike meet finder. It also looks the part: dark, orange, hexagon icons, a chunky condensed font.

What I didn't get: *"Stops unlock for the people going."* What is a stop, and why is it locked? That idea runs the whole app, and the app never explains it at the point where it matters.

| | Score |
|---|---|
| Clarity | **6 / 10**: the purpose is clear, but the core loop (go, stop unlocks, check in, vote) is full of jargon and dead-ends in the demo |
| Coherence | **6 / 10**: one palette and type set, but several control styles, mixed words for the same thing, and three overlapping progress systems |
| Look | **7 / 10**: strong and distinctive; let down by placeholder car drawings, an empty-looking feed and walls of grey text |

## Task log

| # | Task | Result | Taps (approx.) | Where I got stuck |
|---|---|---|---|---|
| 1 | What is it for? | **Pass** | 0 | "Stops unlock" means nothing yet |
| 2 | Set up, including my car | **Pass** | 8 | Car search is excellent. "Change anything below if yours differs" points at nothing below. The handle error only shows after you tap Show me tonight |
| 3 | Tonight → I'm going → navigate → check in → vote | **Fail** | 6, then a dead end | The live rolling meet that the app pushes first ("Start here") can never be reached by a late joiner. Navigate stays disabled, there's no check-in, and vote says "Check in at the event to vote". The other event's check-in opens in 2.5 h. The task can't be finished in the demo |
| 4 | Host with invite filters, check the review | **Pass with friction** | ~20 | The default **Minimum mods 3+** shuts out my own stock car ("None of your own builds fits this invite") before I've touched anything. You place the location by dragging blind; the label shows raw coordinates |
| 5 | Find and start a drive; check in at a photo spot | **Pass** | 6 + 3 | Found through Search, not the map. "Count it without directions" is a strange name for "Start". The check-in worked once I was within 0.2 mi |
| 6 | People → garage → connect → message | **Pass** | 7 | Connect works ("Requested"). You can't message until they accept; messaging an existing connection worked |
| 7 | Post with a place; forum question; sell | **Pass with friction** | 12 / 6 / 7 | The post place picker opens on your home, which is the one place it refuses. The photo disappeared from the feed after a reload (web). Selling is just a forum thread with no price field, and its empty state says "Be the first to help" |
| 8 | Search an address and go | **Blocked (web)** | 3 | "Search needs the iPhone app." Not scored |
| 9 | Settings, feedback, help, legal | **Pass** | 2 each | Settings is one very long scroll. Legal opens an external site whose logo differs from the app's |

## Top problems, ranked by quit risk

### 1. The core loop dead-ends on the first event the app recommends
- **Screen:** Tonight → "Start here" card → Late rolling meet (`09-tonight-first`, `12-going`, `13-navigate-tap`, `17-vote`).
- **What happened:** I tapped I'm going on the live rolling meet. **Navigate** turned into a greyed-out button (`aria-disabled=true`). The current stop shows "Here now" but stays locked: "Unlocks when the hosts move on". The hint says "The next stop unlocks when you check in here", but there's no check-in button and no way to see where "here" is. The vote section says "Check in at the event to vote."
- **Why:** `canSeeStop()` (`src/lib/events.ts`) shows a rolling meet's stop N>0 only to people checked in at stop N−1. Anyone who joins after stop 0 can never see the current stop, so `eventPrimary()` returns `navigate` with `ready:false` for ever. The demo's showcase event shows exactly that case, and the onboarding hint pushes new users straight into it.
- **Why it matters:** this is the whole product promise (go, navigate, check in, vote) and it fails on the user's first try. People quit here.
- **Fix:** let people who join a rolling meet late see the **current** stop (they're going, and the hosts are there now). Only gate stops ahead of the current one. Also make the demo have one plain meet that is open for check-in now, and point "Start here" at that one.

### 2. Jargon: "stop", "unlocks", "rough area", "Sample area"
- **Screens:** `01-first-launch`, `10-event-detail`, `11-s2`, `15b-coffee-going`, `22-host-when`.
- **What happened:** Every event card says "Sample area · stop locked" or "Stop unlocks in 2h". A plain meet has a "stop". The event header reads "Sample area · rough area". One stop row says "**Unlocks 2 h ago** for people going" yet still shows a padlock. Another line says "The stop unlocks … 60 min before the start" on an event that started an hour ago.
- **Why it matters:** a new user can't tell whether they're blocked, early or doing something wrong.
- **Fix:** call it the **location** or **meet point**, and show the reason in plain words: "Exact location shown to people going from 21:30." Fix the past-tense grammar ("Unlocked 2 h ago"). Hide the "60 min before the start" line once the event has started.

### 3. Hosting: the default filter excludes the host
- **Screen:** Host → Who's invited (`25-host-who`, `25-s1`).
- **What happened:** Minimum mods comes preselected at **3+**. My stock FK8 has 0 mods, so a warning appears straight away. It names four rows to check, and three of them have nothing selected.
- **Why it matters:** the first-time host gets told off for a choice they never made.
- **Fix:** default to **Any**. Make the warning name the row that excludes you ("Minimum mods 3+ excludes your FK8 (0 mods)").

### 4. Placing locations by raw coordinates, starting in the wrong place
- **Screens:** `06-choose-on-map`, `24a-host-ace`, `47-post-place`, `47b-post-place-used`.
- **What happened:** Every picker shows "UNDER THE CROSSHAIR 52.6000° N, 1.7000° W". The onboarding picker opens near Tamworth, not where I am. The post-place picker opens on my home, then refuses it: "within about 1 km of your home area". The meet-spot picker's button says "SET STOP HERE" under a "PLACE THE MEET SPOT" title.
- **Fix:** show a place or street name, or say nothing rather than raw coordinates. Open pickers at the user's location, and for posts, outside the home radius. Use one word for the button and the title.

### 5. "Navigate" looks disabled even when it's just early
- **Screens:** `12-going`, `15b-coffee-going`, `se-event`.
- **What happened:** After I'm going, the main button is grey text in a dark box. It reads as broken, and the reason sits in small caption text underneath.
- **Fix:** while it's locked, show a countdown in its place ("Location in 1h 59m") or a secondary "Remind me" button, not a disabled primary.

### 6. Three progress systems and a class letter nobody explains
- **Screens:** `11-event-page`, `39-profile`, `42-dan-profile`, `54-garage`.
- **What happened:** Class S–D, Level 1–3, Rep (350, 755), "Legend", "+50 REP", trophies. "Class A" shows on every card. It's only explained on the Garage screen and in Help, and "Legend" isn't explained anywhere.
- **Fix:** add a one-tap explainer on the class badge, merge Level/Legend into one ladder, and show the rep you'd earn on the event page.

### 7. Text-size 1.3× breaks tabs and stat tiles
- **Screens:** `big-contact`, `big-community`, `big-drive`, `big-event`.
- **What happened:** "MESSAGE…" is cut off in the Community tabs. "CHECKPOINT / S" wraps mid-word. "2h 40…" is cut off in a stat tile. "Wants to co…" is truncated in People. "Class / S" wraps onto its own line.
- **Fix:** let the four-way segmented control scroll or wrap to two rows at large text sizes. Allow stat tile labels two lines, or shrink them with `adjustsFontSizeToFit`. Test at the largest accessibility size too.

### 8. The feed feels empty
- **Screens:** `37-community`, `68-feed-own-post`.
- **What happened:** The sample posts have no photos, just the same grey car outline. My own photo post rendered as a large blank box after a page reload (console: `ERR_FILE_NOT_FOUND`).
- **Fix:** give the demo posts real (licensed) photos. On web, persist picked photos as data URIs, or hide the frame when the image fails to load.

## Inconsistencies (breaks in one design language)

1. **Dismiss words:** the + HOST sheet says **CANCEL**, the + NEW sheet and Map layers say **DONE**, and map pickers use a boxed **CANCEL** button.
2. **Header actions:** "+ HOST", "+ NEW", "+ ADD", "EDIT" (text) on your own build, "•••" on others' builds. Each tab uses a different verb.
3. **Chip styles:** on one Host screen, Vehicles/Class/Brands are bold uppercase chips with no tick, while Minimum mods/Radius are sentence-case radio pills with circles (`25-host-who`).
4. **Location words:** stop / meet spot / show venue / place / area / rough area / Sample area all mean nearly the same thing.
5. **Distance reference:** "0.5 mi from the map's centre" (Tonight list), "0.7 mi from home" (Search), "4.4 mi" then "6.1 mi" for the same event once a stop unlocked.
6. **Check-in radius:** Help says "about half a mile", photo spots say 0.2 mi, events say half a mile.
7. **Avatars:** everyone else gets one letter; I get "EF" (from `ek_fk8`).
8. **Car drawings:** an FK8 hatchback and a GR Yaris are both drawn as the same saloon. Outlines are blue on one and red on another, for no stated reason.
9. **Title styles:** onboarding uses italic display caps ("WHAT DO YOU DRIVE?"); every other screen title uses upright caps ("HOST AN EVENT", "TONIGHT").
10. **Brand mark:** the in-app logo is a hexagon with dots and an arrow; the legal web pages use an "NS" monogram.
11. **Map credit** "© OpenStreetMap contributors" is in a system font, not the app font.
12. **Order mismatch:** car search lists generations oldest first; the generation picker lists them newest first.
13. **Review screen** puts the value above the label ("Meet · Friday JDM night / What"). Every form elsewhere puts the label above.
14. **Board names:** "Events" in the new-thread chips, "Meets and events chat" in the board list.
15. **Bubble colours:** in chat, my bubbles and theirs are almost the same grey; only the side tells them apart.
16. **Back arrow** scrolls away on event pages while "•••" stays pinned.

## Functional bugs

1. **Late joiners can't reach a live rolling meet** (see problem 1): `canSeeStop()` needs a check-in at the previous stop, so Navigate, check-in and vote are blocked for ever.
2. **Map zoom buttons hidden** behind the layers, location and fit stack when an event peek is open; only "+" shows, and "−" is covered (`10-event-detail`).
3. **"Unlocks 2 h ago"** text on a stop that's still locked.
4. **Tune: Stock** shown on a build with a Stage 1 remap of +40 bhp (`40-build`). The sample post also says "stock for now" while the card says 5 mods.
5. **Own post photo blank after reload** on web (`68-feed-own-post`).
6. **The "Change anything below if yours differs"** onboarding hint refers to fields that aren't there (`04b-car-picked-scrolled`).
7. **"No replies yet. Be the first to help."** on your own For sale thread (`53-sale-posted`).
8. **The Posts map layer is off by default**, so a post marked "On the map" doesn't appear on the map.
9. **"Late edition" / "Late rolling meet"** sample events are timed for the morning (08:22–12:07) under a **TONIGHT** heading. The demo clock should shift them to the evening.
10. **No duplicate guard when hosting:** tapping through Host three times made three identical "Friday JDM night" events.

## What's good

- The car picker is brilliant: search "Civic Type R" and pick FK8 with real UK figures and engine codes.
- Privacy is designed in and stated plainly: home saved to about 1 km, post places blocked near home, nobody on the map.
- Meet-ban awareness: drives and pickers warn about council orders and injunctions, with a link to the order.
- The host flow is well structured (five steps, a live "people match" count, review with Edit on every row).
- One strong palette and icon family; hex pins and layer colours are memorable.
- The photo-spot check-in → optional photo → plate blur → rate flow is smooth.

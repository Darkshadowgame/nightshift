# Review 8: first-time user, harsh critic

Tested 18 Nov 2026 on the web preview (`expo export --platform web`, served as an SPA), driven by a Playwright script in demo mode at 393x852 @3x (touch), 375x667 and with text scaled to 1.3x. The test location sat inside a West Midlands city. Apple map tiles and the address geocoder don't exist on web, so blank map grids and unnamed meet points are ignored. No docs were read before testing; code was read only afterwards, to explain bugs.

## 10-second impression

"Slipstream: what's on tonight near you. Go with your car." Three lines underneath (meets, check in, vote for builds). Within ten seconds I knew this is a UK car and bike meet finder with a points game on top. That's the best first screen this app has had. The dark navy, orange and hex-badge look says "night car culture" without being tacky.

What spoils it: on a 375x667 phone the "Try the demo without an account" button is below the fold, so a nervous first-timer sees only "give us your email".

## Scores

| | Score | Why |
|---|---|---|
| Clarity | **6/10** | The words are plain and honest, and every screen explains itself. But it explains too much (the drive page says "never timed" three times). The core loop also dead-ends in the demo: check-in fails with "You need to be within 0.5 mi" and nothing points to the fix. |
| Coherence | **7/10** | Mostly one design language: hex icons, orange primary, condensed uppercase labels, the same stat tiles, cards, callouts and pill tabs everywhere. It breaks in a few visible places (a serif-font callout, back buttons that come and go, two different "new" sheets that list different things). |
| Look | **6/10** | Polished type and spacing, but there is not one real photo anywhere: not on the feed, builds, trophies, voting or even "photo spots". It's grey silhouettes and text. For a car-culture app that's the biggest thing missing from the look. |

## Task log

Format: what I did → what happened. ⚠ = hesitation, ✗ = dead end or bug.

### 1. What is it for (10 s)
- Sign-in screen → clear tagline and 3 benefit lines. Understood straight away.
- ⚠ 375x667: the demo option is off-screen; only the email form is visible.

### 2. Set up, including my car
- "Try the demo" → "Step 1 of 2: What do you drive?" with Car/Bike, a search box AND Make/Model dropdowns. ⚠ Two ways to do one thing; I didn't know which to use.
- Typed "type r" → great results (FL5, FK8, FK2, FD2, EP3, DC5, DC2 with engine codes and bhp). Picked FK8 → **the confirmation and the Next button are below the fold**; the screen looked unchanged until I scrolled. ⚠
- "Standard figures are the manufacturer's UK figures." sits on the screen before any figures are shown; once picked, a second line says "Standard figures filled in: 316 bhp…". Duplicate and out of order.
- Step 2 "Where's home?" → Use my location → "Home area set · Midlands, to about 1 km". Good privacy copy.
- Handle with a space → error only after tapping "Show me tonight" ("Use letters, numbers, dots and underscores only."). Fine.
- "Back" is at the very bottom of step 2, below the main button; there's no back at the top.
- Landed on Tonight with a "Start here" sheet: "Say you're going, with your Honda Civic Type R FK8." Nice touch.

### 3. Find something tonight → I'm going → navigate → check in → vote
- The "Start here" card points at "Car park meet-up", tagged **INVITED**. ⚠ I've had the app 60 seconds, so who invited me? The word means "your car fits the invite", but it reads as a personal invite.
- The "Start here" sheet is translucent: the map's lock pins show through behind the "START HERE" text. Ugly.
- Tapped a map pin → peek sheet with a title and "Open event", stretched to fill **three-quarters of the screen with empty navy**.
- After a reload, "Start here" was gone for good and the sheet said "Tonight near you · 3 in the next 12 h".
- Event page (rolling meet) → I'm going → the button turns into "Check in at Shopping park car park" plus Navigate. ✓ No "you're going" confirmation or toast, and "Can't make it" is hidden in the ··· menu.
- Navigate → web says turn-by-turn needs the iPhone app, which is fair. "Open in another app" lists Apple Maps with the subtitle **"To the first meet point"**, while the rolling meet is at point 2 of 3, and the footnote confirms "Other apps get the first meet point only". ✗ A late joiner using Google Maps or Waze gets sent to a car park everyone has already left.
- Check in → **"You need to be within 0.5 mi of Shopping park car park."** ✗ In demo mode there's no way to be there, and the message doesn't say "turn on Skip the GPS check in Settings › Demo" (the very last row of a very long Settings page). A real first-time user stops here, and can never reach voting.
- After turning that on: check in ✓ with a green tick card, then "Vote for trophies". Voting works (tap a card, "VOTED" tag, can change it). But: 7 trophies × 4 builds is a long scroll of near-identical cards; **every build says "Stage 1"**; no photos; "Best newcomer" includes @dan_r, who is "Legend this week".
- The rep promise ("Checking in earns 150 rep") was kept: Me went 0 → 150. ✓

### 4. Host an event with invite filters, check the review
- "+ New" → sheet: "Host an event: **A meet, cruise or rolling meet**." The form also offers Show and Track day. ⚠
- Step 1 defaults to **Cruise**, not Meet. An empty Next shows "Give the event a name." ✓
- Step 2 start-time chips run 19:00, 20:30, 22:00, 22:30, 23:00, 23:59, **06:00, 09:00**. ⚠ Odd order.
- Step 3: "Choose on the map" → crosshair placer. The copy says "tap a **grey** pin to use a known place", but the pins are orange hexes. The status line reads **"Inside a car-meet order area (Birmingham (whole city))"**, with double brackets.
- Set it there anyway → a warning callout: "Court injunction … organising, promoting or publicising one … Breaking it is contempt of court, with a power of arrest." Then **Next works, Review shows the warning again, and "Send invites" publishes the event with no confirm step.** ✗ (See the top problems.)
- I could also go to the next step with the meet point unnamed; Review then shows "Where: Meet point · shown as Midlands".
- Step 4 "Who's invited": Cars, Class A, 3+ mods, VW + Honda, 25 mi. A live "1 people match / 1 builds match" count is a great idea, but "**1 people**" is a grammar slip.
- "None of your own builds fits this invite" callout: **the body text renders in a serif font** (Times) on both Who's invited and Review. ✗ (See bugs; on iOS this is probably a crash.)
- Step 3 says "a **3 mi circle**", Review says "a circle about **6 mi across**". Both are right, but they read like a contradiction.
- After publishing: event page with HOSTING, Navigate, "Edit event", "See as a guest". No "invites sent to N people" confirmation, and the Edit row uses an ⓘ info icon. The Tonight list then shows "1 going · **here from you**".

### 5. Find a drive, start it; check in at a photo spot
- Search → Places → Drives. Good real UK roads (B4204, A4117 Clee Hill, A53 Ramshaw Rocks). Drive page: "Never timed: pass or fail", "Untimed: rep for finishing…", "Drives are never timed or ranked…". The same idea three times. ⚠
- ⚠ **There's no "Start drive" button.** The choices are "Navigate", "Open in another app" and (with demo GPS on) "Simulate the drive". The Navigate screen says "back on the drive's page, **Count it without directions** does" — but that button doesn't exist while the demo toggle is on (it's renamed "Simulate the drive"). "Count it without directions" is a poor name for "Start" anyway.
- Simulate → live checkpoint list → "Drive complete" and "+100 REP EARNED". ✗ **Me still says 150 rep.** The drive's rep never arrived, and the photo spot's "Rep added if this was your first time here" didn't add any either.
- The drive map draws 18 overlapping checkpoint hexes on a straight line, like a caterpillar.
- Photo spot (Broadway Tower): a **photo spot with no photo**. The "Before you go" note says "**Medium confidence: car park position is an unnamed OSM car park** near the tower". That's an internal data note shown to users. It's also labelled "South West" while the text says it's in Worcestershire.
- Check in here → "You're here. Add a photo?" → Skip → "Checked in at Broadway Tower". Works, but it doesn't use the event check-in's tick card, so it doesn't feel like the same moment.

### 6. Find people, view a garage, connect, message
- Community › People: list with class badges, levels and rough distance; "Requests: 2 people want to connect". ✓
- @tomtom_gr profile → GR Yaris build: class card, 297 bhp est., 1280 kg, mods list with "+40 bhp" on the remap. Car people will like this. The garage card is half-width with an empty right half.
- Connect → "Requested". In the demo nobody ever accepts, so you can never message a new person. Messaged @dan_r (already connected) instead: chat works, but your bubbles and theirs are the same colour.

### 7. Post a photo with a place; ask on the forum; sell something
- Post: Library → a full crop tool (Free/Cover/1:1/4:5…; "Cover" is unclear) → Add a place (crosshair) → link build → Post. ✓
- ✗ **After posting, the post screen has no back button and no tab bar.** The forum thread and the For Sale thread have the same problem. You're stranded.
- Forum › New thread: board chips "Advice / Builds / … / For sale / Local". The chip says "Advice", the board is called "Advice and help".
- Selling: the only way is a "For sale" forum board ("Posts only: no payments through Slipstream"). No price, condition or location fields, and the placeholder still asks "What's the car or bike, what have you tried, what do you want to know?". ⚠ There's no "Sell" in the Garage, the build page or the "+ New" sheet. I only found it by trying every board.

### 8. Settings, feedback, help, legal
- Settings is one very long page: account, navigation app, map heading, icon and colour, voice, cameras, layers, notifications, travel radius, privacy, feedback, legal, version, demo. It works, but it's a wall of options. "Choosing a voice needs the latest iPhone app (**build 11 or later**)" is developer talk.
- Feedback: type chips, message, optional location, "Thanks, it's with the team" and a status list ("Bug · 18 Nov · New"). Excellent.
- How Slipstream works: clear and short. It says "Tap the **+**" (the button says "+ New") and says voting lasts "for a day" (the vote screen says "Closes in 27 h").
- Terms, Privacy, Guidelines and Support open an external website in a new tab, so you leave the app.

### Other taps
- Search: the empty state shows "Home: **Not set**. Search for it, then save it as Home." I set a home area two minutes ago. ⚠ The input also draws a rectangular white focus ring inside the rounded orange pill.
- Public view of my own profile: "**0 Events**" after checking in at one and hosting one.
- Me › "Suggest one" opens Drive / Photo spot only, but "+ New › Suggest a place" promises "A drive, photo spot **or meet spot**".
- 375x667: on Tonight the bottom sheet covers the map's zoom buttons (the + is cut in half and the − is hidden).
- 1.3x text: mostly holds up. "MESSAGES 3" wraps onto two lines in the Community tabs, and the bell badge touches the screen edge.

## Top problems, ranked by quit risk

1. **The demo check-in is a dead end.** Check-in fails with "You need to be within 0.5 mi…", and the fix is the last row of Settings. Everything after it (voting, trophies, rep) is unreachable. **Fix:** in demo mode, turn on "Skip the GPS check" by default, or put "Try it anyway (demo)" right under the error.
2. **Back buttons disappear.** Every screen reached by URL or by `router.replace` has no back arrow: event, profile, drive and photo spot opened by link, and the post or thread you just made (`post/new.tsx` does `router.replace('/post/[id]')`). On iOS the same happens from a notification or shared link. **Fix:** a header `headerLeft` that falls back to `router.replace('/')` (or the parent tab) when `!router.canGoBack()`; push, not replace, after posting.
3. **You can publish a meet inside a court injunction area in one tap.** The app shows "contempt of court, power of arrest" and still lets "Send invites" go through without asking. For an app whose pitch is legal meets, this is a trust and liability problem. **Fix:** block court-injunction zones outright (or at least require a typed confirm), and don't offer the ban area as the default crosshair spot.
4. **No photos anywhere.** Feed, builds, voting cards, trophies and "photo spots" are all silhouettes. A car-culture user will judge the app as empty. **Fix:** seed the demo with real (licensed) photos on builds, posts and spots; make the photo the first thing on a vote card.
5. **"Open in another app" sends rolling-meet late joiners to the first meet point.** **Fix:** pass the current meet point (`currentStop`), the same one the Check in button names.
6. **Serif text in the "None of your own builds fits" callout.** On iOS it's probably worse: `EventForm.tsx` passes `{leftOutWhy} Change it…` (an array, not a string) to `Callout`, which wraps only string children in `DsText`. Raw text in a `View` throws "Text strings must be rendered within a <Text>" on native. **Fix:** wrap it in a template string or `<DsText v="secondary">`.
7. **Rep shown but not paid.** The drive says "+100 REP EARNED", the photo spot says "Rep added", and the total stays at 150. **Fix:** pay simulated demo completions, or say plainly "Demo: no rep".
8. **Selling is hidden in a forum board.** **Fix:** a "Sell a part" action on the build page and in "+ New", with price and condition fields, and its own placeholder text.
9. **Onboarding step 1 hides its own result.** After picking a car, scroll to the confirmation and Next (or pin Next to the bottom like the host form does). Drop the duplicate "Standard figures" line.

## Inconsistencies

- "+ New" sheet: "A meet, cruise or rolling meet" vs the form's five types; "drive, photo spot or meet spot" vs Suggest's two.
- Back: present on tab-opened screens, missing on deep links and after posting; the back button's accessible name is "(tabs), back", "SEARCH, back", "SETTINGS, back" or "Go back" depending on the screen.
- "INVITED" means "your car fits the invite"; a first-timer reads it as "someone invited you".
- "Home: Not set" in Search vs "Home area set" in onboarding and profile.
- Board chip "Advice" vs board "Advice and help".
- "3 mi circle" (host step 3) vs "circle about 6 mi across" (Review).
- Vote window "for a day" (Help) vs "Closes in 27 h" (vote screen).
- "Tap the +" (Help) vs "+ New" (header).
- "Tonight" as the tab and home title while showing a 09:35–13:20 meet and "Later today 13:20".
- Event check-in gets a green tick card; photo-spot check-in gets a different success callout; drive completion a third.
- "tap a grey pin" vs orange pins in the meet-point placer.
- Region labels: Broadway Tower "South West" while its own text says Worcestershire.

## Bugs

| # | Where | What | Likely cause |
|---|---|---|---|
| 1 | Host › Who's invited, Review | Warning body in a serif font; probably a native crash | `EventForm.tsx` ~L477/L524: array children into `Callout` (`Detail.tsx` wraps only strings) |
| 2 | Event, profile, drive or spot opened by URL; post/thread after publishing | No back button, no tab bar | No `canGoBack` fallback in the header; `router.replace` after create |
| 3 | Rolling meet › Open in another app | Routes to meet point 1 although point 2 is current | Other-app hand-off uses the first stop |
| 4 | Drive / photo spot | "+100 rep earned" and "Rep added" shown, total unchanged | Simulated completions are not counted in `repLedger` |
| 5 | Public profile | "0 Events" after attending and hosting | Count excludes live or future events |
| 6 | Host › Who's invited | "1 people match" | No singular |
| 7 | Tonight list | "1 going · here from you" | 0-distance phrase |
| 8 | Meet-point placer | "(Birmingham (whole city))" | Zone name already has brackets |
| 9 | Drive page (demo GPS on) | Navigate screen points to "Count it without directions", which isn't on the page | Button renamed to "Simulate the drive" when the setting is on |
| 10 | Photo spot | Internal note "Medium confidence … unnamed OSM car park" shown to users | Data-curation field rendered as "Before you go" |
| 11 | Search input (web) | White rectangular focus ring inside the rounded pill | Browser default outline not reset |
| 12 | Tonight (375x667) | Sheet covers the zoom buttons | Controls not offset by the sheet height |
| 13 | Voting | Every candidate "Stage 1"; "Best newcomer" lists this week's Legend | Seed data |

## What's good

- The first screen finally answers "what is this?" in one line, and the demo is honest ("nothing leaves this phone").
- The car picker is excellent: real chassis codes, engines, years and UK bhp, so an FK8 owner feels known.
- Privacy is designed in and explained everywhere: home area rounded to ~1 km, hidden meet points, plates blurred, "never where anyone lives".
- Meet bans are mapped with real orders and a link to the court order. That's a unique, valuable feature (it just needs to block, not warn).
- The host flow is a tidy 5-step wizard with Edit on every Review row and a live "people match" count.
- The build page (class from power-to-weight, "+40 bhp" per mod, "Not dyno verified") is exactly what enthusiasts argue about.
- Feedback with a visible status trail is better than most shipping apps.
- The design language really is mostly one system: the same tiles, cards, callouts, pill tabs, hex icons and orange primary from sign-in to settings. Category colours (orange events, cyan drives, pink photo spots) are used consistently.

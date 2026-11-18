# Review 6: a first-time user's walk-through

**Who:** a first-time UK car and bike enthusiast who has never seen the app, plays the demo (no sign-in) and is asked to be harsh.
**What:** the web preview (`expo export --platform web`, served locally), on an iPhone-sized viewport (393×852 @3x, touch) and a small phone (375×667). I tested with no docs: only what the app shows. I read code only afterwards, to explain bugs I had already hit.
**Ignored:** missing map tiles, and features the web preview says need the iPhone app (turn-by-turn, Apple Maps place search, notifications).
**Screenshots:** saved locally under `review6/firstuser/` (not committed). Filenames are given below so they can be matched up.

---

## 1. The 10-second impression

**What I thought it was:** "A night-time car meet map for the UK, with a garage where my car gets a letter grade." The sign-in screen says that well: *"The UK car and bike scene on one map, after dark"*, then three lines about meets, the garage and roads (`01-open.png`).

**Was that right?** Mostly. But within 2 minutes I'd also found a forum, a social feed, likes, swipe-to-rate builds, crews, levels and rep, trophies, award voting, DMs, connection requests, turn-by-turn navigation with a voice and speed cameras, road reports, shops, ban-zone legal warnings and a feedback tracker. The pitch promises three things and the app has about fifteen. After using it, my honest one-line description is *"Meetup + Instagram + Reddit + Waze + a car-rating game, all at once"*. The owner's worry is right: nothing tells me which of these is the main thing.

**What actually happened in the first 10 seconds:** I tapped **Try the demo without an account** and landed on an **Open data and credits** page with no back button and no tabs (`02-after-demo.png`). Going to `/` sent me back to credits. **A real user would delete the app here.** (Bug B1 below.)

---

## 2. Task log

Times are rough wall-clock times for a careful first-timer. Taps count real taps and typing, not scrolling.

| # | Task | Result | Time / taps | Where I got stuck |
|---|------|--------|-------------|-------------------|
| 1 | Understand the app | **Partial** | 10 s / 0 | The sign-in pitch is clear. The app behind it is much wider than the pitch. |
| 2a | Set up a profile and home area | **Fail without a workaround**, then success | 1 min / 6 taps after typing `/welcome` by hand | Demo lands on Credits (B1). The welcome form, once reached, repeats the whole sign-in pitch, then asks handle, name, home area, **region** (already known from home area), travel radius and notification choice, plus a visible "TESTING: use the demo area (Tamworth)" button (`05b-welcome-full.png`, `07-welcome-bottom.png`). It **never asks for my car**, the core object of the app. |
| 2b | Add my car with mods and stage | **Success**, with friction | 2 min / ~8 taps | Quick search ("Civic Type R" → FK8) is excellent (`21-quicksearch.png`). But: the form is ~5 screens long. "Mods (0)" heads a section that starts with *Tune stage*, and picking Stage 2 makes it "Mods (1)" (the stage counts as a mod). There are two rows of identical category chips (Quick add *and* Something else) (`20-addbuild-1.png`, `27-after-save.png`). Copy like "PS × 0.986 = bhp" and "Engine type (for the estimate)" is aimed at a spreadsheet, not a person. Save gives no confirmation. The garage scrolls to the bottom and the new car sits *below* the sample car (`30-saved-build.png`). The garage card doesn't show the stage I picked. |
| 3 | Find something tonight and decide | **Success, but no basis to decide** | 1 min / 3 taps | The home sheet shows "Tonight near you". The demo has already made me "Going" to one meet and "Hosting" two events I never made (`08-first-home.png`). Event cards say "Cars 1S 4A 1B · Bikes 1S" (jargon). The event page hides the location until 2 h before ("Sample area", locked) (`43-event-invited-0.png`), so I can't judge the drive. The sample "Coffee and cars" meet is at **03:25**. |
| 4a | RSVP | **Success** | 3 taps | "I'm going" opens a vehicle picker that **pre-selects the sample Golf R**, not the car I just added (`44-after-going.png`). Then a second "I'm going" confirms. |
| 4b | Check in | **Fail** | 4 taps | First it says "You need to be within 0.5 mi" (`53-after-checkin.png`), which is fair, but the demo gives no way to try it. The fix ("Skip the GPS check") is buried at the bottom of Settings. With that on, check-in **still fails** with a red *"You've checked in, so your vehicle is set for this one."* The button stays the same and the count stays 5/7 (`56-checked-in-b.png`, bug B2). |
| 5a | Find and start a drive | **Partial** | 2 min / 6 taps | The Find › **Places** tab is blank until you type (`62-find-places.png`). I had to guess a road name. The result throws you out of Find onto the map with a preview card, then **Open drive** (`67-drive-preview.png`). The drive page has two ways to start, "Navigate the drive" and "Count without directions", and it doesn't explain the difference until you read the small print (`68-drive-0.png`). |
| 5b | Find a photo spot | **Success by luck** | 1 min / 3 taps | Only works if you type the word "photo" into Places search (`64-places-photo.png`). Nothing lists "photo spots near me". The map layer is called **Photos**, not "Photo spots", and it sits next to a separate **Posts** layer (`60-layers.png`). |
| 6 | Host an event with invite filters | **Success, but I made the wrong event** | 3 min / ~12 taps | The form is long (type, name, when, map picker, area name, invite filters, unlock time, crew/co-hosts). The good part: the ban-zone warning (`72-host-mappicker.png`). The bad part: **Vehicles: Cars / Bikes** chips both start selected, so tapping "Cars" *turned cars off*. I published a **bikes-only, Honda-only** meet while bringing a VW Golf (`74-host-filters.png`, `75-host-sent.png`). There was no summary before the **Send invites** button, and Find still says *"you can go"* to my own event. |
| 7a | Find people and see their garage | **Success** | 3 taps | People list works, but each person is a giant placeholder car drawing, about 1.3 people per screen (`80-people.png`). Section title "Cars near you" includes bikes. The other user's build says **"Upload a dyno sheet to verify"**, an instruction meant for the owner (`83-their-build.png`). |
| 7b | Connect then message | **Partial** | 5 taps | Connecting sends a request that the demo never accepts, so I can't message that person. I had to find **Requests** (a header link, a banner and a tab badge, all for the same 2 requests), accept someone else, then **Message** (`85-requests.png`, `88-chat-sent.png`). Chat itself is fine. My outgoing request isn't listed anywhere. |
| 8a | Ask on the forum | **Success** | 4 taps | Clean (`93-thread-posted.png`). The header action changes per segment: **+ Post**, **Requests 2**, **+ Thread**. |
| 8b | Post a photo with a location | **Partial** | 7 taps | Photo upload and crop work. The default place under the crosshair is my home, which is rightly refused, but the refusal closes the map. A second "Use this place" then **posted without a place, without asking** (`99-post-place-home.png`, `103-posted.png`). Place search is iPhone-only. |
| 9 | Search an address and navigate | **Expected web limit**, confusing route | 3 taps | The map's search bar says **"Where to?"** but opens a screen titled **Find**, which has **two** search boxes ("Events, places, people or an address" and "Where to? Address, postcode or place") (`40-find.png`, `110-whereto.png`). A postcode gives "No events, places or people match. It might be an address", then a second tap opens a **third** screen also titled "Where to?" (`111-whereto-postcode.png`, `113-where.png`). |
| 10 | Settings, feedback, legal, help | **Success**, with sprawl | 4 taps | Settings is ~6 screens and mixes map layers (a copy of the layers sheet), the travel radius (a copy of welcome), voice, camera alerts, privacy, community, feedback, account, legal, **demo developer switches**, app updates and a "Car and bike list 2026-11-17.4" version string (`120-settings-0.png` to `120-settings-5.png`). **Help** leaves the app for a web page. "Coming later: cruise mode and walkie-talkie" is roadmap copy inside Settings. |

---

## 3. Top 15 problems, ranked by how likely they make a real user quit

**1. "Try the demo" lands on Credits, and you can never leave.**
*Screen:* sign-in → demo. *What:* the URL becomes `/credits`. The page has no back button and no tabs, and `/` also redirects to credits. Same at 375×667 (`02-after-demo.png`, `04-home.png`, `151-se-afterdemo.png`). *Why bad:* 100% of demo users hit a dead end in the first 5 seconds. *Likely cause (from the code, after testing):* `src/app/_layout.tsx` uses `Stack.Protected`, but `credits.tsx` isn't declared in the Stack, so it's an always-available route. When `startDemo()` flips the gate (the store reloads, the Stack unmounts and remounts), the `/signin` route is no longer allowed, and expo-router falls back to an available route. It picks `credits` instead of `welcome`. A brand-new **email** sign-up goes through the same state (signed in, not onboarded), so it probably lands there too. Check this on the iPhone build. *Fix:* after `startDemo()` or a successful sign-in, `router.replace('/welcome')` explicitly. Declare `credits` (and other public screens) inside the right `Stack.Protected` group. Add an `index` redirect for the not-onboarded state. Add an e2e test for "demo → welcome".

**2. Check-in at the demo's showcase rolling meet always fails.**
*Screen:* Late rolling meet, stop 2 (`56-checked-in-b.png`). *What:* a red "You've checked in, so your vehicle is set for this one." The button doesn't change and the count stays 5/7. *Why bad:* check-in is the headline mechanic ("stops unlock for the people going"), and the demo can't show it. *Cause:* the demo seeds my check-in at stop 1 but never records `event.vehicles[me]`. `checkInBuild()` falls back to the Golf, and `[id].tsx:172` passes it as a vehicle change (`atCheckIn.id !== chosen?.id` with `chosen` undefined). `checkIn()` in `lib/events.ts` then throws because I already have a check-in. *Fix:* only pass a vehicle when `chosen` is defined *and* differs, or treat "no recorded vehicle + already checked in" as no change. Seed `vehicles[me]` in the demo data.

**3. The app has no centre: about 15 features and 5 tabs of equal weight.**
*Screen:* everywhere (`08-first-home.png`, `11-community.png`, `13-me.png`). *What:* meets, cruises, rolling meets, shows, track days, drives, photo spots, tracks, shops, speed cameras, road reports, posts, forum, DMs, crews, rep/levels, trophies, award votes, Tinder-style build rating, a garage classing game, turn-by-turn navigation. *Why bad:* a new user can't tell what to do first or why they'd come back tomorrow. *Fix:* see section 6. Pick one core loop and hide the rest behind it.

**4. Onboarding asks the wrong questions and skips the right one.**
*Screen:* welcome (`05b-welcome-full.png`, `07-welcome-bottom.png`). *What:* it repeats the full pitch, then asks region (already known from home area), travel radius, notification mode, and shows a "TESTING: use the demo area (Tamworth)" button. It never asks "What do you drive or ride?". Then the demo gives me someone else's Golf as "my" car. *Why bad:* the car is the identity, the invite key and the class. Without it, nothing is personal. *Fix:* three steps: (1) handle, (2) your car or bike (quick search, one tap), (3) home area with radius. Drop region (derive it). Move notifications to the first event you RSVP to. Hide the Tamworth button outside dev builds.

**5. The demo pretends I've already done things.**
*Screen:* first home, Me, Events (`08-first-home.png`, `13-me.png`, `10-events.png`). *What:* I'm already "Going" to a live meet, "Hosting" two events, in a crew, level 2 with 720 rep and 2 trophies, with chat messages "I" wrote. *Why bad:* it's confusing ("did I tap something?"), and it removes the satisfaction of doing those things myself. *Fix:* the demo should populate *other people* and *events near me*, but leave *me* empty: no RSVPs, no hosting, no crew, 0 rep. Then a short 3-step guided path: "Join tonight's meet → check in → vote".

**6. Invite-filter chips silently mean the opposite of what you tap.**
*Screen:* Host an event, Who's invited (`74-host-filters.png`, `75-host-sent.png`). *What:* Cars and Bikes both start ON, so tapping "Cars" turned cars OFF. On People the same chips start OFF and mean "all" (`80-people.png`). In Add build, Car/Bike is single-choice. I published a bikes-only Honda meet while bringing a Golf, with no warning. *Why bad:* hosts will invite the wrong people and not know. *Fix:* use one chip behaviour app-wide (all off = all). Show a plain-English summary above **Send invites** ("Bikes only · Honda · 3+ mods · within 25 mi · 18 people"). Warn when the host's own vehicle doesn't match.

**7. Three search experiences with swapped names.**
*Screen:* map search bar, Find, Where to (`110-whereto.png`, `111-whereto-postcode.png`, `113-where.png`). *What:* the bar labelled "Where to?" opens **Find**. Find has two search boxes. An address needs a second hop to a separate **Where to?** screen. *Why bad:* I never knew which box to type in. *Fix:* one search screen, one box, with results grouped Events / Places / People / Addresses (addresses inline). Call it **Search** everywhere.

**8. You can't decide whether to go to an event.**
*Screen:* event page (`43-event-invited-0.png`). *What:* the location is "Sample area" until 2 h before. Distances are to a 3-mile circle. The vehicle mix is coded as "Cars 2S 2A · Bikes 1S". *Why bad:* "Is it worth the drive?" is the one question the page should answer. *Fix:* even when locked, show a town or area name and a rough drive time from home. Spell out the mix ("6 cars, 1 bike, mostly A class"). Put "who's going" (avatars and cars) above the fold.

**9. The map is mostly hidden on the map tab.**
*Screen:* map (`08-first-home.png`, `152-se-home.png`). *What:* the bottom sheet covers half the screen with a live card, a "How the map works" tip, three action tiles and long lists. Map pins show *through* the sheet. On 375×667 the action tiles are cut off by the tab bar. Tab labels are clipped at the bottom edge on both sizes ("EVFNTS"). *Why bad:* the pitch is "on one map", but you barely see one. *Fix:* the sheet starts collapsed to one row ("Tonight: 3 near you ›"). Remove the tip once tapped. Fix the tab-label clipping (padding/safe area).

**10. The Places tab is empty until you guess a word.**
*Screen:* Find › Places (`62-find-places.png`). *What:* "Type the name of a drive, photo spot…". *Why bad:* I don't know road names. I want "photo spots near me". *Fix:* default to a list sorted by distance, with filter chips Drives / Photo spots / Tracks / Meet spots.

**11. Tapping a search result kicks you out to the map, then needs a second tap.**
*Screen:* Find › result → map preview card → Open drive / Open event (`67-drive-preview.png`, `50-live-preview.png`). *Why bad:* it's an extra tap every time, you lose your Find results, and the live-meet card on the home sheet does the same. *Fix:* a result tap opens the detail page. Put "Show on map" on the detail page.

**12. The vehicle pickers default to the sample car, not mine.**
*Screen:* RSVP picker, check-in line, hosted event (`44-after-going.png`, `51-live-0.png`, `75-host-sent.png`). *Why bad:* I keep "bringing" a VW Golf I don't own. *Fix:* default to the most recently added or edited build. Remove the sample build the moment the user adds their own.

**13. Rep can be farmed by adding duplicate builds.**
*Screen:* Me (`94-me-after.png`). *What:* after saving the same Civic several times (no duplicate warning), "Mods logged ×27 +540" took me from level 2 to 3. *Why bad:* the leaderboard and levels look meaningless to anyone who notices. *Fix:* count mods per unique vehicle (make, model and year, or VIN-less dedupe), warn on duplicates, and cap rep from garage edits.

**14. People cards are huge and the counts are said three times.**
*Screen:* Community › People (`80-people.png`). *What:* "Requests 2" in the header, a "2 people want to connect" banner and "People 2" on the tab. Each person is a full-width placeholder car drawing. *Why bad:* it's slow to scan, and three badges for one thing reads as noise. *Fix:* compact rows (avatar, handle, car, class, distance) and one requests entry.

**15. Settings is a junk drawer, and help leaves the app.**
*Screen:* Settings (`120-settings-*.png`), Support. *What:* it repeats map layers and the travel radius, includes developer switches ("Skip the GPS check", "Reset demo data", "Car and bike list 2026-11-17.4") and roadmap text. Help opens an external web page. *Why bad:* settings should be short and boring, and help should be in reach when you're stuck at a meet. *Fix:* split into Account, Notifications, Navigation, Privacy and About. Remove what's already on the map sheet. Put developer switches behind a hidden "developer" toggle. Add a short in-app "How Nightshift works" (stops unlocking, check-in, classes, rep).

---

## 4. Bolted on, duplicated, inconsistent or unclear

**Duplicates**
- Three searches (map bar, Find with two boxes, Where to).
- Map layers are in a sheet *and* in Settings. The travel radius is in welcome *and* Settings.
- Requests appear three ways. The notification bell is on Map and Events but not other tabs, and its badge (5) is a different count from Community's badge.
- Two rows of mod category chips on Add build. "Mods · Modified" on every build tile.
- The welcome screen repeats the sign-in pitch word for word.
- "Send feedback" is the screen title *and* the first heading (`130-feedback.png`).

**Feels bolted on**
- **Rate builds** (swipe right or left, `142-rate.png`) feels like another app.
- **Crews** live under Me but host events under Events.
- **Award voting** ("Vote (7 awards)") is buried in an event.
- **Rep/levels** show on Me, People and the forum, but nothing explains what they unlock.
- Speed cameras, road reports and shops on a meet app.
- "Coming later: cruise mode and walkie-talkie" in Settings.

**Naming**
- The map layer **Photos** is really photo spots, and it's separate from **Posts**.
- "Places" means drives, tracks, photo spots and meet spots.
- The People section is titled "Cars near you" but includes bikes.
- "Hosting 3 now" counts future events.
- "Stop" means a single meet location.
- "Sample area" as a place name.
- "you can go" under every event, even ones whose invite doesn't match my vehicle.
- "Count without directions" isn't clear.
- "Tune stage" sits under "Mods (n)" and counts as a mod.
- "Tomorrow" at 00:30 means the day after today.
- Class jargon ("2S 2A 1B") appears before the user knows what classes are.

**Icons and visual**
- All tab and event icons are the same orange hexagon shape, so meets, cruises, rolling meets and hosting are hard to tell apart at a glance.
- Map pins bleed through the bottom sheet.
- Tab labels are clipped at the screen bottom on both viewports.
- "Any make" is in caps, but make chips are mixed case ("Audi", "BMW").

**Inconsistent rules**
- Chip multi-select semantics differ: Host (all on = all), People (all off = all), Add build (single choice).
- The demo's "Coffee and cars" shows 03:18 in a notification and 03:25/03:26 on the event.
- Sample user @tomtom_gr says "stock for now" on a car listed with 5 mods.
- Another user's build tells *me* to "Upload a dyno sheet to verify".

---

## 5. What's genuinely good

- **Car quick search** is excellent: "Civic Type R" gives every generation with engine, years and bhp, and stock specs fill themselves (`21-quicksearch.png`). **Stage presets** with "Add typical parts" are a smart shortcut that UK modders will love.
- **The ban-zone warning** when placing a meet (`72-host-mappicker.png`) is unique, responsible and useful.
- **Privacy is consistent and well explained**: the home area is saved to about 1 km, posts can't be placed near home, there's no live location, and plates are blurred.
- **Chat and the forum** are clean and work first time.
- **The visual identity** (dark, sodium orange, Chakra Petch) feels right for night-time car culture.
- **Drives are untimed, pass or fail**: a good legal stance that's clearly stated.

---

## 6. If I were the product lead

**The core loop** (one sentence): *See what's on near me tonight → say I'm going with my car → turn up, check in, see who else came → get recognised (votes, trophies, class) → come back next week.* Everything should serve that loop. The garage exists to say *what you're bringing*. The map exists to show *what's on tonight*. Chat exists to *coordinate one event*.

**Keep front and centre**
- Tonight / This week events near me.
- The event page (who's going, rough area, drive time, I'm going).
- Check-in and the post-meet vote.
- My garage (one car is enough).

**Cut or hide (for now)**
- Rate builds (cut).
- Forum: merge into the feed or event chat, or hide until there's a community.
- Shops, speed cameras, road reports (hide; they belong to a future driving mode).
- Rep breakdowns and levels on profile cards (keep trophies, hide the numbers).
- Developer switches in Settings.
- The second and third search screens.
- "Suggest a place" as a top-level home tile.

**Suggested tabs**
- **Tonight** (map + list of events).
- **My events** (going, hosting, past).
- **Garage**.
- **Inbox** (event chats, DMs, requests).
- **Me**.

Drives and photo spots become a filter on the Tonight map, not a separate world.

**The first 30 seconds should feel like this**
1. **0–5 s:** one screen: logo, "Car meets near you, tonight." Buttons: **Try it now** (demo) or **Sign in**.
2. **5–15 s:** "What do you drive?" A quick-search box: type "Civic", tap FK8, done. Show the class badge animate in (S!). This is the hook.
3. **15–25 s:** "Where's home?" Use my location (rough area only), done.
4. **25–30 s:** land on **Tonight**: a map with 3 pins and one card, "Late rolling meet · 1.3 mi · 7 going · starts 23:30", with a big **I'm going**. My Civic is pre-selected.

No tips, no region picker, no notification choice, no pre-joined crew, no fake rep.

---

## 7. Functional bugs found

| ID | Bug | Where | Severity |
|----|-----|-------|----------|
| B1 | "Try the demo" (and any URL afterwards) lands on `/credits` with no way out. Likely also for brand-new email sign-ups. | sign-in → demo, `_layout.tsx` `Stack.Protected` | **Blocker** |
| B2 | Check-in at the next stop of the demo rolling meet fails with "You've checked in, so your vehicle is set for this one." | `event/[id].tsx:172`, `lib/events.ts` `checkIn()`, `lib/bringing.ts` `checkInBuild()` | High |
| B3 | Duplicate builds are allowed with no warning, and each adds mod rep (×27 mods → level up). | Add build, Me rep | Medium |
| B4 | A host can publish an event whose invite excludes the host's own vehicle, and Find then says "you can go". | Host form, Find | Medium |
| B5 | Post place: after the "near home" refusal, the next "Use this place" posts with **no place** and no message. | New post | Low |
| B6 | Tab bar labels are clipped at the bottom on 393×852 and 375×667. | Tab bar | Low |
| B7 | Demo event times differ between the notification (03:18) and the event (03:25/03:26). | Demo seed | Low |
| B8 | Another person's build shows "Upload a dyno sheet to verify". | Build detail (not owner) | Low |
| B9 | My outgoing connection request isn't listed under Connections. | Connections | Low |
| B10 | Saving a build opened by a direct link (no history) saves, but `router.back()` does nothing, so the user stays on the form and saves again. That's how the duplicates in B3 were made. | `build/edit.tsx` `save()` | Low (web/deep links) |

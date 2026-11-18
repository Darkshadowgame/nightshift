# Review 10: first-time user

A harsh first look from someone who has never seen Nightshift. Web export (`npx expo export --platform web`), served locally, tested with Playwright at 393x852 (iPhone 15-ish) and 375x667 (iPhone SE), each from cleared storage, through "Try the demo".

- Run 1 (393x852, 13:20, no car): skipped the car, set home area, went to a meet, hosted a meet, used Community, Garage (empty), Me, Settings, Help, Search, bad links and back navigation.
- Run 2 (375x667, browser clock set to 19:40, with a car): picked a Fiesta ST in onboarding, went to a live meet, checked in, voted, added mods, added dyno runs (typed, then with a sheet photo) and checked the Dyno badge.

The web preview has no real map, no address search and no plate detection. I have not marked those down. Screenshots are named below (`shots/NN-name.png`, kept outside the repo).

## Scores

| | Score | Why |
|---|---|---|
| Clarity | 7/10 | The sign-in screen tells you what the app is in under 10 seconds. The evening loop (going, check in, vote) is clear. The event screen and the garage numbers are not. |
| Coherence (one design and UX language) | 6/10 | One colour palette and one type style, but at least four kinds of selector, two date pickers, and nested tab bars that look the same. |
| Look | 7/10 | Dark, orange, chunky and car-scene enough. It looks good in screenshots and crowded on an SE. |

**Verdict: I'd keep it after day one only if I opened it in the evening.** At 19:40 the demo is good: a live meet, check in and vote take three taps. At lunchtime nothing is live, so the main reason to use the app can't be tried, and what is left is a lot of reading. A real user who installs it at lunchtime and finds the same thing will probably not open it again.

## What works

- Sign-in screen: the one line "What's on tonight near you. Go with your car." with three short points is the best screen in the app (`01-first-open`).
- Car search in onboarding finds "Fiesta ST" by generation and fills in factory figures (`61`, `62`).
- At 19:40 the flow is I'm going → Check in at Leisure park car park → Vote for trophies, with clear confirmations (`66`–`69`).
- Every bad link I tried (`/nope`, `/event/nope`, `/user/nope`, `/forum/nope`, `/chat/nope`, `/post/nope`, `/spot/nope`, `/build/nope`, `/crew/nope`, `/shop/nope`, `/zone/nope`, `/event/edit?id=nope`) shows a proper "not found" with a way out. Staff pages say "Staff only". Back from a deep link with no history goes to a sensible tab.
- The For sale listing posts cleanly and Back goes to the forum, not to the form (`45`, `46`).
- With a sheet photo, the Dyno badge shows on the build and in the garage (`82`).
- Plates on sample photos are blurred.

## Problems, worst first

### 1. In the daytime the demo has nothing live, so check-in and voting can't be tried (High)
Screen: Tonight, event. Steps: open the demo at 13:20 → everything is "Later today" or later. "You're going. Check in when you get there." (`07-going-nocar`), but there is nothing to check in to for about six hours. "Restart the demo events" in Settings lays out the same evening times. The demo's job is to show the loop, and for most of the day it can't. A live sample meet should be there whatever the time.
Shots: `06-tonight-nocar`, `07-going-nocar`, `09-event-bottom`.

### 2. Back in the host wizard throws your event away without asking (High, iPhone too)
Screen: Host an event. Steps: + New → Host an event → type a name → Next → tap the header back arrow. You go straight back to Tonight and the draft is gone. There's no "Discard this event?" and no saved draft. On step 4 that's a few minutes of picking lost to one stray swipe. `EventForm.tsx` has no `beforeRemove`/discard guard.
Shot: `52-wizard-back`.

### 3. Typed dyno figures change your class but are called "claimed", and the badge rules are hidden (High)
Screen: Build → Dyno → Type the figures. Steps: type 221 whp with no sheet → class goes from **B to A**, and the figure is labelled "CLAIMED" with no badge. Nothing on the form says a photo is needed for the badge. Then I added a sheet using an ordinary car photo, not a dyno sheet: "✓ Dyno · Dyno proven" (in the demo the phone decides; signed in, the server does). So a number anyone can type moves you into class-invited meets, and the word "proven" covers a car photo. Either typed runs shouldn't change the class, or the form should say plainly what counts.
Shots: `76-se-dyno-form`, `77-se-dyno-saved`, `82-se-dyno-badge`.

### 4. Mods are double counted (Medium-High)
Screen: Edit build → Engine and mods. Steps: tune stage Stage 1 + tap ECU remap + Cold air intake → "Mods (3)": "Stage 1 tune" and "ECU remap" count as separate mods. A Stage 1 tune is an ECU remap. That inflates the mod count, the rep and "Minimum mods" invite matching.
Shots: `72-se-mods-picked`, `74-se-build-saved`.

### 5. Three different power numbers, and they don't agree (Medium-High)
Screen: Garage, Build. The garage shows **221 whp** next to **224 bhp/tonne**, which comes from an estimated 260 bhp at the crank. The build page adds "**290 on the car scale**", a third number that is never explained. Before the dyno run the garage said 198 bhp/tonne and the build page said 257 on the scale. A first-time user can't tell what decides their class.
Shots: `75-se-build-page`, `79-se-garage-dyno`.

### 6. "People near you" is on by default (Medium-High, iPhone too)
Screen: Community → People; Settings → Privacy. A brand-new user goes straight into a list that shows a rough distance from their home ("Under 5 mi"). Turning it off is buried in Settings. The profile footer says "Nightshift never shows where anyone lives or where they are", which sits badly next to "Under 5 mi". For an app that sells itself on privacy, this should be opt-in, asked once.
Shots: `36-people`, `37-profile`, `50-settings`.

### 7. The event screen says the same thing four or five times (Medium)
Screen: event. "Location shows at 18:00" appears in the header line, as the "Location in" tile, as a section heading with a paragraph, under the meet-point map, and again as a pin label. "Starts in 5h 38m" appears twice. Once live, the tile says "Shown / LOCATION", which reads like a bug. The useful parts (who's going, chat, vote) are pushed below the fold.
Shots: `07-going-nocar`, `09-event-bottom`, `66-se-going-live`.

### 8. On an SE the Tonight sheet covers the map (Medium)
Screen: Tonight, 375x667. The "Start here" sheet with the big I'M GOING button takes about three quarters of the screen. The map controls on the right are clipped, and the zoom-out button is half hidden. On 393 the closed sheet says "2 today" and lists only one.
Shots: `65-se-tonight-car-live`, `10a-tonight-after-going`.

### 9. Onboarding step 2 hides its own buttons on an SE, and the demo makes you set a home anyway (Medium)
Screen: Welcome step 2, 375x667. Above the fold: a blank map, "NOT SET YET" and a disabled "SHOW ME TONIGHT · Set your home area first". The two buttons that set it (Choose on map / Use my location) are below the fold. For the demo, a ready-made sample area should be the default.
Shots: `63-se-step2`, `03-step2`.

### 10. Brand search says "No make called that" for the brand you just picked (Medium)
Screen: Host → Who's invited → Brands. Steps: search "Lotus" → tap it → the Lotus chip is selected, and right under it: "No make called that in the list." The search box keeps the text. The class row (S A B C D) also has no explanation on this screen.
Shots: `24-brand-search`, `25-invite-bottom`.

### 11. Too many selector styles (Medium, coherence)
- Radio-dot chips: event type, day, time, end time, mods, radius, board, condition, hour grid.
- Tick chips: vehicles, class, brands.
- Segmented pills: car/bike, map/list, wheels/crank, units.
- Plain outlined chips that are category tabs in "Add parts", but look exactly like the toggles under them.

Dates are a 60-row list in the host flow (`15-pick-date`) but a typed `YYYY-MM-DD` box in the dyno form (`76-se-dyno-form`). Pick one control per job.
Shots: `14-host-2`, `23-host-4`, `71-se-add-mod`.

### 12. Two identical tab bars stacked on Community (Medium)
Screen: Community. Feed/People/Forum/Messages sits on top of Near you/Connections, and both look the same. They are different levels of navigation, so they shouldn't look alike. On an SE the header and the two bars use about 200 px before any content.
Shots: `33-community`, `85-se-community`.

### 13. A first open starts with 5 notifications that copy the list (Medium-Low)
Screen: bell. All five say "New … near you" for the five events already on Tonight, including the one I had just said I was going to. The Community tab opens with a 5 badge (seeded requests and messages). Badges on the first minute train people to ignore them.
Shot: `11-notifications`.

### 14. "Add a mod" opens the whole Edit build form (Medium-Low)
Screen: Garage → Add a mod. You land partway down a four-section form (make, power, mods, photos), with Save at the very bottom and Delete build next to it. Adding one part should be a short sheet.
Shot: `71-se-add-mod`.

### 15. Me doesn't show that you checked in, and levels are only text (Low-Medium)
Screen: Me. After checking in, the event still says "GOING", not "Checked in". "Level 1 · Newcomer · 210 rep · 40 to Level 2" can't be tapped. The ladder (Newcomer → Legend) and what earns rep are only explained in a paragraph in Help.
Shot: `83-se-me`.

### Smaller problems
- **Scope creep in Settings:** turn-by-turn, a British voice, speed-camera alerts and a choice of map icon (hatchback, saloon…), plus Home/Work "for directions" in Search. That's a sat-nav inside a meets app. Speed-camera alerts in a modified-car app also invite the wrong headlines. (`50-settings`, `30-search`)
- **Toasts cover the main buttons:** "You're going…" sits on top of the going list and the Navigate button. (`07`, `66`)
- **The For sale form shows all 8 boards** on a screen titled "For sale or wanted", so you can switch it to Advice. The price hint says "450 ono" and there is also a separate ONO switch. (`44-sale-form`)
- **Chat:** your messages are the same grey as theirs; only the alignment differs. (`41-chat`)
- **Connect:** the profile says "Requested · Waiting for @tomtom_gr to accept", but Connections already lists them as connected with a Message button (demo auto-accept). (`38`, `39`)
- **Host "When":** after picking Fri 27 Nov a "10:00" start chip appears from nowhere. The default start is 22:30 even for "Tonight". (`16`, `18`)
- **Voting:** eight trophies per meet is a chore. "Best stance" offers a Ninja 400. (`68-se-vote`)
- **Search:** no "no results" line, only "Address search works in the iPhone app". (`32-search-none`)
- **Post page** has no title in its header and shows a map of where the poster parked. (`34-post`)

## What I'd fix first

1. A sample meet that is live whatever the time of day.
2. A discard confirm (or a saved draft) in the host wizard.
3. Typed dyno runs shouldn't change class; say what earns the badge.
4. Stop counting Stage N and ECU remap as two mods.
5. One power figure and one class number, explained in one line.
6. Make People near you opt-in.
7. Cut the event header down to one countdown and one "location shows at" line.

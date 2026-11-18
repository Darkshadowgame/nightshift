# Review 9: first-time user

Tested on the web export (demo mode, cleared storage) at 393x852 and 375x667, on Wednesday around midday UK time. Screenshots were saved outside the repo (scratch folder `r9/shots`); the file names are listed so the steps can be repeated. The web preview has no Apple map, so the map look itself is not marked down.

I did not read earlier reviews before testing.

## Scores

| | Score | Why |
|---|---|---|
| Clarity | 7/10 | The sign-in screen says what the app is for in one line, and "I'm going" then "Check in" then "Vote" is easy to follow. It falls apart if you skip the car, and for anything past this week. |
| Coherence | 5/10 | Three different back buttons, two stacked segment bars on Community, four ranking systems (class, level, rep, Legend), and a satnav with speed cameras inside a meets app. |
| Look | 7/10 | Dark and orange works, the event page and the garage card with a real photo are screenshot-worthy. Photo credits printed over every picture and the empty grey car outlines pull it down. |
| **Day-one verdict** | **Maybe** | I would keep it if there were real meets near me. The core loop is good. But a new user who skips the car step sees an empty app, and a "Tonight" tab at midday showing a "live" leisure-park meet does not feel real. |

## What works

- Sign-in screen: the purpose is clear in under 10 seconds ("What's on tonight near you. Go with your car.") and the three bullets explain the loop.
- Car search in onboarding is excellent: "type r" lists every Civic/Integra Type R by chassis code with bhp. Picking the FK8 fills in power and weight.
- From Tonight, "I'm going" goes straight to the event, then "Check in" then "Vote for trophies". Three taps, and each step tells you what comes next.
- The 5-step host flow is quick and the review step reads well.
- The crop tool, the For sale listing form (with price check) and the not-found screens for events, builds, people, threads, chats and posts are all done properly.

## Problems, worst first

### 1. Skip the car and Tonight is empty (critical)
- **Screen:** Tonight, map and list.
- **Steps:** Clear storage, Try the demo, Skip for now on "What do you drive?", set home, add handle, Show me tonight. Switch to List.
- **What happens:** The list says "Your events: Nothing yet. Say you're going to something below, or host one." and there is nothing below. The map sheet says "TODAY NEAR YOU" and shows a track day **9 days away** as "Next up". The four local meets, including the one that says "Open to any car or bike", are gone from the map and list.
- **Why it matters:** "Skip for now" is offered as a normal choice. The first thing a skipper sees is a dead app. Show every event that could be open to them, with "Add your car to go" on the button.
- **Shots:** `91-se-tonight-nocar.png`, `92-se-list-nocar.png`.

### 2. Tonight hides everything after this week, but the map and notifications show it (high)
- **Screen:** Tonight list vs map, notifications, search.
- **Steps:** With a car set, open List. Then open the bell.
- **What happens:** The list stops at "This week". The bell says "New show near you: Modified show day, Mon 30 Nov" and "Curborough Sprint Course evening, Fri 27 Nov". Neither is in the list. Both are pins on the map. Search finds them. So the map, the list and the notices each show a different set of events.
- **Fix:** Add a "Coming up" section (or a "See all" row) at the end of the list.
- **Shots:** `13-tonight-list.png`, `71-notifications.png`, `72-show-event.png`.

### 3. "Tonight" at midday shows daytime meets as live (high, demo)
- **Screen:** Tonight.
- **Steps:** Open the demo at about 12:00.
- **What happens:** "Live now: Car park meet-up 11:38–14:38" and "Rolling meet, live", plus "Later today: Coffee and cars 14:58". The demo times are set relative to now, so at lunchtime the tab called Tonight is full of lunchtime car-park meets. It reads as fake. Put the demo events in the evening (tonight 19:00–23:00) whatever time the demo starts.
- **Shot:** `08-tonight-first.png`.

### 4. Host flow: you can only pick from 8 start times and 5 vague days (high, also on iPhone)
- **Screen:** Host an event, step 2.
- **What happens:** Start times are 06:00, 09:00, 19:00, 20:30, 22:00, 22:30, 23:00, 23:59. No 10:00 for a Sunday coffee meet, no 19:30, no 21:00. Days are Tonight, Tomorrow, In 2 days, This weekend (Saturday only, no Sunday), Next week (it picked Wed 25 Nov). There is no end time, so you can't say how long it runs. A real organiser can't post a Sunday 10:00 show with this.
- **Fix:** Keep the quick chips, and add a "Pick a date and time" option plus an end time.
- **Shots:** `21-host-step2.png`, `22a-host-weekend.png`.

### 5. Host flow: brands list is 15 makes (high)
- **Screen:** Host an event, step 4 (Who's invited).
- **What happens:** Volkswagen, Audi, BMW, Ford, Honda, Toyota, Nissan, Subaru, Mercedes, Vauxhall and five bike makes. No Hyundai, Kia, Mazda, Mini, Peugeot, Renault, Seat, Cupra, Skoda, Porsche, Citroën. The sample host at the first meet drives a Hyundai i30 N and could not run a Hyundai meet. The people list includes a Saxo, an MX-5 and an i30 N, none of whose makes can be invited.
- **Also:** The "Public: any car or bike" switch is off by default, but the line under it says "Pick nothing in a row to invite everyone in it", so off and on both mean everyone. Pick one rule.
- **Shot:** `26-host-step4.png`.

### 6. Unknown links show Expo's developer page (high, also on iPhone universal links)
- **Steps:** Open `/some/random/path` or `/dev`.
- **What happens:** White-on-black "Unmatched Route. Page could not be found." with a "Sitemap" link that lists every screen file in the app (`_sitemap`). There is no `+not-found` screen. Add one in the app style that goes to Tonight.
- **Shots:** `73-deeplink_some_random_path.png`, `74-route__sitemap.png`.

### 7. Staff screens are open to anyone and show internal notes (medium)
- **Steps:** Open `/moderation-team`.
- **What happens:** "No team yet. The owner adds themselves first (docs/MODERATION.md)." A user sees a file path from the repo. `/moderation` at least says it's staff only. Hide these routes for non-staff and remove the doc reference.
- **Shot:** `74-route_moderation_team.png`.

### 8. Vote cards: the third build is off-screen with no hint (medium)
- **Screen:** Event, Vote for trophies.
- **What happens:** Each trophy row shows two cards that fill the width exactly. The third (@bex_gti, Golf GTI) sits at x=403 on a 393 screen. Nothing peeks in, so you would think there are only two to choose from. Also six trophies x the same three cards is a long, repetitive scroll.
- **Fix:** Make cards narrower so the next one peeks, or show a list with a small photo.
- **Shots:** `11-vote.png`, `12-voted.png`.

### 9. Photo credits printed over every photo (medium)
- **Screen:** Feed, vote cards, profiles.
- **What happens:** "Charles from Port Chester, New York · CC0 · similar car: BMW M4 Coupé G82, 2025 facelift · plate blurred" over a post that says "Golden hour at the old airfield car park". The photo is a daytime driveway. "similar car: Golf GTI Mk7.5 (the 2017 facelift)" on vote cards. The post photo of the M4 is grey and the linked build thumbnail is green. It kills the feeling that these are real people's cars.
- **Fix:** Move credits to a small (i) tap or the Credits page, and pick feed photos that match the caption.
- **Shot:** `32-community.png`.

### 10. Search doesn't find people by their car (medium)
- **Screen:** Search.
- **Steps:** Search "golf".
- **What happens:** Nothing, although @bex_gti has a Golf GTI and is 16 mi away. "i30" finds @em_i30n only because it's in the handle. In a car app, the car is the first thing you search for.
- **Shot:** `16-search-golf.png`.

### 11. Garage: adding mods is hidden in the ··· menu (medium)
- **Screen:** Garage, then the build.
- **Steps:** Onboarding says "Add your mods in the Garage later". Open Garage.
- **What happens:** The Garage card has no "Add mods" or "Edit" button. You have to tap the card (nothing says it can be tapped), then see "Mods (0): Stock for now." with no button, then find ··· > Edit build. "Upload a dyno sheet to verify" has no button either.
- **Also:** Your second build (the MT-07) is drawn bigger than your main build, and with no photo it's a huge grey outline.
- **Shots:** `53-garage.png`, `54-build.png`, `56-build-menu.png`, `67-bike-saved.png`.

### 12. Three different back buttons and two header styles (medium)
- **What happens:** Event, chat, build and edit build use "←". Host an event, New post, Connections and Settings use "‹" with a title in capitals. The same event page shows "‹" when opened from a link and "←" when opened from Tonight. The event and build pages have no title in the header. Tab headers differ too: Tonight and Community have + New and the bell, Garage has + New only, Me has neither.
- **Shots:** `09-im-going.png`, `19-host-step1.png`, `52-group-chat.png`, `82-se-event.png`.

### 13. The app is trying to be a satnav too (medium, scope)
- **Screen:** Settings.
- **What happens:** Settings opens with "Navigate opens: Nightshift" (turn-by-turn with a British voice), speed camera alerts, your car icon on the map, shops, road reports, and the map layers sheet has nine layers. The Tonight map has five layers on by default, so four events are lost among tracks, drives and meet-spot clusters. This app is about tonight's meets. Default the map to Events only and make the rest opt-in.
- **Shots:** `69-settings.png`, `87-se-layers.png`, `80-se-tonight.png`.

### 14. Too many scores (medium)
- **What happens:** Class S–D (build power to weight), Level (you), Rep (you, 150 per check-in), Legend (weekly best in show), trophies, and "Class A from 324 weight-adjusted bhp". Every event page needs a paragraph to explain it ("Class S to D is a build's power to weight. Legend is…"). A new user doesn't need four systems on day one. Hide Level and rep until they mean something, and lose "weight-adjusted bhp".
- **Shots:** `10-checked-in.png`, `39-people.png`, `54-build.png`.

### 15. Connect request silently becomes "connected" (low-medium, demo)
- **Steps:** People > @tomtom_gr > Connect. The profile says "Requested. Waiting for @tomtom_gr to accept." Then open Requests.
- **What happens:** Tom is already listed under Connections with a Message button, and his profile now says Connected. No notice that he accepted. Either keep him pending or tell the user "Tom accepted".
- **Shots:** `41-connect.png`, `42-requests.png`.

### 16. Smaller problems
- **Onboarding:** In the demo you must type a handle before you can see anything. Suggest one. The red "Location is off" error stays on screen after you have set your home on the map (`90-se-step2-state.png`).
- **Onboarding vs privacy:** Onboarding says home is "saved to about 1 km, never your exact address", then Search says "Search your address and save it as Home to make it exact" (`15-search.png`).
- **Tonight:** "YOU CAN GO" is on every card. If it's always true it tells me nothing. Only mark the ones I can't go to.
- **Tonight:** The live meet shows twice in the first sheet (Start here card and the Live now list). An event you host shows under "Later today" in the map sheet but under "Your events" in the list.
- **Check-in:** The button promises 150 rep, but checking in doesn't confirm it.
- **Me:** No list of events you are going to, went to, or are hosting. Trophies says "Check in at a meet…" after you have checked in.
- **Host:** Share is hidden in the ··· menu. The host's main job after posting is to share it. After sending, "Invites sent to 1 person" with no clue who.
- **For sale:** "250 ono" is rejected ("Give the price in pounds"). The ONO switch only appears after a valid number. The "Sell or find a part" sheet opens a screen titled "New thread". "Postage only" sits next to "meet somewhere public and pay in person".
- **Edit build:** You can add a cat-back and a decat together while Tune stage stays on "Stock". Bikes get Turbo and Stage 1–4 options.
- **Post:** "Plates are checked on the cropped photo next", but nothing visible happens on web. The Ford Focus RS photo was linked to my Civic build with no check.
- **Console:** `NotFoundError: Failed to execute 'removeChild'` when picking a photo from the library on web.
- **Tab bar:** accessible names are mixed case ("Tonight", "5 COMMUNITY", "Garage", "ME").

## Would I keep it after day one?

Maybe, if there were real meets near me. The core loop (see a meet, say you're going, check in, vote) is good and better than a Facebook group. But on day one I'd hit an empty Tonight if I skipped the car, a host form that can't post a Sunday 10:00 show, and a lot of settings for things I didn't come for. Fix 1 to 6 before anyone outside the team sees it.

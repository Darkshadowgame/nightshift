# Nightshift: App Store submission

Everything for the first App Store submission that doesn't need the paid Apple
Developer account, plus the steps that do. Prepared 17 Nov 2026.

**Status in one line:** the legal pages are live, the app links to them, the
18+ and terms box is on the sign-in screen, account deletion works, and the
copy below is ready to paste. Before you submit: pick the support email, set
up the sign-in email (SMTP), make the App Review account, and decide on the
three review risks marked **HIGH** below.

## 1. URLs (live on GitHub Pages)

| What | URL | Where it goes in App Store Connect |
|---|---|---|
| Marketing | https://darkshadowgame.github.io/nightshift/ | App Information › Marketing URL (optional) |
| Support | https://darkshadowgame.github.io/nightshift/support.html | Version › Support URL (required) |
| Privacy Policy | https://darkshadowgame.github.io/nightshift/privacy.html | App Privacy › Privacy Policy URL (required) |
| Terms of Use (EULA) | https://darkshadowgame.github.io/nightshift/terms.html | App Information › License Agreement › custom EULA, or put the link at the end of the description |
| Community Guidelines | https://darkshadowgame.github.io/nightshift/guidelines.html | In the app and the Terms |

* Source: `site/` on `main`. Served from the `gh-pages` branch (GitHub Pages,
  "Deploy from a branch", legacy build: no Actions needed). To publish a change:

  ```bash
  git commit -m "..." site/
  git push origin "$(git commit-tree "$(git rev-parse HEAD:site)" -p origin/gh-pages -m "Publish site")":refs/heads/gh-pages
  ```

* The app's copy of the URLs and credits: `src/lib/legal.ts`.
* **TODO (owner):** every page says `support@<domain-to-be-decided>` in a red
  TODO box, and the Privacy Policy has a TODO for the controller's name and
  postal address. When you've chosen them, replace them in `site/*.html`, set
  `SUPPORT_EMAIL` in `src/lib/legal.ts`, and republish. The name and address can
  be a trading name and a business address, and need to match your ICO registration.
  Apple 1.2 asks for "published contact information": the Support page must have a
  real address before you submit.

## 2. What's in the app (built, OTA)

* **Settings › About and legal:** Community Guidelines, Terms of Use, Privacy
  Policy and Support (open in Safari), and **Open data and credits** (new
  `credits` screen: Apple Maps, OpenStreetMap/ODbL, Wikimedia Commons, TfL, OGL,
  ban-zone sources, fonts, and the car-makes note).
* **Sign-in screen:** a required box, "I'm 18 or over and I agree to the Terms of
  Use and Community Guidelines. Zero tolerance for abuse, harassment or organising
  street racing", with links to the Terms, Community rules and Privacy. Code
  sign-in won't send until it's ticked; it stays ticked on that phone until the
  terms version (`TERMS_VERSION` in `signin.tsx`) changes. The demo stays open
  without it (nothing is shared in the demo).
* **Account deletion:** Me › Settings (header) › Account › **Delete my account**,
  with a confirm box. Checked: it removes the person's Storage files (now also the
  Community `messages` bucket, skipped while that bucket doesn't exist yet), then
  `delete_my_account()` deletes the auth user and everything cascades (pgTAP
  `account_test.sql`, smoke test step "delete_my_account"). Demo: "Reset demo data".
  Apple 5.1.1(v) is met.
* **App Review sign-in:** an email that starts `appreview` (e.g.
  `appreview@<your domain>`) shows a password box on the sign-in screen, because a
  reviewer can't receive our codes. Only an account you create with a password can
  use it (section 6).
* Reworded the Road reports layer hint in Settings so it no longer advertises
  police checks.

### Info.plist strings: change in the next native build, not on main

Changing `app.json` changes the fingerprint
(`f9269ad75c65cba49bc104e1690524c778060d0d`), so these wait for the next native
build. The current location string is good. What `expo config --type introspect`
shows today and what to change:

| Key | Today | Change to |
|---|---|---|
| `NSPhotoLibraryUsageDescription` | "…so you can add pictures of your build." | "Nightshift uses your photos so you can add pictures of your builds, posts, messages and the places you visit. Number plates are blurred on your phone before anything is uploaded." |
| `NSCameraUsageDescription` | "…so you can photograph your build." | "Nightshift uses the camera so you can photograph your build, a photo spot or a meet. Number plates are blurred on your phone before anything is uploaded." |
| `NSMicrophoneUsageDescription` | Generic "Allow $(PRODUCT_NAME) to access your microphone" (added by expo-image-picker) | Remove: `"microphonePermission": false` in the expo-image-picker plugin. If voice search ships (branch `native-voice-search`), use instead: "Nightshift uses the microphone when you tap the mic in Where to? so you can say where you're going." plus `NSSpeechRecognitionUsageDescription`: "Nightshift turns what you say in Where to? into a search. Nothing is kept." |
| `NSLocationAlwaysAndWhenInUseUsageDescription`, `NSLocationAlwaysUsageDescription` | Generic, added by expo-location although the app never asks for Always | Remove: `"locationAlwaysAndWhenInUsePermission": false, "locationAlwaysPermission": false` in the expo-location plugin |
| `NSMotionUsageDescription` | Generic, added by expo-location | Remove: `"motionUsagePermission": false` (the app doesn't use motion) |
| `NSLocationTemporaryUsageDescriptionDictionary` › `ExpoLocationFullAccuracy` | Generic | `"locationFullAccuracyPermission": "Nightshift needs your precise location to check you in at a stop and guide you turn by turn."` |
| `ITSAppUsesNonExemptEncryption` | `false` | Keep (see section 5) |

Apple rejects vague purpose strings (5.1.1(i)); the generic ones are the most likely
reason for a metadata rejection on the first build. Check with
`npx expo config --type introspect --json | jq .ios.infoPlist` before the build.

## 3. Store listing (ready to paste)

### Name (30 characters max)

**Use: `Nightshift: Car & Bike Meets`** (28).

Name check (App Store search, GB, 17 Nov 2026): plain "Nightshift" is not free to
use alone. "NightShift: Party & Events" (Entertainment) already exists, plus
several "Night Shift" games, and Apple's own iOS display feature is called **Night
Shift** (guidelines 4.1(c) and 5.2.5: nothing confusingly similar to an Apple
product). Keeping a descriptor in the name keeps it unique and clearly not Apple's
feature. The home-screen name stays "Nightshift" (`expo.name`).

Alternatives if it's refused or you want to steer further from Apple's Night Shift:
`Nightshift Meets`, `Nightshift: UK Car Meets`, `Nightshift Drive Club`,
`NSX: Night Scene` (check), `Afterdark Meets`, `Late Shift: Car Meets`. Also get a
UK IPO search done before spending on branding (research/legal.md section 8).

### Subtitle (30 max)

`UK meets, cruises and drives` (28). Others: `Meets, cruises & track days` (27),
`The UK car and bike scene` (25).

### Promotional text (170 max, can change any time)

> Find tonight's meets and cruises near you, show off your build, and drive the UK's best roads with turn-by-turn directions and speed camera alerts. Legal meets only.

(166 characters.)

### Description

> Nightshift is a live map of the UK car and bike scene. Meets, cruises, rolling meets, shows and track days, the best driving roads and photo spots, all on one dark map that feels like your favourite racing game, built for the real world and the right side of the law.
>
> FIND WHAT'S ON
> • Events near you: meets, cruises, rolling meets, shows and track days, nearest first.
> • Set how far you'll travel and get told when something new is on.
> • Request to go, check in at each stop and vote for the best builds afterwards.
> • Exact stops stay hidden until they unlock, so meets stay with the people going.
>
> HOST YOUR OWN
> • Plan a meet or a cruise with stops, a time and who it's for: cars, bikes, classes or makes.
> • Co-host with mates or your crew, move a rolling meet on with one tap.
> • Ban zones (council and court orders) are on the map, with a warning if your stop is inside one.
>
> YOUR GARAGE
> • Add your car or bike from thousands of makes and models with stock specs.
> • Log mods, tune stages and dyno figures; each build gets a class from S to D.
> • Number plates are found and blurred on your phone before a photo is saved.
>
> DRIVE IT
> • Great roads and photo spots across the UK, plus circuits, cafés and shops.
> • Turn-by-turn directions with a British voice, fixed speed camera and average-speed zone alerts, and road reports from other drivers.
> • Or open the route in Apple Maps, Google Maps or Waze.
>
> THE COMMUNITY
> • Posts, a forum for advice and builds, and messages with people you connect with.
> • Earn rep for good places, confirmed road reports and trophies at meets. Nothing is ever scored for speed.
>
> PRIVATE BY DESIGN
> • Nobody is ever shown on the map. Your home area is saved to about 1 km, and only you can see it.
> • No ads, no tracking, and we never sell your data.
> • Report and block anyone. Zero tolerance for abuse, harassment and organising street racing.
>
> Try it straight away with the demo, no account needed. Signing in takes an email code, no password.
>
> Nightshift is for over-18s. Drive legally, follow road signs and set your route before you go. Speed camera and road information may be incomplete.
>
> Terms of Use: https://darkshadowgame.github.io/nightshift/terms.html
> Privacy Policy: https://darkshadowgame.github.io/nightshift/privacy.html

Check the Community paragraph against what ships on the day: describe only what's
in the submitted build (2.3.1: no hidden or unbuilt features).

### Keywords (100 max, comma-separated, no spaces needed)

`car meet,bike meet,cruise,car show,track day,modified,JDM,petrolhead,garage,motorbike,road trip,UK`
(98 characters). Don't add other apps' names, "Need for Speed", "NFS" or car
makers' trade marks (5.2.1, 2.3.7). Words in the name and subtitle already count,
so "meets", "drives" and "Nightshift" aren't repeated.

### Category

* **Primary: Social Networking** (most UK competitors: FullRev, WheelMeet, Ryvve,
  Overtune). It matches what review will see: profiles, events, chat, posts.
* **Secondary: Navigation** (the driving view, cameras and road reports).
* Lifestyle is the fallback primary if you'd rather not sit in Social Networking.

### Copyright

`2026 <your legal or trading name>` (the seller name on the store is your legal
name as an individual developer).

### Age rating

Answer the questionnaire honestly (2.3.6), then set **Age Rating Override: 18+**,
because the Terms are 18+:

| Question | Answer |
|---|---|
| Parental controls / age assurance in the app | No (self-declared 18+ only) |
| Unrestricted web access | No (only fixed links open in Safari) |
| User-generated content | **Yes** |
| Messaging and chat | **Yes** |
| Advertising | No |
| Gambling, contests, loot boxes | No |
| Medical or wellness topics | No |
| Cartoon/fantasy violence, realistic violence, horror | None |
| Profanity or crude humour | Infrequent/mild (user content, filtered) |
| Mature/suggestive themes, sexual content, nudity | None |
| Alcohol, tobacco or drug use or references | None |
| Simulated gambling | None |
| Guns or other weapons | None |

### App Privacy ("nutrition label")

Tracking: **No** (no data is used to track people across other companies' apps or
websites; no ad SDKs, no analytics SDKs). Every item below is **linked to the
user**, **not used for tracking**, purpose **App Functionality** unless stated.

| Apple data type | Collected? | What it is in Nightshift |
|---|---|---|
| Contact Info › Email Address | Yes | Sign-in (and replies to support) |
| Contact Info › Name | Yes | Optional display name on the profile |
| Location › Coarse Location | Yes | Home area snapped to ~1 km; rough distances in Cars near you |
| Location › Precise Location | Yes | Road reports keep a point rounded to ~10 m (deleted 2 days after they end). Check-in and drive positions are checked and not stored, so they alone wouldn't count, but road reports do |
| User Content › Photos or Videos | Yes | Build, post, place and message photos (plates blurred, metadata stripped) |
| User Content › Emails or Text Messages | Yes | Private messages and event chat |
| User Content › Other User Content | Yes | Builds, events, posts, forum, places, ratings, votes, road reports |
| User Content › Customer Support | Yes | In-app feedback (purpose: App Functionality) |
| Identifiers › User ID | Yes | The account id |
| Diagnostics › Other Diagnostic Data | Yes | App version, update id and device model sent with feedback |
| Usage Data, Health, Financial, Contacts, Browsing/Search History, Sensitive Info, Purchases, Device ID, Advertising Data, Crash Data, Performance Data | No | |

Notes: search text goes to Apple's geocoder on the phone and isn't sent to us.
Wikimedia only receives a place's coordinates. Expo (EAS Update) sees update
requests with the app version and the phone's IP, which isn't stored by us or used
to identify anyone; Apple's guidance treats this as not "collected". When push
notifications come (paid account), the push token is a Device ID-like identifier:
add **Identifiers › Device ID** then if you store it with the account.

## 4. Review notes (paste into App Review Information › Notes)

> Nightshift is a UK app for legal car and bike meets (meets, cruises, shows and track days), places to drive and photograph cars, and turn-by-turn directions.
>
> HOW TO GET IN
> 1. Quickest: on the first screen tap "Try the demo without an account". This is a full local demo with sample people and events placed around the reviewer's location; nothing is uploaded. Settings > Demo > "Skip the GPS check" lets you check in at stops and visit places from anywhere (demo only; it doesn't exist when signed in).
> 2. Signed in with real content: type the demo account email below. A password box appears for this account only (normal users sign in with an emailed 6-digit code). Email: appreview@<domain> · Password: <in the field below>.
>
> SAFETY AND USER CONTENT (Guideline 1.2)
> - 18+ only. Sign-up requires agreeing to the Terms of Use and Community Guidelines (zero tolerance for abuse, harassment, plates and organising street racing).
> - Report on posts, replies, messages, profiles and builds; block from any profile; three reports hide a post until a moderator reviews it; public text passes a word filter. Reports are reviewed within 24 hours.
> - Number plates are detected and blurred on the device before photos are saved.
>
> LOCATION
> - When-in-use only. Users are never shown on the map; the home area is stored rounded to ~1 km and only the owner can read it.
>
> SPEED CAMERAS AND ROAD REPORTS (Guideline 1.4.4)
> - Fixed speed camera and average-speed zone sites come from OpenStreetMap (legal to show in the UK). Nothing in the app records, scores or rewards speed; there are no timed public-road routes. Lap times are only for real circuits.
>
> ACCOUNT DELETION: Me > Settings > Account > Delete my account.
> Notifications are local reminders only (no push).

Fill in **Sign-in required: Yes**, the user name and password of the review account,
and a contact phone and email for the reviewer.

## 5. Export compliance

`ITSAppUsesNonExemptEncryption` is already `false` in `app.json`, so App Store
Connect won't ask per build. The app only uses encryption built into iOS
(HTTPS/TLS to Supabase, Apple and Expo) and doesn't implement its own. That's
exempt under Category 5 Part 2 (the "standard encryption" exemption): no
documentation, and no French declaration needed. If asked: "Does your app use
encryption?" Yes; "Does it qualify for any exemptions…?" Yes (only uses standard
encryption in the OS / HTTPS).

## 6. The App Review account (owner, before submitting)

1. Pick the address: `appreview@<your domain>` (any address starting `appreview`
   gets the password box). It doesn't need a working mailbox.
2. Supabase dashboard › Authentication › Users › **Add user** › Create new user:
   that email, a strong password, **Auto Confirm User** ticked. (Or the admin API
   with the secret key from the secrets file; never commit the password.)
3. Sign in once on the iPhone with it and finish the profile: handle
   `appreview`, region "London", home area by postcode in central London (any
   public postcode, never a real home). Add one build with a photo.
4. Give it something to look at: host one public meet and one cruise near that
   area for the review week, and ask a mate's account to go to one, post once and
   send it a message, so chat, posts and messages aren't empty.
5. Put the email and password in App Store Connect › App Review Information. After
   approval you can change the password or delete the account.

## 7. Screenshots

Required: **6.9-inch** (1320 × 2868 portrait, or 1290 × 2796) — Apple scales it down
for smaller iPhones. Also upload **6.5-inch** (1284 × 2778, or 1242 × 2688) if you
want control of how older phones look. iPad isn't needed (`supportsTablet: false`).
Up to 10 per size; the first three show in search, so they matter most.

Take them on a real iPhone 16/17 Pro Max (or the Simulator once you have Xcode via
the paid account) in the demo, signed out of nothing personal: **no real names,
emails, home areas or readable plates** in any shot.

| # | Screen | What it shows | Caption idea |
|---|---|---|---|
| 1 | Map tab at night, several event and place pins, Next up card | The live scene near you | THE SCENE AFTER DARK |
| 2 | Event detail: a rolling meet, stops timeline (one unlocked), going list, chat | Meets that stay with the people going | MEETS THAT UNLOCK ON THE NIGHT |
| 3 | Build page: class badge, stats, mods, a plate-blurred photo | Your build, game-style | YOUR BUILD, YOUR CLASS |
| 4 | Driving view on a great road: turn banner, camera ahead | Turn by turn with camera alerts | DRIVE THE BEST ROADS |
| 5 | Drive or photo spot page with nearby photos (credited) | Places worth the trip | ROADS AND SPOTS WORTH THE TRIP |
| 6 | Find: filters and results nearest first | What's on near you | WHAT'S ON NEAR YOU |
| 7 | Community: forum or posts | The community | THE UK SCENE IN ONE PLACE |
| 8 | Host an event form with the invite filter | Host your own | HOST YOUR OWN |
| 9 | Settings › Privacy card, or the plate review screen | Private by design | NO PLATES. NO TRACKING. |
| 10 | Track page with lap records | Times only count on track | SAVE IT FOR THE TRACK |

Don't show the "Police / speed check" tile in any screenshot. The ban-zone warning is
a good one to include somewhere (it shows the app is on the side of the law).

App preview video: optional, skip for v1.

## 8. Review-guideline risk scan (17 Nov 2026, the app as on `main`)

| # | Risk | Guideline | Level | Fix |
|---|---|---|---|---|
| 1 | **Report and block must be in the submitted build** for every kind of user content. The Community work adds reports on posts, replies, messages, profiles and builds, and blocks. Not covered: **event chat, events (titles), crews and suggested places**. | 1.2 | **HIGH** | Add `event`, `chat_message` and `crew` to `report_target` (server) and a Report action on the event page, chat messages and crew page; or at least Report on a user's profile reachable from chat. Don't submit before Community ships with report/block. A moderator must actually act within 24 h: the staff have no app screen, so decide who watches `public.reports` (dashboard) and how. |
| 2 | **"Police / speed check" reports** in the driving view. Apple only allows DUI checkpoints published by police; Waze-style police reports exist on the store, but this is the most likely 1.4.4 question for a car-meet app. | 1.4.4, 5.1 | **HIGH** (owner decision 17 Nov) | Safest: remove `'police'` from `REPORT_GRID` in `src/lib/roadReports.ts` (one line, OTA, server untouched) for the review build, and bring it back later if you want. Middle way: rename it "Speed check" (it's 30 min, never on the map). Never show it in screenshots or the description. |
| 3 | **Nobody but the project team can sign in** until custom SMTP is set up (BACKEND.md 7b). A reviewer who tries their own email gets an error, and real users can't join. | 2.1 (completeness) | **HIGH** | Set up Brevo SMTP (BACKEND.md 7b) and the review account (section 6). |
| 4 | Name "Nightshift" vs Apple's **Night Shift** feature, and an existing "NightShift: Party & Events". | 4.1(c), 5.2.5, unique names | Medium | Use `Nightshift: Car & Bike Meets`; alternatives in section 3. |
| 5 | Generic **Info.plist** strings (microphone, Always location, motion, full accuracy) added by plugins. | 5.1.1(i) | Medium | Next native build: section 2's table. |
| 6 | No real **contact details** yet (`support@<domain-to-be-decided>`). | 1.2, 1.5 | Medium | Pick the address; republish the site. |
| 7 | **Age**: self-declared 18+ only. Fine for Apple with the 18+ override; the UK Online Safety Act expects real age assurance or a children's risk assessment (research/legal.md section 6). | 1.2, OSA | Medium (legal, not review) | Now: the sign-up box. Before scale: an age-assurance provider or the OSA children's risk assessment within 3 months of launch. |
| 8 | **Demo "Skip the GPS check"** fakes location. | 1.1.6 | Low | Demo only, labelled "For testing only" and doesn't exist signed in. Mentioned in the review notes. |
| 9 | **Speed cameras**: fixed sites from OSM are legal in the UK and the wording is careful ("Speed limits only", caveat shown). No speed scoring anywhere; drives over 45 mph average don't count; lap times only at circuits. | 1.4.4, 1.4.5 | Low | Keep. Wording checked: no "race", "fastest" or "sprint" outside circuits. |
| 10 | **Settings advertised police checks** ("Police checks only ever show while navigating"). | 1.4.4 | Low | **Fixed (OTA):** now "Some reports only show in the driving view, along your route." |
| 11 | **Brand marks**: app icon is an original NS hexagon; pins are own glyphs; vehicle data is plain-text makes and models. No maker logos in the app. | 5.2.1 | Low | Keep. Credits screen says makes are descriptive only. Users' own photos may show badges: fine. |
| 12 | **Wikimedia Commons photos**: each shows author and licence and links to its file page (`CommonsStrip`); maps, logos and diagrams are filtered out. | 5.2.2 | Low | Keep. Credits screen and site list Commons. |
| 13 | **OSM / ODbL credit**: shown on the map, shop and place screens, and now Settings › Credits. Road reports are kept apart from OSM cameras (no share-alike). | Licence | Low | Done. |
| 14 | **Account deletion** leaves message photos in the `messages` bucket. | 5.1.1(v), GDPR | Low | **Fixed (OTA):** deletion now also clears `messages/{uid}/` (skipped while the bucket doesn't exist). Feedback screenshots in the private `feedback` bucket stay until staff delete them (covered by the Privacy Policy's 2-year line). |
| 15 | **Partners**: paid highlighting is always labelled Partner. | 3.1, 2.3 | Low | Keep. No in-app purchases, so no IAP rules apply. |
| 16 | Data **retention** (90-day chat/check-ins in research/legal.md) isn't automated; the Privacy Policy only promises what's built. | GDPR | Low | Add the pg_cron job before scale, then update the policy. |
| 17 | **Sign in with Apple** isn't offered. | 4.8 | None | Only needed when the app offers third-party logins (Google, Facebook). Email codes are fine. |

## 9. What you (the owner) must do

### Before submitting (no paid account needed)

1. Choose the support email and controller name/address; update `site/` and
   `src/lib/legal.ts`; republish (section 1).
2. Set up the sign-in email: Brevo SMTP (BACKEND.md 7b).
3. Decide risks 1 and 2 (report on event chat; police tile) and make sure the
   Community work with report/block is on `main` in the build you submit.
4. Register with the ICO (data protection fee, about £52 a year) and write the
   Online Safety Act illegal-content risk assessment (a short document; within 3
   months of launch at the latest). research/legal.md sections 4 and 6.

### With the paid account

1. **Enrol** in the Apple Developer Program: developer.apple.com/programs (£79 a
   year, as an individual with your Apple ID and two-factor authentication; your
   legal name is shown as the seller. As an organisation you need a D-U-N-S number
   and the company's name shows instead). Approval takes from minutes to 2 days.
2. **Create the app** in App Store Connect › Apps › + › New App: platform iOS,
   name `Nightshift: Car & Bike Meets`, primary language English (UK), bundle ID
   `app.nightshift.ios` (register it under Certificates, Identifiers & Profiles
   first, or let EAS do it), SKU `nightshift-ios`, full access.
3. **Build and sign with EAS** (no Mac needed):
   ```bash
   npx eas-cli@latest login
   npx eas-cli@latest credentials        # sign in to Apple; EAS makes the distribution certificate and profile
   npx eas-cli@latest build -p ios --profile production
   npx eas-cli@latest submit -p ios --latest   # uploads to App Store Connect
   ```
   Make the Info.plist changes (section 2) in this build. Check `eas.json` has a
   `production` profile with `"channel": "production"` (the app's update channel).
   Xcode on a Mac is the alternative (`npx expo prebuild`, then Archive).
4. **TestFlight:** the upload appears under TestFlight after processing (~15–30
   min). Internal testers (up to 100 App Store Connect users) get it at once;
   external testers (up to 10,000, by email or a public link) after a short beta
   review. Fill in "What to test" and the test information (the review account).
5. **Push notifications** (Phase 2): in `app.json` set the expo-notifications
   plugin's `enableRemoteNotifications` to `true`, rebuild, run
   `npx eas-cli@latest credentials` › Push Notifications to create the APNs key,
   then deploy `push-notices` and its schedule (BACKEND.md section 7, Phase 2).
   Update the Privacy Policy (push token) and the nutrition label (Device ID) at
   the same time.
6. **Fill in App Store Connect** from section 3 and 4: the listing, URLs,
   category, age rating with the 18+ override, App Privacy, review notes and the
   review account, screenshots, price **Free**, availability **United Kingdom**
   (add others later), and "Manually release this version".
7. **Submit for review.** Typical review is 1–2 days. If rejected, answer in the
   Resolution Center; most first rejections are metadata (purpose strings, demo
   account, missing contact) and need no new build.

### What changes once there's a paid account

* **Real push notifications** to a locked phone (now: local reminders only, and
  the list under the bell).
* **TestFlight** instead of sideloading: builds last 90 days instead of 7, install
  from a link, up to 10,000 testers, and no developer-mode device registration.
* **Universal links** (Associated Domains) so sign-in links open the app from any
  mail app, instead of the `nightshift://` scheme.
* **App Attest / DeviceCheck** to make faked GPS and modified clients harder
  (BACKEND.md section 9).
* **Live Activities / CarPlay** become possible later (CarPlay navigation needs an
  extra entitlement from Apple).
* Paid-account capabilities all change the native build, so they ship in a new
  build, not over the air.

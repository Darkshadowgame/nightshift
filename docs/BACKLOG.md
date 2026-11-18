# Overnight build backlog (17 Nov 2026)

Goal: by the morning the owner can tap through a **working** app. It should look right
and every button should do something real. Everything still runs on local demo data
(AsyncStorage), because there is no backend account yet.

Ground rules for every chunk:
* The repo is **public**. Never commit personal data: no real names, emails, home
  addresses, IPs or tokens. Git is already set to the GitHub no-reply identity.
* Expo SDK 58. Check the versioned docs (https://docs.expo.dev/versions/v58.0.0/) before
  using any Expo API, and add packages with `npx expo install`.
* Keep logic in `src/lib/*` as pure functions with Jest tests. Screens stay thin.
* `npx tsc --noEmit` and `npx jest` must pass before each commit.
* Respect the legal decisions in `docs/SPEC.md`: no timing or ranking on public roads, no
  police spotting, plates always blurred, ban-zone warnings, 18+.
* Match the existing visual language: `src/theme.ts`, `src/components/ui.tsx`, the hexagon
  pins and the dark sodium-orange palette.

## Chunks

### A. Rolling meets: changes on the night (owner request)
Hosts can change the plan while the meet is on: rename, move or remove upcoming stops,
or add a new one. Each change:
* checks the new place against ban zones and warns;
* is added to a change log on the event (who, when, what), shown to hosts;
* posts a chat line to everyone, "Hosts changed the plan", without revealing the place.
Stops already revealed can't be moved after people have checked in there.

### B. First run and profile
A first-run screen to pick a handle, display name and region, and set a rough home
area (map long-press, saved fuzzed to about 1 km, used only for invites). A profile
editor on Me. The demo "You" user is replaced by the person's own profile.

### C. Other people
Tap anyone (Going list, vote cards, trophies, chat) to open their profile: builds,
trophies, crew and rep level. No exact location ever.

### D. Hosting tools
Hosts can edit an event before it starts (name, time, filters, stops, reveal time)
and share it (a share sheet with text and deep link `nightshift://event/<id>`).
Cancel already exists.

### E. Drives and photo spots, working
* Detail screens for drives and photo spots.
* "Start drive" tracks GPS checkpoints (or uses simulate mode) and completes the drive
  when all checkpoints are passed. A completion that's implausibly fast for the
  distance at the speed limits doesn't count. Never show a time.
* After completing, a 1–5 star rating prompt.
* Visiting a photo spot means a check-in within 0.2 mi plus an optional photo, which
  goes through the plate review.
* Suggest a new drive (drop points on the map) or photo spot. Suggestions start as
  "pending" until approved; in the demo, auto-approve after a short delay.
* A rep ledger in `src/lib/rep.ts`: attendance, hosting, drives, spots, awards and
  authored places. Levels, and a rep breakdown on Me.

### F. Crews
A crew page with members, crew events and a join/leave button. Create a crew.

### G. Reminders
Local notifications with `expo-notifications` (local only, so no paid Apple account
is needed): at an event's reveal time and 30 min before the start for events you're
going to; "moved on" for rolling meets you're checked in at (local only in the demo).
An in-app notifications list.

### H. Motion and feel
`react-native-reanimated` animations, with reduced motion respected:
* a pulse on live event pins;
* a check-in confirmation burst;
* a cover or trophy reveal;
* a class-up moment when a build's class rises after an edit;
* the "event unlocked" reveal.
Also haptics on the key actions. See the animation specs in
`docs/research/competitors-design-branding.md`.

### I. Polish
Empty states, accessibility labels, safe areas, keyboard handling and loading states.
A README section titled "Try this tomorrow" with a test checklist.

### Review loops
After each two or three chunks, a fresh reviewer reads the code and screenshots the
web preview (`npx expo export --platform web` and a static server with SPA fallback),
and writes findings to `docs/REVIEW.md`: bugs, UX problems, and ideas to improve.
The next pass fixes them.

## Queue (owner requests, 17 Nov 2026, after the overnight build)

Work in this order. Each item ships over the air unless marked native.

1. **Review round 4 fix pass** (in progress): map performance, places read from
   the bundle, storage, check-in vehicle, pin styles, ban-zone shapes, road-illegal
   mods (no rep, labelled), smaller OTA bundle, update fingerprint display, stable
   shop ids. Plus: remove kart tracks; Shops and Speed cameras behind a small
   layers icon on the right edge (both off by default); ban-zone circles only in
   hosting flows, with an info card explaining the order.
2. **In-app turn-by-turn navigation (native build)** (in progress): MapKit
   directions through stops, en-GB voice, rerouting, driving view with speed and
   camera warnings, average-speed zones. "Go here" defaults to in-app navigation
   with a chooser for Apple Maps, Google Maps, Waze or another app ("Always
   use…" option). Includes the pending Expo patch upgrades.
3. **Waze-style community reports** (built 17 Nov 2026, over the air; see SPEC "Road
   reports". Open-data closures import written, not deployed: BACKEND 7d): report
   incidents from the driving view in one or two taps (crash, hazard, roadworks,
   closure, traffic jam, mobile speed camera, police — owner decision 17 Nov 2026:
   police reports are included, labelled "Police / speed check", shown only in the
   driving view, expire after 30 minutes, never shown on event/cruise/meet screens,
   and earn rep like other reports once other drivers confirm them),
   other drivers confirm or clear them ("still there?"), reports expire, and
   reporters earn small rep for confirmed reports. Live traffic from Apple's layer;
   closures and diversions from UK open data (National Highways, Street Manager,
   TfL) imported on the server; rerouting around closures.
4. **Final cohesion review**: one designer-led pass over every screen for
   consistency, copy and flow once 1–3 have landed, then a fix pass.
5. **Sat nav fixes (owner test of build #10)**: the driving map faces the right way
   (GPS course when moving, else compass, eased) and centres on you; **Find › Where to?**
   for any address with recent places, Home and Work (over the air, v1.0.34). Native (this
   branch, `native-voice-search`; merging it changes the fingerprint and needs a new IPA):
   pick a better voice (Enhanced or Premium) in Settings, and shop and business search with
   MapKit's autocomplete.
6. **Driving view redesign (owner request, over the air)**: next turn and Then line on top;
   road name, speed, OSM speed-limit roundel, arrival, miles and time left and END at the
   bottom; heading-up or north-up; your own icon; recentre after a look round; fixes for
   set-back destinations and the check-in panel when stopped.
7. **Community tab (owner request, built 17–18 Nov 2026, over the air)**: Feed (posts with
   plate-blurred photos, an optional place on the map's Posts layer, never near home; Public
   or Connections; likes and comments), People (Cars near you with server-side rough
   distances, filters, Rate builds, social profiles), Connections (request, accept, decline
   with a silent 30-day cooldown; messages only between connections, owner decision), Forum
   (boards, Helpful, Solved +25 rep, capped), Messages (1-to-1 and groups up to 50, photos,
   shared cards, Seen, unread badges). Safety on all user content: report with reasons, block
   everywhere (event chat too), three reports hide, staff Moderation screen with suspend. See
   SPEC "Community" and BACKEND 3b. **Left for the owner:** extend the word list
   (`private.banned_terms`), add staff (`insert into public.staff …`), decide on an appeals
   address, and whether swearing short of the list is fine. **Later:** typing indicator, video,
   real push for messages (paid Apple account), and paging the feed and people by distance at scale.

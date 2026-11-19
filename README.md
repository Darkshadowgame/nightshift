# Nightshift (working name)

**What's on tonight near me, and go with my car.** A UK car and bike meet app: see
what's on near you tonight, say you're going with your build, check in, vote for
trophies, and come back next week.

Four tabs: **Tonight** (map or list of what's on, with one search and one + to host),
**Community**, **Garage** and **Me** (with the one Settings screen). Everything else
(drives, photo spots, tracks, shops, cameras, road reports, forum, crews) sits one level
down. The structure and the first 30 seconds are in [docs/SPEC.md](docs/SPEC.md),
"Purpose" and "Information architecture".

* Phase 1 spec: [docs/SPEC.md](docs/SPEC.md)
* App Store submission: [docs/APP-STORE.md](docs/APP-STORE.md) (checklist, listing copy, privacy label, review notes). Legal and support pages: https://darkshadowgame.github.io/nightshift/ (source in `site/`)

## Status

Phase 1, now multi-user. **Sign in** with your email and the app runs on the live
Supabase backend (eu-west-1): your profile, garage, events, going, check-ins, chat,
votes, crews and suggested places are shared between phones, and a rolling meet
updates live for everyone. **Try the demo without an account** keeps the old sample
scene, stored only on the phone. Backend details: [docs/BACKEND.md](docs/BACKEND.md).

## Run it

```bash
npm install
npx expo start          # dev server (needs a development build for the map)
npx expo start --web    # browser preview with a stand-in map
npm test                # unit tests
npx tsc --noEmit        # typecheck
```

### Automated scorecard: run before pushing UI changes

```bash
npx playwright install chromium   # once
npm run scorecard                 # 12:30 and 20:30, at 1.0x and 1.3x text (about 3 min)
npm run scorecard:quick           # 20:30 at 1.0x only (about 2 min)
```

It builds a fresh web export (`expo export --clear`; pass `-- --web <dir>` to reuse one),
serves it, and plays the ten tasks of the fixed scorecard
([docs/REDESIGN-2.md](docs/REDESIGN-2.md) 7.3) at 375x667 at human pace, then prints a table:
each task's pass or fail and time at each clock and text size, and the rule checks (no disabled
primary, toasts readable for 2 s and never under a sheet, each fact once on the event page, no
clipped text, no banned word, no console errors). Every failure names a screenshot in
`e2e/scorecard/.out/`. It exits 1 when anything fails. The checks' allow-lists are in
`e2e/scorecard/allow/`; each entry says why.

## Install on an iPhone

1. GitHub > Actions > **Build iPhone app** > Run workflow (about 20–30 min).
2. Download `Nightshift-unsigned.ipa` from the run's artifacts.
3. Install it with Sideloadly using your Apple ID, as with Caristini.

**Navigation needs a new IPA.** Turn-by-turn navigation (step 7d) adds a native module
(`modules/nav-directions`) and `expo-keep-awake`, so it changes the app's runtime
fingerprint. Build and install a fresh IPA. Over-the-air updates published after the
navigation commit only reach installs built from it or later; an older install keeps
the last update that fitted it and shows "needs the iPhone app" if it ever reaches
the driving screen.

### Updates: does this install get them?

Every push to `main` publishes an over-the-air update, but an install only takes updates
built for the same **runtime** (a fingerprint of the native side: native modules, config
plugins, app config, icons). Me › Settings › Developer (long-press the version line) shows the install's runtime (first 8
characters) and channel, e.g. `Runtime bceac1ba · production channel`. The OTA job prints
the update's runtime in its summary, and the **Build iPhone app** job prints the IPA's.

- Same runtime: the update downloads when the app opens and applies on the next start.
- Different runtime (the OTA job warns "needs a new IPA"): that install will never get it.
  Build and install a new IPA (steps above); updates after that reach it again.

Changes that need a new IPA: adding or upgrading a package with native code (including
Expo package patch upgrades), a local module under `modules/` (plate blurring,
navigation), config plugins or `app.json` native settings (permissions, icon, splash,
`plugins`), and `ios/` build settings. JavaScript, data files and assets
(`assets/data/*.nsdata`, map data, copy, screens) go out over the air.

## Try this tomorrow

A checklist for a first proper go on a real iPhone. Tick things off as you go and
note anything odd for the next pass. Each step says what you should see.

### 1. Install

1. GitHub > Actions > **Build iPhone app** > Run workflow. Wait for the green tick
   (about 20–30 min).
2. Open the run, download the `Nightshift-unsigned` artifact and unzip it to get
   `Nightshift-unsigned.ipa`.
3. Plug the iPhone in, open Sideloadly, drop the `.ipa` in, enter your Apple ID and
   press Start.
4. On the phone: Settings > General > VPN & Device Management > trust your Apple ID.
   If iOS asks, turn on Developer Mode (Settings > Privacy & Security) and restart.
5. A free Apple ID install lasts 7 days. Re-run Sideloadly to refresh it.

### 2. Sign in, or the demo

The app now opens on **Sign in** (phones that used Nightshift before accounts stay in
the demo with their data; Me › Settings › Account > **Sign in or create an account** gets you here).

- [ ] Type your email and tap **Email me a code**. Until custom email (SMTP) is set up,
      Supabase only mails **the project team's addresses**, about 2 an hour, and the email
      has a **sign-in link, not a code** (docs/BACKEND.md section 7b). So for now: use the
      owner's address, then **tap the link in the email on the iPhone**: iOS asks to open
      Nightshift and you're signed in. Reading the email on a computer instead? Tap **The
      email has a link, not a code**, copy the link from the email and paste it in.
- [ ] Once SMTP is on, the email has a 6-digit code: type it and tap **Sign in**. A wrong
      or old code says so; **Send it again** works once a minute.
- [ ] Mates can't sign in until SMTP is set up: they get a clear message and can tap **Try
      the demo without an account**.
- [ ] Signed in, the first run below is the same, but saved on the server: a taken handle
      is anyone's on Nightshift now, not a sample person's. There are no sample people or
      events when signed in: you'll see what real people host.
- [ ] Me › Settings › Account shows **Signed in as …**, **Sign out** and **Delete my account**.
      Deleting asks first, then removes your profile, home, garage and photos, check-ins,
      chat and votes, cancels events only you host, and goes back to Sign in. The Demo
      section (skip the GPS check, restart, reset) only shows in the demo.
- [ ] Flight mode while signed in: an **OFFLINE** pill appears at the top, the app shows
      what it last saw, and chat, garage edits and "mark read" queue up (**· 1 WAITING**)
      and send when you're back. Going, check-ins, votes, move on and plan changes say
      **You're offline** instead (they depend on time and place).
- [ ] Two phones (or the phone and `node scripts/supabase-smoke.mjs`, which plays the
      whole flow as two throwaway users): host a rolling meet on one, go on the other,
      check in, move on: the other phone's event screen updates by itself, the next stop
      unlocks, and a **moved on** notice lands under the bell (and as a phone notification
      while the app is open; real push is Phase 2).

### 2b. First run (the first 30 seconds)

- [ ] After sign-in (or **Try the demo without an account**) the app opens on **Step 1 of 2:
      What do you drive?**, not the map and not Credits.
- [ ] Type `Civic Type R` in the quick search, tap **FK8**: "Stock specs filled in". **Next**.
      (**Skip for now** also works: you can add it later in the Garage.)
- [ ] **Step 2 of 2: Where's home?** **Use my location** (allow it) or **Choose on map**: the tag
      says **Home area set** with the region, to about 1 km. There's no region, travel or
      notification question (defaults: 25 mi, Notify me; change them in Me › Settings ›
      Notifications) and no Tamworth button (development builds only).
- [ ] Type a handle. A taken one (e.g. `dan_r`) says so. **Show me tonight**.
- [ ] Tonight opens with **Start here**: tonight's pick (the live **Late rolling meet** in the
      demo) and **I'm going**. Tap it: a toast says you're going in your Civic, and the event
      opens with your car as what you're bringing.
- [ ] In the demo you start fresh: Me › **Your events** only has what you just
      said yes to. You're not hosting anything, not in a crew, and Me shows Level 1 · Newcomer, 0 rep and
      no trophies.
- [ ] The sample people and events (marked **Sample**) are around your own area now, not
      the Midlands. Within a few seconds the sample stops get real street names near you
      (e.g. "Ventura Park Rd, Tamworth" style); with no signal they keep neutral names
      like "Retail park car park".
- [ ] Location denied instead? Delete and reinstall, or turn it off in Settings >
      Nightshift > Location: the map shows your home area and says so once, with an
      **Open Settings** link. Tapping the **you** button says it again.

### 3. Garage and photos (plate blur)

- [ ] Garage: the car from the first run has its class stamped on the picture and bhp,
      bhp per tonne and mods. Open it > **Edit**.
- [ ] Add mods with bhp gains. Save. If the class goes up (e.g. remove the dyno
      figure, then add a big remap), the badge flips to the new class with a buzz.
- [ ] Bike > **Stage 2** > **Add typical parts**: only road-legal parts go on. The de-cat
      link pipe and de-restricting show separately as optional, marked **Not road legal —
      track/off-road only**; add one and it shows that tag in the list and on the build page.
      Me: **Mods logged** counts each road-legal kind of mod once, at most 10 per build.
- [ ] **+ Add a photo** with a car whose number plate is visible. The crop screen opens:
      drag the box or its corners (rule-of-thirds grid), try **Cover** (the garage card's
      shape), 1:1, 4:5, 4:3, 16:9, **Rotate 90°** and **Reset**, then **Use this crop**
      (or **Skip crop**). Then you should see the plate boxed on the cropped photo; tap a
      box to remove it, then **Blur and add**. The saved photo has the plate blurred.
- [ ] Tap a saved photo (in the editor or on your build's page): **Crop / rotate** works on
      the saved, already-blurred photo (originals aren't kept, so blur stays), **Re-check
      plates** can only add more blur, **Set as cover** puts it first (the garage card and
      trophy covers use it), **Move left / right**, and **Delete** asks first. On the build
      page each change saves straight away; in the editor it's kept when you save.
- [ ] **+ Add a car or bike** for a second build, then delete it (asks first).

### 4. Events

- [ ] Tonight › Map: the **Late rolling meet** pin pulses (it's live) and sits on top of
      the locked pins near it. The sheet's first row says what's live or next, with a
      countdown; tap it to show it on the map. Tap a pin, then **Open event**.
- [ ] Tonight › **List**: Live now, Tonight, This week and Later, as cards. The old
      Events tab is gone; an old `/events` link opens this list.
- [ ] **Coffee and cars** (the next weekend morning) > **I'm
      going**. The first time, iOS asks to allow notifications: allow it. Its reminders
      are scheduled straight away (step 9). Stay going for step 9.
- [ ] Tonight › **+ Host** > **Host an event** (the same sheet has **Suggest a place**): make a meet for later tonight. Tap **Choose on the map**: a full-screen map
      opens with a crosshair. Search a town or postcode (the map jumps there) or tap the
      location button, pan and zoom until the crosshair is on the spot (the bar names the
      street live; on a grey known place it snaps and turns green), then **Set spot here**.
      Its name box fills in with the street and town. Edit it; moving it again won't
      overwrite your own name. The area name suggests the town. The line under the time chips says
      when it starts; a time that has passed tonight is refused, and "Tonight 06:00"
      means the early hours. The stop map shows the car-meet order areas (ban zones: red
      outlines for whole boroughs such as Birmingham or the Black Country, circles for
      smaller ones); tap a zone's red pin, or the line under the crosshair when you're in
      one, for its info card (what kind of order, what it bans, when, the source, and that
      you're responsible as host). Place a stop inside one: a short warning line under the
      stop opens the same card. Save, open it and turn on **See as a guest**:
      the map shows the locked pin and circle invited people see, a mile or two off
      your spot, never on it, and the stops show locked.
- [ ] Host requests: the event you just hosted gets requests from people who don't match the
      invite once real people (or the smoke test) ask. Approve one (they move to Going), decline the other.
- [ ] Open **Sunrise ride: …** (bikes only, on the second-nearest drive; Me › All crews > Peak Chasers):
      you get **Request to go** with the reason, not "going". Chat stays closed until
      you're in. Request it: Tonight › List now tags it **Requested**, and the map
      shows it locked ("you asked to go"). Open it to **Withdraw request**.
- [ ] **What you're bringing:** Garage > **+ Add a car or bike** so you have two (say a
      bike). Open an invite: **I'm going** / **Request to go** now asks which one, each
      with its class, make and model and any swap or stage. A build the invite doesn't
      cover says **Doesn't match the invite**, and picking it turns the button into
      **Request to go**. Once going, **You're bringing … Change** swaps it until the
      start; at check-in **Something else?** says what you turned up in. The Going list
      and the event cards' class counts (e.g. `2A 1S`) follow the pick.
- [ ] Open your event > **Edit**, change the time, save. **Share** opens the share
      sheet with a `nightshift://event/...` link. **Cancel event** asks first.

### 4b. Search and new events near you

- [ ] Tonight › the search pill › **Events** (the one search; Find and Where to? are now part of it): every
      upcoming event within 25 mi of your home area, nearest first, each saying "about N mi
      from home" and "you can go" or "ask to go". Locked ones show only the area name and
      "location locked", never a stop. Live ones are included.
- [ ] Try the filters: **Within** (5–100 mi, Any distance), **What** (tap Cruise and Show
      together), **When** (Tonight keeps the live rolling meet; Weekend is Fri 5pm to Mon
      5am), **Show: I can go** drops events you'd have to ask for (e.g. the bikes-only
      Sunrise ride), and **Bikes** drops cars-only ones. **Back to my usual search** resets.
- [ ] **Where I am**: asks for location if needed and measures from your position, rounded
      to about 1 km. With location off it says so and stays on your home area.
- [ ] Tap a result: the event opens, with **I'm going** or **Request to go** as usual.
- [ ] Me › Settings › Notifications › **Willing to travel**: tap **Custom** and type 40: it reads 40 mi, and Search ›
      Events now starts at 40 mi. Type 0 or 500: it says 1 to 300 miles and keeps the old one.
- [ ] The bell's **New … near you** notices (step 2) say the event's title, time and area
      name only: no stop, street or distance. Tapping one opens the event.
- [ ] Phone notification: with notifications allowed (step 4 or Me › Settings › Notifications), set **Notify
      me**, then Me › Settings › **Restart the demo events** and lock the phone: one notification,
      "N new events near you", which opens Search › Events (or the event, if there's just one).
- [ ] Set **I'll search** and restart the demo events again: no notification and nothing new
      under the bell; the new ones carry a **NEW** tag in Search › Events until you leave it.
- [ ] Set **Off** and restart: nothing at all, and Search › Events still lists everything.

### 5. Rolling meet: check in, move on, change the plan

- [ ] Late rolling meet: the map dims and the stop **unlocks** (once per stop).
      The strip under the title shows the time left, the stop number and how many have
      checked in. In the demo **Check in** never checks the distance ("Demo: location check
      skipped" under it): tap it and a tick bursts and the phone buzzes. Signed in, it uses
      your real location and says how close you need to be.
- [ ] Hosting a rolling meet: join a crew (Me › Crew › **Find a crew**) or host your own from
      Tonight › **+ Host**, then check in at the first stop (check-in opens 30 min before the start).
- [ ] **Change the plan**: rename, move or add a stop. The change log (hosts only)
      updates and the chat says "Hosts changed the plan" without saying where.
- [ ] Once it's live (30 min after install or **Restart the demo events**), tap **Move
      on**. You were checked in, so you get the "moved on" notification, the next stop
      unlocks and the event map slides over to it.

### 6. Voting and trophies

- [ ] On the Late rolling meet after checking in, **Vote** shows award categories.
      Vote, change your vote; you can't vote for yourself.
- [ ] Search › Events (or a link) > **Sunday night meet** (last Sunday): trophies straight under the map, with the cover
      rising in with sparks the first time, and no "Unlocked" moment. Chat is read-only.
      Tap a winner to open their profile.

### 7. Drives, photo spots and suggestions

- [ ] Map: zoomed out, places of a kind group into one pin with a number (tap it to zoom in);
      zoomed in, each place has its own pin, and drive lines appear. **Near me** fits the 60
      nearest things to your home area. Real circuits, hill climbs, drives and photo spots all
      over the UK (Silverstone to Knockhill and Kirkistown, Snake Pass to Bealach na Bà), plus
      **Meet spots** (cafés and museums that welcome meets; mint building-and-flag pins, under
      the layers button). The four pills (Events, Photos, Drives, Tracks) fit across the top
      with no sideways scrolling, at 375 and 430 pt and at larger text (icon-only when tight).
      The layers button under locate-me has Meet spots, Shops, Speed cameras, Road reports,
      **+ Suggest a place** and **Map key ›**, which explains every pin (events filled, places
      outlined; drives are a winding road, tracks a chequered flag). **Near me** is the third
      round button, **Find** sits next to the bell. Layer choices survive a restart. There are no ban zones on this map: a place inside
      one (e.g. Westminster Bridge or Coventry Transport Museum) has one line, "Inside a
      car-meet order area… See details ›", which opens the info card. Each
      drive's line should sit on the real road when you zoom in. Drives show **Before you
      go** warnings where they matter (single-track, snow gates, cameras), and "Added by
      Nightshift".
- [ ] A drive has one primary button, **Start the drive**: on the iPhone it opens the driving
      view, which counts the drive when you pass every checkpoint in order (pass or fail, never
      timed). In the demo the app drives it for you at a legal pace and it finishes with a pass
      and its rep. Rate it 1–5 stars. On the web (or with another directions app chosen), it
      counts only the checkpoints you really pass; **Directions to the start** opens other apps.
- [ ] Signed in, finishing, checking in at or rating one of Nightshift's own drives or photo
      spots is saved on the server: **Driven by**, the stars and your rep match on a mate's
      phone. Anything done on that phone before this update shows **Only on this phone** and
      doesn't count.
- [ ] Open a photo spot > **Check in here**: signed in it says how close you need to be; in the
      demo the check is skipped and you can add a photo (plates blurred) or skip it.
- [ ] Map > **+ Suggest a place** > **Draw the drive on the map** (or **Choose on the map** for a photo
      spot): put the crosshair on the road and tap **Add start**, then **Add checkpoint** along the road
      (tapping the map adds one too; **Undo** takes one off), then **Done**. Drive points must be at
      most 1.5 mi apart: a dashed line to the crosshair goes red, with the reason, before you add one
      too far. A photo spot is one **Set spot here**. The name fills in from the first point (edit it). It shows as pending (grey) and is approved a few seconds later.
- [ ] Me: rep breakdown and level go up after drives and spots. Check-ins and hosting
      count once the event has finished, the same numbers as on your Public view.

### 7b. Speed cameras, photos from Commons, circuits and track times

- [ ] Map > **Photos**: only spots known for car and bike photos show (scenic-only ones are
      hidden). **+ Suggest a place** > Photo spot asks for a photo taken there with a car or bike
      in it before it can be suggested.
- [ ] Map: zoom in to about 30 miles across (e.g. round Norwich, central London, the Medway
      towns or Tamworth). Red camera pins appear, with red dashed lines for average-speed
      zones (their pin sits halfway along). Tap one: the card says the limit (e.g. **Speed
      camera · 30 mph · faces north-east**), that the data may be incomplete, and the
      OpenStreetMap credit. Nothing to open, and nothing about police (drivers' reports are
      a separate layer, 7e).
- [ ] Cameras are off at first: turn them on from the layers button (or Me › Settings › Map layers › **Speed
      cameras**, the same setting). Zoomed out further, the pins go and a small note says
      **Zoom in to see cameras**. Cameras with no recorded limit are smaller and dimmer.
- [ ] Tracks **▾**: **Cars** and **Bikes** (either or both), and **Racing to watch** (off at
      first) for speedway, oval and closed-road race venues, which run no track days. Bikes
      off: Goodwood and the hill climbs stay, bike-only venues go. There are no kart tracks.
- [ ] Zoom right in on a circuit (Snetterton, Brands Hatch, Silverstone): its outline is
      drawn in green on the map.
- [ ] Open a track (e.g. Snetterton): the little map shows the circuit outline, then **The
      track**: what runs there, the length, the layouts and the lap records (outright and
      bikes) with holder and year, and a **Source: Wikipedia** link.
- [ ] **Track times**: **+ Add a track time**: pick the layout, the date, type the time
      (e.g. 2:18.402), pick your build (its class is filled in), add a photo of the timing
      sheet (plates blurred), **Save time**. It shows under Cars · Class A, marked
      **Unverified**. A time quicker than the lap record, a future date or no photo is
      refused with the reason. **Remove** takes yours off. Drives and photo spots have no
      way to enter a time.
- [ ] A photo spot, drive or track: **Photos** (yours and other check-ins), then **Nearby
      photos** from Wikimedia Commons of cars, bikes or racing only, with the author and licence
      under each (the section hides when there are none).
      Tap one: its Commons page opens in Safari. In flight mode on a place you haven't
      opened before it says it couldn't load them; one you've opened shows them again.

### 7c. Shops and partners

- [ ] Map: layers button > **Shops** (it's off at first; the listings load the first time,
      "Loading shops…"). Zoomed out there's a note **Zoom in to see shops**; zoom in on a town (about 20 miles across) and small purple pins appear,
      each with a glyph for its kind (spanner for garages, tag for dealers, tyre, bolt for
      tuning, cup for cafés…), with the OpenStreetMap credit under the bar.
- [ ] Layers button > Shops **Kinds ›**: a small menu with the nine kinds and **Partners
      only**. Untick some: the map updates and the Shops row shows the filter (e.g. **Tuning**
      or **2 kinds**). Close and reopen the app: the choice is kept. Partner pins have a small
      **P** badge.
- [ ] Near home there are two gold star pins, **Sample Detailing Studio** and **Sample
      Rolling Road**, marked **Sample partner** (made-up businesses). **Partners only**
      shows just those.
- [ ] Tap a shop: the card says its kinds and, where the hours are tagged, **Open now ·
      closes 17:30** or **Closed · opens …**. **Open shop ›**: hours for the week, website
      and **Call** buttons where tagged, **Start navigation** (step 7d) with **Open in another
      app ›** for Apple Maps, Google Maps or Waze, and **Suggest an edit or a missing shop**
      saves a note for the team.

### 7d. Turn-by-turn navigation (new IPA needed)

Set the route up before you set off, mount the phone in a cradle, and don't touch it
while moving: the driving screen is built to be glanced at, not used.

- [ ] Open any drive, track, venue, photo spot or shop: **Start navigation** (**Navigate the
      drive** on drives) under the map, with **Open in another app ›** under it. On an
      event you're going to, the button shows once its stops are revealed to you: a
      cruise goes through every stop you can see, in order; a rolling meet only to the
      stop it's at now; a meet to the spot.
- [ ] Tap it at home with Me › Settings › **Demo: skip the GPS check** on: the driving screen opens full
      screen, says **Planning the route… N of M legs** for longer routes, then drives the
      route for you at four times the speed (**DEMO DRIVE · 4× SPEED**). You should see the
      big arrow and distance at the top, the street, the map turning so your direction is
      up, and hear "Starting route to …" in a British voice with music turned down.
- [ ] The voice says each turn at 1 mile (after a long straight), a quarter of a mile,
      200 yards and at the turn, and "You've reached …" / "You've arrived at …" at stops.
      **VOICE ON / OFF** mutes it for this trip; Me › Settings › **Navigation** > **Spoken directions**
      turns it off for good.
- [ ] Bottom panel: your speed (MPH), the next stop with its distance and arrival time, and
      the final stop's when there's more than one.
- [ ] Route a drive or shop past a speed camera (the Cameras layer on the map shows where
      they are): about half a mile before, **CAMERA IN 0.4 mi · 30 MPH**, a red-ringed 30
      roundel next to your speed, and "Speed camera ahead, 30 miles per hour". Above the
      limit, the speed box turns red with one soft chime and a buzz (not again for 10 s).
      In an average-speed zone the panel says **AVG ZONE 50 · YOURS 47 · 1.2 mi LEFT**;
      "Average speed zone starts / ends" are spoken. Nothing is saved.
- [ ] Real drive (demo switch off): GPS starts when the screen opens and stops when you press
      **END** or leave the app (no background location). Take a wrong turn: after about 5
      seconds more than 50 m off the line it says "Finding a new route" and reroutes from
      where you are through the stops still to come.
- [ ] Cruise or meet: at a stop with check-in, once you've stopped the screen offers **Check in
      at …** (with the usual distance and time checks). Drives: each checkpoint is called out
      ("Checkpoint 3 of 12"), and passing them all in order counts the drive (pass or fail,
      never timed).
- [ ] **Open in another app ›**: Nightshift, Apple Maps, Google Maps (the app if installed,
      else the website), Waze, or **Other app…** (share sheet with the coordinates). Turn on
      **Always use this** and pick Waze: the main button now says **Directions in Waze**.
      Me › Settings › **Navigation** sets it back to Nightshift. Other apps get the first stop only.
- [ ] Web preview: the driving screen says it needs the iPhone app and offers the other apps.

### 7e. Road reports (over the air)

Waze-style reports from drivers. In the demo there are sample reports round your home area
and everything stays on the phone; signed in they're shared through the server.

- [ ] Map > layers button > **Road reports** (off at first): coral pins for a crash, hazard,
      roadworks, a closure, traffic and a mobile camera round your home area. **Never a
      police report on the map.** Tap one: **CRASH · REPORTED 12 MIN AGO · CONFIRMED BY 1
      DRIVER**, when it ends, and (demo) "Sample report for the demo".
- [ ] Within a mile of it (or with Me › Settings › **Demo: skip the GPS check** on), the card has
      **Still there** and **Gone**. Tap **Still there**: "Thanks. Marked as still there.",
      the count goes up, and Me › Rep shows **Road reports checked ×1 +2**. Tap it again:
      it says you've already answered. Further away it says you need to be within a mile.
- [ ] Driving view (demo drive or real): a big coral **REPORT** button between VOICE and
      END. Tap it: seven big tiles: Crash, Hazard, Roadworks, Closure, Traffic, Mobile
      camera, **Police / speed check**. Tap one: "Thanks, reported" (with voice on) and a
      bar **CRASH REPORTED · UNDO 5** counting down; **UNDO** takes it back. After 5 s it's
      sent. Report again within 2 minutes: "You've just sent a report…".
- [ ] Demo: 20 s after you report, two sample drivers confirm it, and Me › Rep shows
      **Road reports confirmed ×1 +10**. Signed in, that needs two real drivers.
- [ ] Route past a report (the demo drive near home goes past some): about three quarters
      of a mile before, a coral strip **CRASH REPORTED AHEAD · 0.5 MI** and the voice says
      "Crash reported ahead, half a mile". Just after passing it: **Crash still there?**
      with big **YES** / **NO, GONE** (and **SKIP**); it goes by itself after 8 s.
- [ ] Police reports show only here, in the driving view (shield pins, "Police speed check
      reported ahead"), within 10 miles, and for 30 minutes. Not on the map, not on event,
      cruise or meet screens.
- [ ] A closure two other drivers confirmed (the demo has one, north-west of home), or a
      TfL closure, on the leg you're driving: "Road closed ahead. Looking for a way round…",
      then "Road closed ahead. Taking a way round." with a new route that keeps 100 m clear.
      If MapKit can't find one: **Road closed ahead — follow diversion signs**.
- [ ] Signed in, TfL closures show on the map's Road reports layer with **Powered by TfL
      Open Data** once the import job is deployed (docs/BACKEND.md 7d: not yet).

### 8. People and crews

- [ ] Tap anyone in a Going list, a vote card or chat: their builds, trophies,
      crew and level. Never a location.
- [ ] Me › **All crews**: open one, leave yours, join another, start a new crew.
      Leaving NightRunners (or joining or starting another crew) first warns that you'll
      stop hosting **NightRunners late one**; the night cruise, which names you
      as a host, stays yours. Joining makes you a plain member.
- [ ] In a crew you started you're the owner: **Invite members** > **Add** a couple of
      sample people (they join straight away in the demo), then **Make host** on one.
      Me › Settings › **Restart the demo events** doesn't undo crew changes; **Reset demo data**
      does.

### 9. Reminders

- [ ] Me › Settings › Notifications > **Send a test reminder**, then lock the phone: it appears
      in about 5 seconds. Tapping it opens the notifications list.
- [ ] Going to **Coffee and cars, late edition** (step 4): you'll get one notification
      when its location unlocks (about 2 hours after install or restart) and one 30 min
      before the start. Tapping either opens the event. Lock-screen text never names
      the place. Relaunching the app doesn't add the same reminder to the list twice.
- [ ] Drop out, or have the host edit or cancel it: the reminders go.
- [ ] The bell (map, top right, and Events header) shows a count; the list keeps
      every reminder and "moved on" message.
- [ ] Turn **Event reminders** off in Me: nothing more is scheduled.

### 10. Settings

Me shows who you are (profile, rep, crew, your places). **Settings** (top right on Me) holds
map layers, events near you, reminders, navigation, privacy, account, demo (demo only) and
app updates.


- [ ] **Demo: skip the GPS check** is off by default (and was turned off once on an old
      install). Off: check-ins, drives and photo spots need you to be there. On: the
      distance check is skipped and drives can be simulated.
- [ ] Me › **Edit profile** > set a different home area: the sample scene moves there (and its
      events count as new near you again). Willing to travel and New events near you are on
      this screen too, and on Me under **Events near you**.
- [ ] Turn on iOS Reduce Motion (Settings > Accessibility > Motion): pulses go
      static and reveals become quick fades. Haptics still work.
- [ ] **Reset demo data** (asks first) takes you back to the welcome screen.

- [ ] Leave the app for a day and open it again: the demo times move back into
      place. Each event keeps what you did to it, so to run steps 4–9 again tap Me › Settings ›
      **Restart the demo events**: the rolling meet live, the crew meet in about 30 min, the
      invite a few hours away and the requests come back, and your profile, builds,
      photos, crew and your own events stay.
- [ ] The home-screen icon is the orange hexagon with a moon over a road; the
      launch screen is dark.
- [ ] Headings (event titles, class letters) are in italics on the phone too.
- [ ] Add a build photo, then install a new IPA over the top with Sideloadly (don't
      delete the app first): the photo is still there. Photos live in the app's
      documents folder, not a temp folder.

### Known limits

- **Demo:** everything is stored on this phone only and other people are sample data from
  `src/data/seed.ts`. **Signed in:** the backend is shared, but sign-in emails only reach
  the project team until SMTP is set up (docs/BACKEND.md 7b), so in practice it's one
  real person for now.
- Signed in, live updates (chat, going, check-ins, move on, notices) arrive while the app
  is open. Real push to a locked phone needs Phase 2 and a paid Apple developer account.
- Signed in: Nightshift's own bundled drives, photo spots and circuits aren't on the server
  yet, so finishing or rating one is kept on the phone (places people suggest are on the
  server and checked there). "Demo: skip the GPS check" doesn't exist signed in: the server
  always checks you're there. Adding someone to your crew needs an invite (not built): they
  tap Join. "I'll search" NEW tags in Search › Events are demo only.
- Signed in, the app reads every profile, build and recent event (fine for a test group;
  see docs/BACKEND.md section 9 for what changes at scale).
- Road reports: the server checks your distance, rate and answers, but positions are what
  the phone says (as with check-ins). Open-data closures need the import job deployed and
  scheduled (docs/BACKEND.md 7d); National Highways also needs a free key the owner
  registers for. Until then only drivers' reports show.
- Reminders are local notifications scheduled on this phone. iOS keeps up to 64, so
  the app schedules at most 48, soonest first.
- New events near you are worked out on this phone from the sample scene, so they only
  ever come from sample events (or after **Restart the demo events**). On the backend the
  server works them out and they reach you by push once that's set up (Phase 2). An app
  updated from an older version treats the events it already had as not new.
- Search › Events searches what's on this phone in the demo, and on the server
  (`search_events()`) when signed in. Distances are straight lines to the event's rough
  area, not driving distances.
- Ban zones (car-meet order areas) are drawn round real orders (`src/data/banZones.ts`):
  borough- and city-wide orders as simplified council boundaries from OpenStreetMap
  (Birmingham; Wolverhampton, Sandwell and Walsall; Dudley; Coventry; Broadland and South
  Norfolk), smaller ones as circles. The West Midlands ones were checked against the Feb 2026
  judgments on 17 Nov 2026 (Solihull has no current order). Each is marked "Sample — check
  the current order": they are not a live legal list. They only draw where you host; places
  inside one still show, with a line linking to the info card.
- Place search and street names use the iPhone's own geocoder (Apple's). It needs a signal,
  Apple limits how often it can be asked, and it can't search in the web preview. Nothing is
  sent to any other web service.
- The sample scene is moved onto your area by keeping each sample spot's distance and
  direction from home, so near a coast a sample stop can land in the sea or somewhere odd.
  Real events need the backend.
- The bundled circuits, drives and photo spots are a fixed list (`src/data/places.ts`).
  Road lines and car park positions come from OpenStreetMap (© OpenStreetMap contributors,
  ODbL); roads close and change, so check before you go. East Anglia, Kent and London also
  have researched drives, photo spots and meet-friendly venues (`docs/research/regional-places.md`);
  medium-confidence ones say so in their warnings. Elsewhere there are no venues yet.
- Speed cameras come from OpenStreetMap (bundled, fetched on the date in
  `src/data/cameras.ts`). Volunteers map them, so some are missing or out of date: the
  app says so and only ever shows them as speed-limit information. They are a separate
  dataset from drivers' road reports (7e), which are never merged into it.
- Shops on the map come from OpenStreetMap (an app asset, `assets/data/shops.nsdata`, read from the 16 Nov 2026 extract):
  21,662 UK businesses. Volunteers map them, so some are missing, closed or out of date, and only
  about one in seven has opening hours; the shop screen says so and has **Suggest an edit or a
  missing shop**. Each shop's id is its OpenStreetMap element, so it survives a refresh. Partners are an empty list until the backend is wired: the two "Sample
  partner" businesses near your home are made up for the demo.
- Kart tracks were taken out (Nov 2026); saved kart times were dropped.
- Circuit outlines come from OpenStreetMap and show the main layout as mapped. Lap records
  are copied from each circuit's Wikipedia page (read 17 Nov 2026) and left out where the
  page wasn't clear. Track times are kept on this phone and marked unverified: checking the
  proof photo arrives with the server.
- Nearby photos come from Wikimedia Commons when you open a place (only the place's
  coordinates are sent) and are kept for a week. Commons' own geotags decide what shows.
- Plate blurring needs the iPhone app; the web preview can't detect plates.
- Navigation uses Apple's directions (MapKit). Only coordinates are sent to Apple, one leg
  between two points at a time; Apple limits how many a phone can ask for in a minute, so
  long drives are routed through at most 30 of their checkpoints and a busy minute is
  retried with a wait. It needs a signal to plan or re-plan a route, works only while the
  app is open, and has no lane guidance, traffic or road speed limits: the limit shown is
  a camera's or an average-speed zone's, from OpenStreetMap, and only near them.
- The web preview draws a real dark map (Leaflet, see Data and credits) with the iPhone's pins,
  clusters, routes and outlines; pan with a finger or the mouse, pinch or scroll to zoom (no
  zoom buttons, like the iPhone). The driving map (once the web driving screen uses it)
  turns heading-up but its labels turn with it, and it doesn't tilt. Offline the map falls
  back to the old grid. The web preview has no notifications or haptics.

## Code map

| Path | What it does |
|---|---|
| `src/lib/classes.ts` | S–D class from power-to-weight, separate car and bike scales |
| `src/lib/events.ts` | Reveal timing, who sees which stop, check-ins, rolling "Move on", changing the plan on the night, editing, share links, requests to go |
| `src/lib/area.ts` | The fuzzed rough area and circle shown before the reveal (never on a stop) |
| `src/lib/demoTime.ts` | Keeps the demo scene's times current on load; "Restart the demo events"; your own events are left alone |
| `src/lib/when.ts` | The host form's day and time chips to a start time (no silent "tonight" to tomorrow) |
| `src/lib/photos.ts`, `photoRefs.ts` | Plate blur, then photos kept in the documents folder by file name |
| `src/lib/crop.ts`, `components/CropEditor.tsx`, `PhotoFlow.tsx`, `PhotoManager.tsx` | Crop maths (box, aspect, corners, rotation to pixels); the crop screen; pick → crop → plate check → save for every photo; a build's photo actions |
| `src/lib/profile.ts` | First-run profile checks; home saved fuzzed to about 1 km |
| `src/lib/people.ts` | What other people can see about someone (never a location) |
| `src/lib/invites.ts` | Invite filters and who matches |
| `src/lib/discover.ts` | Willing to travel, new events near you (who hears about what, once) and Search › Events |
| `src/lib/rep.ts` | Rep ledger (attendance, hosting, drives, spots, authored places, trophies, mods), levels, author rep |
| `src/lib/spots.ts` | Drives and photo spots: checkpoint runs (pass or fail only), visits, ratings, suggestions and demo approval |
| `src/lib/crews.ts` | Join, leave and start crews; owner and host roles; crew events |
| `src/lib/reminders.ts` | Which reminders an event needs (reveal, 30 min before, moved on), what to schedule or cancel, and what lands in the in-app list |
| `src/lib/notify.ts` | Thin layer over `expo-notifications`: permission, scheduling, taps that open the event (no-op on web) |
| `src/lib/feel.ts` | Haptics for the key moments |
| `src/lib/nav.ts`, `navPlan.ts`, `directions.ts` | Turn-by-turn engine (position on the route, ETA, when to speak, off-route, arrivals, cameras and average-speed zones ahead, speed against their limit); what a screen routes through; links for Apple Maps, Google Maps and Waze |
| `src/lib/roadReports.ts`, `roadService.ts`, `roadStore.tsx`, `backend/roads.ts` | Road reports: kinds, expiry, what shows where (police only in the driving view), alerts ahead, "Still there?", closures and detours, demo samples; the demo and server implementations; the screens' hook and Realtime |
| `components/RoadReportControls.tsx` | The driving view's REPORT grid, undo bar, "Still there?" prompt and alert strip |
| `supabase/functions/import-closures/` | Open-data closures import (TfL keyless; National Highways once a key is set); `parse.ts` is pure and tested in Jest |
| `src/app/drive.tsx`, `components/DriveMap.tsx`, `NavLaunch.tsx` | The full-screen driving view; its heading-up map; the Start navigation button and app chooser |
| `modules/nav-directions` | Local Expo module (Swift): MapKit directions leg by leg, the en-GB voice (AVSpeechSynthesizer, ducking music) and the over-limit chime |
| `src/components/motion.tsx` | Reanimated motion (live pulse, check-in, reveals, class-up, unlocked), all with reduced-motion versions |
| `src/lib/store.tsx` | All state the screens read, and every action, sent to a Repository: the demo's or the backend's |
| `src/lib/repository.ts`, `localRepository.ts`, `localState.ts` | The Repository interface; the demo's implementation (rules on the phone); the state's shape and the demo scene's helpers |
| `src/lib/backend/` | Signed in: `remote.ts` (SupabaseRepository: tables, RPCs, Realtime, offline cache and outbox), `mapping.ts` (rows to app types), `outbox.ts`, `feedback.ts`, `client.ts`, `config.ts` (the project URL and publishable key, both public by design) |
| `src/lib/auth.tsx`, `authLink.ts`, `src/app/signin.tsx` | Sign in with an email code or link, the demo choice, sign out; `components/AccountSection.tsx` has Delete my account |
| `scripts/supabase-smoke.mjs` | End-to-end test against the hosted backend as throwaway users, road reports included (docs/BACKEND.md 7c) |
| `src/data/seed.ts` | Demo scene: sample people and events drawn round your home area, and sample ban zones |
| `src/data/places.ts` | Real UK circuits, sprint and hill-climb venues, drives, photo spots and meet-friendly venues (bundled) |
| `src/data/banZones.ts` | Sample ban zones round real injunctions, PSPOs and dispersal hotspots |
| `src/lib/location.ts` | Thin layer over `expo-location`: your position, place search and street names from the phone's geocoder |
| `src/lib/placeNames.ts` | Search queries, postcodes and short place names (pure) |
| `src/lib/scene.ts` | Moves the sample scene onto your home area; geocoded names for sample stops |
| `src/lib/settings.ts` | Settings, defaults (real GPS) and the one-off upgrade for old saves |
| `src/lib/cameraCodec.ts`, `cameraZones.ts`, `cameras.ts`, `cameraData.ts` | Speed-camera data: compact tile encoding, average-speed zone lines, what to draw for the view, lazy loading |
| `src/lib/polyline.ts`, `outline.ts`, `tracks.ts` | Encoded lines, picking a circuit's main layout from OSM ways, circuit details and what runs where |
| `src/lib/laptimes.ts`, `lapStore.ts` | Track times: checks (real tracks only, proof, layout, vehicle type), per-class leaderboards, kept on the phone |
| `src/lib/commons.ts`, `commonsClient.ts` | Nearby Wikimedia Commons photos: request, parsing and filtering, a week's cache |
| `src/lib/shopCategories.ts`, `shopCodec.ts`, `shops.ts`, `shopData.ts` | Shops layer: kinds and OSM tag rules, compact tile encoding, what to draw for the view and the filter, lazy loading |
| `src/lib/openingHours.ts` | Reads common OSM `opening_hours` formats: the week, "open now", next opening |
| `src/lib/partners.ts`, `src/data/partners.ts` | Partners (always labelled), the `partner_venues` row mapping, and the made-up demo samples |
| `src/data/cameras.ts`, `circuits.ts`, `assets/data/shops.nsdata` | Generated from OpenStreetMap by `scripts/fetch-cameras.mjs`, `scripts/fetch-circuits.mjs` and `scripts/fetch-shops.mjs` |
| `src/data/zoneBoundaries.ts`, `src/lib/zones.ts`, `components/ZoneCard.tsx` | Council outlines for borough-wide orders; which zones a point is in; the zone info card |
| `src/lib/mapPlaces.ts` | Which places the map draws for the view: culling, per-kind caps, count pins when zoomed out |
| `src/lib/placeStore.ts`, `persist.ts`, `clock.tsx` | Bundled places read from the bundle (only progress saved); saving in slices, debounced; the 30 s clock context |
| `src/lib/legality.ts` | Road-illegal mods (labelled, never auto-added, no rep) and which mods earn rep |
| `src/data/trackInfo.ts` | Circuit layouts, lap records (with sources) and what runs at each track |
| `src/theme.ts`, `src/components/ui.tsx` | Colour roles (brand, layers, states, class ladder, surfaces), the type scale and text-size caps; shared components (Txt, Button, Card, Tag, ConfirmBox, InlineError, Notice, EmptyState, NotFound, ToggleRow, ListRow, Segmented, LinkText, HeaderAction) |
| `src/lib/glossary.ts` | The app's words: role labels (Hosting, Going, Requested, Invited, Public), place names, menu paths, header titles, confirm labels |
| `src/lib/mapLayers.ts`, `components/LayerBar.tsx` | How the map's layer pills fit the width and text size (labels or icon-only, never scrolling) |
| `src/app/settings.tsx` | Settings (from Me), one screen: account, navigation and voice, map layers, notifications, privacy, feedback, about and legal, demo; developer switches behind a long press on the version |
| `src/app/(tabs)/index.tsx`, `components/TonightCards.tsx` | Tonight: map or list, the sheet, the + (host, suggest), first-run "Start here" (`lib/firstRun.ts`) |
| `src/app/search.tsx` | The one search: events, places, people and addresses with Go here (`find` and `where` redirect here) |
| `src/app/welcome.tsx` | First run: what do you drive, where's home, then Tonight |
| `scripts/seed-bundled-places.mjs`, `src/lib/backend/bundledSeed.ts` | Generates the server rows for the bundled drives and photo spots from `src/data/places.ts` (docs/BACKEND.md) |
| `src/app/` | Screens (Expo Router) |

## Data and credits

| Data | Where from | Licence |
|---|---|---|
| Speed cameras and average-speed zones (`src/data/cameras.ts`) | OpenStreetMap `highway=speed_camera` nodes and `type=enforcement` relations, via the Overpass API | © OpenStreetMap contributors, [ODbL 1.0](https://www.openstreetmap.org/copyright). Kept as its own dataset, never merged with user reports. Credited on the map. |
| Circuit outlines (`src/data/circuits.ts`), drive lines, car parks | OpenStreetMap (`highway=raceway`, motorsport `leisure=track`) | © OpenStreetMap contributors, ODbL 1.0. Credited on the track and drive maps. |
| Shops (`assets/data/shops.nsdata`) | OpenStreetMap car and bike businesses (`shop=car_repair`, `car_parts`, `car`, `motorcycle`, `tyres`, `amenity=car_wash`, `vehicle_inspection`, biker cafés…), read from the Geofabrik UK extract of 16 Nov 2026 | © OpenStreetMap contributors, ODbL 1.0. Kept as its own dataset; edits people suggest go to the feedback queue, never into it. Credited on the map and every shop screen. |
| Road closures (server, `road_closures`) | TfL Unified API road disruptions (London, no key); National Highways Road and Lane Closures v2 (England's motorways and major A roads, once a key is set) | TfL: its open data terms, credited "Powered by TfL Open Data" (terms not re-read for this; check before launch). National Highways: Open Government Licence v3.0. Credited on each closure. |
| Road reports | Nightshift drivers | Kept on the server only while they're live (plus two days); never merged with the camera data |
| Layouts and lap records (`src/data/trackInfo.ts`) | Each circuit's Wikipedia page, linked on the track screen | Facts, with the source linked |
| Nearby photos | Wikimedia Commons, fetched by the app | Each photo's own licence and author, shown under it and on its Commons page |
| Web preview base map (web only, `src/components/webmap/tiles.web.ts`) | Stadia Maps "Alidade Smooth Dark" raster tiles; if they won't load, Esri "Dark Gray Canvas"; offline, the grid | © Stadia Maps © OpenMapTiles © OpenStreetMap (or © Esri, HERE, Garmin © OpenStreetMap), always shown on the map. **Licence note:** both are free for development and light use only. Stadia needs no key on `localhost`, but any other web address must be registered (free tier) at stadiamaps.com, or the map drops to Esri. Revisit both (paid plan or own tiles) before a public web launch. CARTO's keyless Dark Matter tiles now return an "API key required" picture, so they aren't used. |

The bundled data (17 Nov 2026): 3,470 cameras (2,025 with a speed limit, 987 with a
direction) and 67 average-speed zones across the UK in 31 KB; 49 circuit outlines in 9 KB.
Overpass was refusing connections for most of that day, so the South West, South and
London/South East/Kent came from Overpass and the rest from the Geofabrik UK extract of
16 Nov 2026 (the same OpenStreetMap data), using the fallback scripts below.

To refresh the bundled OpenStreetMap data (be polite: it runs one query per region, one
at a time, and backs off when Overpass is busy; `--cache DIR` keeps the answers):

```bash
node --import ./scripts/lib/resolve-ts.mjs scripts/fetch-cameras.mjs --cache /tmp/osm
node --import ./scripts/lib/resolve-ts.mjs scripts/fetch-circuits.mjs --cache /tmp/osm
node --import ./scripts/lib/resolve-ts.mjs scripts/fetch-shops.mjs --cache /tmp/osm
```

If Overpass is down, fill the same cache from a Geofabrik extract first (needs pyosmium;
see the top of each script), then run the two commands above (cameras with `--cached-only`):

```bash
python scripts/cameras-from-pbf.py united-kingdom-latest.osm.pbf /tmp/osm
node --import ./scripts/lib/resolve-ts.mjs scripts/fetch-circuits.mjs --list-venues > /tmp/osm/venues.json
python scripts/circuits-from-pbf.py united-kingdom-latest.osm.pbf /tmp/osm/venues.json /tmp/osm
python scripts/shops-from-pbf.py united-kingdom-latest.osm.pbf /tmp/osm   # then fetch-shops.mjs --cached-only
```

Shops (17 Nov 2026, Overpass was at capacity so all from the Geofabrik extract): 21,662
businesses in 847 KB: dealers 7,304, garages and MOT 11,455, tyres and wheels 2,213, parts
1,807, detailing 208, tuning 167, coffee and meet spots 92, bike gear 43, dyno 3 (a business
can be in more than one kind). 1,620 unnamed ones were left out.

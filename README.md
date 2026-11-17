# Nightshift (working name)

A live map of the UK modified car and bike scene that plays like an open-world
racing game: garages for cars and bikes with S–D classes, game-style map pins,
and cruises, rolling meets, meets, shows and track days with filtered invites.

* Phase 1 spec: [docs/SPEC.md](docs/SPEC.md)

## Status

Phase 1 demo. Everything is stored on the phone, and the other people in the app
are sample data. Next: a Supabase backend so phones share data.

## Run it

```bash
npm install
npx expo start          # dev server (needs a development build for the map)
npx expo start --web    # browser preview with a stand-in map
npm test                # unit tests
npx tsc --noEmit        # typecheck
```

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
plugins, app config, icons). Me › App updates shows the install's runtime (first 8
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

### 2. First run

- [ ] The app opens on the welcome screen, not the map.
- [ ] Pick a handle and display name. Try a handle that's taken (e.g. `dan_r`): you get a
      clear message.
- [ ] Rough home area: tap **Use my current location**. iOS asks for location ("While
      using the app"): allow it. The map jumps near you and says **HOME AREA SET, TO ABOUT
      1 KM**: the saved point is snapped to a ~1 km grid, never your address. The region
      chip picks itself (change it if it's wrong).
- [ ] Also try the search box: type a postcode (e.g. `SW1A 1AA`) or a town (e.g. `Leeds`),
      wait a moment, tap a result: the map and home area move there. Nonsense text says
      no places were found; with flight mode on it says it couldn't search.
- [ ] **Testing: use the demo area (Tamworth)** is still there if you want the old setup.
- [ ] **Events near you**: Willing to travel shows 25 mi picked and New events near you
      shows **Notify me**. Leave them for now (step 4b changes them).
- [ ] Tap **Let's go**: you land on the map. The bell (top right) shows a count: the only
      notices waiting are **New … near you** ones for sample events you can go to within
      25 mi (e.g. **Coffee and cars, late edition**, and the show or track day if the
      nearest venue is that close), never one you host or are already going to. No
      reminders from before you joined. Me shows your new handle in your own case.
- [ ] The map centres on you with the blue dot. The round **you** button (top right,
      under the chips) brings it back after you pan away.
- [ ] The sample people and events (marked **Sample**) are around your own area now, not
      the Midlands. Within a few seconds the sample stops get real street names near you
      (e.g. "Ventura Park Rd, Tamworth" style); with no signal they keep neutral names
      like "Retail park car park".
- [ ] Location denied instead? Delete and reinstall, or turn it off in Settings >
      Nightshift > Location: the map shows your home area and says so once, with an
      **Open Settings** link. Tapping the **you** button says it again.

### 3. Garage and photos (plate blur)

- [ ] Garage: the Golf R card has its class stamped on the picture, a trophy count
      and bhp, bhp per tonne and mods. Open it > **Edit**. Change it to your own car or bike.
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

- [ ] Map: the **Late rolling meet** pin pulses (it's live) and sits on top of
      the locked pins near it. The card at the bottom says what's live and what's next,
      with a countdown; tap it to open the event. **1 live now** (top right) jumps the
      map to the live meet. Tap a pin, then **Open event**.
- [ ] Events tab: Mine / Invited / Public / Past. Live events sit at the top
      with a pulsing pin.
- [ ] Invited tab > **Coffee and cars, late edition** (about 3 hours away) > **I'm
      going**. The first time, iOS asks to allow notifications: allow it. Its reminders
      are scheduled straight away (step 9). Stay going for step 9.
- [ ] **+ Host**: make a meet for later tonight. Tap **Choose on the map**: a full-screen map
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
- [ ] **Night cruise: …** (you host it, on the nearest real drive to you): **Requests (2)** from people who
      don't match the invite. Approve one (they move to Going), decline the other.
- [ ] Open **Sunrise ride: …** (bikes only, on the second-nearest drive; Me > All crews > Peak Chasers):
      you get **Request to go** with the reason, not "going". Chat stays closed until
      you're in. Request it: Events > Mine now lists it as **Requested**, and the map
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

### 4b. Find events and new events near you

- [ ] Events tab > **Find** (top right), or the green **Find events** chip on the map: every
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
- [ ] Me > **Events near you**: tap **Custom** and type 40: the chip reads 40 mi, and Find
      events now starts at 40 mi. Type 0 or 500: it says 1 to 300 miles and keeps the old one.
- [ ] The bell's **New … near you** notices (step 2) say the event's title, time and area
      name only: no stop, street or distance. Tapping one opens the event.
- [ ] Phone notification: with notifications allowed (step 4 or Me > Reminders), set **Notify
      me**, then Me > **Restart the demo events** and lock the phone: one notification,
      "N new events near you", which opens Find events (or the event, if there's just one).
- [ ] Set **I'll search** and restart the demo events again: no notification and nothing new
      under the bell, but Events shows **Find · N new** and the map chip says **N new**; the
      new ones carry a green **NEW** tag in Find events until you leave it.
- [ ] Set **Off** and restart: nothing at all, and Find events still lists everything.

### 5. Rolling meet: check in, move on, change the plan

- [ ] Late rolling meet: the map dims and the stop **unlocks** (once per stop).
      The strip under the title shows the time left, the stop number and how many have
      checked in. **Check in** uses your real location now: unless you're at the stop it
      says how close you need to be. To try the rest from the sofa, turn on Me > **Demo:
      skip the GPS check** first, then tap **Check in** (above **Drop out** and **Share**): a
      tick bursts and the phone buzzes.
- [ ] **NightRunners late one** is your crew's meet and you're a NightRunners host,
      so you host it. Check in
      at the first stop now (check-in opens 30 min before the start).
- [ ] **Change the plan**: rename, move or add a stop. The change log (hosts only)
      updates and the chat says "Hosts changed the plan" without saying where.
- [ ] Once it's live (30 min after install or **Restart the demo events**), tap **Move
      on**. You were checked in, so you get the "moved on" notification, the next stop
      unlocks and the event map slides over to it.

### 6. Voting and trophies

- [ ] On the Late rolling meet after checking in, **Vote** shows award categories.
      Vote, change your vote; you can't vote for yourself.
- [ ] Events > Past > **Sunday night meet** (last Sunday): trophies straight under the map, with the cover
      rising in with sparks the first time, and no "Unlocked" moment. Chat is read-only.
      Tap a winner to open their profile.

### 7. Drives, photo spots and suggestions

- [ ] Map: zoomed out, places of a kind group into one pin with a number (tap it to zoom in);
      zoomed in, each place has its own pin, and drive lines appear. **Near me** fits the 60
      nearest things to your home area. Real circuits, hill climbs, drives and photo spots all
      over the UK (Silverstone to Knockhill and Kirkistown, Snake Pass to Bealach na Bà), plus
      **Venues** (cafés and museums that welcome meets; mint building-and-flag pins, under the
      layers button). The bar has Events, Photos, Drives and Tracks; the round layers button
      under locate-me has Venues, Shops and Speed cameras, and **Map key ›** explains every
      pin (events filled, places outlined). There are no ban zones on this map: a place inside
      one (e.g. Westminster Bridge or Coventry Transport Museum) has one line, "Inside a
      car-meet order area… See details ›", which opens the info card. Each
      drive's line should sit on the real road when you zoom in. Drives show **Before you
      go** warnings where they matter (single-track, snow gates, cameras), and "Added by
      Nightshift".
- [ ] With **Demo: skip the GPS check** on, tap a drive > **Start drive** > **Simulate the
      drive**. It finishes with a pass, never a time. Rate it 1–5 stars. With it off, Start
      drive only counts checkpoints you really pass.
- [ ] Open a photo spot > **Check in here**: with the GPS check on it says how close you
      need to be; with it skipped you can add a photo (plates blurred) or skip it.
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
      OpenStreetMap credit. Nothing to open, and nothing about police anywhere.
- [ ] Cameras are off at first: turn them on from the layers button (or Me > Map > **Speed
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
- [ ] A photo spot, drive or track: **Members' photos** (yours and other visits), then **Online
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
- [ ] Tap it at home with Me > **Demo: skip the GPS check** on: the driving screen opens full
      screen, says **Planning the route… N of M legs** for longer routes, then drives the
      route for you at four times the speed (**DEMO DRIVE · 4× SPEED**). You should see the
      big arrow and distance at the top, the street, the map turning so your direction is
      up, and hear "Starting route to …" in a British voice with music turned down.
- [ ] The voice says each turn at 1 mile (after a long straight), a quarter of a mile,
      200 yards and at the turn, and "You've reached …" / "You've arrived at …" at stops.
      **VOICE ON / OFF** mutes it for this trip; Me > **Navigation** > **Spoken directions**
      turns it off for good.
- [ ] Bottom panel: your speed (MPH), the next stop with its distance and arrival time, and
      the final stop's when there's more than one.
- [ ] Route a drive or shop past a speed camera (the Cameras layer on the map shows where
      they are): about half a mile before, **CAMERA IN 0.4 mi · 30 MPH**, a red-ringed 30
      roundel next to your speed, and "Speed camera ahead, 30 miles per hour". Above the
      limit, the speed box turns red with one soft chime and a buzz (not again for 10 s).
      In an average-speed zone the panel says **AVG ZONE 50 · YOURS 47 · 1.2 mi LEFT**;
      "Average speed zone starts / ends" are spoken. Nothing is saved, and there's nothing
      about police anywhere.
- [ ] Real drive (demo switch off): GPS starts when the screen opens and stops when you press
      **END** or leave the app (no background location). Take a wrong turn: after about 5
      seconds more than 50 m off the line it says "Finding a new route" and reroutes from
      where you are through the stops still to come.
- [ ] Cruise or meet: at a stop with check-in, once you've stopped the screen offers **Check in
      at …** (with the usual distance and time checks). Drives: each checkpoint is called out
      ("Checkpoint 3 of 12"), and passing them all in order counts the drive just like
      **Start drive** (pass or fail, never timed).
- [ ] **Open in another app ›**: Nightshift, Apple Maps, Google Maps (the app if installed,
      else the website), Waze, or **Other app…** (share sheet with the coordinates). Turn on
      **Always use this** and pick Waze: the main button now says **Directions in Waze**.
      Me > **Navigation** sets it back to Nightshift. Other apps get the first stop only.
- [ ] Web preview: the driving screen says it needs the iPhone app and offers the other apps.

### 8. People and crews

- [ ] Tap anyone in a Going list, a vote card or chat: their builds, trophies,
      crew and level. Never a location.
- [ ] Me > **All crews**: open one, leave yours, join another, start a new crew.
      Leaving NightRunners (or joining or starting another crew) first warns that you'll
      stop hosting **NightRunners late one**; the night cruise, which names you
      as a host, stays yours. Joining makes you a plain member.
- [ ] In a crew you started you're the owner: **Invite members** > **Add** a couple of
      sample people (they join straight away in the demo), then **Make host** on one.
      Me > **Restart the demo events** doesn't undo crew changes; **Reset demo data**
      does.

### 9. Reminders

- [ ] Me > Reminders > **Send a test reminder**, then lock the phone: it appears
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

- [ ] **Demo: skip the GPS check** is off by default (and was turned off once on an old
      install). Off: check-ins, drives and photo spots need you to be there. On: the
      distance check is skipped and drives can be simulated.
- [ ] Me > **Edit profile** > set a different home area: the sample scene moves there (and its
      events count as new near you again). Willing to travel and New events near you are on
      this screen too, and on Me under **Events near you**.
- [ ] Turn on iOS Reduce Motion (Settings > Accessibility > Motion): pulses go
      static and reveals become quick fades. Haptics still work.
- [ ] **Reset demo data** (asks first) takes you back to the welcome screen.

- [ ] Leave the app for a day and open it again: the demo times move back into
      place. Each event keeps what you did to it, so to run steps 4–9 again tap Me >
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

- Everything is stored on this phone only. There's no backend, so nothing is shared
  between phones, and other people are sample data from `src/data/seed.ts`.
- Chat, votes and "moved on" messages only reach you. Real push between phones needs
  a backend and a paid Apple developer account.
- Reminders are local notifications scheduled on this phone. iOS keeps up to 64, so
  the app schedules at most 48, soonest first.
- New events near you are worked out on this phone from the sample scene, so they only
  ever come from sample events (or after **Restart the demo events**). On the backend the
  server works them out and they reach you by push once that's set up (Phase 2). An app
  updated from an older version treats the events it already had as not new.
- Find events searches what's on this phone. Distances are straight lines to the event's
  rough area, not driving distances.
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
  dataset from anything people report (there's no way to report cameras or police).
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
- The web preview uses a flat stand-in map and has no notifications or haptics.

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
| `src/lib/discover.ts` | Willing to travel, new events near you (who hears about what, once) and the Find events search |
| `src/lib/rep.ts` | Rep ledger (attendance, hosting, drives, spots, authored places, trophies, mods), levels, author rep |
| `src/lib/spots.ts` | Drives and photo spots: checkpoint runs (pass or fail only), visits, ratings, suggestions and demo approval |
| `src/lib/crews.ts` | Join, leave and start crews; owner and host roles; crew events |
| `src/lib/reminders.ts` | Which reminders an event needs (reveal, 30 min before, moved on), what to schedule or cancel, and what lands in the in-app list |
| `src/lib/notify.ts` | Thin layer over `expo-notifications`: permission, scheduling, taps that open the event (no-op on web) |
| `src/lib/feel.ts` | Haptics for the key moments |
| `src/lib/nav.ts`, `navPlan.ts`, `directions.ts` | Turn-by-turn engine (position on the route, ETA, when to speak, off-route, arrivals, cameras and average-speed zones ahead, speed against their limit); what a screen routes through; links for Apple Maps, Google Maps and Waze |
| `src/app/drive.tsx`, `components/DriveMap.tsx`, `NavLaunch.tsx` | The full-screen driving view; its heading-up map; the Start navigation button and app chooser |
| `modules/nav-directions` | Local Expo module (Swift): MapKit directions leg by leg, the en-GB voice (AVSpeechSynthesizer, ducking music) and the over-limit chime |
| `src/components/motion.tsx` | Reanimated motion (live pulse, check-in, reveals, class-up, unlocked), all with reduced-motion versions |
| `src/lib/store.tsx` | All state, saved on the phone. The one layer to swap for Supabase |
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
| `src/app/` | Screens (Expo Router) |

## Data and credits

| Data | Where from | Licence |
|---|---|---|
| Speed cameras and average-speed zones (`src/data/cameras.ts`) | OpenStreetMap `highway=speed_camera` nodes and `type=enforcement` relations, via the Overpass API | © OpenStreetMap contributors, [ODbL 1.0](https://www.openstreetmap.org/copyright). Kept as its own dataset, never merged with user reports. Credited on the map. |
| Circuit outlines (`src/data/circuits.ts`), drive lines, car parks | OpenStreetMap (`highway=raceway`, motorsport `leisure=track`) | © OpenStreetMap contributors, ODbL 1.0. Credited on the track and drive maps. |
| Shops (`assets/data/shops.nsdata`) | OpenStreetMap car and bike businesses (`shop=car_repair`, `car_parts`, `car`, `motorcycle`, `tyres`, `amenity=car_wash`, `vehicle_inspection`, biker cafés…), read from the Geofabrik UK extract of 16 Nov 2026 | © OpenStreetMap contributors, ODbL 1.0. Kept as its own dataset; edits people suggest go to the feedback queue, never into it. Credited on the map and every shop screen. |
| Layouts and lap records (`src/data/trackInfo.ts`) | Each circuit's Wikipedia page, linked on the track screen | Facts, with the source linked |
| Nearby photos | Wikimedia Commons, fetched by the app | Each photo's own licence and author, shown under it and on its Commons page |

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

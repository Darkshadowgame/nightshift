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
      means the early hours. Try placing a stop inside a ban zone (Map > Ban zones
      shows them): you get a warning. Save, open it and turn on **See as a guest**:
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

- [ ] Map > **Show everything**: real circuits, hill climbs, drives and photo spots all over
      the UK (Silverstone to Knockhill and Kirkistown, Snake Pass to Bealach na Bà), plus
      researched drives, photo spots and **Venues** (cafés and museums that welcome meets)
      in East Anglia, Kent and London. Map > Ban zones shows the sample zones; a place inside
      one (e.g. Westminster Bridge) opens with the ban-zone warning. Each
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
- [ ] Zoomed out further, the pins go and a small note says **Zoom in to see speed cameras**.
      The **Cameras** chip turns the layer off and on; so does Me > Map > **Speed cameras**
      (they're the same setting, on by default).
- [ ] Tracks chip on: **Cars**, **Bikes** and **Karts** chips appear next to it (any mix).
      Cars and Bikes off: only places that run karts stay (the kart circuits, plus circuits
      with karting on site such as Teesside or Three Sisters); Goodwood and the hill climbs go.
- [ ] Open a kart circuit (e.g. Whilton Mill or PF International): **Runs here: Karts**,
      **Arrive and drive: yes, hire karts** (only where the venue says so; Llandow and
      Shenington say no), its layouts, a **Venue details** link, and Track times grouped as
      hire or own karts.
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
- Ban zones are rough circles round real orders (West Midlands, London, East Anglia and
  Kent; see `src/data/banZones.ts`), each marked "Sample — check the current order". They
  are not a live legal list. Places inside one still show, with the warning.
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
- Kart circuits are the outdoor ones whose own websites show them running in 2025/26
  (`src/data/kartTracks.ts`). Arrive-and-drive, lengths and club lap records show only
  where the venue publishes them.
- Circuit outlines come from OpenStreetMap and show the main layout as mapped. Lap records
  are copied from each circuit's Wikipedia page (read 17 Nov 2026) and left out where the
  page wasn't clear. Track times are kept on this phone and marked unverified: checking the
  proof photo arrives with the server.
- Nearby photos come from Wikimedia Commons when you open a place (only the place's
  coordinates are sent) and are kept for a week. Commons' own geotags decide what shows.
- Plate blurring needs the iPhone app; the web preview can't detect plates.
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
| `src/data/cameras.ts`, `circuits.ts` | Generated from OpenStreetMap by `scripts/fetch-cameras.mjs` and `scripts/fetch-circuits.mjs` |
| `src/data/trackInfo.ts` | Circuit layouts, lap records (with sources) and what runs at each track |
| `src/app/` | Screens (Expo Router) |

## Data and credits

| Data | Where from | Licence |
|---|---|---|
| Speed cameras and average-speed zones (`src/data/cameras.ts`) | OpenStreetMap `highway=speed_camera` nodes and `type=enforcement` relations, via the Overpass API | © OpenStreetMap contributors, [ODbL 1.0](https://www.openstreetmap.org/copyright). Kept as its own dataset, never merged with user reports. Credited on the map. |
| Circuit outlines (`src/data/circuits.ts`), drive lines, car parks | OpenStreetMap (`highway=raceway`, motorsport `leisure=track`) | © OpenStreetMap contributors, ODbL 1.0. Credited on the track and drive maps. |
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
```

If Overpass is down, fill the same cache from a Geofabrik extract first (needs pyosmium;
see the top of each script), then run the two commands above (cameras with `--cached-only`):

```bash
python scripts/cameras-from-pbf.py united-kingdom-latest.osm.pbf /tmp/osm
node --import ./scripts/lib/resolve-ts.mjs scripts/fetch-circuits.mjs --list-venues > /tmp/osm/venues.json
python scripts/circuits-from-pbf.py united-kingdom-latest.osm.pbf /tmp/osm/venues.json /tmp/osm
```

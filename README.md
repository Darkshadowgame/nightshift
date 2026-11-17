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
- [ ] Pick a handle and display name. Leave the region on **Midlands** and the home area
      on the demo area (Tamworth): the sample scene is there, so the map and invites
      have something in them. If you pick another region the home area clears; **Use the
      demo area** puts it back. Try a handle that's taken (e.g. `dan_r`): you get a clear
      message.
- [ ] Tap **Let's go**: you land on the map, with no old notifications waiting. Me
      shows your new handle in your own case.

### 3. Garage and photos (plate blur)

- [ ] Garage: the Golf R card has its class stamped on the picture, a trophy count
      and bhp, bhp per tonne and mods. Open it > **Edit**. Change it to your own car or bike.
- [ ] Add mods with bhp gains. Save. If the class goes up (e.g. remove the dyno
      figure, then add a big remap), the badge flips to the new class with a buzz.
- [ ] **+ Add a photo** with a car whose number plate is visible. You should see the
      plate boxed; tap a box to remove it, then
      **Blur and add**. The saved photo has the plate blurred.
- [ ] **+ Add a car or bike** for a second build, then delete it (asks first).

### 4. Events

- [ ] Map: the **Lichfield rolling meet** pin pulses (it's live) and sits on top of
      the locked pins near it. The card at the bottom says what's live and what's next,
      with a countdown; tap it to open the event. **1 live now** (top right) jumps the
      map to the live meet. Tap a pin, then **Open event**.
- [ ] Events tab: Mine / Invited / Public / Past. Live events sit at the top
      with a pulsing pin.
- [ ] Invited tab > **Coffee and cars, late edition** (about 3 hours away) > **I'm
      going**. The first time, iOS asks to allow notifications: allow it. Its reminders
      are scheduled straight away (step 9). Stay going for step 9.
- [ ] **+ Host**: make a meet for later tonight. The line under the time chips says
      when it starts; a time that has passed tonight is refused, and "Tonight 06:00"
      means the early hours. Try placing a stop inside a ban zone (Map > Ban zones
      shows them): you get a warning. Save, open it and turn on **See as a guest**:
      the map shows the locked pin and circle invited people see, a mile or two off
      your spot, never on it, and the stops show locked.
- [ ] **Peak District night cruise** (you host it): **Requests (2)** from people who
      don't match the invite. Approve one (they move to Going), decline the other.
- [ ] Open **Cat and Fiddle sunrise ride** (bikes only; Me > All crews > Peak Chasers):
      you get **Request to go** with the reason, not "going". Chat stays closed until
      you're in. Request it: Events > Mine now lists it as **Requested**, and the map
      shows it locked ("you asked to go"). Open it to **Withdraw request**.
- [ ] Open your event > **Edit**, change the time, save. **Share** opens the share
      sheet with a `nightshift://event/...` link. **Cancel event** asks first.

### 5. Rolling meet: check in, move on, change the plan

- [ ] Lichfield rolling meet: the map dims and the stop **unlocks** (once per stop).
      The strip under the title shows the time left, the stop number and how many have
      checked in. **Check in** (above **Drop out** and **Share**): a tick bursts and the
      phone buzzes.
- [ ] **NightRunners late one** is your crew's meet and you're a NightRunners host,
      so you host it. Check in
      at the first stop now (check-in opens 30 min before the start).
- [ ] **Change the plan**: rename, move or add a stop. The change log (hosts only)
      updates and the chat says "Hosts changed the plan" without saying where.
- [ ] Once it's live (30 min after install or **Restart the demo events**), tap **Move
      on**. You were checked in, so you get the "moved on" notification, the next stop
      unlocks and the event map slides over to it.

### 6. Voting and trophies

- [ ] On the Lichfield meet after checking in, **Vote** shows award categories.
      Vote, change your vote; you can't vote for yourself.
- [ ] Events > Past > **Snowdome Sunday meet** (last Sunday): trophies straight under the map, with the cover
      rising in with sparks the first time, and no "Unlocked" moment. Chat is read-only.
      Tap a winner to open their profile.

### 7. Drives, photo spots and suggestions

- [ ] Map > **Show everything** (the Peak District is off-screen at first) > tap the
      **Snake Pass** drive > **Simulate the drive**. It finishes
      with a pass, never a time. Rate it 1–5 stars.
- [ ] Open the **Ladybower viaduct** photo spot > **Check in here** > add a photo
      (plates blurred) or skip it.
- [ ] Map > **+ Suggest a place**: drop points for a drive or one point for a photo
      spot. Drive points must be at most 1.5 mi apart: a longer gap shows red with
      the reason. It shows as pending (grey) and is approved a few seconds later.
- [ ] Me: rep breakdown and level go up after drives and spots. Check-ins and hosting
      count once the event has finished, the same numbers as on your Public view.

### 8. People and crews

- [ ] Tap anyone in a Going list, a vote card or chat: their builds, trophies,
      crew and level. Never a location.
- [ ] Me > **All crews**: open one, leave yours, join another, start a new crew.
      Leaving NightRunners (or joining or starting another crew) first warns that you'll
      stop hosting **NightRunners late one**; the Peak District cruise, which names you
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

- [ ] **Simulate GPS** (on by default) skips the "are you there?" distance check.
      Turn it off and check in somewhere you're not: it says how close you need to be.
- [ ] Turn on iOS Reduce Motion (Settings > Accessibility > Motion): pulses go
      static and reveals become quick fades. Haptics still work.
- [ ] **Reset demo data** (asks first) takes you back to the welcome screen.

- [ ] Leave the app for a day and open it again: the demo times move back into
      place. Each event keeps what you did to it, so to run steps 4–9 again tap Me >
      **Restart the demo events**: Lichfield live, the crew meet in about 30 min, the
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
- Ban zones are samples based on real orders, not a live legal list.
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
| `src/lib/profile.ts` | First-run profile checks; home saved fuzzed to about 1 km |
| `src/lib/people.ts` | What other people can see about someone (never a location) |
| `src/lib/invites.ts` | Invite filters and who matches |
| `src/lib/rep.ts` | Rep ledger (attendance, hosting, drives, spots, authored places, trophies, mods), levels, author rep |
| `src/lib/spots.ts` | Drives and photo spots: checkpoint runs (pass or fail only), visits, ratings, suggestions and demo approval |
| `src/lib/crews.ts` | Join, leave and start crews; owner and host roles; crew events |
| `src/lib/reminders.ts` | Which reminders an event needs (reveal, 30 min before, moved on), what to schedule or cancel, and what lands in the in-app list |
| `src/lib/notify.ts` | Thin layer over `expo-notifications`: permission, scheduling, taps that open the event (no-op on web) |
| `src/lib/feel.ts` | Haptics for the key moments |
| `src/components/motion.tsx` | Reanimated motion (live pulse, check-in, reveals, class-up, unlocked), all with reduced-motion versions |
| `src/lib/store.tsx` | All state, saved on the phone. The one layer to swap for Supabase |
| `src/data/seed.ts` | Demo scene: sample people, real roads, venues and sample ban zones |
| `src/app/` | Screens (Expo Router) |

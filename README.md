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
- [ ] Pick a handle, display name and region. Long-press the small map to set a rough
      home area. Try a handle that's taken (e.g. `dan_r`): you get a clear message.
- [ ] Tap **Let's go**: you land on the map. Me shows your new handle.

### 3. Garage and photos (plate blur)

- [ ] Garage > open the example Golf R > **Edit**. Change it to your own car or bike.
- [ ] Add mods with bhp gains. Save. If the class goes up (e.g. remove the dyno
      figure, then add a big remap), the badge flips to the new class with a buzz.
- [ ] **+ Add a photo** with a car whose number plate is visible. Allow photo
      access. You should see the plate boxed; tap a box to remove it, then
      **Blur and add**. The saved photo has the plate blurred.
- [ ] **+ Add a car or bike** for a second build, then delete it (asks first).

### 4. Events

- [ ] Map: the **Lichfield rolling meet** pin pulses (it's live). Tap it, then
      **Open event**.
- [ ] Events tab: Mine / Invited / Public / Past. Live events sit at the top
      with a pulsing pin.
- [ ] Open an invite you're not going to (Invited tab) and tap **I'm going**. The
      first time, iOS asks to allow notifications: allow it. Tap again to drop out.
- [ ] **+ Host**: make a meet for later tonight. Try placing a stop inside a ban
      zone (Map > Ban zones shows them): you get a warning.
- [ ] Open your event > **Edit**, change the time, save. **Share** opens the share
      sheet with a `nightshift://event/...` link. **Cancel event** asks first.

### 5. Rolling meet: check in, move on, change the plan

- [ ] Lichfield rolling meet: the map dims and the stop **unlocks** (once per stop).
      **Check in**: a tick bursts and the phone buzzes.
- [ ] **NightRunners late one** is your crew's meet, so you're a host. Check in
      at the first stop now (check-in opens 30 min before the start).
- [ ] **Change the plan**: rename, move or add a stop. The change log (hosts only)
      updates and the chat says "Hosts changed the plan" without saying where.
- [ ] Once it's live (30 min after a fresh reset), tap **Move on**. You were
      checked in, so you get the "moved on" notification, and the next stop unlocks.

### 6. Voting and trophies

- [ ] On the Lichfield meet after checking in, **Vote** shows award categories.
      Vote, change your vote; you can't vote for yourself.
- [ ] Events > Past > **Snowdome Sunday meet**: trophies, with the cover rising
      in with sparks the first time. Tap a winner to open their profile.

### 7. Drives, photo spots and suggestions

- [ ] Map > tap the **Snake Pass** drive > **Simulate the drive**. It finishes
      with a pass, never a time. Rate it 1–5 stars.
- [ ] Open the **Ladybower viaduct** photo spot > **Check in here** > add a photo
      (plates blurred) or skip it.
- [ ] Map > **+ Suggest a place**: drop points for a drive or one point for a photo
      spot. It shows as pending (grey) and is approved a few seconds later.
- [ ] Me: rep breakdown and level go up after drives, spots and check-ins.

### 8. People and crews

- [ ] Tap anyone in a Going list, a vote card or chat: their builds, trophies,
      crew and level. Never a location.
- [ ] Me > **All crews**: open one, leave yours, join another, start a new crew.

### 9. Reminders

- [ ] Me > Reminders > **Send a test reminder**, then lock the phone: it appears
      in about 5 seconds. Tapping it opens the notifications list.
- [ ] Tap **I'm going** on an event a few hours away. You'll get one notification
      when its location unlocks and one 30 min before the start. Tapping either
      opens the event. Lock-screen text never names the place.
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
| `src/lib/events.ts` | Reveal timing, who sees which stop, check-ins, rolling "Move on", changing the plan on the night, editing, share links |
| `src/lib/profile.ts` | First-run profile checks; home saved fuzzed to about 1 km |
| `src/lib/people.ts` | What other people can see about someone (never a location) |
| `src/lib/invites.ts` | Invite filters and who matches |
| `src/lib/rep.ts` | Rep ledger (attendance, hosting, drives, spots, authored places, trophies, mods), levels, author rep |
| `src/lib/spots.ts` | Drives and photo spots: checkpoint runs (pass or fail only), visits, ratings, suggestions and demo approval |
| `src/lib/crews.ts` | Join, leave and start crews; crew events |
| `src/lib/reminders.ts` | Which reminders an event needs (reveal, 30 min before, moved on), what to schedule or cancel, and what lands in the in-app list |
| `src/lib/notify.ts` | Thin layer over `expo-notifications`: permission, scheduling, taps that open the event (no-op on web) |
| `src/lib/feel.ts` | Haptics for the key moments |
| `src/components/motion.tsx` | Reanimated motion (live pulse, check-in, reveals, class-up, unlocked), all with reduced-motion versions |
| `src/lib/store.tsx` | All state, saved on the phone. The one layer to swap for Supabase |
| `src/data/seed.ts` | Demo scene: sample people, real roads, venues and sample ban zones |
| `src/app/` | Screens (Expo Router) |

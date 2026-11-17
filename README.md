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

## Code map

| Path | What it does |
|---|---|
| `src/lib/classes.ts` | S–D class from power-to-weight, separate car and bike scales |
| `src/lib/events.ts` | Reveal timing, who sees which stop, check-ins, rolling "Move on" |
| `src/lib/invites.ts` | Invite filters and who matches |
| `src/lib/rep.ts` | Rep for suggested routes and photo spots (Phase 3 maths) |
| `src/lib/store.tsx` | All state, saved on the phone. The one layer to swap for Supabase |
| `src/data/seed.ts` | Demo scene: sample people, real roads, venues and sample ban zones |
| `src/app/` | Screens (Expo Router) |

# Review 3: design critique and polish pass (17 Nov 2026)

A designer's pass rather than a bug hunt. Rounds 1 and 2 got every flow working; this round asks
whether the app *feels* like an open-world street-racing game at night on the first morning: is the
hierarchy clear, does the map feel like home, is the event screen a loop you want to come back to, and
is the garage something you'd show a mate.

Method: fresh web export at 400×820, storage cleared, walked first run → map → events → event detail
(live, invited, past, hosting) → garage → build → drive → crews → Me. Screenshots before:
`~/.playwright-mcp/r3-*.png`; after the fixes: `~/.playwright-mcp/r3-after-*.png`. The web map is a flat
stand-in, so map points also come from reading `NightMap.tsx`.

## Critique, ranked by impact

### 1. The map, the "home" moment, has no HUD and the live meet can't be tapped
The map opens on pins over a grid. The top bar has the wordmark, a "1 live now" pill and the bell, and
that's it: the bottom 40% of the screen is empty, and nothing tells you what to do next or how long
you've got. A game map always says *what's on and how far away it is*.

Worse, the live Lichfield pin is drawn **under** the two locked circle pins next to it (`r3-02-map.png`).
In the browser a tap on the pulsing pin opened **Late S/A meet** instead (`r3-03-map-peek.png`): the
locked pin stole the tap. On iOS marker order follows the array too, so the same thing can happen. The
"1 live now" pill looks like a button but does nothing.

*Fix:* draw pins in layers (spots, locked areas, visible events, live on top) and give native markers a
`zIndex`. Add a bottom **Next up** card: the live event (or the next one you're hosting, going to or
invited to), its role, how many are going, a big countdown ("Ends in 3h", "Starts in 2h 14m"), the event
after it, and how many are on in the next 12 h. Make the live pill jump to the live meet.

### 2. The event screen doesn't show the clock, the core loop's one number
On an event the only time is "STARTED 01:15 – 05:00" or "TODAY 05:00 – 07:30". You have to do the sum.
The reveal countdown, the thing that makes a locked meet exciting, is buried in the stops list ("Unlocks
in 2 h for people going"). Nothing says how many have checked in or which stop the rolling meet is at.

*Fix:* a three-tile readout under the title: **Starts in / Live · ends in**, **Place unlocks in** (or
**Stop 2 of 3** on a live rolling meet), and **Going** (or **Checked in 5/7** when live).

### 3. Three full-width buttons of equal weight under the map
Live meet: **Check in** (cyan), **Going ✓ (tap to drop out)** and **Share**, each full width
(`r3-08b-event-live-after.png`). The second is a status dressed as a button, and the copy is clumsy.
Your status should be a tag; the one thing to do should be the only big button.

*Fix:* a role tag beside the type eyebrow ("You're going", "Hosting", "Invited", "Asked to go"); one
primary button; **Drop out**, **Edit** and **Share** share a secondary row.

### 4. The garage, the "pride" moment, reads like a list row
The Golf R is a silhouette, then a class badge *below* the picture, a mono line of stats and a note
(`r3-06-garage.png`). Nothing says it has two trophies. The sample-build note is a separate card above it,
so the first thing on the tab is an explanation, not the car.

*Fix:* stamp the class on the picture (badge, "Class A", car/bike and year on a dark plate so it reads on
any photo), a trophy count and a "Sample" tag on the picture, stat tiles (bhp, bhp per tonne, mods) under
the name, the sample note under the card. Cards rise in, staggered.

### 5. The build page has the same weak hero, and the mods are a table
Same silhouette, badge beside the title, and the mods list has category tags at the far right in the
same grey as the bhp gains. The competitor study (C1, "garage hero / mod tags") asks for mod tags that
stagger in.

*Fix:* the same stamped hero with the trophy count, category as a left-hand tag column, bhp gains in
sodium on the right, rows that stagger in (40 ms, 220 ms, reduced motion = fade).

### 6. Finished events bury the payoff
On **Snowdome Sunday meet** the trophies and cover shoots, the reason to open a past event, are below the
stops, the invite and a ten-person Going list (`r3-11b-event-past-trophies.png`).

*Fix:* for finished events, trophies go straight under the map.

### 7. The first ten seconds are a form
First run opens on a small wordmark, one grey sentence and a form (`r3-01-welcome.png`). It's clear, but
it doesn't sell anything: no sense of meets unlocking, classes, trophies or drives.

*Fix:* a bigger wordmark with a live pulse, a one-line promise ("The UK car and bike scene on one map,
after dark") and three short lines with the pin glyphs (meets that unlock, garage classes and trophies,
rated drives that are never timed), then the 18+ line and the form.

### 8. Section headers float
Every section is an orange eyebrow with nothing tying it to the page, so long screens (event, Me, build)
read as a stack of cards with no rhythm. Headers in the tabs are uppercase display type; pushed screens
("Crews", "Drive", "Host an event") are mixed case.

*Fix:* one `Section` header everywhere: eyebrow, a hairline to the edge, optional action (and an optional
colour, e.g. neon "Live now"). Stack titles in capitals like the tabs.

### 9. Event cards make you do sums too
"TONIGHT 02:29" on a card when it's 02:00 doesn't say "in 30 minutes". Live cards say "LIVE NOW" but not
how long is left.

*Fix:* "Live · ends in 3h"; within 24 h, "Tonight 02:29 · in 30m".

### 10. Copy and number polish on Me and profiles
"1 BUILDS", "1 MEMBERS". The rep breakdown lists four "×0, +0" rows, which reads as failure on day one.

*Fix:* singular/plural everywhere counts show; hide zero rows and add one line, "Still to earn: events
hosted, drives finished…".

### 11. The map peek card's call to action is a label
"OPEN EVENT ›" is the same weight as the meta line. *Fix:* an outlined button in the event's colour, and
the meta line shows the countdown instead of the date.

### Noted, not changed this round
* **Pins under the HUD.** Pins near the top of the map sit under the wordmark and chips. The real map can
  be panned, so it's minor; later, pad the map's top inset.
* **Rep panel is long on Me.** Fine for now; it could collapse to the total and level with a "Breakdown"
  toggle.
* **Cover headline overlaps the silhouette** when there's no photo. On a real photo it reads as a
  magazine cover; with the placeholder it's busy. Lower priority than real photos.
* **The host form is long** (type, name, when, route map, filters, hosts, reveal). It works; a stepper
  would feel better, but it's a bigger change than this pass.
* **Web only:** after a forced tap the page can scroll sideways a few pixels. Not on iOS.

## What changed (fix pass 3)

| # | Change | Where |
|---|---|---|
| 1 | Pins drawn in layers, live on top (native `zIndex` too); live pill jumps to the live meet; **Next up** HUD card with countdown, role, next event and "N in the next 12h" | `src/lib/hud.ts` (`orderPins`, `pinLayer`, `mapHud`), `src/app/(tabs)/index.tsx`, `src/components/NightMap.tsx` |
| 2 | Event hero readout: starts in / live · ends in, place unlocks in or stop N of M, going or checked in | `src/lib/hud.ts` (`countdown`, `eventClock`, `unlocksIn`), `src/app/event/[id].tsx`, `Stat` in `ui.tsx` |
| 3 | Role tag in the hero; one primary button; Drop out / Edit / Share in one row | `src/app/event/[id].tsx` |
| 4 | Garage cards: class stamped on the picture, trophy count and Sample tag, stat tiles, staggered rise-in | `src/components/BuildHero.tsx`, `src/app/(tabs)/garage.tsx`, `FadeUp` in `motion.tsx` |
| 5 | Build page: stamped hero with trophies, shared stat tiles, mods with a category column and staggered rows | `src/app/build/[id].tsx`, `bhpPerTonne` in `src/lib/classes.ts` |
| 6 | Finished events show trophies straight under the map | `src/app/event/[id].tsx` |
| 7 | First run: bigger wordmark with a live pulse, one-line promise, three pitch lines that rise in | `src/app/welcome.tsx` |
| 8 | Section headers with a hairline and optional colour; stack titles in capitals | `src/components/ui.tsx`, `src/app/_layout.tsx`, `src/app/spot/[id].tsx` |
| 9 | Event cards: "Live · ends in 3h", "Tonight 02:29 · in 30m" | `src/components/EventCard.tsx` |
| 10 | Plurals on Me, profiles and crews; zero rep rows hidden with a "Still to earn" line | `plural` in `src/lib/format.ts`, `Rep.tsx`, `me.tsx`, `user/[id].tsx` |
| 11 | Peek card: outlined call to action, countdown in the meta line | `src/app/(tabs)/index.tsx` |

Every new motion piece checks reduced motion (fade only). Nothing here touches the legal rules: countdowns
are to the event's own start, end and reveal times, never drive or arrival times; the Next up card and
peek only show a place the person may already see, otherwise the area and "location locked".

Tests: `__tests__/hud.test.ts` (countdown, event clock, unlock countdown, map HUD, pin order, plural) and
a `bhpPerTonne` test in `__tests__/classes.test.ts`. README "Try this tomorrow" steps 3, 4, 5 and 6 updated.

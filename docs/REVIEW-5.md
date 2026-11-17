# Review 5: final cohesion pass (17 Nov 2026)

BACKLOG queue item 4: one designer-led pass over every screen for consistency, copy and flow, before the
owner shows the app to friends. This review covers how the app looks and reads as one product. It does
not ask for new features. Nothing in `src/` was changed.

**Method**

* Read `docs/BACKLOG.md`, `README.md` ("Try this tomorrow"), `docs/SPEC.md`, `docs/REVIEW*.md` (fixed
  items are not reported again), `AGENTS.md`, `src/theme.ts`, `src/components/ui.tsx`, every route in
  `src/app/` and the shared components (map, layer bar, event card, pins, rep, awards, nav launch, forms).
* Counted things with grep across `src/app` and `src/components`: inline font sizes, raw colours, radii,
  confirm patterns, header titles, link colours, button kinds.
* Worked out WCAG contrast for every theme colour on each surface, including faded states.
* Web preview at 400x820 (`CI=1 npx expo export --platform web`, static server on :8788, now stopped):
  signed out (sign-in screen), then demo first run with the Tamworth area, map, layers menu, map key,
  Events (Mine, Invited, Public), the live rolling meet, Garage, build, Me, a drive, a track, a venue,
  notifications, Find, crews, a profile, the host form, Suggest a place and the build editor. I also
  zoomed the map to 130% as a rough stand-in for larger text. Screenshots: `~/.playwright-mcp/rv5-*.png`.
  I did not sign in: that needs an email, so the signed-in points come from the code.
* The web map is a flat stand-in and the driving view is iPhone-only, so I reviewed both from the code.

**Verdict.** The parts are good: the dark sodium palette, hexagon pins, condensed labels and HUD stat
tiles feel like one game-style product on most single screens. The problems are in the system between
the screens. Colours carry too many meanings. There is no type step below `muted`, so 144 inline font
sizes fill that gap. Roles and states have three or four names each. Me has become the settings dump.
And a few seams (first-run copy, local-only progress) behave differently once you're signed in. None
of the fixes needs a native build. Most are token and component work plus copy.

## Fix pass (17 Nov 2026): status

Every blocker, major and minor below was worked on in one pass. The top 10 changes are all
done. Owner decisions that differ from the review: role words are **Hosting, Going,
Requested, Invited, Public** (not "Asked to go" / "Open to all"), with **Request to go /
Cancel request**; Settings is its own screen (from a header button on Me) and still has the
map layers next to the layers button; bundled drives and photo spots moved to the server
(M4) instead of the "copy now" label.

| Finding | Status | What changed |
|---|---|---|
| B1 | Fixed | Handle hint "Shown on your profile, in chat and on trophies."; sample-people sentence and the Tamworth button only in the demo; signed in: "Only used to find events near you… nobody sees it." |
| B2 | Fixed | `theme.ts` roles: `BRAND`, `LAYER`, `STATE` (live white + red dot, success, warning amber, danger, info), `CLASS` metal ladder, `SURFACE`; no `C.neon/lime/magenta` outside the theme |
| B3 | Fixed | Four pills share the row (`mapLayers.ts`), icon-only when tight or at larger text; Find next to the bell, Near me under layers, Suggest a place in the layers menu |
| M1 | Fixed | `neon` button kind removed; primary / secondary (outline) / danger; Check in primary on a live event, navigation secondary |
| M2 | Fixed | `src/lib/glossary.ts`: `roleLabel()`, place names, "unlocks", "stop", "meet spot", menu paths, titles |
| M3 | Fixed | One primary **Navigate the drive** (the driving view counts it); **Count without directions** only where navigation isn't available; **Simulate the drive** in the demo |
| M4 | Fixed | `spots.bundled_id`, 129 drives and 111 photo spots seeded on the server; completions, check-ins and ratings go through the RPCs signed in; `place_rep_for()` so rep matches on every phone; old phone-only progress labelled "Only on this phone" and not counted; lap times stay local and say so |
| M5 | Fixed | `caption` 13 and `micro` 11 in `Txt`; inline sizes replaced (left: logo, code input, class-up moment, cover art, driving view tokens); `scale="chrome"` (1.3x) on pills, HUD, tags and stats, 1.2x in the driving view; body scales |
| M6 | Fixed | `Card` variants (solid, raised, glass, muted), `Tag`, `SampleTag`, `LegendTag`, `ConfirmBox`, `InlineError`, `Notice`, `EmptyState`, `NotFound`, `ToggleRow`, `ListRow`, `Segmented`, `LinkText`, `HeaderAction`, `CrewCard`; joining a crew isn't red |
| M7 | Fixed | Me: profile, rep, crew, your places; new Settings screen; all eight layers saved |
| M8 | Fixed | Next-up empty state (Find events, Host one, Suggest a place); one-time "How the map works" card; Garage and Events empty states with actions |
| M9 | Fixed | `title(SCREEN_TITLES.x)` for list and form screens, detail screens blank, "ADD A CAR OR BIKE" / "EDIT BUILD", no "DRIVE / DRIVE", one `HeaderAction` style, headers 17 |
| M10 | Fixed | `InlineError` under the action that failed (chat, going, check-in, votes, plan, forms, places); location notes are a neutral `Notice` |
| M11 | Fixed | Finished cards use the muted card, not opacity; disabled buttons kerb fill with fog label; inputs `borderStrong` (3.7:1 on tarmac); off pill icons full fog; dim cameras about 4:1; END text asphalt on red |
| M12 | Fixed | Drive = winding road, track and track day = chequered flag; tabs: folded map, calendar, car, person |
| m1 | Fixed | Wordmarks don't pulse; the pulse is white and live-only |
| m2 | Fixed | Mono lines keep their case; the map card's meta line isn't uppercased |
| m3 | Fixed | `Chip raw` for co-host handles |
| m4 | Fixed | "›" everywhere; GPS clause demo-only, pointing to Me › Settings › Demo |
| m5 | Fixed | "and" in labels ("Tyres and wheels", "Cafés and meet spots") |
| m6 | Fixed | Links sodium, "Open ›" |
| m7 | Fixed | `LegendTag` |
| m8 | Fixed | Rep and level in brand everywhere; level shown once on Me |
| m9 | Fixed | `SampleTag` |
| m10 | Fixed | All map buttons 44 pt rounded squares |
| m11 | Fixed | Shopfront icon in the key and the menu |
| m12 | Fixed | "Meet spots" on the map, key, Settings and place pages |
| m13 | Fixed | Demo areas without a looked-up town say "Sample area" |
| m14 | Fixed | "You: Member" as text and a secondary **Leave crew**; "Invite members" says coming soon signed in |
| m15 | Fixed | Vehicle data version moved to Settings › App updates |
| m16 | Fixed | Find shows a one-line filter summary with **Change ›** |
| m17 | Fixed | Events tab uses a segmented control; SPEC Screens item 2 updated |
| m18 | Fixed | Vote block is a `Section`; "Trophies"; "Photos" and "Nearby photos" |
| m19 | Fixed | Chips, menu rows, list rows and links reach 44 pt (height or hit area) |
| m20 | Fixed | `minWidth: 0` on Year and Nickname |

Not done: the reminder notification still says "location unlocked", because the server's
reminder queue (`20261117120500_reminders.sql`) uses the same words and should change with
it in a later migration. Larger iOS text was checked by unit tests (`mapLayers.test.ts`) and
on the web build, not yet on the iPhone: run the README checklist at two steps larger.

**Screenshots** (web build, demo, `~/.playwright-mcp/`): before `fx5-before-*` and after
`fx5-after-*`, each at 375x812 and 430x932: 01 sign-in, 02 welcome, 03 map, 04 layers menu,
05 Events, 06 live event, 07 Garage, 08 Me, 09 a drive, 10 Find, 11 Settings (new).

---

## Findings, ranked

### Blockers (fix before friends see it)

**B1. The first-run form contradicts the privacy promise and is wrong for signed-in people.**
* `src/components/ProfileForm.tsx:105`: the handle hint says "What people see **on the map**, in chat and
  on trophies". Me › Privacy (`src/app/(tabs)/me.tsx:236`) and every profile footer say "Nobody is ever
  shown on the map". It's the first thing a friend reads (rv5-02b-welcome-full.png).
* `ProfileForm.tsx:140-143`: "Until the app has a backend, sample people and events (marked Sample) are
  drawn round your home area". That's false when signed in, where there are no sample people.
* `ProfileForm.tsx:166-168`: **Testing: use the demo area (Tamworth)** shows to signed-in people too, so a
  real account can set its home (and invite radius) to Tamworth.
* *Fix:* handle hint: "Shown on your profile, in chat and on trophies." Show the sample-scene sentence and
  the Tamworth button only when `backend === 'local'`. Signed in, say instead: "Only used to find events
  near you. Nobody sees it."

**B2. Colour has no fixed meaning, and the map depends on colour.**
The theme says "one colour per layer", but each accent also stands for many other things. As built:

| Colour | Means on the map | Also means (examples) |
|---|---|---|
| neon `#3fd6ff` | **Drives** layer | live now (pill, Live section, clock, `index.tsx:916`, `events.tsx:64`), host role (`EventCard.tsx:60`, `event/[id].tsx:235`), class **C** (`classes.ts:63`), rep and level (`Rep.tsx:41`), crews (`me.tsx:75`), check-in, Start drive, Start navigation, Approve buttons, system chat lines, "Open event ›" (`notifications.tsx:68`), time, radius and reveal chips (`EventForm.tsx:306,453,468`), the garage "Sample" tag |
| lime `#9dfa5a` | **Tracks** layer | going (`event/[id].tsx:236`), checked in ✓, Legend, Find events and "N new", Still there, "STARTS TONIGHT" (`EventForm.tsx:310`), home area set, passed checkpoints, class **D** |
| sodium `#ff9a2e` | **Events** | brand, primary buttons, every section header, every link, unread, requested role, "Before you go" warnings (`spot/[id].tsx:153`), rep values on profiles, class **A** |
| alert `#ff4d4d` | **Speed cameras** | errors, destructive buttons, offline, declined, ban zones, class **S** |

`CLASS_COLOURS` (`src/lib/classes.ts:59-65`) copies four theme hexes by hand, so an **S** badge is camera
red, an **A** badge is event orange, a **C** badge is drive blue and a **D** badge is track green. On the
live event (rv5-10-event-live.png) two neon buttons, a neon clock and a neon "Live now" sit next to orange
class badges, and none of it means "drive".

*Fix:* split the palette into **layer colours** (map and place identity only) and **state colours** (live,
success, warning, danger, selected), plus one **brand/action** colour. Move live and host off neon, give
class letters their own ramp, and give warnings their own amber. See "Design system checklist" below.

**B3. On a real iPhone the map's main actions are off-screen.**
The layer bar is fixed 98x38 pills (`src/components/LayerBar.tsx:37-38`) in a sideways scroll. At 400 px
the Tracks pill is already cut off, and **Find events**, **Near me** and **+ Suggest a place** are hidden
past it with no scroll hint (rv5-03-map.png). An iPhone 15/16 is 393 pt wide, so it's worse there. At
130% text only three pills fit (rv5-25-map-zoom130.png). These are the map's only ways to find events
and suggest places.
*Fix:* keep the four layer pills (icon-only below 400 pt, or shrink to fit), and move the three actions
off the bar: **Find** into the top row next to the bell (as on Events), **Near me** as a third round
button under locate and layers, **Suggest a place** into the layers menu and Me. Then nothing needs
sideways scrolling.

### Major

**M1. No rule for button weight: two equal primaries on the most important screen.**
On a live event, **Check in at …** (`event/[id].tsx:357`, `kind="neon"`) and **Start navigation**
(`NavLaunch.tsx:76`, `kind="neon"`) are both full-width neon blocks, one under the other
(rv5-10-event-live.png). Across the app `neon` is used for 14 different actions (check in, start drive,
simulate, Camera, Approve, Save time, Send suggestion, Sign in on Me, Use my current location, Restart to
update, Apple Maps, Try again, Join crew, the nav launcher). Meanwhile `primary` (sodium) does I'm going,
Send invites, Save build, Move on and Start a crew. "Save time" is neon while "Save build" is primary.
"Camera" is neon on a photo spot and ghost everywhere else.
*Fix:* one rule. **Primary (sodium)** = the one thing this screen is for, at most one visible at a time.
**Secondary (ghost)** = everything else. **Danger** = destroys or cancels. Retire `neon` as a button
kind, or keep it only for "you are here, do it now" actions in the driving view. On a live event:
Check in is primary, Start navigation is secondary.

**M2. Roles, states and actions have several names each.**

| Idea | Names in the app |
|---|---|
| You host it | "Hosting" (`EventCard.tsx:16`, `event/[id].tsx:235`), "You host" (`index.tsx:870`), "HOSTING 2" on Me means *currently hosting* (`me.tsx:56`) but "0 HOSTED" on a profile means *hosted ever* (`user/[id].tsx:53`) |
| You asked a host | "Request to go" (button, `event/[id].tsx:459`), "Requested" (card), "Asked to go" (hero and HUD), "ask to go" / "you asked to go" (Find, `find.tsx:182`), "Ask without one" (`event/[id].tsx:436`), "Request sent", "Withdraw request" |
| Shows and track days | "Public" (card, Events tab), "Open to all" (HUD), "Everyone welcome · 100 mi" (`invites.ts:50`, which also has a radius, so it reads as a contradiction) |
| The place becomes visible | unlock, unlocked, reveal, revealed, "Place unlocks in", "Location unlocked" (notices), "Reveal the place" (host form), "location locked" |
| Where it is | place, spot, stop, location, area, "Where" (`event/[id].tsx:500`), "Place" (host form, `EventForm.tsx:316`) |
| Going colour | lime in the hero tag, fog on cards (`EventCard.tsx:60`) |
| Attended | "meets attended" (rep), "1 MEET" on profiles, but it counts cruises and shows too |

*Fix:* a short glossary (below) and a single `roleLabel(role, context)` in `src/lib/eventView.ts` used by
the card, hero, HUD and Find. Suggested words: **Hosting**, **Going**, **Invited**, **Open to all**,
**Asked to go** (button: **Ask to go**; and **Cancel request**), **Declined**. Use "**unlocks**" for the
place becoming visible everywhere and drop "reveal" from the UI (keep it in code). Use "**stop**" for a
point on an event and "**spot**" for photo spots only.

**M3. A drive has two ways to drive it.**
A drive page shows **Navigate the drive** (turn by turn, which per SPEC also completes the drive) and,
lower down, **Drive it › Start drive** (silent GPS checkpoint tracking). Both are full-width neon
(`spot/[id].tsx:177-181`, `:418`; rv5-14-drive-1.png). A new user can't tell which one counts, or why
they'd pick the silent one.
*Fix:* one action, **Drive it**, that opens the driving view and counts the checkpoints. Keep the
checkpoint-only mode as the fallback when navigation isn't available (web, or no directions), and as
"Simulate the drive" in the demo. The rules text ("never timed, pass or fail") goes under that one
button.

**M4. Signed in, your rep isn't the same on your phone as on your mates' phones.**
Finishing, rating or visiting a **bundled** drive or photo spot is kept on the phone, not on the server
(`src/lib/backend/remote.ts:588-593, 607-612, 625-630`; BACKEND.md "Places"). But rep is worked out on
each phone from what that phone knows (`src/components/Rep.tsx:22`). So Me counts your bundled drives
(+50 to +175 each) and your mates' copy of your profile doesn't, and crew totals differ by phone. Next to
it, "DRIVEN BY 0", the star average and "Members' photos" on bundled places only ever show you, while
the welcome pitch says places are "rated by the scene". Track times are also on the phone only
(`TrackPanel.tsx:206` says so, which is good).
*Fix (copy now, data later):* until bundled progress is on the server, don't count it in the shared rep
when signed in. Instead show it as "On this phone: 2 drives, +250 rep. Counts for everyone once
Nightshift's own places are on the server". On bundled places, label the counts "you" not "members"
when signed in. Track the server import as BACKEND section 10 item 2.

**M5. The type scale stops at `muted`, so screens make up their own small sizes.**
`Txt` has 8 variants (`ui.tsx:7-37`), and none is below 14 px apart from the uppercase `label` (12 px).
So screens add sizes inline: **144** font-size overrides in `src/app` and `src/components`, including
69 at 12 px, 36 at 11, 25 at 13, 10 at 10 and 4 at **9 px** (`LayerBar.tsx:144` filter note,
`drive.tsx:940` credit). 75 of them are `v="muted"` shrunk to 11-13 for hints and footnotes.
There's also no Dynamic Type plan. Nothing sets `maxFontSizeMultiplier`, but the layer pills are fixed
size with `numberOfLines={1}`, the HUD rows are `nowrap`, and stat values use `adjustsFontSizeToFit`. At
larger iOS text sizes the map HUD clips and labels truncate (rv5-25-map-zoom130.png).
*Fix:* add `caption` (13/17, fog) and `micro` (11/14 condensed caps, for credits only) to `Txt`, and
replace the inline sizes with them. Keep 11 as the smallest size anywhere. Set `maxFontSizeMultiplier`
(about 1.3) on HUD and map chrome only, let body text scale fully, and let pills grow in height.

**M6. The same component is built five ways.**
* **Cards:** `Card` exists, but `EventCard.tsx:44`, `crews.tsx:30`, the map peek and Next-up
  (`index.tsx:919-947`) and every map menu restate the card styles inline, each with its own overlay
  alpha. There are **13 different rgba values** for the two dark surfaces (`rgba(11,15,23,0.55…0.94)`,
  `rgba(19,26,38,0.95…0.98)`), plus `#070a10`, `#080c13`, `#141c2a` and `#111827`.
* **Tags:** at least 7 hand-rolled tag boxes. Role tag `event/[id].tsx:255`, drive tier
  `spot/[id].tsx:574`, partner `shop/[id].tsx:95`, level `Rep.tsx:41`, BuildHero tags, live pill
  `index.tsx:916`, map credit.
* **Crew card:** copied between `me.tsx:69-85` and `user/[id].tsx:61-77`.
* **Toggle row:** local to Me (`me.tsx:294-304`), while the event screen builds its own Switch row
  (`event/[id].tsx:297-305`).
* **Confirm-in-place:** 8 copies with 8 label pairs: "Yes, cancel it / Keep it", "Yes, delete it /
  Keep", "Reset everything / Keep", "Leave crew / Stay", "Join … / Stay put", "Delete everything / Keep
  it", "Remove … / Keep". Joining a crew is styled `danger` (`crew/[id].tsx:121`).
* **Not found:** 6 versions (`event/[id].tsx:86`, `spot/[id].tsx:56`, `crew/[id].tsx:43`,
  `build/[id].tsx:50`, `user/[id].tsx:32`, `zone/[id].tsx:15`). Only the event one has a way back.
* **Radii:** 4, 6, 8, 10 and 12 for the same kinds of box (cards 8, embedded maps 10, map buttons 6 with
  one round one, pills 19).
*Fix:* add `Tag`, `ListRow`, `ToggleRow`, `ConfirmInline`, `EmptyState`, `NotFound`, `CrewCard` and a
`Surface` (solid or glass) to `ui.tsx`, and add the overlay alphas as tokens. Use the confirm pattern
"**{Verb} it / Keep it**" everywhere (e.g. "Cancel it / Keep it", "Delete it / Keep it"), with danger
styling only on the destructive verb.

**M7. Me is a six-screen settings dump, and some settings live in two places.**
Me scrolls through profile, rep (with LVL shown twice), crew, your places, events near you, reminders,
map layers, navigation, privacy, account, app updates and demo (rv5-13-me*.png). That's about 6 phone
screens. Shops and Speed cameras can be toggled both here (`me.tsx:192-205`) and in the map's layers
menu, but **Road reports** only in the layers menu. The core layers (Events, Photos, Drives, Tracks) sit
in screen state (`index.tsx:124`) and come back on after a restart, while the others are saved.
*Fix:* Me keeps who you are: profile, rep, crew, your places, trophies. A gear in Me's header opens
**Settings**: Events near you, Reminders, Navigation, Privacy, Account, App updates, Demo. Remove the
Map section from Me; layers belong on the map, all saved the same way.

**M8. A first-time user doesn't get the app in 30 seconds, and signed in it's worse.**
Demo: the map opens on 15+ unexplained hexagons in five colours, a "1 LIVE NOW" pill in the same blue as
Drives, a bell with 4-5 unread, a layers button with no label, and a ▾ on Tracks whose long-press is the
only hint (rv5-03-map.png). What the app is for (find tonight's meets and go) is in the Next-up card at
the bottom, which works well. Signed in with no events near you, that card isn't drawn (`index.tsx:667`,
`lead ? … : null`), so the map has no call to action at all, and Events and Garage open on text-only
empty cards.
*Fix:* (a) a Next-up **empty state** card: "Nothing on near you tonight · **Find events** · **Host
one**"; (b) a one-time three-line coach mark on first map open ("Filled pins are events, outlined
pins are places · Tap a pin · Layers and the key are here"), pointing at the layers button; (c) Garage
empty state with the **+ Add a car or bike** button inside it and a line on why ("Invites are matched
to your builds").

**M9. Headers follow three conventions.**
Stack titles are hard-coded capitals (`_layout.tsx:62-77`), some are blank (event, build), the profile is
a lowercase `@handle` (`user/[id].tsx:29`), the zone page is sentence case "Car-meet order"
(`zone/[id].tsx:14`), and the crew title is just `[NR]` (`crew/[id].tsx:31`). Spot screens put the kind
in the header and again as the eyebrow under it ("DRIVE / DRIVE", "TRACK / TRACK",
`spot/[id].tsx:53,120`; rv5-14-drive.png). Add and edit a build are both titled "BUILD"
(`_layout.tsx:67`). The tab headers use 18 px and stack headers 17 px (`(tabs)/_layout.tsx:15`,
`_layout.tsx:48`). Header actions come in three styles: bell icon, white "FIND", sodium "+ HOST"
(`events.tsx:24-35`), and "Edit" on builds (`build/[id].tsx:44`).
*Fix:* detail screens have a blank header (the hero carries the title), and list and form screens have a
capitalised title from one `title()` helper. One header-action style: a sodium label, or an icon with a
label for screen readers. "ADD A CAR OR BIKE" / "EDIT BUILD".

**M10. Errors appear far from what caused them, in four styles.**
The event screen has one error card at the top (`event/[id].tsx:316`), so a chat send failure
(`:694, :703`) or a declined request shows two screens above the chat box. Error styles: `Card` with an
alert accent (event, spot, signin), plain red text (`crew/[id].tsx:94`, `build/[id].tsx:66`), red muted
text (`me.tsx:139`), and a red location note in Find that isn't an error at all (`find.tsx:117`).
*Fix:* an `InlineError` under the control that failed, with a polite live region. Errors are alert red;
notices ("location is off, searching from home") are a neutral `Notice` card.

**M11. Faded states fail contrast.**
Fog on asphalt is 6.5:1 and fine. But finished and cancelled event cards are drawn at 55% opacity
(`EventCard.tsx:46`), which puts their fog text at **2.7:1**. Disabled primary buttons are at 40% (label
**2.2:1**). Off layer-pill icons are at 55% of fog (2.8:1), and dim cameras `#a34848` are 3.0:1 on tarmac.
Card and input borders (`kerb` on asphalt, 1.26:1) mean text fields are hard to see on the dark
background (rv5-22-build-edit.png).
*Fix:* fade finished cards by switching to a muted palette (fog title, kerbHi accent) rather than
opacity. Disabled buttons use a `kerb` fill and fog label. Inputs get `kerbHi` borders (and sodium when
focused).

**M12. The drive icon is a chequered flag.**
`Pin.tsx:182-189` draws drives (public roads, "never timed") as a chequered flag. That's the racing
symbol, and it's the same blue as "live" and level badges. Tracks, where times do count, get a squiggle.
The Garage tab icon is also the track squiggle (`(tabs)/_layout.tsx:29`), and the Map tab uses the
locate arrow (`:24`), the same glyph as the locate-me button.
*Fix:* drive = a winding road with a dashed centre line; track (and track day) = the chequered flag;
Garage tab = a car-and-bike outline or a spanner; Map tab = a folded map. This matters for the legal
tone as much as for looks.

### Minor

* **m1. Pulse means "live", except on the wordmark.** The sign-in and welcome logos pulse
  (`signin.tsx:70`, `welcome.tsx:32`). Keep `PulseRing live` for live events only.
* **m2. Mixed case inside one caps line.** The event card's mono line uppercases the time but not the
  class mix: "LIVE · ENDS IN 3H 1M · 7 GOING · Cars 1S 4A 1B · Bikes 1S" (`EventCard.tsx:63-64`;
  rv5-07-events-mine.png). The map peek uppercases its whole meta line, including place names
  (`index.tsx:644`).
* **m3. Handles get uppercased in chips.** The host form's co-host chips read "@DAN_R" (`EventForm.tsx:491`,
  via `Chip`'s `textTransform`). This is the same rule as REVIEW.md #23, in a new place. `Chip` needs a
  `raw` prop, or handles need their own `HandleText`.
* **m4. Menu paths are written two ways.** "Me > Demo: skip the GPS check" (`event/[id].tsx:156`,
  `spot/[id].tsx:352, 474`) vs "Me › Reminders" (`notifications.tsx:38`, `me.tsx:164`). Use "›".
* **m5. "and", "&" and "+".** "Cars + bikes" (filters and summaries), "Tyres & wheels", "Coffee & meet
  spots" (`shopCategories.ts:19-29`), "Cars and bikes" in prose. Pick "and" in labels. "+" is fine in
  the compact filter summary only.
* **m6. Link colour and wording drift.** Chevron links are sodium 9 times, neon 8 times, plus alert and
  shop purple. Wording is "Open ›" (garage, Me), "View ›" (profile garage, `user/[id].tsx:108`), "See ›"
  (votes), "Open event ›" (neon, notifications), "Open in another app ›" (neon). Rule: links are sodium
  and say "Open ›" or "{Verb} ›".
* **m7. Legend is shown three ways.** "Legend this week" (`me.tsx:50`), "★ Legend this week"
  (`user/[id].tsx:46`), "★ LEGEND" (`event/[id].tsx:612`). Make one `LegendTag`.
* **m8. Rep is sometimes orange, sometimes blue.** Sodium on profiles and crews (`user/[id].tsx:55`,
  `crew/[id].tsx:90`, awards "+500"), neon in `RepPanel`. The level tag shows twice on Me (profile card
  and rep card).
* **m9. "Sample" is marked four ways.** Neon tag on the garage card, "· Sample" in fog on event cards
  (`EventCard.tsx:57`), "· Sample event" (hero), "Sample person" in muted text, "Sample report for the
  demo." in report bodies. One `SampleTag`, fog outline.
* **m10. Map buttons don't match.** Locate is a rounded square (`index.tsx:924`), the layers button
  under it is a circle (`:934`), the bell is a rounded square. Make them all 44 pt rounded squares, or
  all circles.
* **m11. The map key and the layers menu use different shop icons.** Spanner (`index.tsx:96`) vs
  shopfront (`:62`).
* **m12. Venues have two homes.** Venues are a "More" layer that's on by default, and they also appear
  as "Coffee & meet spots" under Shops (`index.tsx:189-190`). Call them **Meet spots** in both places,
  or fold Venues into the core bar.
* **m13. "Near you" as a place name.** Demo events use "Near you" as their area, so notices read "Check-in
  is open. Near you." (rv5-17-notifications.png) and the hero says "· NEAR YOU". Use the real town the
  demo already looks up, or "Sample area".
* **m14. State shown as a button.** "Member ✓ (tap to leave)" (`crew/[id].tsx:113`). Show "You: Member"
  as text (it already is, at `:96-98`) and a plain **Leave crew** ghost button.
* **m15. Jargon.** "Data 2026-11-17.3" under the vehicle picker (`VehiclePicker.tsx:136`). Move it to
  App updates.
* **m16. Find's filters push the results off the first screen.** Six filter rows (`find.tsx:112-161`,
  rv5-18-find.png). Show a summary row ("25 mi from home · any time · cars and bikes · **Change**") with
  the full filters in a sheet.
* **m17. The Events tabs look like filters.** Mine / Invited / Public / Past are `Chip`s
  (`events.tsx:57-60`), which elsewhere are multi-select filters. Use a segmented control. SPEC
  "Screens" item 2 still says "Going, Invited, Hosting and Public": update it to what's built.
* **m18. Section headers vary.** The collapsed Vote block is an accented card, not a `Section`
  (`AwardsSection.tsx:84-89`). "Trophy cabinet" (build) vs "Trophies" (profile, event). "Photos",
  "Members' photos" and "Online photos" for three photo blocks.
* **m19. Tap targets under 44 pt.** A `Chip` is about 30 pt tall plus a 4 pt hitSlop. Map menu rows
  are 28-34 pt (`index.tsx:687, 780, 823`). `Section` header links are 14 px text with an 8 pt hitSlop.
  Chips, menu rows and header links need `minHeight: 44` (or hitSlop to reach it).
* **m20. Web only, check on the phone.** Year and Nickname overflow the row at 400 px
  (`build/edit.tsx:205-208`, rv5-22-build-edit.png). It's probably the web `flex` min-width; add
  `minWidth: 0`.

---

## Information architecture and flows

**What lives where today**

| Tab | Holds | Sub-screens reached from it |
|---|---|---|
| Map | layers, live pill, bell, Next up, peek card, Find, Near me, Suggest, layers menu, key | event, spot (drive, photo, track, venue), shop or partner, Find, Suggest, notifications |
| Events | Mine, Invited, Public, Past; bell, Find, + Host | event, host form, edit, change the plan, Find, notifications |
| Garage | your builds | build, build editor |
| Me | profile, rep, crew, places, events near you, reminders, map, navigation, privacy, account, updates, demo | profile editor, public view, crews, crew, start a crew, Find, Suggest |

Depth is fine: nothing important is more than two taps from a tab. The driving view is a full-screen
modal, and the gestures are disabled there, which is right.

**Duplicate entry points:**
* **Find events** has four: the map action (hidden, see B3), the Events header, Me › Events near you, and
  text in two empty states. Keep the Events header and the Map top row.
* **Suggest a place** is a map action and Me › Your places. Fine once it's visible (B3).
* **Host** is only in the Events header, plus "Host an event" on a crew page. The Map, the most-used
  screen, has no way to host. Add **Host one** to the Next-up empty state (M8).
* **Notifications** has a bell on Map and Events but not Garage or Me. Either put it on all four tabs,
  or only on the Map and Events, and say so in the README.
* **Crews** can only be found from Me, so most people won't see them. The crew link on events works.
* **Map layer settings** live on the map and on Me (M7).

**Discoverability:** long-press on the Tracks pill (the ▾ helps, so long-press can be a shortcut only).
The layers button needs a visible "Layers" label or the first-run coach mark (M8). "Kinds ›" inside the
layers menu is easy to miss. The "See as a guest" switch on your own event is a good feature that's
buried, so consider showing it as a chip above the map.

**Glossary (proposed: put it in SPEC and use it in copy)**

| Use | Not |
|---|---|
| **event** (cruise, rolling meet, meet, show, track day) | "meet" as the generic word (profile "1 MEET") |
| **host / hosting** | organiser, "You host" |
| **Ask to go / Asked to go / Cancel request** | Request to go, Requested, Withdraw request, ask without one |
| **Open to all** | Public, Everyone welcome |
| **unlocks** (the place) | reveal, revealed (UI copy) |
| **stop** (a point on an event) | place, spot, location (for events) |
| **drive** (a road to enjoy) | route (keep **route** for a cruise's line only) |
| **photo spot**, **track**, **meet spot** (was venue), **shop**, **partner** | venue, coffee & meet spot |
| **rep** (number), **level** (LVL n) | points, score |
| **check in** (events and photo spots) | visit (as a verb in buttons) |
| **builds** for your vehicles; **car or bike** in plain copy | vehicle (fine in a11y labels) |

**Copy tone.** The copy is mostly plain UK English and good. Three things drift. Long hints: Me's toggles
carry 2-3 sentence hints each, including the full camera caveat twice. The capitalisation source:
sentence case in code, capitals by style, so keep it, but stop hard-coding capitals in `_layout.tsx`
and mono lines. Demo explanations repeat: Account and Demo both say "everything stays on this phone".

---

## Signed in vs demo

| Area | Demo | Signed in | Issue |
|---|---|---|---|
| First run copy | sample scene explained | same text, which is wrong | **B1** |
| Tamworth demo area button | shown | shown | **B1** |
| Map with nothing near you | always has sample events | can be empty, no HUD card | **M8** |
| Bundled drives, photo spots, ratings | on the phone | **still on the phone**, mixed into shared rep | **M4** |
| Track times | phone | phone (labelled) | good, keep the label |
| Chat footer | "Demo: chat stays on this phone." | "Everyone going and the hosts see the chat, live." | good |
| Offline pill | never | yes | good. The demo has no network states, so offline copy is only testable signed in |
| "Skip the GPS check" | Me › Demo | hidden; errors still say "or, for testing, Me > Demo: skip the GPS check" (`event/[id].tsx:156`, `spot/[id].tsx:352, 474`) | only add that clause in the demo |
| Sample markers | 4 styles | none | **m9** |
| Crew invites | `addToCrew` works | needs an invite that isn't built (BACKEND) | the crew page's "Invite members" should say "Coming soon" when signed in |
| Suggestions | approved in 10 s ("In the demo, … about 10 seconds", `spot/[id].tsx:187`) | waits for real approval | show the demo sentence only in the demo |

---

## Accessibility basics

* **Contrast** (WCAG, worked out from the theme). Fog text: 6.5:1 on asphalt, 5.9:1 on tarmac, 5.1:1 on
  kerb, **4.2:1 on kerbHi** (fails for small text). Chalk is 13-16:1. Ink on sodium is 8.3:1. White on
  END red is 3.3:1 (passes only as large text, and it's 24 px bold, so OK; ink would be safer in
  sunlight). Faded states fail (**M11**). Magenta on kerb is 5.0:1 and alert on kerbHi 3.8:1, so avoid
  those pairings for text.
* **Labels.** Most `Pressable`s have a role and label. Map pins carry titles and "live now" or "zoom in".
  Gaps: the event card's long label reads everything (fine). The layer bar's caret says "options". Stat
  tiles read "label value". Ok.
* **Tap targets.** See **m19**.
* **Dynamic Type.** No plan (**M5**). Test at the iOS "Larger Accessibility Sizes" 1-2 steps on: the map
  HUD, layer pills, event card mono lines and the driving view (which should cap at about 1.2x, since
  its text is already big).
* **Reduced motion.** Good. Every piece in `motion.tsx` checks `useReducedMotion` and falls back to a
  fade. The one gap is the meaning drift in **m1**.
* **Colour alone.** Roles and layers always carry text or a glyph as well as colour, which is good.
  Pending places are fog plus a dashed line. Class letters are colour plus letter, which is fine.

---

## Design system checklist

Put this in `src/theme.ts` and `src/components/ui.tsx`, and tick it off per screen in the fix pass.

**Colour tokens (roles, not hues)**
- [x] `brand` / `action` = sodium: primary buttons, links, section eyebrows, unread.
- [x] Layer colours **only on the map and place identity**: events (sodium, shows blue, track days
      chalk), drive, photo, track, meet spot, shop, partner, camera, road report.
- [x] State colours, distinct from layers: `live` (a new hue, e.g. hot magenta-red or pure white with
      pulse, *not* the drive blue), `success` (checked in, saved), `warning` (amber for "Before you
      go", ban zones), `danger` (alert: errors, destructive), `selected` (chip on, one colour for all
      chips).
- [x] Class ramp S-D as its own tokens, not copies of layer and state hexes.
- [x] Surfaces: `bg` (asphalt), `surface` (tarmac), `surfaceRaised` (kerb), `glass` (one alpha for
      overlays on the map), `scrim` (one alpha for dimming), `border`, `borderStrong` (inputs).
- [x] Text: `text` (chalk), `textMuted` (fog, never on kerbHi), `textOnAction` (ink).

**Type**
- [x] `display` (h1 28), `title` (h2 20), `heading` (h3 16), `body` 15, `caption` 13, `label` 12 caps,
      `micro` 11 caps (credits only), `mono` 13 tabular. No other sizes outside the driving view.
- [x] Driving view scale stays its own (banner 38, speed 44), written down as `drive.*` tokens.
- [x] `maxFontSizeMultiplier` on map chrome and HUD only.
- [x] Handles never text-transformed.

**Spacing and shape**
- [ ] Screen padding 16. Section gap 20. Inside a card 8. Between cards 12. Bottom padding = 40 plus
      the safe area. *(Not yet: `SPACE` tokens exist in theme.ts, screens not all moved to them.)*
- [x] Radii: 4 (tags, chips), 8 (cards, inputs, buttons), 12 (sheets, embedded maps), full (pills, map
      round buttons). Pick one for map buttons.
- [x] Minimum tap target 44x44.

**Components**
- [x] `Button`: primary / secondary / danger (retire `neon`), with a size `lg` for the driving view.
- [x] `Chip` (filter, multi-select) and `Segmented` (tabs like Mine / Invited / Public / Past).
- [x] `Tag` (role, sample, level, tier, partner, legend: outline, 4 radius, label type).
- [x] `Card` with `accent`, and `Surface` (solid or glass) for map overlays. No inline card styles.
- [ ] `ListRow` (icon, title, subtitle, trailing value or chevron) for going lists, places, notices,
      settings. *(Partly: `ListRow` exists and Settings uses rows; going lists and notices still have their own rows.)*
- [x] `ToggleRow` (label, hint, switch).
- [x] `Section` for every titled block, including the collapsed Vote block.
- [x] `EmptyState` (glyph, title, one line, one action) and `NotFound` (message plus a back action).
- [x] `InlineError` (alert, live region) and `Notice` (neutral, dismissable).
- [x] `ConfirmInline` ("{Verb} it / Keep it").
- [x] `HeaderAction` (one style) and a `title()` helper for stack headers.
- [x] `Link` ("Open ›", sodium).

**Icons and motion**
- [x] One glyph per idea: drive = road, track = chequered flag, shop = shopfront everywhere, tab icons
      not reused from map layers.
- [x] Pulse = live only. Bursts = success only (check-in, class up, unlock). Fades for everything else.
- [ ] Press feedback: opacity 0.8 everywhere (the garage's scale is nice, so use it for all big cards
      or none). *(Not yet: press feedback still varies by screen.)*

---

## The 10 changes with the most impact on "one product"

1. **Split colour into layers, states and brand (B2).** Move live and host off neon, give classes their
   own ramp, add a warning amber. This is the change people will notice most.
2. **One primary button per screen; retire `neon` as a button kind (M1).** Check in is primary on a live
   event, navigation secondary.
3. **Fix the map's top bar so nothing scrolls sideways (B3).** Find in the top row, Near me as a round
   button, Suggest in the layers menu.
4. **First-run copy and the signed-in seams (B1, M4).** Correct the handle hint, hide demo-only text and
   the Tamworth button when signed in, and keep phone-only progress out of shared rep.
5. **The glossary in code (M2).** One `roleLabel()`, "Ask to go", "Open to all", "unlocks", "stop"; one
   pass over every string.
6. **Add `caption` and `micro` to `Txt` and delete the inline sizes (M5).** Add a Dynamic Type cap on
   map chrome.
7. **Ship the missing components (M6):** `Tag`, `ListRow`, `ToggleRow`, `ConfirmInline`, `EmptyState`,
   `NotFound`, `Surface`, `InlineError`. Then rebuild EventCard, crews, the peek card and the menus on
   them.
8. **Me becomes Me plus Settings (M7).** Layers live on the map only, all saved.
9. **Empty states and a first-map coach mark (M8).** A Next-up card that always says what to do next.
10. **Icons that match the legal stance (M12).** Drive = road, track = chequered flag, distinct tab icons.

After these, run the README checklist once on the iPhone at the default text size and at two steps
larger, in the demo and signed in, and add screenshots `fx5-*.png` here.

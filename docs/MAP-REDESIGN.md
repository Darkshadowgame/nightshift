# Map tab redesign (November 2026)

The Map tab had grown a control for every feature: a wordmark, a live pill,
Find, the bell, four layer pills, three round buttons on the right (locate,
layers, near me), a credit line, a first-run card and a bottom card that was
either Next up, the selected pin or an empty state. On a 375 pt screen the
chrome covered about a third of the map, and the most common jobs (what's on
tonight, what is this pin) were split between three places.

The redesign follows Apple Maps, Waze and Snap Map: the map is full-bleed, one
search pill at the top, a small stack of round buttons on the right, and one
bottom sheet that holds everything else.

## Layout

```
┌──────────────────────────────┐
│ ( Where to? Search…    ) (🔔)│  one search pill + the bell
│                         [≡]  │  right stack: layers
│        full-bleed map   [◎]  │                locate me
│                         [⌖]  │                near me (fit what's around you)
│                              │
├──────────── ── ──────────────┤  sheet: peek / half / full
│ ● 1 live · Late Rolling Meet │  peek: the one thing that matters now
│ Tonight near you             │  half: live, next up, coming up, places
│ [Host] [Suggest] [Near me]   │        near here, and the actions
└──────────────────────────────┘
```

* **Search pill** (top, 52 pt tall, full width minus the bell). Opens Find,
  which is now one search for events, places, people and addresses: a text
  field with All / Events / Places / People tabs. With nothing typed it shows
  "Where to?" and the event list with its filters, as before. Picking an event
  or place from search comes back to the map, centres it and opens it in the
  sheet.
* **Right stack** (three 48 pt buttons, bottom-right, riding just above the
  sheet so a thumb reaches them): Layers, Locate me, Near me. They fade out
  when the sheet is pulled up to full. Apple Maps' own compass is switched on
  and shows top-right, under the bell, only when the map is rotated; tapping
  it turns north up.
* **Bottom sheet** (reanimated, three detents: peek ≈ 120 pt, half ≈ 50% of
  the screen, full ≈ to the top). Drag the grabber or the header, or tap the
  grabber to cycle; VoiceOver users swipe up and down on it (adjustable).
  Reduced motion: the sheet jumps between detents with a short fade-free
  timing, no spring.
  * Nothing selected: **Tonight near you**. Peek shows the lead event (live
    first, else next up) with its countdown. Half and full add: live now,
    next up and the rest of tonight, coming up this week, places near the map
    (highlights), and the actions row (Host an event, Suggest a place, Find
    events). Empty: "Nothing on near you tonight" with Find and Host.
  * A pin selected: its card (title, meta, three lines of detail, road report
    answers) and one primary button (Open event, Open track…), with the sheet
    lowered to hug the card so the map stays visible. If the sheet would cover
    the pin, the map moves it into the top third. Close (✕) or a tap on the
    map returns to Tonight near you.
* **Layers panel** (the layers button): one panel with all layers as tiles
  (Events, Photos, Drives, Tracks, Meet spots, Shops, Speed cameras, Road
  reports, and any layer added in `mapLayers.ts`), the Tracks and Shops
  options inline, and the map key.

## What moved where

| Feature | Before | Now |
| --- | --- | --- |
| SLIPSTREAM wordmark | Top-left | Removed from the map (it's on sign-in and welcome); the search pill takes its place |
| Live pill ("1 live") | Top row | Sheet peek: "Live now" row with the pulse; tap it to centre the event |
| Find | Top row | The search pill |
| Where to? (any address) | Find, first row | Search pill → Find → Where to? row, and the Addresses result in All |
| Bell | Top-right | Top-right, next to the pill |
| Events / Photos / Drives / Tracks pills | Layer bar under the top row | Layers panel tiles |
| Tracks ▾ (Cars, Bikes, Karts, Racing to watch) | Long-press the Tracks pill | Layers panel, under the Tracks tile |
| Meet spots, Shops, Speed cameras, Road reports | Layers menu | Layers panel tiles |
| Shops ▸ Kinds, Partners only | Floating menu | Layers panel, under the Shops tile |
| Map key | Layers menu ▸ Map key | Layers panel ▸ Map key |
| Suggest a place | Layers menu | Sheet actions row |
| Host an event | Only in the empty state | Sheet actions row, always |
| Locate me | Right column | Right stack |
| Near me | Right column | Right stack, and the sheet actions row |
| "Zoom in to see cameras / shops", OpenStreetMap credit | Line under the pills | Small line above the sheet, left (only when a layer needs it) |
| Location off note | Card under the top bar | Notice at the top of the sheet |
| How the map works (first run) | Card over the map | Notice at the top of the sheet, sheet opens at half the first time |
| Next up (live / next event, then …, N in 12 h) | Bottom card | Sheet peek and the Tonight list |
| Nothing on tonight | Bottom card | Sheet, with Find and Host |
| Selected pin card (and Still there / Gone) | Bottom card | Sheet, lowered to fit the card |
| Count pins (groups) | Tap to zoom in | Same, zooms to fit the group |
| Map widget slot | Above the bottom card | Right, on top of the button stack, riding above the sheet |

## Why

* One place to look: everything that isn't the map is in the sheet, and the
  sheet always answers "what's on near me tonight" until you pick something.
* Fewer always-visible controls: 2 at the top (was 4 plus 4 pills) and 3 on
  the right. The layer toggles are a deliberate two taps: people set layers
  once and leave them (they're saved), but look at the map every time.
* One-handed: the right stack and the sheet's actions are in the bottom half;
  the only top control is search, which you need the keyboard for anyway.
* Bigger targets: map buttons 48 pt, sheet rows and actions at least 48 pt.
* Text size: the pill and stack cap at the chrome scale (1.3); the sheet's
  content scales fully and scrolls at full height.

## Grouping (clusters)

Count pins sit on the group's **medoid** (the member nearest the members'
centre), never on the centre, so a group can't land in the sea. Places only
group with others on the same piece of land (`src/lib/landmass.ts`: Northern
Ireland, the Isle of Man, the Isle of Wight, Skye, the Outer Hebrides, Orkney,
Shetland, Scilly and the Channel Islands are kept apart from Great Britain),
and only within a radius that grows with the zoom (a quarter of the view's
height, 5 to 120 km), so a group never bridges the Thames estuary, the Wash or
the Bristol Channel. Zoomed out past about the size of Wales (span above
`MIXED_SPAN`), every kind shares one neutral count ("23 places", a dashed
ring) so the whole UK reads as a couple of dozen regional counts rather than
four coloured pins per region; closer in, each kind keeps its own colour.
Tests: `__tests__/mapPlaces.test.ts`.

# Design system v2

Updated for **Redesign 2** (`docs/REDESIGN-2.md`, WP-A Foundation, 18 Nov 2026): new tokens, the
`ActionBar`, `PhotoCard`, `Hero`, `GoingStrip`, `LocationLine`, `DateTimeSheet` and `Gradient`
components, the five screen templates, one rulebook (replacing "One way to do X" and the "Added
after Review N" lists), the time and location wording, and the app clock.

The foundation was first proposed in `docs/REVIEW-6-design.md` §8. Tokens live in `src/theme.ts`, components in
`src/components/ds/` (import from `src/components/ds`, the barrel). The old kit (`ui.tsx`, `Txt`,
`Card`, `ToggleRow`, `NotFound`, `EventCard`, `CrewCard`) is gone: every screen and shared component uses
the design system. `__tests__/designLint.test.ts` fails on a quoted hex colour or a literal `fontSize`
in `src/app` or `src/components` outside `ds/` (theme.ts is the only other place raw values live).

**Gallery:** `/dev/components` shows every component in every state. Development builds only
(`__DEV__`); release builds redirect home, and nothing links to it. On the web preview, open
`http://localhost:<port>/dev/components`.

---

## Tokens (`src/theme.ts`)

| Token | Values | Rule |
|---|---|---|
| `SPACING` | `xxs 2, xs 4, sm 8, md 12, lg 16, xl 24, xxl 32, xxxl 48`; `screen 16`, `section 24` | Every gap, padding and margin comes from here. `screen` is the page gutter, `section` the gap between Sections. |
| `RADII` | `tag 4, control 8, card 12, sheet 16, pill 999` | One radius per job: tags; buttons, inputs, chips; cards, embeds, toasts; sheet tops; search fields and dots. |
| `TYPE_SCALE` | `display, heading, hero, titleLg, title, titleSm, body, bodyStrong, secondary, caption, meta, label, eyebrow, button(Sm/Lg), tag, input, stat` | Each has family, size, line height, case and a text-size cap. Use through `DsText v=…` or `typeStyle()`. `hero` (30/34, upright display face, as typed) is for titles on photos and the sign-in tagline. `label` letter-spacing 1.0, `eyebrow` 1.5 (less shouting). Eyebrows are fog by default. `meta` is Barlow Medium 13, not the condensed label face (condensed "mi" read as "ml"). |
| `ELEVATION` | `flat`, `float`, `sheet`, `bar` | Only floating chrome (map buttons, toasts, a card over the map), sheets and the `ActionBar` (`bar`) cast a shadow. Cards on the page are flat with a border. |
| `ASPECT` | `event 16/9, build 4/3, post 4/5` | Photo shapes for `PhotoCard` and `Hero`. |
| `COLOR` | roles below | Pick by role, never by hue. |
| `tint / line / outline` | `1f`, `40`, `99` alpha | The only three alphas. |
| `ART` | sign white/red/black, ink, shadow, body, mapBg, mapGrid, cameraDim, black | Fixed colours for drawings only (the UK speed sign, ink inside pins and icons, build art, the web map). Never text, surfaces or controls. |
| `PRESS` | `control` opacity 0.8; `card` 0.9 + scale 0.98 | Via `Press`, never by hand. |
| `MOTION` | `fast 150, base 220, sheet 280, toast 3200, morph 260, stagger 30` ms | `morph`: a button becoming a tag (I'm going → Going). `stagger`: list items fading up (`FadeUp`). Reduced motion: movement becomes a `fast` fade. |
| `HIT` | 44 | Minimum tap target. |

**Colour roles (`COLOR`)**

| Role | Keys | Means |
|---|---|---|
| `action` | `primary, onPrimary, link, selected, selectedTint, disabledBorder, destructive` | Sodium is **the one primary button and "selected"** (segment, chip, tab). `link` is now chalk: text links and tertiary buttons are chalk with a chevron, never sodium. |
| `text` | `primary, secondary, emphasis, info, onAction, disabled` | `emphasis` (chalk) and `info` (blue-grey) replace sodium on info lines like "you can go". |
| `surface` | `bg, card, raised, raisedHi, media, glass, glassRaised, sheet, scrim, border, borderStrong, skeleton, photoFade` | `media` is the one colour behind photos and build art. `scrim` is the one dim layer. `sheet` is the map sheet, solid. `photoFade` is the one gradient over photos (transparent → asphalt 90%). |
| `state` | `live, liveDot, success, warning, danger, info` | States only, never a layer colour. |
| `classMetal` | `S A B C D` | Only on `ClassBadge`. |
| `badge` | `bg, fg` | Number badges (unread, requests, notices): red on white. Never sodium. |
| `layer` | `event, show, trackday, photo, drive, track, venue, shop, partner, camera, road, post` | Map and place identity: pins, the layers panel, an entity's kind eyebrow and accent bar. Never on chips, section titles or buttons. |
| `avatar` | `bg, fg, border` | Chalk on kerb. A person isn't an action. |
| `chat` | `own, ownBorder, theirs, theirsBorder` | Chat bubbles: yours solid blue, theirs raised grey. |
| `paint` | 8 swatches | Build card colours. Not layer hexes. |

**Text size.** Body tokens scale fully with the iOS text size. Chrome tokens (`heading`, `meta`,
`label`, `eyebrow`, `button*`, `tag`, `stat`, `display`) cap at `FONT_SCALE.chrome` (1.3x) so pills,
tags and tiles don't clip. Avatars and class badges are fixed-size marks with labels. The driving view
uses the `drive*` tokens (`driveArrow, driveSpeed, driveDistance, driveTitle, driveRoad, driveReadout,
driveBody, driveButton, driveLabel`), built on `DRIVE_TYPE` and capped at `FONT_SCALE.drive`.

**Case.** Capitals are for chrome: headers, eyebrows, labels, buttons, tags, segments. Content (titles,
names, handles, places, messages, meta lines) appears as typed. `title`, `titleLg`, `body`, `meta` never
uppercase.

**Old names.** `C`, `BRAND`, `LAYER`, `STATE`, `CLASS`, `SURFACE`, `TEXT`, `TYPE`, `F`, `FONT_SCALE`
are unchanged (`COLOR` reads from them). `RADIUS` and `SPACE` are gone (Redesign 2).

**Text tones.** `DsText tone="action"` is the link colour (chalk). `tone="brand"` is sodium, for the
wordmark, the trophy cover and the class-up moment only.

---

## Components (`src/components/ds`)

Every pressable goes through `Press`: one pressed state and haptics by rule, so screens never call
`feel` directly. Every component has a role and a label, and animated ones respect reduced motion.
Import everything from the barrel: `import { ActionBar, PhotoCard, … } from '../components/ds'`.

### New in Redesign 2 (WP-A)

Screens B, C and D build on these. Every one is shown in every state at `/dev/components`.

**`ActionBar({ primary?, secondary?, status?, children?, inset = true })`** — the bottom bar of
every T3 detail screen, T4 form and the sign-in screen. Holds the screen's one primary.
- `primary`, `secondary`: `{ label, onPress, busy?, icon?, haptic?, accessibilityLabel?, accessibilityHint? }`.
  Both: stacked full width, primary on top. Secondary alone: one outline button.
- `status`: a pill in place of a primary that isn't possible yet, saying where you stand ("Going";
  a time is said once, in the status line), next to the `secondary` that helps ("Can't make it").
  `statusIcon` picks its glyph (`success` for "Going"). **Never a disabled primary.** Ignored when
  `primary` is set.
- `children`: replaces the buttons (a comment field on a post or thread).
- `inset={false}` inside a tab screen (the tab bar already clears the home indicator).
- Not absolute: put it **after** the ScrollView in a `flex: 1` column, and give the ScrollView
  `contentContainerStyle={PAGE_WITH_BAR}` (gutter, section gap, `SPACING.xl` at the bottom).
- A new primary label fades in over `MOTION.morph` (I'm going → Open). It tells the toast host its
  height, so toasts sit just above it.

```tsx
<View style={{ flex: 1 }}>
  <ScrollView contentContainerStyle={PAGE_WITH_BAR}>…</ScrollView>
  <ActionBar status="Going" statusIcon="success" secondary={{ label: "Can't make it", onPress: confirmLeave }} />
</View>
```

**`PhotoCard({ kind, photo?, fallback?, paint?, vehicle?, shape?, layerColour?, title, eyebrow?, live?, meta?, detail?, tag?, classLetter?, action?, onPress?, titleOnPhoto?, overlay?, aspect?, size?, finished?, accessibilityHint? })`**
— the browse card (replaces `EntityCard` on Tonight, the map sheet, search, Garage, profiles, the feed).
- `kind`: `'event' | 'build' | 'post' | 'place'`; sets the photo shape (`ASPECT`: 16:9, 4:3, 4:5).
- Picture: `photo`; else `fallback` (a node, e.g. a map snapshot); else for events and places the
  area-circle drawing (`AreaArt`) in `layerColour`, for builds the silhouette on the `paint` gradient
  (`PaintArt`, `vehicle` car/bike, `shape`). Never a grey box.
- Words: kind line (`live` adds the red dot and "Live ·"; `eyebrow` in the layer colour for events
  and places), `title` (2 lines, as typed), `meta` (one line of facts), `detail` (one quiet line:
  "Not open to your car"). `classLetter` puts the `ClassBadge` before a build's title. `tag` is one
  state (`{ label, tone }`) in the photo's top-left corner (the top right is for the ⓘ).
- `titleOnPhoto`: kind line, badge and title on the bottom gradient over the photo (builds, the
  Tonight peek card); meta stays below.
- `action`: `{ label, onPress, tier?: 'secondary' | 'primary', busy?, haptic? }`. Secondary by
  default; `tier: 'primary'` only for the Tonight map's pick card ("I'm going", the screen's one primary).
- `overlay`: absolute children over the photo (`<PhotoCredit overlay photoRef=… />`, a ✕).
- `size="sm"`: a row-shaped card (picture left) for the picked build in onboarding.
- Three type sizes per card: `tag` (kind, status), `title`, `meta`.

**`Hero({ photo?, media?, aspect?, eyebrow?, layerColour?, glyph?, live?, title, meta?, tag?, classLetter?, titleOnPhoto = true, overlay?, bleed?, children? })`**
— the top of every T3 detail screen, in a fixed order: picture → kind → title → meta → tag. Replaces `DetailHero`.
- `photo`: kind and title on the gradient over the photo in the `hero` type; meta lines below.
- `media`: any other picture (a map in a `MediaFrame`, `PaintArt`); the words go under it.
- Neither: words only (crew, zone).
- `meta`: one line ("Tonight 22:00–00:30 · Around Tamworth") or several (first in bold).
- `bleed`: runs the picture edge to edge when the Hero is the first thing in a `PAGE`-padded scroll view.

**`GoingStrip({ people, summary, onPress?, max = 6 })`** — who's going, one line: up to six
overlapping faces (`people`: `{ id?, name?, handle?, photo? }`, yours first), "+3" for the rest, the
`summary` from `goingSummary(going, cars, bikes)` ("9 going · 7 cars, 2 bikes"), a chevron when
`onPress` opens the Going list.

**`LocationLine({ state?, time?, minutesTo?, point?, town?, leadMinutes?, note?, done?, text? })`**
— the event page's status line, and the only place a countdown appears. Renders
`locationSentence()` (glossary.ts) for `state` `'notGoing' | 'hidden' | 'shown' | 'rolling' | 'host'`,
then one `note` sentence ("Check-in opens at 21:30."). `text` replaces the location sentence for the
states that aren't about location ("Cancelled by the host."). `done` swaps the pin for a green tick.

**`DateTimeSheet({ visible, title?, value, onChange, onClose, minDate?, maxDate?, days = 14, stepMinutes = 15, mode = 'datetime' | 'date', past?, now?, after? })`**
and **`DateTimeField({ label, hint?, value, onChange, placeholder?, …same options })`** — the one date
and time picker (host flow Starts/Ends, a dyno run's date, a track day). A sideways row of `days`
("Today / Fri 20", "Tomorrow / Sat 21", then "Sun / 22", …: the weekday is always on the chip;
`past` runs back from today), then "Another day" for the month calendar in the same sheet; for
`datetime` an hour grid (00–23) and minutes in `stepMinutes`. The day row opens scrolled to the
picked day. Every tap calls `onChange(Date)`; Done closes. `minDate`/`maxDate` grey out the rest.
`now` defaults to `appNow()`; on the demo clock the sheet says once which day "Today" is ("The demo
night is Fri 20 Nov…"). `after` (an end's start) makes an end in the small hours after it read
"01:00 (after midnight)" (4.10), never "Tonight 01:00". The field shows the value in the time wording
("Sun 10:00", "Today").

**`StepHeading({ step, of, title, hint? })`** — the one step indicator for a multi-step form
(onboarding, the host flow): "Step 1 of 4" small, the step's question in `titleLg`, an optional line.
The form's name is the caps header title ("GET STARTED", "HOST A MEET"); the step is never the header.

**`BuildLine({ letter, name, power })`** — a build said in a line (K3): `ClassBadge`, name, "230 bhp"
(`powerText(build)`). `ListRow`'s `build` prop draws it under a person's @handle.

**`Gradient({ colours?, to?, style? })`** — the one SVG gradient (default `COLOR.surface.photoFade`),
filling its parent. Used by PhotoCard, Hero and `PaintArt`.

**`PaintArt({ paint?, vehicle?, shape? })`**, **`AreaArt({ colour? })`** — the no-photo pictures, filling their parent.

### Added after Review 12

* **One selected look.** `chipFace(on)` and `chipText(on)` (Choice.tsx) are the only "selected"
  face for picks: Chip, ChoiceGroup (always chips now), the DateTimeSheet's day, hour and minute,
  and the month calendar. `SegmentedControl` (filled sodium) only switches the view below it.
* **No sodium on content.** `contentColour(colour, fallback)` (ds/logic.ts) turns the Events layer
  colour (sodium) into fog wherever a layer colour reaches content: `Hero` and `PhotoCard` kind
  lines, `EntityCard` eyebrow, accent and mark, `ListRow` pins. Map pins keep it. `Tag tone="selected"`
  is chalk; the unread dot (ListRow, Tabs) is red. `__tests__/accent.test.tsx` renders them with
  the Events colour and fails on any sodium; `designLint` limits sodium inside `ds/` to Button,
  Choice, DateField, SearchField, SwitchRow, Text, logic and PhotoCard's map stand-in, and
  `tone="brand"` to the wordmark, covers and motion moments.
* **Web scroll bars are hidden** (`ds/webScrollbars.web.ts`, loaded by the ds index), so nothing
  draws over hero photos, maps or cards on the web preview. Pages still scroll.
* **Field errors** sit in the field's one message slot (`Field error`), in place of its hint.
* **ActionBar status** ("Going") is a quiet line: a fog icon and fog text, no fill, so it never
  reads as a button. "Remind me at 21:30" is a `SwitchRow` under the status line, not a button.
* **Not found** (`NotFoundState`, `+not-found` uses it too): one `EmptyState` block with its glyph,
  at the top content position, the header back only, plus one primary "See tonight's meets". Never
  a "Go back" button in the body (4.2).
* **Area names** default to the nearest town (`areaNameNear`, src/lib/profile.ts, from
  `src/data/towns.ts` when there's no geocoder), never the region when a town is near.

### Changed in Redesign 2

| Component | Change | Callers |
|---|---|---|
| `HeaderActions`, `screenHeader()`, `ScreenHeader` | New `add: { label, onPress }` draws the "+" icon (before the bell). A text action written "+ New"/"+ Host" is drawn as "+" too (`plusShim`, a shim until screens pass `add`). `ScreenHeader` takes a `tag` after the title (DEMO NIGHT). Order: action (pushed screens), "+", bell, `···`. | Tonight, Community and Garage still pass `action: { label: '+ New' }`: switch to `add`. |
| `Section` | Eyebrow is fog, not sodium. | None. |
| `DsText` | Eyebrows default to fog. `tone="action"` is chalk (links); new `tone="brand"` (sodium) for the wordmark, covers and class-up only. | Screens using `tone="action"` for info turn chalk; use `brand` only for those three. |
| `Button` | `tertiary` is chalk (it reads `COLOR.action.link`). | None. |
| `ToastProvider` | Bottom by default: just above the `ActionBar` when one is showing, else above the tab bar. `placement="top"` keeps the old place (the driving view). `useToastAnchor()` is how ActionBar reports its height. | None. |
| `DetailHero` (Detail.tsx) | A shim over `Hero` (words only). `sample` is ignored. | B and D move detail screens to `Hero`. |
| `EntityCard` | Deprecated on browse surfaces (use `PhotoCard`); `sample` no longer draws a tag. | B, C, D. |
| `DateField` / `DateSheet` | Deprecated (use `DateTimeField` / `DateTimeSheet`); the calendar is now `MonthCalendar`, shared with `DateTimeSheet`. | C (EventForm), D (dyno form). |
| `StatBlock` | Sets are now build = bhp, Class, Mods; Me = Meets, Hosted, Trophies. | D. |
| `ConfirmSheet` / `ConfirmBody` | New `cancelLabel` ("Keep editing" for the discard confirm). Review 13: the only confirm in the app; `safeFirst` + `confirmLabel` for the owner's meet-ban warning ("Change location" / "Post anyway"); `onDismiss` for the scrim; `children` for a quiet line under the message. | Every confirm. A `Sheet` with a destructive button or `doneLabel="Cancel"` fails `__tests__/confirm.test.tsx`. |
| `ToastProvider` (Review 13) | 3.2 s for every toast (with or without Undo); one at a time; dismissed when the screen changes (`screenKey`, the root passes the route path; a toast raised within 400 ms of the change belongs to the new screen); never takes a tap: the pill is `pointerEvents="box-none"`, only its action (Undo, Change) is tappable. | The driving view has no ActionBar: to keep a toast clear of End, its bottom panel can report its height with `useToastAnchor()`. |
| `ToastProvider` + `ActionBar` (Review 14) | While a toast shows over an ActionBar (or a composer that is one), the bar keeps the toast's measured height free above itself (`useToastClearance()`), so the page above shrinks for 3.2 s and the toast never covers its last line (the message you just sent, the attendee row) at any text size. | None. |
| `SegmentedControl` (Review 15; replaces Review 14's two rows) | Always one row, like iOS: never a 2x2 block. Segments are as wide as their labels (SUSPENSION gets more room than LOOKS) with 6 pt either side. Labels grow with larger text only to 1.15x (`SEGMENT_MAX_TEXT`, as iOS caps its segmented controls; DsText now takes `maxFontSizeMultiplier`), and when they still don't fit, every label shrinks by the same factor (`segmentFit()`, down to 0.72) and never wraps or cuts off. | None. |
| `EmptyState inline` with `icon` (Review 15) | A search with no results: the glyph, "Nothing for ‘x’", one suggestion (`body`, or the link), then `note` as small secondary text. A platform note ("Full address search works in the iPhone app.") is only ever the `note`, never the only line. | Search. |
| `ScreenHeader` (Review 15) | Its row is `HEADER_ROW` tall (44 on iPhone, 64 on the web), the navigator's own header height, so Tonight's title, "+" and bell sit exactly where every other tab's do. | None. |
| `BuildLine` (Review 15) | The power keeps its number and unit together ("· 197 bhp" never breaks as "197 / bhp"). | None. |
| `MapPicker` (Review 15) | A T4 step (registered in `headerLint`): back, a caps title and **one** line of instruction; what's under the crosshair in a read-only card over the map; the one primary ("Set meet point here", "Add checkpoint") in the pinned `ActionBar`, with Done as its secondary on a drive. Undo is a link in the card. | None. |
| Driving view credit (Review 15) | `compactCredit()` (src/lib/mapCredit.ts): one short line, every holder once ("© OSM, OSRM"), the full line as its accessibility label. | None. |
| Web map credit (Review 14) | `webmap/Credit.web.tsx` shows the short form on one line ("© Stadia · OSM") in the corner of every web map, small or full screen, and the full credit on tap. It never wraps over the meet circle or a card. | None. |
| Tab bar labels (Review 14) | Keep their size at large text, as on iOS (`tabBarAllowFontScaling: false`), with 16 pt of room. | None. |
| `PhotoCard` (Review 13) | A narrow card (`narrowCard`: under 220 pt of room at the current text size, e.g. the vote grid) puts the ClassBadge on the kind line and the title in `titleSm` over three lines, so a name wraps by words at 1.3x, never cut mid-word. `titleOnPhoto` only puts words on a real photo (or a `fallback` snapshot): on the drawn silhouette they go under it. | X's vote cards and Z's Me get it for free. |
| `Hero`, `BuildLine`, `Sheet` title (Review 13) | Hero's title on a photo is three lines at most; BuildLine and a Sheet's title wrap to two lines. The status tag (Going, Hosting, Checked in) has one place in Hero and PhotoCard (K3): top left of the picture, on glass; with no picture, first on the kind line. The top right stays free for ⓘ. | — |
| `Icon` | New `pin`, `calendar`, `share`. | — |
| `Tabs` | Not in the rulebook any more: one `SegmentedControl` switches the view (4.4). Kept until Community moves over. | D. |

### Everything else

| Component | Use for | Rules |
|---|---|---|
| `DsText` | All text | `v` is a type token, `tone` a role. No free colour or size. |
| `Button` | Actions | Tiers `primary` (one per screen, in the ActionBar on T3/T4), `secondary`, `tertiary` (text link, chalk), `destructive` (removes, leaves, declines). Sizes `sm 44`, `md 48`, `lg 56`. `busy` keeps the label. Destructive buzzes `warning`; pass `haptic="success"` on save and send. `disabled` + `hint` stays for form fields that need input first, never for a screen's primary. |
| `IconButton` | Header icons, map chrome | Always has a label. `glass` floats over the map and buzzes `tap`. |
| `Section` | Titled blocks | Fog eyebrow and hairline. `right` is a tertiary Button or a Tag, never a value. No colour prop. |
| `EventRow` (components/EventRow.tsx, Review 16) | An event as a row on Tonight's list, Search and Me | The one row: layer pin, title, "Meet · Sun 10:00 · about 1 mi from home" (kind, `cardTime`, `cardDistance`), "Not open to your car" when it isn't, the status tag. Never a hand-made event ListRow. |
| `ListRow` | Any list of people, builds, events, places, settings | `leading` is `{avatar}`, `{pin}`, `{classBadge}` or `{icon}`; title as typed; `subtitle` (or `build`: a person's `BuildLine`); `meta`; `trailing` (Tag, value or small Button); chevron when it opens something; `unread` dot. 56 tall with a mark, 44 without. |
| `Avatar` | A person | Photo, or initials in chalk on kerb. `sm 28`, `md 40`, `lg 76`. Never a class badge, never sodium. |
| `ClassBadge` | A build's class | Skewed tile in its metal. Never stands in for a person. A tap opens one line (`CLASS_EXPLAINER`) in a Sheet. |
| `BuildThumb` | A build's picture in a row | Photo or silhouette, 4:3. |
| `Tag` | A state | `neutral, success, warning, danger, info, live, selected`. Caps, outline. `raw` for names. Green (`success`) only for done: Going, Checked in, ✓ Dyno. |
| `Chip` / `ChipGroup` | Filters: many of many | Off: outline. On: tint, sodium border, bold sodium text (`chipFace(on)` / `chipText(on)`: the one selected look, also used by ChoiceGroup, the DateTimeSheet's days, hours and minutes and the month calendar). **Nothing on = no filter.** |
| `SegmentedControl` | 2–4 exclusive options that switch the view below | One per screen, never nested. Counts allowed. |
| `ChoiceGroup` | One of many in a form or setting | Always the Chip face with `role="radio"` (never a SegmentedControl, Review 12): `pills` wrap in a row, `list` stacks them with a hint each. |
| `EmptyState` | Nothing here | `block`: glyph, one line, one primary (whole screen). `inline`: one line, optional link (a section). |
| `LoadingState` | Waiting | `rows` for lists, `inline` spinner. Buttons use `busy`. |
| `ErrorState` | It failed | Under the thing that failed. Copy starts "Couldn't". Never a toast. |
| `Sheet` / `SheetOption` | Pick, the `···` menu, vote, filters | Closes with **Done** (or its action). Never **Cancel**, and never a confirm: that's `ConfirmSheet`. Never on top of another sheet. A sheet's primary goes **last**: an `<ActionBar primary=… />` or a block primary `Button`. The Sheet pins it under the scroll so it is always fully visible at 375x667 (an ActionBar inside a Sheet draws flat, no inset). |
| `ConfirmSheet` | Every confirm: before something that can't be undone; leaving a form with changes; the meet-ban warning | The only confirm (4.5). No header Done or Cancel: two buttons in the body. Leaving a form with changes: "Discard it" / "Keep editing". Every other destructive confirm: "{Verb} it" / "Keep it", unless the verb is ambiguous (then both outcomes in plain words: "Yes, I can't go" / "I'm still going"). The meet-ban warning (owner 9.3) alone puts the way back first: "Change location" (primary) / "Post anyway". |
| `SearchField` | Search | One per surface. `onOpen` makes it the read-only map pill. The magnifier says "search", so the words never do: a leading "Search " is dropped from the placeholder ("Meets, places…"). No browser focus ring on web: the pill's border shows focus. |
| `SwitchRow` | A setting that's on or off | Label, hint, switch; sodium track when on. |
| `Field` / `TextField` / `INPUT` | Form fields | Caps label above, then one message slot: `error` (red) in place of the `hint`, never both. 48 tall. `DateTimeField` takes `error` too. |
| `Card` | A plain block (a form group, facts) | Flat, hairline. Browse items are `PhotoCard`. |
| `StatBlock` | 2–4 numbers | build = bhp, Class, Mods; Me = Meets, Hosted, Trophies. No sodium numbers. |
| `ToastProvider` / `useToast` | Every done action | One line, 3.2 s, one at a time, above the ActionBar or tab bar; "Undo" on leave and remove. Gone when the screen changes. Never takes a tap (only its Undo does). A floating pill on `kerbHi` with `ELEVATION.toast`, so it never reads as a card in the page. |

Pure helpers in `ds/logic.ts` (tested in `__tests__/designSystem.test.ts`): `initials`, `displayHandle`,
`toggleSelection`, `normaliseSelection`, `passesFilter`, `selectionSummary`, `segmentLabel`, `metaLine`,
`entityA11yLabel`, `statA11yLabel`, `toastDuration`, `rgba`, `stripFaces`, `shortDay`, `shortDate`,
`afterMidnightLabel`.

---

## Screen templates

Every screen is one of five. A screen that doesn't fit one is a bug. `__tests__/headerLint.test.ts`
holds the route → template map and checks the root layout against it (a new route must be added).

| Template | Header | Body | Primary action |
|---|---|---|---|
| **T1 Tab** | Tab header (4.1) | Sections of `PhotoCard`s or `ListRow`s | Header "+" only |
| **T2 Map** | Tab header + search pill + Map/List | Map with one MapSheet | In the sheet's top card |
| **T3 Detail** | Back, optional Share, `···` | `Hero` → facts → sections | `ActionBar` pinned to the bottom |
| **T4 Form / wizard** | Back (asks before losing work), caps title (the form's name) | `StepHeading` ("Step 2 of 4", the question), then fields | `ActionBar` pinned to the bottom |
| **T5 List of settings** | Back + caps title | Groups of `ListRow` / `SwitchRow` | None |

---

## Rulebook

Short and absolute (REDESIGN-2 section 4, with the owner's decisions in section 9). It replaces the
old "One way to do X" and "Added after Review N" lists.

### 4.1 Headers
* Every tab header: caps title on the left; on the right "+" (only Tonight, Community, Garage) then
  the bell. Always this order. Never a text action ("+ New", "+ Host") in a tab header.
* Every pushed screen: back on the left; on the right at most one text action (Share) and `···`.
* Detail screens have no header title. Forms and settings have a caps title (`title()` in glossary.ts).

### 4.2 Back
* Always the root layout's back `IconButton` at the top left ("Go back"). Never a back button in
  the body; no screen sets `headerLeft` or types "‹" or "←".
* With no history, back goes to the tab that owns the screen (`fallbackTab`).
* Back from a form with changes always asks first (`ConfirmSheet`: "Discard it" / "Keep editing").

### 4.3 Buttons
* One primary per screen. On T3 and T4 it lives in the `ActionBar`, always visible at 375x667.
* At most one secondary next to it. Everything else goes in `···`.
* Never a disabled primary: the ActionBar shows a `status` pill and a helpful secondary.
* Destructive actions live only in `···` or a `ConfirmSheet`.
* Cards never carry a primary (one exception: the Tonight map's pick card); at most one secondary.

### 4.4 Selectors
* Switch the view below: `SegmentedControl`, 2 to 4 options, one per screen, never nested.
* One of many in a form or setting: `ChoiceGroup` (pills up to 5 options, list beyond).
* Many of many (filters): `ChipGroup`. Nothing picked means everything.
* A date or time: `DateTimeSheet` / `DateTimeField`, everywhere. Never a typed date.
* A make or model: `SearchField` with results. Never a dropdown.

### 4.5 Sheets vs pushes
* Read something: push. Create or edit: a modal route (T4). Pick from options, confirm, the `···`
  menu, vote, filters: a `Sheet`.
* Never a sheet on a sheet, never a modal on a modal. A Sheet closes with Done (or its action).
* **One confirm pattern (Review 13):** `ConfirmSheet` is the only confirm, with no header Cancel or
  Done. Leaving a form with changes: "Discard it" / "Keep editing". Every other destructive confirm:
  "{Verb} it" / "Keep it" ("Remove it" / "Keep it"), unless the verb is ambiguous; then say both
  outcomes in plain words (leaving a meet: "Yes, I can't go" / "I'm still going", glossary
  `LEAVE_MEET`, through `confirmLabels(verb, explicit)`). The one exception is the owner's meet-ban
  warning (9.3): "Change location" (primary, first) / "Post anyway".

### 4.6 Empty states
* Whole screen empty: `EmptyState block` (glyph, one line, one primary).
* A section empty: `EmptyState inline` (one line, optional link). Never "Nothing yet" alone, never a
  developer or demo note.
* No search results: `EmptyState inline` with `icon="search"`: "Nothing for ‘x’" and one
  suggestion. No platform note (Review 16).

### 4.7 Toasts
* Every done action gets one: going, checked in, voted, posted, saved, sent, request sent.
* One line, 3.2 s (with or without Undo), one at a time, above the ActionBar or tab bar, never over
  the primary.
* Gone when the screen changes: a toast never follows you to the next screen (Review 13).
* Never takes a tap: touches go through to what's under it; only its Undo is tappable.
* "Undo" on leave and remove. Never an error in a toast.

### 4.8 Badges
* A number badge only for things waiting for you: unread messages plus requests (Community tab) and
  unread notices (the bell). One badge per thing, in one place.
* Badges are `COLOR.badge` (red), never sodium. The demo starts with zero badges.

### 4.9 Numbers and units (`src/lib/format.ts`)
* Distance: `distanceText(miles, from)`: "2 mi" (from you), "2 mi from home", "about 6 mi" (a hidden
  meet), "under 1 mi". Never "from the map's centre". Whole miles, rounded to the nearest mile.
* **Distance to a meet: one rule, one function (Review 11).** Every screen (Tonight map card and list,
  the event page, Search, lists) uses `meetDistance(event, distanceOrigin(here, home), pointHidden)`.
  It measures from **one origin** (your GPS fix while location is on, else your home) to the
  meet's **area centre** (public, never the meet point), so the number is the same before and after
  you go and on every screen. "2 mi" / "2 mi from home"; while the meet point is hidden to you,
  "about 2 mi" / "about 2 mi from home". Places use the same origin and rounding.
* Power: "197 bhp" plus the "✓ Dyno" tag when proven. whp, bhp per tonne and "claimed" only on the
  Power and dyno page. Always from `bhpText()` (format.ts, via `powerText` and `bhpLine`): a
  no-break space keeps the number and "bhp" on one line at any text size (Review 16).
* Counts: always `plural()`: "9 going", "1 person", "3 mods". Going mix: `goingSummary()` →
  "9 going · 7 cars, 2 bikes". No class codes.
* Money: "£450". Numbers in stats and meta lines use tabular figures. No sodium numbers.

### 4.10 Time (`src/lib/when.ts`)
* 24-hour clock: `clock()` → "21:30".
* `whenLabel(d, now)`: "Today 14:00" (before 17:00), "Tonight 22:00" (from 17:00, and the small
  hours after it: "Tonight 01:00"), "Tomorrow 20:00", "Sat 10:00" (within 6 days), "Sat 28 Nov, 10:00".
* An **end** next to its start: in the small hours after it, "01:00 (after midnight)"
  (`afterMidnightLabel`, ds/logic.ts; `DateTimeField after={start}`).
* `liveLabel(end)` → "Live · until 23:00". `endedLabel(end, now)` → "Ended 23:00" / "Ended Fri".
  `eventTimeLabel(start, end, now)` picks one of the three, and is the one time on every card and
  row (`cardTime`) and the event page: a live event is "Live · until 23:00" everywhere (Review 16).
  `timeRange()` → "Tonight 22:00–00:30".
* Relative only under 60 minutes, in brackets after a clock time: `clockWithCountdown()` →
  "21:30 (in 20 min)". One countdown per screen (the `LocationLine`). Never "In 2 days", "Next week",
  "2h 40m", or a countdown on a card.
* `formatWhen()` (format.ts) now uses `whenLabel`.

### 4.11 Location (`src/lib/glossary.ts`)
* The place is the **meet point**; before it shows, the meet is `aroundArea('Tamworth')` → "Around Tamworth".
* `locationSentence()` / `LocationLine`: "Location shows at 21:30 to people going." · "Location
  shows at 21:30 (in 20 min)." · "Leisure park car park, Tamworth." · "Now at {name}. Next location
  when the host moves on." · host: "People going see it at 21:30 (1 h before)."
* Never: stop, unlock(s), unlocked, locked, padlock, rough area, Sample area, reveal.

### 4.12 Words that never appear on a first-level screen
stop, unlock, locked, rough area, Sample area, Sample (as a tag), whp, bhp/tonne, car scale, claimed,
invited, you can go, Find, Where to?, + Host, Count it without directions. **Rep, level and Legend**
only on Me's one line and its ladder sheet (and the "+150 rep" moment after check-in), per the
owner's decision. The list is `BANNED_WORDS` in glossary.ts; `__tests__/glossary.test.ts` scans every
string in `src/app` and `src/components` (a ratchet: the files still being moved over are listed;
anything new fails). Other fixed words: `NOT_OPEN` ("Not open to your car"), `DEMO_NIGHT` (the tag
and its sheet), `CLASS_EXPLAINER`. `roleLabel('invited')` is now empty.

---

## Look rules (REDESIGN-2 section 5)

* **Photo-led.** Browse surfaces use `PhotoCard`; detail screens start with `Hero`. Every event gets a
  picture (host's build photo → first post photo → map snapshot / `AreaArt`); builds without a photo
  use the paint gradient. Credits only through the ⓘ (`PhotoCredit overlay`).
* **Type.** Per screen one `hero` or `titleLg`, then `title` for cards, `body`/`secondary` for text,
  `meta` for facts. At most three type sizes per card. Capitals only for chrome (header, eyebrow,
  button, tag, segment); at most one eyebrow per section, none inside cards except the kind line.
  The italic display face: wordmark, trophy covers and the class-up moment only.
* **Spacing.** Gutter `SPACING.screen` (16), between sections `SPACING.section` (24), inside a card
  `SPACING.md` (12); rows touch with a hairline; cards `SPACING.md` apart. Scroll views above an
  ActionBar end with `SPACING.xl` (`PAGE_WITH_BAR`).
* **One accent.** Sodium is the one primary button and "selected" (segment, chip, tab). Not links
  (chalk + chevron), not eyebrows (fog), not avatars, badges or numbers. Red (`state.liveDot`) means
  "now": the live dot and badges. Green (`state.success`) only for done. Layer colours only on pins
  and the kind line of an event or place. `__tests__/designLint.test.ts` fails on new raw sodium
  outside the design system.
* **Motion: four celebrations.** I'm going (button → Going tag over `MOTION.morph`, your face into
  the `GoingStrip`, haptic, toast); location shows (`UnlockReveal`); check in (`CheckInMark` /
  `CheckInCelebration`); trophy won (`RevealIn` on the cover). Plus `FadeUp` on every list's first
  render (`MOTION.stagger`, 30 ms), one sheet slide, one toast. Reduced motion: a `MOTION.fast` fade.

---

## The app clock (`src/lib/appClock.ts`)

Every "now" the app shows or decides on comes from `appNow()`, never `new Date()`. The demo runs a
virtual clock (a scripted Friday night): the real clock plus an offset.

| Call | Does |
|---|---|
| `appNow()` / `appNowMs()` | Now on the app's clock. |
| `setClockOffset(ms)` / `clockOffset()` | Shift from real time (0 = real). |
| `setClockTo(date)` | Make the app's clock read `date` now. `setClockTo(weekdayAt(new Date(), 5, 21, 10))` is "this Friday 21:10". |
| `onClockChange(fn)` | Listen for offset changes (returns the unsubscribe). |

The offset lives in memory; the demo's owner (WP-B, `demoTime.ts`) sets it on start-up and persists
what it needs. Each package replaces `new Date()` with `appNow()` in its own files; `ClockProvider`
(clock.tsx, WP-B) should tick from `appNow()` and re-render on `onClockChange`.

---

## Do and don't

| Do | Don't |
|---|---|
| `<ActionBar status="Going" statusIcon="success" secondary={{ label: "Can't make it", onPress }} />` | `<Button label="Navigate" disabled hint="Location shows at 21:30" />` |
| `<PhotoCard kind="event" photo={p} eyebrow="Meet" layerColour={COLOR.layer.event} title=… meta=… />` | An `EntityCard` with a grey silhouette on a browse surface |
| `<LocationLine state="hidden" time="21:30" minutesTo={20} />` | "Stop unlocks in 20 min", or a countdown on a card |
| `whenLabel(start, appNow())` | `new Date()`, "In 2 days", "2h 40m" |
| `screenHeader({ title: 'Garage', add: { label: 'Add a car or bike', onPress }, bell: true })` | `action: { label: '+ New' }` |
| `<DateTimeField label="Starts" value={start} onChange={setStart} minDate={appNow()} />` | `placeholder="YYYY-MM-DD"` |
| `<ListRow leading={{ avatar: user }} title="@sam_p" subtitle="Golf R · Class A" />` | `<ClassBadge letter="A" />` as a person's picture |
| `<ChipGroup selected={[]} … />` meaning "all" | Every chip pre-selected |
| `toast({ message: 'Saved' })` | Green body text that says "Saved" and stays |
| `gap: SPACING.md`, `borderRadius: RADII.card` | `gap: 14`, `borderRadius: 10`, a hex colour |

---

## Detail screens

`src/components/Detail.tsx` keeps the pieces that aren't in the design system yet: `MediaFrame` (a
map or media inside a page), `Callout` (a tinted message with its tone's icon), `CheckInCelebration`
(the burst and a success buzz, the same on events, photo spots and drive finishes), `NotFoundState`,
`PAGE` (page padding) and `PAGE_WITH_BAR`. `DetailHero` is a shim over `Hero`.

Order on every detail page (REDESIGN-2 3.5): `Hero` → `LocationLine` (status) → `GoingStrip` →
media → Sections → `ActionBar`. The event page's primary still comes from `eventPrimary()`
(`src/lib/eventAction.ts`, WP-B).

## For packages B, C and D

* Code against the APIs above; nothing needs stubbing once WP-A is on main.
* Tab headers: pass `add` instead of `action: { label: '+ New' }` (the shim draws "+" meanwhile).
* Replace `EntityCard` with `PhotoCard`, `DetailHero` with `Hero`, `DateField` with `DateTimeField`,
  in-body primaries with `ActionBar`, and `new Date()` with `appNow()` in your files.
* `NoticeBell` (WP-B): its badge should use `COLOR.badge` and the bell chalk (it uses `BRAND` today).
* Words: use `whenLabel`/`eventTimeLabel`, `locationSentence`/`LocationLine`, `distanceText`,
  `goingSummary`, `NOT_OPEN`, `DEMO_NIGHT`, `CLASS_EXPLAINER`. When you clear a banned word or raw
  sodium from a file, say so in your PR: WP-A trims the ratchet lists in its tests.
* `DsText tone="action"` is chalk now: if you meant the brand colour (rare), it's `tone="brand"`.

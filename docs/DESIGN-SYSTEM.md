# Design system v2

The foundation proposed in `docs/REVIEW-6-design.md` §8. Tokens live in `src/theme.ts`, components in
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
| `TYPE_SCALE` | `display, heading, titleLg, title, body, bodyStrong, secondary, caption, meta, label, eyebrow, button(Sm/Lg), tag, input, stat` | Each has family, size, line height, case and a text-size cap. Use through `DsText v=…` or `typeStyle()`. |
| `ELEVATION` | `flat`, `float`, `sheet` | Only floating chrome (map buttons, toasts, a card over the map) and sheets cast a shadow. Cards on the page are flat with a border. |
| `COLOR` | roles below | Pick by role, never by hue. |
| `tint / line / outline` | `1f`, `40`, `99` alpha | The only three alphas. |
| `ART` | sign white/red/black, ink, shadow, body, mapBg, mapGrid, cameraDim, black | Fixed colours for drawings only (the UK speed sign, ink inside pins and icons, build art, the web map). Never text, surfaces or controls. |
| `PRESS` | `control` opacity 0.8; `card` 0.9 + scale 0.98 | Via `Press`, never by hand. |
| `MOTION` | `fast 150, base 220, sheet 280, toast 3200` ms | Reduced motion: movement becomes a `fast` fade. |
| `HIT` | 44 | Minimum tap target. |

**Colour roles (`COLOR`)**

| Role | Keys | Means |
|---|---|---|
| `action` | `primary, onPrimary, link, selected, selectedTint, disabledBorder, destructive` | Sodium = "you can tap this" or "this is on". Nothing else. |
| `text` | `primary, secondary, emphasis, info, onAction, disabled` | `emphasis` (chalk) and `info` (blue-grey) replace sodium on info lines like "you can go". |
| `surface` | `bg, card, raised, raisedHi, media, glass, glassRaised, sheet, scrim, border, borderStrong, skeleton` | `media` is the one colour behind photos and build art. `scrim` is the one dim layer. `sheet` is the map sheet, solid. |
| `state` | `live, liveDot, success, warning, danger, info` | States only, never a layer colour. |
| `classMetal` | `S A B C D` | Only on `ClassBadge`. |
| `layer` | `event, show, trackday, photo, drive, track, venue, shop, partner, camera, road, post` | Map and place identity: pins, the layers panel, an entity's kind eyebrow and accent bar. Never on chips, section titles or buttons. |
| `avatar` | `bg, fg, border` | Chalk on kerb. A person isn't an action. |
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
are unchanged (`COLOR` reads from them). `RADIUS` and `SPACE` are marked deprecated:
`RADIUS.card` (8) is `RADII.control`, `RADIUS.sheet` (12) is `RADII.card`; `SPACE.section` (20) is off
the scale (v2 uses 24). No screen uses `RADIUS` or `SPACE` any more.

---

## Components (`src/components/ds`)

Every pressable goes through `Press`: one pressed state and haptics by rule, so screens never call
`feel` directly. Every component has a role and a label, and animated ones respect reduced motion.

| Component | Use for | Rules |
|---|---|---|
| `DsText` | All text | `v` is a type token, `tone` a role. No free colour or size. |
| `Button` | Actions | Tiers `primary` (one per screen or region), `secondary`, `tertiary` (text link), `destructive` (removes, leaves, declines). Sizes `sm 44`, `md 48`, `lg 56`. Disabled keeps its shape and shows `hint` ("Write something first"). `busy` keeps the label. Destructive buzzes `warning`; pass `haptic="success"` on save and send. |
| `IconButton` | Header icons, map chrome | Always has a label. `glass` floats over the map and buzzes `tap`. |
| `ScreenHeader` / `screenHeader()` | Every screen header | Caps title, at most one text action, the bell, a `···` menu. `screenHeader()` returns native-stack options; `ScreenHeader` is the in-page version. Detail screens: no title, a menu. Chat titles pass `content: true` (sentence case). |
| `Section` | Titled blocks | Sodium eyebrow and hairline. `right` is a tertiary Button or a Tag, never a value. No colour prop. |
| `ListRow` | Any list of people, builds, events, places, settings | `leading` is `{avatar}`, `{pin}`, `{classBadge}` or `{icon}`; title as typed; `subtitle`; `meta` (one line of facts); `trailing` (Tag, value or small Button); chevron when it opens something; `unread` dot. 56 tall with a mark, 44 without. A trailing Button only on a row without `onPress`. |
| `EntityCard` | Browse surfaces (Events, Find, the map sheet, People, a crew) | One anatomy: media → mark + kind eyebrow + Sample + one status tag → title (2 lines) → meta → detail → up to 3 chips → one secondary action. Accent bar = layer colour, events and places only. `finished` for past or cancelled. |
| `Avatar` | A person | Photo, or initials in chalk on kerb. `sm 28`, `md 40`, `lg 76`. Never a class badge, never sodium. Decorative unless given `label`. |
| `ClassBadge` | A build's class | Skewed tile in its metal. Never stands in for a person. |
| `BuildThumb` | A build's picture | Photo or silhouette, 4:3. Separate from `Avatar`. |
| `Tag` | A state | `neutral, success, warning, danger, info, live, selected`. Caps, outline. `raw` for names. |
| `Chip` / `ChipGroup` | Filters: many of many | The one pill face. Off: outline. On: tint, sodium border, bold sodium text. No tick, no radio dot. **Nothing on = no filter**, and all on collapses to nothing on (`normaliseSelection`). `Clear` appears once anything is on. Buzzes `select`. |
| `SegmentedControl` | 2–4 exclusive options: a view switch or a short setting | Counts allowed ("Mine 3"). Buzzes `select`. A second level under `Tabs` (Community › People: Near you / Connections). |
| `ChoiceGroup` | One of many in settings and forms | 2–4 short options (≤14 characters, no hints) render as a `SegmentedControl`; more become chips in the one `Chip` face (`role="radio"`); `list` stacks those chips full width with a hint under each. No radio dots. |
| `Tabs` | The top level of a screen (Community; a picker's categories) | Caps labels on the page with a sodium underline under the current tab and a hairline under the row; scrolls sideways. Never stacked on another `Tabs`. |
| `DateField` / `DateSheet` | Picking a day | The one date picker: a month calendar in a Sheet (Monday first, `min`/`max` grey out the rest). The host flow (today to 60 days ahead) and the dyno form (a past day) both use it. Never a typed `YYYY-MM-DD`, never a long list of days. |
| `EmptyState` | Nothing here | `inline`: one muted line and a link, inside a Section. `block`: glyph, title, line, one primary. |
| `LoadingState` | Waiting | `rows`: 3 skeleton rows (lists). `inline`: spinner and a short line. Buttons use `busy`, not this. |
| `ErrorState` | It failed | `inline`: red caption and Retry under the thing that failed. `block`: icon, title, line, Try again. Copy starts "Couldn't". |
| `Sheet` / `SheetOption` | Pick from options, the `···` menu, map layers, your nav icon | Bottom, grabber, title, Done. Slides; fades with reduced motion. Tap the scrim to close. Reaches the screen bottom (the panel pads the home-indicator inset), stays under the status bar, rides above the keyboard on iOS; a tall one scrolls inside, never off screen. |
| `ConfirmSheet` | Before something that can't be undone | "{Verb} it" (red if destructive) and "Keep it", in a Sheet. |
| `SearchField` | Search | Icon left, spinner or clear right, 48 tall, pill. `onOpen` makes it a read-only button (the map pill). |
| `SwitchRow` | A setting that's on or off | Label as typed, a hint under it, the switch on the right; 56 tall; sodium track when on; buzzes `select`. Replaces `ToggleRow` and the hand-rolled rows. |
| `Field` / `TextField` / `INPUT` | Form fields | Caps label above, hint below; the input look (input type, strong border, control radius, 48 tall). `multilineHeight` for notes. |
| `Card` | A plain block on the page (a form, a group of facts) | Card surface, hairline, card radius, no shadow, no accent bar. `raised` inside another card. Browse items are `EntityCard`, not this. |
| `StatBlock` | 2–4 numbers | Fixed sets: build = bhp, bhp/tonne, mods; event = starts/ends in, going, stop n of m; person = builds, events, rep. No sodium numbers. |
| `ToastProvider` / `useToast` | "Saved", "Request sent", "Left · Undo" | Top, just under the header (never over a screen's main buttons), one at a time, read out, buzzes `success` (or `warning`). Not for errors. Needs a `ToastProvider` at the root when screens migrate (the gallery has its own). |

Pure helpers in `ds/logic.ts` (tested in `__tests__/designSystem.test.ts`): `initials`, `displayHandle`,
`toggleSelection`, `normaliseSelection`, `passesFilter`, `selectionSummary`, `segmentLabel`, `metaLine`,
`entityA11yLabel`, `statA11yLabel`, `toastDuration`.

---

## One way to do X

1. **A person** is `Avatar` + `@handle`, leading. "You" for yourself. A class badge is never a face.
2. **A build** is `ClassBadge` + "Make Model" as typed + meta "583 bhp · 4 mods". Stats are always bhp, bhp/tonne, mods.
3. **In a list** it's `ListRow`. **On a browse surface** it's `EntityCard`. No third way.
4. **A detail screen** is a hero in a fixed order (kind → title → meta → tags → media → stats → primary → secondary), then `Section`s. (`Hero` is the next component to build.)
5. **Content is never uppercased.** Capitals are for chrome.
6. **One primary per screen** (or per sheet). At most two full-width buttons in a block; the rest go in the `···` Sheet. Cards never carry a primary.
7. **Places: Navigate is primary. Events: going or check-in is primary,** Navigate secondary.
8. **Many of many is `Chip`. One of 2–4 is `SegmentedControl`; one of more is `ChoiceGroup` (the same chip face). A screen's top level is `Tabs`. A day is `DateField`.**
9. **Filters start empty and empty means everything.** Never pre-select every chip.
10. **Status is a `Tag`; an error is `ErrorState`; a done thing is a toast.** Accent bars are layer identity only.
11. **Sodium means "tap this" or "on".** Not info lines, not people, not levels, not stats.
12. **Empty is `EmptyState`. Loading is skeleton rows for lists, `busy` for buttons.**
13. **Pick in a `Sheet`; create or edit in a modal route; read in a pushed screen.**
14. **Search is `SearchField`,** one per surface.
15. **Every header: title, at most one action, the bell, a `···` menu.**
16. **Haptics come from components:** `select` on chips, segments, choices and likes; `success` on saved, sent, checked in; `warning` on destructive; `tap` on map chrome only.
17. **Motion:** one sheet animation, one toast animation, skeletons breathe; with reduced motion all of it becomes a short fade or holds still.
18. **No literals** for colour, size, radius or spacing in new code. If a token is missing, add a token.
19. **Every route is declared in `_layout.tsx` inside a guard** (the gallery is the exception: dev only, redirects in release).

---

### Added after Review 7 (18 Nov 2026)

20. **Closing words.** A Sheet closes with **Done** (nothing is lost). **Cancel** only where you'd lose
    what you started: a form, a map picker, a crop. Both are sodium text, never a boxed button.
21. **Create is "+ New"** on every tab header (Tonight, Community, Garage); what you can make is in the
    sheet it opens. Detail screens have a `···` menu, yours or someone else's (Edit is in yours).
22. **Chips and choice pills share one face:** body text as typed, outline off, tint and border on.
    (Review 10: no tick and no radio dot either; on is bold sodium text.) Never uppercase chip labels.
23. **The italic display face is the wordmark, covers and class-up only.** Every page title is upright.
24. **Distances say where from:** "from you" (a GPS fix) or "from home". A hidden event's distance is
    "about N mi" (to its area), so it doesn't jump when the meet point shows.
25. **Large text:** `StatBlock` tiles and `SegmentedControl` measure their labels and wrap to a second row
    rather than cut a word ("MESSAGE…", "CHECKPOINT/S"). Meta lines in rows and cards get two lines.
26. **Words** for events come from `glossary.ts`: meet point, "Location shows at 21:30", "Shown to people going".

### Added after Review 9 (18 Nov 2026)

27. **One back button.** The root layout draws the DS `IconButton icon="back"` ("Go back") on every
    pushed screen, with history or without; no screen sets `headerLeft` or types "‹" or "←".
    `__tests__/headerLint.test.ts` checks it.
28. **One tab header.** Every tab: caps title, "+ New" where you can make something, the bell.
    Community, Garage and Me use `screenHeader()`; Tonight draws `ScreenHeader` above its search.
29. **Invites: nothing picked is everyone.** No "Public" switch. With no vehicle, class, mod or brand
    picked, the event is saved as open to anyone (`everyone`), and reads "Anyone within 25 mi".
    "You can go" shows only on a limited invite.
30. **Photo credits are an ⓘ** in a corner of the photo (`PhotoCredit overlay`), opening the author,
    licence and the Commons link in a Sheet. Never credit text over a picture.
31. **One ladder for people:** rep points move you up named levels ("Level 3 · Known face"; Legend
    is the top). Class is the build's; trophies are a build's on the night.
33. **Dyno proven** is the DS `Tag` (success) reading "✓ Dyno" next to a build's power wherever it
    shows (`DynoBadge`): tap it for the run. "Dyno 2023" in neutral for a run over two years old.
    Wheel figures read "whp". No badge means a claimed figure, said as "Power · claimed" on the
    build page only.
32. **Tonight's map starts with Events only.** Other layers stay in the layers sheet, off until
    turned on; speed cameras and road reports are the drive view's only.

### Added after Review 10 (18 Nov 2026)

34. **One set of selectors.** `Chip`/`ChipGroup` for many-of-many filters; `SegmentedControl` for 2–4
    exclusive options; `ChoiceGroup` (chip face) for more; `Tabs` for a screen's top level, which look
    like tabs (underline), never like the controls under them. Two `Tabs` rows never stack: the second
    level is a `SegmentedControl`. The radio-dot pill and the tick chip are gone.
35. **One date picker**, `DateField` (or `DateSheet` behind a "Pick a date" button): host flow and dyno form.
36. **Toasts sit at the top**, under the header, so they never cover a screen's primary or Navigate.
37. **One power figure.** A build's headline power is bhp at the crank ("est." when worked out from a
    wheels run), with whp as a secondary line when there's a wheels run. bhp/tonne comes from the
    same figure and says so.

## Do and don't

| Do | Don't |
|---|---|
| `<ListRow leading={{ avatar: user }} title="@sam_p" subtitle="Golf R · Class A" />` | `<ClassBadge letter="A" />` next to a handle as the person's picture |
| `<EntityCard kind="event" layerColour={COLOR.layer.event} title="NightRunners late one" />` | `<Txt v="h3">` (caps) for an event title on one screen and sentence case on another |
| `<ChipGroup selected={[]} … />` meaning "all" | Both Cars and Bikes pre-selected, so tapping Cars turns cars off |
| `<SegmentedControl options={…} />` for Near you / Connections | A row of `Chip`s with `on={x === k}` |
| `<Button tier="primary" disabled hint="Write something first" />` | A grey box with no reason |
| `<DsText v="meta">about 1 mi from home · you can go</DsText>` | Sodium text for information |
| `gap: SPACING.md`, `borderRadius: RADII.card` | `gap: 14`, `borderRadius: 10` |
| `<Sheet title="Event options">` with Share, Edit, Can't make it | Six stacked full-width buttons |
| `toast({ message: 'Saved' })` | Green body text that says "Saved" and stays forever |

---

## Detail screens (events, places, shops, zones, crews)

`src/components/Detail.tsx` holds the detail anatomy until the design system's own `Hero`, `Field` and
`Notice` land: `DetailHero` (kind eyebrow in the layer colour, title, meta lines, one status tag),
`MediaFrame` (map or photo), `Callout` (a tinted message with its tone's icon), `CheckInCelebration`
(the burst and a success buzz, the same on events and photo spots), `Field`, `TextField` and
`NotFoundState`. Order on every detail page: hero → `StatBlock` → one primary → media → Sections →
everything else in the `···` Sheet. The event page's primary comes from `eventPrimary()`
(`src/lib/eventAction.ts`): I'm going (with your build) → Navigate → Check in → Vote.

## Next (after sign-off)

`Hero`, `Field` and `Notice` (§8.1 of the review), then migrate screens in the review's build order,
add the ESLint `no-restricted-syntax` rule for literals in warn mode, and put `ToastProvider` in the root
layout.

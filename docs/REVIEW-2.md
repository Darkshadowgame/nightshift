# Review 2: second, independent pass (17 Nov 2026, before the iPhone test)

Reviewed: `README.md` ("Try this tomorrow"), `docs/SPEC.md`, `docs/BACKLOG.md`, `docs/REVIEW.md`, all of
`src/`, `modules/plate-redactor/`, `app.json`, `package.json` and `.github/workflows/build-ios.yml`. I walked the
checklist in a fresh web export at 400×820 (screenshots `~/.playwright-mcp/rv2-*.png`, cleared storage first).
The web map is a flat stand-in, so map-gesture points below come from reading `NightMap.tsx`.
`npx tsc --noEmit` and `npx jest` (131 tests) both pass.

The round 1 fixes hold up. I re-checked the fuzzed area, crew roles, requests, photos in Documents, the tracked
Swift module, real italics and the confirm steps. I found no new crash in the paths the checklist uses. Most
findings below are checklist steps that can't be done, or don't show what the checklist says, with the
current seed data.

## Findings, ranked

### Blockers

None found. I found nothing that should stop the build or crash the app on launch.

### Major

**1. If your home area isn't in the Midlands, the map opens empty and the Invited tab is empty.**
All the seed events, people and invites sit around Tamworth and Lichfield. The welcome screen asks for a home
area "near home" (`ProfileForm.tsx:177-180`). Invites need home within the filter radius of the area
(`invites.ts:331`, `eventView.ts:403`). The main map opens centred on home (`(tabs)/index.tsx:114`).
*Evidence:* I picked London and long-pressed the map. The map showed no pins (`rv2-18-london-map.png`) and
Events showed **Invited (0)**. With the default Midlands area, Invited has 1 event (Late S/A meet).
README step 4 (`README.md:70`, "Open an invite… Invited tab") then can't be done, and the map steps start
on an empty screen.
*Fix (pick one):* (a) README step 2: "Leave the region on Midlands and long-press near Tamworth (the demo scene
is there)". (b) Add a one-line hint under the welcome map: "The demo scene is in the Midlands. Set your home
there to see invites". (c) Better later: offset the seed scene to the person's home.
*Status (fix pass 2):* Fixed. First run starts the home area on the demo area (Tamworth), says the sample scene is in the Midlands, and has a **Use the demo area** button; README step 2 says to keep it.

**2. The reminder step can't be done as written, and the first "I'm going" doesn't schedule its reminders.**
(a) `README.md:124` says "Tap **I'm going** on an event a few hours away". No seed event is a few hours
away and open to you. The live Lichfield meet is already "going". NightRunners and Peak District are hosted by
you. Late S/A is 5 days out. Cat and Fiddle is a request. The show and track day are 9–12 days out.
(b) The permission race: `event/[id].tsx:197` calls `askPermission()` while `setGoing` changes `events`.
The store effect (`store.tsx:249-256`) runs `syncReminders` 400 ms later. `syncReminders` returns early
because permission isn't granted yet (`notify.ts:209`), and the person is still looking at the iOS prompt.
Nothing runs the sync again when they tap Allow. The deps are `ready, allEvents, allCrews, remindersOn`.
So the first event's reminders only get scheduled after the next change to any event.
*Fix:* add a seed invite that starts about 3 hours after the seed, reveals 60 min before, matches the sample
Golf R, and isn't "going". Give it an `ev-` id in `SEED_EVENT_IDS` so `demoTime` keeps it in place. In the store,
keep a `permissionTick` state, bump it when `askPermission()`/`testReminder()` resolve true, and add it to the
sync effect's deps.
*Status (fix pass 2):* Fixed. New seed invite `ev-meet-soon` ("Coffee and cars, late edition", about 3 h out, reveal 60 min before, no mod minimum, you not going) in `SEED_EVENT_IDS`. The store re-syncs reminders when `askPermission()`/`testReminder()` resolve true and whenever the app comes back to the front (`reminderTick`). README steps 4 and 9 use it.

**3. Hosts never see the fuzzed area, so step 4's "locked pin and circle a mile or two off your spot" can't be seen.**
`canSeeStop` returns true for hosts (`events.ts:93`). So `viewEvent` gives hosts `shownStop >= 0`
(`eventView.ts:413-419`), and the map draws the real stop pin with no circle (`(tabs)/index.tsx:50-59`). The
event screen does the same (`event/[id].tsx:165-167`). *Evidence:* after hosting "Review test meet", the
map listed it as a normal pin. The saved area (52.587, -1.588) was about 1.5 mi from the stop, but nothing on
screen shows it.
*Fix:* on the event screen for hosts before the reveal, draw the area circle dashed with a "What invited people
see" caption, or add a "Preview as a guest" toggle. Otherwise reword `README.md:73-74`.
*Status (fix pass 2):* Fixed. Hosts get a **See as a guest** switch on the event screen: the map shows the locked pin and fuzzed circle and the stops show locked, with a caption.

**4. The notification list fills with duplicates every time the demo re-anchors.**
Reminder keys include the time (`reminders.ts:42`). `freshen` re-anchors seed events on every cold start
while the demo is untouched and older than 60 s, and on every start after 6 h (`demoTime.ts:42-46`).
Each re-anchor gives the same reminders new keys. `dueReminders` then adds them to the list again
(`store.tsx:259-269`). *Evidence:* after one reload, storage held 8 notices: 4 pairs such as
`ns.ev-rolling-host.soon.mwk0ubvv…` and `ns.ev-rolling-host.soon.mwk0s2rj…` with the same text, and the bell
showed 8. On the phone this happens every time iOS kills and relaunches the app before the person has changed
an event, and again on the "leave it for a day" step.
*Fix:* compare the in-app list by `eventId + kind + hash(title+body)`, not including the time. Or, when `freshen`
re-anchors, rewrite the `key` of existing notices for seed events with the same shift. (The scheduled iOS
notifications can keep time-based keys.)
*Status (fix pass 2):* Fixed. The in-app key is now `ns.<event>.<kind>` (plus the stop for "moved on"); the phone schedule id keeps the time and text hash so edits still reschedule. Old duplicates are converted and removed on load (`dedupeNotices`).

**5. "Make host on a member" can't be done in a crew you start, and starting or leaving a crew quietly removes your NightRunners host rights.**
`createCrew` makes a crew with you as the only member (`crews.ts:274-276`). Sample people never join, so the
**Make host** step at `README.md:116-118` has no member to use it on. *Evidence:* "Review Rats" shows
"Members (1)" and no Make host button (`rv2-17-new-crew.png`). Starting it (or leaving NightRunners) also takes
away your host role on **NightRunners late one** (crew hosts only, `events.ts:24`). Its Move on, Change the plan,
Edit and Cancel disappear with no warning. Rejoining makes you a plain member, so they stay gone until a reset.
*Fix:* in the demo, have 2 sample people with no crew (e.g. `jord`, `ash`) join a crew you start, so roles can be
tried. Add a line to the leave/start confirm: "You'll stop hosting NightRunners events". In the README, move
step 8 after step 5 or say this happens.
*Status (fix pass 2):* Fixed. Leaving, joining or starting a crew warns first ("You'll stop hosting NightRunners late one…") and needs a second tap; named co-host events (Peak District) stay yours (tested). Owners and hosts get **Invite members**, which adds crewless sample people at once (demo), so **Make host** can be tried.

**6. After "Request to go", the event can't be found again from the Events tab.**
`viewEvents` drops role `none` (`eventView.ts:426`), and a pending request doesn't change the role. So Cat and
Fiddle (or any event reached from a shared link) appears in no Events list and not on the map. The person can't
check the request or withdraw it unless they go back through the crew page.
*Fix:* add a `requested` role (`hasRequested`), list it under Mine with a "Requested" tag
(`EventCard` `ROLE_TEXT`), and show declined requests in Past.
*Status (fix pass 2):* Fixed. New `requested` and `declined` roles. Requested events list under Mine with a **Requested** tag and show locked on the map with "you asked to go"; Withdraw is on the event screen. Declined ones move to Past.

### Minor

**7. The "Unlocked" reveal plays on finished events.** `newlyUnlocked` ignores the phase (`eventView.ts:441-444`).
The first time you open **Snowdome Sunday meet**, "UNLOCKED · TAMWORTH SNOWDOME CAR PARK" plays at the same time
as the trophy cover reveal (`rv2-19-snowdome.png`). *Fix:* return `[]` when `phaseOf` is `over` or `cancelled`
(and mark those stops as seen).
*Status (fix pass 2):* Fixed. `newlyUnlocked` returns nothing for finished or cancelled events.

**8. Chat stays open on finished and cancelled events.** `event/[id].tsx:415` only checks host/going. Snowdome
shows "No messages yet" with a Send box. *Fix:* when `phase` is `over` or `cancelled`, show the messages read-only
with "Chat closed when the event finished".
*Status (fix pass 2):* Fixed. Finished and cancelled events show the chat read-only with "Chat closed when the event finished/was cancelled".

**9. Event maps don't move when the place changes.** `NightMap.tsx:16` uses `initialRegion`, which only applies
when the map mounts. The event screen changes `centre`/`span` from the area to the stop at the reveal and after
Move on (`event/[id].tsx:143,168-169`), but the iPhone map stays where it was. On Lichfield the previous stop is
already clipped at the top (`rv2-12-lichfield-checked.png`). *Fix:* keep a ref and call
`animateToRegion` in an effect when `centre`/`span` change, or put `key={centre.lat+','+centre.lng}` on the
event screen's map (as `ProfileForm` does).
*Status (fix pass 2):* Fixed. `NightMap` takes `follow` (event screen) and calls `animateToRegion` through a ref when the centre or span changes; `recentreKey` does the same for the map's **Show everything** chip. Only checkable on the iPhone.

**10. After a day, the demo is moved back into place but it is stuck where you left it.** `refreshDemo` keeps
each event's progress (`demoTime.ts:62-79`). After the step 5 run, NightRunners late one is "in about 30 min" but
already on its last stop ("This is the last planned stop"), and you're already checked in at Lichfield. Steps 4–6
can't be repeated without **Reset demo data**, which also wipes your profile, builds and photos.
*Fix:* when re-anchoring after 6 h or more, restore seed events' `currentStop`, `checkIns`, `revealedAt`,
`changes`, `requests` and `declined` from the fresh seed. Or add a "Refresh demo events" button on Me that
does this and keeps your profile and garage.
*Status (fix pass 2):* Fixed with the button option: Me > **Restart the demo events** re-seeds sample events, chat, votes and sample spot progress, keeping profile, builds, photos, crews and anything you made. README says when to use it.

**11. Rep and stats disagree.** Hosting rep only counts named `hostIds` (`rep.ts:123`). Me's "HOSTING n" uses
`isHost`, which includes crew hosts (`me.tsx:28`). Me's rep shows "Meets attended ×2" (the live Lichfield
counts), but Public view shows "1 MEETS" (finished events only, `people.ts:48`). *Fix:* use `isHost(e, id, crews)`
in `repLedger`, and use one rule (finished events only) in both places.
*Status (fix pass 2):* Fixed. Rep and public profiles share `attendedEvents`/`hostedEvents`: finished, not cancelled, crew hosts count. Me's "HOSTING n" stays a count of what you're hosting now.

**12. Handles appear in two cases.** Lists show `@mo.rs3`, but chat labels (`event/[id].tsx:432`, `v="label"`), the
Me header (`me.tsx:34`, h2), the profile title (`user/[id].tsx:40`, h1) and the cover ("@DAN_R") uppercase
them. Round 1 (#23) only fixed vote cards. *Fix:* put handles in their own `<Txt>` with `textTransform: 'none'`.
*Status (fix pass 2):* Fixed. Handles keep their case in the Me header, profile title, chat labels, plan-change log, build owner link, spot author link and the trophy cover.

**13. Wrong path in the notifications banner.** "Turn them back on in Me › Settings" (`notifications.tsx:35`).
Me has no Settings section; the toggle is under **Reminders**. *Fix:* "Me › Reminders".
*Status (fix pass 2):* Fixed: "Me › Reminders".

**14. "Snowdome Sunday meet" falls on whatever day was 3 days ago.** `seed.ts:321` uses `at(now, -3, 19, 0)`.
Today the header says "SAT 14 NOV" under "Sunday" and "Last weekend". It only matches on a Wednesday.
*Fix:* seed it on the most recent Sunday at least 2 days back.
*Status (fix pass 2):* Fixed. The Sunday meet is on the most recent Sunday at least 2 days back (tested for every weekday); its votes are dated that night.

**15. "Tonight" can quietly become tomorrow.** `EventForm.tsx:54` moves a start time that has passed to the next
day, but the chip still reads "Tonight" and the "Pick a start time in the future" error (line 156) can never
show. At 22:45, "Tonight 22:30" saves as tomorrow. *Fix:* if `days === 0` and the time has passed, show the error
(or relabel the chip "Tomorrow" live). Also, 06:00 and 09:00 under "Tonight" read oddly.
*Status (fix pass 2):* Fixed. `src/lib/when.ts`: "Tonight" with a passed time is an error; morning times under Tonight mean the small hours after midnight. The form shows "STARTS …" live under the chips.

**16. Plan changes don't recompute the rough area.** `applyPlanChange` (`events.ts:258-311`) can add or move
stops but leaves `area`/`areaRadiusMiles` as they were. An added stop far away can fall outside the circle.
Moving stop 1 to near the old fuzzed centre can put the locked pin on the place for invited people who aren't
going yet. *Fix:* recompute with `eventArea(stops, event.id, false)` after add and move. `editEvent` already does.
*Status (fix pass 2):* Fixed. `applyPlanChange` recomputes `area`/`areaRadiusMiles` with `eventArea` after add and move (tested).

**17. The drive GPS watch can leak.** In `spot/[id].tsx:281-316`, `start()` awaits `watchPositionAsync` and only
then sets `watch.current`. If the screen closes during that await (cleanup has already run), or **Start drive**
is tapped twice, a subscription stays live with GPS on. *Fix:* call `watch.current?.remove()` at the top of
`start()`. Keep a `cancelled` ref set by the unmount cleanup, and remove the new subscription at once if it's set.
*Status (fix pass 2):* Fixed. `start()` removes any old watch first, and a watch that finishes starting after the screen closed or the run was cancelled is removed at once.

**18. Old photo files pile up.** `finishPhoto` copies into `Documents/photos` straight away (`photos.ts:164-176`).
Cancelling a build edit, long-pressing a photo off (`build/edit.tsx:203`) or deleting a build never deletes the
file. *Fix:* on save, delete names that were in `existing.photos` and aren't in `photos`; on delete, delete all of
them. Leave orphans from a cancelled edit to a later sweep.
*Status (fix pass 2):* Fixed. Saving a build deletes photo files it no longer uses; deleting a build deletes its files (`droppedPhotos`, `deletePhotos`). Orphans from a cancelled edit are left for a later sweep, as suggested.

**19. Speed wording.** The seed Snake Pass description says "Rep for finishing it at the speed limit"
(`seed.ts:194`). The suggest screen says "A great road to drive at the speed limit" (`spot/new.tsx:72`).
"At the limit" reads as "drive at the maximum", which the legal notes and App Store 1.4.4 advise against.
*Fix:* "within the speed limits".
*Status (fix pass 2):* Fixed: "within the speed limits" in the seed and on the suggest screen.

**20. First-run polish.**
(a) A new user lands with 4 unread back-dated notices for events before they installed. The Events tab badge
repeats the bell count.
(b) The event header says "Meet" and the eyebrow under it says "MEET" again.
(c) On welcome, picking another region after long-pressing keeps the old home off-screen and still says
"HOME AREA SET" (`ProfileForm.tsx:128-131`).
(d) README step 3 says "Allow photo access", but iOS's photo picker doesn't ask.
*Fix:* (a) don't add notices dated before `onboarded`; show only the bell count. (b) Leave the header title
empty, as on build and user screens. (c) Clear `home` when the region changes. (d) Drop "Allow photo access".
*Status (fix pass 2):* Fixed. (a) No notices dated before you finished first run, and none while on the welcome screen; the Events tab badge is gone. (b) The event header title is empty. (c) Changing region clears the home area. (d) README no longer says "Allow photo access".

### Checked and fine

* **Swift module** (`PlateRedactorModule.swift`). It uses `AsyncFunction` with `Promise` as the last argument,
  `[[String: Double]]` and `Int` arguments, `VNRecognizeTextRequest`, `CIPixellate`, and `CGImageDestination` with
  `UTType.jpeg` and no metadata. The podspec pins `ios 16.4` and `swift_version 5.9`. Under Swift 5 language mode
  the non-Sendable `static let patterns` and the `promise` captured into `DispatchQueue.global().async` are
  warnings, not errors. Both the podspec and the Swift file are in git, and CI checks for them.
* **Notifications config.** `enableRemoteNotifications: false` means no `aps-environment` entitlement, which a
  free Apple ID needs. `getLastNotificationResponse` and `clearLastNotificationResponse` exist in this
  expo-notifications. Lock-screen text only has the title and the rough area name. "Moved on" says "Stop N is
  unlocked" and never names the place.
* **Reveal rules.** I checked that no exact place reaches people who aren't hosts before the reveal in map pins,
  peek, cards, share text (`events.ts:381-383`, area name only), notices, crew-page cards or profiles. Stop notes
  and the change log are for hosts only. The one gap is #16.
* **Thrown errors.** Every store action that can throw is wrapped where a button calls it, including
  request/vote/plan/crew/profile/spot. So a release build won't hit the fatal handler from a tap.
* **Requests.** Requests are never auto-approved, and declined people can't ask again. Approving moves the
  person to Going (checked in the preview: jordST approved, nina declined).

## Improvement ideas for tomorrow's test (ranked by impact)

*Status (fix pass 2):* 1–5 and 8 done (see the findings). 6: check-in now sits above the Going button; Going stays a
full-width toggle. 7: re-centre, a **Show everything** chip and tap-the-map-to-close-the-peek are done; the live pulse
size is unchanged. A notice when a host answers a request isn't done (no host answers your requests in the local demo).

1. **Fix #1 in the README now** (one line: "keep Midlands, long-press near Tamworth"). Without it, half the
   checklist shows empty screens.
2. **Add the "tonight, in about 3 hours" invite (#2) and re-sync after permission.** It's the only way to see a
   real reveal and a 30-minute reminder on the lock screen during the test.
3. **"Refresh demo events" on Me (#10).** It puts the live meet, the crew meet in 30 min and the request queue
   back without losing your profile, builds and blurred photos. This makes a second run on day 2 possible.
4. **"Preview as a guest" on your own event (#3).** It shows the main privacy feature (the fuzzed area) to the
   person who made the event.
5. **Show "Requested" events under Mine (#6),** and a notice when a host answers, even though it's local only.
6. **Make check-in the main button on live events.** Show the current stop large, and turn Going into a small
   toggle once checked in. Today "Going ✓ (tap to drop out)" sits above Check in (`rv2-12`).
7. **Map handling:** recentre on change (#9), a "fit everything" button on the main map (Snake Pass, Ladybower
   and the Peak cruise start off-screen), and tap empty map to close the peek. The live pulse's 92 pt box sits
   over the NightRunners, Late S/A and Curborough pins at the default zoom.
8. **Let a new crew get sample members (#5)** so owner/host roles can be tried end to end.

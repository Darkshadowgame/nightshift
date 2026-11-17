# Feedback: how it comes in and how to work through it

This is the workflow for any Claude session (or person) triaging Nightshift
feedback. The backend details are in [BACKEND.md](BACKEND.md) section 3
("Feedback") and section 7e.

**Privacy first.** Feedback text, screenshots and locations are private. They
never go in this repo (it is public): not in commits, docs, test fixtures, issue
text or PR descriptions. Describe a fix in your own words ("Going button
overlapped chat on small phones"), never by pasting what a tester wrote. The
inbox script prints to the terminal and saves to `~/nightshift-feedback/<id>/`,
outside the repo, and refuses to save inside it.

## How feedback arrives

* **In the app:** Settings › Feedback › Send feedback, the "Send feedback" card on
  Me, and "Trouble signing in? Send feedback" on the sign-in screen. The form has
  a type (Bug, Idea, Something's wrong with a place or event, Other), a message,
  up to 4 screenshots or photos (signed in only; they go through the plate check
  first) and an "Include my location" switch that is off unless ticked.
* **Sent automatically:** app version (`EXPO_PUBLIC_APP_VERSION`), update id,
  runtime and channel, device model and OS, the screen it was opened from, and the
  mode (demo, signed in or signed out). Never a name, email or location unless
  ticked.
* **Offline** it waits on the phone (the feedback queue) and goes when there's a
  connection. Signed out works too (no account, no screenshots).
* **Email:** each new report is emailed to `FEEDBACK_NOTIFY_EMAIL` by the
  `feedback-notify` Edge Function, with 7-day screenshot links (BACKEND.md 7e).
* **Testers see what happens:** Send feedback › "Your feedback" lists their reports
  as New, Seen, Planned, Fixed in vX or Not planned.

## The triage loop

```bash
cd ~/nightshift
node scripts/feedback-inbox.mjs                 # open feedback: new and seen, oldest first
node scripts/feedback-inbox.mjs --show <id>     # one report in full (id or its first 8 characters)
node scripts/feedback-inbox.mjs --status planned
node scripts/feedback-inbox.mjs --all           # last 60 days, any status
```

The script reads `~/.config/homelab-secrets.env` itself and never prints a key.
Each report's `report.json` and screenshots land in `~/nightshift-feedback/<id>/`
(open the screenshots with the Read tool to look at them).

1. **Read the inbox.** For each report, note the type, version, screen and device.
   Mark what you've read: `--mark <id> seen`.
2. **Group.** Put duplicates and related reports together (same screen, same
   symptom). Check the version: a report from an old version may already be fixed
   (`git log`, docs/BACKLOG.md). Add a note to each with `--note "..."` (the team's
   notes; testers never see them), e.g. `--note "same as 1a2b3c4d"`.
3. **Decide.** Fix now, or `--mark <id> planned --note "BACKLOG: ..."` and add it
   to docs/BACKLOG.md in your own words. Out of scope or not reproducible:
   `--mark <id> wont_do --note "why"` (testers see "Not planned"). Ask the owner
   before marking an idea `wont_do`.
4. **Fix.** The usual rules (`npx tsc --noEmit`, `npx jest`, the fingerprint
   check for OTA). Commit messages describe the fix, not the tester's words.
5. **Mark fixed with the version that ships it.** After the OTA update or build is
   published:

   ```bash
   node scripts/feedback-inbox.mjs --mark <id> fixed --version v1.0.NN --note "what changed"
   ```

   `fixed` needs `--version`: the tester's list then says "Fixed in v1.0.NN". Use
   the same version string as `EXPO_PUBLIC_APP_VERSION` in that update.
6. **Report back** to the owner: how many came in, what was fixed (with versions),
   what's planned, anything that needs their decision.

Other commands:

* `--notify <id>` sends a report's email again (only reports under a day old),
  e.g. after fixing the email setup.
* `--delete <id>` removes a report and its screenshots. Only for test rows and
  spam, and only when the owner says so.
* `--mark <id> new` reopens one (clears `handled_at` and the fixed version).

## Statuses

| Status (database) | `--mark` | The tester sees |
|---|---|---|
| `new` | `new` | New |
| `seen` | `seen` | Seen |
| `planned` | `planned` | Planned |
| `done` | `fixed --version vX` | Fixed in vX |
| `wont_do` | `wont_do` | Not planned |

`handled_at` is set by the database whenever the status changes (and cleared when
it goes back to `new`). Only staff (`public.staff`) and the service path (this
script, through the Management API) can change a status; senders can only read
their own reports' status and fixed version.

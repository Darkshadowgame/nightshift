# Moderation: roles, powers and the audit review

How the Nightshift moderation team works (owner request, 18 Nov 2026). The server decides
everything here (`supabase/migrations/20261118180000_spam_selling_member_moderation.sql`); the app
only shows what you're allowed to do. Community rules themselves: docs/SPEC.md, "Community".

## Roles

| Role | Who | How they get it |
|---|---|---|
| **Owner** | Exactly one person: the owner of Nightshift | Sets themselves once with SQL (below). Never through the app. |
| **Admin** | Trusted people who run the team | The owner makes them (Member moderation › Make admin) |
| **Moderator** | People who keep the Community tidy | An admin or the owner makes them (Member moderation › Make moderator) |

Everyone else is a member. Staff rows that existed before roles became moderators.

## Powers

| Action | Moderator | Admin | Owner |
|---|:-:|:-:|:-:|
| See the report queue, Member moderation (history, counts, log), the team list | yes | yes | yes |
| Warn (the person must acknowledge it in the app) | yes | yes | yes |
| Hide or restore reported content, dismiss reports | yes | yes | yes |
| Community ban: 24 hours, 3 days, 7 days | yes | yes | yes |
| Community ban: 30 days or until lifted | no | yes | yes |
| Full suspension (no messages either) | no | yes | yes |
| Lift a ban | Community bans of up to 7 days | any | any |
| Make or remove moderators | no | yes | yes |
| Make or remove admins | no | no | yes |
| Read the audit log (Settings › Audit log) | no | yes | yes |

Always:

* **Nobody moderates themselves**, and **nobody acts on someone with the same or a higher role**
  (a moderator can't warn another moderator; an admin can't ban an admin; nobody can touch the owner).
* Warnings, bans and role changes need a **reason**, which the person sees.
* Every warning, ban, lift and role change sends the person a **notice**.
* A **Community ban** stops posts, comments, threads, replies, event chat and connection requests.
  They can still read, use the map, events and their garage, report things, and message the
  people they're already connected with. A **full suspension** stops messages too.
* Nightshift itself raises **automatic reports** (Spam after five refused duplicate posts in a day,
  with a 24-hour Community cooldown; "Only here to sell" when 90%+ of someone's posts are selling).
  They show in the queue marked Automatic. Nothing bans anyone for selling automatically.

## The audit log

Every moderation action goes into `public.moderation_actions`: who did it, their role at the time,
what (warn, hide, unhide, ban, suspend, lift, promote, demote, dismiss, plus the automatic
auto_report and cooldown), on whom and on what content, the reason, the length and when. It is
**append-only**: there are no update or delete grants, and a trigger refuses update, delete and
truncate for everyone, the database owner included. Rows have no foreign keys, so deleting an
account never removes its history. Admins and the owner read it in the app (Settings › Audit log,
filter by person and action); the member screen shows everything about that one person to any staff.

## Setting yourself as owner (once, by the owner)

In the Supabase dashboard › SQL editor, with **your own** Nightshift account's email (the one you
sign in with). Nobody else should run this, and it isn't run by any script or migration:

```sql
insert into public.staff (user_id, role, note) select id, 'owner', 'owner' from auth.users where email = 'YOUR-EMAIL-HERE' on conflict (user_id) do update set role = 'owner';
```

Only one owner can exist (a unique index). To hand ownership over later, the current owner changes
their own row to `admin` in the SQL editor first, then the new owner runs the line above.

Then open the app: Settings shows **Moderation**, **Moderation team** and **Audit log**. Make your
first admins or moderators from their profile: ··· › **Moderate** › Role.

## Reviewing the team (Claude or the owner)

```bash
cd ~/nightshift
node scripts/moderation-audit.mjs              # last 30 days
node scripts/moderation-audit.mjs --days 7
node scripts/moderation-audit.mjs --json       # the same, for Claude to read
```

It reads the Management API token from `~/.config/homelab-secrets.env` itself, never prints it,
only reads, and prints to the terminal. **Don't save its output in the repo** (it names real
people). For each person on the team it prints their actions in the period and flags:

| Flag | Means |
|---|---|
| ban rate | 3+ bans or suspensions and more than twice the team's median |
| repeat target | 3+ actions on the same person |
| argued with | acted on someone they reported, who reported them, or who posted in the same threads or under the same posts |
| no reason | bans or suspensions without a reason (from the report queue's Suspend) |
| reversed | their hides or bans undone by other staff, and by whom |
| own connection | acted on someone they're connected with |

Flags are things to look at, not proof: read the context in the audit log and the member screen
(their history, the reports) before deciding. Remove a role from Member moderation › Role.

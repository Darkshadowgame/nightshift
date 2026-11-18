#!/usr/bin/env node
/**
 * Moderation audit: a per-moderator summary of public.moderation_actions for a
 * period, with patterns worth a second look (docs/MODERATION.md, "Reviewing the
 * team"). Read-only. Prints to the terminal only; never write its output into
 * the repo (it names real people).
 *
 *   node scripts/moderation-audit.mjs            # last 30 days
 *   node scripts/moderation-audit.mjs --days 7
 *   node scripts/moderation-audit.mjs --json     # the same, as JSON (for Claude to read)
 *
 * Reads SUPABASE_ACCESS_TOKEN from ~/.config/homelab-secrets.env itself (or the
 * environment) and queries through the Management API. It never prints a key,
 * token or password.
 *
 * Flags:
 *  - ban rate: bans and suspensions well above the team's median (2x and 3+)
 *  - repeat target: 3+ actions on the same person
 *  - argued with: acted on someone they reported, who reported them, or who
 *    posted in the same threads or under the same posts
 *  - no reason: bans or suspensions without a reason
 *  - reversed: their hides or bans undone by other staff (and who undid them)
 *  - own connection: acted on someone they're connected with
 */
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const REF = 'vuftzeianmqjboivqmws';

function secret(name) {
  if (process.env[name]) return process.env[name];
  try {
    const text = readFileSync(join(homedir(), '.config', 'homelab-secrets.env'), 'utf8');
    for (const line of text.split('\n')) {
      const m = line.match(/^\s*(?:export\s+)?([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && m[1] === name) return m[2].replace(/^['"]|['"]$/g, '');
    }
  } catch {
    // Falls through to the message below.
  }
  return null;
}

const TOKEN = secret('SUPABASE_ACCESS_TOKEN');
if (!TOKEN) {
  console.error('No SUPABASE_ACCESS_TOKEN in the environment or ~/.config/homelab-secrets.env.');
  process.exit(2);
}
const args = process.argv.slice(2);
const daysArg = args.indexOf('--days');
const DAYS = daysArg >= 0 ? Math.max(1, Math.min(365, parseInt(args[daysArg + 1], 10) || 30)) : 30;
const JSON_OUT = args.includes('--json');

async function sql(query) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`query failed (${res.status}): ${body.slice(0, 300)}`);
  return JSON.parse(body);
}

const since = `now() - interval '${DAYS} days'`;

const [actions, team, argued, connected, reversals] = await Promise.all([
  sql(`select a.actor_id, coalesce(a.actor_handle, '?') as actor, a.actor_role, a.action, a.target_user, coalesce(a.target_handle, '?') as target,
              a.target_kind, a.target_id, a.reason, a.days, a.created_at
       from public.moderation_actions a
       where a.created_at > ${since} and a.actor_id is not null
       order by a.created_at`),
  sql(`select s.user_id, '@' || p.handle as handle, s.role from public.staff s join public.profiles p on p.id = s.user_id`),
  // Pairs (actor, target) where they reported each other or wrote in the same thread or under the same post.
  sql(`with pairs as (select distinct a.actor_id, a.target_user from public.moderation_actions a
                      where a.created_at > ${since} and a.actor_id is not null and a.target_user is not null)
       select p.actor_id, p.target_user,
              exists (select 1 from public.reports r where (r.reporter_id = p.actor_id and r.target_user = p.target_user)
                                                     or (r.reporter_id = p.target_user and r.target_user = p.actor_id)) as reported,
              (select count(distinct t.id) from public.forum_threads t
                 where (t.author_id = p.actor_id or exists (select 1 from public.forum_replies r where r.thread_id = t.id and r.author_id = p.actor_id))
                   and (t.author_id = p.target_user or exists (select 1 from public.forum_replies r where r.thread_id = t.id and r.author_id = p.target_user))) as shared_threads,
              (select count(distinct po.id) from public.posts po
                 where (po.author_id = p.actor_id or exists (select 1 from public.post_comments c where c.post_id = po.id and c.author_id = p.actor_id))
                   and (po.author_id = p.target_user or exists (select 1 from public.post_comments c where c.post_id = po.id and c.author_id = p.target_user))) as shared_posts
       from pairs p`),
  sql(`select distinct a.actor_id, a.target_user from public.moderation_actions a
       join public.connections c on c.status = 'accepted'
        and least(c.requester_id, c.addressee_id) = least(a.actor_id, a.target_user)
        and greatest(c.requester_id, c.addressee_id) = greatest(a.actor_id, a.target_user)
       where a.created_at > ${since} and a.actor_id is not null`),
  // A hide undone (unhide on the same thing) or a ban lifted, by someone else, later.
  sql(`select o.actor_id as original_actor, coalesce(o.actor_handle, '?') as original, o.action, coalesce(o.target_handle, '?') as target,
              coalesce(u.actor_handle, '?') as undone_by, u.created_at
       from public.moderation_actions o
       join lateral (
         select * from public.moderation_actions u
         where u.created_at > o.created_at and u.actor_id is distinct from o.actor_id
           and ((o.action = 'hide' and u.action = 'unhide' and u.target_id = o.target_id)
             or (o.action in ('ban', 'suspend') and u.action = 'lift' and u.target_user = o.target_user))
         order by u.created_at limit 1) u on true
       where o.created_at > ${since} and o.actor_id is not null`),
]);

const roleOf = new Map(team.map((t) => [t.user_id, t.role]));
const byActor = new Map();
for (const a of actions) {
  const e = byActor.get(a.actor_id) ?? { handle: a.actor, role: roleOf.get(a.actor_id) ?? `${a.actor_role} (then)`, total: 0, counts: {}, targets: new Map(), noReason: 0 };
  e.total++;
  e.counts[a.action] = (e.counts[a.action] ?? 0) + 1;
  if (a.target_user) e.targets.set(a.target, (e.targets.get(a.target) ?? 0) + 1);
  if ((a.action === 'ban' || a.action === 'suspend') && !a.reason) e.noReason++;
  byActor.set(a.actor_id, e);
}

const bansOf = (e) => (e.counts.ban ?? 0) + (e.counts.suspend ?? 0);
const banCounts = [...byActor.values()].map(bansOf).sort((x, y) => x - y);
const median = banCounts.length ? banCounts[Math.floor((banCounts.length - 1) / 2)] : 0;
const handleOfTarget = new Map(actions.map((a) => [a.target_user, a.target]));

const report = [];
for (const [id, e] of byActor) {
  const flags = [];
  const bans = bansOf(e);
  if (bans >= 3 && bans > 2 * Math.max(1, median)) flags.push(`ban rate: ${bans} bans/suspensions vs a team median of ${median}`);
  for (const [t, n] of e.targets) if (n >= 3) flags.push(`repeat target: ${n} actions on ${t}`);
  for (const r of argued.filter((x) => x.actor_id === id)) {
    const why = [r.reported ? 'reports between them' : null, r.shared_threads > 0 ? `${r.shared_threads} shared threads` : null, r.shared_posts > 0 ? `${r.shared_posts} shared posts` : null].filter(Boolean);
    if (why.length) flags.push(`argued with ${handleOfTarget.get(r.target_user) ?? r.target_user}: ${why.join(', ')}`);
  }
  if (e.noReason) flags.push(`no reason: ${e.noReason} bans/suspensions without one`);
  for (const r of reversals.filter((x) => x.original_actor === id)) flags.push(`reversed: their ${r.action} on ${r.target} undone by ${r.undone_by}`);
  for (const c of connected.filter((x) => x.actor_id === id)) flags.push(`own connection: acted on ${handleOfTarget.get(c.target_user) ?? c.target_user}`);
  report.push({ moderator: e.handle, role: e.role, total: e.total, actions: e.counts, flags });
}
report.sort((a, b) => b.flags.length - a.flags.length || b.total - a.total);

const quiet = team.filter((t) => !byActor.has(t.user_id)).map((t) => `${t.handle} (${t.role})`);

if (JSON_OUT) {
  console.log(JSON.stringify({ days: DAYS, teamMedianBans: median, moderators: report, noActions: quiet }, null, 2));
} else {
  console.log(`Moderation audit: last ${DAYS} days, ${actions.length} staff actions by ${byActor.size} people (team median bans ${median}).\n`);
  for (const r of report) {
    const counts = Object.entries(r.actions).map(([k, v]) => `${k} ${v}`).join(', ');
    console.log(`${r.moderator} [${r.role}]  ${r.total} actions: ${counts}`);
    for (const f of r.flags) console.log(`   ! ${f}`);
    if (!r.flags.length) console.log('   nothing flagged');
  }
  if (quiet.length) console.log(`\nNo actions: ${quiet.join(', ')}`);
  console.log('\nFlags are things to look at, not proof. Check the context in Settings › Audit log or the member screen.');
}

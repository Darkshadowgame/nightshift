#!/usr/bin/env node
// Automated scorecard (docs/REDESIGN-2.md, section 7). Run before pushing UI changes.
//
//   npm run scorecard            12:30 and 20:30, at 1.0x and 1.3x text (four runs in parallel),
//                                plus a Busy night pass at the end of the 20:30 1.0x run
//   npm run scorecard:quick      20:30 at 1.0x only, no Busy night pass
//
// Options: --web <dir> use an existing web export instead of building one (`expo export --clear`),
// --jobs <n> runs at once (default 4), --out <dir> (default e2e/scorecard/.out), --headed.
// Exits 1 when any task fails or any rule check finds something.
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const L = require('./lib.cjs');
const { runScorecard, TASKS } = require('./tasks.spec.cjs');

const ROOT = path.join(__dirname, '..', '..');
const args = process.argv.slice(2);
const opt = (name, dflt) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : dflt; };
const quick = args.includes('--quick');
const outDir = path.resolve(opt('--out', path.join(__dirname, '.out')));
const jobs = Number(opt('--jobs', process.env.CI ? 2 : 4));

const RUNS = quick
  ? [{ clock: '20:30', scale: 1 }]
  : [{ clock: '12:30', scale: 1 }, { clock: '20:30', scale: 1, busy: true }, { clock: '12:30', scale: 1.3 }, { clock: '20:30', scale: 1.3 }];

async function main() {
  const started = Date.now();
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });
  let web = opt('--web');
  if (!web) {
    web = path.join(outDir, 'web');
    console.log('Building the web export (expo export --platform web --clear) ...');
    const log = path.join(outDir, 'export.log');
    const fd = fs.openSync(log, 'w');
    const r = spawnSync('npx', ['expo', 'export', '--platform', 'web', '--clear', '--output-dir', web], { cwd: ROOT, stdio: ['ignore', fd, fd], env: { ...process.env, CI: '1' } });
    fs.closeSync(fd);
    if (r.status !== 0) {
      console.error(fs.readFileSync(log, 'utf8').split('\n').slice(-40).join('\n'));
      throw new Error(`expo export failed (exit ${r.status}${r.signal ? `, ${r.signal}` : ''}${r.error ? `, ${r.error.message}` : ''}); log in ${log}`);
    }
  }
  const server = await L.serve(web, 0);
  const base = `http://127.0.0.1:${server.address().port}`;
  console.log(`Serving ${web} at ${base}; ${RUNS.length} run(s), ${Math.min(jobs, RUNS.length)} at a time, 375x667.`);

  const results = [];
  const queue = [...RUNS];
  await Promise.all(Array.from({ length: Math.min(jobs, RUNS.length) }, async () => {
    while (queue.length) {
      const r = queue.shift();
      const t = Date.now();
      const res = await runScorecard({ base, clock: r.clock, scale: r.scale, busy: !!r.busy, outDir }).catch((e) => ({ tag: `${r.clock}-${r.scale}x`, clock: r.clock, scale: r.scale, tasks: {}, findings: [], notes: [], error: String(e) }));
      res.wallMs = Date.now() - t;
      console.log(`  done ${res.tag} in ${(res.wallMs / 1000).toFixed(0)} s`);
      results.push(res);
    }
  }));
  server.close();
  results.sort((a, b) => RUNS.findIndex((r) => r.clock === a.clock && r.scale === a.scale) - RUNS.findIndex((r) => r.clock === b.clock && r.scale === b.scale));
  fs.writeFileSync(path.join(outDir, 'results.json'), JSON.stringify(results, null, 1));
  const ok = report(results);
  console.log(`\nTook ${((Date.now() - started) / 1000).toFixed(0)} s. Screenshots and results.json in ${path.relative(process.cwd(), outDir) || '.'}`);
  process.exit(ok ? 0 : 1);
}

function report(results) {
  const rel = (p) => (p ? path.relative(process.cwd(), p) : '');
  const cols = results.map((r) => `${r.clock} ${r.scale === 1 ? '1.0' : r.scale}x`);
  const w = 16;
  console.log('\nTASKS (pass/fail, seconds at human pace; limit in brackets)');
  console.log('#    ' + 'limit'.padEnd(7) + cols.map((c) => c.padEnd(w)).join(''));
  let ok = true;
  for (const [id, , limit] of TASKS) {
    const cells = results.map((r) => {
      const t = r.tasks[id];
      if (!t) return 'n/a'.padEnd(w);
      if (!t.pass) ok = false;
      return `${t.pass ? 'pass' : 'FAIL'} ${(t.ms / 1000).toFixed(1)}s`.padEnd(w);
    });
    console.log(id.padEnd(5) + `${limit}s`.padEnd(7) + cells.join(''));
  }
  console.log('pass ' + ''.padEnd(7) + results.map((r) => `${Object.values(r.tasks).filter((t) => t.pass).length}/10`.padEnd(w)).join(''));

  const failed = [];
  for (const r of results) for (const [id, t] of Object.entries(r.tasks)) if (!t.pass) failed.push(`  ${r.tag} ${id}: ${t.note}${t.shot ? `\n      ${rel(t.shot)}` : ''}`);
  if (failed.length) console.log('\nFailed tasks:\n' + failed.join('\n'));

  const RULES = [
    ['4.3', 'No disabled primary (ActionBar, sheet or page)'],
    ['4.7', 'Toasts readable 2 s, uncovered; only Undo'],
    ['C5', 'Event page says each fact once'],
    ['L2', 'No clipped text (1.0x and 1.3x)'],
    ['4.12', 'No banned word on screen'],
    ['console', 'No console errors'],
    // Review 19, "What e2e/scorecard could catch" (its problem numbers in brackets).
    ['MAP', 'Map pins/route end/text clear of chrome (26,15,42)'],
    ['EDGE', 'No bright sliver on a small map\'s edges (5,21; R20 4,33)'],
    ['T1', 'Toast message on one line at 1.0x (52)'],
    ['CANCEL', 'No bare "Cancel" (24)'],
    ['C5+', 'Route, Settings, Me, Tonight say facts once (27,51,47,7)'],
    ['ME', 'No two meets of one name in Me (41,49)'],
    ['L4', 'Results or trophy moment after task 6 (16)'],
    ['TILE', 'Photo tiles fill their frames (30)'],
    ['HEAD', 'One section header style per screen (48)'],
    ['K3', 'Same event card on map sheet and List (8)'],
    ['ART', 'Busy night: no placeholder art on Tonight (13)'],
    // Review 20, "Suggested new automated checks" (its numbers in brackets).
    ['IMG-SCALE', 'Photos scaled to their frames, not a corner (1,12)'],
    ['CLASH', 'Clash warning when hosting while going (2,31)'],
    ['HOME-DIST', 'Distances from home say "from home" (3,6,24,28,35)'],
    ['C5-CANCEL', 'A cancelled meet says "cancelled" once (17)'],
    ['CHECKED-IN', '"Checked in" still on the page 10 s on (16)'],
    ['REVEAL', '"Location shown" on show, uncovered, 2 s (14)'],
    ['EXIT-OVERLAP', 'No text over text as check-in plays out (15)'],
    ['PLACEHOLDER', '"It\'s up": no placeholder art (34)'],
    ['MAP-393', 'Busy night: MAP at 393x852 (11)'],
    ['WORDS', 'No "event" in text or labels (37)'],
    ['PHOTO-REUSE', 'One photo on at most two screens (13)'],
    ['DUP-NAME', 'Task 10: one meet fits "the Sunday coffee meet" (2)'],
  ];  console.log('\nRULE CHECKS');
  console.log('rule'.padEnd(13) + 'check'.padEnd(56) + cols.map((c) => c.padEnd(w)).join(''));
  const detail = [];
  for (const [rule, what] of RULES) {
    const cells = results.map((r) => {
      if ((rule === 'ART' || rule === 'MAP-393') && !r.busy) return 'n/a'.padEnd(w);
      const n = r.findings.filter((f) => f.rule === rule).length;
      if (n) ok = false;
      return (n ? `FAIL (${n})` : 'pass').padEnd(w);
    });
    console.log(rule.padEnd(13) + what.padEnd(56) + cells.join(''));
    // The same finding in several runs is listed once, with the runs it showed up in.
    const merged = new Map();
    for (const r of results) for (const f of r.findings.filter((x) => x.rule === rule)) {
      const key = f.message.replace(/ at -?\d+,-?\d+:/, ':');
      if (!merged.has(key)) merged.set(key, { f, runs: new Set() });
      merged.get(key).runs.add(r.tag);
    }
    for (const { f, runs } of merged.values()) detail.push(`  [${rule}] ${f.message}${f.task ? ` (task ${f.task})` : ''} [${[...runs].join(', ')}]${f.shot ? `\n      ${rel(f.shot)}` : ''}`);
  }
  if (detail.length) console.log('\nFindings:\n' + detail.join('\n'));
  const notes = [...new Set(results.flatMap((r) => r.notes || []))];
  if (notes.length) console.log('\nNotes:\n' + notes.map((n) => '  ' + n).join('\n'));
  for (const r of results) if (r.error) { ok = false; console.log(`\n${r.tag} stopped early: ${r.error}`); }
  console.log(ok ? '\nSCORECARD: PASS' : '\nSCORECARD: FAIL');
  return ok;
}

main().catch((e) => { console.error(e); process.exit(2); });

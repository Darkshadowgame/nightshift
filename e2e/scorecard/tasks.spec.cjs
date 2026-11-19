// The ten scorecard tasks (docs/REDESIGN-2.md 7.3), played at human pace in one browser run.
// Every step takes a screenshot and runs the rule checks (checks.cjs); the in-page probe (lib.cjs)
// watches toasts and disabled primaries the whole time.
const fs = require('fs');
const path = require('path');
const L = require('./lib.cjs');
const C = require('./checks.cjs');

const ROOT = path.join(__dirname, '..', '..');
/** Any photo for task 6: one of the app's own sample photos (no personal data in a public repo). */
const PHOTO = path.join(ROOT, 'assets', 'sample-photos', 'b-dan-0.jpg');

/** Task, read to the tester, and its time limit in seconds (7.3). */
const TASKS = [
  ['t1', 'Start the demo and set it up with a Ford Fiesta ST.', 60],
  ['t2', "What's on near you right now? Open it.", 20],
  ['t3', "Say you're going, with your car.", 15],
  ['t4', 'Get directions there, then come back.', 20],
  ['t5', "You've arrived. Check in.", 15],
  ['t6', 'Vote for the best car and add a photo from the meet.', 90],
  ['t7', "Find someone who's at this meet, connect, and send them a message.", 60],
  ['t8', 'Add a cold air intake to your car. What class and power is it now?', 45],
  ['t9', 'Host a meet for this Sunday at 10:00, open to anyone, and share it.', 120],
  ['t10', "You can't make the Sunday coffee meet after all. Sort that out, then find where you'd stop people near you seeing you.", 45],
];

async function runScorecard({ base, clock, scale, outDir, busy = false }) {
  const tag = `${clock.replace(':', '')}-${scale}x`;
  const shots = path.join(outDir, tag);
  fs.mkdirSync(shots, { recursive: true });
  const result = { tag, clock, scale, busy, tasks: {}, findings: [], notes: [], steps: [] };
  let step = 0;
  let current = '';
  let lastShot = '';

  const hits = {};
  const shotPath = (name) => path.join(shots, `${String(++step).padStart(2, '0')}-${current || 'start'}-${name}.jpg`);
  /** JPEG screenshots keep the output small (a full run is about 160 of them). */
  const shoot = (p, o = {}) => S.page.screenshot({ path: p, type: 'jpeg', quality: 70, ...o });
  let S = null;
  S = await L.launch({
    base, clock, scale,
    onHit: async (name) => {
      const p = shotPath(name);
      if (S) await shoot(p).catch(() => {});
      hits[name] = p;
    },
  });
  const page = S.page;
  const B = (name, o = {}) => page.getByRole('button', { name, ...o });
  const text = () => page.evaluate(() => document.body.innerText);
  const url = () => L.safePath(page);
  const sheetOpen = async () => (await page.locator('[data-testid=sheet]').count()) > 0;
  const toastCount = () => page.evaluate(() => window.__sc.toasts.length);
  const finding = (f, shot) => result.findings.push({ task: current, step, shot: shot || lastShot, ...f });
  /** Every line of text seen on a screen so far (for the host form's Name example). */
  const seenTexts = new Set();
  /** One finding per message per run; its screenshot outlines `boxes` in red. */
  const said = new Set();
  async function boxFinding(f, p) {
    if (said.has(f.message)) return;
    said.add(f.message);
    const { boxes, ...rest } = f;
    let shot = p;
    if (boxes && boxes.length) {
      shot = p.replace(/\.jpg$/, `-${f.rule.replace(/\W/g, '')}${said.size}.jpg`);
      await page.evaluate(C.markBoxes, boxes);
      await shoot(shot);
      await page.evaluate(C.unmarkBoxes);
    }
    finding(rest, shot);
  }
  /** The Tonight cards seen on the map sheet and in the List, for K3. */
  const cards = { map: [], list: [] };

  /** Screenshot plus the per-screen checks: banned words, clipped text, and C5 on an event page. */
  async function snap(name) {
    const p = shotPath(name);
    await shoot(p);
    lastShot = p;
    const u = url();
    const texts = await page.evaluate(C.pageText);
    const over = await page.evaluate(C.pageOverflow);
    for (const f of C.checkWords(texts, u)) finding(f, p);
    for (const f of C.checkOverflow(over, u, scale)) {
      // Below or above the fold: scroll it into view for its own screenshot, then scroll back.
      let shot = p;
      if (f.y < 0 || f.y > 640) {
        shot = p.replace(/\.jpg$/, `-clip${f.idx}.jpg`);
        await page.evaluate(C.revealClip, f.idx);
        await L.sleep(200);
        await shoot(shot);
        await page.evaluate(C.restoreScroll);
      }
      const { idx, y, ...rest } = f;
      finding(rest, shot);
    }
    if (/^\/event\//.test(u) && !(await sheetOpen())) for (const f of C.checkFacts(texts)) finding(f, p);
    await screenChecks(p, u, texts);
    for (const t of texts) if (!t.toast) seenTexts.add(t.text);
    result.steps.push({ step, name, task: current, url: u, shot: p });
  }

  /** Review 19's checks that run on every screen (checks-more.cjs). */
  async function screenChecks(p, u, texts) {
    const found = [];
    const maps = await page.evaluate(C.pageMaps);
    found.push(...C.checkMaps(maps, u));
    found.push(...C.checkCancels(await page.evaluate(C.pageCancels), u));
    found.push(...C.checkDistances(texts, u));
    found.push(...C.checkTiles(await page.evaluate(C.pageTiles), u));
    found.push(...C.checkHeaders(await page.evaluate(C.pageHeaders), u));
    if (u === '/') found.push(...C.checkTonight(await page.evaluate(C.pageTonight), u));
    if (u === '/me') found.push(...C.checkMe(await page.evaluate(C.pageMe), u));
    // A bright sliver along the top of a small map card (Review 19 #5, #21): its top 4 px.
    const edges = maps.filter((x) => x.small && x.top && x.top.y + 4 <= 667);
    // Tiles still loading show the map's plain background: wait for them (up to 3 s) so the result doesn't depend on timing.
    if (edges.length) await page.waitForFunction(() => [...document.querySelectorAll('.leaflet-container')].every((m) => !m.querySelector('.leaflet-tile:not(.leaflet-tile-loaded)')), null, { timeout: 3000 }).catch(() => {});
    for (const m of edges) {
      const clip = { x: Math.ceil(m.clip.x), y: Math.ceil(m.top.y), width: m.top.cols.length, height: 4 };
      const png = await page.screenshot({ clip, type: 'png' });
      const b = await page.evaluate(C.pageBright, [png.toString('base64'), m.top.cols]);
      // A cut label or tile gap is 40+ bright device pixels; a stray anti-aliased pixel or two isn't.
      if (b.n >= 40 && b.cols >= 8) found.push({ rule: 'EDGE', message: `on ${C.at(u)}, a bright sliver along the top edge of the small map (a label or tile cut by the edge)`, boxes: [{ x: clip.x, y: clip.y, w: clip.width, h: 4 }] });
    }
    for (const f of found) await boxFinding(f, p);
  }

  /**
   * A tap at human pace. A sheet that opened by itself and covers the target is read (4 s) and
   * closed with Done, and noted. After the tap: a new toast is watched until it's gone, a new
   * sheet is read before the next tap.
   */
  async function tap(loc, { inSheet = false, timeout = 8000 } = {}) {
    if (!inSheet && (await sheetOpen())) await closeStraySheet();
    // A toast that popped up on its own a moment ago (an accepted request) gets read first.
    const young = await page.evaluate(() => Math.min(Infinity, ...window.__sc.toasts.filter((t) => !t.gone).map((t) => Date.now() - t.first)));
    if (young < L.PACE.readToast) await L.sleep(L.PACE.readToast - young);
    const toasts = await toastCount();
    const hadSheet = await sheetOpen();
    const t0 = Date.now();
    await loc.first().click({ timeout });
    await L.sleep(L.PACE.settle);
    let wait = 0;
    if ((await toastCount()) > toasts) wait = Math.max(wait, L.PACE.readToast);
    if (!hadSheet && (await sheetOpen())) wait = Math.max(wait, L.PACE.readSheet);
    const left = wait - (Date.now() - t0);
    if (left > 0) await L.sleep(left);
  }

  /** Closes the sheet on show with Done, else its scrim. */
  async function closeSheet() {
    const done = page.locator('[data-testid=sheet]').getByRole('button', { name: 'Done', exact: true });
    if (await done.count()) await done.first().click();
    else await page.locator('[data-testid=sheet-scrim]').first().click({ position: { x: 20, y: 20 } });
    await L.sleep(L.PACE.settle);
  }

  async function closeStraySheet() {
    const title = await page.locator('[data-testid=sheet] [role=heading]').first().textContent().catch(() => '?');
    await snap('stray-sheet');
    result.notes.push(`${current}: the "${title}" sheet was open over the next step; read it and tapped Done`);
    const done = page.locator('[data-testid=sheet]').getByRole('button', { name: 'Done', exact: true });
    if (await done.count()) await done.first().click();
    else await page.locator('[data-testid=sheet-scrim]').first().click({ position: { x: 20, y: 20 } });
    await L.sleep(L.PACE.settle);
  }

  let t0 = 0;
  async function start(id) {
    current = id;
    await page.evaluate((t) => { window.__sc.task = t; }, id);
    t0 = Date.now();
  }
  function stop(id, pass, note = '') {
    const limit = TASKS.find((t) => t[0] === id)[2];
    const ms = Date.now() - t0;
    const over = ms > limit * 2000;
    result.tasks[id] = { pass: pass && !over, ms, limit, note: over ? `over twice the ${limit} s limit. ${note}` : note, shot: lastShot };
  }
  /** "Toast seen": a toast from this task matching re, readable for 2 s at a stretch. */
  async function toastSeen(id, re) {
    const list = await page.evaluate(() => window.__sc.toasts.map(({ text, task, bestRunMs }) => ({ text, task, bestRunMs })));
    const mine = list.filter((t) => t.task === id && re.test(t.text));
    if (!mine.length) return { ok: false, why: `no toast matching ${re}` };
    const best = Math.max(...mine.map((t) => t.bestRunMs));
    return { ok: best >= 2000, why: `toast "${mine[0].text}" readable for ${(best / 1000).toFixed(1)} s` };
  }

  try {
    await L.sleep(3000);
    await snap('signin');

    // 1. Demo with a Fiesta ST.
    await start('t1');
    await tap(page.getByRole('checkbox'));
    await tap(B('Try the demo'));
    await snap('welcome');
    await page.getByRole('search').click();
    await page.keyboard.type('Fiesta ST', { delay: 60 });
    await L.sleep(1200);
    await snap('search');
    await tap(B(/^Ford Fiesta ST Mk8,/));
    await tap(B('Next'));
    await snap('home');
    await tap(B('Show me tonight'));
    await L.sleep(2000);
    await snap('tonight');
    cards.map = await page.evaluate(C.pageEventCards);
    const onTonight = url() === '/';
    stop('t1', onTonight, onTonight ? '' : `ended on ${url()}`);
    await tap(page.getByRole('tab', { name: 'Garage' }));
    const garage = await text();
    if (!/Fiesta ST/.test(garage)) { result.tasks.t1.pass = false; result.tasks.t1.note += ' no Fiesta ST in the Garage'; }
    await snap('garage-check');
    await tap(page.getByRole('tab', { name: 'Tonight' }));
    await L.sleep(1000);

    // 2. The live meet.
    await start('t2');
    // The live meet's card ("Meet, Car park meet-up, Live · until 23:00 · ..."), not the map cluster.
    await tap(B(/^Live, |, Live · /));
    await L.sleep(800);
    await snap('event');
    const t2 = /^\/event\//.test(url()) && /\blive\b/i.test(await text());
    stop('t2', t2, url());

    // 3. Going, with the car; toast seen.
    await start('t3');
    await tap(B("I'm going"));
    await snap('going');
    if (await sheetOpen()) await closeStraySheet();
    await L.sleep(500);
    await snap('going-after');
    const going = /Going with your Fiesta ST/i.test(await text());
    const seen3 = await toastSeen('t3', /going/i);
    stop('t3', going && seen3.ok, `${going ? 'going with the Fiesta' : 'not going with the Fiesta'}; ${seen3.why}`);

    // 4. Directions and back.
    await start('t4');
    await tap(B('Navigate'));
    await L.sleep(1500);
    await snap('directions');
    const opened = url() === '/drive' || (await sheetOpen());
    if (await B('Not now').count()) await tap(B('Not now'), { inSheet: true });
    else if (await B('End navigation').count()) await tap(B('End navigation'));
    else if (await B('End', { exact: true }).count()) await tap(B('End', { exact: true }));
    else await tap(B('Go back'));
    await L.sleep(800);
    await snap('back');
    stop('t4', opened && /^\/event\//.test(url()), `directions ${opened ? 'opened' : 'not opened'}; back on ${url()}`);

    // 5. Check in; burst and toast.
    await start('t5');
    await tap(B('Check in'));
    await snap('checked-in');
    const checked = /checked in/i.test(await text());
    const seen5 = await toastSeen('t5', /checked in/i);
    stop('t5', checked && seen5.ok, seen5.why);

    // 6. Vote and a photo.
    await start('t6');
    await tap(B('Vote'));
    await snap('vote');
    await tap(B(/^BMW M4 Competition, /), { inSheet: true });
    await snap('voted');
    await tap(B('Done'), { inSheet: true });
    await snap('results');
    // A trophy cover, or a results line (allow/trophy.json).
    const trophy = [...(await page.evaluate(C.pageCovers)), ...C.trophyLines(await page.evaluate(C.pageText))];
    const resultsShot = lastShot;
    const chooser = page.waitForEvent('filechooser', { timeout: 8000 });
    await tap(B('Add a photo'));
    await (await chooser).setFiles(PHOTO);
    await L.sleep(1500);
    await snap('crop');
    await tap(B('Use this crop'));
    await snap('photo-posted');
    const voted = (await page.evaluate(() => window.__sc.toasts.some((t) => t.task === 't6' && /voted/i.test(t.text))));
    const photo = (await B('Photo by You').count()) > 0;
    stop('t6', voted && photo, `${voted ? 'vote recorded' : 'no vote toast'}; ${photo ? 'photo in Photos' : 'photo not in Photos'}`);
    // L4 (Review 19 #16): after the vote, a results or trophy moment on the event page.
    trophy.push(...(await page.evaluate(C.pageCovers)), ...C.trophyLines(await page.evaluate(C.pageText)));
    if (!trophy.length) finding({ rule: 'L4', message: 'after voting (task 6), nothing on the event page says what voting leads to: no trophy cover and no results line ("Results are in.", "Results at 23:00"; allow/trophy.json lists what counts)' }, resultsShot);

    // 7. Someone at the meet: connect, message.
    await start('t7');
    await page.mouse.wheel(0, -5000);
    await L.sleep(500);
    await tap(B(/going · \d+ cars?/));
    await snap('going-list');
    await tap(B(/^@dan_r/));
    await snap('profile');
    await tap(B('Connect'));
    await page.getByRole('button', { name: 'Message' }).first().waitFor({ timeout: 15000 });
    await snap('connected');
    await tap(B('Message'));
    await snap('chat');
    await page.getByRole('textbox', { name: 'Message' }).fill('Mega M4, mate.');
    await tap(B('Send'));
    await snap('sent');
    stop('t7', (await text()).includes('Mega M4, mate.'));

    // 8. A cold air intake: class and power.
    await start('t8');
    for (let i = 0; i < 6 && !(await page.getByRole('tab', { name: 'Garage' }).count()); i++) await tap(B('Go back'));
    await tap(page.getByRole('tab', { name: 'Garage' }));
    await snap('garage');
    const before = ((await text()).match(/(\d+)\s*bhp/) || [])[1];
    await tap(B('Add a mod'));
    await snap('add-mod');
    await tap(B('Cold air intake'), { inSheet: true });
    await snap('cold-air-intake');
    await tap(B(/^Add cold air intake$/i), { inSheet: true });
    await snap('mod-added');
    const t8toast = await page.evaluate(() => (window.__sc.toasts.find((t) => t.task === 't8' && /bhp/.test(t.text)) || {}).text || '');
    const g = await text();
    const now = (t8toast.match(/(\d+)\s*bhp/) || [])[1];
    const cls = (t8toast.match(/Class ([A-Z])/) || [])[1];
    const readable = !!now && !!cls && new RegExp(`\\b${now}\\s*bhp`).test(g) && now !== before;
    stop('t8', readable, `toast "${t8toast}"; Garage ${readable ? 'shows' : 'does not show'} ${now} bhp (was ${before})`);

    // 9. Host a meet on Sunday at 10:00, open to anyone, and share it.
    await start('t9');
    await tap(page.getByRole('tab', { name: 'Tonight' }));
    await tap(B('Host a meet'));
    await snap('host-1');
    const example = await page.getByRole('textbox', { name: 'Name' }).getAttribute('placeholder');
    for (const f of C.checkNameExample(example, seenTexts)) finding(f);
    await page.getByRole('textbox', { name: 'Name' }).fill('Sunday morning meet');
    await tap(B(/^Starts:/));
    await snap('starts');
    await tap(page.getByRole('radio', { name: /^Sun, Sun/ }), { inSheet: true });
    // Evening hours show first (Review 19 #44): morning hours are behind "Show earlier hours".
    if (!(await page.getByRole('radio', { name: '10:00', exact: true }).count())) await tap(B('Show earlier hours'), { inSheet: true });
    await tap(page.getByRole('radio', { name: '10:00', exact: true }), { inSheet: true });
    await snap('starts-picked');
    await tap(B('Done'), { inSheet: true });
    await tap(B('Next'));
    await snap('host-2');
    await tap(B(/^Place the meet point/));
    await snap('place');
    await tap(B('Set meet point here'));
    await tap(B('Next'));
    await snap('host-3');
    const anyone = /Everyone/.test(await text());
    await tap(B('Next'));
    await snap('host-4');
    const review = await text();
    await tap(B('Post meet'));
    await snap('posted');
    await tap(B('Share', { exact: true }));
    await snap('share');
    const shared = /share this meet|copy link/i.test(await text()) || (await sheetOpen());
    const sun10 = /Sun 10:00/.test(review);
    stop('t9', sun10 && anyone && shared, `${sun10 ? 'Sun 10:00' : 'not Sun 10:00'}; ${anyone ? 'open to everyone' : 'not open to everyone'}; share ${shared ? 'opened' : 'not opened'}`);
    if (await sheetOpen()) await tap(page.locator('[data-testid=sheet]').getByRole('button', { name: 'Done', exact: true }), { inSheet: true });
    // Not timed: your meet's ··· menu, for the bare-Cancel check (Review 19 #24). Open the meet
    // replaces the posted page, so its back goes to Tonight, where task 10 starts.
    if (await B('Open the meet').count()) {
      await tap(B('Open the meet'));
      await tap(B('More options'));
      await snap('options');
      if (await sheetOpen()) await closeSheet();
      await tap(B('Go back'));
    } else result.notes.push('t9: no "Open the meet" after posting, so the meet\'s ··· menu went unchecked');

    // 10. Not going to Sunday coffee; the Privacy switch.
    await start('t10');
    // The "It's up" page has no back (Review 19 #46): Done closes it. After the options check above
    // you're usually on Tonight already.
    if (url() !== '/') await tap((await B('Go back').count()) ? B('Go back') : B('Done', { exact: true }));
    await tap(page.getByRole('tab', { name: /^List/ }));
    const coffee = B(/Sunday coffee and cars/);
    await coffee.first().scrollIntoViewIfNeeded();
    await snap('list');
    cards.list = await page.evaluate(C.pageEventCards);
    for (const f of C.checkCardLook(cards.map, cards.list)) finding(f);
    await tap(coffee);
    await snap('coffee');
    await tap(B("Can't make it"));
    await snap('cant-make-it');
    await tap(B("Yes, I can't go"), { inSheet: true });
    await snap('left');
    const left = /not going/i.test(await text()) || (await page.evaluate(() => window.__sc.toasts.some((t) => t.task === 't10' && /not going/i.test(t.text))));
    await tap(B('Go back'));
    await tap(page.getByRole('tab', { name: 'Me' }));
    await snap('me');
    await tap(B('Settings'));
    await snap('settings');
    const privacy = (await page.getByRole('switch', { name: /People near you/i }).count()) > 0;
    stop('t10', left && privacy, `${left ? 'not going' : 'still going'}; Privacy switch ${privacy ? 'found' : 'not found'}`);
    current = '';
    await L.sleep(3500); // let the last toast run its course before the toast check
  } catch (e) {
    const msg = String(e.message || e).split('\n')[0];
    await snap('ERROR').catch(() => {});
    if (current && !result.tasks[current]) result.tasks[current] = { pass: false, ms: Date.now() - t0, limit: TASKS.find((t) => t[0] === current)[2], note: `stopped: ${msg}`, shot: lastShot };
    result.error = `${current || 'start'}: ${msg}`;
  }
  for (const [id, , limit] of TASKS) if (!result.tasks[id]) result.tasks[id] = { pass: false, ms: 0, limit, note: 'not reached', shot: '' };

  /**
   * Busy night, full scorecard only: from Settings (where task 10 ends), Busy night on, then
   * Tonight's map (MAP, Review 19 #15) and List (ART, #13: no card may show the grid placeholder
   * art). Not scored otherwise: its toasts and screens skip the other rule checks.
   */
  async function busyNight() {
    current = 'busy';
    await page.evaluate(() => { window.__sc.task = 'busy'; });
    const sw = page.getByRole('switch', { name: /Busy night/i });
    await sw.first().scrollIntoViewIfNeeded();
    await sw.first().click();
    await L.sleep(L.PACE.readToast);
    await B('Go back').first().click();
    await L.sleep(L.PACE.settle);
    await page.getByRole('tab', { name: 'Tonight' }).click();
    await L.sleep(L.PACE.settle);
    await page.getByRole('tab', { name: /^Map/ }).click();
    await L.sleep(2500);
    // The busy map: pins clear of the controls and inside its edges (Review 19 #15).
    const pm = shotPath('busy-map');
    await shoot(pm);
    for (const f of C.checkMaps(await page.evaluate(C.pageMaps), url())) await boxFinding(f, pm);
    await page.getByRole('tab', { name: /^List/ }).click();
    await L.sleep(2000);
    const p = shotPath('busy-list');
    await shoot(p);
    const art = await page.evaluate(C.pagePlaceholders);
    for (const a of art) {
      let shot = p;
      if (a.idx < 3) {
        shot = p.replace(/\.jpg$/, `-art${a.idx}.jpg`);
        await page.locator(`[data-sc-art="${a.idx}"]`).scrollIntoViewIfNeeded();
        await L.sleep(300);
        const r = await page.locator(`[data-sc-art="${a.idx}"]`).boundingBox();
        if (r) await page.evaluate(C.markBoxes, [{ x: r.x, y: r.y, w: r.width, h: r.height }]);
        await shoot(shot);
        await page.evaluate(C.unmarkBoxes);
      }
      finding({ rule: 'ART', message: `Busy night, Tonight's List: the card "${a.label}" shows the grid placeholder art instead of a photo or the real map` }, shot);
    }
    result.notes.push(`Busy night: ${art.length} Tonight card(s) with placeholder art`);
  }

  const sc = await page.evaluate(() => window.__sc).catch(() => ({ toasts: [], disabled: [] }));
  for (const f of C.checkToasts(sc.toasts)) result.findings.push({ ...f, shot: hits[`toast-covered-${f.toastId}`] || shotFor(result, f.task) });
  sc.disabled.forEach((d, i) => result.findings.push({ ...C.checkDisabled([d])[0], shot: hits[`disabled-primary-${i + 1}`] || shotFor(result, d.task) }));
  for (const f of C.checkToastLines(sc.toasts, scale)) result.findings.push({ ...f, shot: hits[`toast-lines-${f.toastId}`] || shotFor(result, f.task) });
  if (busy && !result.error) await busyNight().catch((e) => result.notes.push(`Busy night pass stopped: ${String(e.message || e).split('\n')[0]}`));
  for (const f of C.checkConsole(S.errors)) result.findings.push({ ...f, task: '', shot: '' });
  result.toasts = sc.toasts.map(({ text, task, url: u, bestRunMs, coveredBy, actions }) => ({ text, task, url: u, bestRunMs, coveredBy, actions }));
  await S.browser.close();
  fs.writeFileSync(path.join(shots, 'result.json'), JSON.stringify(result, null, 1));
  return result;
}

function shotFor(result, task) {
  const s = result.steps.filter((x) => x.task === task);
  return s.length ? s[0].shot : '';
}

module.exports = { runScorecard, TASKS };

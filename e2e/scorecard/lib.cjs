// Shared plumbing for the automated scorecard (docs/REDESIGN-2.md, section 7).
// A tiny static server with SPA fallback, a Playwright browser set up like the reviewers' runs
// (375x667, touch, @2x, Europe/London, en-GB, fixed clock), the 1.3x text scaler and the in-page
// probe that watches toasts and disabled primaries all the time.
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Human pace (section 7: a person reads toasts and sheets before the next tap). */
const PACE = {
  /** After a tap, before looking at what changed. */
  settle: 700,
  /** Reading a sheet that just opened, before acting on it. */
  readSheet: 4000,
  /** Watching a toast that just appeared. */
  readToast: 3400,
};

const TYPES = {
  '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.json': 'application/json',
  '.ttf': 'font/ttf', '.woff': 'font/woff', '.woff2': 'font/woff2', '.ico': 'image/x-icon',
  '.webp': 'image/webp', '.mp4': 'video/mp4', '.wasm': 'application/wasm',
};

/** Serves a web export with SPA fallback (unknown paths get index.html). Resolves to the server. */
function serve(root, port) {
  root = path.resolve(root);
  const server = http.createServer((q, r) => {
    let p;
    try { p = decodeURIComponent(q.url.split('?')[0]); } catch { p = '/'; }
    let f = path.join(root, p);
    if (!f.startsWith(root)) { r.writeHead(403); r.end(); return; }
    fs.stat(f, (e, s) => {
      if (e || s.isDirectory()) {
        if (!e && fs.existsSync(path.join(f, 'index.html'))) f = path.join(f, 'index.html');
        else if (fs.existsSync(f + '.html')) f = f + '.html';
        else f = path.join(root, 'index.html');
      }
      r.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' });
      fs.createReadStream(f).pipe(r);
    });
  });
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => resolve(server));
  });
}

/**
 * 1.3x text: each element's computed font size (and px line height) times the scale, once.
 * Text that only inherits its size from a scaled parent is left alone (it grows with the parent),
 * and SVG tspans inside a text are skipped, so nothing is ever scaled twice. A MutationObserver and
 * a 250 ms sweep catch new and re-rendered text; an element whose size React reset is scaled again
 * from its new size.
 */
function scalerScript(scale) {
  return `(() => {
  const S = ${scale};
  if (S === 1) return;
  const seen = new WeakMap(); // el -> { orig, scaled }
  const ownText = (el) => { for (const n of el.childNodes) if (n.nodeType === 3 && n.textContent.trim()) return true; return false; };
  function nearestScaled(el) { for (let p = el.parentElement; p; p = p.parentElement) { const r = seen.get(p); if (r) return r; } return null; }
  function one(el) {
    const tag = el.tagName;
    if (tag === 'tspan' && el.parentElement && el.parentElement.closest('text')) return;
    if (!(tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'text' || ownText(el))) return;
    const cs = getComputedStyle(el);
    const fs = parseFloat(cs.fontSize);
    if (!fs) return;
    const had = seen.get(el);
    if (had && Math.abs(had.scaled - fs) < 0.05) return; // already done and still applied
    const up = nearestScaled(el);
    if (!had && up && Math.abs(up.scaled - fs) < 0.05) { seen.set(el, { orig: up.orig, scaled: fs }); return; } // inherited
    const lh = cs.lineHeight;
    el.style.setProperty('font-size', (fs * S) + 'px', 'important');
    if (lh.endsWith('px')) el.style.setProperty('line-height', (parseFloat(lh) * S) + 'px', 'important');
    seen.set(el, { orig: fs, scaled: fs * S });
  }
  function all() { if (document.body) for (const el of document.body.querySelectorAll('*')) one(el); }
  let t = null;
  new MutationObserver(() => { if (!t) t = setTimeout(() => { t = null; all(); }, 16); }).observe(document, { childList: true, subtree: true, characterData: true });
  document.addEventListener('DOMContentLoaded', all);
  setInterval(all, 250);
})();`;
}

/**
 * Always-on probe, sampled every 100 ms:
 * - toasts ([data-testid=toast]): for each one, when it was on screen, not faded and not covered
 *   by anything (a sheet, its scrim, a modal); which element covered it; its action buttons.
 * - disabled primaries ([data-testid=primary-button] with aria-disabled, not busy), where they sit.
 * The first time either goes wrong it calls window.__scorecardHit so Node takes a screenshot.
 */
const PROBE = `(() => {
  if (window.__sc) return;
  const sc = window.__sc = { toasts: [], disabled: [], task: '' };
  const live = new Map();
  let nextId = 1;
  const css = document.createElement('style');
  css.textContent = '[data-testid=toast],[data-testid=toast] *{pointer-events:auto!important}';
  const shown = (el) => el.checkVisibility ? el.checkVisibility({ opacityProperty: true, visibilityProperty: true }) : true;
  function opacity(el) { let o = 1; for (let e = el; e && e.nodeType === 1; e = e.parentElement) o *= parseFloat(getComputedStyle(e).opacity || '1'); return o; }
  function describe(el) {
    if (!el) return 'nothing (off screen)';
    const t = el.closest('[data-testid]') || el.querySelector('[data-testid]');
    const id = t ? t.getAttribute('data-testid') : el.tagName.toLowerCase();
    const sheet = /^sheet/.test(id) ? document.querySelector('[data-testid=sheet]') : null;
    const title = sheet ? (sheet.querySelector('[role=heading]') || {}).textContent : '';
    const label = (t || el).getAttribute('aria-label') || '';
    return id + (title ? ' "' + title + '"' : '') + (label ? ' [' + label + ']' : '');
  }
  function where(el) {
    if (el.closest('[data-testid=sheet]')) { const h = el.closest('[data-testid=sheet]').querySelector('[role=heading]'); return 'sheet "' + (h ? h.textContent : '?') + '"'; }
    if (el.closest('[data-testid=action-bar]')) return 'ActionBar';
    return 'page';
  }
  function sample() {
    const now = Date.now();
    const els = [...document.querySelectorAll('[data-testid=toast]')];
    if (els.length) document.head.appendChild(css);
    for (const el of els) {
      let rec = live.get(el);
      if (!rec) {
        rec = { id: nextId++, task: sc.task, url: location.pathname, text: '', first: now, last: now, visibleMs: 0, bestRunMs: 0, runStart: null, coverRun: 0, coveredBy: '', actions: [], hit: false };
        live.set(el, rec); sc.toasts.push(rec);
      }
      rec.text = (el.innerText || '').replace(/\\s+/g, ' ').trim();
      rec.actions = [...el.querySelectorAll('[role=button]')].map((b) => (b.getAttribute('aria-label') || b.innerText || '').trim());
      const r = el.getBoundingClientRect();
      let cover = '';
      if (r.width === 0 || r.bottom <= 0 || r.top >= innerHeight) cover = 'off screen';
      else {
        const y = r.top + r.height / 2;
        for (const x of [r.left + r.width * 0.2, r.left + r.width / 2, r.left + r.width * 0.8]) {
          const h = document.elementFromPoint(Math.min(Math.max(x, 0), innerWidth - 1), Math.min(Math.max(y, 0), innerHeight - 1));
          if (!h || !el.contains(h)) { cover = describe(h); break; }
        }
      }
      const ok = !cover && opacity(el) >= 0.9 && shown(el);
      rec.last = now;
      // Each sample stands for the 100 ms around it.
      if (ok) { if (rec.runStart == null) rec.runStart = now; rec.bestRunMs = Math.max(rec.bestRunMs, now - rec.runStart + 100); rec.visibleMs += 100; }
      else { rec.runStart = null; if (cover && !rec.coveredBy) rec.coveredBy = cover; }
      // Screenshot once it has been covered for 300 ms (not the brief overlap while it slides in or out).
      rec.coverRun = cover && cover !== 'off screen' ? (rec.coverRun || 0) + 1 : 0;
      if (rec.coverRun >= 3 && !rec.hit) { rec.hit = true; if (window.__scorecardHit) window.__scorecardHit('toast-covered-' + rec.id); }
    }
    css.remove();
    for (const [el, rec] of live) if (!el.isConnected) { live.delete(el); rec.gone = now; }
    for (const b of document.querySelectorAll('[data-testid=primary-button]')) {
      // A busy primary (spinner while it works) isn't a disabled one.
      if (b.getAttribute('aria-disabled') !== 'true' || b.getAttribute('aria-busy') === 'true' || b.querySelector('[role=progressbar]') || !shown(b)) continue;
      const r = b.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      const text = (b.innerText || b.getAttribute('aria-label') || '').replace(/\\s+/g, ' ').trim();
      const key = location.pathname + '|' + text + '|' + where(b);
      if (sc.disabled.some((d) => d.key === key)) continue;
      const d = { key, task: sc.task, url: location.pathname, text, where: where(b), hint: b.getAttribute('aria-describedby') ? '' : (b.getAttribute('aria-description') || '') };
      sc.disabled.push(d);
      if (window.__scorecardHit) window.__scorecardHit('disabled-primary-' + sc.disabled.length);
    }
  }
  setInterval(sample, 100);
})();`;

/** A browser page set up like the scored runs. */
async function launch({ base, clock, scale, onHit, headless = true }) {
  const browser = await chromium.launch({ headless });
  const ctx = await browser.newContext({
    viewport: { width: 375, height: 667 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    timezoneId: 'Europe/London',
    locale: 'en-GB',
    geolocation: { latitude: 52.4862, longitude: -1.8904 },
    permissions: ['geolocation'],
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push({ text: m.text().slice(0, 400), url: safePath(page) }); });
  page.on('pageerror', (e) => errors.push({ text: 'Uncaught: ' + String(e).slice(0, 400), url: safePath(page) }));
  page.on('dialog', (d) => { errors.push({ text: `Unexpected ${d.type()} dialog: ${d.message()}`, url: safePath(page) }); d.dismiss().catch(() => {}); });
  // Thu 19 Nov 2026, local UK time (the reviews' date; the demo night is the next evening).
  await page.clock.install({ time: new Date(`2026-11-19T${clock}:00`) });
  await page.exposeBinding('__scorecardHit', async (_src, name) => { if (onHit) await onHit(name); });
  await page.addInitScript(PROBE);
  if (scale !== 1) await page.addInitScript(scalerScript(scale));
  await page.goto(base);
  return { browser, ctx, page, errors };
}

function safePath(page) {
  try { return new URL(page.url()).pathname; } catch { return ''; }
}

module.exports = { sleep, PACE, serve, launch, scalerScript, safePath };

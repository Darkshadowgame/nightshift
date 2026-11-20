// Review 21's checks (docs/REVIEW-21-scorecard.md, "Suggested new automated checks"; its path-to-10
// numbers in brackets). As in checks-more.cjs: page* functions run in the browser (self-contained:
// Playwright sends their source), check* functions run in Node and return findings
// ({ rule, message, boxes }). Judgement calls live in ./allow/*.json, each entry with a "why".
const fs = require('fs');
const path = require('path');

const ALLOW = (name) => JSON.parse(fs.readFileSync(path.join(__dirname, 'allow', name), 'utf8'));
const rx = (s, f = '') => new RegExp(s, f);
const box = (r) => ({ x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.w), h: Math.round(r.h) });
const at = (url) => url.replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g, '/:new');
const allowed = (file, f) => ALLOW(file).allow.some((a) => Object.entries(a).every(([k, v]) => k === 'why' || (f[k] != null && rx(v, 'i').test(String(f[k])))));

/* ------------------------------------------------------------------------------------------------
 * EDGE-LABEL (2, 8, 16): on every small map card, a 16 px band inside each of its own edges; no
 * map label or road shield shows there at more than 30% of its strength. EDGE (Review 19/20) looks
 * for a bright sliver in the outer 4 px; the fade hides that, but the rest of a cut word ("HFIELD",
 * "twood") or a label pressed against the edge still shows. Two looks at the band:
 *   1. with the edge fades off (the web map's CSS mask, MapEdgeFade): label pixels are grey-white
 *      and 50%+ of a label's brightness over the map (about 90 of 180 luminance above the map);
 *   2. as drawn: how much of each label pixel shows (its lift over the map, drawn over fade-off).
 * 20+ label pixels over 4+ rows (columns) showing at 30%+ fail. A wider, stronger fade, or labels
 * kept off the edge, pass.
 * ---------------------------------------------------------------------------------------------- */

const EDGE_BAND = 16;

/**
 * In the page: hide (true) or show (false) the edge fades on maps: the web map's CSS mask on its
 * container (NightMap.web.tsx EDGE_MASK) and MapEdgeFade's aria-hidden layer of gradients.
 */
function pageHideFades(hide) {
  if (!hide) {
    // Put back exactly what was there (React sets the mask inline).
    for (const [el, prev] of window.__scFades || []) { if (prev == null) el.removeAttribute('style'); else el.setAttribute('style', prev); }
    window.__scFades = [];
    return 0;
  }
  const maps = [...document.querySelectorAll('.leaflet-container')].map((m) => m.getBoundingClientRect());
  window.__scFades = [];
  for (const m of document.querySelectorAll('.leaflet-container')) {
    for (let e = m, i = 0; e && i < 4; e = e.parentElement, i++) {
      const s = getComputedStyle(e);
      if ((s.maskImage && s.maskImage !== 'none') || (s.webkitMaskImage && s.webkitMaskImage !== 'none')) {
        window.__scFades.push([e, e.getAttribute('style')]);
        e.style.setProperty('mask-image', 'none', 'important');
        e.style.setProperty('-webkit-mask-image', 'none', 'important');
      }
    }
  }
  for (const el of document.querySelectorAll('[aria-hidden=true]')) {
    if (el.closest('.leaflet-container') || !el.querySelector('linearGradient')) continue;
    const r = el.getBoundingClientRect();
    if (!maps.some((m) => r.x < m.right && r.right > m.x && r.y < m.bottom && r.bottom > m.y)) continue;
    window.__scFades.push([el, el.getAttribute('style')]);
    el.style.setProperty('visibility', 'hidden', 'important');
  }
  return window.__scFades.length;
}

/**
 * In the page: from the band without the fades (`off`) and as drawn (`on`), both PNG (base64), the
 * label pixels that show at 30%+. Only pixels where the map itself shows count: chips, buttons and
 * text laid over the map (the credit chip, "Tap to place") are masked out.
 */
async function pageEdgeLabel([off, on, band, side]) {
  const rect = (el) => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; };
  const inside = (r, x, y) => x >= r.x - 1 && x <= r.x + r.w + 1 && y >= r.y - 1 && y <= r.y + r.h + 1;
  const cx = band.x + band.w / 2; const cy = band.y + band.h / 2;
  const map = [...document.querySelectorAll('.leaflet-container')].find((m) => inside(rect(m), cx, cy));
  if (!map) return { n: 0, along: 0, cut: 0, peak: 0 };
  const mr = rect(map);
  // Chrome over the map: elements outside it, not its parents, drawing text or a backing, smaller than it.
  const chrome = [];
  for (const el of document.body.querySelectorAll('*')) {
    if (map.contains(el) || el.contains(map) || el.closest('[inert],[aria-hidden=true]')) continue;
    const r = rect(el);
    if (!r.w || !r.h || r.x > band.x + band.w || r.x + r.w < band.x || r.y > band.y + band.h || r.y + r.h < band.y) continue;
    if (r.w * r.h >= mr.w * mr.h * 0.6) continue;
    const s = getComputedStyle(el);
    const own = [...el.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim());
    const backed = !/^(rgba\(0, 0, 0, 0\)|transparent)$/.test(s.backgroundColor);
    if (own || backed) chrome.push(r);
  }
  const vertical = side === 'left' || side === 'right';
  async function read(b64) {
    const img = new Image();
    img.src = `data:image/png;base64,${b64}`;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = img.width; c.height = img.height;
    const g = c.getContext('2d');
    g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, c.width, c.height).data;
    const k = c.width / band.w;
    const px = [];
    for (let i = 0; i < d.length; i += 4) {
      const x = (i / 4) % c.width; const y = Math.floor(i / 4 / c.width);
      const qx = band.x + x / k; const qy = band.y + y / k;
      if (!inside(mr, qx, qy) || chrome.some((r) => inside(r, qx, qy))) continue;
      const depth = side === 'left' ? x : side === 'right' ? c.width - 1 - x : side === 'top' ? y : c.height - 1 - y;
      px.push({ depth, along: vertical ? y : x, l: 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2], sat: Math.max(d[i], d[i + 1], d[i + 2]) - Math.min(d[i], d[i + 1], d[i + 2]) });
    }
    // The map's own background at each depth (a fade darkens it towards the edge): the median.
    const byDepth = new Map();
    for (const p of px) { if (!byDepth.has(p.depth)) byDepth.set(p.depth, []); byDepth.get(p.depth).push(p.l); }
    const base = new Map([...byDepth].map(([dp, ls]) => { ls.sort((a, b) => a - b); return [dp, ls[Math.floor(ls.length / 2)]]; }));
    // A label is about 180 luminance brighter than the map under it (white over a 60 background):
    // its opacity is how much of that it shows. Labels are grey-white, roads tinted.
    for (const p of px) p.op = p.sat > 30 ? 0 : (p.l - base.get(p.depth)) / 180;
    return { px, k };
  }
  const A = await read(off);
  const B = await read(on);
  if (A.px.length !== B.px.length) return { n: 0, along: 0, peak: 0 };
  let n = 0; let peak = 0;
  const along = new Set();
  for (let i = 0; i < A.px.length; i++) {
    const a = A.px[i]; const b = B.px[i];
    if (a.op < 0.5) continue; // not a label pixel
    // How much of it shows as drawn: its lift over the map as drawn, over its lift with no fade.
    const shows = b.op / a.op;
    if (shows < 0.3) continue;
    n++; along.add(a.along); peak = Math.max(peak, shows);
  }
  return { n, along: along.size, peak: Math.round(Math.min(peak, 1) * 100) };
}

/** The band rect for one edge of a small map ({ clip } from pageMaps), EDGE_BAND px deep. */
function edgeBand(m, side) {
  const x0 = Math.ceil(m.clip.x); const y0 = Math.ceil(m.clip.y);
  const w = Math.floor(m.clip.w) - 1; const h = Math.floor(m.clip.h) - 1;
  const d = EDGE_BAND;
  if (side === 'top') return { x: x0, y: y0, w, h: d };
  if (side === 'bottom') return { x: x0, y: Math.floor(m.clip.y + m.clip.h) - d, w, h: d };
  if (side === 'left') return { x: x0, y: y0, w: d, h };
  return { x: Math.floor(m.clip.x + m.clip.w) - d, y: y0, w: d, h };
}

function checkEdgeLabel(b, url, side, band) {
  // A label's glyph or a shield is 20+ device pixels over 4+ rows (columns); an anti-aliased speck isn't.
  if (b.n < 20 || b.along < 4) return [];
  if (allowed('edge-label.json', { url, side })) return [];
  return [{ rule: 'EDGE-LABEL', message: `on ${at(url)}, a map label or road shield shows within ${EDGE_BAND} px of the small map's ${side} edge, cut by it or pressed against it (${b.n} label pixels at up to ${b.peak}% strength; 30% is the most). Widen and strengthen the edge fade, or keep labels off the edge`, boxes: [band] }];
}

/* ------------------------------------------------------------------------------------------------
 * HEADER-TITLE (11; rule 4.1): a header title is either a caps title (tab, form, settings, list) or,
 * on a detail screen, the compact copy of a hero title that has scrolled away. A content-case title
 * with no hero above it (the route preview's "Leisure park car park") breaks 4.1, and so does the
 * compact copy while its hero is still on screen.
 * ---------------------------------------------------------------------------------------------- */

/** In the page: the header title on show (text 15 px or larger in the top bar, not a button), and its copies. */
function pageHeaderTitle() {
  const shown = (el) => !el.closest('[inert]') && (!el.checkVisibility || el.checkVisibility({ opacityProperty: true, visibilityProperty: true }));
  const opacity = (el) => { let o = 1; for (let e = el; e && e.nodeType === 1; e = e.parentElement) o *= parseFloat(getComputedStyle(e).opacity || '1'); return o; };
  const norm = (s) => s.replace(/\s+/g, ' ').trim();
  if (document.querySelector('[data-testid=sheet]')) return null; // a sheet's title isn't the header's
  const texts = [];
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = w.nextNode(); n; n = w.nextNode()) {
    const el = n.parentElement;
    if (!n.textContent.trim() || !el || !shown(el) || el.closest('[data-testid=toast],.leaflet-container')) continue;
    texts.push({ el, text: norm(n.textContent) });
  }
  const back = [...document.querySelectorAll('[aria-label="Go back"]')].find((b) => shown(b) && b.getBoundingClientRect().width > 0 && b.getBoundingClientRect().y < 40);
  const bar = back ? back.getBoundingClientRect().bottom + 6 : 60;
  let title = null;
  for (const t of texts) {
    const r = t.el.getBoundingClientRect();
    const s = getComputedStyle(t.el);
    if (r.width === 0 || r.y < 0 || r.y + r.height / 2 > bar || parseFloat(s.fontSize) < 15 || opacity(t.el) < 0.5) continue;
    if (t.el.closest('[role=button],button,[role=tab],[role=search],a')) continue;
    title = { text: t.text, caps: s.textTransform === 'uppercase' || t.text === t.text.toUpperCase(), size: parseFloat(s.fontSize), r: { x: r.x, y: r.y, w: r.width, h: r.height }, el: t.el };
    break;
  }
  if (!title) return null;
  // A hero title: the same words, as a heading or in large type (a card's caption line isn't one).
  const hero = (el) => !!el.closest('[role=heading]') || parseFloat(getComputedStyle(el).fontSize) >= 20;
  const copies = texts.filter((t) => t.el !== title.el && t.text.toLowerCase() === title.text.toLowerCase() && hero(t.el)).map((t) => {
    const r = t.el.getBoundingClientRect();
    return { onScreen: r.bottom > bar && r.top < innerHeight, r: { x: r.x, y: r.y, w: r.width, h: r.height } };
  });
  delete title.el;
  return { ...title, back: !!back, copies };
}

function checkHeaderTitle(h, url) {
  if (!h || h.caps) return [];
  if (allowed('header-title.json', { url, text: h.text })) return [];
  const where = `on ${at(url)}`;
  if (!h.copies.length) return [{ rule: 'HEADER-TITLE', message: `${where}, the header title "${h.text}" (${Math.round(h.size)} px) is in content case and isn't a copy of a hero title that has scrolled away (4.1: detail screens have no header title; forms and settings a caps title). Drop it, or make it a caps title`, boxes: [box(h.r)] }];
  const on = h.copies.find((c) => c.onScreen);
  if (on) return [{ rule: 'HEADER-TITLE', message: `${where}, the header shows "${h.text}" while the hero title is still on screen: the compact title says it twice (4.1 note)`, boxes: [box(h.r), box(on.r)] }];
  return [];
}

/* ------------------------------------------------------------------------------------------------
 * PHOTO-CONTRAST (3): text over a photo (a card's type label, a hero title) meets WCAG AA against
 * the photo pixels behind it: 4.5:1, or 3:1 for large text (24 px, or 18.7 px bold). The text is
 * made transparent for one screenshot (its shadow stays: it is a backing); its contrast with each
 * pixel behind its glyph boxes is worked out, and the 10th percentile must pass (one bright spot
 * under a letter is enough to lose it).
 * ---------------------------------------------------------------------------------------------- */

/**
 * In the page: text drawn over a photo (a background-image or <img> 80 x 60 or larger, not a map),
 * with no opaque backing of its own between it and the photo. Marks each with data-sc-ph and hides
 * the glyphs (color transparent) for the screenshot; pageContrast reads it and puts them back.
 */
async function pagePhotoText() {
  const shown = (el) => !el.closest('[inert]') && (!el.checkVisibility || el.checkVisibility({ opacityProperty: true, visibilityProperty: true }));
  const rect = (el) => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; };
  const opacity = (el) => { let o = 1; for (let e = el; e && e.nodeType === 1; e = e.parentElement) o *= parseFloat(getComputedStyle(e).opacity || '1'); return o; };
  const alpha = (bg) => { const m = bg.match(/rgba?\(([^)]*)\)/); const p = m ? m[1].split(',') : []; return p.length === 4 ? parseFloat(p[3]) : p.length ? 1 : 0; };
  document.querySelectorAll('[data-sc-ph]').forEach((e) => e.removeAttribute('data-sc-ph'));
  const photos = [];
  for (const el of document.body.querySelectorAll('div,img')) {
    if (el.closest('.leaflet-container,[inert]')) continue;
    const s = getComputedStyle(el);
    const isPhoto = el.tagName === 'IMG' ? el.naturalWidth > 0 : /url\(/.test(s.backgroundImage);
    if (!isPhoto || !shown(el)) continue;
    const r = rect(el);
    if (r.w < 80 || r.h < 60) continue;
    photos.push({ el, r });
  }
  if (!photos.length) return [];
  const out = [];
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = w.nextNode(); n; n = w.nextNode()) {
    const el = n.parentElement;
    if (!n.textContent.trim() || !el || !shown(el) || el.closest('[data-testid=toast],.leaflet-container,[data-sc-ph]')) continue;
    if (opacity(el) < 0.5) continue;
    const rg = document.createRange();
    rg.selectNodeContents(n);
    const boxes = [...rg.getClientRects()].filter((q) => q.width > 1 && q.height > 1).map((q) => ({ x: q.x, y: q.y, w: q.width, h: q.height }));
    if (!boxes.length) continue;
    const b0 = boxes[0];
    if (b0.y < 0 || b0.y + b0.h > innerHeight || b0.x < 0 || b0.x + b0.w > innerWidth) continue;
    const cx = b0.x + b0.w / 2; const cy = b0.y + b0.h / 2;
    const photo = photos.find((p) => cx > p.r.x && cx < p.r.x + p.r.w && cy > p.r.y && cy < p.r.y + p.r.h && !p.el.contains(el));
    if (!photo) continue;
    // Its own backing (a chip, a card) between the text and the photo: then it isn't on the photo.
    let backed = false;
    for (let p = el; p && !p.contains(photo.el); p = p.parentElement) {
      const s = getComputedStyle(p);
      if (alpha(s.backgroundColor) >= 0.85 || (p !== el && /blur/.test(s.backdropFilter || s.webkitBackdropFilter || ''))) { backed = true; break; }
    }
    if (backed) continue;
    // The text is on top at its centre (nothing drawn over it: a sheet, the crop screen), made
    // hit-testable for the moment.
    const pe = [el.style.getPropertyValue('pointer-events'), el.style.getPropertyPriority('pointer-events')];
    el.style.setProperty('pointer-events', 'auto', 'important');
    const first = document.elementFromPoint(cx, cy);
    if (pe[0]) el.style.setProperty('pointer-events', pe[0], pe[1]); else el.style.removeProperty('pointer-events');
    if (!first || !el.contains(first)) continue;
    const s = getComputedStyle(el);
    const fs = parseFloat(s.fontSize);
    const bold = parseInt(s.fontWeight, 10) >= 700;
    el.setAttribute('data-sc-ph', String(out.length));
    out.push({ text: n.textContent.replace(/\s+/g, ' ').trim().slice(0, 60), color: s.color, large: fs >= 24 || (bold && fs >= 18.66), size: fs, boxes, idx: out.length, node: n });
  }
  // Still: text that moved in 150 ms (a card animating in) is left for a later screen.
  if (out.length) await new Promise((r) => setTimeout(r, 150));
  for (const it of out) {
    const rg = document.createRange();
    rg.selectNodeContents(it.node);
    const q = rg.getClientRects()[0];
    it.moving = !q || Math.abs(q.x - it.boxes[0].x) > 0.5 || Math.abs(q.y - it.boxes[0].y) > 0.5;
    if (it.moving) it.node.parentElement.removeAttribute('data-sc-ph');
    delete it.node;
  }
  if (out.some((it) => !it.moving)) {
    const st = document.createElement('style');
    st.id = '__sc_ph';
    st.textContent = '[data-sc-ph]{color:transparent!important;-webkit-text-fill-color:transparent!important}';
    document.head.appendChild(st);
  }
  return out.filter((it) => !it.moving);
}

/** In the page: from a viewport screenshot (PNG) taken with the text hidden, each text's contrast. */
async function pageContrast([b64, items]) {
  const st = document.getElementById('__sc_ph');
  if (st) st.remove();
  const img = new Image();
  img.src = `data:image/png;base64,${b64}`;
  await img.decode();
  const c = document.createElement('canvas');
  c.width = img.width; c.height = img.height;
  const g = c.getContext('2d');
  g.drawImage(img, 0, 0);
  const k = img.width / innerWidth;
  const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  const lum = (r, gg, b) => 0.2126 * lin(r) + 0.7152 * lin(gg) + 0.0722 * lin(b);
  const out = [];
  for (const it of items) {
    const m = it.color.match(/rgba?\(([^)]*)\)/);
    const p = m ? m[1].split(',').map(parseFloat) : [255, 255, 255, 1];
    const a = p.length === 4 ? p[3] : 1;
    const ratios = [];
    for (const bx of it.boxes) {
      const x0 = Math.max(0, Math.floor(bx.x * k)); const y0 = Math.max(0, Math.floor(bx.y * k));
      const w = Math.min(c.width - x0, Math.ceil(bx.w * k)); const h = Math.min(c.height - y0, Math.ceil(bx.h * k));
      if (w <= 0 || h <= 0) continue;
      const d = g.getImageData(x0, y0, w, h).data;
      // The middle 70% of the line box: where the glyphs are, not the gap above and below.
      for (let y = Math.floor(h * 0.15); y < Math.ceil(h * 0.85); y++) {
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) * 4;
          // The text colour over this pixel (a translucent colour is mixed with what's behind).
          const tl = lum(p[0] * a + d[i] * (1 - a), p[1] * a + d[i + 1] * (1 - a), p[2] * a + d[i + 2] * (1 - a));
          const bl = lum(d[i], d[i + 1], d[i + 2]);
          ratios.push((Math.max(tl, bl) + 0.05) / (Math.min(tl, bl) + 0.05));
        }
      }
    }
    if (!ratios.length) continue;
    ratios.sort((x, y) => x - y);
    out.push({ idx: it.idx, p10: ratios[Math.floor(ratios.length * 0.1)], median: ratios[Math.floor(ratios.length / 2)] });
  }
  document.querySelectorAll('[data-sc-ph]').forEach((e) => e.removeAttribute('data-sc-ph'));
  return out;
}

function checkContrast(items, results, url) {
  const out = [];
  for (const r of results) {
    const it = items.find((x) => x.idx === r.idx);
    const need = it.large ? 3 : 4.5;
    if (r.p10 >= need) continue;
    if (allowed('contrast.json', { url, text: it.text })) continue;
    out.push({ rule: 'PHOTO-CONTRAST', message: `on ${at(url)}, "${it.text}" (${Math.round(it.size)} px) over a photo has ${r.p10.toFixed(1)}:1 contrast behind 10% of it (median ${r.median.toFixed(1)}:1; WCAG AA needs ${need}:1${it.large ? ', large text' : ''}). Put a scrim or a dark chip under it`, boxes: it.boxes.map(box) });
  }
  return out;
}

/* ------------------------------------------------------------------------------------------------
 * TOAST-OVER-CHANGE (26): a toast doesn't land on the change it confirms (the voted card with
 * "✓ Your vote", the new "Cold air intake" row). A watcher started before the tap samples every
 * 100 ms: the toast's box against the changed thing's box.
 * ---------------------------------------------------------------------------------------------- */

/** `where`: 'sheet' when the change is in the open sheet (the vote), 'page' when it's on the page under it. */
function watchToastOver([name, pattern, where, ms]) {
  const re = new RegExp(pattern, 'i');
  const st = (window.__scTo = window.__scTo || {})[name] = { seen: false, toast: false, worst: 0, boxes: [], text: '', toastText: '', hit: false, done: false };
  const end = Date.now() + ms;
  const shown = (el) => !el.closest('[inert]') && (!el.checkVisibility || el.checkVisibility({ opacityProperty: true, visibilityProperty: true }));
  const rect = (el) => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; };
  const inter = (a, b) => {
    const x = Math.max(a.x, b.x); const y = Math.max(a.y, b.y);
    const w = Math.min(a.x + a.w, b.x + b.w) - x; const h = Math.min(a.y + a.h, b.y + b.h) - y;
    return w > 0 && h > 0 ? { x, y, w, h } : null;
  };
  let run = 0;
  const iv = setInterval(() => {
    if (Date.now() > end) { clearInterval(iv); st.done = true; return; }
    const toasts = [...document.querySelectorAll('[data-testid=toast]')].filter((t) => shown(t) && rect(t).w > 0);
    let target = null;
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = w.nextNode(); n; n = w.nextNode()) {
      const el = n.parentElement;
      if (!el || !re.test(n.textContent) || el.closest('[data-testid=toast],[inert]') || !shown(el)) continue;
      if (!!el.closest('[data-testid=sheet]') !== (where === 'sheet')) continue;
      // The thing that changed: its row or card (the button it's in, else a few parents up).
      let row = el.closest('[role=button],[role=radio],[role=checkbox]');
      if (!row) { row = el; for (let i = 0; i < 3 && row.parentElement; i++) row = row.parentElement; }
      const r = rect(row);
      if (r.w === 0 || r.y + r.h <= 0 || r.y >= innerHeight) continue;
      target = { r, text: n.textContent.replace(/\s+/g, ' ').trim() };
      break;
    }
    if (target) { st.seen = true; st.text = target.text; }
    if (toasts.length) st.toast = true;
    let over = 0; let boxes = [];
    if (target) {
      for (const t of toasts) {
        const tr = rect(t);
        const i = inter(tr, target.r);
        if (i && i.w * i.h > over) { over = i.w * i.h; boxes = [tr, target.r]; st.toastText = (t.innerText || '').replace(/\s+/g, ' ').trim(); }
      }
    }
    // A few pixels of a shadow or border aren't covering it.
    run = over >= 40 ? run + 1 : 0;
    if (over >= 40 && over > st.worst) { st.worst = over; st.boxes = boxes; }
    if (run >= 3 && !st.hit) { st.hit = true; if (window.__scorecardHit) window.__scorecardHit('toast-over-' + name); }
  }, 100);
}

function checkToastOver(st, what, task) {
  if (!st) return [];
  if (!st.seen) return [{ rule: 'TOAST-OVER-CHANGE', message: `${what} (task ${task}): the change it confirms never showed on screen while it was watched` }];
  if (!st.hit) return [];
  return [{ rule: 'TOAST-OVER-CHANGE', message: `${what} (task ${task}): the toast "${st.toastText}" lands on "${st.text}", the change it confirms (${Math.round(st.worst)} px² covered). Put the toast above the ActionBar or tab bar, and scroll the change clear of it`, boxes: st.boxes.map(box) }];
}

/* ------------------------------------------------------------------------------------------------
 * DOT-WRAP (10, 13, 14): no rendered line ends with "·", and no line is a lone unit ("mi", "bhp",
 * "bikes"), at 1.0x and 1.3x. Lines come from the glyphs' own boxes, so a meta line that wraps as
 * "BMW M4 Competition ·" / "583 bhp" is caught wherever it sits.
 * ---------------------------------------------------------------------------------------------- */

const LONE_UNIT = /^(mi|km|miles?|bhp|whp|hp|ps|cars?|bikes?|mins?|going)[,.]?$/i;

function pageWraps() {
  const shown = (el) => !el.closest('[inert]') && (!el.checkVisibility || el.checkVisibility({ opacityProperty: true, visibilityProperty: true }));
  document.querySelectorAll('[data-sc-wrap]').forEach((e) => e.removeAttribute('data-sc-wrap'));
  const blocks = new Set();
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = w.nextNode(); n; n = w.nextNode()) {
    const el = n.parentElement;
    if (!n.textContent.trim() || !el || el.closest('script,style,svg,.leaflet-container') || !shown(el)) continue;
    // Its block: the nearest parent that isn't inline (nested Text is inline on the web).
    let b = el;
    while (b.parentElement && getComputedStyle(b).display === 'inline') b = b.parentElement;
    blocks.add(b);
  }
  const out = [];
  for (const b of blocks) {
    const r = b.getBoundingClientRect();
    const s = getComputedStyle(b);
    const lh = parseFloat(s.lineHeight) || parseFloat(s.fontSize) * 1.3;
    if (r.width === 0 || r.height < lh * 1.5) continue; // one line
    // Every glyph, in order, with its line.
    const lines = [];
    const tw = document.createTreeWalker(b, NodeFilter.SHOW_TEXT);
    for (let n = tw.nextNode(); n; n = tw.nextNode()) {
      const t = n.textContent;
      for (let i = 0; i < t.length; i++) {
        const rg = document.createRange();
        rg.setStart(n, i); rg.setEnd(n, i + 1);
        const q = rg.getClientRects()[0];
        if (!q) { if (lines.length) lines[lines.length - 1].text += t[i]; continue; }
        let line = lines[lines.length - 1];
        if (!line || Math.abs(q.top - line.top) > q.height / 2) { line = { top: q.top, text: '', r: { x: q.x, y: q.y, w: 0, h: q.height } }; lines.push(line); }
        line.text += t[i];
        line.r.w = Math.max(line.r.w, q.right - line.r.x);
      }
    }
    if (lines.length < 2) continue;
    const L = lines.map((l) => ({ ...l, text: l.text.replace(/\s+/g, ' ').trim() }));
    for (let i = 0; i < L.length; i++) {
      const dot = i < L.length - 1 && /·$/.test(L[i].text);
      // A unit torn from its number: the line before ends in the number.
      const lone = i > 0 && /\d$/.test(L[i - 1].text) && /^(mi|km|miles?|bhp|whp|hp|ps|cars?|bikes?|mins?|going)[,.]?$/i.test(L[i].text);
      if (!dot && !lone) continue;
      b.setAttribute('data-sc-wrap', String(out.length));
      out.push({
        kind: dot ? 'dot' : 'unit',
        lines: [L[i - (lone ? 1 : 0)].text, L[i + (dot ? 1 : 0)].text],
        whole: L.map((l) => l.text).join(' '),
        r: { x: r.x, y: r.y, w: r.width, h: r.height },
        idx: out.length,
      });
      break;
    }
  }
  return out;
}

function checkWraps(list, url, scale) {
  const out = [];
  for (const x of list) {
    if (allowed('wrap.json', { url, text: x.whole, scale })) continue;
    const msg = x.kind === 'dot'
      ? `a line ends with "·": "${x.lines[0]}" / "${x.lines[1]}". Break at the dot (drop it at a line end) or keep the line whole`
      : `a lone unit on its own line: "${x.lines[0]}" / "${x.lines[1]}". Keep the number and its unit together (a no-break space)`;
    out.push({ rule: 'DOT-WRAP', message: `on ${at(url)} at ${scale === 1 ? '1.0' : scale}x, ${msg}`, boxes: [box(x.r)], idx: x.idx, y: x.r.y });
  }
  return out;
}

/* ------------------------------------------------------------------------------------------------
 * VOTE-RESULT (12): in the demo, after your vote the result isn't simply your pick: either another
 * build won, or the result shows a split with yours as one of several builds with votes.
 * ---------------------------------------------------------------------------------------------- */

/** In the page: the builds offered in the vote sheet (each button's first label part). */
function pageVoteChoices() {
  const sheet = document.querySelector('[data-testid=sheet]');
  if (!sheet) return [];
  return [...sheet.querySelectorAll('[role=button][aria-label],[role=radio][aria-label]')]
    .map((b) => b.getAttribute('aria-label').split(',')[0].trim())
    .filter((s) => /\s/.test(s) && !/^(done|close)/i.test(s));
}

/** In the page: the event page's result after the vote: trophy covers, and every line or label with a vote count. */
function pageVoteResult() {
  const shown = (el) => !el.closest('[inert],[data-testid=sheet],[data-testid=toast]') && (!el.checkVisibility || el.checkVisibility({ opacityProperty: true, visibilityProperty: true }));
  const covers = [...document.querySelectorAll('[aria-label^="Cover:"]')].filter(shown).map((el) => el.getAttribute('aria-label'));
  const lines = [];
  for (const el of document.querySelectorAll('[aria-label]')) if (shown(el) && /\d/.test(el.getAttribute('aria-label'))) lines.push(el.getAttribute('aria-label'));
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = w.nextNode(); n; n = w.nextNode()) if (n.parentElement && shown(n.parentElement) && /\d/.test(n.textContent)) lines.push(n.textContent.replace(/\s+/g, ' ').trim());
  return { covers, lines };
}

function checkVoteResult(pick, choices, res) {
  if (!pick || !res) return [];
  const name = (s) => s.toLowerCase();
  const winner = res.covers.map((c) => c.replace(/^Cover:\s*[^,]*,\s*/, '')).find(Boolean)
    || (res.lines.find((l) => /^Best car: /.test(l)) || '').split(', ')[1] || '';
  if (!winner) return [{ rule: 'VOTE-RESULT', message: 'after your vote (task 6), the event page shows no winner to compare with your pick' }];
  if (!name(winner).includes(name(pick)) && !name(pick).includes(name(winner))) return [];
  // A split: two or more of the builds on offer named with a number (their votes).
  const named = new Set();
  for (const c of choices) for (const l of res.lines) if (name(l).includes(name(c)) && /\b\d+\s*(votes?)?\b/.test(l.replace(c, ''))) named.add(c);
  if (named.size >= 2) return [];
  return [{ rule: 'VOTE-RESULT', message: `you voted for the ${pick} (task 6) and the demo's result crowns it ("${winner}"), with no split shown: it reads as "my vote decided it". Use a fixed demo winner, or show the split ("Focus RS 3 · M4 2 · yours 1")` }];
}

/* ------------------------------------------------------------------------------------------------
 * WORDS-SHEET (19): the "event" scan on every sheet the run opens (the probe in lib.cjs keeps each
 * sheet's text and control labels as it's shown), Layers included. Sheet text is checked here,
 * not by WORDS, so a sheet's word is reported once.
 * ---------------------------------------------------------------------------------------------- */

function checkSheetWords(sheets, words, allowWord) {
  const out = [];
  const seen = new Set();
  for (const s of sheets) {
    for (const line of [...s.lines, ...s.labels]) {
      for (const b of words) {
        if (!b.re.test(line) || allowWord(b.word, line, s.url)) continue;
        const msg = `"${b.word}" in the sheet "${s.title}" (${s.task || 'start'}, ${at(s.url)}): "${line.slice(0, 90)}"; the app says "meet"`;
        if (seen.has(msg)) continue;
        seen.add(msg);
        out.push({ rule: 'WORDS-SHEET', task: s.task, sheetId: s.id, message: msg });
      }
    }
  }
  return out;
}

/* ------------------------------------------------------------------------------------------------
 * DIST-ORIGIN (20; rule 4.9): every distance on every screen names its origin ("from home", "from
 * you"). HOME-DIST checks the distances from home on four screens; this checks all of them, People
 * near you included. A route's length ("2.9 mi drive") and a radius are named in allow/dist.json.
 * ---------------------------------------------------------------------------------------------- */

const ORIGIN = /\bfrom (home|you|your|here|the phone|where you are)\b|\baway\b/i;

function checkDistOrigin(d, url) {
  const bad = d.list.filter((x) => !ORIGIN.test(x.text) && !ORIGIN.test(x.row) && !allowed('dist.json', { url, text: x.text, row: `${x.row} ${x.text}` }));
  if (!bad.length) return [];
  const texts = [...new Set(bad.map((x) => x.text))];
  return [{
    rule: 'DIST-ORIGIN',
    message: `on ${at(url)}, ${texts.slice(0, 4).map((t) => `"${t}"`).join(', ')}${texts.length > 4 ? ` and ${texts.length - 4} more` : ''} ${texts.length > 1 ? 'say' : 'says'} a distance with no origin (4.9: "8 mi from you", "2 mi from home")`,
    boxes: bad.filter((x) => x.r.y > -20 && x.r.y < 700).slice(0, 8).map((x) => box(x.r)),
  }];
}

/* ------------------------------------------------------------------------------------------------
 * POWER-ONE (21; K5): a post's text doesn't give its build a second power figure ("470 at the
 * hubs" under "Audi RS3 8V · 395 bhp"). Power lives on the build line, once.
 * ---------------------------------------------------------------------------------------------- */

/** In the page: power figures in post text, with the build line's bhp from the same post. */
function pagePostPower() {
  const shown = (el) => !el.closest('[inert]') && (!el.checkVisibility || el.checkVisibility({ opacityProperty: true, visibilityProperty: true }));
  const POWER = /\b(\d{2,4})\s*(?:bhp|whp|hp|ps|horses?)\b|\b(\d{2,4})\s+(?:at the (?:hubs|wheels|fly(?:wheel)?|crank)|on the (?:rollers|dyno))\b/i;
  const BUILD = /·\s*(\d{2,4})\s*bhp\b/;
  const out = [];
  document.querySelectorAll('[data-sc-post]').forEach((e) => e.removeAttribute('data-sc-post'));
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = w.nextNode(); n; n = w.nextNode()) {
    const el = n.parentElement;
    const t = n.textContent.replace(/\s+/g, ' ').trim();
    if (!el || !shown(el) || BUILD.test(t)) continue;
    const m = t.match(POWER);
    if (!m) continue;
    // The post: the nearest parent (up to 8) holding a build line.
    let post = null; let build = null;
    for (let p = el.parentElement, i = 0; p && i < 8 && !post; p = p.parentElement, i++) {
      const bw = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
      for (let q = bw.nextNode(); q; q = bw.nextNode()) { const bm = q.textContent.match(BUILD); if (bm) { post = p; build = { line: q.textContent.replace(/\s+/g, ' ').trim(), bhp: Number(bm[1]) }; break; } }
    }
    if (!post) continue;
    const r = post.getBoundingClientRect();
    post.setAttribute('data-sc-post', String(out.length));
    out.push({ idx: out.length, text: t.slice(0, 120), figure: Number(m[1] || m[2]), said: m[0], build, r: { x: r.x, y: r.y, w: r.width, h: r.height } });
  }
  return out;
}

function checkPostPower(list, url) {
  return list
    .filter((p) => p.figure !== p.build.bhp && !allowed('power.json', { url, text: p.text }))
    .map((p) => ({ rule: 'POWER-ONE', revealSel: `[data-sc-post="${p.idx}"]`, message: `on ${at(url)}, a post says "${p.said}" ("${p.text}") under "${p.build.line}": two power numbers for one build (K5). Drop the figure, or make it agree`, boxes: [box(p.r)] }));
}

/* ------------------------------------------------------------------------------------------------
 * YOU-MARKER (6): after Show where I am, a you-marker is drawn inside Tonight's map. It's found by
 * its label ("You are here", "Your location", ...) or `data-testid=you-marker`, inside the map.
 * ---------------------------------------------------------------------------------------------- */

function pageYouMarker() {
  const rect = (el) => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; };
  const map = [...document.querySelectorAll('.leaflet-container')].find((m) => !m.closest('[inert]') && rect(m).w > 0);
  if (!map) return { map: false };
  const mr = rect(map);
  const YOU = /\b(you are here|your location|where you are|you)\b/i;
  const found = [];
  for (const el of map.querySelectorAll('[data-testid=you-marker],[aria-label],[title],.leaflet-marker-icon')) {
    const label = el.getAttribute('data-testid') === 'you-marker' ? 'you-marker' : (el.getAttribute('aria-label') || el.getAttribute('title') || '');
    if (!label || (label !== 'you-marker' && !YOU.test(label))) continue;
    if (/\bnear you\b|\bfor you\b|\bfrom you\b/i.test(label)) continue;
    const r = rect(el);
    const cx = r.x + r.w / 2; const cy = r.y + r.h / 2;
    found.push({ label, inside: r.w > 0 && cx > mr.x && cx < mr.x + mr.w && cy > mr.y && cy < mr.y + mr.h });
  }
  return { map: true, mr, found };
}

function checkYouMarker(y) {
  if (!y || !y.map) return [{ rule: 'YOU-MARKER', message: 'after Show where I am, no map on show to check for a you-marker' }];
  if (y.found.some((f) => f.inside)) return [];
  return [{ rule: 'YOU-MARKER', message: `after Show where I am on Tonight's map, no you-marker is drawn inside the map${y.found.length ? ` (one labelled "${y.found[0].label}" is outside it)` : ''}: draw one (labelled "You are here", or testID you-marker) and fit you and the nearest meets`, boxes: [box(y.mr)] }];
}

/* ------------------------------------------------------------------------------------------------
 * SHEET-PIN (7): on Tonight's map a meet pin under the lowered MapSheet (testID map-sheet) is as
 * good as cut: fit the pins with bottom padding equal to the sheet.
 * ---------------------------------------------------------------------------------------------- */

function pageSheetPins() {
  const rect = (el) => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; };
  const sheet = [...document.querySelectorAll('[data-testid=map-sheet]')].find((s) => !s.closest('[inert]') && s.getAttribute('aria-hidden') !== 'true' && rect(s).w > 0);
  const map = [...document.querySelectorAll('.leaflet-container')].find((m) => !m.closest('[inert]') && rect(m).w > 0);
  if (!sheet || !map) return null;
  const sr = rect(sheet); const mr = rect(map);
  if (sr.y >= mr.y + mr.h - 1) return null; // the sheet is off the map
  const out = [];
  for (const m of map.querySelectorAll('.leaflet-marker-icon[aria-label]')) {
    const r = rect(m);
    if (r.w < 4) continue;
    const cx = r.x + r.w / 2;
    // Inside the map's own frame (Leaflet keeps far-off pins in the DOM past its edges).
    if (cx < mr.x || cx > mr.x + mr.w || r.y + r.h < mr.y || r.y > mr.y + mr.h) continue;
    if (r.y + r.h > sr.y + 2 && cx > sr.x && cx < sr.x + sr.w) out.push({ label: m.getAttribute('aria-label'), r, under: r.y >= sr.y });
  }
  return { sheet: sr, pins: out };
}

function checkSheetPins(s, url, size = '') {
  if (!s || !s.pins.length) return [];
  return s.pins
    .filter((p) => !allowed('map.json', { subject: `pin "${p.label}"`, obstacle: 'sheet' }))
    .map((p) => ({ rule: 'SHEET-PIN', message: `on ${at(url)}${size}, the pin "${p.label}" is ${p.under ? 'under' : 'cut by'} the lowered map sheet; fit the pins with bottom padding for the sheet`, boxes: [box(p.r), box({ ...s.sheet, h: Math.min(s.sheet.h, 40) })] }));
}

module.exports = {
  EDGE_BAND, pageHideFades, pageEdgeLabel, edgeBand, checkEdgeLabel, pageHeaderTitle, checkHeaderTitle, pagePhotoText, pageContrast, checkContrast,
  watchToastOver, checkToastOver, pageWraps, checkWraps, LONE_UNIT, pageVoteChoices, pageVoteResult, checkVoteResult, checkSheetWords,
  ORIGIN, checkDistOrigin, pagePostPower, checkPostPower, pageYouMarker, checkYouMarker, pageSheetPins, checkSheetPins,
};

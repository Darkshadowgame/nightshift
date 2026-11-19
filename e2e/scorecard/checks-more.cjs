// More rule checks, from Review 19's "What e2e/scorecard could catch" (docs/REVIEW-19-scorecard.md).
// The page* functions run in the browser (self-contained: Playwright sends their source); the
// check* functions run in Node and turn what they found into findings ({ rule, message, boxes }).
// `boxes` are viewport rects the runner outlines in red on the finding's screenshot.
// Judgement calls live in ./allow/*.json, each entry with a "why".
const fs = require('fs');
const path = require('path');

const ALLOW = (name) => JSON.parse(fs.readFileSync(path.join(__dirname, 'allow', name), 'utf8'));
const rx = (s, f = '') => new RegExp(s, f);
const box = (r) => ({ x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.w), h: Math.round(r.h) });

/* ------------------------------------------------------------------------------------------------
 * MAP (26, 15, 42): on every map, pins, the route's end and text printed over the map stay clear of
 * the credit chips and the map's buttons; no meet pin is cut by the map's edge.
 * ---------------------------------------------------------------------------------------------- */

/**
 * In the page: for each map on show, what sits on it.
 * - obstacles: credit chips (text starting "©") and buttons up to 72 px that sit straight on the
 *   map (what's under them is the map, not a sheet or card);
 * - subjects: markers, the route's end (last point of each route line), and text over the map
 *   (straight on it, or on a small chip of its own);
 * - overlaps between the two, and labelled pins cut by the map's edge.
 * Only what's in the viewport counts (hit tests need it).
 */
function pageMaps() {
  const rect = (el) => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; };
  const inter = (a, b) => {
    const x = Math.max(a.x, b.x); const y = Math.max(a.y, b.y);
    const w = Math.min(a.x + a.w, b.x + b.w) - x; const h = Math.min(a.y + a.h, b.y + b.h) - y;
    return w > 0 && h > 0 ? { x, y, w, h } : null;
  };
  const shown = (el) => !el.closest('[inert]') && (!el.checkVisibility || el.checkVisibility({ opacityProperty: true, visibilityProperty: true }));
  const clear = (el) => { const bg = getComputedStyle(el).backgroundColor; return bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent'; };
  // Draws nothing itself: no fill, no picture, no text (a tap target laid over the map).
  const seeThrough = (el) => {
    if (!clear(el) || /^(IMG|svg|CANVAS|VIDEO)$/i.test(el.tagName) || getComputedStyle(el).backgroundImage !== 'none') return false;
    for (const c of el.childNodes) if (c.nodeType === 3 && c.textContent.trim()) return false;
    return true;
  };
  const maps = [];
  for (const map of document.querySelectorAll('.leaflet-container')) {
    if (!shown(map)) continue;
    // What of the map you can see: its box cut by every clipping parent and the viewport.
    // `own`: the map's own frame (clipping parents up to the first scroller), for pins cut by its edge.
    let clip = inter(rect(map), { x: 0, y: 0, w: innerWidth, h: innerHeight });
    let own = rect(map);
    let scroller = false;
    for (let p = map.parentElement; p && clip; p = p.parentElement) {
      const s = getComputedStyle(p);
      if (/(auto|scroll)/.test(s.overflowY + s.overflowX)) scroller = true;
      if (s.overflowX !== 'visible' || s.overflowY !== 'visible') {
        clip = inter(clip, rect(p));
        if (!scroller && own) own = inter(own, rect(p));
      }
    }
    if (!clip || !own || clip.w < 40 || clip.h < 40) continue;
    const inMap = (el) => !!el && map.contains(el);
    // What's under a point, top first, with `self` made hit-testable for the moment (chips and
    // overlay text often have pointer-events: none).
    const hits = (x, y, self) => {
      const prev = self.style.getPropertyValue('pointer-events');
      const prio = self.style.getPropertyPriority('pointer-events');
      self.style.setProperty('pointer-events', 'auto', 'important');
      const list = document.elementsFromPoint(x, y);
      if (prev) self.style.setProperty('pointer-events', prev, prio); else self.style.removeProperty('pointer-events');
      return list;
    };
    const alpha = (el) => { const m = getComputedStyle(el).backgroundColor.match(/rgba?\(([^)]*)\)/); const p = m ? m[1].split(',') : []; return p.length === 4 ? parseFloat(p[3]) : p.length ? 1 : 0; };
    // Is `self` on top at this point, with the map under it? Looks past see-through parents of
    // `self`, a faint dimming layer (the map still shows through) and a small opaque parent (a chip:
    // then `self` has a backing). A big opaque parent (a sheet, a card) isn't the map.
    // 0: not on the map; 1: on the map, bare; 2: on the map, on a chip of its own.
    const mapUnder = (x, y, self) => {
      if (x < 0 || y < 0 || x >= innerWidth || y >= innerHeight) return 0;
      const list = hits(x, y, self);
      if (!list.length || !self.contains(list[0])) return 0; // something covers it
      let backed = false;
      for (const e of list) {
        if (self.contains(e)) continue;
        // The map, or a parent of it (the map can sit inside a button with pointer-events off).
        if (inMap(e) || e.contains(map)) return backed ? 2 : 1;
        if (seeThrough(e)) continue;
        if (e.contains(self)) {
          if (clear(e)) continue;
          const r = rect(e);
          if (r.w * r.h < (clip.w * clip.h) / 4) { backed = true; continue; }
          if (alpha(e) < 0.75) continue;
        }
        return 0;
      }
      return 0;
    };
    const centre = (r) => [r.x + r.w / 2, r.y + r.h / 2];

    const obstacles = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const texts = [];
    for (let n = walker.nextNode(); n; n = walker.nextNode()) if (n.textContent.trim()) texts.push(n);
    for (const n of texts) {
      if (!/^\s*©/.test(n.textContent)) continue;
      const el = n.parentElement;
      if (!el || inMap(el) || !shown(el)) continue;
      // The chip: the nearest parent with a backing (the glass pill), else the text itself.
      let chip = el;
      for (let p = el, i = 0; p && i < 4; p = p.parentElement, i++) if (!clear(p)) { chip = p; break; }
      const r = rect(chip);
      if (!inter(r, clip) || !mapUnder(...centre(r), chip)) continue;
      obstacles.push({ kind: 'credit chip', name: `"${el.textContent.trim()}"`, r, el: chip });
    }
    for (const b of document.querySelectorAll('[role=button],button')) {
      if (inMap(b) || !shown(b) || obstacles.some((o) => o.el.contains(b) || b.contains(o.el))) continue;
      const r = rect(b);
      if (r.w === 0 || r.w > 72 || r.h > 72) continue;
      const [cx, cy] = centre(r);
      if (cx < clip.x || cx > clip.x + clip.w || cy < clip.y || cy > clip.y + clip.h) continue;
      if (!mapUnder(cx, cy, b)) continue;
      const name = (b.getAttribute('aria-label') || b.innerText || 'a button').replace(/\s+/g, ' ').trim();
      obstacles.push({ kind: 'button', name: `"${name}"`, r, el: b });
    }
    const isObstacle = (e) => obstacles.some((o) => o.el.contains(e));
    // Visible: what's under its centre, past the obstacles (they're the cover we're looking for), is the map.
    const visibleOnMap = (r) => {
      const [x, y] = centre(r);
      if (x < 0 || y < 0 || x >= innerWidth || y >= innerHeight) return false;
      for (const e of document.elementsFromPoint(x, y)) { if (inMap(e) || e.contains(map)) return true; if (isObstacle(e) || seeThrough(e)) continue; return false; }
      return false;
    };

    const subjects = [];
    const cut = [];
    for (const m of map.querySelectorAll('.leaflet-marker-icon')) {
      if (!shown(m)) continue;
      const r = rect(m);
      if (r.w < 4 || !inter(r, clip)) continue;
      const label = m.getAttribute('aria-label');
      if (!visibleOnMap(r) && !visibleOnMap(inter(r, clip))) continue;
      subjects.push({ name: label ? `pin "${label}"` : 'unlabelled pin', r });
      // Cut by the map's own edge, all of it in view (not just scrolled under a bar).
      const seen = inter(r, own);
      const frac = seen ? (seen.w * seen.h) / (r.w * r.h) : 0;
      const inView = seen && inter(seen, clip) && Math.abs(inter(seen, clip).w * inter(seen, clip).h - seen.w * seen.h) < 1;
      if (label && inView && frac > 0.1 && frac < 0.85) cut.push({ name: `"${label}"`, r, frac, own });
    }
    for (const p of map.querySelectorAll('.leaflet-overlay-pane path')) {
      let len = 0;
      try { len = p.getTotalLength(); } catch { len = 0; }
      const m = p.getScreenCTM();
      if (!(len > 20) || !m) continue;
      const end = p.getPointAtLength(len).matrixTransform(m);
      const r = { x: end.x - 6, y: end.y - 6, w: 12, h: 12 };
      if (inter(r, clip) && visibleOnMap(r)) subjects.push({ name: 'route\'s end', r });
    }
    const bare = [];
    for (const n of texts) {
      const el = n.parentElement;
      if (!el || inMap(el) || !shown(el) || isObstacle(el)) continue;
      // Faded or see-through text (an animation's start or end) isn't on show.
      let op = 1;
      for (let e = el; e && e.nodeType === 1; e = e.parentElement) op *= parseFloat(getComputedStyle(e).opacity || '1');
      const ca = (getComputedStyle(el).color.match(/rgba\([^)]*,\s*([\d.]+)\)/) || [])[1];
      if (op < 0.5 || (ca != null && parseFloat(ca) < 0.3)) continue;
      const btn = el.closest('[role=button],button');
      if (btn && !btn.contains(map)) continue; // a button's label; the button itself is checked
      const r = rect(el);
      if (r.w === 0 || r.x < clip.x - 1 || r.y < clip.y - 1 || r.x + r.w > clip.x + clip.w + 1 || r.y + r.h > clip.y + clip.h + 1) continue;
      const on = mapUnder(...centre(r), el);
      if (!on) continue;
      const name = `text "${n.textContent.replace(/\s+/g, ' ').trim().slice(0, 60)}"`;
      subjects.push({ name, r });
      // Printed straight on the map, over its own labels (42): it needs a chip with a backing.
      if (on === 1) bare.push({ name, r });
    }

    const overlaps = [];
    for (const s of subjects) {
      for (const o of obstacles) {
        const i = inter(s.r, o.r);
        if (i && i.w * i.h >= 9) overlaps.push({ subject: s.name, obstacle: `${o.kind} ${o.name}`, a: s.r, b: o.r, area: Math.round(i.w * i.h) });
      }
    }
    // The top edge, when it's the map's own (not cut by scrolling): which 1 px columns show the
    // map there (a chip or a sheet over it doesn't count).
    let top = null;
    if (rect(map).y >= clip.y - 0.5 || Math.abs(rect(map.parentElement).y - clip.y) < 1.5) {
      const cols = [];
      for (let x = Math.ceil(clip.x); x < Math.floor(clip.x + clip.w); x++) {
        let on = 0;
        for (const e of document.elementsFromPoint(x + 0.5, clip.y + 2)) { if (inMap(e) || e.contains(map)) { on = 1; break; } if (!seeThrough(e)) break; }
        cols.push(on);
      }
      if (cols.filter(Boolean).length > cols.length / 2) top = { y: clip.y, cols };
    }
    maps.push({ clip, overlaps, cut, bare, small: clip.h <= 320 && clip.w < innerWidth, top, url: location.pathname });
  }
  return maps;
}

/** A URL path for messages: ids of meets made during the run become ":new" so runs merge. */
const at = (url) => url.replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g, '/:new');

/** MAP findings, minus allow/map.json ({ subject, obstacle, url } regexes). */
function checkMaps(maps, url) {
  const allow = ALLOW('map.json').allow;
  const ok = (subject, obstacle) => allow.some((a) => (!a.subject || rx(a.subject).test(subject)) && (!a.obstacle || rx(a.obstacle).test(obstacle)) && (!a.url || rx(a.url).test(url)));
  const out = [];
  for (const m of maps) {
    for (const o of m.overlaps) {
      if (ok(o.subject, o.obstacle)) continue;
      out.push({ rule: 'MAP', message: `on ${at(url)}, the ${o.subject} is under the ${o.obstacle}; fit the map with padding for its chrome`, boxes: [box(o.a), box(o.b)] });
    }
    for (const b of m.bare) {
      if (ok(b.name, 'no backing')) continue;
      out.push({ rule: 'MAP', message: `on ${at(url)}, the ${b.name} is printed straight on the map, over its labels; put it on a chip with a backing`, boxes: [box(b.r)] });
    }
    // The driving view moves under you, so pins at its edges come and go: not a fault there.
    if (/^\/drive/.test(url)) continue;
    for (const c of m.cut) {
      if (ok(`pin ${c.name}`, 'edge')) continue;
      out.push({ rule: 'MAP', message: `on ${at(url)}, the pin ${c.name} is cut by the map's edge; fit the pins inside the map`, boxes: [box(c.r), box(c.own)] });
    }
  }
  return out;
}

/* ------------------------------------------------------------------------------------------------
 * EDGE (5, 21): no bright sliver along the top of a small map card (a tile gap, a cut label).
 * ---------------------------------------------------------------------------------------------- */

/**
 * In the page: how many bright pixels a PNG (base64) has, and in how many columns, counting only
 * the columns where `cols` (one flag per CSS pixel) says the map shows.
 */
async function pageBright([b64, cols]) {
  const img = new Image();
  img.src = `data:image/png;base64,${b64}`;
  await img.decode();
  const c = document.createElement('canvas');
  c.width = img.width; c.height = img.height;
  const g = c.getContext('2d');
  g.drawImage(img, 0, 0);
  const d = g.getImageData(0, 0, c.width, c.height).data;
  let n = 0;
  const seen = new Set();
  for (let i = 0; i < d.length; i += 4) {
    const l = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
    const x = (i / 4) % c.width;
    if (l > 170 && cols[Math.floor((x * cols.length) / c.width)]) { n++; seen.add(x); }
  }
  return { n, cols: seen.size, w: c.width, h: c.height };
}

/* ------------------------------------------------------------------------------------------------
 * T1 (52): a toast's message is one line at 1.0x (the probe in lib.cjs counts its lines).
 * ---------------------------------------------------------------------------------------------- */

function checkToastLines(toasts, scale) {
  if (scale !== 1) return [];
  return toasts.filter((t) => t.lines > 1).map((t) => ({
    rule: 'T1', task: t.task, toastId: t.id,
    message: `toast "${t.text}" (${t.task || 'start'}, ${t.url}) takes ${t.lines} lines at 1.0x; a toast is one line at 375 wide`,
  }));
}

/* ------------------------------------------------------------------------------------------------
 * CANCEL (24): no button or menu row that just says "Cancel", outside forms that lose work
 * (4.5: name what it cancels, "Cancel the meet"). Allow-list: allow/cancel.json.
 * ---------------------------------------------------------------------------------------------- */

/** In the page: every button, link or menu row on show whose whole text (or label) is "Cancel". */
function pageCancels() {
  const shown = (el) => !el.closest('[inert]') && (!el.checkVisibility || el.checkVisibility({ opacityProperty: true, visibilityProperty: true }));
  const headings = [...document.querySelectorAll('[role=heading]')].filter((h) => shown(h)).map((h) => h.textContent.replace(/\s+/g, ' ').trim());
  const out = [];
  for (const b of document.querySelectorAll('[role=button],[role=menuitem],[role=link],button,a')) {
    if (!shown(b)) continue;
    const r = b.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    const text = (b.innerText || '').replace(/\s+/g, ' ').trim();
    const label = (b.getAttribute('aria-label') || '').trim();
    if (!/^cancel$/i.test(text) && !/^cancel$/i.test(label)) continue;
    const sheet = b.closest('[data-testid=sheet]');
    const title = sheet ? ((sheet.querySelector('[role=heading]') || {}).textContent || '') : '';
    out.push({ text: text || label, where: sheet ? `the sheet "${title}"` : 'the page', headings, r: { x: r.x, y: r.y, w: r.width, h: r.height } });
  }
  return out;
}

function checkCancels(list, url) {
  const allow = ALLOW('cancel.json').allow;
  return list
    .filter((c) => !allow.some((a) => (!a.url || rx(a.url).test(url)) && (!a.heading || c.headings.some((h) => rx(a.heading).test(h)))))
    .map((c) => ({ rule: 'CANCEL', message: `bare "${c.text}" in ${c.where} on ${at(url)}; say what it cancels ("Cancel the meet"), or close with Done (4.5)`, boxes: [box(c.r)] }));
}

/* ------------------------------------------------------------------------------------------------
 * C5+ (27, 51, 47, 7): the same fact once, beyond the event page.
 * ---------------------------------------------------------------------------------------------- */

/** Screens where a distance or radius ("2.9 mi", "25 mi") may be said only once. */
const ONE_DISTANCE = /^\/(drive|settings)(\/|$)/;

/** A distance said twice on the route preview or Settings, minus allow/c5.json entries keyed "distance". */
function checkDistances(texts, url) {
  if (!ONE_DISTANCE.test(url)) return [];
  const allow = ALLOW('c5.json').allow.filter((a) => a.key === 'distance');
  const counts = {};
  for (const t of texts.filter((x) => !x.toast && !x.sheet)) {
    const s = allow.reduce((acc, a) => acc.replace(rx(a.text, 'gi'), ' '), t.text);
    for (const m of s.matchAll(/\b(\d+(?:\.\d+)?)\s?(mi|km|miles?)\b/gi)) {
      const k = `${m[1]} ${m[2].toLowerCase().startsWith('mi') ? 'mi' : 'km'}`;
      (counts[k] = counts[k] || []).push(t.text);
    }
  }
  return Object.entries(counts).filter(([, v]) => v.length > 1).map(([k, v]) => ({
    rule: 'C5+', message: `on ${at(url)}, the distance ${k} is said ${v.length} times: ${v.map((s) => `"${s}"`).join(', ')}`,
  }));
}

/** In the page: Me's stat tiles and the rows under "Your meets". */
function pageMe() {
  const shown = (el) => !el.closest('[inert]') && (!el.checkVisibility || el.checkVisibility({ opacityProperty: true, visibilityProperty: true }));
  const r = (el) => { const b = el.getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height }; };
  const stats = [];
  for (const el of document.querySelectorAll('[aria-label]')) {
    if (!shown(el) || el.closest('[role=button]')) continue;
    const m = (el.getAttribute('aria-label') || '').match(/^([A-Za-z][A-Za-z ]*?) (\d+)$/);
    if (m) stats.push({ label: m[1], value: Number(m[2]), r: r(el) });
  }
  const h = [...document.querySelectorAll('[role=heading]')].find((x) => shown(x) && /^your meets$/i.test(x.textContent.trim()));
  const rows = [];
  // The Section: the header's row, then the rows under it.
  const section = h && h.parentElement && h.parentElement.parentElement;
  if (section) {
    for (const b of section.querySelectorAll('[role=button]')) {
      if (!shown(b)) continue;
      const lines = (b.innerText || '').split('\n').map((s) => s.trim()).filter(Boolean);
      if (!lines.length) continue;
      rows.push({ title: lines[0], meta: lines.slice(1).join(' · '), label: b.getAttribute('aria-label') || '', r: r(b) });
    }
  }
  return { stats, rows };
}

/** Me: the Meets stat counts the meets listed (47), and no two listed meets share a name (49). */
function checkMe(me, url) {
  const out = [];
  const stat = me.stats.find((s) => /^meets?$/i.test(s.label));
  if (stat && me.rows.length && stat.value !== me.rows.length) {
    out.push({
      rule: 'C5+',
      message: `Me says "${stat.value} ${stat.label}" but lists ${me.rows.length} meets under Your meets (${me.rows.map((x) => `"${x.title}"`).join(', ')}); count what's listed or say what the number counts`,
      boxes: [box(stat.r), ...me.rows.map((x) => box(x.r))],
    });
  }
  const by = {};
  for (const row of me.rows) (by[row.title.toLowerCase()] = by[row.title.toLowerCase()] || []).push(row);
  for (const rows of Object.values(by)) {
    if (rows.length < 2) continue;
    out.push({
      rule: 'ME',
      message: `Me lists ${rows.length} meets called "${rows[0].title}" (${rows.map((x) => `"${x.meta}"`).join(' / ')}); tell them apart (area or host) or don't let them share a name`,
      boxes: rows.map((x) => box(x.r)),
    });
  }
  return out;
}

/**
 * Host step 1's Name example ("e.g. Sunday coffee and cars") must not be a meet the app already
 * shows (41): testers copy it, and Me then lists two meets with one name.
 */
function checkNameExample(placeholder, seenTexts) {
  const ex = (placeholder || '').replace(/^\s*e\.g\.?\s*/i, '').replace(/^["“'‘]|["”'’.…]+$/g, '').trim();
  if (!ex) return [];
  const hit = [...seenTexts].find((t) => t.toLowerCase() === ex.toLowerCase());
  return hit ? [{ rule: 'ME', message: `the host form's Name example "${placeholder}" is the name of a meet already on show ("${hit}"); testers copy it and Me lists two meets with one name. Use an example no seeded meet has` }] : [];
}

/** In the page: Tonight's count line ("2 meets tonight · 4 hidden") and the tonight meet cards on show. */
function pageTonight() {
  const shown = (el) => !el.closest('[inert]') && (!el.checkVisibility || el.checkVisibility({ opacityProperty: true, visibilityProperty: true }));
  let line = null;
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = w.nextNode(); n; n = w.nextNode()) {
    const t = n.textContent.replace(/\s+/g, ' ').trim();
    if (/^\d+ meets? (tonight|this week)\b/i.test(t) && n.parentElement && shown(n.parentElement)) {
      const b = n.parentElement.getBoundingClientRect();
      line = { text: t, r: { x: b.x, y: b.y, w: b.width, h: b.height } };
      break;
    }
  }
  const cards = [];
  for (const b of document.querySelectorAll('[role=button][aria-label]')) {
    if (!shown(b)) continue;
    const parts = b.getAttribute('aria-label').split(', ');
    const i = parts.findIndex((p, k) => k > 0 && /^(?:[^·]*· )?(Live|Tonight)\b/.test(p.replace(/ /g, ' ')));
    if (i < 1) continue;
    const r = b.getBoundingClientRect();
    cards.push({ title: parts[i - 1], r: { x: r.x, y: r.y, w: r.width, h: r.height } });
  }
  return { line, cards };
}

/** Tonight's count says how many meets tonight it shows (C5), and why the rest are hidden (7). */
function checkTonight(t, url) {
  if (!t.line) return [];
  const out = [];
  const titles = [...new Set(t.cards.map((c) => c.title))];
  const parts = t.line.text.split(/\s*·\s*/);
  const n = Number(parts[0].match(/^(\d+)/)[1]);
  if (/tonight/i.test(parts[0]) && titles.length && n !== titles.length) {
    out.push({ rule: 'C5+', message: `on ${url}, "${t.line.text}" but ${titles.length} tonight meets are listed (${titles.map((x) => `"${x}"`).join(', ')}); the count and the cards disagree`, boxes: [box(t.line.r)] });
  }
  const bare = parts.find((p) => /^\d+ hidden$/i.test(p));
  if (bare) out.push({ rule: 'C5+', message: `on ${url}, "${t.line.text}": "${bare}" doesn't say what hid them (say "4 not for your car", or name the filter)`, boxes: [box(t.line.r)] });
  return out;
}

/* ------------------------------------------------------------------------------------------------
 * L4 (16): after task 6 (a vote), a results or trophy moment on the event page.
 * ---------------------------------------------------------------------------------------------- */

/** Whether any visible line (not a toast or sheet) reads as results or a trophy, per allow/trophy.json. */
function trophyLines(texts) {
  const conf = ALLOW('trophy.json');
  return texts
    .filter((t) => !t.toast && !t.sheet)
    .filter((t) => conf.counts.some((c) => rx(c.text, 'i').test(t.text)) && !conf.ignore.some((c) => rx(c.text, 'i').test(t.text)))
    .map((t) => t.text);
}

/* ------------------------------------------------------------------------------------------------
 * TILE (30): in a photo grid every photo fills its tile (cover, or the same shape), no letterbox.
 * ---------------------------------------------------------------------------------------------- */

/** In the page: grids of same-size photo tiles (3 or more), and the tiles whose photo doesn't fill them. */
function pageTiles() {
  const shown = (el) => !el.closest('[inert]') && (!el.checkVisibility || el.checkVisibility({ opacityProperty: true, visibilityProperty: true }));
  const all = [];
  for (const el of document.body.querySelectorAll('div')) {
    const s = getComputedStyle(el);
    if (!s.backgroundImage.startsWith('url(') || s.filter !== 'none' || !shown(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 48 || r.height < 48) continue;
    // The tile: the nearest parent that clips (FitImage's frame) and holds the photo.
    let tile = el.parentElement;
    for (let p = el.parentElement, i = 0; p && i < 4; p = p.parentElement, i++) {
      const ps = getComputedStyle(p);
      if (ps.overflow === 'hidden') { tile = p; break; }
    }
    // FitImage's frame is the outermost clipping box of the photo's size.
    for (let p = tile.parentElement, i = 0; p && i < 3; p = p.parentElement, i++) {
      const pr = p.getBoundingClientRect();
      const tr = tile.getBoundingClientRect();
      if (getComputedStyle(p).overflow === 'hidden' && Math.abs(pr.width - tr.width) < 1 && Math.abs(pr.height - tr.height) < 1) tile = p;
    }
    const t = tile.getBoundingClientRect();
    const key = `${Math.round(t.width)}x${Math.round(t.height)}`;
    const img = el.parentElement.querySelector('img');
    const nat = img && img.naturalWidth ? img.naturalWidth / img.naturalHeight : null;
    const label = ((el.closest('[aria-label]') || tile).getAttribute('aria-label') || '').trim();
    all.push({ el: tile, key, label, size: s.backgroundSize, nat, img: { x: r.x, y: r.y, w: r.width, h: r.height }, r: { x: t.x, y: t.y, w: t.width, h: t.height } });
  }
  // A grid: the nearest parent holding 3 or more tiles of one size.
  const groups = new Map();
  for (const t of all) {
    let grid = null;
    for (let p = t.el.parentElement, i = 0; p && i < 8 && !grid; p = p.parentElement, i++) {
      if (all.filter((u) => u.key === t.key && p.contains(u.el)).length >= 3) grid = p;
    }
    if (!grid) continue;
    const k = grid;
    if (!groups.has(k)) groups.set(k, new Map());
    if (!groups.get(k).has(t.key)) groups.get(k).set(t.key, []);
    groups.get(k).get(t.key).push(t);
  }
  const out = [];
  for (const g of groups.values()) {
    for (const tiles of g.values()) {
      if (tiles.length < 3) continue;
      for (const t of tiles) {
        const aspect = t.r.w / t.r.h;
        let why = '';
        if (t.img.w < t.r.w - 2 || t.img.h < t.r.h - 2) why = `the photo is ${Math.round(t.img.w)}x${Math.round(t.img.h)} in a ${Math.round(t.r.w)}x${Math.round(t.r.h)} tile`;
        else if (/contain/.test(t.size) && (t.nat == null || Math.abs(t.nat - aspect) / aspect > 0.03)) why = `it's fitted whole (contain)${t.nat ? `, a ${t.nat.toFixed(2)}:1 photo in a ${aspect.toFixed(2)}:1 tile` : ''}, so it shows bands`;
        if (why) out.push({ label: t.label, why, r: t.r, n: tiles.length });
        delete t.el;
      }
    }
  }
  return out;
}

function checkTiles(list, url) {
  const allow = ALLOW('tiles.json').allow;
  return list
    .filter((t) => !allow.some((a) => (!a.label || rx(a.label).test(t.label)) && (!a.url || rx(a.url).test(url))))
    .map((t) => ({ rule: 'TILE', message: `on ${at(url)}, the tile "${t.label || 'photo'}" is letterboxed among ${t.n - 1} full-bleed tiles: ${t.why}; cover-fit it like the others`, boxes: [box(t.r)] }));
}

/* ------------------------------------------------------------------------------------------------
 * HEAD (48): every section header on a screen looks the same (size, spacing, weight, colour, rule).
 * ---------------------------------------------------------------------------------------------- */

/** In the page: the letter-spaced section headers, by the screen (scroller or sheet) they're on. */
function pageHeaders() {
  const shown = (el) => !el.closest('[inert]') && (!el.checkVisibility || el.checkVisibility({ opacityProperty: true, visibilityProperty: true }));
  const groups = new Map();
  for (const h of document.querySelectorAll('[role=heading]')) {
    if (!shown(h)) continue;
    const s = getComputedStyle(h);
    if (!(parseFloat(s.letterSpacing) > 0)) continue; // titles aren't letter-spaced; eyebrows are
    const hr = h.getBoundingClientRect();
    if (hr.width === 0) continue;
    // A rule: a hairline next to the header, on its row.
    const rule = [...(h.parentElement ? h.parentElement.children : [])].some((c) => {
      if (c === h) return false;
      const r = c.getBoundingClientRect();
      return r.height > 0 && r.height <= 2 && r.width >= 24 && r.y >= hr.y - 2 && r.y <= hr.y + hr.height + 2;
    });
    let screen = h.closest('[data-testid=sheet]');
    for (let p = h.parentElement; !screen && p; p = p.parentElement) if (/(auto|scroll)/.test(getComputedStyle(p).overflowY)) screen = p;
    screen = screen || document.body;
    const look = { size: s.fontSize, weight: s.fontWeight, 'letter-spacing': s.letterSpacing, case: s.textTransform, colour: s.color, rule: rule ? 'a rule' : 'no rule' };
    if (!groups.has(screen)) groups.set(screen, []);
    groups.get(screen).push({ text: h.textContent.trim(), look, sig: JSON.stringify(look), r: { x: hr.x, y: hr.y, w: hr.width, h: hr.height } });
  }
  return [...groups.values()].filter((g) => new Set(g.map((x) => x.sig)).size > 1);
}

function checkHeaders(groups, url) {
  const allow = ALLOW('headers.json').allow;
  const out = [];
  for (const g of groups) {
    const kept = g.filter((h) => !allow.some((a) => rx(a.text, 'i').test(h.text) && (!a.url || rx(a.url).test(url))));
    const sigs = [...new Set(kept.map((h) => h.sig))];
    if (sigs.length < 2) continue;
    // Say only what differs ("letter-spacing 1.5px, a rule" vs "letter-spacing 1px, no rule").
    const looks = sigs.map((s) => JSON.parse(s));
    const keys = Object.keys(looks[0]).filter((k) => new Set(looks.map((l) => l[k])).size > 1);
    const desc = sigs.map((s, i) => `${kept.filter((h) => h.sig === s).map((h) => `"${h.text}"`).join(', ')} (${keys.map((k) => (k === 'rule' ? looks[i][k] : `${k} ${looks[i][k]}`)).join(', ')})`).join(' vs ');
    out.push({ rule: 'HEAD', message: `on ${at(url)}, section headers in two styles: ${desc}; use the one Section header`, boxes: kept.filter((h) => h.r.y > -50 && h.r.y < 700).map((h) => box(h.r)) });
  }
  return out;
}

/* ------------------------------------------------------------------------------------------------
 * K3 (8): an event's card on Tonight's map sheet and in the List look the same (title placement).
 * ---------------------------------------------------------------------------------------------- */

/** In the page: event cards with a photo or art, where their title sits (over the photo or under it). */
function pageEventCards() {
  const shown = (el) => !el.closest('[inert]') && (!el.checkVisibility || el.checkVisibility({ opacityProperty: true, visibilityProperty: true }));
  const out = [];
  for (const b of document.querySelectorAll('[role=button][aria-label]')) {
    if (!shown(b)) continue;
    const label = b.getAttribute('aria-label');
    // Event cards: "Meet, Car park meet-up, Live · ..." (kind, title, when).
    const parts = label.split(', ');
    if (parts.length < 3 || !/\b(Live|Tonight|Sun|Mon|Tue|Wed|Thu|Fri|Sat)\b/.test(parts[2])) continue;
    const br = b.getBoundingClientRect();
    if (br.width < 200) continue;
    const photo = [...b.querySelectorAll('div,svg')].find((d) => {
      const r = d.getBoundingClientRect();
      const s = getComputedStyle(d);
      return r.width > br.width * 0.8 && r.height > 60 && (s.backgroundImage.startsWith('url(') || d.tagName.toLowerCase() === 'svg');
    });
    if (!photo) continue;
    let title = null;
    const w = document.createTreeWalker(b, NodeFilter.SHOW_TEXT);
    for (let n = w.nextNode(); n; n = w.nextNode()) if (n.textContent.trim() === parts[1]) { title = n.parentElement; break; }
    if (!title) continue;
    const p = photo.getBoundingClientRect();
    const t = title.getBoundingClientRect();
    const over = t.y >= p.y - 1 && t.y + t.height <= p.y + p.height + 1;
    out.push({ title: parts[1], over, r: { x: br.x, y: br.y, w: br.width, h: br.height }, t: { x: t.x, y: t.y, w: t.width, h: t.height } });
  }
  return out;
}

/** The same event's card in two places (map sheet, List) with the title in different places. */
function checkCardLook(map, list) {
  const out = [];
  for (const a of map) {
    const b = list.find((x) => x.title === a.title);
    if (!b || a.over === b.over) continue;
    out.push({ rule: 'K3', message: `"${a.title}": the card on Tonight's map sheet has its title ${a.over ? 'over' : 'under'} the photo, the List card ${b.over ? 'over' : 'under'} it; one PhotoCard for an event in both` });
  }
  return out;
}

/* ------------------------------------------------------------------------------------------------
 * ART (13): Busy night, no Tonight card shows the grid placeholder art (AreaArt in PhotoCard.tsx:
 * a 160x90 viewBox of grid lines round a circle) instead of a photo or the real map.
 * ---------------------------------------------------------------------------------------------- */

function pagePlaceholders() {
  const shown = (el) => !el.closest('[inert]') && (!el.checkVisibility || el.checkVisibility({ opacityProperty: true, visibilityProperty: true }));
  const out = [];
  document.querySelectorAll('[data-sc-art]').forEach((e) => e.removeAttribute('data-sc-art'));
  for (const svg of document.querySelectorAll('svg[viewBox="0 0 160 90"]')) {
    if (!shown(svg) || svg.querySelectorAll('circle').length < 2 || svg.querySelectorAll('line').length < 6) continue;
    const card = svg.closest('[role=button][aria-label]');
    const r = (card || svg).getBoundingClientRect();
    if (r.width === 0) continue;
    (card || svg).setAttribute('data-sc-art', String(out.length));
    out.push({ label: card ? card.getAttribute('aria-label') : '(no card)', idx: out.length });
  }
  return out;
}

/* ------------------------------------------------------------------------------------------------
 * Screenshot marks.
 * ---------------------------------------------------------------------------------------------- */

function markBoxes(boxes) {
  const root = document.createElement('div');
  root.id = '__sc_marks';
  root.setAttribute('aria-hidden', 'true');
  root.style.cssText = 'position:fixed;left:0;top:0;width:0;height:0;z-index:2147483647;pointer-events:none';
  for (const b of boxes) {
    const d = document.createElement('div');
    d.style.cssText = `position:fixed;left:${b.x - 2}px;top:${b.y - 2}px;width:${b.w + 4}px;height:${b.h + 4}px;border:2px solid #ff2d55;box-sizing:border-box;pointer-events:none`;
    root.appendChild(d);
  }
  document.body.appendChild(root);
}
function unmarkBoxes() {
  const r = document.getElementById('__sc_marks');
  if (r) r.remove();
}

module.exports = {
  at, pageMaps, checkMaps, pageBright, checkToastLines, pageCancels, checkCancels, checkDistances, pageMe, checkMe,
  checkNameExample, pageTonight, checkTonight, trophyLines, pageTiles, checkTiles, pageHeaders, checkHeaders,
  pageEventCards, checkCardLook, pagePlaceholders, markBoxes, unmarkBoxes,
};

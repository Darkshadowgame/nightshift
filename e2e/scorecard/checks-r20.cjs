// Review 20's checks (docs/REVIEW-20-scorecard.md, "Suggested new automated checks"; its problem
// and path-to-10 numbers in brackets). As in checks-more.cjs: page* functions run in the browser
// (self-contained), check* functions run in Node and return findings ({ rule, message, boxes }).
const fs = require('fs');
const path = require('path');

const ALLOW = (name) => JSON.parse(fs.readFileSync(path.join(__dirname, 'allow', name), 'utf8'));
const rx = (s, f = '') => new RegExp(s, f);
const box = (r) => ({ x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.w), h: Math.round(r.h) });
const at = (url) => url.replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g, '/:new');

/* ------------------------------------------------------------------------------------------------
 * IMG-SCALE (1, 12): every photo is scaled to its frame. TILE checks a tile is filled; this checks
 * the photo isn't drawn far bigger than its frame (a 1200 x 900 photo in a 112 px tile shows a
 * blown-up corner). PHOTO-REUSE (13) uses the same walk: which photos each screen shows.
 * ---------------------------------------------------------------------------------------------- */

/**
 * In the page: every photo on show outside maps (a div with a background image, as React Native
 * Web draws an Image, or a visible <img>), with its drawn box, its frame (the nearest parent that
 * clips, not a scroller) and how much of the picture the frame shows, from background-size and
 * background-position (object-fit for an <img>) and the photo's natural size.
 */
function pagePhotos() {
  const shown = (el) => !el.closest('[inert]') && (!el.checkVisibility || el.checkVisibility({ opacityProperty: true, visibilityProperty: true }));
  const rect = (el) => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; };
  const inter = (a, b) => {
    const x = Math.max(a.x, b.x); const y = Math.max(a.y, b.y);
    const w = Math.min(a.x + a.w, b.x + b.w) - x; const h = Math.min(a.y + a.h, b.y + b.h) - y;
    return w > 0 && h > 0 ? { x, y, w, h } : null;
  };
  const name = (src) => { const m = decodeURIComponent(src).match(/([^/]+?)(?:\.[0-9a-f]{16,})?\.(jpe?g|png|webp)/i); return m ? m[1] : src.slice(-40); };
  // Natural sizes: React Native Web keeps a hidden <img> of the same source next to the drawn div.
  const natural = new Map();
  for (const img of document.querySelectorAll('img')) if (img.naturalWidth) natural.set(img.currentSrc || img.src, [img.naturalWidth, img.naturalHeight]);
  document.querySelectorAll('[data-sc-photo]').forEach((e) => e.removeAttribute('data-sc-photo'));
  const out = [];
  const items = [];
  for (const el of document.body.querySelectorAll('div')) {
    const s = getComputedStyle(el);
    const m = s.backgroundImage.match(/^url\("?(.*?)"?\)$/);
    if (m) items.push({ el, s, src: m[1], kind: 'bg' });
  }
  for (const img of document.querySelectorAll('img')) if (parseFloat(getComputedStyle(img).opacity) > 0.05) items.push({ el: img, s: getComputedStyle(img), src: img.currentSrc || img.src, kind: 'img' });
  for (const { el, s, src, kind } of items) {
    if (!/\.(jpe?g|png|webp)/i.test(src) || el.closest('.leaflet-container,#__sc_marks') || !shown(el) || s.filter !== 'none') continue;
    const r = rect(el);
    if (r.w < 16 || r.h < 16) continue;
    // The frame: what the parents that clip it (up to the first scroller) leave of it. A wrapper
    // the photo's own size that clips doesn't count on its own; the tile round it does.
    let f = null;
    let frame = null;
    for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
      const ps = getComputedStyle(p);
      if (/(auto|scroll)/.test(ps.overflowX + ps.overflowY)) break;
      if (ps.overflowX === 'visible' && ps.overflowY === 'visible') continue;
      const pr = rect(p);
      f = f ? inter(f, pr) : pr;
      if (!f) break;
      frame = frame || p;
      if (pr.w < r.w - 1 || pr.h < r.h - 1) frame = p;
    }
    if (!f || !frame || f.w < 16 || f.h < 16) continue;
    // The picture as drawn: its size from background-size / object-fit, placed by its position.
    const nat = natural.get(src) || (kind === 'img' ? [el.naturalWidth, el.naturalHeight] : null);
    let shows = null;
    if (nat && nat[0] && nat[1]) {
      const fit = kind === 'img' ? s.objectFit : s.backgroundSize;
      let w; let h;
      if (/cover/.test(fit)) { const k = Math.max(r.w / nat[0], r.h / nat[1]); w = nat[0] * k; h = nat[1] * k; }
      else if (/contain|scale-down/.test(fit)) { const k = Math.min(r.w / nat[0], r.h / nat[1]); w = nat[0] * k; h = nat[1] * k; }
      else if (kind === 'img' && fit === 'fill') { w = r.w; h = r.h; }
      else {
        const [a, b = 'auto'] = fit.split(' ');
        const len = (v, full, natv) => (v.endsWith('%') ? (parseFloat(v) / 100) * full : v.endsWith('px') ? parseFloat(v) : natv);
        w = len(a, r.w, nat[0]); h = b === 'auto' ? (a === 'auto' ? nat[1] : (w * nat[1]) / nat[0]) : len(b, r.h, nat[1]);
      }
      const pos = (kind === 'img' ? s.objectPosition : `${s.backgroundPositionX} ${s.backgroundPositionY}`).split(' ');
      const off = (v, free) => (v.endsWith('%') ? (parseFloat(v) / 100) * free : parseFloat(v) || 0);
      const pic = { x: r.x + off(pos[0] || '50%', r.w - w), y: r.y + off(pos[1] || '50%', r.h - h), w, h };
      const seen = inter(inter(pic, r) || { x: 0, y: 0, w: 0, h: 0 }, f);
      shows = seen ? (seen.w * seen.h) / (w * h) : 0;
    }
    const shown2 = inter(r, f) || { w: 0, h: 0 };
    const idx = out.length;
    frame.setAttribute('data-sc-photo', String(idx));
    const sheet = el.closest('[data-testid=sheet]');
    const sheetTitle = sheet ? ((sheet.querySelector('[role=heading]') || {}).textContent || 'a sheet').trim() : '';
    out.push({ idx, src: name(src), r, f, shows, shownW: shown2.w, shownH: shown2.h, nat, sheet: sheetTitle });
  }
  return out;
}

/** IMG-SCALE: a photo's box over 1.05x its frame, or a frame showing under 40% of the picture. */
function checkPhotoScale(photos, url) {
  const allow = ALLOW('scale.json').allow;
  const bad = [];
  for (const p of photos) {
    if (allow.some((a) => rx(a.photo).test(p.src) && (!a.url || rx(a.url).test(url)) && (!a.maxFrame || Math.max(p.f.w, p.f.h) <= a.maxFrame))) continue;
    const big = p.r.w > p.f.w * 1.05 + 1 || p.r.h > p.f.h * 1.05 + 1;
    const crop = p.shows != null && p.shows < 0.4;
    if (!big && !crop) continue;
    bad.push(p);
  }
  if (!bad.length) return [];
  const say = (p) => `"${p.src}" drawn ${Math.round(p.r.w)}x${Math.round(p.r.h)} in a ${Math.round(p.f.w)}x${Math.round(p.f.h)} frame${p.shows != null ? ` (${Math.max(1, Math.round(p.shows * 100))}% of the photo shows)` : ''}`;
  return [{
    rule: 'IMG-SCALE',
    message: `on ${at(url)}, ${bad.length} photo${bad.length > 1 ? 's are' : ' is'} not scaled to ${bad.length > 1 ? 'their frames' : 'its frame'}, showing a blown-up corner: ${bad.slice(0, 3).map(say).join('; ')}${bad.length > 3 ? '; ...' : ''}. Size the photo to its frame (cover-fit at 100%)`,
    boxes: bad.map((p) => box(p.f)),
    reveal: bad[0].idx,
  }];
}

/**
 * PHOTO-REUSE (13; owner decision 9.12): in the normal demo one photo is on at most two screens.
 * `seen` maps photo -> Map(screen -> screenshot); a screen is a URL, or a sheet on it. Photos shown 64 px or smaller (avatars, chips)
 * are left out: a person's avatar is their build's photo by design (9.12). allow/photos.json lists
 * other exceptions.
 */
function notePhotos(seen, photos, url, shot) {
  for (const p of photos) {
    if (p.shownW <= 64 && p.shownH <= 64) continue;
    if (!seen.has(p.src)) seen.set(p.src, new Map());
    // A sheet is a screen of its own ("Vote: Best car" over the event page).
    const screen = at(url) + (p.sheet ? ` sheet "${p.sheet}"` : '');
    const screens = seen.get(p.src);
    if (!screens.has(screen)) screens.set(screen, shot);
  }
}
function checkPhotoReuse(seen) {
  const allow = ALLOW('photos.json').allow;
  const out = [];
  for (const [src, screens] of seen) {
    if (screens.size <= 2 || allow.some((a) => rx(a.photo).test(src))) continue;
    const list = [...screens.keys()];
    out.push({ rule: 'PHOTO-REUSE', message: `the photo "${src}" is on ${list.length} screens (${list.join(', ')}); one photo on at most two screens (9.12)`, shot: [...screens.values()][2] });
  }
  return out;
}

/* ------------------------------------------------------------------------------------------------
 * HOME-DIST (3, 6, 24, 28, 35): with location granted far from home, a distance on Tonight, Me,
 * "It's up" and the route preview is from the phone, or says "from home".
 * ---------------------------------------------------------------------------------------------- */

/** Screens the check covers. */
const HOME_DIST_SCREENS = /^\/(|me|drive|event\/posted)$/;

/** In the page: each distance on show (not in a toast or sheet) with the row it sits in. */
function pageDistances() {
  const shown = (el) => !el.closest('[inert]') && (!el.checkVisibility || el.checkVisibility({ opacityProperty: true, visibilityProperty: true }));
  const out = [];
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let all = '';
  for (let n = w.nextNode(); n; n = w.nextNode()) {
    const el = n.parentElement;
    const t = n.textContent.replace(/\s+/g, ' ').trim();
    if (!t || !el || el.closest('[data-testid=toast],[data-testid=sheet],.leaflet-container') || !shown(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0) continue;
    all += ' ' + t;
    if (!/\b\d+(?:\.\d+)?\s?(?:mi|km|miles?)\b/i.test(t)) continue;
    // Its row: the card or line it's part of (up to three parents, or the button it's in).
    let row = el;
    for (let i = 0; i < 3 && row.parentElement && !row.matches('[role=button]'); i++) row = row.parentElement;
    out.push({ text: t, row: (row.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 200), r: { x: r.x, y: r.y, w: r.width, h: r.height } });
  }
  return { list: out, fromHome: /from home/i.test(all) };
}

/**
 * `phoneHome`: miles from the phone (the scorecard's geolocation) to the demo's home. A distance
 * measured from the phone is at least that less a few miles (the demo's meets are round home);
 * one under `phoneHome - 6` without "from home" is measured from home and doesn't say so (4.9).
 * The route preview may say "From home" anywhere on the screen.
 */
function checkHomeDistances(d, url, phoneHome) {
  if (!HOME_DIST_SCREENS.test(url)) return [];
  const bad = d.list.filter((x) => {
    const m = x.text.match(/\b(\d+(?:\.\d+)?)\s?(mi|km|miles?)\b/i);
    const miles = parseFloat(m[1]) / (/km/i.test(m[2]) ? 1.609 : 1);
    if (/from home/i.test(x.row) || (url === '/drive' && d.fromHome)) return false;
    return miles < phoneHome - 6;
  });
  if (!bad.length) return [];
  const texts = [...new Set(bad.map((x) => x.text))];
  return [{
    rule: 'HOME-DIST',
    message: `on ${at(url)}, with the phone ${Math.round(phoneHome)} mi from home, ${texts.map((t) => `"${t}"`).join(', ')} ${texts.length > 1 ? 'are' : 'is'} measured from home without saying "from home" (4.9): say "2 mi from home", or measure from the phone`,
    boxes: bad.filter((x) => x.r.y > -20 && x.r.y < 700).map((x) => box(x.r)),
  }];
}

/** Miles between two { latitude, longitude }. */
function miles(a, b) {
  const R = 3958.8;
  const rad = (d) => (d * Math.PI) / 180;
  const dl = rad(b.latitude - a.latitude); const dn = rad(b.longitude - a.longitude);
  const h = Math.sin(dl / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dn / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/* ------------------------------------------------------------------------------------------------
 * C5 on cancel (17): a cancelled meet says "cancelled" once (toasts left out).
 * ---------------------------------------------------------------------------------------------- */

function checkCancelledOnce(texts, url) {
  const hits = texts.filter((t) => !t.toast && !t.sheet && /\bcancel\w*/i.test(t.text));
  const n = hits.reduce((k, t) => k + t.text.match(/\bcancel\w*/gi).length, 0);
  return n > 1 ? [{ rule: 'C5-CANCEL', message: `the cancelled meet's page (${at(url)}) says "cancel…" ${n} times: ${hits.map((t) => `"${t.text}"`).join(', ')}; say it once, in the status line` }] : [];
}

/* ------------------------------------------------------------------------------------------------
 * CHECKED-IN (16): 10 s after check-in, the page on show (in the viewport, not a toast or sheet)
 * still says you're checked in. Lines elsewhere ("3 checked in" below the fold) don't count.
 * ---------------------------------------------------------------------------------------------- */

function pageCheckedIn() {
  const out = [];
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = w.nextNode(); n; n = w.nextNode()) {
    const t = n.textContent.replace(/\s+/g, ' ').trim();
    const el = n.parentElement;
    if (!/checked in/i.test(t) || !el || el.closest('[inert],[data-testid=toast],[data-testid=sheet]')) continue;
    if (el.checkVisibility && !el.checkVisibility({ opacityProperty: true, visibilityProperty: true })) continue;
    const r = el.getBoundingClientRect();
    out.push({ text: t, onScreen: r.width > 0 && r.bottom > 0 && r.top < innerHeight && !/\d+ checked in/i.test(t) });
  }
  return out;
}

function checkCheckedIn(list) {
  if (list.some((x) => x.onScreen)) return [];
  const elsewhere = list.map((x) => `"${x.text}"`);
  return [{ rule: 'CHECKED-IN', message: `10 s after check-in (task 5), nothing on screen says you're checked in${elsewhere.length ? ` (only ${elsewhere.join(', ')}, off screen or a count)` : ''}; keep "Checked in" in the status line, like "Going with your Fiesta"` }];
}

/* ------------------------------------------------------------------------------------------------
 * REVEAL (14): after I'm going, the "Location shown" card is on screen, unfaded and uncovered (by
 * the toast or anything else) for 2 s at a stretch. EXIT-OVERLAP (15): after check-in, no two
 * lines of text overlap while the "+150 rep" moment plays and goes.
 * Both are watchers started just before the tap; they sample every 100 ms for `ms`.
 * ---------------------------------------------------------------------------------------------- */

function watchReveal(ms) {
  const st = window.__scReveal = { seen: false, bestRunMs: 0, coveredBy: '', hit: false, done: false };
  const end = Date.now() + ms;
  let runStart = null; let coverRun = 0;
  const opacity = (el) => { let o = 1; for (let e = el; e && e.nodeType === 1; e = e.parentElement) o *= parseFloat(getComputedStyle(e).opacity || '1'); return o; };
  const describe = (el) => {
    if (!el) return 'the screen edge';
    const t = el.closest('[data-testid]');
    if (t) { const id = t.getAttribute('data-testid'); return id + (id === 'toast' ? ` "${(t.innerText || '').replace(/\s+/g, ' ').trim()}"` : ''); }
    const l = el.closest('[aria-label]');
    return l ? `"${l.getAttribute('aria-label').slice(0, 60)}"` : 'the page under it';
  };
  const seeThrough = (e) => {
    const s = getComputedStyle(e);
    if (!/^(rgba\(0, 0, 0, 0\)|transparent)$/.test(s.backgroundColor) || s.backgroundImage !== 'none' || /^(IMG|svg|CANVAS|VIDEO)$/i.test(e.tagName) || parseFloat(s.borderTopWidth) > 0) return false;
    for (const c of e.childNodes) if (c.nodeType === 3 && c.textContent.trim()) return false;
    return true;
  };
  // The card's own frame cuts it off there (an overflow: hidden parent, the map's box).
  const cutBy = (el, x, y) => {
    for (let p = el.parentElement; p; p = p.parentElement) {
      const s = getComputedStyle(p);
      if (s.overflowX === 'visible' && s.overflowY === 'visible') continue;
      const r = p.getBoundingClientRect();
      if (x < r.left || x > r.right || y < r.top || y > r.bottom) return true;
    }
    return false;
  };
  const iv = setInterval(() => {
    const now = Date.now();
    if (now > end) { clearInterval(iv); st.done = true; return; }
    let el = null;
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = w.nextNode(); n; n = w.nextNode()) if (/^\s*location shown\s*$/i.test(n.textContent) && n.parentElement && !n.parentElement.closest('[inert]')) { el = n.parentElement; break; }
    let ok = false; let cover = '';
    if (el) {
      const r = el.getBoundingClientRect();
      // Only while it's drawn (unfaded) does a cover count: not while it rises or fades.
      if (r.width > 0 && r.bottom > 0 && r.top < innerHeight && opacity(el) >= 0.9) {
        st.seen = true;
        const card = el.parentElement || el;
        const y = Math.min(Math.max(r.top + r.height / 2, 0), innerHeight - 1);
        for (const x0 of [r.left + 2, r.left + r.width / 2, r.right - 2]) {
          const x = Math.min(Math.max(x0, 0), innerWidth - 1);
          // The first thing at this point that draws something: see-through layers (an edge fade's
          // empty box, a tap target) don't hide the card.
          // The card may not take taps (pointer-events: none): make it hit-testable for the moment.
          const prev = [card, el].map((e) => [e, e.style.getPropertyValue('pointer-events'), e.style.getPropertyPriority('pointer-events')]);
          for (const [e] of prev) e.style.setProperty('pointer-events', 'auto', 'important');
          const stack = document.elementsFromPoint(x, y);
          for (const [e, v, pr] of prev) { if (v) e.style.setProperty('pointer-events', v, pr); else e.style.removeProperty('pointer-events'); }
          let h = null;
          for (const e of stack) { if (card.contains(e) || !seeThrough(e)) { h = e; break; } }
          if (!h || !card.contains(h)) { cover = cutBy(el, x, y) ? 'its own frame (cut off by the map\'s edge)' : describe(h); break; }
        }
        ok = !cover;
        st.rect = { x: r.x, y: r.y, w: r.width, h: r.height };
      }
    }
    if (ok) { if (runStart == null) runStart = now; st.bestRunMs = Math.max(st.bestRunMs, now - runStart + 100); }
    else { runStart = null; if (cover && !st.coveredBy) st.coveredBy = cover; }
    coverRun = cover ? coverRun + 1 : 0;
    if (coverRun >= 3 && !st.hit) { st.hit = true; if (window.__scorecardHit) window.__scorecardHit('reveal-covered'); }
  }, 100);
}

function checkReveal(r) {
  if (!r || !r.seen) return [{ rule: 'REVEAL', message: 'after I\'m going (task 3), no "Location shown" moment on screen' }];
  if (r.bestRunMs >= 2000) return [];
  return [{ rule: 'REVEAL', message: `after I'm going (task 3), "Location shown" was on screen, unfaded and uncovered for only ${(r.bestRunMs / 1000).toFixed(1)} s at a stretch (needs 2 s)${r.coveredBy ? `; covered by ${r.coveredBy}` : ', then it faded: the moment is too short to read'}` }];
}

function watchOverlap(ms) {
  const st = window.__scOv = { found: [], samples: 0, done: false, start: Date.now() };
  const end = Date.now() + ms;
  const shown = (el) => !el.closest('[inert]') && (!el.checkVisibility || el.checkVisibility({ opacityProperty: true, visibilityProperty: true }));
  const rect = (el) => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; };
  const inter = (a, b) => {
    const x = Math.max(a.x, b.x); const y = Math.max(a.y, b.y);
    const w = Math.min(a.x + a.w, b.x + b.w) - x; const h = Math.min(a.y + a.h, b.y + b.h) - y;
    return w > 0 && h > 0 ? { x, y, w, h } : null;
  };
  const opacity = (el) => { let o = 1; for (let e = el; e && e.nodeType === 1; e = e.parentElement) o *= parseFloat(getComputedStyle(e).opacity || '1'); return o; };
  const alpha = (el) => { const m = getComputedStyle(el).backgroundColor.match(/rgba?\(([^)]*)\)/); const p = m ? m[1].split(',') : []; return p.length === 4 ? parseFloat(p[3]) : p.length ? 1 : 0; };
  // Hides what's under it: a solid or frosted backing at full opacity.
  const hides = (el) => { const s = getComputedStyle(el); return (alpha(el) >= 0.9 || (s.backdropFilter && s.backdropFilter !== 'none') || s.backgroundImage !== 'none') && opacity(el) >= 0.95; };
  const said = new Set();
  const iv = setInterval(() => {
    if (Date.now() > end) { clearInterval(iv); st.done = true; return; }
    st.samples++;
    // Per sample, each element's style, opacity and clip worked out once (it runs every 100 ms).
    const cs = new Map(); const ops = new Map(); const clips = new Map();
    const style = (e) => { let v = cs.get(e); if (!v) { v = getComputedStyle(e); cs.set(e, v); } return v; };
    const op = (e) => { if (!e || e.nodeType !== 1) return 1; let v = ops.get(e); if (v == null) { v = parseFloat(style(e).opacity || '1') * op(e.parentElement); ops.set(e, v); } return v; };
    const clipOf = (e) => {
      if (!e || e === document.documentElement) return { x: 0, y: 0, w: innerWidth, h: innerHeight };
      if (clips.has(e)) return clips.get(e);
      let c = clipOf(e.parentElement);
      const s = style(e);
      if (c && (s.overflowX !== 'visible' || s.overflowY !== 'visible')) c = inter(c, rect(e));
      clips.set(e, c);
      return c;
    };
    const lines = [];
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = w.nextNode(); n; n = w.nextNode()) {
      const el = n.parentElement;
      if (!el || !n.textContent.trim()) continue;
      const er = el.getBoundingClientRect();
      if (er.width === 0 || er.bottom < 0 || er.top > innerHeight) continue;
      if (el.closest('[inert],[data-testid=toast],[data-testid=sheet],[data-testid=sheet-scrim],.leaflet-container,#__sc_marks') || !shown(el) || op(el) < 0.1) continue;
      const clip = clipOf(el.parentElement);
      if (!clip) continue;
      const t = n.textContent.replace(/\s+/g, ' ').trim();
      const rg = document.createRange();
      rg.selectNodeContents(n);
      for (const q of rg.getClientRects()) {
        const c = inter({ x: q.x, y: q.y, w: q.width, h: q.height }, clip);
        if (c && c.w > 2 && c.h > 4) lines.push({ n, el, t: t.slice(0, 50), r: c });
      }
    }
    // A card fading out (an inline opacity under 0.95, a backing of its own) over a line of text
    // outside it: the "+150 rep" card's exit (Review 20 #15) overlaps the row under it.
    // Fading: an inline opacity (Reanimated) or a running CSS animation (an `exiting` FadeOut on web).
    const fading = new Set(document.querySelectorAll('[style*="opacity"]'));
    for (const a of document.getAnimations ? document.getAnimations() : []) if (a.effect && a.effect.target && a.effect.target.nodeType === 1) fading.add(a.effect.target);
    for (const el of fading) {
      const o = op(el);
      if (o < 0.05 || o >= 0.95 || !el.isConnected || el.closest('[inert],[data-testid=toast],[data-testid=sheet],[data-testid=sheet-scrim],.leaflet-container')) continue;
      // Its card: itself or a box inside it nearly its size, with a backing or a border.
      const er = rect(el);
      let panel = null;
      for (const e of [el, ...el.querySelectorAll('div')]) {
        const r0 = rect(e);
        if (r0.w * r0.h < 0.8 * er.w * er.h) continue;
        if (alpha(e) > 0.2 || parseFloat(style(e).borderTopWidth) > 0) { panel = e; break; }
      }
      if (!panel || !(panel.innerText || '').trim()) continue;
      const pr = rect(panel);
      if (pr.w < 100 || pr.h < 30 || pr.h > innerHeight / 2) continue;
      for (const l of lines) {
        if (panel.contains(l.el)) continue;
        const x = inter(pr, l.r);
        if (!x || x.w < 3 || x.h < 0.4 * l.r.h) continue;
        const name = (panel.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 40);
        const key = 'card ' + name + '|' + l.t;
        if (said.has(key)) continue;
        said.add(key);
        st.found.push({ a: `the fading card "${name}"`, b: l.t, at: Date.now(), boxes: [pr, l.r].map((r) => ({ x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.w), h: Math.round(r.h) })) });
        if (st.found.length === 1 && window.__scorecardHit) window.__scorecardHit('overlap-1');
      }
    }
    lines.sort((p, q) => p.r.y - q.r.y);
    for (let i = 0; i < lines.length; i++) {
      for (let j = i + 1; j < lines.length && lines[j].r.y < lines[i].r.y + lines[i].r.h; j++) {
        const a = lines[i]; const b = lines[j];
        if (a.n === b.n) continue;
        const x = inter(a.r, b.r);
        if (!x || x.w < 3 || x.h < 0.4 * Math.min(a.r.h, b.r.h)) continue;
        const key = a.t + '|' + b.t;
        if (said.has(key)) continue;
        // Both on show at the overlap: nothing that hides what's under it lies between them.
        const keep = [a.el, b.el].map((e) => [e, e.style.getPropertyValue('pointer-events'), e.style.getPropertyPriority('pointer-events')]);
        for (const [e] of keep) e.style.setProperty('pointer-events', 'auto', 'important');
        const stack = document.elementsFromPoint(x.x + x.w / 2, x.y + x.h / 2);
        for (const [e, v, p] of keep) { if (v) e.style.setProperty('pointer-events', v, p); else e.style.removeProperty('pointer-events'); }
        const ia = stack.findIndex((e) => a.el.contains(e) || e === a.el);
        const ib = stack.findIndex((e) => b.el.contains(e) || e === b.el);
        if (ia < 0 || ib < 0) continue;
        const lo = stack[Math.max(ia, ib)];
        let covered = false;
        for (let k = Math.min(ia, ib) + 1; k < Math.max(ia, ib); k++) if (!stack[k].contains(lo) && hides(stack[k])) { covered = true; break; }
        if (covered) continue;
        said.add(key);
        st.found.push({ a: a.t, b: b.t, at: Date.now(), boxes: [a.r, b.r].map((r) => ({ x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.w), h: Math.round(r.h) })) });
        if (st.found.length === 1 && window.__scorecardHit) window.__scorecardHit('overlap-1');
      }
    }
  }, 100);
}

function checkOverlap(ov) {
  const t0 = ov ? ov.start : 0;
  if (!ov || !ov.found.length) return [];
  const f = ov.found;
  return [{ rule: 'EXIT-OVERLAP', message: `after check-in (task 5), overlapping text: ${f.slice(0, 3).map((o) => `${o.a.startsWith('the fading') ? o.a : `"${o.a}"`} over "${o.b}" (${((o.at - t0) / 1000).toFixed(1)} s after the tap)`).join('; ')}${f.length > 3 ? `; and ${f.length - 3} more` : ''}. Collapse what fades out; never draw it over text` }];
}

/* ------------------------------------------------------------------------------------------------
 * Event cards on show (Tonight's sheet and List, Me): for task 10's meet and CLASH.
 * ---------------------------------------------------------------------------------------------- */

/** In the page: meet cards and rows on show, with title, when, and the tag (GOING, HOSTING...). */
function pageMeetCards(view = 0) {
  const shown = (el) => !el.closest('[inert]') && (!el.checkVisibility || el.checkVisibility({ opacityProperty: true, visibilityProperty: true }));
  const out = [];
  for (const b of document.querySelectorAll('[role=button][aria-label]')) {
    if (!shown(b) || b.getBoundingClientRect().width === 0) continue;
    const label = b.getAttribute('aria-label');
    const parts = label.split(', ');
    const i = parts.findIndex((p, k) => k > 0 && /(^|· )(Live|Tonight|Today|Tomorrow|Mon|Tue|Wed|Thu|Fri|Sat|Sun|Ended)\b/.test(p));
    if (i < 1) continue;
    const lines = (b.innerText || '').split('\n').map((s) => s.trim()).filter(Boolean);
    // The row's tag: GOING, HOSTING..., or a line saying so in words ("You're going (demo)").
    const line = lines.find((l) => /^(going|hosting|checked in|went|invited)$/i.test(l) || /^you'?re going\b/i.test(l)) || '';
    const tag = /going/i.test(line) ? 'going' : line;
    const when = (parts[i].match(/\b((?:Mon|Tue|Wed|Thu|Fri|Sat|Sun|Tonight|Today|Tomorrow)\w* \d\d:\d\d)/) || [])[1] || '';
    out.push({ label, title: parts[i - 1], when, tag: tag.toLowerCase(), screen: `${location.pathname}#${view}` });
  }
  return out;
}

/** "Sun 10:00" -> minutes from the start of the week (Sun 0), or null. */
function weekMinutes(when) {
  const m = (when || '').match(/^(Sun|Mon|Tue|Wed|Thu|Fri|Sat)\w* (\d\d):(\d\d)/);
  if (!m) return null;
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(m[1]) * 1440 + Number(m[2]) * 60 + Number(m[3]);
}

/**
 * Task 10 as a newcomer reads it: "the Sunday coffee meet" is any meet with "coffee" in its name
 * on a Sunday (by name or time). More than one such meet on show is a duplicate-name trap (an app
 * problem: the tester can't tell which one); the target is the one you're going to.
 */
function sundayCoffee(cards) {
  const match = (c) => /coffee/i.test(c.title) && (/sunday/i.test(c.title) || /^Sun\b/.test(c.when));
  const byKey = new Map();
  const perScreen = new Map();
  for (const c of cards.filter(match)) {
    const key = `${c.title.toLowerCase()}|${c.when}`;
    if (!byKey.has(key)) byKey.set(key, c);
    if (c.tag === 'going') byKey.get(key).tag = 'going';
    const s = `${c.screen}|${key}`;
    perScreen.set(s, (perScreen.get(s) || 0) + 1);
  }
  const meets = [...byKey.values()];
  // The same name and time twice on one screen is two meets, not one seen twice.
  const twins = Math.max(0, ...[...perScreen.values()].map((n) => n - 1));
  const target = meets.filter((c) => c.tag === 'going');
  return { meets, count: meets.length + twins, target: target.length === 1 ? target[0] : null, going: target.length };
}

/** CLASH (2, 31): hosting at a time you're already going somewhere needs a warning before posting. */
function checkClash({ cards, hosted, hostedWhen, warned, warning }) {
  const start = weekMinutes(hostedWhen);
  if (start == null) return [];
  const clash = cards.filter((c) => c.tag === 'going' && c.title !== hosted && weekMinutes(c.when) != null && Math.abs(weekMinutes(c.when) - start) < 180);
  if (!clash.length || warned) return [];
  const c = clash[0];
  return [{ rule: 'CLASH', message: `hosting "${hosted}" at ${hostedWhen} (task 9) while going to "${c.title}" (${c.when}): no clash warning on Check and post or before posting${warning ? ` (saw "${warning}")` : ''}. Say "You're going to ${c.title} at ${c.when}." with "Post anyway"` }];
}

/** The clash words looked for on Check and post and in a sheet after Post meet. */
const CLASH_WORDS = /you'?re (already )?going to|already going|same time|clash|overlaps?/i;

module.exports = {
  pagePhotos, checkPhotoScale, notePhotos, checkPhotoReuse, pageDistances, checkHomeDistances, miles,
  checkCancelledOnce, pageCheckedIn, checkCheckedIn, watchReveal, checkReveal, watchOverlap, checkOverlap, pageMeetCards, sundayCoffee,
  weekMinutes, checkClash, CLASH_WORDS,
};

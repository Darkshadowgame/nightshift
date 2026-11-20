// Rule checks run at every step of the scorecard tasks (docs/REDESIGN-2.md sections 4 and 8).
// Each returns a list of findings ({ rule, message }); the runner adds the step and screenshot.
// Allow-lists live in ./allow/*.json, each entry with a "why".
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const ALLOW = (name) => JSON.parse(fs.readFileSync(path.join(__dirname, 'allow', name), 'utf8'));
const rx = (s, f = '') => new RegExp(s, f);

/** BANNED_WORDS from src/lib/glossary.ts (the list the glossary test uses), read from the source. */
function bannedWords() {
  const src = fs.readFileSync(path.join(ROOT, 'src', 'lib', 'glossary.ts'), 'utf8');
  const m = src.match(/export const BANNED_WORDS[^=]*=\s*(\[[\s\S]*?\n\]);/);
  if (!m) throw new Error('Could not find BANNED_WORDS in src/lib/glossary.ts');
  // The array holds only string and regex literals, so it evaluates as plain JavaScript.
  return new Function(`return ${m[1]};`)().map((b) => ({ word: b.word, re: b.re }));
}

/**
 * In the page: every visible text node, with flags for where it sits. Whole page, not just the fold.
 * Screens behind the one on show (other tabs, the screen under a push) are `inert`: left out.
 */
function pageText() {
  const out = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const text = n.textContent.replace(/\s+/g, ' ').trim();
    if (!text) continue;
    const el = n.parentElement;
    if (!el || el.closest('script,style,noscript,[inert]')) continue;
    if (el.checkVisibility && !el.checkVisibility({ opacityProperty: true, visibilityProperty: true })) continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    out.push({
      text,
      toast: !!el.closest('[data-testid=toast]'),
      sheet: !!el.closest('[data-testid=sheet]'),
      live: el.closest('[aria-live]') ? el.closest('[aria-live]').getAttribute('aria-label') || '' : '',
    });
  }
  return out;
}

/** In the page: text cut off sideways (one-line ellipsis) or by a line clamp, plus text off the right edge. */
function pageOverflow() {
  const out = [];
  // A line clamp cuts text only if the text is taller without it (scrollHeight alone is off by
  // a pixel or two with some fonts).
  const clampedText = (el) => {
    const h0 = el.getBoundingClientRect().height;
    const prev = el.getAttribute('style');
    el.style.setProperty('-webkit-line-clamp', 'unset', 'important');
    el.style.setProperty('max-height', 'none', 'important');
    const h1 = el.getBoundingClientRect().height;
    if (prev == null) el.removeAttribute('style'); else el.setAttribute('style', prev);
    return h1 > h0 + 2;
  };
  const own = (el) => [...el.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim());
  for (const el of document.querySelectorAll('[data-sc-clip]')) el.removeAttribute('data-sc-clip');
  for (const el of document.body.querySelectorAll('*')) {
    if (!own(el)) continue;
    if (el.checkVisibility && !el.checkVisibility({ opacityProperty: true, visibilityProperty: true })) continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    const s = getComputedStyle(el);
    const text = el.textContent.replace(/\s+/g, ' ').trim();
    const clipsX = s.overflow === 'hidden' || s.overflowX === 'hidden' || s.textOverflow === 'ellipsis';
    const clamp = s.webkitLineClamp && s.webkitLineClamp !== 'none';
    let kind = '';
    if (clipsX && el.scrollWidth > el.clientWidth + 1) kind = 'cut off (ellipsis)';
    else if (clamp && clampedText(el)) kind = `cut to ${s.webkitLineClamp} line(s)`;
    else if ((s.overflow === 'hidden' || s.overflowY === 'hidden') && el.scrollHeight > el.clientHeight + 2) kind = 'cut off (height)';
    // Off the right edge of the screen, unless inside something that scrolls sideways.
    if (!kind && r.right > innerWidth + 1) {
      let scrolls = false;
      for (let p = el.parentElement; p; p = p.parentElement) { const ps = getComputedStyle(p); if (/(auto|scroll)/.test(ps.overflowX) && p.scrollWidth > p.clientWidth) { scrolls = true; break; } }
      if (!scrolls) kind = 'off the right edge';
    }
    if (kind) {
      el.setAttribute('data-sc-clip', String(out.length));
      out.push({ text: text.slice(0, 80), kind, x: Math.round(r.x), y: Math.round(r.y), idx: out.length });
    }
  }
  return out;
}

let BANNED;
/**
 * Words the scorecard scans for beyond BANNED_WORDS (rule WORDS), in the visible text and in the
 * labels of controls on show. Review 20 (37): the app says "meet"; "event" is the code's word.
 */
const EXTRA_WORDS = [{ word: 'event', re: /\bevents?\b/i }];

/** In the page: the accessibility labels of controls on show (a screen reader says these). */
function pageLabels() {
  const shown = (el) => !el.closest('[inert]') && (!el.checkVisibility || el.checkVisibility({ opacityProperty: true, visibilityProperty: true }));
  const out = new Set();
  for (const el of document.querySelectorAll('[role=button][aria-label],[role=link][aria-label],[role=switch][aria-label],[role=tab][aria-label],button[aria-label]')) {
    // Sheets' labels are WORDS-SHEET's (checks-r21.cjs), from every sheet the run opens.
    if (shown(el) && !el.closest('[data-testid=sheet]') && el.getBoundingClientRect().width > 0) out.add(el.getAttribute('aria-label').replace(/\s+/g, ' ').trim());
  }
  return [...out];
}

/** 4.12: banned words in the visible text, minus the owner exceptions in allow/words.json; WORDS: EXTRA_WORDS, in text and labels. */
function checkWords(texts, url, labels = []) {
  BANNED = BANNED || bannedWords();
  const allow = ALLOW('words.json').allow;
  const found = [];
  const ok = (word, text, sheet) => allow.some((a) => a.word === word && rx(a.text).test(text) && (!a.url || rx(a.url).test(url)) && (!a.sheet || sheet));
  for (const t of texts) {
    for (const b of BANNED) {
      if (!b.re.test(t.text)) continue;
      if (!ok(b.word, t.text, t.sheet)) found.push({ rule: '4.12', message: `banned word "${b.word}" in "${t.text}"` });
    }
    // Sheet text: WORDS-SHEET, from every sheet the run opens (Review 21 #19).
    for (const b of EXTRA_WORDS) if (b.re.test(t.text) && !t.sheet && !ok(b.word, t.text, t.sheet)) found.push({ rule: 'WORDS', message: `"${b.word}" in "${t.text}" on ${url.replace(/\/[0-9a-f-]{36}/g, '/:new')}; the app says "meet"` });
  }
  for (const l of labels) for (const b of EXTRA_WORDS) if (b.re.test(l) && !ok(b.word, l, false)) found.push({ rule: 'WORDS', message: `"${b.word}" in the label "${l}" on ${url.replace(/\/[0-9a-f-]{36}/g, '/:new')}; the app says "meet"` });
  return dedupe(found);
}

/** Whether words.json allows `word` in `text` on a sheet at `url` (for WORDS-SHEET). */
function allowSheetWord(word, text, url) {
  return ALLOW('words.json').allow.some((a) => a.word === word && rx(a.text).test(text) && (!a.url || rx(a.url).test(url)));
}

/** L2: clipped text, minus allow/overflow.json. */
function checkOverflow(items, url, scale) {
  const allow = ALLOW('overflow.json').allow;
  return dedupe(items
    .filter((o) => !allow.some((a) => rx(a.text).test(o.text) && (!a.url || rx(a.url).test(url)) && (!a.scale || a.scale === scale)))
    .map((o) => ({ rule: 'L2', message: `text ${o.kind} at ${o.x},${o.y}: "${o.text}"`, idx: o.idx, y: o.y })));
}

/**
 * C5 on an event page: "Going", "Live", each HH:MM time and the meet point's name said at most once
 * in the visible text (toasts and sheets left out). allow/c5.json lists text that doesn't count
 * (the count "11 going", chat message times, ...).
 */
function checkFacts(texts) {
  const conf = ALLOW('c5.json');
  const page = texts.filter((t) => !t.toast && !t.sheet);
  const strip = (key, s) => conf.allow.filter((a) => a.key === key).reduce((acc, a) => acc.replace(rx(a.text, 'gi'), ' '), s);
  const counts = {};
  const add = (k, src) => { (counts[k] = counts[k] || []).push(src); };
  // The meet point: from the location line ("Leisure park car park, Tamworth." / "Now at X. ...").
  const places = new Set();
  for (const t of page) {
    const m = t.text.match(/^(?:Now at )?([^,.]{3,}?)(?:, [^,.]+)?\.(?: Next location.*)?$/);
    if (t.live && m && t.live === t.text) places.add(m[1].trim());
  }
  for (const t of page) {
    for (const _ of strip('going', t.text).matchAll(/\bgoing\b/gi)) add('"Going"', t.text);
    for (const _ of strip('live', t.text).matchAll(/\blive\b/gi)) add('"Live"', t.text);
    for (const m of strip('time', t.text).matchAll(/\b(?:[01]\d|2[0-3]):[0-5]\d\b/g)) add(`the time ${m[0]}`, t.text);
    for (const p of places) {
      const re = new RegExp(`\\b${p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      for (const _ of strip('place', t.text).matchAll(re)) add(`the place "${p}"`, t.text);
    }
  }
  return Object.entries(counts)
    .filter(([, v]) => v.length > 1)
    .map(([k, v]) => ({ rule: 'C5', message: `${k} said ${v.length} times: ${v.map((s) => `"${s}"`).join(', ')}` }));
}

/** Console errors, minus allow/console.json. */
function checkConsole(errors) {
  const allow = ALLOW('console.json').allow;
  return errors.filter((e) => !allow.some((a) => rx(a.text).test(e.text))).map((e) => ({ rule: 'console', message: `${e.text} (on ${e.url})` }));
}

/** 4.7: every toast on screen, unfaded and uncovered, for 2 s at a stretch; no action but Undo. */
function checkToasts(toasts) {
  const out = [];
  for (const t of toasts) {
    const where = `toast "${t.text}" (${t.task || 'start'}, ${t.url})`;
    if (t.bestRunMs < 2000) {
      out.push({ rule: '4.7', task: t.task, toastId: t.id, message: `${where} was readable for only ${(t.bestRunMs / 1000).toFixed(1)} s at a stretch (needs 2 s)${t.coveredBy ? `; covered by ${t.coveredBy}` : ''}` });
    }
    const bad = t.actions.filter((a) => !/^undo$/i.test(a));
    if (bad.length) out.push({ rule: '4.7', task: t.task, toastId: t.id, message: `${where} has an action other than Undo: ${bad.join(', ')}` });
  }
  return out;
}

/** 4.3: a disabled primary anywhere (ActionBar, sheet or page). */
function checkDisabled(list) {
  return list.map((d) => ({ rule: '4.3', task: d.task, message: `disabled primary "${d.text}" in the ${d.where} on ${d.url}` }));
}

function dedupe(list) {
  const seen = new Set();
  return list.filter((f) => (seen.has(f.message) ? false : (seen.add(f.message), true)));
}

/** In the page: scroll a clipped element into view; returns how to scroll back. */
function revealClip(idx) {
  const el = document.querySelector(`[data-sc-clip="${idx}"]`);
  if (!el) return [];
  const saved = [];
  for (let p = el.parentElement; p; p = p.parentElement) if (p.scrollHeight > p.clientHeight || p.scrollWidth > p.clientWidth) saved.push([p, p.scrollTop, p.scrollLeft]);
  el.scrollIntoView({ block: 'center', inline: 'nearest' });
  window.__scBack = saved;
  return saved.length;
}
function restoreScroll() {
  for (const [p, t, l] of window.__scBack || []) { p.scrollTop = t; p.scrollLeft = l; }
  window.__scBack = [];
}

module.exports = { ...require('./checks-more.cjs'), ...require('./checks-r20.cjs'), ...require('./checks-r21.cjs'), allowSheetWord, pageLabels, EXTRA_WORDS, revealClip, restoreScroll, pageText, pageOverflow, checkWords, checkOverflow, checkFacts, checkConsole, checkToasts, checkDisabled, bannedWords };

/**
 * Reading a dyno sheet: recognised text (on-device OCR, see ocr.ts) in, peak power and torque out.
 * Pure, so it's tested against text from real sheet layouts (Dynojet, MAHA, Dastek, Mustang).
 *
 * It never decides for the person: the numbers it finds are shown in editable fields ("We read
 * 312 bhp and 295 lb-ft: check these") and nothing is saved until they say so.
 *
 * - Power in bhp, hp, whp, PS (or CV) and kW; torque in Nm, lb-ft and ft-lb. Converted to bhp and
 *   lb-ft, keeping the unit the sheet used.
 * - Labels: "Max Power", "Peak HP", "Power:", MAHA's P-Norm / P-Mot / P-Rad, "Max Torque", M-Norm.
 * - Tables of rpm rows (an "RPM … Power … Torque" header, then numbers): the highest in each column.
 * - Several runs: the one labelled final (or best), else the highest.
 * - Wheel or flywheel (crank) wording; with both on the sheet, the crank figure and its torque.
 * - A confidence from 0 to 1: how sure the reading is, so the form can say "check these" louder.
 */

export type PowerUnit = 'bhp' | 'hp' | 'whp' | 'PS' | 'kW';
export type TorqueUnit = 'lb-ft' | 'Nm';
export type DynoAt = 'wheels' | 'crank';

export interface DynoReading {
  /** Peak power in bhp (rounded to 0.1), or undefined if none was found. */
  powerBhp?: number;
  /** Peak torque in lb-ft (rounded to 0.1). */
  torqueLbFt?: number;
  /** The figures as printed, and their units. */
  power?: { value: number; unit: PowerUnit };
  torque?: { value: number; unit: TorqueUnit };
  /** Wheel or crank, when the sheet says; undefined when it doesn't. */
  at?: DynoAt;
  /** 0 (nothing read) to 1 (labelled peak figures with units). */
  confidence: number;
}

const PS_TO_BHP = 0.98632;
const KW_TO_BHP = 1.34102;
const NM_TO_LBFT = 0.737562;

export function toBhp(value: number, unit: PowerUnit): number {
  return unit === 'kW' ? value * KW_TO_BHP : unit === 'PS' ? value * PS_TO_BHP : value;
}

export function toLbFt(value: number, unit: TorqueUnit): number {
  return unit === 'Nm' ? value * NM_TO_LBFT : value;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

function powerUnit(raw: string): PowerUnit | null {
  const u = raw.toLowerCase().replace(/[^a-z]/g, '');
  if (u === 'kw') return 'kW';
  if (u === 'ps' || u === 'cv') return 'PS';
  if (u === 'whp' || u === 'rwhp' || u === 'awhp') return 'whp';
  if (u === 'bhp') return 'bhp';
  if (u === 'hp') return 'hp';
  return null;
}

function torqueUnit(raw: string): TorqueUnit | null {
  const u = raw.toLowerCase().replace(/[^a-z]/g, '');
  if (u === 'nm') return 'Nm';
  if (u === 'lbft' || u === 'ftlb' || u === 'ftlbs' || u === 'lbsft' || u === 'lbfft') return 'lb-ft';
  return null;
}

const NUM = String.raw`(\d{1,4}(?:[.,]\d{1,2})?)`;
const P_UNIT = String.raw`(r?whp|awhp|bhp|hp|ps|cv|kw)`;
const T_UNIT = String.raw`(n\s?[·.]?\s?m|lbs?[\s.-]?ft|ft[\s.-]?lbs?|lbf[\s.-]?ft)`;

const WHEEL = /\b(wheels?|whp|rwhp|awhp|p[\s_-]?rad|radleistung|at the wheel|tyre|tire)\b/i;
const CRANK = /\b(fly\s?wheel|crank|engine power|p[\s_-]?mot|p[\s_-]?norm|p[\s_-]?eng|motorleistung|corrected engine|at the engine)\b/i;
const POWER_LABEL = /\b(max(imum)?\.?\s*(power|hp|bhp|ps|kw)|peak\s*(power|hp|bhp|whp)?|power\s*[:=]|p[\s_-]?(norm|mot|rad|eng)|hp\s*[:=]|bhp\s*[:=])/i;
const TORQUE_LABEL = /\b(max(imum)?\.?\s*(torque|tq)|peak\s*(torque|tq)|torque\s*[:=]|tq\s*[:=]|m[\s_-]?(norm|mot|rad))/i;
const RUN = /\b(run|pull)\s*#?\s*(\d+)\b/i;
const FINAL = /\b(final|best|after)\b/i;

const num = (s: string) => Number(s.replace(',', '.'));

interface Hit {
  kind: 'power' | 'torque';
  value: number;
  unit: PowerUnit | TorqueUnit | null;
  labelled: boolean;
  at?: DynoAt;
  run: number;
  final: boolean;
  /** Found in an rpm table (the column's highest). */
  table?: boolean;
}

/** Wheel or crank for a line ("P-Rad", "at the wheels", "flywheel"). */
function atOf(line: string): DynoAt | undefined {
  if (WHEEL.test(line)) return 'wheels';
  if (CRANK.test(line)) return 'crank';
  return undefined;
}

/** The units a table header or the whole sheet uses, for numbers printed without one. */
function sheetUnits(text: string): { power: PowerUnit | null; torque: TorqueUnit | null } {
  const p = new RegExp(String.raw`[(\[\s]${P_UNIT}[)\]\s]`, 'i').exec(` ${text} `);
  const t = new RegExp(String.raw`[(\[\s]${T_UNIT}[)\]\s.]`, 'i').exec(` ${text} `);
  return { power: p ? powerUnit(p[1]) : null, torque: t ? torqueUnit(t[1]) : null };
}

/** Rows of an rpm table: a header naming rpm and power and/or torque, then rows of numbers. */
function tableHits(lines: string[], runOf: (i: number) => { run: number; final: boolean }): Hit[] {
  const hits: Hit[] = [];
  for (let h = 0; h < lines.length; h++) {
    const header = lines[h].toLowerCase();
    if (!/\brpm\b|1\/min/.test(header)) continue;
    // Column order from the header's words.
    const cols: ('rpm' | 'power' | 'torque' | null)[] = [];
    for (const w of header.replace(/\(.*?\)|\[.*?\]/g, ' ').split(/\s+/).filter(Boolean)) {
      if (/^(rpm|1\/min|engine speed|speed)$/.test(w)) cols.push('rpm');
      else if (/^(power|hp|bhp|whp|ps|kw|pwr|p)$/.test(w)) cols.push('power');
      else if (/^(torque|tq|nm|lb-?ft|ft-?lb|trq|m)$/.test(w)) cols.push('torque');
    }
    if (!cols.includes('power') && !cols.includes('torque')) continue;
    const units = sheetUnits(lines[h]);
    const best: { power: number; torque: number } = { power: 0, torque: 0 };
    let rows = 0;
    for (let r = h + 1; r < lines.length; r++) {
      const cells = lines[r].trim().split(/\s+/);
      if (!cells.length || !cells.every((c) => /^\d+(?:[.,]\d+)?$/.test(c))) {
        if (rows > 0) break;
        continue;
      }
      rows++;
      cells.forEach((c, i) => {
        const col = cols[i];
        if (col === 'power') best.power = Math.max(best.power, num(c));
        if (col === 'torque') best.torque = Math.max(best.torque, num(c));
      });
    }
    if (rows < 2) continue;
    const { run, final } = runOf(h);
    const at = atOf(lines[h]);
    if (best.power) hits.push({ kind: 'power', value: best.power, unit: units.power, labelled: true, table: true, at, run, final });
    if (best.torque) hits.push({ kind: 'torque', value: best.torque, unit: units.torque, labelled: true, table: true, at, run, final });
  }
  return hits;
}

/** Peak power and torque from a dyno sheet's recognised text. Never throws. */
export function parseDynoText(text: string | null | undefined): DynoReading {
  if (!text || !text.trim()) return { confidence: 0 };
  const lines = text.replace(/\r/g, '').split('\n').map((l) => l.replace(/\s+$/, ''));
  const sheet = sheetUnits(text);
  const sheetAt = atOf(text);

  // Which run each line belongs to ("Run 2", "Final run").
  const runAt: { run: number; final: boolean }[] = [];
  let run = 0;
  let final = false;
  for (const line of lines) {
    const m = RUN.exec(line);
    if (m) {
      run = Number(m[2]);
      final = FINAL.test(line);
    } else if (/^\s*(final|best)\b/i.test(line)) {
      run = 1000;
      final = true;
    }
    runAt.push({ run, final });
  }

  const hits: Hit[] = tableHits(lines, (i) => runAt[i]);
  const powerRe = new RegExp(String.raw`${NUM}\s*${P_UNIT}\b`, 'gi');
  const powerBefore = new RegExp(String.raw`\b${P_UNIT}\s*[:=]?\s*${NUM}(?!\s*(?:rpm|1\/min))`, 'gi');
  const torqueRe = new RegExp(String.raw`${NUM}\s*${T_UNIT}`, 'gi');
  const labelNum = new RegExp(String.raw`[:=]?\s*${NUM}(?!\s*(?:rpm|1\/min|%|°|mph|km))`, 'i');

  lines.forEach((line, i) => {
    const { run: r, final: f } = runAt[i];
    const at = atOf(line);
    const pLabel = POWER_LABEL.test(line);
    const tLabel = TORQUE_LABEL.test(line);
    let pFound = false;
    let tFound = false;
    for (const m of line.matchAll(torqueRe)) {
      const v = num(m[1]);
      tFound = true;
      hits.push({ kind: 'torque', value: v, unit: torqueUnit(m[2]), labelled: tLabel, at, run: r, final: f });
    }
    // Torque units first, so "lb-ft" never reads as power; then power with its unit after or before.
    const withoutTorque = line.replace(torqueRe, ' ');
    for (const m of withoutTorque.matchAll(powerRe)) {
      pFound = true;
      hits.push({ kind: 'power', value: num(m[1]), unit: powerUnit(m[2]), labelled: pLabel, at: at ?? (/w|rwhp/i.test(m[2]) ? 'wheels' : undefined), run: r, final: f });
    }
    if (!pFound) {
      for (const m of withoutTorque.matchAll(powerBefore)) {
        pFound = true;
        hits.push({ kind: 'power', value: num(m[2]), unit: powerUnit(m[1]), labelled: pLabel || /^(hp|bhp|whp|ps|kw)$/i.test(m[1]), at, run: r, final: f });
      }
    }
    // "Max Power = 287.4" with the unit only in a header.
    if (pLabel && !pFound) {
      const after = line.slice(line.search(POWER_LABEL));
      const m = labelNum.exec(after.replace(POWER_LABEL, ''));
      if (m) hits.push({ kind: 'power', value: num(m[1]), unit: sheet.power, labelled: true, at, run: r, final: f });
    }
    if (tLabel && !tFound) {
      const after = line.slice(line.search(TORQUE_LABEL));
      const m = labelNum.exec(after.replace(TORQUE_LABEL, ''));
      if (m) hits.push({ kind: 'torque', value: num(m[1]), unit: sheet.torque, labelled: true, at, run: r, final: f });
    }
  });

  const sane = (h: Hit) => {
    const unit = h.unit ?? (h.kind === 'power' ? 'hp' : 'lb-ft');
    const v = h.kind === 'power' ? toBhp(h.value, unit as PowerUnit) : toLbFt(h.value, unit as TorqueUnit);
    return h.kind === 'power' ? v >= 20 && v <= 2500 : v >= 10 && v <= 2000;
  };
  const good = hits.filter(sane);

  /** Of several figures: the final run's, else the crank one, else labelled peaks, then the highest. */
  function pick(kind: 'power' | 'torque', preferAt?: DynoAt): Hit | undefined {
    let list = good.filter((h) => h.kind === kind);
    if (!list.length) return undefined;
    if (list.some((h) => h.final)) list = list.filter((h) => h.final);
    if (preferAt && list.some((h) => h.at === preferAt)) list = list.filter((h) => h.at === preferAt);
    else if (list.some((h) => h.at === 'crank')) list = list.filter((h) => h.at === 'crank');
    if (list.some((h) => h.labelled)) list = list.filter((h) => h.labelled);
    const value = (h: Hit) => (kind === 'power' ? toBhp(h.value, (h.unit ?? 'hp') as PowerUnit) : toLbFt(h.value, (h.unit ?? 'lb-ft') as TorqueUnit));
    // The same figure in two units ("245.6 kW  334.0 PS") keeps the first printed.
    return [...list].sort((a, b) => {
      const d = value(b) - value(a);
      return Math.abs(d) < 0.005 * Math.max(value(a), value(b)) ? 0 : d;
    })[0];
  }

  const p = pick('power');
  const t = pick('torque', p?.at);
  const out: DynoReading = { confidence: 0 };
  let score = 0;
  if (p) {
    const unit = (p.unit ?? 'hp') as PowerUnit;
    out.power = { value: p.value, unit };
    out.powerBhp = round1(toBhp(p.value, unit));
    score += p.labelled && p.unit ? 0.55 : p.labelled || p.unit ? 0.4 : 0.25;
  }
  if (t) {
    const unit = (t.unit ?? 'lb-ft') as TorqueUnit;
    out.torque = { value: t.value, unit };
    out.torqueLbFt = round1(toLbFt(t.value, unit));
    score += t.labelled && t.unit ? 0.35 : t.labelled || t.unit ? 0.25 : 0.15;
  }
  const at = p?.at ?? (p?.unit === 'whp' ? 'wheels' : undefined) ?? sheetAt;
  if (at) {
    out.at = at;
    score += 0.1;
  }
  out.confidence = Math.min(1, round1(score * 100) / 100);
  return out;
}

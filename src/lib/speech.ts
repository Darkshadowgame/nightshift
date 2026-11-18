/**
 * What the driving view says, in plain UK speech. Apple's instructions are written for the
 * screen ("At the roundabout, take the 2nd exit onto A5"); read out as they are, they sound
 * robotic. This turns them into what a person would say ("Take the second exit at the
 * roundabout, onto the A5"). Pure; the banner keeps Apple's wording.
 */

const ORDINALS: Record<string, string> = { '1st': 'first', '2nd': 'second', '3rd': 'third', '4th': 'fourth', '5th': 'fifth', '6th': 'sixth', '7th': 'seventh', '8th': 'eighth' };

const ABBREVIATIONS: [RegExp, string][] = [
  [/\bRd\b\.?/g, 'Road'],
  [/\bSt\b\.?(?=\s*($|[,.]))/g, 'Street'],
  [/\bAve\b\.?/g, 'Avenue'],
  [/\bLn\b\.?/g, 'Lane'],
  [/\bDr\b\.?(?=\s*($|[,.]))/g, 'Drive'],
  [/\bCl\b\.?(?=\s*($|[,.]))/g, 'Close'],
  [/\bJct\b\.?/g, 'junction'],
];

/** A UK road number: A5, M6, B5440, A38(M), M6 Toll. */
const ROAD = /\b([ABM])(\d{1,4})(\(M\))?(?=\b|\s|$)/g;

/**
 * Road numbers said the British way: "A5" stays (the voice says "A five"), long numbers are read
 * digit by digit ("A4091" → "A 4 0 9 1", said "A four oh nine one" rather than "A four thousand
 * and ninety one"), "(M)" is dropped, and a road number after onto / on / towards / join gets "the".
 */
export function spokenRoads(text: string): string {
  let t = text.replace(ROAD, (_m, letter: string, num: string) => {
    const digits = num.length >= 3 ? num.split('').map((d) => (d === '0' ? 'oh' : d)).join(' ') : num;
    return `${letter}${num.length >= 3 ? ' ' : ''}${digits}`;
  });
  t = t.replace(/\b(onto|on to|on|towards|toward|join|joining|along|via)\s+(?!the\b)(?=[ABM]\s?\d)/gi, '$1 the ');
  return t;
}

function sentenceCase(s: string): string {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

/**
 * One instruction as it should be said: short, UK wording, no symbols. Leaves anything it doesn't
 * recognise as it was (beyond the tidying), so a new Apple phrasing is never lost.
 */
export function spokenInstruction(text: string): string {
  let t = text.trim().replace(/[.!]+$/, '');
  t = t.replace(/\b(\d)(st|nd|rd|th)\b/g, (m) => ORDINALS[m.toLowerCase()] ?? m);
  for (const [re, word] of ABBREVIATIONS) t = t.replace(re, word);
  t = t.replace(/\btoward\b/gi, 'towards');
  // "At the roundabout, take the second exit onto A5" → "Take the second exit at the roundabout, onto A5".
  const r = /^at the (roundabout|traffic circle|rotary),?\s*take the (\w+) exit(.*)$/i.exec(t);
  if (r) t = `Take the ${r[2].toLowerCase()} exit at the roundabout${r[3].trim() ? `, ${r[3].trim().replace(/^,\s*/, '')}` : ''}`;
  // "Turn right onto High Street, then turn left" is said as two short phrases by the caller.
  t = spokenRoads(t);
  t = t.replace(/\s{2,}/g, ' ').replace(/\s+,/g, ',');
  return sentenceCase(t);
}

/** With the first letter lowered, to follow "In 1 mile, …". */
export function spokenAfter(text: string): string {
  const s = spokenInstruction(text);
  // Keep road numbers and names capitalised: only the first word of a sentence-style phrase goes lower.
  return /^(Take|Turn|Keep|Bear|Continue|Make|At|Go|Head|Exit|Merge|Stay|Join|Arrive)\b/.test(s) ? s[0].toLowerCase() + s.slice(1) : s;
}

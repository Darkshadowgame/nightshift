/**
 * A credit line in its shortest honest form, for a corner of a map that can't grow (the driving
 * view's route credit, Review 15: at 1.3x text the full "Route © OpenStreetMap contributors, OSRM"
 * became a two-line block beside Report). Every holder once, OpenStreetMap as "OSM":
 *
 *   "Route © OpenStreetMap contributors, OSRM · Speed cameras © OpenStreetMap contributors (ODbL)"
 *   → "© OSM, OSRM"
 *
 * The full line stays the accessibility label.
 */
export function compactCredit(line: string): string {
  const holders: string[] = [];
  for (const part of line.split(/\s+·\s+/)) {
    const at = part.indexOf('©');
    const who = (at < 0 ? part : part.slice(at + 1))
      .replace(/\([^)]*\)/g, '')
      .replace(/openstreetmap( contributors)?/gi, 'OSM')
      .split(/\s*,\s*/)
      .map((w) => w.trim())
      .filter(Boolean);
    for (const w of who) if (!holders.includes(w)) holders.push(w);
  }
  return holders.length ? `© ${holders.join(', ')}` : line;
}

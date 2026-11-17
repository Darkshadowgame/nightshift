/**
 * Ids made on the phone. UUIDs (v4), so a build, chat line or event made on
 * the phone can keep the same id on the server. The prefix is only a hint for
 * readers of the code; it isn't part of the id.
 */
export function uuid(random: () => number = Math.random): string {
  const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (random === Math.random && typeof c?.randomUUID === 'function') return c.randomUUID();
  const hex = Array.from({ length: 32 }, () => Math.floor(random() * 16));
  hex[12] = 4;
  hex[16] = (hex[16] & 0x3) | 0x8;
  const s = hex.map((n) => n.toString(16)).join('');
  return `${s.slice(0, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}-${s.slice(16, 20)}-${s.slice(20)}`;
}

export function newId(_prefix?: string): string {
  return uuid();
}

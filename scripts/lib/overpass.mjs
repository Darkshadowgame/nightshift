// Polite Overpass client for the build scripts: one query at a time, a plain
// app User-Agent with no personal contact details, a server-side timeout, and
// backoff when the server is busy (it often answers 502 "at capacity").

// The main public instance. Set OVERPASS_URL to use another (e.g. your own).
const ENDPOINTS = [process.env.OVERPASS_URL || 'https://overpass-api.de/api/interpreter'];

const USER_AGENT = 'nightshift-app-build';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function overpass(query, { tries = 14, clientTimeoutMs = 240_000 } = {}) {
  let wait = 20_000;
  let lastError;
  for (let attempt = 0; attempt < tries; attempt++) {
    const url = ENDPOINTS[attempt % ENDPOINTS.length];
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'User-Agent': USER_AGENT, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(query)}`,
        signal: AbortSignal.timeout(clientTimeoutMs),
      });
      const text = await res.text();
      if (res.ok && text.trimStart().startsWith('{')) {
        const json = JSON.parse(text);
        if (json.remark && /runtime error|timed out/i.test(json.remark)) throw new Error(`Overpass: ${json.remark}`);
        return json;
      }
      throw new Error(`HTTP ${res.status} from ${url}: ${text.slice(0, 120).replace(/\s+/g, ' ')}`);
    } catch (e) {
      lastError = e;
      console.error(`  attempt ${attempt + 1} failed: ${e.message}. Waiting ${wait / 1000}s.`);
      await sleep(wait);
      wait = Math.min(Math.round(wait * 1.5), 120_000);
    }
  }
  throw lastError;
}

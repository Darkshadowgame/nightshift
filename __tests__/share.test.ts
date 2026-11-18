import { eventSharePayload, eventShareUrl, shareLink, type ShareEnv } from '../src/lib/share';

const p = { title: 'Sunday coffee and cars', text: 'Sunday coffee and cars · Meet · Sun 10:00 · Around Tamworth', url: 'https://x.test/event/ev-1' };

describe('share: always a next step (Review 11)', () => {
  it('uses the share sheet on the phone, with the link in the message', async () => {
    const sent: unknown[] = [];
    const env: ShareEnv = { os: 'ios', nativeShare: async (m) => void sent.push(m) };
    expect(await shareLink(p, env)).toBe('shared');
    expect(sent).toEqual([{ message: `${p.text} ${p.url}`, title: p.title }]);
    expect(await shareLink(p, { os: 'ios', nativeShare: async () => ({ action: 'dismissedAction' }) })).toBe('dismissed');
    expect(await shareLink(p, { os: 'ios', nativeShare: async () => Promise.reject(new Error('no')) })).toBe('manual');
  });
  it('uses navigator.share on the web when there is one; a cancel is not an error', async () => {
    expect(await shareLink(p, { os: 'web', webShare: async () => undefined })).toBe('shared');
    const abort = Object.assign(new Error('cancel'), { name: 'AbortError' });
    expect(await shareLink(p, { os: 'web', webShare: async () => Promise.reject(abort), copy: async () => undefined })).toBe('dismissed');
  });
  it('copies the link when the browser has no share sheet, or it refuses', async () => {
    const copied: string[] = [];
    expect(await shareLink(p, { os: 'web', copy: async (t) => void copied.push(t) })).toBe('copied');
    expect(await shareLink(p, { os: 'web', webShare: async () => Promise.reject(new Error('NotAllowed')), copy: async (t) => void copied.push(t) })).toBe('copied');
    expect(copied).toEqual([p.url, p.url]);
  });
  it('falls back to showing the link when nothing else works', async () => {
    expect(await shareLink(p, { os: 'web' })).toBe('manual');
    expect(await shareLink(p, { os: 'web', copy: async () => Promise.reject(new Error('denied')) })).toBe('manual');
  });
  it('links to the page on the web, the app link in the app, and never names the meet point', () => {
    expect(eventShareUrl('ev-1', 'https://x.test/')).toBe('https://x.test/event/ev-1');
    expect(eventShareUrl('ev-1', null)).toBe('nightshift://event/ev-1');
    const out = eventSharePayload({ id: 'ev-1', title: 'Sunday coffee and cars', type: 'meet', areaName: 'Tamworth' }, 'Sun 10:00', 'https://x.test');
    expect(out).toEqual(p);
  });
});

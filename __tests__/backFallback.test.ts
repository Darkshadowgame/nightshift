import { fallbackTab, NO_BACK } from '../src/lib/backFallback';

describe('fallbackTab (REVIEW-8: Back with no history goes to the right tab)', () => {
  it('events and places go to Tonight', () => {
    for (const r of ['event/[id]', 'spot/[id]', 'shop/[id]', 'zone/[id]', 'notifications', 'search']) expect(fallbackTab(r)).toBe('/');
  });
  it('people, posts and threads go to Community', () => {
    for (const r of ['user/[id]', 'post/[id]', 'forum/[id]', 'chat/[id]', 'crew/[id]']) expect(fallbackTab(r)).toBe('/community');
  });
  it('builds go to the Garage', () => {
    expect(fallbackTab('build/[id]')).toBe('/garage');
  });
  it('settings and help go to Me', () => {
    expect(fallbackTab('settings')).toBe('/me');
    expect(fallbackTab('help')).toBe('/me');
  });
  it('the entry screens and the tabs never get one', () => {
    for (const r of ['signin', 'welcome', '(tabs)']) expect(NO_BACK.has(r)).toBe(true);
  });
});

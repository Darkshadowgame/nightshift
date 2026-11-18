import { screensClosed } from '../src/lib/openChat';

jest.mock('expo-router', () => ({ router: { push: jest.fn(), dismiss: jest.fn() } }));

const st = (...names: string[]) => ({ index: names.length - 1, routes: names.map((name) => ({ name })) });

describe('openChat (Review 15 decision 3: a chat is never four backs from a tab)', () => {
  it('closes the profile and the going list, so the chat sits on the event page', () => {
    expect(screensClosed(st('(tabs)', 'event/[id]', 'event/going', 'user/[id]'))).toBe(2);
  });
  it('closes only the profile when it was opened from Community or Connections', () => {
    expect(screensClosed(st('(tabs)', 'user/[id]'))).toBe(1);
    expect(screensClosed(st('(tabs)', 'connections', 'user/[id]'))).toBe(1);
  });
  it('never closes the tabs', () => {
    expect(screensClosed(st('user/[id]'))).toBe(0);
  });
});

import { screensClosed } from '../src/lib/openChat';

jest.mock('expo-router', () => ({ router: { push: jest.fn(), dismiss: jest.fn() } }));

const st = (...names: string[]) => ({ index: names.length - 1, routes: names.map((name) => ({ name })) });
/** Backs from the top screen to its tab, once the chat is open. */
const backsToTab = (stack: string[]) => stack.length - screensClosed(st(...stack)); // screens left above the tabs, plus the chat

describe('openChat (Review 16: back from a chat goes where you were, never past it)', () => {
  it('closes only the profile, so back from the chat lands on the going list', () => {
    expect(screensClosed(st('(tabs)', 'event/[id]', 'event/going', 'user/[id]'))).toBe(1);
  });
  it('closes only the profile when it was opened from Community or Connections', () => {
    expect(screensClosed(st('(tabs)', 'user/[id]'))).toBe(1);
    expect(screensClosed(st('(tabs)', 'connections', 'user/[id]'))).toBe(1);
  });
  it('closes nothing when the profile is not on top', () => {
    expect(screensClosed(st('(tabs)', 'event/[id]', 'event/going'))).toBe(0);
  });
  it('never closes the tabs', () => {
    expect(screensClosed(st('user/[id]'))).toBe(0);
  });
  it('the chat is at most 3 backs from its tab (event, going list, chat)', () => {
    // After closing the profile and pushing the chat: (tabs) › event › going › chat.
    expect(backsToTab(['(tabs)', 'event/[id]', 'event/going', 'user/[id]'])).toBe(3);
    expect(backsToTab(['(tabs)', 'user/[id]'])).toBe(1);
  });
});

import { postedLabel } from '../src/lib/messages';

/** Local times on Wed 18 Nov 2026. */
const at = (day: number, h: number, m = 0) => new Date(2026, 10, day, h, m).toISOString();

describe('postedLabel: forum, feed and chats use the 4.10 wording (Review 14)', () => {
  it('after midnight is "Tonight", never "Today 01:10"', () => {
    expect(postedLabel(at(18, 1, 10), new Date(2026, 10, 18, 12, 30))).toBe('Tonight 01:10');
    expect(postedLabel(at(18, 1, 10), new Date(2026, 10, 18, 20, 30))).toBe('Tonight 01:10');
  });

  it('today before 17:00 is "Today", from 17:00 "Tonight"', () => {
    expect(postedLabel(at(18, 14, 5), new Date(2026, 10, 18, 20, 30))).toBe('Today 14:05');
    expect(postedLabel(at(18, 18, 10), new Date(2026, 10, 18, 20, 30))).toBe('Tonight 18:10');
  });

  it("last night's 23:00, read at 00:30, is still tonight", () => {
    expect(postedLabel(at(17, 23, 0), new Date(2026, 10, 18, 0, 30))).toBe('Tonight 23:00');
  });

  it('this week is the weekday; older the date', () => {
    expect(postedLabel(at(16, 22, 10), new Date(2026, 10, 18, 12, 30))).toBe('Mon 22:10');
    expect(postedLabel(at(5, 22, 10), new Date(2026, 10, 18, 12, 30))).toBe('Thu 5 Nov');
  });
});

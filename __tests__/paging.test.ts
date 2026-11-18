import { firstPage, lastPage, PAGE } from '../src/lib/paging';

const list = (n: number) => Array.from({ length: n }, (_, i) => i);

describe('a page at a time', () => {
  test('short lists come back whole, the same array', () => {
    const l = list(5);
    expect(firstPage(l, PAGE)).toEqual({ items: l, more: 0 });
    expect(firstPage(l, PAGE).items).toBe(l);
    expect(lastPage(l, PAGE).items).toBe(l);
    expect(firstPage([], PAGE)).toEqual({ items: [], more: 0 });
    expect(lastPage([], PAGE)).toEqual({ items: [], earlier: 0 });
  });

  test('exactly a page: nothing more', () => {
    expect(firstPage(list(PAGE), PAGE).more).toBe(0);
    expect(lastPage(list(PAGE), PAGE).earlier).toBe(0);
  });

  test('the first page of a long list, and what the next tap adds', () => {
    const p = firstPage(list(75), PAGE);
    expect(p.items).toEqual(list(PAGE));
    expect(p.more).toBe(PAGE);
    expect(firstPage(list(75), PAGE * 2).more).toBe(15);
    expect(firstPage(list(75), PAGE * 3)).toEqual({ items: list(75), more: 0 });
  });

  test('a chat keeps its newest messages, in order', () => {
    const p = lastPage(list(40), PAGE);
    expect(p.items).toEqual(list(40).slice(10));
    expect(p.earlier).toBe(10);
  });
});

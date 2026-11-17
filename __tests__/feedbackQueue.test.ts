import { FEEDBACK_MAX, makeSuggestion } from '../src/lib/feedbackQueue';

const at = new Date('2026-11-17T20:00:00Z');

describe('picker suggestions', () => {
  test('a missing vehicle becomes an idea for the feedback table', () => {
    const f = makeSuggestion({ missing: ' Astra VXR Arctic ', notes: 'only 50 made', screen: 'vehicle-picker', context: 'car · Vauxhall' }, 'fb1', at);
    expect(f).toEqual({
      id: 'fb1', kind: 'idea', screen: 'vehicle-picker', at: '2026-11-17T20:00:00.000Z',
      message: 'Missing vehicle: Astra VXR Arctic\nNotes: only 50 made\nPicker: car · Vauxhall',
    });
  });
  test('a missing mod', () => {
    expect(makeSuggestion({ missing: 'Wastegate', screen: 'mod-picker' }, 'x', at).message).toBe('Missing mod: Wastegate');
  });
  test('needs something and fits the backend limit', () => {
    expect(() => makeSuggestion({ missing: '  ', screen: 'mod-picker' }, 'x', at)).toThrow(/missing/);
    expect(makeSuggestion({ missing: 'a'.repeat(5000), screen: 'mod-picker' }, 'x', at).message.length).toBe(FEEDBACK_MAX);
  });
});

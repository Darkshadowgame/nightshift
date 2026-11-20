/**
 * The feedback email (supabase/functions/feedback-notify/message.ts) and the
 * SMTP port choice (Supabase Edge Functions can't use 25 or 587).
 */
import { feedbackEmail, isTestReport, screenshotPaths, type FeedbackRow } from '../supabase/functions/feedback-notify/message';

const row: FeedbackRow = {
  id: '0b5e8c1a-2f6d-4c3b-9a7e-1d2c3b4a5f60',
  created_at: '2026-11-17T20:00:00Z',
  user_id: '11111111-2222-3333-4444-555555555555',
  kind: 'bug',
  message: 'The Going button\noverlaps the chat on small phones and it is really quite annoying to be honest with you',
  screen: '/event/[id]',
  app_version: 'v1.0.12',
  update_id: 'upd',
  device: 'ios 26.1',
  photo_path: null,
  photo_paths: ['u/x/1.jpg', 'u/x/2.jpg'],
  context: { runtime: '1.0.0', model: 'iPhone 15', os: 'ios 26.1', route: '/event/[id]', backend: 'signed-in' },
  lat: null,
  lng: null,
};

describe('feedback email', () => {
  test('subject: kind and the start of the message on one line', () => {
    const { subject } = feedbackEmail(row, []);
    expect(subject.startsWith('[Slipstream feedback] Bug: The Going button overlaps the chat')).toBe(true);
    expect(subject).not.toContain('\n');
    expect(subject.length).toBeLessThan(110);
  });
  test('body: the message, the facts, screenshot links and how to mark it', () => {
    const { text } = feedbackEmail(row, ['https://x/1', 'https://x/2']);
    expect(text.startsWith('The Going button\noverlaps')).toBe(true);
    expect(text).toContain('App version: v1.0.12');
    expect(text).toContain('Device: iPhone 15');
    expect(text).toContain('Screen: /event/[id]');
    expect(text).toContain('Signed in: yes (user 11111111)');
    expect(text).toContain('1. https://x/1');
    expect(text).toContain('--mark 0b5e8c1a');
    expect(text).not.toContain('Location:');
  });
  test('location only when the sender included it', () => {
    expect(feedbackEmail({ ...row, lat: 52.48, lng: -1.89 }, []).text).toContain('Location: 52.48000, -1.89000');
  });
  test('screenshot paths, and test reports', () => {
    expect(screenshotPaths({ photo_path: 'u/a.jpg', photo_paths: ['u/a.jpg', 'u/b.jpg'] })).toEqual(['u/a.jpg', 'u/b.jpg']);
    expect(isTestReport({ context: { test: true } })).toBe(true);
    expect(isTestReport({ context: {} })).toBe(false);
  });
});

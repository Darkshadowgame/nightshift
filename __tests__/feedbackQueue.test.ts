import { feedbackPhotoPath, fetchFeedbackStatus, sendPendingFeedback } from '../src/lib/backend/feedback';
import { FEEDBACK_MAX, isUuid, makeReport, makeSuggestion, mergeStatuses, sentEntry, statusLabel } from '../src/lib/feedbackQueue';

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


const ID = '0b5e8c1a-2f6d-4c3b-9a7e-1d2c3b4a5f60';

describe('the Send feedback form', () => {
  test('a report keeps its kind, route, photos and context; location only when given (rounded)', () => {
    const f = makeReport(
      { kind: 'looks_wrong', message: '  Pin is a street off  ', screen: '/spot/[id]', photos: ['a.jpg', 'b.jpg', 'c.jpg', 'd.jpg', 'e.jpg'], context: { backend: 'demo' }, location: { lat: 52.4812345, lng: -1.8912345 } },
      ID,
      at,
    );
    expect(f).toEqual({
      id: ID, kind: 'looks_wrong', message: 'Pin is a street off', screen: '/spot/[id]', at: '2026-11-17T20:00:00.000Z',
      photos: ['a.jpg', 'b.jpg', 'c.jpg', 'd.jpg'], context: { backend: 'demo' }, location: { lat: 52.48123, lng: -1.89123 },
    });
    const plain = makeReport({ kind: 'other', message: 'Hi', screen: '/me' }, ID, at);
    expect(plain.location).toBeUndefined();
    expect(plain.photos).toBeUndefined();
    expect(() => makeReport({ kind: 'bug', message: '   ', screen: '/me' }, ID, at)).toThrow(/Say what happened/);
  });

  test('statuses read as New / Seen / Planned / Fixed in vX', () => {
    expect(statusLabel({}, true)).toBe('Waiting to send');
    expect(statusLabel({}, false)).toBe('New');
    expect(statusLabel({ status: 'seen' }, false)).toBe('Seen');
    expect(statusLabel({ status: 'planned' }, false)).toBe('Planned');
    expect(statusLabel({ status: 'done', fixedIn: 'v1.0.12' }, false)).toBe('Fixed in v1.0.12');
    expect(statusLabel({ status: 'done' }, false)).toBe('Fixed');
    expect(statusLabel({ status: 'wont_do' }, false)).toBe('Not planned');
  });

  test('the list merges the server statuses, newest first', () => {
    const a = sentEntry(makeReport({ kind: 'bug', message: 'Old one', screen: '/me' }, 'a', new Date('2026-11-01T00:00:00Z')));
    const b = sentEntry(makeReport({ kind: 'idea', message: 'x '.repeat(100), screen: '/me' }, 'b', at));
    expect(b.summary.length).toBe(120);
    const out = mergeStatuses([a, b], [{ id: 'a', status: 'done', fixed_in: 'v1.0.9' }]);
    expect(out.map((f) => f.id)).toEqual(['b', 'a']);
    expect(out[1]).toMatchObject({ status: 'done', fixedIn: 'v1.0.9' });
    expect(isUuid(ID)).toBe(true);
    expect(isUuid('fb1')).toBe(false);
  });
});

/** Just enough of supabase-js for feedback.ts. */
function fakeClient(opts: { insertError?: { message: string; code?: string }; uploadError?: { message: string } } = {}) {
  const calls: { inserts: Record<string, unknown>[]; uploads: string[]; rpc: unknown[]; selects: number } = { inserts: [], uploads: [], rpc: [], selects: 0 };
  const client = {
    from: () => ({
      insert: async (row: Record<string, unknown>) => {
        calls.inserts.push(row);
        return { error: opts.insertError ?? null };
      },
      select: () => ({
        order: () => ({
          limit: async () => {
            calls.selects++;
            return { data: [{ id: 'other-phone', created_at: '2026-11-10T00:00:00Z', kind: 'idea', message: 'From my iPad', status: 'planned', fixed_in: null }], error: null };
          },
        }),
      }),
    }),
    storage: {
      from: () => ({
        upload: async (path: string) => {
          calls.uploads.push(path);
          return { error: opts.uploadError ?? null };
        },
      }),
    },
    rpc: async (_name: string, args: unknown) => {
      calls.rpc.push(args);
      return { data: [{ id: ID, status: 'seen', fixed_in: null }], error: null };
    },
  };
  return { client: client as never, calls };
}

const INFO = { app_version: 'v1.0.42', update_id: 'u1', device: 'ios 26.1' };

describe('sending feedback', () => {
  test('signed in: screenshots go to {uid}/{id}/n.jpg first, then the row with its own id, context and location', async () => {
    const { client, calls } = fakeClient();
    const dropped: string[][] = [];
    const item = makeReport({ kind: 'bug', message: 'Overlap', screen: '/me', photos: ['p1.jpg', 'p2.jpg'], context: { backend: 'signed-in' }, location: { lat: 52.1, lng: -1.2 } }, ID, at);
    const res = await sendPendingFeedback(client, [item], INFO, { uid: 'user-1', readPhoto: async () => new ArrayBuffer(4), dropPhotos: (r) => dropped.push(r) });
    expect(res).toEqual({ done: [ID], offline: false });
    expect(calls.uploads).toEqual([feedbackPhotoPath('user-1', ID, 0), feedbackPhotoPath('user-1', ID, 1)]);
    expect(calls.uploads[0]).toBe(`user-1/${ID}/1.jpg`);
    expect(calls.inserts[0]).toEqual({
      id: ID, kind: 'bug', message: 'Overlap', screen: '/me', ...INFO,
      photo_paths: [`user-1/${ID}/1.jpg`, `user-1/${ID}/2.jpg`], context: { backend: 'signed-in' }, lat: 52.1, lng: -1.2,
    });
    expect(dropped).toEqual([['p1.jpg', 'p2.jpg']]);
  });

  test('signed out: no screenshots, and no location unless it was ticked', async () => {
    const { client, calls } = fakeClient();
    const item = makeReport({ kind: 'other', message: 'Hello', screen: '/signin', photos: ['p1.jpg'] }, ID, at);
    await sendPendingFeedback(client, [item], INFO);
    expect(calls.uploads).toEqual([]);
    expect(calls.inserts[0]).not.toHaveProperty('photo_paths');
    expect(calls.inserts[0]).not.toHaveProperty('lat');
  });

  test('a retry of a report that already arrived counts as sent', async () => {
    const { client } = fakeClient({ insertError: { message: 'duplicate key value violates unique constraint "feedback_pkey"', code: '23505' } });
    expect((await sendPendingFeedback(client, [makeReport({ kind: 'bug', message: 'x', screen: '/me' }, ID, at)], INFO)).done).toEqual([ID]);
  });

  test('the flood guard keeps it for later', async () => {
    const { client } = fakeClient({ insertError: { message: "You've sent a lot of feedback in the last hour. Thanks! Try again later." } });
    expect((await sendPendingFeedback(client, [makeReport({ kind: 'bug', message: 'x', screen: '/me' }, ID, at)], INFO)).done).toEqual([]);
  });

  test('old queued suggestions (no UUID) go without an id, as before', async () => {
    const { client, calls } = fakeClient();
    await sendPendingFeedback(client, [{ id: 'fb1', kind: 'idea', message: 'Missing mod: Wastegate', screen: 'mod-picker', at: 't' }], INFO);
    expect(calls.inserts[0]).toEqual({ kind: 'idea', message: 'Missing mod: Wastegate', screen: 'mod-picker', ...INFO });
  });

  test('status: by id through feedback_status (signed out), plus your own rows signed in', async () => {
    const out = fakeClient();
    expect(await fetchFeedbackStatus(out.client, [ID, 'fb1'], false)).toEqual([{ id: ID, status: 'seen', fixed_in: null }]);
    expect(out.calls.rpc).toEqual([{ p_ids: [ID] }]);
    expect(out.calls.selects).toBe(0);
    const inn = fakeClient();
    expect((await fetchFeedbackStatus(inn.client, [ID], true)).map((r) => r.id)).toEqual([ID, 'other-phone']);
  });
});

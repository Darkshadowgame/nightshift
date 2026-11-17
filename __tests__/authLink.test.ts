import { authMessage, emailProblem, parseAuthLink } from '../src/lib/authLink';
import { enqueue, flushOutbox, isNetworkError, OFFLINE, type OutboxItem } from '../src/lib/backend/outbox';
import { newId, uuid } from '../src/lib/ids';

describe('sign-in links', () => {
  it('the app link with a session in the fragment (magic link, implicit flow)', () => {
    expect(parseAuthLink('nightshift://#access_token=aaa.bbb.ccc&expires_in=3600&refresh_token=rrr&token_type=bearer&type=magiclink')).toEqual({
      kind: 'session', accessToken: 'aaa.bbb.ccc', refreshToken: 'rrr',
    });
  });
  it('a PKCE code', () => {
    expect(parseAuthLink('nightshift://?code=abc-123')).toEqual({ kind: 'code', code: 'abc-123' });
  });
  it('the verify link from the email, pasted in: its token is the token hash', () => {
    expect(parseAuthLink('https://proj.supabase.co/auth/v1/verify?token=pkce_abc123&type=magiclink&redirect_to=nightshift://')).toEqual({
      kind: 'tokenHash', tokenHash: 'pkce_abc123', type: 'magiclink',
    });
    expect(parseAuthLink('https://proj.supabase.co/auth/v1/verify?token=h&type=signup&redirect_to=nightshift%3A%2F%2F')).toMatchObject({ type: 'signup' });
    expect(parseAuthLink('nightshift://auth?token_hash=th&type=email')).toEqual({ kind: 'tokenHash', tokenHash: 'th', type: 'email' });
  });
  it('an expired link says so', () => {
    expect(parseAuthLink('nightshift://#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired')).toEqual({
      kind: 'error', message: 'That sign-in link has expired. Ask for a new one.',
    });
  });
  it('anything else is not a sign-in link', () => {
    expect(parseAuthLink('nightshift://event/abc')).toBeNull();
    expect(parseAuthLink('')).toBeNull();
    expect(parseAuthLink('https://example.com/?token=x')).toBeNull();
  });
});

describe('sign-in wording', () => {
  it('checks the email', () => {
    expect(emailProblem('')).toBe('Add your email address.');
    expect(emailProblem('dan@')).toBe("That doesn't look like an email address.");
    expect(emailProblem(' dan@example.com ')).toBeNull();
  });
  it("puts Supabase's errors in the app's words", () => {
    expect(authMessage(new Error('Token has expired or is invalid'))).toBe('That code is wrong or has expired. Ask for a new one.');
    expect(authMessage(new Error('For security purposes, you can only request this after 42 seconds.'))).toMatch(/Wait a minute/);
    expect(authMessage(new TypeError('Network request failed'))).toBe(OFFLINE);
    expect(authMessage({ message: 'Error sending magic link email' })).toMatch(/only the project team/);
  });
});

describe('offline outbox', () => {
  const chat = (id: string): OutboxItem => ({ id, kind: 'chat', eventId: 'e', text: id, at: 't' });
  const build = (id: string, model: string): OutboxItem => ({
    id: `${id}-${model}`, kind: 'saveBuild', build: { id, ownerId: 'me', kind: 'car', make: 'VW', model, stockBhp: 1, weightKg: 1, mods: [], photos: [] },
  });

  it('a newer save of a build replaces the older one; deleting drops queued saves; one mark-read is enough', () => {
    let q: OutboxItem[] = [];
    q = enqueue(q, build('b1', 'Golf'));
    q = enqueue(q, chat('c1'));
    q = enqueue(q, build('b1', 'Golf R'));
    expect(q.map((x) => x.id)).toEqual(['c1', 'b1-Golf R']);
    q = enqueue(q, { id: 'd', kind: 'deleteBuild', buildId: 'b1' });
    expect(q.map((x) => x.kind)).toEqual(['chat', 'deleteBuild']);
    q = enqueue(enqueue(q, { id: 'm1', kind: 'markRead' }), { id: 'm2', kind: 'markRead' });
    expect(q.filter((x) => x.kind === 'markRead').map((x) => x.id)).toEqual(['m2']);
  });

  it('sends in order, stops while still offline, drops what the server refuses', async () => {
    const sent: string[] = [];
    const r = await flushOutbox([chat('a'), chat('bad'), chat('b'), chat('down'), chat('c')], async (item) => {
      if (item.id === 'bad') throw new Error('Chat is for hosts and people going.');
      if (item.id === 'down') throw new TypeError('Network request failed');
      sent.push(item.id);
    });
    expect(sent).toEqual(['a', 'b']);
    expect(r.refused.map((x) => x.reason)).toEqual(['Chat is for hosts and people going.']);
    expect(r.left.map((x) => x.id)).toEqual(['down', 'c']);
  });

  it('tells network errors from server answers', () => {
    expect(isNetworkError(new TypeError('Network request failed'))).toBe(true);
    expect(isNetworkError({ message: 'TypeError: Failed to fetch' })).toBe(true);
    expect(isNetworkError(new Error('Only hosts can move the meet on.'))).toBe(false);
  });
});

describe('ids', () => {
  it('are v4 UUIDs, so things made on the phone keep their id on the server', () => {
    expect(newId('b')).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    let n = 0;
    const id = uuid(() => ((n++ % 16) + 0.5) / 16);
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });
});

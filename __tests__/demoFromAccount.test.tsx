import AsyncStorage from '@react-native-async-storage/async-storage';
import { act } from 'react';
import { createRoot } from 'test-renderer';

jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

/**
 * A fake Supabase client. Only the session calls work: any data call (tables, RPCs, realtime,
 * storage) is recorded, so the test can say none happened while in the demo.
 */
const mockDataCalls: string[] = [];
const mockSession = { access_token: 'a', refresh_token: 'r', user: { id: 'u1', email: 'owner@example.com' } };
const mockSignOut = jest.fn(async () => ({ error: null }));
const mockClient = {
  auth: {
    getSession: jest.fn(async () => ({ data: { session: mockSession }, error: null })),
    onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe() {} } } })),
    signOut: mockSignOut,
  },
  from: (t: string) => {
    mockDataCalls.push(`from:${t}`);
    throw new Error('no data calls in this test');
  },
  rpc: (f: string) => {
    mockDataCalls.push(`rpc:${f}`);
    throw new Error('no data calls in this test');
  },
  channel: (c: string) => {
    mockDataCalls.push(`channel:${c}`);
    throw new Error('no data calls in this test');
  },
  get storage() {
    mockDataCalls.push('storage');
    throw new Error('no data calls in this test');
  },
};
jest.mock('../src/lib/backend/client', () => ({ supabase: () => mockClient }));

/** The signed-in repository: a stand-in that resolves everything, so its use can be counted. */
const mockRemoteRepos = jest.fn();
jest.mock('../src/lib/backend/remote', () => ({
  ...jest.requireActual('../src/lib/backend/remote'),
  createSupabaseRepository: (ctx: unknown) => {
    mockRemoteRepos(ctx);
    const stub: Record<string, unknown> = { kind: 'supabase', watchNotices: () => () => {}, watchEvent: () => () => {} };
    return new Proxy(stub, {
      get: (target, p) => (p in target ? target[p as string] : p === 'then' ? undefined : async () => undefined),
    });
  },
}));

// Not under test, and they reach for native modules.
jest.mock('../src/lib/notify', () => ({
  notificationsSupported: false,
  notifyNow: jest.fn(),
  syncReminders: jest.fn(async () => {}),
  permissionGranted: jest.fn(async () => false),
  askPermission: jest.fn(async () => false),
  onNotificationTap: () => () => {},
}));
jest.mock('expo-linking', () => ({ getInitialURL: async () => null, addEventListener: () => ({ remove() {} }) }));

import { AuthProvider, useAuth } from '../src/lib/auth';
import { StoreProvider, useStore } from '../src/lib/store';
import type { Build } from '../src/lib/types';

let auth: ReturnType<typeof useAuth>;
let store: ReturnType<typeof useStore>;
function Probe() {
  auth = useAuth();
  store = useStore();
  return null;
}

async function until(ok: () => boolean, what: string) {
  for (let i = 0; i < 200; i++) {
    if (ok()) return;
    await act(async () => {
      await new Promise((r) => setTimeout(r, 5));
    });
  }
  throw new Error(`Timed out waiting for ${what}`);
}

const ACCOUNT_CACHE = 'nightshift.sb.u1.state';

describe('Settings › Try the demo while signed in', () => {
  it('keeps the session, never uses the server in the demo, and goes back without signing in', async () => {
    await AsyncStorage.multiSet([
      ['nightshift.mode', 'account'],
      ['nightshift.auth', '{"session":"kept"}'],
      [ACCOUNT_CACHE, JSON.stringify({ builds: [] })],
    ]);
    const root = createRoot();
    act(() =>
      root.render(
        <AuthProvider>
          <StoreProvider>
            <Probe />
          </StoreProvider>
        </AuthProvider>,
      ),
    );
    await until(() => auth.status === 'signedIn' && store.ready, 'signed in');
    expect(store.backend).toBe('supabase');
    expect(mockRemoteRepos).toHaveBeenCalledTimes(1);
    expect(auth.accountWaiting).toBe(false);

    // Try the busy demo.
    mockRemoteRepos.mockClear();
    mockDataCalls.length = 0;
    await act(async () => {
      await auth.tryDemo({ busy: true });
    });
    await until(() => auth.status === 'demo' && store.ready && store.backend === 'local', 'the demo');
    expect(auth.accountWaiting).toBe(true);
    expect(store.settings.busyNight).toBe(true);
    expect(await AsyncStorage.getItem('nightshift.demo.busyOnStart')).toBeNull();

    // A write in the demo stays on the phone.
    const build = { id: 'b-demo', ownerId: store.me, kind: 'car', make: 'Test', model: 'Demo', mods: [], photos: [], colour: '#fff' } as unknown as Build;
    await act(async () => {
      await store.saveBuild(build);
    });
    expect(store.builds.some((b) => b.id === 'b-demo')).toBe(true);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 1200));
    });

    // No signed-in repository, no data calls, and the account is untouched.
    expect(mockRemoteRepos).not.toHaveBeenCalled();
    expect(mockDataCalls).toEqual([]);
    expect(mockSignOut).not.toHaveBeenCalled();
    expect(await AsyncStorage.getItem('nightshift.auth')).toBe('{"session":"kept"}');
    expect(await AsyncStorage.getItem(ACCOUNT_CACHE)).not.toContain('b-demo');

    // Back to my account: straight back in, no sign-in.
    await act(async () => {
      await auth.backToAccount();
    });
    await until(() => auth.status === 'signedIn' && store.backend === 'supabase', 'back to the account');
    expect(auth.accountWaiting).toBe(false);
    expect(auth.userId).toBe('u1');
    expect(mockRemoteRepos).toHaveBeenCalledTimes(1);
    expect(store.builds.some((b) => b.id === 'b-demo')).toBe(false);
    act(() => root.unmount());
  });

  it('remembers the account behind the demo after a restart', async () => {
    await AsyncStorage.clear();
    await AsyncStorage.multiSet([
      ['nightshift.mode', 'demo'],
      ['nightshift.mode.accountWaiting', '1'],
      ['nightshift.auth', '{"session":"kept"}'],
    ]);
    mockRemoteRepos.mockClear();
    const root = createRoot();
    act(() =>
      root.render(
        <AuthProvider>
          <StoreProvider>
            <Probe />
          </StoreProvider>
        </AuthProvider>,
      ),
    );
    await until(() => auth.status === 'demo' && store.ready, 'the demo');
    expect(auth.accountWaiting).toBe(true);
    expect(mockRemoteRepos).not.toHaveBeenCalled();
    act(() => root.unmount());
  });

  it('the demo from the sign-in screen still leaves to sign-in', async () => {
    await AsyncStorage.clear();
    const root = createRoot();
    act(() =>
      root.render(
        <AuthProvider>
          <StoreProvider>
            <Probe />
          </StoreProvider>
        </AuthProvider>,
      ),
    );
    await until(() => auth.status === 'signedOut', 'signed out');
    await act(async () => {
      await auth.startDemo();
    });
    await until(() => auth.status === 'demo' && store.ready, 'the demo');
    expect(auth.accountWaiting).toBe(false);
    await act(async () => {
      await auth.leaveDemo();
    });
    expect(auth.status).toBe('signedOut');
    act(() => root.unmount());
  });
});

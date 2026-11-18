import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import { ME } from '../data/seed';
import { supabase } from './backend/client';
import { createRemoteCommunity } from './backend/community';
import { createLocalCommunity, emptyDemoCommunity, seedDemoCommunity, withSamplePhotos, type CommunityService, type DemoCommunity } from './communityService';
import { idsIn, type ConnectionState } from './connections';
import { NO_FORUM_REP, type ForumRep } from './forum';
import { totalUnread, type Conversation } from './messages';
import { notifyNow } from './notify';
import { nearestRegion } from './profile';
import { useStore } from './store';

/**
 * The Community tab's shared state: connections, blocks, conversations and
 * unread counts, plus the service the screens call (communityService.ts).
 * Kept apart from the main store, like road reports. Signed in it listens on
 * Realtime (new messages, read receipts, connection requests) and shows a
 * phone notification for a new message while the app is open and that chat
 * isn't on screen (no push without the paid Apple account).
 */

const DEMO_KEY = 'nightshift.community.demo';
const EMPTY_SET: ReadonlySet<string> = new Set();

interface Community {
  service: CommunityService | null;
  me: string;
  /** Bumped when anything changed: screens re-read. */
  version: number;
  connections: Record<string, ConnectionState>;
  blocked: ReadonlySet<string>;
  conversations: Conversation[];
  /** Unread messages plus connection requests waiting for you (the tab badge). */
  badge: number;
  unread: number;
  incoming: string[];
  showInNearby: boolean;
  forumRep: Record<string, ForumRep>;
  /** Re-read connections, blocks and conversations. */
  refresh(): Promise<void>;
  /** The chat on screen now (no notifications for it), or null. */
  setActiveConversation(id: string | null): void;
  /** Run a change and refresh afterwards. Rejects with the server's sentence. */
  run<T>(fn: (s: CommunityService) => Promise<T>): Promise<T>;
  stateOf(userId: string): ConnectionState;
}

const Ctx = createContext<Community | null>(null);

export function CommunityProvider({ children }: { children: ReactNode }) {
  const store = useStore();
  const { backend, me, ready, users, settings } = store;
  const usersRef = useRef(users);
  usersRef.current = users;
  const meUser = users.find((u) => u.id === me);
  const travelRef = useRef(25);
  travelRef.current = meUser?.travelMiles ?? 25;
  const remindersRef = useRef(settings.reminders);
  remindersRef.current = settings.reminders;

  const [version, setVersion] = useState(0);
  const bump = useCallback(() => setVersion((v) => v + 1), []);

  // The demo's community, kept on the phone and laid out round the home area.
  const demo = useRef<DemoCommunity>(emptyDemoCommunity());
  const [demoLoaded, setDemoLoaded] = useState(false);
  useEffect(() => {
    if (backend !== 'local' || !ready) return;
    let live = true;
    AsyncStorage.getItem(DEMO_KEY)
      .then((raw) => {
        if (live && raw) demo.current = withSamplePhotos({ ...emptyDemoCommunity(), ...(JSON.parse(raw) as DemoCommunity) });
      })
      .catch(() => {})
      .finally(() => {
        if (live) setDemoLoaded(true);
      });
    return () => {
      live = false;
    };
  }, [backend, ready]);

  const homeKey = meUser?.home ? `${meUser.home.lat.toFixed(2)}:${meUser.home.lng.toFixed(2)}` : '';
  useEffect(() => {
    if (backend !== 'local' || !demoLoaded || !meUser?.home) return;
    const a = demo.current.around;
    if (a && `${a.lat.toFixed(2)}:${a.lng.toFixed(2)}` === homeKey) return;
    demo.current = seedDemoCommunity(demo.current, meUser.home, meUser.region || nearestRegion(meUser.home), new Date());
    AsyncStorage.setItem(DEMO_KEY, JSON.stringify(demo.current)).catch(() => {});
    bump();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backend, demoLoaded, homeKey]);

  const service = useMemo<CommunityService | null>(() => {
    if (!ready) return null;
    if (backend === 'supabase') return createRemoteCommunity(supabase(), me);
    if (!demoLoaded) return null;
    return createLocalCommunity({
      get: () => demo.current,
      set: (s) => {
        demo.current = s;
        AsyncStorage.setItem(DEMO_KEY, JSON.stringify(s)).catch(() => {});
      },
      users: () => usersRef.current,
      travelMiles: () => travelRef.current,
    });
  }, [ready, backend, demoLoaded, me]);

  const [connections, setConnections] = useState<Record<string, ConnectionState>>({});
  const [blocked, setBlocked] = useState<ReadonlySet<string>>(EMPTY_SET);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [showInNearby, setShow] = useState(true);
  const active = useRef<string | null>(null);

  const refresh = useCallback(async () => {
    if (!service) return;
    const [c, b, cv, sh] = await Promise.all([
      service.connections().catch(() => null),
      service.blocked().catch(() => null),
      service.conversations().catch(() => null),
      service.showInNearby().catch(() => null),
    ]);
    if (c) setConnections(c);
    if (b) setBlocked(new Set(b));
    if (cv) setConversations(cv);
    if (sh !== null) setShow(sh);
  }, [service]);

  useEffect(() => {
    void refresh();
  }, [refresh, version]);

  // Come back to the front: read again.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (st) => {
      if (st === 'active') bump();
    });
    return () => sub.remove();
  }, [bump]);

  // Live changes.
  useEffect(() => {
    if (!service) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const later = () => {
      if (timer) return;
      timer = setTimeout(() => {
        timer = null;
        bump();
      }, 400);
    };
    const stop = service.watch((c) => {
      later();
      if (c.kind !== 'message' || !c.senderId || c.senderId === me || active.current === c.conversationId) return;
      if (!remindersRef.current || AppState.currentState !== 'active') return;
      const who = usersRef.current.find((u) => u.id === c.senderId);
      notifyNow({
        key: `cm.${c.conversationId}`, scheduleId: `cm.${c.conversationId}.${Date.now()}`, eventId: '', kind: 'moved', at: new Date(),
        title: who ? `@${who.handle}` : 'New message', body: c.body ? c.body.slice(0, 120) : 'Sent a photo', url: `/chat/${c.conversationId}`,
      }).catch(() => {});
    });
    return () => {
      if (timer) clearTimeout(timer);
      stop();
    };
  }, [service, bump, me]);

  // Forum rep for everyone the app knows (for the rep ledger).
  const [forumRep, setForumRep] = useState<Record<string, ForumRep>>({});
  const userIds = users.map((u) => u.id).join(',');
  useEffect(() => {
    if (!service) return;
    let live = true;
    const t = setTimeout(() => {
      service
        .forumRep(userIds ? userIds.split(',') : [])
        .then((r) => live && setForumRep(r))
        .catch(() => {});
    }, 500);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [service, userIds, version]);

  const value = useMemo<Community>(() => {
    const unread = totalUnread(conversations);
    const incoming = idsIn(connections, 'incoming').filter((id) => !blocked.has(id));
    return {
      service,
      me: backend === 'local' ? ME : me,
      version,
      connections,
      blocked,
      conversations,
      unread,
      incoming,
      badge: unread + incoming.length,
      showInNearby,
      forumRep,
      refresh,
      setActiveConversation: (id) => {
        active.current = id;
      },
      run: async (fn) => {
        if (!service) throw new Error('Community is still loading. Try again in a moment.');
        const out = await fn(service);
        bump();
        return out;
      },
      stateOf: (id) => connections[id] ?? 'none',
    };
  }, [service, backend, me, version, connections, blocked, conversations, showInNearby, forumRep, refresh, bump]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

const NONE: Community = {
  service: null,
  me: ME,
  version: 0,
  connections: {},
  blocked: EMPTY_SET,
  conversations: [],
  badge: 0,
  unread: 0,
  incoming: [],
  showInNearby: true,
  forumRep: {},
  refresh: async () => {},
  setActiveConversation: () => {},
  run: async () => {
    throw new Error('Community is not available here.');
  },
  stateOf: () => 'none',
};

export function useCommunity(): Community {
  return useContext(Ctx) ?? NONE;
}

export function useForumRep(userId: string): ForumRep {
  return useCommunity().forumRep[userId] ?? NO_FORUM_REP;
}

/**
 * Load something from the service, again whenever the community changes.
 * Returns the value (null until loaded), an error sentence and a reload.
 */
export function useCommunityQuery<T>(fn: (s: CommunityService) => Promise<T>, deps: unknown[]): { data: T | null; error: string | null; loading: boolean; reload: () => void } {
  const { service, version } = useCommunity();
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!service) return;
    let live = true;
    setLoading(true);
    fn(service)
      .then((d) => {
        if (!live) return;
        setData(d);
        setError(null);
      })
      .catch((e) => live && setError(e instanceof Error ? e.message : "Couldn't load this."))
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [service, version, tick, ...deps]);
  return { data, error, loading, reload: () => setTick((n) => n + 1) };
}

/**
 * The map's Posts layer: posts with a place in view (last 30 days), re-read when
 * the view moves to a new ~2 km square or anything changes.
 */
/** The one empty list a turned-off Posts layer returns (the same array every render). */
const NO_PINS: import('./communityService').PostPin[] = [];

export function usePostPins(centre: { lat: number; lng: number }, span: number, enabled: boolean) {
  const { service, version } = useCommunity();
  const [pins, setPins] = useState<import('./communityService').PostPin[]>(NO_PINS);
  const key = `${Math.round(centre.lat / 0.02)}:${Math.round(centre.lng / 0.02)}:${Math.round(Math.log2(Math.max(span, 0.001)))}`;
  const ref = useRef({ centre, span });
  ref.current = { centre, span };
  useEffect(() => {
    if (!enabled || !service) {
      // Keep the same empty list: a new [] would re-render the map and redo its pins.
      setPins((p) => (p.length ? NO_PINS : p));
      return;
    }
    let live = true;
    const { centre: c, span: sp } = ref.current;
    const half = Math.min(sp, 3) * 0.75;
    const lngHalf = half / Math.max(0.2, Math.cos((c.lat * Math.PI) / 180));
    service
      .postsInBox({ south: c.lat - half, north: c.lat + half, west: c.lng - lngHalf, east: c.lng + lngHalf })
      .then((p) => live && setPins(p))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [enabled, service, version, key]);
  return enabled ? pins : NO_PINS;
}

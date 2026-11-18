import { act } from 'react';
import { createRoot } from 'test-renderer';
import { DEMO_HOME, ME, seed } from '../src/data/seed';
import { communitySample } from '../src/data/communitySeed';
import { isPublicType } from '../src/lib/events';
import type { Post } from '../src/lib/posts';

/**
 * REVIEW-12 problem 1 (privacy, flagged two reviews running): a post made at a meet point never
 * shows the place name on its card, to anyone, the author included. It says "At {event name}",
 * a link to the event. This renders the real PostCard and reads every word on it.
 */
const NOW = new Date('2026-11-20T21:10:00');
const S = seed(NOW);
const mockStore = { me: ME, events: S.events, crews: S.crews, users: S.users, builds: S.builds, backend: 'local' };

jest.mock('../src/lib/store', () => ({ useStore: () => mockStore }));
jest.mock('../src/components/NoticeBell', () => ({ NoticeBell: () => null }));
jest.mock('react-native-reanimated', () => {
  const RN = jest.requireActual('react-native');
  const id = (v: unknown) => v;
  const anim = { View: RN.View, Text: RN.Text, ScrollView: RN.ScrollView, createAnimatedComponent: id };
  const entering = { duration: () => entering, delay: () => entering, springify: () => entering };
  return {
    __esModule: true,
    default: anim,
    ...anim,
    useReducedMotion: () => true,
    useSharedValue: (value: unknown) => ({ value }),
    useAnimatedStyle: () => ({}),
    withTiming: id,
    withSpring: id,
    withRepeat: id,
    withDelay: (_d: number, v: unknown) => v,
    withSequence: (...v: unknown[]) => v[v.length - 1],
    cancelAnimation: () => {},
    Easing: new Proxy({}, { get: () => () => id }),
    FadeIn: entering,
    FadeInDown: entering,
    FadeInUp: entering,
    FadeOut: entering,
    SlideInDown: entering,
  };
});
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) }));

import { PostCard } from '../src/components/Community';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

type Node = { props?: Record<string, unknown>; children?: unknown[] };
function words(node: unknown): string[] {
  if (typeof node === 'string') return [node];
  const n = node as Node;
  if (!n || typeof n !== 'object') return [];
  const label = typeof n.props?.accessibilityLabel === 'string' ? [n.props.accessibilityLabel as string] : [];
  return [...label, ...(n.children ?? []).flatMap(words)];
}

function card(post: Post, full = false): string {
  const root = createRoot({ textComponentTypes: ['Text'], publicTextComponentTypes: ['Text'] } as never);
  act(() => root.render(<PostCard post={post} author={S.users.find((u) => u.id === post.authorId)} build={S.builds.find((b) => b.id === post.buildId)} now={NOW} onLike={() => {}} onOpen={full ? undefined : () => {}} full={full} />));
  return words(root.container).join(' | ');
}

describe('a post card for a post made at a meet never names the place', () => {
  // Every meet with a meet point, and every way a post can be tied to it.
  const meets = S.events.filter((e) => e.stops.some((s) => s.at));
  const placeNames = [...new Set(meets.flatMap((e) => e.stops.map((s) => s.name)))];
  const base: Post = { id: 'p-test', authorId: ME, body: '', photos: [], visibility: 'public', createdAt: NOW.toISOString(), likeCount: 0, commentCount: 0, likedByMe: false };

  it.each(meets.map((e) => [e.id, e] as const))('%s: the author, a goer and a stranger all see "At {event}", never the meet point', (_id, e) => {
    const stop = e.stops.find((s) => s.at)!;
    const posts: Post[] = [
      { ...base, eventId: e.id, at: stop.at, body: `At ${e.title}` },
      { ...base, eventId: e.id, at: stop.at, placeName: stop.name, body: 'Great night' },
      // Made before the guard: no event id, just sitting on a hidden meet point. (A show's venue is public.)
      ...(isPublicType(e.type) ? [] : [{ ...base, at: stop.at, placeName: stop.name, body: 'Made before the guard' }]),
    ];
    for (const viewer of [ME, e.going[0] ?? ME, 'nobody']) {
      mockStore.me = viewer;
      for (const post of posts) {
        for (const full of [false, true]) {
          const text = card(post, full);
          for (const name of placeNames) expect(text).not.toContain(name);
          // A legacy post on a meet point shared by two meets links to one of them.
          expect(text).toContain(post.eventId ? `At ${e.title}. Opens the meet` : '. Opens the meet');
        }
      }
    }
    mockStore.me = ME;
  });

  it('says "At {event}" once: a caption that only repeats it is not shown twice', () => {
    const e = meets.find((x) => x.id === 'ev-meet-now')!;
    const text = card({ ...base, eventId: e.id, at: e.stops[0].at, body: `At ${e.title}` });
    expect(text.split(`At ${e.title}`).length - 1).toBe(2); // the line and its link label, not the caption too
  });

  it('no seeded demo post names a meet point', () => {
    for (const post of communitySample(NOW, DEMO_HOME, 'Midlands').posts) {
      const text = card(post);
      for (const name of placeNames) expect(text).not.toContain(name);
    }
  });
});

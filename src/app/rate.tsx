import { router } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, View } from 'react-native';
import { BuildThumb } from '../components/Community';
import { LevelTag, useRepFor } from '../components/Rep';
import { Button, ClassBadge, EmptyState, InlineError, Row, SampleTag, Txt } from '../components/ui';
import { SAMPLE_PEOPLE } from '../data/seed';
import { buildsToRate } from '../lib/carsNear';
import { classOf, effectivePower } from '../lib/classes';
import { useCommunity, useCommunityQuery } from '../lib/communityStore';
import { plural } from '../lib/format';
import { useStore } from '../lib/store';
import { C, RADIUS } from '../theme';

const SWIPE = 110;

/**
 * Rate builds: one build at a time from people near you. Like or pass (buttons,
 * or swipe right or left). Likes add to the build's count; passes are only
 * remembered so it doesn't come round again.
 */
export default function RateBuilds() {
  const { builds, users, me } = useStore();
  const community = useCommunity();
  const repFor = useRepFor();
  const travel = users.find((u) => u.id === me)?.travelMiles ?? 25;
  const near = useCommunityQuery((s) => s.peopleNear(Math.max(travel, 50)), [travel]);
  const rated = useCommunityQuery((s) => s.rated(), []);
  const [done, setDone] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const queue = useMemo(
    () => buildsToRate(near.data ?? [], builds, me, new Set([...(rated.data ?? []), ...done])),
    [near.data, builds, me, rated.data, done],
  );
  const b = queue[0];
  const owner = b ? users.find((u) => u.id === b.ownerId) : undefined;
  const pan = useRef(new Animated.ValueXY()).current;

  const rate = (like: boolean) => {
    if (!b) return;
    setError(null);
    setDone((d) => [...d, b.id]);
    pan.setValue({ x: 0, y: 0 });
    community.service?.rateBuild(b.id, like).catch((e) => setError(e instanceof Error ? e.message : 'Could not save that.'));
  };
  const rateRef = useRef(rate);
  rateRef.current = rate;

  const responder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 12 && Math.abs(g.dx) > Math.abs(g.dy),
        onPanResponderMove: Animated.event([null, { dx: pan.x }], { useNativeDriver: false }),
        onPanResponderRelease: (_, g) => {
          if (Math.abs(g.dx) > SWIPE) {
            Animated.timing(pan, { toValue: { x: g.dx > 0 ? 500 : -500, y: 0 }, duration: 160, useNativeDriver: false }).start(() => rateRef.current(g.dx > 0));
          } else {
            Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
          }
        },
      }),
    [pan],
  );

  if (!near.data || !rated.data) return <View style={{ flex: 1, backgroundColor: C.asphalt }} />;
  if (!b) {
    return (
      <View style={{ flex: 1, backgroundColor: C.asphalt, padding: 16 }}>
        <EmptyState
          glyph="car"
          title="You've seen them all"
          body={done.length ? `You rated ${plural(done.length, 'build')}. New builds near you show up here.` : 'No builds near you to rate yet.'}
          action={{ label: 'Back to People', onPress: () => router.back() }}
        />
      </View>
    );
  }
  const rotate = pan.x.interpolate({ inputRange: [-300, 0, 300], outputRange: ['-8deg', '0deg', '8deg'] });

  return (
    <View style={{ flex: 1, backgroundColor: C.asphalt, padding: 16, gap: 16 }}>
      <Txt v="caption">Swipe right to like, left to pass. Likes show on the build. {plural(queue.length, 'build')} to go.</Txt>
      <Animated.View
        {...responder.panHandlers}
        accessible
        accessibilityLabel={`${b.make} ${b.model}, class ${classOf(b)}, ${Math.round(effectivePower(b))} bhp, by @${owner?.handle ?? 'someone'}`}
        accessibilityActions={[{ name: 'like', label: 'Like' }, { name: 'pass', label: 'Pass' }]}
        onAccessibilityAction={(e) => rate(e.nativeEvent.actionName === 'like')}
        style={{ transform: [{ translateX: pan.x }, { rotate }], backgroundColor: C.tarmac, borderRadius: RADIUS.sheet, borderWidth: 1, borderColor: C.kerb, overflow: 'hidden' }}
      >
        <BuildThumb build={b} height={300} />
        <View style={{ padding: 14, gap: 6 }}>
          <Row gap={10} style={{ flexWrap: 'nowrap' }}>
            <ClassBadge letter={classOf(b)} size="md" />
            <View style={{ flex: 1 }}>
              <Txt v="h2" style={{ textTransform: 'none' }} numberOfLines={1}>{b.make} {b.model}</Txt>
              <Txt v="mono">{Math.round(effectivePower(b))} BHP · {plural(b.mods.length, 'MOD', 'MODS')}</Txt>
            </View>
          </Row>
          <Row gap={6}>
            <Txt v="muted">@{owner?.handle ?? 'someone'}</Txt>
            <LevelTag level={repFor(b.ownerId).level.level} />
            {SAMPLE_PEOPLE.includes(b.ownerId) ? <SampleTag /> : null}
          </Row>
        </View>
      </Animated.View>
      <Row style={{ flexWrap: 'nowrap' }}>
        <Button label="Pass" kind="secondary" onPress={() => rate(false)} style={{ flex: 1 }} />
        <Button label="Like" onPress={() => rate(true)} style={{ flex: 1 }} />
      </Row>
      <Button label="Open build" kind="secondary" size="sm" onPress={() => router.push({ pathname: '/build/[id]', params: { id: b.id } })} />
      <InlineError message={error} />
      <Txt v="caption" style={{ textAlign: 'center', color: C.fog }}>
        Only likes are counted on the build. Nobody sees who passed.
      </Txt>
    </View>
  );
}

import { router } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, View } from 'react-native';
import { BuildHero } from '../components/BuildHero';
import { at, buildMeta, personMark } from '../components/Community';
import { Avatar, Button, DsText, EmptyState, ErrorState, LoadingState } from '../components/ds';
import { buildsToRate } from '../lib/carsNear';
import { classOf } from '../lib/classes';
import { useCommunity, useCommunityQuery } from '../lib/communityStore';
import { plural } from '../lib/format';
import { useStore } from '../lib/store';
import { COLOR, RADII, SPACING } from '../theme';

const SWIPE = 110;

/**
 * Rate builds: one build at a time from people near you. Like or pass (buttons,
 * or swipe right or left). Likes add to the build's count; passes are only
 * remembered so it doesn't come round again.
 */
export default function RateBuilds() {
  const { builds, users, me } = useStore();
  const community = useCommunity();
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
    community.service?.rateBuild(b.id, like).catch((e) => setError(e instanceof Error ? e.message : "Couldn't save that."));
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

  if (!near.data || !rated.data) {
    return (
      <View style={{ flex: 1, backgroundColor: COLOR.surface.bg, padding: SPACING.screen }}>
        <LoadingState variant="inline" label="Finding builds near you" />
      </View>
    );
  }
  if (!b) {
    return (
      <View style={{ flex: 1, backgroundColor: COLOR.surface.bg, padding: SPACING.screen }}>
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
    <View style={{ flex: 1, backgroundColor: COLOR.surface.bg, padding: SPACING.screen, gap: SPACING.lg }}>
      <DsText v="secondary">Swipe right to like, left to pass. {plural(queue.length, 'build')} to go.</DsText>
      <Animated.View
        {...responder.panHandlers}
        accessible
        accessibilityLabel={`${b.make} ${b.model}, class ${classOf(b)}, ${buildMeta(b)}, by ${at(owner)}`}
        accessibilityActions={[{ name: 'like', label: 'Like' }, { name: 'pass', label: 'Pass' }]}
        onAccessibilityAction={(e) => rate(e.nativeEvent.actionName === 'like')}
        style={{ transform: [{ translateX: pan.x }, { rotate }], backgroundColor: COLOR.surface.card, borderRadius: RADII.card, borderWidth: 1, borderColor: COLOR.surface.border, overflow: 'hidden' }}
      >
        <BuildHero build={b} {...(b.photos[0] ? { aspect: 4 / 3 } : { height: 200 })} />
        <View style={{ padding: SPACING.md, gap: SPACING.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
            <View style={{ flex: 1, gap: SPACING.xxs }}>
              <DsText v="title" numberOfLines={1}>
                {b.make} {b.model}
              </DsText>
              <DsText v="meta">{buildMeta(b)}</DsText>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
            <Avatar {...personMark(owner)} size="sm" />
            <DsText v="secondary" style={{ flex: 1 }} numberOfLines={1}>
              {at(owner)}
            </DsText>
          </View>
        </View>
      </Animated.View>
      <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
        <Button label="Pass" tier="secondary" block onPress={() => rate(false)} style={{ flex: 1 }} />
        <Button label="Like" block haptic="select" onPress={() => rate(true)} style={{ flex: 1 }} />
      </View>
      <Button label="Open build" tier="tertiary" size="sm" style={{ alignSelf: 'center' }} onPress={() => router.push({ pathname: '/build/[id]', params: { id: b.id } })} />
      {error ? <ErrorState title={error} /> : null}
      <DsText v="caption" style={{ textAlign: 'center' }}>
        Only likes are counted on the build. Nobody sees who passed.
      </DsText>
    </View>
  );
}

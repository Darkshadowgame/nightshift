import { router, useNavigation } from 'expo-router';
import { useEffect, useLayoutEffect, useRef, useState, type ComponentRef } from 'react';
import { ScrollView, View } from 'react-native';
import { AddModSheet } from '../../components/AddModSheet';
import { BuildCard, buildName, ModGroups, powerLine, useIsDemo } from '../../components/BuildBits';
import { Button, DsText, EmptyState, ErrorState, HeaderActions, ListRow, RowDivider, Section, useToast } from '../../components/ds';
import { usePhotoFlow } from '../../components/PhotoFlow';
import { lastBrought } from '../../lib/bringing';
import { classOf } from '../../lib/classes';
import { useNow } from '../../lib/clock';
import { buildPicture } from '../../lib/similarPhoto';
import { useStore } from '../../lib/store';
import { SPACING } from '../../theme';

const openBuild = (id: string) => router.push({ pathname: '/build/[id]', params: { id } });
const addBuild = () => router.push('/build/edit');

/**
 * Garage (Redesign 2, 3.8; T1): your main build as a big photo card (the one you last brought to a
 * meet, else your first) with its class, name and one power line, and one secondary, Add a mod.
 * Other builds are rows. "+" in the header adds a car or bike.
 */
export default function Garage() {
  const nav = useNavigation();
  const { builds, me, events, saveBuild } = useStore();
  const now = useNow();
  const toast = useToast();
  const mine = builds.filter((b) => b.ownerId === me);
  const main = lastBrought(events, me, builds) ?? mine[0];
  const others = mine.filter((b) => b.id !== main?.id);
  const [addMod, setAddMod] = useState(false);
  // A new mod scrolls the Mods list up, clear of the toast that confirms it (Review 21 problem 6: the
  // toast sat on the new "Cold air intake" row).
  const scroller = useRef<ComponentRef<typeof ScrollView>>(null);
  const modsY = useRef(0);
  const modCount = main?.mods.length ?? 0;
  const lastCount = useRef(modCount);
  // At once, before the new row is painted, and without an animation: the closing sheet still covers
  // the page, so the jump isn't seen, and the row never sits under the toast (which rises with it) for a
  // moment. A delayed, animated scroll left it there for the first half second (the scorecard's
  // TOAST-OVER-CHANGE caught it in one run of four).
  useLayoutEffect(() => {
    const grew = modCount > lastCount.current;
    lastCount.current = modCount;
    if (grew) scroller.current?.scrollTo({ y: Math.max(0, modsY.current - SPACING.md), animated: false });
  }, [modCount]);
  const [error, setError] = useState<string | null>(null);
  const demo = useIsDemo();
  const flow = usePhotoFlow({
    aspect: '4:3',
    onError: setError,
    onPhoto: (ref) => {
      if (!main) return;
      saveBuild({ ...main, photos: [ref, ...main.photos] })
        .then(() => toast({ message: 'Photo added' }))
        .catch((e) => setError(e instanceof Error ? e.message : "Couldn't save the photo."));
    },
  });

  useLayoutEffect(() => {
    nav.setOptions({ headerRight: () => <HeaderActions add={{ label: 'Add a car or bike', onPress: addBuild, icon: 'addVehicle' }} bell /> });
  }, [nav]);

  if (!main) {
    return (
      <ScrollView contentContainerStyle={{ padding: SPACING.screen, paddingBottom: SPACING.xxxl, flexGrow: 1, justifyContent: 'center' }} showsVerticalScrollIndicator={false}>
        <EmptyState glyph="car" title="Your garage is empty" body="It's how you say what you're bringing to a meet." action={{ label: 'Add your car or bike', onPress: addBuild }} />
      </ScrollView>
    );
  }

  return (
    <ScrollView ref={scroller} contentContainerStyle={{ padding: SPACING.screen, gap: SPACING.section, paddingBottom: SPACING.xxxl * 2 }} showsVerticalScrollIndicator={false}>
      {flow.view}
      <View style={{ gap: SPACING.sm }}>
        <BuildCard build={main} now={now} onPress={() => openBuild(main.id)} action={{ label: 'Add a mod', onPress: () => setAddMod(true) }} />
        {main.photos.length === 0 ? (
          // A stand-in photo says it's one, so "Add a photo" under a photo makes sense (Review 19 #38).
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', columnGap: SPACING.xs }}>
            {buildPicture(main, demo)?.standIn ? <DsText v="secondary">Sample photo.</DsText> : null}
            <Button
              label={buildPicture(main, demo)?.standIn ? 'Add yours' : `Add a photo of your ${main.kind === 'bike' ? 'bike' : 'car'}`}
              accessibilityLabel={`Add a photo of your ${main.kind === 'bike' ? 'bike' : 'car'}`}
              tier="tertiary"
              size="sm"
              icon="plus"
              busy={flow.busy}
              onPress={() => flow.pick()}
            />
          </View>
        ) : null}
        {error ? <ErrorState title={error} /> : null}
      </View>
      <AddModSheet visible={addMod} build={main} onClose={() => setAddMod(false)} />

      {/* The build sheet under the card (Review 19 #39): what's done to it, then where the power comes from. */}
      <View onLayout={(e) => (modsY.current = e.nativeEvent.layout.y)}>
        <Section title="Mods">
          <ModGroups build={main} mine />
        </Section>
      </View>
      <View>
        <RowDivider />
        <ListRow title="Power and dyno" subtitle="How the power is worked out" onPress={() => router.push({ pathname: '/build/power', params: { id: main.id } })} />
        <RowDivider />
      </View>

      {others.length ? (
        <Section title="Other builds">
          <View>
            {others.map((b, i) => (
              <View key={b.id}>
                {i ? <RowDivider /> : null}
                <ListRow leading={{ classBadge: classOf(b) }} title={buildName(b)} subtitle={powerLine(b, now)} onPress={() => openBuild(b.id)} />
              </View>
            ))}
          </View>
        </Section>
      ) : null}
    </ScrollView>
  );
}

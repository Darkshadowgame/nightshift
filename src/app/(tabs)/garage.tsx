import { router, useNavigation } from 'expo-router';
import { useLayoutEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { BuildCard, useBuildPicture } from '../../components/BuildBits';
import { Button, DsText, EmptyState, ErrorState, HeaderActions, ListRow, useToast } from '../../components/ds';
import { usePhotoFlow } from '../../components/PhotoFlow';
import { lastBrought } from '../../lib/bringing';
import { useNow } from '../../lib/clock';
import { useStore } from '../../lib/store';
import type { Build } from '../../lib/types';
import { SPACING } from '../../theme';

const openBuild = (id: string) => router.push({ pathname: '/build/[id]', params: { id } });
const addBuild = () => router.push('/build/edit');

/**
 * One vehicle in the Garage: a photo card of equal standing with the others (owner, from a real
 * phone: "show the car and bikes first, then when you click in, the mods"). A vehicle with no photo
 * of its own says so and offers "Add yours" (or "Add a photo") under its card.
 */
function VehicleCard({ build, main, now }: { build: Build; main: boolean; now: Date }) {
  const { saveBuild } = useStore();
  const toast = useToast();
  const pic = useBuildPicture(build);
  const [error, setError] = useState<string | null>(null);
  const flow = usePhotoFlow({
    aspect: '4:3',
    onError: setError,
    onPhoto: (ref) => {
      saveBuild({ ...build, photos: [ref, ...build.photos] })
        .then(() => toast({ message: 'Photo added' }))
        .catch((e) => setError(e instanceof Error ? e.message : "Couldn't save the photo."));
    },
  });
  const kind = build.kind === 'bike' ? 'bike' : 'car';
  const standIn = !!pic?.standIn;
  return (
    <View style={{ gap: SPACING.sm }}>
      {flow.view}
      <BuildCard build={build} now={now} tag={main ? { label: 'Main', tone: 'neutral' } : undefined} onPress={() => openBuild(build.id)} />
      {build.photos.length === 0 ? (
        // A stand-in photo says it's one, so "Add a photo" under a photo makes sense (Review 19 #38).
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', columnGap: SPACING.xs }}>
          {standIn ? <DsText v="secondary">Sample photo.</DsText> : null}
          <Button
            label={standIn ? 'Add yours' : `Add a photo of your ${kind}`}
            accessibilityLabel={`Add a photo of your ${build.make} ${build.model}`.trim()}
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
  );
}

/**
 * Garage (Redesign 2, 3.8; T1): every car and bike you own as a photo card of equal standing, the
 * main one (the one you last brought to a meet, else your first) first and tagged Main. Tap one to
 * open it: its photos, mods, Power and dyno and edit actions (the build page). "+" in the header
 * adds a car or bike; that is the only action here.
 */
export default function Garage() {
  const nav = useNavigation();
  const { builds, me, events } = useStore();
  const now = useNow();
  const mine = builds.filter((b) => b.ownerId === me);
  const main = lastBrought(events, me, builds) ?? mine[0];
  const ordered = main ? [main, ...mine.filter((b) => b.id !== main.id)] : [];

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
    <ScrollView contentContainerStyle={{ padding: SPACING.screen, gap: SPACING.section, paddingBottom: SPACING.xxxl * 2 }} showsVerticalScrollIndicator={false}>
      {ordered.map((b) => (
        <VehicleCard key={b.id} build={b} main={b.id === main.id && ordered.length > 1} now={now} />
      ))}
      <ListRow leading={{ icon: 'plus' }} title="Add a car or bike" onPress={addBuild} />
    </ScrollView>
  );
}

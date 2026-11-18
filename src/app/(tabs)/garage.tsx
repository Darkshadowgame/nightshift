import { router, useNavigation } from 'expo-router';
import { useLayoutEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { AddModSheet } from '../../components/AddModSheet';
import { BuildCard, buildName, powerLine } from '../../components/BuildBits';
import { Button, EmptyState, ErrorState, HeaderActions, ListRow, RowDivider, Section, useToast } from '../../components/ds';
import { usePhotoFlow } from '../../components/PhotoFlow';
import { lastBrought } from '../../lib/bringing';
import { classOf } from '../../lib/classes';
import { useNow } from '../../lib/clock';
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
  const [error, setError] = useState<string | null>(null);
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
    nav.setOptions({ headerRight: () => <HeaderActions add={{ label: 'Add a car or bike', onPress: addBuild }} bell /> });
  }, [nav]);

  if (!main) {
    return (
      <ScrollView contentContainerStyle={{ padding: SPACING.screen, paddingBottom: SPACING.xxxl, flexGrow: 1, justifyContent: 'center' }} showsVerticalScrollIndicator={false}>
        <EmptyState glyph="car" title="Your garage is empty" body="It's how you say what you're bringing to a meet." action={{ label: 'Add your car or bike', onPress: addBuild }} />
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: SPACING.screen, gap: SPACING.section, paddingBottom: SPACING.xxxl }} showsVerticalScrollIndicator={false}>
      {flow.view}
      <View style={{ gap: SPACING.sm }}>
        <BuildCard build={main} now={now} onPress={() => openBuild(main.id)} action={{ label: 'Add a mod', onPress: () => setAddMod(true) }} />
        {main.photos.length === 0 ? <Button label="Add a photo" tier="tertiary" size="sm" icon="plus" busy={flow.busy} onPress={() => flow.pick()} style={{ alignSelf: 'center' }} /> : null}
        {error ? <ErrorState title={error} /> : null}
      </View>
      <AddModSheet visible={addMod} build={main} onClose={() => setAddMod(false)} />

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

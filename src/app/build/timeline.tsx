import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { NotFoundState, PAGE } from '../../components/Detail';
import { ActionBar, DsText, EmptyState, FitImage, ListRow, PAGE_WITH_BAR, RowDivider, Section } from '../../components/ds';
import { useShareLink } from '../../components/ShareLink';
import { logOf, timeline, timelineText } from '../../lib/buildLog';
import { useBuildLog } from '../../lib/buildLogStore';
import { useNow } from '../../lib/clock';
import { runDay } from '../../lib/dyno';
import { plural } from '../../lib/format';
import { photoSource } from '../../lib/photoSource';
import { buildSharePayload } from '../../lib/share';
import { useStore } from '../../lib/store';
import { COLOR, RADII, SPACING } from '../../theme';

/** One side of a before and after pair. */
function Shot({ label, photo, what }: { label: string; photo: string; what: string }) {
  return (
    <View style={{ flex: 1, gap: SPACING.xs }}>
      <FitImage fit="cover" source={photoSource(photo)} frameAspect={4 / 3} style={{ width: '100%', aspectRatio: 4 / 3, borderRadius: RADII.control, backgroundColor: COLOR.surface.media }} accessibilityLabel={`${label} photo: ${what}`} />
      <DsText v="caption">{label}</DsText>
    </View>
  );
}

/**
 * Build timeline: the mods in the order they went on, with before and after photos where there
 * are any, on one page you can share as words and a link. Dates and photos are the owner's own, kept
 * on their phone, so someone else's build only shows a timeline once it has dates to show.
 */
export default function BuildTimeline() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { builds, me } = useStore();
  const { log } = useBuildLog();
  const now = useNow();
  const sharer = useShareLink('build');
  const b = builds.find((x) => x.id === id);
  if (!b) return <NotFoundState what="Build" message="This build no longer exists." />;
  const mine = b.ownerId === me;
  const entries = timeline(b, logOf(log, b.id), now);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={entries.length ? PAGE_WITH_BAR : PAGE} showsVerticalScrollIndicator={false}>
        <View style={{ gap: SPACING.xs }}>
          <DsText v="title" accessibilityRole="header">{`${b.make} ${b.model}`}</DsText>
          <DsText v="secondary">{entries.length ? `${plural(entries.length, 'mod')}, in the order they went on` : 'Nothing fitted yet'}</DsText>
        </View>
        {entries.length === 0 ? (
          <EmptyState variant="inline" title={mine ? 'Add a mod and it shows up here with its date.' : 'No mods to show yet.'} />
        ) : (
          <Section title="Timeline">
            <View>
              {entries.map((e, i) => (
                <View key={e.mod.id}>
                  {i ? <RowDivider /> : null}
                  <ListRow
                    title={e.mod.name}
                    subtitle={e.on ? runDay(e.on, now) : mine ? 'Already on it. Tap to add the day.' : 'Already on it'}
                    onPress={mine ? () => router.push({ pathname: '/build/entry', params: { id: b.id, mod: e.mod.name } }) : undefined}
                    accessibilityLabel={`${e.mod.name}, ${e.on ? runDay(e.on, now) : 'no day yet'}`}
                  />
                  {e.before || e.after ? (
                    <View style={{ flexDirection: 'row', gap: SPACING.sm, paddingBottom: SPACING.md }}>
                      {e.before ? <Shot label="Before" photo={e.before} what={e.mod.name} /> : <View style={{ flex: 1 }} />}
                      {e.after ? <Shot label="After" photo={e.after} what={e.mod.name} /> : <View style={{ flex: 1 }} />}
                    </View>
                  ) : null}
                </View>
              ))}
            </View>
          </Section>
        )}
      </ScrollView>
      {entries.length ? <ActionBar primary={{ label: 'Share the timeline', icon: 'share', onPress: () => sharer.share(buildSharePayload(b, timelineText(b, logOf(log, b.id), now))) }} /> : null}
      {sharer.sheet}
    </View>
  );
}

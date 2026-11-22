import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { bhpLine } from '../../components/BringPicker';
import { NotFoundState } from '../../components/Detail';
import { ClassBadge, displayHandle, DsText, EmptyState, ListRow, RowDivider } from '../../components/ds';
import { broughtBuild } from '../../lib/bringing';
import { classOf } from '../../lib/classes';
import { useCommunity } from '../../lib/communityStore';
import { idsWithoutBlocked } from '../../lib/blocking';
import { goingMix } from '../../lib/eventAction';
import { goingSummary } from '../../lib/format';
import { STATUS_WORDS } from '../../lib/meetExtras';
import { useStore } from '../../lib/store';
import { COLOR, SPACING } from '../../theme';

/**
 * Who's going to a meet (Review 13, 4.5: reading a list is a push, not a sheet). One row each:
 * avatar and @handle, what they're bringing with its class, and whether they're hosting or have
 * checked in. Tap a row for their profile; back returns to the meet.
 */
export default function GoingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { events, users, builds, me } = useStore();
  const { blocked } = useCommunity();
  const ev = events.find((e) => e.id === id);
  if (!ev) return <NotFoundState what="Meet" message="It may have been cancelled and removed, or the link is old." />;
  // Someone you blocked is not on the list or in the count.
  const shown = { ...ev, going: idsWithoutBlocked(ev.going, blocked) };
  const mix = goingMix(shown, builds);
  // You first, then everyone else in the order they said they're going.
  const people = [...shown.going].sort((a, b) => (a === me ? -1 : b === me ? 1 : 0));
  return (
    <ScrollView style={{ flex: 1, backgroundColor: COLOR.surface.bg }} contentContainerStyle={{ padding: SPACING.screen, gap: SPACING.md, paddingBottom: SPACING.xxxl }} showsVerticalScrollIndicator={false}>
      <DsText v="secondary">{`${goingSummary(shown.going.length, mix.cars, mix.bikes)} · ${ev.title}`}</DsText>
      {people.length === 0 ? (
        <EmptyState variant="inline" title="Nobody's said they're going yet." />
      ) : (
        <View>
          {people.map((uid, i) => {
            const u = users.find((x) => x.id === uid);
            const b = broughtBuild(ev, uid, builds);
            const checked = (ev.checkIns[uid] ?? []).length > 0;
            return (
              <View key={uid}>
                {i > 0 ? <RowDivider inset /> : null}
                <ListRow
                  leading={{ avatar: { name: u?.name, handle: u?.handle } }}
                  // A person is always avatar + @handle (K3), you included: "You" is said beside it.
                  title={displayHandle(u?.handle ?? 'unknown')}
                  subtitle={b ? `${b.make} ${b.model} · ${bhpLine(b)}` : 'Passenger'}
                  trailing={b ? <ClassBadge letter={classOf(b)} size="sm" /> : undefined}
                  meta={[uid === me ? 'You' : null, ev.hostIds.includes(uid) ? 'Hosting' : null, checked ? 'Checked in' : null, ev.status?.[uid] ? STATUS_WORDS[ev.status[uid]].tag : null].filter(Boolean).join(' · ') || undefined}
                  onPress={uid === me ? undefined : () => router.push({ pathname: '/user/[id]', params: { id: uid } })}
                />
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

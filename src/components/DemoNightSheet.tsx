import { router } from 'expo-router';
import { View } from 'react-native';
import { DEMO_SEEDED_GOING } from '../data/seed';
import { useAuth } from '../lib/auth';
import { useNow } from '../lib/clock';
import { EVENT_LABELS, phaseOf } from '../lib/events';
import { DEMO_NIGHT } from '../lib/glossary';
import { useStore } from '../lib/store';
import { whenLabel } from '../lib/when';
import { COLOR, EVENT_COLOURS, SPACING } from '../theme';
import { Button, DsText, ListRow, Sheet } from './ds';

/**
 * What DEMO NIGHT (Tonight's header tag) means, and the way out of the demo (owner, Review 17): "Back
 * to my account" when an account is waiting behind the demo, else "Leave the demo", which opens the
 * sign-in form. The same way out sits in Settings › Demo.
 *
 * It also names the meets the demo put you down for ("You're going (demo)", Review 20 problem 2), so
 * hosting your own Sunday meet never hides that you're already going to one.
 */
export function DemoNightSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const auth = useAuth();
  const { events, me } = useStore();
  const now = useNow();
  const seeded = events.filter((e) => DEMO_SEEDED_GOING.has(e.id) && e.going.includes(me) && phaseOf(e, now) === 'upcoming');
  const leave = () => {
    onClose();
    if (auth.accountWaiting) void auth.backToAccount();
    else router.push('/account');
  };
  return (
    <Sheet visible={visible} title={DEMO_NIGHT.title} onClose={onClose}>
      <View style={{ gap: SPACING.lg }}>
        <DsText v="body">{DEMO_NIGHT.body}</DsText>
        {seeded.length ? (
          <View>
            {seeded.map((e) => (
              <ListRow
                key={e.id}
                leading={{ pin: e.type, colour: EVENT_COLOURS[e.type] ?? COLOR.text.secondary }}
                title={e.title}
                subtitle={`${EVENT_LABELS[e.type]} · ${whenLabel(e.startsAt, now)}`}
                meta={DEMO_NIGHT.seededGoing}
                onPress={() => {
                  onClose();
                  router.push({ pathname: '/event/[id]', params: { id: e.id } });
                }}
              />
            ))}
          </View>
        ) : null}
        <Button tier="secondary" block label={auth.accountWaiting ? 'Back to my account' : 'Leave the demo'} onPress={leave} />
      </View>
    </Sheet>
  );
}

import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Pin } from '../components/Pin';
import { ProfileForm } from '../components/ProfileForm';
import { Row, Txt } from '../components/ui';
import { DEMO_HOME, DEMO_REGION } from '../data/seed';
import { useStore } from '../lib/store';
import { C } from '../theme';

/** First run: the person sets up their own profile. The guard in _layout moves on once it's saved. */
export default function Welcome() {
  const { saveProfile } = useStore();
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      contentContainerStyle={{ padding: 16, paddingTop: insets.top + 24, paddingBottom: insets.bottom + 40, gap: 24 }}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
      keyboardDismissMode="interactive"
    >
      <View style={{ gap: 8 }}>
        <Row gap={10}>
          <Pin glyph="rolling" colour={C.sodium} size={44} />
          <Txt v="h1">Nightshift</Txt>
        </Row>
        <Txt v="muted">The UK car and bike scene on one map. Set up your profile to get invites to meets and cruises near you. You must be 18 or over.</Txt>
      </View>
      <ProfileForm initial={{ handle: '', name: '', region: DEMO_REGION, home: DEMO_HOME }} submitLabel="Let's go" onSubmit={saveProfile} />
    </ScrollView>
  );
}

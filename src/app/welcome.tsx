import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProfileForm } from '../components/ProfileForm';
import { LinkText, Row, Txt } from '../components/ui';
import { Wordmark } from '../components/Wordmark';
import { DEMO_REGION } from '../data/seed';
import { useAuth } from '../lib/auth';
import { useStore } from '../lib/store';

/** First run: the person sets up their own profile. The guard in _layout moves on once it's saved. */
export default function Welcome() {
  const { saveProfile, backend } = useStore();
  const auth = useAuth();
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      contentContainerStyle={{ padding: 16, paddingTop: insets.top + 28, paddingBottom: insets.bottom + 40, gap: 28 }}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
      keyboardDismissMode="interactive"
    >
      <View style={{ gap: 14 }}>
        <Wordmark />
        <Txt v="label">18+ only · Set up your profile to hear about events near you</Txt>
        {backend === 'supabase' ? (
          <Row gap={12}>
            <Txt v="muted" style={{ flexShrink: 1 }}>Signed in{auth.email ? ` as ${auth.email}` : ''}.</Txt>
            <LinkText label="Not you? Sign out ›" onPress={() => auth.signOut()} />
          </Row>
        ) : (
          <Row gap={12}>
            <Txt v="muted" style={{ flexShrink: 1 }}>Demo: sample people, nothing leaves this phone.</Txt>
            <LinkText label="Sign in instead ›" onPress={() => auth.leaveDemo()} />
          </Row>
        )}
      </View>
      <ProfileForm initial={{ handle: '', name: '', region: DEMO_REGION, home: null }} submitLabel="Let's go" onSubmit={saveProfile} />
    </ScrollView>
  );
}

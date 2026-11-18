import { router } from 'expo-router';
import { ScrollView } from 'react-native';
import { ProfileForm } from '../components/ProfileForm';
import { useStore } from '../lib/store';
import { SPACING } from '../theme';

export default function EditProfile() {
  const { users, me, saveProfile } = useStore();
  const user = users.find((u) => u.id === me)!;
  return (
    <ScrollView contentContainerStyle={{ padding: SPACING.screen, paddingBottom: SPACING.xxxl }} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive" automaticallyAdjustKeyboardInsets showsVerticalScrollIndicator={false}>
      <ProfileForm
        initial={{ handle: user.handle, name: user.name, region: user.region, home: user.home, travelMiles: user.travelMiles, alerts: user.alerts }}
        submitLabel="Save"
        onSubmit={async (draft) => {
          await saveProfile(draft);
          router.back();
        }}
      />
    </ScrollView>
  );
}

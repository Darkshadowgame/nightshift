import { router } from 'expo-router';
import { ScrollView } from 'react-native';
import { ProfileForm } from '../components/ProfileForm';
import { useStore } from '../lib/store';

export default function EditProfile() {
  const { users, me, saveProfile } = useStore();
  const user = users.find((u) => u.id === me)!;
  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
      <ProfileForm
        initial={{ handle: user.handle, name: user.name, region: user.region, home: user.home }}
        submitLabel="Save"
        onSubmit={(draft) => {
          saveProfile(draft);
          router.back();
        }}
      />
    </ScrollView>
  );
}

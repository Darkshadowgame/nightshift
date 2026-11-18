import { router } from 'expo-router';
import { ProfileForm } from '../components/ProfileForm';
import { useStore } from '../lib/store';

/** Your profile: the form owns its ActionBar (Save), the discard guard and the "Saved" toast. */
export default function EditProfile() {
  const { users, me, saveProfile } = useStore();
  const user = users.find((u) => u.id === me)!;
  return (
    <ProfileForm
      initial={{ handle: user.handle, name: user.name, region: user.region, home: user.home, travelMiles: user.travelMiles, alerts: user.alerts }}
      submitLabel="Save"
      onSubmit={saveProfile}
      onSaved={() => (router.canGoBack() ? router.back() : router.replace('/settings'))}
    />
  );
}

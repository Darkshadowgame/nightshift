import { router } from 'expo-router';
import { View } from 'react-native';
import { useAuth } from '../lib/auth';
import { DEMO_NIGHT } from '../lib/glossary';
import { SPACING } from '../theme';
import { Button, DsText, Sheet } from './ds';

/**
 * What DEMO NIGHT (Tonight's header tag) means, and the way out of the demo (owner, Review 17): "Back
 * to my account" when an account is waiting behind the demo, else "Leave the demo", which opens the
 * sign-in form. The same way out sits in Settings › Demo.
 */
export function DemoNightSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const auth = useAuth();
  const leave = () => {
    onClose();
    if (auth.accountWaiting) void auth.backToAccount();
    else router.push('/account');
  };
  return (
    <Sheet visible={visible} title={DEMO_NIGHT.title} onClose={onClose}>
      <View style={{ gap: SPACING.lg }}>
        <DsText v="body">{DEMO_NIGHT.body}</DsText>
        <Button tier="secondary" block label={auth.accountWaiting ? 'Back to my account' : 'Leave the demo'} onPress={leave} />
      </View>
    </Sheet>
  );
}

import { router } from 'expo-router';
import { useEffect } from 'react';
import { EmailSignIn } from './signin';
import { useAuth } from '../lib/auth';

/**
 * Sign in from the demo (Settings › Demo › Leave the demo, or the Demo night sheet; Review 17): the
 * sign-in form itself, a T4 with the app's back arrow, never the first-run landing that offers Try the
 * demo. The demo carries on underneath until the sign-in works; then the app opens on the account.
 */
export default function Account() {
  const auth = useAuth();
  useEffect(() => {
    if (auth.status === 'signedIn') router.replace('/');
  }, [auth.status]);
  return <EmailSignIn />;
}

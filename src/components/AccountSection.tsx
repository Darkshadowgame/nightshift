import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { useStore } from '../lib/store';
import { Button, Card, ConfirmBox, InlineError, Section, Txt } from './ui';

/**
 * Me › Account. Signed in: who you are, sign out, and delete the account
 * (Apple 5.1.1(v): it has to be possible from inside the app). In the demo:
 * how to get an account; the demo's data stays on the phone either way.
 */
export function AccountSection() {
  const auth = useAuth();
  const store = useStore();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState<null | 'out' | 'delete'>(null);
  const [error, setError] = useState<string | null>(null);

  if (store.backend === 'local') {
    return (
      <Section title="Account">
        <Card>
          <Txt>You're trying the demo</Txt>
          <Txt v="muted">Sign in with your email to meet real people: going, check-ins, chat and votes are then shared. The demo stays here for later.</Txt>
          <Button label="Sign in or create an account" onPress={() => auth.leaveDemo()} />
        </Card>
      </Section>
    );
  }

  async function run(kind: 'out' | 'delete') {
    setError(null);
    setBusy(kind);
    try {
      if (kind === 'out') await auth.signOut();
      else await store.deleteAccount();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'That did not work. Try again.');
      setBusy(null);
    }
  }

  return (
    <Section title="Account">
      <Card>
        <Txt>Signed in{auth.email ? ` as ${auth.email}` : ''}</Txt>
        <Txt v="muted">
          {store.online
            ? store.pendingWrites > 0
              ? `Sending ${store.pendingWrites} change${store.pendingWrites === 1 ? '' : 's'} made offline…`
              : 'Your profile, garage, events and chat are on Nightshift’s server, so other people see them.'
            : `Offline: showing what this phone last saw.${store.pendingWrites > 0 ? ` ${store.pendingWrites} change${store.pendingWrites === 1 ? '' : 's'} will be sent when you're back online.` : ''}`}
        </Txt>
        <Button label="Sign out" kind="secondary" busy={busy === 'out'} onPress={() => run('out')} />
        {!confirmDelete ? <InlineError message={error} /> : null}
      </Card>
      {confirmDelete ? (
        <ConfirmBox
          message="Delete your account? This deletes your profile, home area, garage and photos, check-ins, chat, posts and messages, votes, notices and crew place, straight away. Events only you host are cancelled; crews you own pass to a host. Places you suggested stay, without your name. It can't be undone."
          verb="Delete"
          busy={busy === 'delete'}
          error={error}
          onConfirm={() => run('delete')}
          onCancel={() => setConfirmDelete(false)}
        />
      ) : (
        <Button label="Delete my account" kind="danger" onPress={() => setConfirmDelete(true)} />
      )}
    </Section>
  );
}

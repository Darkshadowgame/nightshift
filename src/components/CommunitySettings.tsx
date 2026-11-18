import { router } from 'expo-router';
import { useState } from 'react';
import { useCommunity, useCommunityQuery } from '../lib/communityStore';
import { Button, Card, InlineError, LinkText, Section, ToggleRow, Txt } from './ui';

/** Settings › Community: "Show me in Cars near you", connections and blocks, and Moderation for staff. */
export function CommunitySettings() {
  const community = useCommunity();
  const status = useCommunityQuery((s) => s.moderationStatus(), []);
  const [error, setError] = useState<string | null>(null);
  return (
    <>
      <Section title="Community">
        <Card>
          <ToggleRow
            label="Show me in Cars near you"
            hint="People near you see your builds and a rough distance, never where you live."
            value={community.showInNearby}
            onValueChange={(v) => {
              setError(null);
              community.run((s) => s.setShowInNearby(v)).catch((e) => setError(e instanceof Error ? e.message : 'Could not save that.'));
            }}
          />
          <InlineError message={error} />
          <Txt v="caption">Only people you're connected with can message you. Connection requests wait for you to accept.</Txt>
          <LinkText label="Connections and blocked people ›" onPress={() => router.push('/connections')} />
          {status.data?.suspended ? (
            <Txt v="caption">Your account is suspended{status.data.until ? ` until ${new Date(status.data.until).toLocaleDateString('en-GB')}` : ''}: you can read and report, not post or message.</Txt>
          ) : null}
        </Card>
      </Section>
      {status.data?.isStaff ? (
        <Section title="Moderation">
          <Card>
            <Txt v="muted">Reports from everyone, for the Nightshift team only.</Txt>
            <Button label="Open reports" kind="secondary" onPress={() => router.push('/moderation')} />
          </Card>
        </Section>
      ) : null}
    </>
  );
}

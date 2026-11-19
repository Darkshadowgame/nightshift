import { router } from 'expo-router';
import { View } from 'react-native';
import { useNow } from '../lib/clock';
import { useCommunity } from '../lib/communityStore';
import { idsIn } from '../lib/connections';
import { useStore } from '../lib/store';
import { SPACING } from '../theme';
import { ConversationRow, MEET_ACTION } from './Community';
import { DsText, EmptyState, RowDivider, Section } from './ds';
import { PeopleStrip } from './PeopleStrip';

/**
 * Community › Messages: your 1-to-1 and group chats, newest first, with unread counts. Only
 * connected people can message each other, so with no connections the one action is to meet people.
 * Requests live in People, not here.
 */
export function CommunityMessages() {
  const { users } = useStore();
  const community = useCommunity();
  const now = useNow();
  const connected = idsIn(community.connections, 'connected');
  const list = community.conversations;
  // Your connections as car photos under the chats (Review 19 #54): one tap to their profile and Message.
  const friends = connected.filter((id) => !community.blocked.has(id)).flatMap((id) => users.filter((u) => u.id === id));

  if (list.length === 0) {
    return connected.length === 0 ? (
      <EmptyState glyph="chat" title="No chats yet" body="You can message people once you're connected. Meet them at an event, then connect from their profile." action={MEET_ACTION} />
    ) : (
      <EmptyState glyph="chat" title="No chats yet" body="Start a chat with one of your connections, or a group of them." action={{ label: 'New chat', onPress: () => router.push('/chat/new') }} />
    );
  }

  return (
    <View style={{ gap: SPACING.lg }}>
      <View>
        {list.map((c, i) => (
          <View key={c.id}>
            {i ? <RowDivider inset /> : null}
            <ConversationRow c={c} me={community.me} users={users} now={now} />
          </View>
        ))}
      </View>
      {friends.length ? (
        <Section title="Your connections">
          <PeopleStrip people={friends} label="Your connections" />
        </Section>
      ) : null}
      <DsText v="caption" style={{ textAlign: 'center' }}>
        Don't share your address or anyone else's. Report anything that isn't right from the chat's menu.
      </DsText>
    </View>
  );
}

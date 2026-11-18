import { router } from 'expo-router';
import { View } from 'react-native';
import { useNow } from '../lib/clock';
import { useCommunity } from '../lib/communityStore';
import { idsIn } from '../lib/connections';
import { plural } from '../lib/format';
import { useStore } from '../lib/store';
import { BRAND } from '../theme';
import { ConversationRow } from './Community';
import { Card, EmptyState, LinkText, Row, Section, Txt } from './ui';

/**
 * Community › Messages: your 1-to-1 and group chats, newest first, with unread
 * counts. Only connected people can message each other; "New" is in the header.
 */
export function CommunityMessages() {
  const { users } = useStore();
  const community = useCommunity();
  const now = useNow();
  const connected = idsIn(community.connections, 'connected');
  const list = community.conversations;

  return (
    <View style={{ gap: 18 }}>
      {community.incoming.length > 0 ? (
        <Card accent={BRAND}>
          <Row style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}>
            <Txt style={{ flex: 1 }}>{plural(community.incoming.length, 'connection request')} waiting.</Txt>
            <LinkText label="See requests ›" onPress={() => router.push('/connections')} />
          </Row>
        </Card>
      ) : null}
      <Section title="Chats" right={<LinkText label={`Connections ${connected.length} ›`} onPress={() => router.push('/connections')} />}>
        {list.length === 0 ? (
          connected.length === 0 ? (
            <EmptyState
              glyph="chat"
              title="No connections yet"
              body="Messages are only between connected people. Find someone near you and tap Connect; until then, talk on the forum."
              action={{ label: 'Find people', onPress: () => router.setParams({ tab: 'people' }) }}
            />
          ) : (
            <EmptyState glyph="chat" title="No chats yet" body="Start a chat with one of your connections, or a group of them." action={{ label: 'New chat', onPress: () => router.push('/chat/new') }} />
          )
        ) : (
          <View>
            {list.map((c) => (
              <ConversationRow key={c.id} c={c} me={community.me} users={users} now={now} />
            ))}
          </View>
        )}
      </Section>
      <Txt v="caption" style={{ textAlign: 'center' }}>
        Hold off on sharing your address or anyone else's. Report anything that isn't right from the chat's menu.
      </Txt>
    </View>
  );
}

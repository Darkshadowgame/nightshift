import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useLayoutEffect } from 'react';
import { ScrollView } from 'react-native';
import { CommunityFeed } from '../../components/CommunityFeed';
import { CommunityForum } from '../../components/CommunityForum';
import { CommunityMessages } from '../../components/CommunityMessages';
import { CommunityPeople } from '../../components/CommunityPeople';
import { HeaderAction, Row, Segmented } from '../../components/ui';
import { useCommunity } from '../../lib/communityStore';

type Tab = 'feed' | 'people' | 'forum' | 'messages';
const TABS: Tab[] = ['feed', 'people', 'forum', 'messages'];

/**
 * The Community tab: Feed (posts near you or from connections), People (Cars
 * near you), Forum (boards) and Messages (connections only). One primary
 * action per section, in the header.
 */
export default function CommunityScreen() {
  const nav = useNavigation();
  const params = useLocalSearchParams<{ tab?: string }>();
  const tab: Tab = TABS.includes(params.tab as Tab) ? (params.tab as Tab) : 'feed';
  const { unread, incoming } = useCommunity();
  const setTab = (t: Tab) => router.setParams({ tab: t });

  useLayoutEffect(() => {
    const action =
      tab === 'feed'
        ? { label: '+ Post', a11y: 'New post', go: () => router.push('/post/new') }
        : tab === 'forum'
          ? { label: '+ Thread', a11y: 'New thread', go: () => router.push('/forum/new') }
          : tab === 'messages'
            ? { label: '+ Chat', a11y: 'New chat', go: () => router.push('/chat/new') }
            : { label: incoming.length ? `Requests ${incoming.length}` : 'Connections', a11y: incoming.length ? `${incoming.length} connection requests` : 'Your connections', go: () => router.push('/connections') };
    nav.setOptions({
      headerRight: () => (
        <Row gap={8} style={{ marginRight: 10, flexWrap: 'nowrap' }}>
          <HeaderAction label={action.label} accessibilityLabel={action.a11y} onPress={action.go} />
        </Row>
      ),
    });
  }, [nav, tab, incoming.length]);

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 18, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
      <Segmented<Tab>
        value={tab}
        onChange={setTab}
        options={[
          { key: 'feed', label: 'Feed' },
          { key: 'people', label: incoming.length ? `People ${incoming.length}` : 'People' },
          { key: 'forum', label: 'Forum' },
          { key: 'messages', label: unread ? `Messages ${unread}` : 'Messages' },
        ]}
      />
      {tab === 'feed' ? <CommunityFeed /> : tab === 'people' ? <CommunityPeople /> : tab === 'forum' ? <CommunityForum /> : <CommunityMessages />}
    </ScrollView>
  );
}

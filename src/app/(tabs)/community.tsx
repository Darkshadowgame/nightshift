import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useLayoutEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { CommunityFeed } from '../../components/CommunityFeed';
import { CommunityForum } from '../../components/CommunityForum';
import { CommunityMessages } from '../../components/CommunityMessages';
import { CommunityPeople } from '../../components/CommunityPeople';
import { BanBanner } from '../../components/ModerationGate';
import { HeaderActions, SegmentedControl, Sheet, SheetOption } from '../../components/ds';
import { useCommunity, useCommunityQuery } from '../../lib/communityStore';
import { SPACING } from '../../theme';

type Tab = 'feed' | 'people' | 'forum' | 'messages';
const TABS: Tab[] = ['feed', 'people', 'forum', 'messages'];

/**
 * The Community tab: the meet loop after the meet. Feed (posts near you or from connections),
 * People (near you, your connections, requests), Forum (ask advice) and Messages (connections only).
 * The header's one action is always "+ New": a sheet with a post, a thread or a chat.
 * Requests are counted once, on the People segment, and listed once, in People.
 */
export default function CommunityScreen() {
  const nav = useNavigation();
  const params = useLocalSearchParams<{ tab?: string }>();
  const tab: Tab = TABS.includes(params.tab as Tab) ? (params.tab as Tab) : 'feed';
  const { unread, incoming } = useCommunity();
  const ban = useCommunityQuery((s) => s.moderationStatus(), []);
  const [creating, setCreating] = useState(false);
  const setTab = (t: Tab) => router.setParams({ tab: t });

  useLayoutEffect(() => {
    nav.setOptions({
      headerRight: () => <HeaderActions action={{ label: '+ New', accessibilityLabel: 'New post, thread or chat', onPress: () => setCreating(true) }} bell />,
    });
  }, [nav]);

  const go = (path: '/post/new' | '/forum/new' | '/chat/new') => {
    setCreating(false);
    router.push(path);
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: SPACING.screen, gap: SPACING.section, paddingBottom: SPACING.xxxl }} keyboardShouldPersistTaps="handled">
        <SegmentedControl<Tab>
          value={tab}
          onChange={setTab}
          accessibilityLabel="Community sections"
          options={[
            { key: 'feed', label: 'Feed' },
            { key: 'people', label: 'People', count: incoming.length || undefined },
            { key: 'forum', label: 'Forum' },
            { key: 'messages', label: 'Messages', count: unread || undefined },
          ]}
        />
        <BanBanner status={ban.data} />
        {tab === 'feed' ? <CommunityFeed /> : tab === 'people' ? <CommunityPeople /> : tab === 'forum' ? <CommunityForum /> : <CommunityMessages />}
      </ScrollView>
      <Sheet visible={creating} title="New" onClose={() => setCreating(false)}>
        <View>
          <SheetOption label="New post" detail="A photo or an update on your build, for the feed" onPress={() => go('/post/new')} />
          <SheetOption label="New thread" detail="Ask for advice or start a discussion on the forum" onPress={() => go('/forum/new')} />
          <SheetOption label="New chat" detail="Message one of your connections, or a group" onPress={() => go('/chat/new')} />
        </View>
      </Sheet>
    </View>
  );
}

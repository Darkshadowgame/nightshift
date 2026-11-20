import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useLayoutEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { CommunityFeed } from '../../components/CommunityFeed';
import { CommunityMessages } from '../../components/CommunityMessages';
import { CommunityPeople } from '../../components/CommunityPeople';
import { BanBanner } from '../../components/ModerationGate';
import { HeaderActions, SegmentedControl, Sheet, SheetOption } from '../../components/ds';
import { useCommunityQuery } from '../../lib/communityStore';
import { SPACING } from '../../theme';

type Tab = 'feed' | 'people' | 'chats';
/** Old links: `tab=messages` is Chats now; `tab=forum` opens the Feed (the forum is its first row). */
const ALIASES: Record<string, Tab> = { feed: 'feed', people: 'people', chats: 'chats', messages: 'chats', forum: 'feed' };

/**
 * The Community tab (Redesign 2, 3.7): see the scene's photos and talk to people you met.
 * One bar: Feed / People / Chats. Forum and for sale is the first row of the Feed. The header's
 * "+" opens one sheet: post a photo, ask the forum, sell a part, new message. Requests and unread
 * chats are counted once, on the tab's badge, and listed once (People's first row, Chats' dots).
 */
export default function CommunityScreen() {
  const nav = useNavigation();
  const params = useLocalSearchParams<{ tab?: string }>();
  const tab: Tab = ALIASES[params.tab ?? ''] ?? 'feed';
  const ban = useCommunityQuery((s) => s.moderationStatus(), []);
  const [creating, setCreating] = useState(false);
  const setTab = (t: Tab) => router.setParams({ tab: t });

  useLayoutEffect(() => {
    nav.setOptions({
      headerRight: () => <HeaderActions add={{ label: 'Post, ask, sell or message', onPress: () => setCreating(true), icon: 'compose' }} bell />,
    });
  }, [nav]);

  const go = (path: '/post/new' | '/forum/new' | '/chat/new' | { pathname: '/forum/new'; params: { board: string } }) => {
    setCreating(false);
    router.push(path);
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: SPACING.screen, paddingBottom: SPACING.sm }}>
        <SegmentedControl<Tab>
          value={tab}
          onChange={setTab}
          accessibilityLabel="Community"
          options={[
            { key: 'feed', label: 'Feed' },
            { key: 'people', label: 'People' },
            { key: 'chats', label: 'Chats' },
          ]}
        />
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: SPACING.screen, paddingTop: SPACING.sm, gap: SPACING.lg, paddingBottom: SPACING.xxxl }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <BanBanner status={ban.data} />
        {tab === 'feed' ? <CommunityFeed /> : tab === 'people' ? <CommunityPeople /> : <CommunityMessages />}
      </ScrollView>
      <Sheet visible={creating} title="New" onClose={() => setCreating(false)}>
        <View>
          <SheetOption label="Post a photo" detail="Your build, a drive or a meet, for the feed" onPress={() => go('/post/new')} />
          <SheetOption label="Ask the forum" detail="Advice, your build, or something local" onPress={() => go('/forum/new')} />
          <SheetOption label="Sell a part" detail="A For sale listing: price, condition, collection or postage" onPress={() => go({ pathname: '/forum/new', params: { board: 'for_sale' } })} />
          <SheetOption label="New message" detail="One of your connections, or a group" onPress={() => go('/chat/new')} />
        </View>
      </Sheet>
    </View>
  );
}

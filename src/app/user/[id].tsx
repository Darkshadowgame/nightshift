import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useLayoutEffect, useMemo, useState } from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import { BuildArt } from '../../components/BuildArt';
import { BuildGrid, moderateOptions, openReport, OptionsSheet, personMark, type SheetOption } from '../../components/Community';
import { PostList } from '../../components/CommunityFeed';
import { Avatar, Button, DsText, EmptyState, ErrorState, HeaderActions, ListRow, RowDivider, Section, StatBlock, Tag, metaLine } from '../../components/ds';
import { useRep } from '../../components/Rep';
import { NotFound } from '../../components/ui';
import { SAMPLE_PEOPLE } from '../../data/seed';
import { allAwards, categoryInfo } from '../../lib/awards';
import { classOf, effectivePower } from '../../lib/classes';
import { useNow } from '../../lib/clock';
import { useCommunity, useCommunityQuery } from '../../lib/communityStore';
import { CONNECT, connectHint } from '../../lib/connections';
import { plural } from '../../lib/format';
import { publicProfile } from '../../lib/people';
import { photoUri } from '../../lib/photos';
import { useStore } from '../../lib/store';
import type { Build } from '../../lib/types';
import { COLOR, RADII, SPACING } from '../../theme';

/** The build with the most to look at: a photo first, then the most power. */
function coverBuild(builds: Build[]): Build | undefined {
  return [...builds].sort((a, b) => Number(!!b.photos[0]) - Number(!!a.photos[0]) || effectivePower(b) - effectivePower(a))[0];
}

const COVER_HEIGHT = 180;

/**
 * Someone's profile (or yours): a cover from their best build, then avatar, handle, level and crew,
 * the one action that fits (Connect, Requested, Accept or Message; Edit profile for you), and the
 * Garage, Posts and Trophies. Report, block and the rest are in the ··· menu. Never any location.
 */
export default function UserScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const nav = useNavigation();
  const { users, builds, crews, events, votes, me } = useStore();
  const community = useCommunity();
  const now = useNow();
  const awards = useMemo(() => allAwards(votes, events, builds, now), [votes, events, builds, now]);
  const p = publicProfile(id, users, builds, crews, events, awards, now);
  const rep = useRep(id);
  const posts = useCommunityQuery((s) => s.feed('author', { author: id }), [id]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [menu, setMenu] = useState(false);
  const isMe = id === me;
  const state = community.stateOf(id);
  const blocked = community.blocked.has(id);

  async function act(fn: () => Promise<unknown>) {
    setError(null);
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't do that.");
    } finally {
      setBusy(false);
    }
  }

  useLayoutEffect(() => {
    // Detail screens keep a blank title: the cover carries the handle. Yours has no menu.
    nav.setOptions({ headerRight: p && !isMe ? () => <HeaderActions onMenu={() => setMenu(true)} /> : undefined });
  }, [nav, p?.id, isMe]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!p) return <NotFound what="Profile" message="This person isn't on Nightshift any more." />;
  const cover = coverBuild(p.builds);
  const handle = `@${p.handle}`;

  const options: SheetOption[] = [
    ...(state === 'incoming' ? [{ label: CONNECT.decline, onPress: () => void act(() => community.run((s) => s.answerConnection(id, false))) }] : []),
    ...(state === 'outgoing' ? [{ label: CONNECT.cancel, onPress: () => void act(() => community.run((s) => s.removeConnection(id))) }] : []),
    ...(state === 'connected' ? [{ label: CONNECT.remove, danger: true, onPress: () => void act(() => community.run((s) => s.removeConnection(id))) }] : []),
    { label: 'Report profile', onPress: () => openReport('profile', id, id, 'profile') },
    blocked
      ? { label: CONNECT.unblock, onPress: () => void act(() => community.run((s) => s.unblock(id))) }
      : { label: `Block ${handle}`, danger: true, onPress: () => openReport('block', id, id) },
    ...moderateOptions(id),
  ];

  const primary =
    state === 'connected'
      ? { label: CONNECT.message, go: () => act(async () => router.push({ pathname: '/chat/[id]', params: { id: await community.run((s) => s.startDirect(id)) } })) }
      : state === 'incoming'
        ? { label: CONNECT.accept, go: () => act(() => community.run((s) => s.answerConnection(id, true))) }
        : { label: CONNECT.connect, go: () => act(() => community.run((s) => s.requestConnection(id))) };

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: SPACING.xxxl }}>
      <View style={{ height: COVER_HEIGHT, backgroundColor: COLOR.surface.media, overflow: 'hidden' }} aria-hidden>
        {cover?.photos[0] ? (
          <Image source={{ uri: photoUri(cover.photos[0]) }} style={StyleSheet.absoluteFill} resizeMode="cover" accessibilityIgnoresInvertColors />
        ) : cover ? (
          <BuildArt kind={cover.kind} colour={cover.colour} height={COVER_HEIGHT} />
        ) : null}
        {cover?.photos[0] ? <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: COVER_HEIGHT / 2, backgroundColor: COLOR.surface.scrim }} /> : null}
      </View>

      <View style={{ paddingHorizontal: SPACING.screen, marginTop: -SPACING.xxxl, gap: SPACING.section }}>
        <View style={{ gap: SPACING.md }}>
          <View style={{ alignSelf: 'flex-start', borderRadius: RADII.pill, borderWidth: 3, borderColor: COLOR.surface.bg }}>
            <Avatar {...personMark(p)} size="lg" label={`${handle}'s picture`} />
          </View>
          <View style={{ gap: SPACING.xxs }}>
            <DsText v="titleLg" accessibilityRole="header" numberOfLines={2}>
              {handle}
            </DsText>
            <DsText v="secondary">{metaLine([isMe ? `${p.name} (you)` : p.name, p.region])}</DsText>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs }}>
            <Tag label={`Level ${rep.level.level}`} />
            {p.legend ? <Tag label="Legend" tone="info" /> : null}
            {SAMPLE_PEOPLE.includes(p.id) ? <Tag label="Sample" /> : null}
            {!isMe && state === 'connected' ? <Tag label={CONNECT.connected} tone="success" /> : null}
          </View>
          {p.crew ? (
            <View>
              <RowDivider />
              <ListRow
                title={p.crew.name}
                subtitle={metaLine(['Crew', p.crew.tag, plural(p.crew.memberIds.length, 'member')])}
                onPress={() => router.push({ pathname: '/crew/[id]', params: { id: p.crew!.id } })}
              />
              <RowDivider />
            </View>
          ) : null}
          <StatBlock
            stats={[
              { value: String(p.builds.length), label: p.builds.length === 1 ? 'Build' : 'Builds' },
              { value: String(p.meetsAttended), label: p.meetsAttended === 1 ? 'Event' : 'Events' },
              { value: rep.ledger.total.toLocaleString('en-GB'), label: 'Rep' },
            ]}
          />

          {isMe ? (
            <Button label="Edit profile" tier="secondary" block onPress={() => router.push('/profile')} />
          ) : blocked ? (
            <View style={{ gap: SPACING.sm }}>
              <DsText v="secondary">You blocked {handle}. Their posts and messages are hidden from you.</DsText>
              <Button label={CONNECT.unblock} tier="secondary" block busy={busy} onPress={() => act(() => community.run((s) => s.unblock(id)))} />
            </View>
          ) : (
            <View style={{ gap: SPACING.xs }}>
              {state === 'outgoing' ? (
                <Button label={CONNECT.requested} tier="secondary" block disabled hint={`Waiting for ${handle} to accept. Cancel it from the ··· menu.`} onPress={() => {}} />
              ) : (
                <Button label={primary.label} block busy={busy} haptic={state === 'connected' ? 'none' : 'success'} onPress={() => void primary.go()} />
              )}
              {state !== 'outgoing' ? <DsText v="caption">{connectHint(state, p.handle)}</DsText> : null}
            </View>
          )}
          {error ? <ErrorState title={error} /> : null}
        </View>

        <Section title={`Garage (${p.builds.length})`}>
          {p.builds.length ? <BuildGrid builds={p.builds} trophiesOf={(bid) => p.trophies.filter((a) => a.buildId === bid).length} /> : <EmptyState variant="inline" title="No car or bike yet." />}
        </Section>

        <Section title="Posts">
          <PostList
            posts={posts.data}
            loading={posts.loading}
            error={posts.error}
            empty={
              isMe ? (
                <EmptyState variant="inline" title="No posts yet." action={{ label: 'New post', onPress: () => router.push('/post/new') }} />
              ) : (
                <EmptyState variant="inline" title={state === 'connected' ? 'No posts yet.' : 'No public posts yet. Connect to see posts for connections.'} />
              )
            }
          />
        </Section>

        <Section title={`Trophies (${p.trophies.length})`}>
          {p.trophies.length === 0 ? (
            <EmptyState variant="inline" title="No trophies yet. They're voted at events." />
          ) : (
            <View>
              {p.trophies.map((a, i) => {
                const b = builds.find((x) => x.id === a.buildId);
                const ev = events.find((e) => e.id === a.eventId);
                const info = categoryInfo(a.category);
                return (
                  <View key={a.eventId + a.category}>
                    {i ? <RowDivider inset /> : null}
                    <ListRow
                      leading={b ? { classBadge: classOf(b) } : undefined}
                      title={info.label}
                      subtitle={metaLine([b ? `${b.make} ${b.model}` : null, ev?.title])}
                      trailing={<DsText v="meta">+{info.rep} rep</DsText>}
                      onPress={ev ? () => router.push({ pathname: '/event/[id]', params: { id: ev.id } }) : undefined}
                      chevron={false}
                    />
                  </View>
                );
              })}
            </View>
          )}
        </Section>

        <DsText v="caption" style={{ textAlign: 'center' }}>
          Nightshift never shows where anyone lives or where they are.
        </DsText>
      </View>
      <OptionsSheet visible={menu} title="Profile options" options={options} onClose={() => setMenu(false)} />
    </ScrollView>
  );
}

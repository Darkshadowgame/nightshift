import { carShape } from '../../lib/buildShape';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useLayoutEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { BuildRow, buildLine, buildMeta, moderateOptions, openBuild, openReport, OptionsSheet, personMark, type SheetOption } from '../../components/Community';
import { PostList } from '../../components/CommunityFeed';
import { PaintedArt } from '../../components/BuildArt';
import { ActionBar, Avatar, DsText, EmptyState, ErrorState, HeaderActions, Hero, ListRow, PAGE_WITH_BAR, PhotoCard, RowDivider, Section, metaLine, useToast, type ActionBarButton } from '../../components/ds';
import { PhotoCredit } from '../../components/PhotoCredit';
import { allAwards, categoryInfo } from '../../lib/awards';
import { classOf, effectivePower } from '../../lib/classes';
import { useNow } from '../../lib/clock';
import { useCommunity, useCommunityQuery } from '../../lib/communityStore';
import { CONNECT } from '../../lib/connections';
import { publicProfile } from '../../lib/people';
import { useStore } from '../../lib/store';
import type { Build } from '../../lib/types';
import { ASPECT, SPACING } from '../../theme';
import { NotFoundState } from '../../components/Detail';
import { photoSource } from '../../lib/photoSource';

/** The build with the most to look at: a photo first, then the most power. */
function coverBuild(builds: Build[]): Build | undefined {
  return [...builds].sort((a, b) => Number(!!b.photos[0]) - Number(!!a.photos[0]) || effectivePower(b) - effectivePower(a))[0];
}

/**
 * Someone's profile, or yours (Redesign 2, 3.7; T3): a Hero from their best build, @handle and
 * the build line, then their garage and posts. The one action that fits is in the ActionBar:
 * Connect, Accept or Message (messages are only between connections); Edit profile for you.
 * Decline, cancel, remove, report and block are in the ··· menu. No level, no rep, no location.
 */
export default function UserScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const nav = useNavigation();
  const { users, builds, crews, events, votes, me } = useStore();
  const community = useCommunity();
  const toast = useToast();
  const now = useNow();
  const awards = useMemo(() => allAwards(votes, events, builds, now), [votes, events, builds, now]);
  const p = publicProfile(id, users, builds, crews, events, awards, now);
  const posts = useCommunityQuery((s) => s.feed('author', { author: id }), [id]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [menu, setMenu] = useState(false);
  const isMe = id === me;
  const state = community.stateOf(id);
  const blocked = community.blocked.has(id);

  async function act(fn: () => Promise<unknown>, done?: string) {
    setError(null);
    setBusy(true);
    try {
      await fn();
      if (done) toast({ message: done });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't do that.");
    } finally {
      setBusy(false);
    }
  }

  useLayoutEffect(() => {
    // Detail screens keep a blank title: the Hero carries the handle. Yours has no menu.
    nav.setOptions({ headerRight: p && !isMe ? () => <HeaderActions onMenu={() => setMenu(true)} /> : undefined });
  }, [nav, p?.id, isMe]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!p) return <NotFoundState what="Profile" message="This person isn't on Nightshift any more." />;
  const cover = coverBuild(p.builds);
  const handle = `@${p.handle}`;
  const coverPhoto = cover?.photos[0];

  const options: SheetOption[] = [
    ...(state === 'incoming' ? [{ label: CONNECT.decline, onPress: () => void act(() => community.run((s) => s.answerConnection(id, false))) }] : []),
    ...(state === 'outgoing' ? [{ label: CONNECT.cancel, onPress: () => void act(() => community.run((s) => s.removeConnection(id)), 'Request cancelled') }] : []),
    ...(state === 'connected' ? [{ label: CONNECT.remove, danger: true, onPress: () => void act(() => community.run((s) => s.removeConnection(id)), 'Connection removed') }] : []),
    { label: 'Report profile', onPress: () => openReport('profile', id, id, 'profile') },
    blocked
      ? { label: CONNECT.unblock, onPress: () => void act(() => community.run((s) => s.unblock(id)), 'Unblocked') }
      : { label: `Block ${handle}`, danger: true, onPress: () => openReport('block', id, id) },
    ...moderateOptions(id),
  ];

  const message = () => act(async () => router.push({ pathname: '/chat/[id]', params: { id: await community.run((s) => s.startDirect(id)) } }));
  const connect = () =>
    act(async () => {
      const r = await community.run((s) => s.requestConnection(id));
      toast({ message: r === 'connected' ? `Connected with ${handle}` : 'Request sent' });
    });

  let primary: ActionBarButton | null = null;
  let secondary: ActionBarButton | null = null;
  let status: string | null = null;
  if (isMe) secondary = { label: 'Edit profile', onPress: () => router.push('/profile') };
  else if (blocked) secondary = { label: CONNECT.unblock, busy, onPress: () => void act(() => community.run((s) => s.unblock(id)), 'Unblocked') };
  else if (state === 'connected') primary = { label: CONNECT.message, busy, onPress: () => void message() };
  else if (state === 'incoming') primary = { label: CONNECT.accept, busy, haptic: 'success', onPress: () => void act(() => community.run((s) => s.answerConnection(id, true)), `Connected with ${handle}`) };
  // The toast said "Request sent"; the bar only says what's left (C5).
  else if (state === 'outgoing') status = `Waiting for ${handle}`;
  else primary = { label: CONNECT.connect, busy, haptic: 'success', accessibilityHint: `Once ${handle} accepts, you can message each other`, onPress: () => void connect() };

  // The cover build is under the Hero; the garage shows the rest.
  const others = p.builds.filter((b) => b.id !== cover?.id);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={PAGE_WITH_BAR} showsVerticalScrollIndicator={false}>
        <Hero
          bleed
          photo={coverPhoto ? photoSource(coverPhoto) : null}
          media={cover && !coverPhoto ? <PaintedArt paint={cover.colour} vehicle={cover.kind} shape={carShape(cover)} /> : undefined}
          aspect={ASPECT.build}
          title={handle}
          classLetter={cover ? classOf(cover) : undefined}
          meta={cover ? undefined : 'No car or bike yet'}
          tag={!isMe && state === 'connected' ? { label: CONNECT.connected, tone: 'success' } : null}
          overlay={coverPhoto ? <PhotoCredit photoRef={coverPhoto} kind={cover?.kind} overlay corner="topRight" /> : null}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingTop: SPACING.xs }}>
            <Avatar {...personMark(p)} size="md" label={`${handle}'s picture`} />
            <DsText v="secondary" style={{ flex: 1 }} numberOfLines={1}>
              {isMe ? `${p.name} (you)` : p.name}
            </DsText>
          </View>
          {cover ? <BuildRow build={cover} onPress={() => openBuild(cover.id)} /> : null}
          {blocked ? <DsText v="secondary">You blocked {handle}. Their posts and messages are hidden from you.</DsText> : null}
          {error ? <ErrorState title={error} /> : null}
        </Hero>

        {others.length ? (
        <Section title={`Also in the garage (${others.length})`}>
          {
            <View style={{ gap: SPACING.md }}>
              {others.map((b) => (
                <PhotoCard
                  key={b.id}
                  kind="build"
                  photo={b.photos[0] ? photoSource(b.photos[0]) : null}
                  paint={b.colour}
                  vehicle={b.kind}
                  shape={carShape(b)}
                  title={`${b.make} ${b.model}`}
                  classLetter={classOf(b)}
                  meta={buildMeta(b)}
                  titleOnPhoto
                  overlay={b.photos[0] ? <PhotoCredit photoRef={b.photos[0]} kind={b.kind} overlay corner="topRight" /> : null}
                  onPress={() => openBuild(b.id)}
                />
              ))}
            </View>
          }
        </Section>
        ) : null}

        <Section title="Posts">
          <PostList
            posts={posts.data}
            loading={posts.loading}
            error={posts.error}
            empty={
              isMe ? (
                <EmptyState variant="inline" title="No posts yet." action={{ label: 'Post a photo', onPress: () => router.push('/post/new') }} />
              ) : (
                <EmptyState variant="inline" title={state === 'connected' ? 'No posts yet.' : 'No public posts yet.'} />
              )
            }
          />
        </Section>

        {p.trophies.length ? (
          <Section title={`Trophies (${p.trophies.length})`}>
            <View>
              {p.trophies.map((a, i) => {
                const b = builds.find((x) => x.id === a.buildId);
                const ev = events.find((e) => e.id === a.eventId);
                return (
                  <View key={a.eventId + a.category}>
                    {i ? <RowDivider inset /> : null}
                    <ListRow
                      leading={b ? { classBadge: classOf(b) } : undefined}
                      title={categoryInfo(a.category).label}
                      subtitle={metaLine([b ? buildLine(b) : null, ev?.title])}
                      onPress={ev ? () => router.push({ pathname: '/event/[id]', params: { id: ev.id } }) : undefined}
                    />
                  </View>
                );
              })}
            </View>
          </Section>
        ) : null}

        <DsText v="caption" style={{ textAlign: 'center' }}>
          Nightshift never shows where anyone lives or where they are.
        </DsText>
      </ScrollView>
      <ActionBar primary={primary} secondary={secondary} status={status} />
      <OptionsSheet visible={menu} title="Profile options" options={options} onClose={() => setMenu(false)} />
    </View>
  );
}

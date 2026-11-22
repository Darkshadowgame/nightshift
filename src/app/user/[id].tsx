import { carShape } from '../../lib/buildShape';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useLayoutEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { BuildRow, buildLine, buildMeta, mainBuild, moderateOptions, openBuild, openReport, OptionsSheet, personMark, type SheetOption } from '../../components/Community';
import { PostList } from '../../components/CommunityFeed';
import { PaintedArt } from '../../components/BuildArt';
import { useIsDemo } from '../../components/BuildBits';
import { buildPicture } from '../../lib/similarPhoto';
import { ActionBar, Avatar, DsText, EmptyState, ErrorState, HeaderActions, Hero, ListRow, PAGE_WITH_BAR, PhotoCard, RowDivider, Section, Tag, metaLine, useToast, type ActionBarButton } from '../../components/ds';
import { PhotoCredit } from '../../components/PhotoCredit';
import { StackTabBar } from '../../components/StackTabBar';
import { allAwards, categoryInfo } from '../../lib/awards';
import { classOf } from '../../lib/classes';
import { useNow } from '../../lib/clock';
import { useCommunity, useCommunityQuery } from '../../lib/communityStore';
import { CONNECT } from '../../lib/connections';
import { mutualMeets } from '../../lib/crewPage';
import { EVENT_LABELS } from '../../lib/events';
import { formatWhen, plural } from '../../lib/format';
import { publicProfile } from '../../lib/people';
import { useStore } from '../../lib/store';
import { ASPECT, EVENT_COLOURS, SPACING } from '../../theme';
import { NotFoundState } from '../../components/Detail';
import { photoSource } from '../../lib/photoSource';
import { openChat } from '../../lib/openChat';

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
  // Meets you have both checked in at: past ones only, so it never says where anyone will be.
  const both = useMemo(() => (isMe || blocked ? { count: 0, recent: [] } : mutualMeets(events, me, id, now)), [events, me, id, now, isMe, blocked]);

  async function act(fn: () => Promise<unknown>, done?: string) {
    setError(null);
    setBusy(true);
    try {
      await fn();
      // Undoing something isn't a success: no green tick (4.7, Review 19).
      if (done) toast({ message: done, tone: /cancelled|removed|unblocked/i.test(done) ? 'info' : undefined });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't do that.");
    } finally {
      setBusy(false);
    }
  }

  const demo = useIsDemo();

  useLayoutEffect(() => {
    // Detail screens keep a blank title: the Hero carries the handle. Yours has no menu.
    nav.setOptions({ headerRight: p && !isMe ? () => <HeaderActions onMenu={() => setMenu(true)} /> : undefined });
  }, [nav, p?.id, isMe]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!p) return <NotFoundState what="Profile" message="This person isn't on Slipstream any more." />;
  const cover = mainBuild(p.builds);
  const handle = `@${p.handle}`;
  const coverPic = cover ? buildPicture(cover, demo) : null;
  const coverPhoto = coverPic?.ref;

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

  // The chat takes the profile's place (and the going list's), so back goes to where you started (Review 15).
  const message = () => act(async () => openChat(await community.run((s) => s.startDirect(id)), nav.getState() as Parameters<typeof openChat>[1]));
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
  // The toast said "Request sent"; the bar says what's left and offers the one thing that helps
  // (4.3): a status with no calendar (it isn't a time) and "Cancel request" next to it.
  else if (state === 'outgoing') {
    // The demo's people accept after a moment: say so, so nobody leaves before it happens (Review 18).
    status = demo ? `Demo: ${handle} will accept in a few seconds` : `Waiting for ${handle} to accept`;
    secondary = { label: CONNECT.cancel, busy, onPress: () => void act(() => community.run((s) => s.removeConnection(id)), 'Request cancelled') };
  }
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
          leading={<Avatar {...personMark(p)} size="md" label={`${handle}'s picture`} />}
          meta={cover ? undefined : 'No car or bike yet'}
          // The tag sits next to the @handle, and the real name in the same block (Review 19 #34).
          trailing={!isMe && state === 'connected' ? <Tag label={CONNECT.connected} tone="success" /> : undefined}
          titleSub={isMe ? `${p.name} (you)` : p.name}
          overlay={coverPhoto ? <PhotoCredit photoRef={coverPhoto} kind={cover?.kind} standIn={coverPic?.standIn} overlay corner="topRight" /> : null}
        >
          {/* K3: a person is avatar + @handle (on the photo); the class badge belongs to the build row. */}
          {cover ? <BuildRow build={cover} onPress={() => openBuild(cover.id)} /> : null}
          {blocked ? <DsText v="secondary">You blocked {handle}. Their posts and messages are hidden from you.</DsText> : null}
          {error ? <ErrorState title={error} /> : null}
        </Hero>

        {others.length ? (
        <Section title={`Also in the garage (${others.length})`}>
          {
            <View style={{ gap: SPACING.md }}>
              {others.map((b) => {
                const pic = buildPicture(b, demo);
                return (
                <PhotoCard
                  key={b.id}
                  kind="build"
                  photo={pic ? photoSource(pic.ref) : null}
                  paint={b.colour}
                  vehicle={b.kind}
                  shape={carShape(b)}
                  title={`${b.make} ${b.model}`}
                  classLetter={classOf(b)}
                  meta={buildMeta(b)}
                  titleOnPhoto
                  overlay={pic ? <PhotoCredit photoRef={pic.ref} kind={b.kind} standIn={pic.standIn} overlay corner="topRight" /> : null}
                  onPress={() => openBuild(b.id)}
                />
                );
              })}
            </View>
          }
        </Section>
        ) : null}

        {both.count > 0 ? (
          <Section title={`Meets you've both been to (${both.count})`}>
            <View>
              {both.recent.map((e, i) => (
                <View key={e.id}>
                  {i ? <RowDivider inset /> : null}
                  <ListRow
                    leading={{ pin: e.type, colour: EVENT_COLOURS[e.type] }}
                    title={e.title}
                    subtitle={metaLine([EVENT_LABELS[e.type], formatWhen(e.startsAt, now)])}
                    onPress={() => router.push({ pathname: '/event/[id]', params: { id: e.id } })}
                  />
                </View>
              ))}
            </View>
            {both.count > both.recent.length ? <DsText v="caption">{`and ${plural(both.count - both.recent.length, 'more meet')}`}</DsText> : null}
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
          Slipstream never shows where anyone lives or where they are.
        </DsText>
      </ScrollView>
      {/* A tab is one tap away on a profile, however deep it was opened (Review 19 #35). */}
      <ActionBar primary={primary} secondary={secondary} status={status} statusIcon={null} footer={<StackTabBar />} />
      <OptionsSheet visible={menu} title="Profile options" options={options} onClose={() => setMenu(false)} />
    </View>
  );
}

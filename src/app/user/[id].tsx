import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useLayoutEffect, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { BuildArt } from '../../components/BuildArt';
import { Avatar, openReport, OptionsSheet, type SheetOption } from '../../components/Community';
import { PostList } from '../../components/CommunityFeed';
import { Trophy } from '../../components/Cover';
import { CrewCard } from '../../components/CrewCard';
import { LevelTag, useRep } from '../../components/Rep';
import { Button, Card, ClassBadge, EmptyState, HeaderAction, InlineError, LegendTag, NotFound, Row, SampleTag, Section, Stat, Txt } from '../../components/ui';
import { SAMPLE_PEOPLE } from '../../data/seed';
import { allAwards, categoryInfo } from '../../lib/awards';
import { classOf, effectivePower } from '../../lib/classes';
import { useNow } from '../../lib/clock';
import { useCommunity, useCommunityQuery } from '../../lib/communityStore';
import { CONNECT, connectHint, connectLabel } from '../../lib/connections';
import { plural } from '../../lib/format';
import { publicProfile } from '../../lib/people';
import { photoUri } from '../../lib/photos';
import { useStore } from '../../lib/store';
import type { Build } from '../../lib/types';
import { BRAND, C, F, RADIUS, SURFACE, TYPE } from '../../theme';

/** The build with the most to look at: a photo first, then the most power. */
function coverBuild(builds: Build[]): Build | undefined {
  return [...builds].sort((a, b) => Number(!!b.photos[0]) - Number(!!a.photos[0]) || effectivePower(b) - effectivePower(a))[0];
}

/**
 * Someone's profile, like a social profile: cover from their best build, the
 * garage, posts, rep, crew and trophies, with Connect and Message. Never any
 * location: no home, no distance, no upcoming events.
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
  const [menu, setMenu] = useState<SheetOption[] | null>(null);
  const isMe = id === me;
  const state = community.stateOf(id);
  const blocked = community.blocked.has(id);

  useLayoutEffect(() => {
    if (!p || isMe) return;
    nav.setOptions({
      headerRight: () => (
        <HeaderAction
          label="···"
          accessibilityLabel="Profile options"
          onPress={() =>
            setMenu([
              ...(state === 'connected' ? [{ label: CONNECT.remove, danger: true, onPress: () => void act(() => community.run((s) => s.removeConnection(id))) }] : []),
              { label: 'Report profile', onPress: () => openReport('profile', id, id, 'profile') },
              blocked
                ? { label: CONNECT.unblock, onPress: () => void act(() => community.run((s) => s.unblock(id))) }
                : { label: `Block @${p.handle}`, danger: true, onPress: () => openReport('block', id, id) },
            ])
          }
        />
      ),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nav, p?.handle, isMe, state, blocked]);

  // The header stays blank, like every detail screen: the cover carries the handle.
  if (!p) return <NotFound what="Profile" message="This person isn't on Nightshift any more." />;
  const cover = coverBuild(p.builds);

  async function act(fn: () => Promise<unknown>) {
    setError(null);
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not do that.');
    } finally {
      setBusy(false);
    }
  }

  const primary = () => {
    if (state === 'connected') return act(async () => router.push({ pathname: '/chat/[id]', params: { id: await community.run((s) => s.startDirect(id)) } }));
    if (state === 'incoming') return act(() => community.run((s) => s.answerConnection(id, true)));
    if (state === 'outgoing') return act(() => community.run((s) => s.removeConnection(id)));
    return act(() => community.run((s) => s.requestConnection(id)));
  };

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={st.cover}>
        {cover?.photos[0] ? (
          <Image source={{ uri: photoUri(cover.photos[0]) }} style={StyleSheet.absoluteFill} resizeMode="cover" accessibilityIgnoresInvertColors />
        ) : cover ? (
          <BuildArt kind={cover.kind} colour={cover.colour} height={200} />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: C.tarmac }]} />
        )}
        <View style={st.coverShade} />
      </View>

      <View style={{ paddingHorizontal: 16, marginTop: -44, gap: 20 }}>
        <View style={{ gap: 10 }}>
          <Row gap={12} style={{ alignItems: 'flex-end', flexWrap: 'nowrap' }}>
            <Avatar user={p} size={76} />
            <View style={{ flex: 1, gap: 4, paddingBottom: 4 }}>
              <Row gap={6}>
                <LevelTag level={rep.level.level} size="lg" />
                {p.legend ? <LegendTag /> : null}
                {SAMPLE_PEOPLE.includes(p.id) ? <SampleTag /> : null}
              </Row>
            </View>
          </Row>
          <View>
            <Txt v="h1" style={{ textTransform: 'none' }} accessibilityRole="header">@{p.handle}</Txt>
            <Txt>{p.name}{isMe ? ' (you)' : ''} <Txt v="muted">· {p.region}</Txt></Txt>
          </View>
          <Row style={{ flexWrap: 'nowrap' }}>
            <Stat value={String(p.builds.length)} label={p.builds.length === 1 ? 'Build' : 'Builds'} />
            <Stat value={String(p.meetsAttended)} label="Attended" />
            <Stat value={String(p.hosted)} label="Hosted" />
            <Stat value={rep.ledger.total.toLocaleString('en-GB')} label="Rep" colour={BRAND} />
          </Row>

          {isMe ? (
            <Button label="Edit profile" kind="secondary" onPress={() => router.push('/profile')} />
          ) : blocked ? (
            <Card>
              <Txt v="muted">You blocked @{p.handle}. Their posts and messages are hidden from you.</Txt>
              <Button label={CONNECT.unblock} kind="secondary" size="sm" busy={busy} onPress={() => act(() => community.run((s) => s.unblock(id)))} />
            </Card>
          ) : (
            <View style={{ gap: 6 }}>
              <Row style={{ flexWrap: 'nowrap' }}>
                <Button
                  label={state === 'connected' ? CONNECT.message : state === 'outgoing' ? CONNECT.requested : connectLabel(state)}
                  kind={state === 'outgoing' ? 'secondary' : 'primary'}
                  onPress={primary}
                  busy={busy}
                  style={{ flex: 1 }}
                  accessibilityHint={state === 'outgoing' ? 'Tap to cancel the request' : undefined}
                />
                {state === 'incoming' ? (
                  <Button label={CONNECT.decline} kind="secondary" onPress={() => act(() => community.run((s) => s.answerConnection(id, false)))} style={{ flex: 1 }} />
                ) : null}
              </Row>
              <Txt v="caption">{connectHint(state, p.handle)}{state === 'outgoing' ? ' Tap Requested to cancel.' : ''}</Txt>
            </View>
          )}
          <InlineError message={error} />
        </View>

        <Section title={`Garage (${p.builds.length})`}>
          {p.builds.length === 0 ? <Txt v="muted">No builds yet.</Txt> : null}
          <View style={st.grid}>
            {p.builds.map((b) => (
              <Pressable
                key={b.id}
                onPress={() => router.push({ pathname: '/build/[id]', params: { id: b.id } })}
                accessibilityRole="button"
                accessibilityLabel={`${b.make} ${b.model}, class ${classOf(b)}, ${Math.round(effectivePower(b))} bhp`}
                style={({ pressed }) => [st.tile, pressed && { opacity: 0.85 }]}
              >
                {b.photos[0] ? (
                  <Image source={{ uri: photoUri(b.photos[0]) }} style={{ height: 110, backgroundColor: C.kerb }} resizeMode="cover" accessibilityIgnoresInvertColors />
                ) : (
                  <BuildArt kind={b.kind} colour={b.colour} height={110} />
                )}
                <View style={{ position: 'absolute', left: 6, top: 6 }}>
                  <ClassBadge letter={classOf(b)} size="sm" />
                </View>
                <View style={{ padding: 8, gap: 2 }}>
                  <Txt numberOfLines={1} style={{ fontFamily: F.bodyBold, fontSize: TYPE.muted }}>{b.make} {b.model}</Txt>
                  <Txt v="mono" numberOfLines={1}>{Math.round(effectivePower(b))} BHP · {b.mods.length} MODS</Txt>
                </View>
              </Pressable>
            ))}
          </View>
        </Section>

        <Section title="Posts">
          <PostList
            posts={posts.data}
            loading={posts.loading}
            error={posts.error}
            empty={
              isMe ? (
                <EmptyState glyph="post" title="No posts yet" body="Share your build, a drive or a good spot." action={{ label: 'New post', onPress: () => router.push('/post/new') }} />
              ) : (
                <Txt v="muted">{state === 'connected' ? 'No posts yet.' : 'No public posts yet. Connect to see posts for connections.'}</Txt>
              )
            }
          />
        </Section>

        <Section title="Crew">
          {p.crew ? <CrewCard crew={p.crew} /> : <Txt v="muted">Not in a crew.</Txt>}
        </Section>

        {p.trophies.length ? (
          <Section title={`Trophies (${p.trophies.length})`}>
            <Card>
              {p.trophies.map((a) => {
                const b = builds.find((x) => x.id === a.buildId);
                const ev = events.find((e) => e.id === a.eventId);
                return (
                  <Row key={a.eventId + a.category} style={{ flexWrap: 'nowrap' }} gap={10}>
                    <Trophy colour={categoryInfo(a.category).cover ? BRAND : C.fog} size={28} />
                    <View style={{ flex: 1 }}>
                      <Txt>{categoryInfo(a.category).label}</Txt>
                      <Txt v="muted" numberOfLines={1}>{b?.make} {b?.model} · {ev?.title}</Txt>
                    </View>
                    <Txt v="mono" style={{ color: BRAND }}>+{categoryInfo(a.category).rep}</Txt>
                  </Row>
                );
              })}
            </Card>
          </Section>
        ) : null}

        <Txt v="caption" style={{ textAlign: 'center' }}>
          {plural(rep.ledger.total, 'rep point')}. Nightshift never shows where anyone lives or where they are.
        </Txt>
      </View>
      <OptionsSheet visible={!!menu} options={menu ?? []} onClose={() => setMenu(null)} />
    </ScrollView>
  );
}

const st = StyleSheet.create({
  cover: { height: 200, backgroundColor: C.tarmac, overflow: 'hidden' },
  coverShade: { ...StyleSheet.absoluteFill as object, backgroundColor: SURFACE.scrim, top: 120 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: { width: '48%', flexGrow: 1, maxWidth: '49%', backgroundColor: C.tarmac, borderRadius: RADIUS.card, borderWidth: 1, borderColor: C.kerb, overflow: 'hidden' },
});

import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { canVote, categoriesFor, categoryInfo, eligibleFor, results, votingCloses, type AwardCategory } from '../lib/awards';
import { carShape } from '../lib/buildShape';
import { classOf } from '../lib/classes';
import { useNow } from '../lib/clock';
import { photoSource } from '../lib/photoSource';
import { useStore } from '../lib/store';
import type { NightEvent } from '../lib/types';
import { COLOR, SPACING } from '../theme';
import { bhpLine } from './BringPicker';
import { Cover } from './Cover';
import { Button, DsText, ErrorState, ListRow, PhotoCard, RowDivider, Section, Sheet, displayHandle, useToast } from './ds';
import { RevealIn } from './motion';
import { PhotoCredit } from './PhotoCredit';

/**
 * Trophies once voting has closed (Redesign 2, 3.5): the covers flip in the first time you see
 * them (the fourth motion moment), then one row per trophy. Three trophies only: Best in show,
 * Best car, Best bike.
 */
export function TrophiesSection({ event }: { event: NightEvent }) {
  const { builds, users, votes, me } = useStore();
  const now = useNow();
  if (event.cancelled || now < votingCloses(event)) return null;
  const awards = results(votes, event, builds, now);
  const handle = (uid: string) => (uid === me ? 'You' : displayHandle(users.find((u) => u.id === uid)?.handle ?? 'unknown'));
  return (
    <Section title="Trophies">
      {awards.length === 0 ? <DsText v="secondary">Not enough votes for any trophies at this one.</DsText> : null}
      {awards
        .filter((a) => categoryInfo(a.category).cover)
        .slice(0, 1)
        .map((a) => {
          const b = builds.find((x) => x.id === a.buildId);
          if (!b) return null;
          return (
            <RevealIn key={a.category} id={`${event.id}:${a.category}`} sparks>
              <Cover award={a} build={b} owner={users.find((u) => u.id === a.ownerId)} event={event} width={240} />
            </RevealIn>
          );
        })}
      <View>
        {awards.map((a, i) => {
          const b = builds.find((x) => x.id === a.buildId);
          const info = categoryInfo(a.category);
          return (
            <View key={a.category}>
              {i > 0 ? <RowDivider inset /> : null}
              <ListRow
                leading={{ icon: 'success', colour: COLOR.state.success }}
                title={info.label}
                subtitle={`${handle(a.ownerId)} · ${b ? `${b.make} ${b.model}` : 'a build'}`}
                meta={`${a.votes} votes`}
                onPress={() => router.push({ pathname: '/user/[id]', params: { id: a.ownerId } })}
                accessibilityLabel={`${info.label}: ${handle(a.ownerId)}, ${b?.make ?? ''} ${b?.model ?? ''}, ${a.votes} votes`}
              />
            </View>
          );
        })}
      </View>
    </Section>
  );
}

/** The trophies you can vote on at this event, in order (Best in show first). Empty when you can't vote. */
export function voteCategories(event: NightEvent, builds: Parameters<typeof categoriesFor>[1], me: string, now: Date): AwardCategory[] {
  if (!canVote(event, me, now).ok) return [];
  return categoriesFor(event, builds).filter((c) => eligibleFor(c, event, builds).some((b) => b.ownerId !== me));
}

/**
 * Vote (Redesign 2, 3.5): a Sheet, one trophy per page, the builds that turned up as photo cards in
 * two columns. Tap to vote ("Voted" toast), then the next trophy. Never your own build.
 */
export function VoteSheet({ event, visible, onClose, onVoted }: { event: NightEvent; visible: boolean; onClose: () => void; onVoted?: () => void }) {
  const { builds, users, votes, me, vote } = useStore();
  const now = useNow();
  const toast = useToast();
  const cats = voteCategories(event, builds, me, now);
  const [page, setPage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (visible) {
      // Open on the first trophy you haven't voted on yet.
      const first = cats.findIndex((c) => !votes.some((v) => v.eventId === event.id && v.voterId === me && v.category === c));
      setPage(Math.max(0, first));
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);
  const cat = cats[Math.min(page, cats.length - 1)];
  if (!cat) return null;
  const label = categoryInfo(cat).label;
  const options = eligibleFor(cat, event, builds).filter((b) => b.ownerId !== me);
  const myVote = votes.find((v) => v.eventId === event.id && v.voterId === me && v.category === cat)?.buildId;
  const last = page >= cats.length - 1;

  async function pick(buildId: string) {
    setError(null);
    try {
      await vote(event.id, cat, buildId);
      toast({ message: `Voted for ${label.toLowerCase()}` });
      onVoted?.();
      if (last) onClose();
      else setPage((p) => p + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't count that vote.");
    }
  }

  return (
    <Sheet visible={visible} title={cats.length > 1 ? `${label} · ${page + 1} of ${cats.length}` : label} onClose={onClose}>
      <View style={{ gap: SPACING.md }}>
        <DsText v="secondary">Tap the build you think wins. You can change it until voting closes.</DsText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm }}>
          {options.map((b) => {
            const owner = users.find((u) => u.id === b.ownerId);
            return (
              <View key={b.id} style={{ width: '48%', flexGrow: 1 }}>
                <PhotoCard
                  kind="build"
                  photo={b.photos[0] ? photoSource(b.photos[0]) : null}
                  paint={b.colour}
                  vehicle={b.kind}
                  shape={carShape(b)}
                  classLetter={classOf(b)}
                  title={`${b.make} ${b.model}`}
                  meta={`${displayHandle(owner?.handle ?? 'unknown')} · ${bhpLine(b)}`}
                  tag={myVote === b.id ? { label: 'Your vote', tone: 'success' } : null}
                  overlay={<PhotoCredit photoRef={b.photos[0]} kind={b.kind} overlay />}
                  onPress={() => pick(b.id)}
                  accessibilityHint={`Votes for ${label.toLowerCase()}`}
                />
              </View>
            );
          })}
        </View>
        {error ? <ErrorState title={error} /> : null}
        {cats.length > 1 ? (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            {page > 0 ? <Button tier="tertiary" size="sm" label="Back a trophy" onPress={() => setPage((p) => p - 1)} /> : <View />}
            {!last ? <Button tier="tertiary" size="sm" label="Skip this one" onPress={() => setPage((p) => p + 1)} /> : null}
          </View>
        ) : null}
      </View>
    </Sheet>
  );
}

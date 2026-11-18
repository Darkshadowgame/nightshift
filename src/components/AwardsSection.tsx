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
import { ChoiceGroup, DsText, ErrorState, ListRow, PhotoCard, RowDivider, Section, Sheet, displayHandle, useToast } from './ds';
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
 * Vote (Redesign 2, 3.5; Review 11): a Sheet for one trophy, opened at the trophy you tapped (the
 * ActionBar's Vote opens the first you haven't voted on). The trophies sit on top as one choice, so
 * "best car" is one tap away whichever opened. The builds that turned up are photo cards in two
 * columns; tap one to vote: the sheet closes and a toast says what you voted for. Never your own build.
 */
export function VoteSheet({ event, category, onClose }: { event: NightEvent; category: AwardCategory | null; onClose: () => void }) {
  const { builds, users, votes, me, vote } = useStore();
  const now = useNow();
  const toast = useToast();
  const cats = voteCategories(event, builds, me, now);
  const [shown, setShown] = useState<AwardCategory | null>(category);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (category) {
      setShown(category);
      setError(null);
    }
  }, [category]);
  const cat = shown && cats.includes(shown) ? shown : cats[0];
  if (!cat) return null;
  const label = categoryInfo(cat).label;
  const options = eligibleFor(cat, event, builds).filter((b) => b.ownerId !== me);
  const myVote = votes.find((v) => v.eventId === event.id && v.voterId === me && v.category === cat)?.buildId;

  async function pick(buildId: string) {
    setError(null);
    try {
      await vote(event.id, cat, buildId);
      const b = builds.find((x) => x.id === buildId);
      onClose();
      toast({ message: `Voted for ${b ? `${b.make} ${b.model}` : 'that build'}: ${label.toLowerCase()}` });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't count that vote.");
    }
  }

  return (
    <Sheet visible={!!category} title={`Vote: ${label}`} onClose={onClose}>
      <View style={{ gap: SPACING.md }}>
        {cats.length > 1 ? (
          <ChoiceGroup label="" options={cats.map((c) => ({ key: c, label: categoryInfo(c).label }))} value={cat} onChange={(c) => setShown(c)} />
        ) : null}
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
      </View>
    </Sheet>
  );
}

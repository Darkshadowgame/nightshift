import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { canVote, categoriesFor, categoryInfo, eligibleFor, previewResults, results, votingCloses, type AwardCategory } from '../lib/awards';
import { untilText } from '../lib/eventAction';
import { carShape } from '../lib/buildShape';
import { classOf } from '../lib/classes';
import { useNow } from '../lib/clock';
import { photoSource } from '../lib/photoSource';
import { useStore } from '../lib/store';
import type { NightEvent } from '../lib/types';
import { COLOR, MOTION, SPACING } from '../theme';
import { bhpLine } from './BringPicker';
import { Cover } from './Cover';
import { ActionBar, DsText, ErrorState, ListRow, PhotoCard, RowDivider, Section, SegmentedControl, Sheet, ToastView, displayHandle, useToast } from './ds';
import { RevealIn } from './motion';
import { PhotoCredit } from './PhotoCredit';

/**
 * Trophies once voting has closed (Redesign 2, 3.5): the covers flip in the first time you see
 * them (the fourth motion moment), then one row per trophy. Three trophies only: Best in show,
 * Best car, Best bike.
 *
 * `preview` (the demo only, Review 12 L4): right after you vote, the results as they'd look if
 * voting closed now, with the same reveal, so the trophy moment happens on the demo night.
 */
export function TrophiesSection({ event, preview }: { event: NightEvent; preview?: boolean }) {
  const { builds, users, votes, me } = useStore();
  const now = useNow();
  if (event.cancelled || (!preview && now < votingCloses(event))) return null;
  const awards = preview ? previewResults(votes, event, builds, me, now) : results(votes, event, builds, now);
  if (preview && awards.length === 0) return null;
  const handle = (uid: string) => (uid === me ? 'You' : displayHandle(users.find((u) => u.id === uid)?.handle ?? 'unknown'));
  return (
    <Section title="Trophies">
      {preview ? <DsText v="secondary">{`Demo: the results now. For real, they show ${untilText(votingCloses(event), now)}.`}</DsText> : null}
      {awards.length === 0 ? <DsText v="secondary">Not enough votes for any trophies at this one.</DsText> : null}
      {awards
        .filter((a) => categoryInfo(a.category).cover)
        .slice(0, 1)
        .map((a) => {
          const b = builds.find((x) => x.id === a.buildId);
          if (!b) return null;
          return (
            <RevealIn key={a.category} id={`${event.id}:${preview ? 'preview:' : ''}${a.category}`} sparks>
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

/** "Hyundai i30 N" with the last short word kept on its line ("i30 N", never "i30" / "N"; "YZF-R6", never "YZF-" / "R6"). */
export function buildTitle(make: string, model: string): string {
  return `${make} ${model}`.replace(/ (\S{1,3})$/, '\u00a0$1').replace(/-/g, '\u2011');
}

/**
 * Vote (Redesign 2, 3.5; Reviews 11 and 12): a Sheet, opened at the trophy you tapped (the
 * ActionBar's Vote opens the first you haven't voted on). The trophies sit on top as the one
 * SegmentedControl (it switches the view below, 4.4). The builds that turned up are photo cards in
 * two columns; tap one to vote: a toast says what you voted for and the sheet moves on to the next
 * trophy you haven't voted on. It closes after the last one, or on Done. Never your own build.
 * `onClose(voted)`: whether a vote was cast while it was open.
 */
export function VoteSheet({ event, category, onClose }: { event: NightEvent; category: AwardCategory | null; onClose: (voted: boolean) => void }) {
  const { builds, users, votes, me, vote } = useStore();
  const now = useNow();
  const toast = useToast();
  const cats = voteCategories(event, builds, me, now);
  const [shown, setShown] = useState<AwardCategory | null>(category);
  const [error, setError] = useState<string | null>(null);
  /** The in-sheet toast (the app's toast sits under the sheet while it's open). */
  const [flash, setFlash] = useState<{ id: number; message: string } | null>(null);
  const flashes = useRef(0);
  const cast = useRef(false);
  useEffect(() => {
    if (category) {
      setShown(category);
      setError(null);
      setFlash(null);
      cast.current = false;
    }
  }, [category]);
  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash((f) => (f?.id === flash.id ? null : f)), MOTION.toast);
    return () => clearTimeout(t);
  }, [flash]);
  const cat = shown && cats.includes(shown) ? shown : cats[0];
  if (!cat) return null;
  const label = categoryInfo(cat).label;
  const options = eligibleFor(cat, event, builds).filter((b) => b.ownerId !== me);
  const myVote = votes.find((v) => v.eventId === event.id && v.voterId === me && v.category === cat)?.buildId;
  const close = () => onClose(cast.current);

  async function pick(buildId: string) {
    setError(null);
    try {
      await vote(event.id, cat, buildId);
      cast.current = true;
      const b = builds.find((x) => x.id === buildId);
      const message = `Voted for ${b ? `${b.make} ${b.model}` : 'that build'}: ${label.toLowerCase()}`;
      // On to the next trophy you haven't voted on (after this one, then from the top).
      const done = (c: AwardCategory) => c === cat || votes.some((v) => v.eventId === event.id && v.voterId === me && v.category === c);
      const at = cats.indexOf(cat);
      const next = [...cats.slice(at + 1), ...cats.slice(0, at)].find((c) => !done(c));
      if (next) {
        setShown(next);
        setFlash({ id: ++flashes.current, message });
      } else {
        onClose(true);
        toast({ message });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't count that vote.");
    }
  }

  return (
    <Sheet visible={!!category} title={`Vote: ${label}`} onClose={close}>
      <View style={{ gap: SPACING.md }}>
        {cats.length > 1 ? (
          <SegmentedControl accessibilityLabel="Trophy" options={cats.map((c) => ({ key: c, label: categoryInfo(c).label }))} value={cat} onChange={(c) => setShown(c)} />
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
                  title={buildTitle(b.make, b.model)}
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
      {flash ? (
        <ActionBar>
          <Animated.View key={flash.id} entering={FadeInUp.duration(MOTION.base)}>
            <ToastView message={flash.message} />
          </Animated.View>
        </ActionBar>
      ) : null}
    </Sheet>
  );
}

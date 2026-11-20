import { router } from 'expo-router';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { canVote, categoriesFor, categoryInfo, eligibleFor, previewResults, results, votingCloses, type AwardCategory } from '../lib/awards';
import { carShape } from '../lib/buildShape';
import { classOf } from '../lib/classes';
import { useNow } from '../lib/clock';
import { photoSource } from '../lib/photoSource';
import { buildPicture } from '../lib/similarPhoto';
import { plural } from '../lib/format';
import { useStore } from '../lib/store';
import type { NightEvent } from '../lib/types';
import { COLOR, MOTION, SPACING } from '../theme';
import { bhpLine } from './BringPicker';
import { Cover } from './Cover';
import { ActionBar, Button, DsText, ErrorState, ListRow, PhotoCard, RowDivider, Section, Sheet, ToastView, displayHandle, useToast } from './ds';
import { RevealIn } from './motion';
import { PhotoCredit } from './PhotoCredit';

/**
 * Trophies once voting has closed (Redesign 2, 3.5): the covers flip in the first time you see
 * them (the fourth motion moment), then one row per trophy. Three trophies only, in one order: Best car,
 * Best bike, Best in show.
 *
 * `preview` (the demo only; owner decision, Review 19): each trophy you vote in shows its result as
 * soon as the vote sheet closes, with the same reveal, so the trophy moment happens inside task 6
 * with no extra taps. Under "Demo: how Best car went", and only for the trophies you voted in: a
 * result you had no part in never looks decided (Review 13). The trophy you voted in last is the one
 * on the cover, so each new vote plays its own reveal; the others stay open to vote (`progress`:
 * "2 more to vote"). Real accounts get the results at the real time.
 */
export function TrophiesSection({ event, preview, progress, delay = 0 }: { event: NightEvent; preview?: boolean; progress?: ReactNode; /** ms before the cover rises (after the page scrolls to it). */ delay?: number }) {
  const { builds, users, votes, me } = useStore();
  const now = useNow();
  if (event.cancelled || (!preview && now < votingCloses(event))) return null;
  const mine = (c: AwardCategory) => votes.some((v) => v.eventId === event.id && v.voterId === me && v.category === c);
  // Newest vote first in the demo, so the trophy you just voted in is the one that flips in.
  const votedAt = (c: AwardCategory) => votes.findIndex((v) => v.eventId === event.id && v.voterId === me && v.category === c);
  const awards = preview
    ? previewResults(votes, event, builds, me, now)
        .filter((a) => mine(a.category))
        .sort((a, b) => votedAt(b.category) - votedAt(a.category))
    : results(votes, event, builds, now);
  if (preview && awards.length === 0) return null;
  const handle = (uid: string) => (uid === me ? 'You' : displayHandle(users.find((u) => u.id === uid)?.handle ?? 'unknown'));
  // The winner is said once (Review 15 decision 2): the cover's trophy has no row as well.
  const onCover = awards.filter((a) => categoryInfo(a.category).cover && builds.some((b) => b.id === a.buildId)).slice(0, 1);
  const rows = awards.filter((a) => !onCover.includes(a));
  return (
    // With the vote count in the title (Review 20 gap 26), so the result reads as everyone's votes, not just yours.
    <Section title={preview ? (awards.length === 1 ? `Demo: how ${categoryInfo(awards[0].category).label} went · ${plural(awards[0].votes, 'vote')}` : 'Demo: how your trophies went') : 'Trophies'}>
      {awards.length === 0 ? <DsText v="secondary">Not enough votes for any trophies at this one.</DsText> : null}
      {onCover.map((a) => {
          const b = builds.find((x) => x.id === a.buildId);
          if (!b) return null;
          return (
            <RevealIn key={a.category} id={`${event.id}:${preview ? 'preview:' : ''}${a.category}`} sparks delay={delay}>
              <Cover award={a} build={b} owner={users.find((u) => u.id === a.ownerId)} event={event} width={240} />
            </RevealIn>
          );
        })}
      {progress}
      <View>
        {rows.map((a, i) => {
          const b = builds.find((x) => x.id === a.buildId);
          const info = categoryInfo(a.category);
          return (
            <View key={a.category}>
              {i > 0 ? <RowDivider inset /> : null}
              <ListRow
                leading={{ icon: 'success', colour: COLOR.state.success }}
                title={info.label}
                // A build is always ClassBadge + name + bhp (K3, Review 17), the owner and votes under it.
                build={b ? { letter: classOf(b), name: `${b.make} ${b.model}`, power: bhpLine(b) } : undefined}
                subtitle={b ? undefined : 'a build'}
                meta={`${handle(a.ownerId)} · ${preview ? `${a.votes} votes, yours included` : `${a.votes} votes`}`}
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

/**
 * Which trophies still need your vote (Review 15 decision 2; Review 19): "2 more to vote", with the
 * next one under it, tap to vote in it. Nothing once every trophy has your vote, or before the first.
 */
export function VoteProgress({ cats, voted, onVote }: { cats: readonly AwardCategory[]; voted: (c: AwardCategory) => boolean; onVote: (c: AwardCategory) => void }) {
  const done = cats.filter(voted).length;
  const next = cats.find((c) => !voted(c));
  if (!next || done === 0) return null;
  return (
    <ListRow
      leading={{ icon: 'plus', colour: COLOR.text.secondary }}
      title={`${cats.length - done} more to vote`}
      subtitle={`${categoryInfo(next).label} next`}
      onPress={() => onVote(next)}
      accessibilityHint={`Vote for ${categoryInfo(next).label.toLowerCase()}`}
    />
  );
}

/** The trophies you can vote on at this event, in order (Best car, Best bike, then Best in show). Empty when you can't vote. */
export function voteCategories(event: NightEvent, builds: Parameters<typeof categoriesFor>[1], me: string, now: Date): AwardCategory[] {
  if (!canVote(event, me, now).ok) return [];
  return categoriesFor(event, builds).filter((c) => eligibleFor(c, event, builds).some((b) => b.ownerId !== me));
}

/** "Hyundai i30 N" with the last short word kept on its line ("i30 N", never "i30" / "N"; "YZF-R6", never "YZF-" / "R6"). */
export function buildTitle(make: string, model: string): string {
  return `${make} ${model}`.replace(/ (\S{1,3})$/, '\u00a0$1').replace(/-/g, '\u2011');
}

/**
 * Vote (Redesign 2, 3.5; Reviews 11 to 14): a Sheet with one trophy, the one you tapped (the
 * ActionBar's Vote opens the first you haven't voted on). The builds that turned up are photo
 * cards, one per row so a long name wraps whole at any text size; tap one to vote. Your pick gets
 * "Your vote" and a one-line toast says what you voted for. While another trophy is left to vote
 * in, a clear "Next: Best car" button takes you there; the sheet never moves on by itself (Review
 * 14). After the last one it closes. Done closes it any time. Never your own build.
 * `onClose(voted, done)`: whether a vote was cast while it was open, and whether it closed with the
 * header Done (you're done voting) rather than a tap outside.
 */
export function VoteSheet({ event, category, onClose }: { event: NightEvent; category: AwardCategory | null; /** `allVoted`: this vote was your last trophy (the demo's results then show). Done only closes. */ onClose: (voted: boolean, allVoted?: boolean) => void }) {
  const { builds, users, votes, me, vote, backend } = useStore();
  const demo = backend === 'local';
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
  const votedIn = (c: AwardCategory) => votes.some((v) => v.eventId === event.id && v.voterId === me && v.category === c);
  // The next trophy you haven't voted in: after this one, then from the top.
  const at = cats.indexOf(cat);
  const next = [...cats.slice(at + 1), ...cats.slice(0, at)].find((c) => !votedIn(c));
  const close = () => onClose(cast.current);

  async function pick(buildId: string) {
    setError(null);
    try {
      await vote(event.id, cat, buildId);
      cast.current = true;
      const b = builds.find((x) => x.id === buildId);
      const name = b ? `${b.make} ${b.model}` : 'that build';
      if (next) setFlash({ id: ++flashes.current, message: `Voted for ${name}` });
      else {
        onClose(true, true);
        toast({ message: `Voted for ${name}` });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't count that vote.");
    }
  }

  return (
    <Sheet visible={!!category} title={`Vote: ${label}`} onClose={close}>
      <View style={{ gap: SPACING.md }}>
        <DsText v="secondary">Tap the build you think wins.</DsText>
        <View style={{ gap: SPACING.sm }}>
          {options.map((b) => {
            const owner = users.find((u) => u.id === b.ownerId);
            const pic = buildPicture(b, demo);
            return (
              <View key={b.id}>
                <PhotoCard
                  kind="build"
                  size="sm"
                  photo={pic ? photoSource(pic.ref) : null}
                  paint={b.colour}
                  vehicle={b.kind}
                  shape={carShape(b)}
                  classLetter={classOf(b)}
                  title={buildTitle(b.make, b.model)}
                  meta={`${displayHandle(owner?.handle ?? 'unknown')} · ${bhpLine(b)}`}
                  // Under the name, not a tag beside it: the name keeps the row's width (1.3x text).
                  detail={myVote === b.id ? '✓ Your vote' : undefined}
                  selected={myVote === b.id}
                  overlay={<PhotoCredit photoRef={pic?.ref} kind={b.kind} standIn={pic?.standIn} overlay />}
                  onPress={() => pick(b.id)}
                  accessibilityHint={`Votes for ${label.toLowerCase()}`}
                />
              </View>
            );
          })}
        </View>
        {error ? <ErrorState title={error} /> : null}
      </View>
      {flash || next ? (
        <ActionBar>
          {flash ? (
            <Animated.View key={flash.id} entering={FadeInUp.duration(MOTION.base)}>
              <ToastView message={flash.message} />
            </Animated.View>
          ) : null}
          {next ? (
            <Button
              tier={myVote ? 'primary' : 'secondary'}
              size="md"
              block
              label={`Next: ${categoryInfo(next).label}`}
              onPress={() => {
                setFlash(null);
                setShown(next);
              }}
            />
          ) : null}
        </ActionBar>
      ) : null}
    </Sheet>
  );
}

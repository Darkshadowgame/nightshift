import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { allAwards, canVote, categoriesFor, DEMO_TROPHIES, categoryInfo, eligibleFor, nominees, results, votingCloses, type AwardCategory } from '../lib/awards';
import { carShape } from '../lib/buildShape';
import { photoSource } from '../lib/photoSource';
import { classOf } from '../lib/classes';
import { formatRelative } from '../lib/format';
import { useStore } from '../lib/store';
import { useNow } from '../lib/clock';
import type { NightEvent } from '../lib/types';
import { COLOR, RADII, SPACING } from '../theme';
import { Cover, Trophy } from './Cover';
import { Callout } from './Detail';
import { buildMeta } from './Community';
import { Button, BuildThumb, ClassBadge, DsText, EmptyState, ErrorState, ListRow, Press, RowDivider, Section, Tag, displayHandle } from './ds';
import { PhotoCredit } from './PhotoCredit';
import { RevealIn } from './motion';
import { DynoBadge } from './DynoBadge';

/**
 * Votes and trophies, the end of the loop: vote for the builds that turned up while it's open,
 * then the trophies. `expanded` opens the voting (the event's primary "Vote" does that).
 */
export function AwardsSection({ event, expanded, onExpand }: { event: NightEvent; expanded?: boolean; onExpand?: () => void }) {
  const { builds, users, votes, me, vote, events, backend } = useStore();
  /** Voted trophies fold to one line (REVIEW-8: 7 trophies of the same cards was a long scroll); tap Change to reopen. */
  const [changing, setChanging] = useState<string | null>(null);
  /** Trophies opened to every build that turned up. */
  const [showAll, setShowAll] = useState<string[]>([]);
  const now = useNow();
  /** A refused vote, shown under its award. */
  const [error, setError] = useState<{ cat: string; text: string } | null>(null);
  const [openHere, setOpenHere] = useState(false);
  const open = expanded || openHere;
  if (event.cancelled || now < new Date(event.startsAt)) return null;

  const handle = (uid: string) => (uid === me ? 'You' : displayHandle(users.find((u) => u.id === uid)?.handle ?? 'unknown'));
  const awards = results(votes, event, builds, now);
  if (awards.length > 0 || now >= votingCloses(event)) {
    return (
      <Section title="Trophies">
        {awards.length === 0 ? <EmptyState variant="inline" title="Not enough votes for any trophies at this one." /> : null}
        {awards
          .filter((a) => categoryInfo(a.category).cover)
          .map((a, i) => {
            const b = builds.find((x) => x.id === a.buildId);
            if (!b) return null;
            return (
              <RevealIn key={a.category} id={`${event.id}:${a.category}`} delay={i * 250} sparks={i === 0}>
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
                  leading={{ icon: 'success', colour: info.cover ? COLOR.action.primary : COLOR.text.secondary }}
                  title={info.label}
                  subtitle={`${handle(a.ownerId)} · ${b ? `${b.make} ${b.model}` : 'a build'}`}
                  meta={`${a.votes} votes · +${info.rep} rep`}
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

  const check = canVote(event, me, now);
  // The demo asks for four at most (REVIEW-10); signed in, every trophy the meet has.
  const cats = categoriesFor(event, builds, backend === 'local' ? DEMO_TROPHIES : undefined);
  // Best newcomer is for people who haven't won a trophy yet (REVIEW-8: this week's Legend was on the list).
  const winners = new Set(allAwards(votes, events.filter((e) => e.id !== event.id), builds, now).map((a) => a.ownerId));
  const optionsFor = (cat: string) =>
    eligibleFor(cat as AwardCategory, event, builds).filter((b) => b.ownerId !== me && !(cat === 'newcomer' && winners.has(b.ownerId)));
  const myVote = (cat: string) => votes.find((v) => v.eventId === event.id && v.voterId === me && v.category === cat)?.buildId;
  const done = cats.filter((c) => myVote(c)).length;

  if (!open) {
    return (
      <Section
        title="Vote for trophies"
        right={
          <Button
            tier="tertiary"
            size="sm"
            label={check.ok ? (done ? `${done} of ${cats.length} done ›` : 'Open ›') : 'See ›'}
            accessibilityLabel={`Vote for trophies, ${cats.length} awards`}
            onPress={() => {
              setOpenHere(true);
              onExpand?.();
            }}
          />
        }
      >
        <DsText v="secondary">
          {plainCount(cats.length)} to vote on. Closes {formatRelative(votingCloses(event).toISOString(), now)}.
        </DsText>
      </Section>
    );
  }

  return (
    <Section title="Vote for trophies" right={<Tag label={`Closes ${formatRelative(votingCloses(event).toISOString(), now)}`} />}>
      {!check.ok ? (
        <Callout tone="neutral">{`${check.reason} Only people who turned up can vote.`}</Callout>
      ) : (
        <DsText v="secondary">One vote per trophy. You can change it until voting closes. You can't vote for yourself.</DsText>
      )}
      {check.ok
        ? cats.map((cat, ci) => {
            const options = optionsFor(cat);
            if (options.length === 0) return null;
            const chosen = myVote(cat);
            const label = categoryInfo(cat).label;
            const picked = chosen ? builds.find((b) => b.id === chosen) : undefined;
            if (picked && changing !== cat) {
              const owner = users.find((u) => u.id === picked.ownerId);
              return (
                <ListRow
                  key={cat}
                  leading={{ icon: 'success', colour: COLOR.state.success }}
                  title={label}
                  subtitle={`${displayHandle(owner?.handle ?? 'unknown')} · ${picked.make} ${picked.model}`}
                  trailing={<Button tier="tertiary" size="sm" label="Change" accessibilityLabel={`Change your vote for ${label}`} onPress={() => setChanging(cat)} />}
                />
              );
            }
            // Stacked, a photo and the facts per row (REVIEW-9 decision 8): nothing hides off screen.
            const shown = showAll.includes(cat) ? options : nominees(options, ci, 3, chosen);
            return (
              <View key={cat} style={{ gap: SPACING.sm }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
                  <Trophy colour={chosen ? COLOR.state.success : COLOR.text.secondary} size={20} />
                  <DsText v="bodyStrong" style={{ flex: 1 }}>
                    {label}
                  </DsText>
                  {chosen ? <Tag label="Voted" tone="success" /> : <DsText v="meta">{`${options.length} to choose from`}</DsText>}
                </View>
                <View accessibilityRole="radiogroup" accessibilityLabel={label} style={{ gap: SPACING.sm }}>
                  {shown.map((b) => {
                    const on = chosen === b.id;
                    const owner = users.find((u) => u.id === b.ownerId);
                    return (
                      <View key={b.id}>
                        <Press
                          haptic="select"
                          feedback="card"
                          role="radio"
                          state={{ checked: on }}
                          label={`Vote ${b.make} ${b.model} by ${displayHandle(owner?.handle ?? 'unknown')} for ${label}`}
                          onPress={() => {
                            setError(null);
                            vote(event.id, cat, b.id)
                              .then(() => setChanging(null))
                              .catch((e) => setError({ cat, text: e instanceof Error ? e.message : "Couldn't count that vote." }));
                          }}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: SPACING.md,
                            padding: SPACING.sm,
                            borderRadius: RADII.card,
                            borderWidth: 1,
                            borderColor: on ? COLOR.action.selected : COLOR.surface.borderStrong,
                            backgroundColor: on ? COLOR.action.selectedTint : COLOR.surface.card,
                          }}
                        >
                          {/* The photo first: it's what people vote on (REVIEW-8). */}
                          <View>
                            <BuildThumb photo={b.photos[0] ? photoSource(b.photos[0]) : null} kind={b.kind} shape={carShape(b)} size={72} />
                            <PhotoCredit photoRef={b.photos[0]} kind={b.kind} overlay />
                          </View>
                          <View style={{ flex: 1, gap: SPACING.xxs }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs }}>
                              <ClassBadge letter={classOf(b)} size="sm" decorative />
                              <DsText v="meta" numberOfLines={1} style={{ flex: 1 }}>
                                {displayHandle(owner?.handle ?? 'unknown')}
                              </DsText>
                            </View>
                            <DsText v="body" numberOfLines={2}>
                              {b.make} {b.model}
                            </DsText>
                            <DsText v="meta" numberOfLines={1}>
                              {buildMeta(b)}
                            </DsText>
                            <DynoBadge build={b} />
                          </View>
                        </Press>
                      </View>
                    );
                  })}
                </View>
                {shown.length < options.length ? (
                  <Button
                    tier="tertiary"
                    size="sm"
                    label={`Show all ${options.length}`}
                    accessibilityLabel={`Show all ${options.length} builds for ${label}`}
                    onPress={() => setShowAll((x) => [...x, cat])}
                    style={{ alignSelf: 'flex-start' }}
                  />
                ) : null}
                {error?.cat === cat ? <ErrorState title={error.text} /> : null}
              </View>
            );
          })
        : null}
    </Section>
  );
}

function plainCount(n: number): string {
  return n === 1 ? 'One trophy' : `${n} trophies`;
}

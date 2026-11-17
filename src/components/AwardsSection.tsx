import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { buildTag } from '../lib/bringing';
import { canVote, categoriesFor, categoryInfo, eligibleFor, results, votingCloses } from '../lib/awards';
import { classOf } from '../lib/classes';
import { endTime } from '../lib/events';
import { feel } from '../lib/feel';
import { formatRelative } from '../lib/format';
import { useStore } from '../lib/store';
import { useNow } from '../lib/clock';
import type { NightEvent } from '../lib/types';
import { BRAND, C, RADIUS } from '../theme';
import { Cover, Trophy } from './Cover';
import { RevealIn } from './motion';
import { Card, ClassBadge, InlineError, LinkText, Row, Section, Txt } from './ui';
import { UserLink } from './UserLink';

/** Voting while it's open, then the trophies. */
export function AwardsSection({ event }: { event: NightEvent }) {
  const { builds, users, votes, me, vote } = useStore();
  const now = useNow();
  /** A refused vote, shown under its award. */
  const [error, setError] = useState<{ cat: string; text: string } | null>(null);
  const [open, setOpen] = useState(false);
  if (event.cancelled || now < new Date(event.startsAt)) return null;

  const awards = results(votes, event, builds, now);
  if (awards.length > 0 || now >= votingCloses(event)) {
    return (
      <Section title="Trophies">
        {awards.length === 0 ? (
          <Card>
            <Txt v="muted">Not enough votes for any trophies at this one.</Txt>
          </Card>
        ) : null}
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
        <Card>
          {awards.map((a) => {
            const b = builds.find((x) => x.id === a.buildId);
            const owner = users.find((u) => u.id === a.ownerId);
            return (
              <UserLink key={a.category} id={a.ownerId} label={`${categoryInfo(a.category).label}: open ${owner?.handle ?? 'profile'}`}>
              <Row style={{ flexWrap: 'nowrap' }} gap={10}>
                <Trophy colour={categoryInfo(a.category).cover ? BRAND : C.fog} size={28} />
                <View style={{ flex: 1 }}>
                  <Txt>{categoryInfo(a.category).label}</Txt>
                  <Txt v="muted" numberOfLines={1}>
                    {a.ownerId === me ? 'You' : `@${owner?.handle}`} · {b?.make} {b?.model} · {a.votes} votes
                  </Txt>
                </View>
                <Txt v="mono" scale="chrome" style={{ color: BRAND }}>+{categoryInfo(a.category).rep} rep</Txt>
              </Row>
              </UserLink>
            );
          })}
        </Card>
      </Section>
    );
  }

  const check = canVote(event, me, now);
  const cats = categoriesFor(event, builds);
  const myVote = (cat: string) => votes.find((v) => v.eventId === event.id && v.voterId === me && v.category === cat)?.buildId;

  // While the event is on, chat matters more: keep voting to one row until it's opened.
  if (now < endTime(event) && !open) {
    const done = cats.filter((c) => myVote(c)).length;
    return (
      <Section
        title={`Vote (${cats.length} award${cats.length === 1 ? '' : 's'})`}
        right={<LinkText label={check.ok ? (done ? `${done} done ›` : 'Open ›') : 'See ›'} accessibilityLabel={`Vote, ${cats.length} awards`} onPress={() => setOpen(true)} />}
      >
        {null}
      </Section>
    );
  }

  return (
    <Section title="Vote" right={<Txt v="mono" scale="chrome">Closes {formatRelative(votingCloses(event).toISOString(), now)}</Txt>}>
      {!check.ok ? (
        <Card>
          <Txt v="muted">{check.reason} Only people who turned up can vote.</Txt>
        </Card>
      ) : (
        <Txt v="muted">One vote per award. You can change it until voting closes. You can't vote for yourself.</Txt>
      )}
      {check.ok
        ? cats.map((cat) => {
            const options = eligibleFor(cat, event, builds).filter((b) => b.ownerId !== me);
            if (options.length === 0) return null;
            const chosen = myVote(cat);
            return (
              <View key={cat} style={{ gap: 6 }}>
                <Txt v="label" style={{ color: chosen ? BRAND : C.fog }}>
                  {categoryInfo(cat).label}
                  {chosen ? ' ✓' : ''}
                </Txt>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  {options.map((b) => {
                    const on = chosen === b.id;
                    const owner = users.find((u) => u.id === b.ownerId);
                    return (
                      <Pressable
                        key={b.id}
                        accessibilityRole="button"
                        accessibilityState={{ selected: on }}
                        accessibilityLabel={`Vote ${b.make} ${b.model} by @${owner?.handle ?? 'unknown'} for ${categoryInfo(cat).label}`}
                        onPress={() => {
                          setError(null);
                          vote(event.id, cat, b.id)
                            .then(() => feel.select())
                            .catch((e) => setError({ cat, text: e instanceof Error ? e.message : 'That vote did not count.' }));
                        }}
                        style={{
                          width: 150, padding: 10, gap: 6, borderRadius: RADIUS.card, borderWidth: 1,
                          borderColor: on ? BRAND : C.kerbHi, backgroundColor: on ? `${BRAND}1f` : C.tarmac,
                        }}
                      >
                        <Row style={{ flexWrap: 'nowrap' }} gap={6}>
                          <ClassBadge letter={classOf(b)} size="sm" />
                          <UserLink id={b.ownerId} style={{ flex: 1 }} label={`Open @${owner?.handle}`}>
                            <Txt v="mono" numberOfLines={1} style={{ color: C.chalk, textTransform: 'none' }}>@{owner?.handle}</Txt>
                          </UserLink>
                        </Row>
                        <Txt numberOfLines={2}>{b.make} {b.model}</Txt>
                        {buildTag(b) ? <Txt v="micro" numberOfLines={1} style={{ color: C.chalk }}>{buildTag(b)}</Txt> : null}
                      </Pressable>
                    );
                  })}
                </ScrollView>
                <InlineError message={error?.cat === cat ? error.text : null} />
              </View>
            );
          })
        : null}
    </Section>
  );
}

import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { canVote, categoriesFor, categoryInfo, eligibleFor, results, votingCloses } from '../lib/awards';
import { classOf } from '../lib/classes';
import { formatRelative } from '../lib/format';
import { useStore } from '../lib/store';
import type { NightEvent } from '../lib/types';
import { C } from '../theme';
import { Cover, Trophy } from './Cover';
import { Card, ClassBadge, Row, Section, Txt } from './ui';
import { UserLink } from './UserLink';

/** Voting while it's open, then the trophies. */
export function AwardsSection({ event }: { event: NightEvent }) {
  const { builds, users, votes, me, now, vote } = useStore();
  const [error, setError] = useState<string | null>(null);
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
          .map((a) => {
            const b = builds.find((x) => x.id === a.buildId)!;
            return (
              <View key={a.category} style={{ alignItems: 'center' }}>
                <Cover award={a} build={b} owner={users.find((u) => u.id === a.ownerId)} event={event} width={240} />
              </View>
            );
          })}
        <Card>
          {awards.map((a) => {
            const b = builds.find((x) => x.id === a.buildId);
            const owner = users.find((u) => u.id === a.ownerId);
            return (
              <UserLink key={a.category} id={a.ownerId} label={`${categoryInfo(a.category).label}: open ${owner?.handle ?? 'profile'}`}>
              <Row style={{ flexWrap: 'nowrap' }} gap={10}>
                <Trophy colour={categoryInfo(a.category).cover ? C.sodium : C.fog} size={28} />
                <View style={{ flex: 1 }}>
                  <Txt>{categoryInfo(a.category).label}</Txt>
                  <Txt v="muted" numberOfLines={1}>
                    {a.ownerId === me ? 'You' : `@${owner?.handle}`} · {b?.make} {b?.model} · {a.votes} votes
                  </Txt>
                </View>
                <Txt v="mono" style={{ color: C.sodium }}>+{categoryInfo(a.category).rep}</Txt>
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

  return (
    <Section title="Vote" right={<Txt v="mono">CLOSES {formatRelative(votingCloses(event).toISOString(), now).toUpperCase()}</Txt>}>
      {!check.ok ? (
        <Card>
          <Txt v="muted">{check.reason} Only people who turned up can vote.</Txt>
        </Card>
      ) : (
        <Txt v="muted">One vote per award. You can change it until voting closes. You can't vote for yourself.</Txt>
      )}
      {error ? (
        <Card accent={C.alert}>
          <Txt>{error}</Txt>
        </Card>
      ) : null}
      {check.ok
        ? cats.map((cat) => {
            const options = eligibleFor(cat, event, builds).filter((b) => b.ownerId !== me);
            if (options.length === 0) return null;
            const chosen = myVote(cat);
            return (
              <View key={cat} style={{ gap: 6 }}>
                <Txt v="label" style={{ color: chosen ? C.sodium : C.fog }}>
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
                        onPress={() => {
                          setError(null);
                          try {
                            vote(event.id, cat, b.id);
                          } catch (e) {
                            setError(e instanceof Error ? e.message : 'That vote did not count.');
                          }
                        }}
                        style={{
                          width: 150, padding: 10, gap: 6, borderRadius: 8, borderWidth: 1,
                          borderColor: on ? C.sodium : C.kerb, backgroundColor: on ? `${C.sodium}1f` : C.tarmac,
                        }}
                      >
                        <Row style={{ flexWrap: 'nowrap' }} gap={6}>
                          <ClassBadge letter={classOf(b)} size="sm" />
                          <UserLink id={b.ownerId} style={{ flex: 1 }} label={`Open @${owner?.handle}`}>
                            <Txt v="label" numberOfLines={1} style={{ color: C.neon }}>@{owner?.handle}</Txt>
                          </UserLink>
                        </Row>
                        <Txt numberOfLines={2}>{b.make} {b.model}</Txt>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            );
          })
        : null}
    </Section>
  );
}

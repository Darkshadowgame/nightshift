import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, View } from 'react-native';
import { ORGANISED_WORDS, organisedFacts, sponsorShopId } from '../lib/organised';
import { arrivalBoard, historyLine, rulesOf, seenAt, STATUS_WORDS, statusRow, statusSummary, type HostStats, type MeetHistory, type MeetStatus } from '../lib/meetExtras';
import { photoSource } from '../lib/photoSource';
import type { Build, NightEvent, User } from '../lib/types';
import { COLOR, RADII, SPACING } from '../theme';
import { BuildThumb, Button, displayHandle, DsText, ListRow, Press, Section, Sheet, SheetOption, StatBlock, Tag } from './ds';

/** How many vehicles show before "See all". */
const SHOWN = 8;

/**
 * Who's here (while it is on) and Seen at (once it is over): one wall of vehicles, so the meet page
 * has one section for both. Who's here is the most recent arrival first; Seen at lists each vehicle
 * once. Tap one to open the build. Only vehicles of people checked in, so it never says where.
 */
export function ArrivalsSection({ event, builds, users, over, me }: { event: NightEvent; builds: readonly Build[]; users: readonly User[]; over: boolean; me: string }) {
  const [all, setAll] = useState(false);
  const board = arrivalBoard(event, builds);
  const items = over
    ? seenAt(event, builds).map((b) => ({ key: b.id, build: b, userId: b.ownerId, at: undefined as string | undefined }))
    : board.flatMap((a) => (a.build ? [{ key: a.userId, build: a.build, userId: a.userId, at: a.at }] : []));
  if (items.length === 0) return null;
  const shown = all ? items : items.slice(0, SHOWN);
  const handle = (uid: string) => (uid === me ? 'You' : displayHandle(users.find((u) => u.id === uid)?.handle ?? 'unknown'));
  return (
    <Section title={over ? 'Seen at' : "Who's here"}>
      {over ? <DsText v="secondary">Open a build you liked.</DsText> : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm }}>
        {shown.map((x) => (
          <Press
            key={x.key}
            onPress={() => router.push({ pathname: '/build/[id]', params: { id: x.build.id } })}
            label={`${x.build.make} ${x.build.model}, ${handle(x.userId)}`}
            feedback="card"
            style={{ width: '48%', flexGrow: 1, gap: SPACING.xxs }}
          >
            <View style={{ borderRadius: RADII.control, overflow: 'hidden' }}>
              <BuildThumb photo={x.build.photos[0] ? photoSource(x.build.photos[0]) : null} kind={x.build.kind} size={96} />
            </View>
            <DsText v="secondary">{`${x.build.make} ${x.build.model}`}</DsText>
            <DsText v="meta" numberOfLines={1}>{handle(x.userId)}</DsText>
          </Press>
        ))}
      </View>
      {items.length > SHOWN ? <Button tier="tertiary" size="sm" label={all ? 'Show fewer' : `See all ${items.length}`} onPress={() => setAll(!all)} style={{ alignSelf: 'flex-start' }} /> : null}
    </Section>
  );
}

/** The host's picked rules, as short lines. Nothing when none were picked. */
export function RulesSection({ event }: { event: NightEvent }) {
  const rules = rulesOf(event);
  if (rules.length === 0) return null;
  return (
    <Section title="House rules">
      <View style={{ gap: SPACING.xs }}>
        {rules.map((r) => (
          <DsText key={r} v="body">{r}</DsText>
        ))}
      </View>
    </Section>
  );
}

/** One row: "Running late" before you arrive, "I have left" after. Tap to say it, tap again to undo. */
export function StatusToggleRow({ event, me, now, onSet }: { event: NightEvent; me: string; now: Date; onSet: (s: MeetStatus | null) => void }) {
  const row = statusRow(event, me, now);
  if (!row) return null;
  const w = STATUS_WORDS[row.offer];
  return (
    <ListRow
      leading={{ icon: row.offer === 'late' ? 'bell' : 'pin' }}
      title={row.set ? (row.offer === 'late' ? "You're running late" : 'You have left') : w.row}
      subtitle={row.set ? w.undo : w.hint}
      trailing={row.set ? <Tag label={w.tag} tone="info" /> : undefined}
      onPress={() => onSet(row.set ? null : row.offer)}
    />
  );
}

/** "2 running late, 1 on the way": a quiet line for hosts and people going. */
export function StatusSummary({ event }: { event: NightEvent }) {
  const text = statusSummary(event);
  return text ? <DsText v="secondary">{text}</DsText> : null;
}

/** How often it has run and the usual turnout: honest, and nothing for a first run. */
export function HistoryLine({ history }: { history: MeetHistory | null }) {
  const text = historyLine(history);
  return text ? <DsText v="secondary">{text}</DsText> : null;
}

/** The host's numbers: going, arrived, regulars versus new people, and arrivals by the hour. One calm section. */
export function HostDashboard({ stats }: { stats: HostStats }) {
  const top = Math.max(1, ...stats.arrivalsByHour.map((b) => b.count));
  return (
    <Section title="Your numbers">
      <StatBlock
        stats={[
          { value: String(stats.going), label: 'Going' },
          { value: String(stats.arrived), label: 'Arrived' },
          { value: String(stats.regulars), label: 'Regulars' },
          { value: String(stats.newcomers), label: 'New' },
        ]}
      />
      {stats.arrivalsByHour.length > 0 ? (
        <View style={{ gap: SPACING.xs }} accessible accessibilityLabel={`Arrivals by the hour: ${stats.arrivalsByHour.map((b) => `${b.label} ${b.count}`).join(', ')}`}>
          <DsText v="label">Arrivals by the hour</DsText>
          {stats.arrivalsByHour.map((b) => (
            <View key={b.label} style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
              <DsText v="meta" style={{ width: 48 }}>{b.label}</DsText>
              <View style={{ height: SPACING.sm, width: `${Math.max(4, (b.count / top) * 70)}%`, borderRadius: RADII.control, backgroundColor: COLOR.text.secondary }} />
              <DsText v="meta">{String(b.count)}</DsText>
            </View>
          ))}
        </View>
      ) : null}
    </Section>
  );
}

/** Pick someone going to be a co-host (they can edit and manage the meet). */
export function CoHostSheet({ visible, onClose, people, onPick }: { visible: boolean; onClose: () => void; people: { id: string; handle: string }[]; onPick: (id: string) => void }) {
  return (
    <Sheet visible={visible} title="Add a co-host" onClose={onClose}>
      <View>
        {people.length === 0 ? (
          <DsText v="secondary">Nobody else is going yet. Once someone is, you can make them a co-host.</DsText>
        ) : (
          people.map((p) => <SheetOption key={p.id} label={displayHandle(p.handle)} detail="Can edit and manage this meet" onPress={() => onPick(p.id)} />)
        )}
      </View>
    </Sheet>
  );
}

/**
 * An organised event's commercial side (organised.ts): "Organised by X" and the ticket row in one
 * section, then Sponsored by, plainly labelled as such (UK advertising rules). Nothing at all for a
 * local meet. The ticket row opens the organiser's own https link in the browser: it is a row, never a
 * second primary beside "I'm going", and the app takes no payment.
 */
export function OrganisedSections({ event }: { event: NightEvent }) {
  const facts = organisedFacts(event);
  if (!facts) return null;
  const { organisedBy, sponsors, ticket } = facts;
  return (
    <>
      <Section title={ORGANISED_WORDS.section}>
        <View testID="organised-section">
          {organisedBy ? <ListRow leading={{ icon: 'info' }} title={organisedBy} /> : null}
          {ticket ? (
            <ListRow
              leading={{ icon: 'ticket' }}
              title={ticket.title}
              subtitle={ticket.link ? 'Opens the organiser’s site. Slipstream takes no payment' : undefined}
              chevron={!!ticket.link}
              onPress={ticket.link ? () => void Linking.openURL(ticket.link!).catch(() => {}) : undefined}
              accessibilityHint={ticket.link ? 'Opens in your browser' : undefined}
            />
          ) : null}
          {!organisedBy && !ticket ? <DsText v="secondary">Planned by an organiser, not a local meet.</DsText> : null}
        </View>
      </Section>
      {sponsors.length ? (
        <Section title={ORGANISED_WORDS.sponsoredBy}>
          <View testID="sponsored-by">
            <DsText v="caption">{ORGANISED_WORDS.sponsoredHint}</DsText>
            {sponsors.map((sp) => {
              const shop = sponsorShopId(sp);
              return (
                <ListRow
                  key={sp.name}
                  leading={{ icon: 'pin' }}
                  title={sp.name}
                  subtitle={shop ? 'Shop in Slipstream' : undefined}
                  chevron={!!shop}
                  onPress={shop ? () => router.push({ pathname: '/shop/[id]', params: { id: shop } }) : undefined}
                />
              );
            })}
          </View>
        </Section>
      ) : null}
    </>
  );
}

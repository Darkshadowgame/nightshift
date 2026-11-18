import { View } from 'react-native';
import { ladderLabel, LEVEL_NAMES, REP, repForLevel, type LevelInfo, type RepLedger } from '../lib/rep';
import { SPACING } from '../theme';
import { DsText, ListRow, RowDivider, Section, Sheet, Tag, metaLine } from './ds';

const n = (x: number) => x.toLocaleString('en-GB');

/** How rep is earned, in the order people meet it. */
export const EARN: { what: string; rep: string }[] = [
  { what: 'Check in at a meet', rep: `+${REP.attended}` },
  { what: 'Host an event (more with 10+ checked in)', rep: `+${REP.hostedSmall} to +${REP.hostedBig}` },
  { what: 'Win a trophy at a meet', rep: 'varies' },
  { what: 'Finish a drive (longer pays more)', rep: `about +${REP.drive}` },
  { what: 'Visit a photo spot', rep: `+${REP.photoSpot}` },
  { what: 'Log a road-legal mod (parts that do the same job count once)', rep: `+${REP.mod}` },
  { what: 'A place you suggested gets approved and used', rep: 'varies' },
  { what: 'A forum answer marked solved', rep: '+25' },
  { what: 'A road report others confirm', rep: '+10' },
];

/**
 * The ladder (REVIEW-10 #15): every level with its name and the rep it starts at, where you
 * are, what you've earned, and how to earn more. Opened from the level on Me.
 */
export function LadderSheet({ visible, onClose, level, ledger }: { visible: boolean; onClose: () => void; level: LevelInfo; ledger: RepLedger }) {
  const top = LEVEL_NAMES[LEVEL_NAMES.length - 1].from;
  const levels = Array.from({ length: top }, (_, i) => i + 1);
  const earned = ledger.lines.filter((l) => l.rep > 0);
  return (
    <Sheet visible={visible} title="Levels" onClose={onClose}>
      <DsText v="body">
        {`You're Level ${level.level} · ${level.name} with ${n(level.rep)} rep.${level.level < top ? ` ${n(level.next - level.rep)} more to Level ${level.level + 1}.` : ''}`}
      </DsText>
      <View>
        {levels.map((l, i) => {
          return (
            <View key={l}>
              {i ? <RowDivider /> : null}
              <ListRow
                title={ladderLabel(l)}
                subtitle={l === 1 ? 'Where everyone starts' : `From ${n(repForLevel(l))} rep`}
                trailing={l === level.level ? <Tag label="You" tone="selected" /> : undefined}
              />
            </View>
          );
        })}
      </View>
      <Section title="How to earn rep">
        {EARN.map((e) => (
          <View key={e.what} style={{ flexDirection: 'row', gap: SPACING.md, justifyContent: 'space-between' }}>
            <DsText v="secondary" style={{ flex: 1 }}>
              {e.what}
            </DsText>
            <DsText v="meta">{e.rep}</DsText>
          </View>
        ))}
        <DsText v="caption">Rep is for people. Class is your build's, from its power for its weight.</DsText>
      </Section>
      {earned.length ? (
        <Section title="Your rep">
          {earned.map((l) => (
            <DsText key={l.source} v="secondary">
              {metaLine([l.label, `${l.count}`, `${n(l.rep)} rep`])}
            </DsText>
          ))}
        </Section>
      ) : null}
    </Sheet>
  );
}

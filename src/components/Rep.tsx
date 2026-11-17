import { useMemo } from 'react';
import { Text, View } from 'react-native';
import { allAwards } from '../lib/awards';
import { levelFor, repLedger, type LevelInfo, type RepLedger } from '../lib/rep';
import { useStore } from '../lib/store';
import { C, F } from '../theme';
import { Card, Row, Txt } from './ui';

/** Everyone's rep, worked out from the store. */
export function useRepFor(): (userId: string) => { ledger: RepLedger; level: LevelInfo } {
  const { events, spots, builds, votes, now, crews } = useStore();
  return useMemo(() => {
    const awards = allAwards(votes, events, builds, now);
    const cache = new Map<string, { ledger: RepLedger; level: LevelInfo }>();
    return (userId: string) => {
      let hit = cache.get(userId);
      if (!hit) {
        const ledger = repLedger(userId, { events, spots, builds, awards, now, crews });
        hit = { ledger, level: levelFor(ledger.total) };
        cache.set(userId, hit);
      }
      return hit;
    };
  }, [events, spots, builds, votes, now, crews]);
}

export function useRep(userId: string) {
  return useRepFor()(userId);
}

/** Small "LVL 3" tag. */
export function LevelTag({ level, size = 'sm' }: { level: number; size?: 'sm' | 'lg' }) {
  const lg = size === 'lg';
  return (
    <View
      accessibilityLabel={`Level ${level}`}
      style={{ borderWidth: 1.5, borderColor: C.neon, borderRadius: 4, paddingHorizontal: lg ? 8 : 5, paddingVertical: lg ? 3 : 1, transform: [{ skewX: '-8deg' }] }}
    >
      <Text style={{ fontFamily: lg ? F.display : F.labelBold, color: C.neon, fontSize: lg ? 16 : 12, letterSpacing: 1 }}>LVL {level}</Text>
    </View>
  );
}

const nf = (n: number) => n.toLocaleString('en-GB');

/** Total, level, progress to the next level and where the rep came from. */
export function RepPanel({ ledger, level, title = 'Rep' }: { ledger: RepLedger; level: LevelInfo; title?: string }) {
  const pct = Math.round(Math.max(0, Math.min(1, level.progress)) * 100);
  return (
    <Card accent={C.neon}>
      <Row style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}>
        <View style={{ gap: 2 }}>
          <Txt v="eyebrow" style={{ color: C.neon }}>{title}</Txt>
          <Txt v="h1">{nf(ledger.total)}</Txt>
        </View>
        <LevelTag level={level.level} size="lg" />
      </Row>
      <View
        style={{ height: 8, backgroundColor: C.kerb, borderRadius: 4, overflow: 'hidden' }}
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: 100, now: pct }}
      >
        <View style={{ width: `${pct}%`, height: '100%', backgroundColor: C.neon }} />
      </View>
      <Txt v="mono">{nf(level.next - level.rep)} TO LEVEL {level.level + 1}</Txt>
      <View style={{ gap: 6, marginTop: 4 }}>
        {ledger.lines.filter((l) => l.count > 0).map((l) => (
          <Row key={l.source} style={{ flexWrap: 'nowrap', justifyContent: 'space-between' }}>
            <Txt v="muted" style={{ flex: 1 }}>
              {l.label} <Txt v="mono">×{l.count}</Txt>
            </Txt>
            <Txt v="mono" style={{ color: l.rep > 0 ? C.sodium : C.fog }}>+{nf(l.rep)}</Txt>
          </Row>
        ))}
        {ledger.lines.some((l) => l.count === 0) ? (
          <Txt v="muted" style={{ fontSize: 12 }}>
            Still to earn: {ledger.lines.filter((l) => l.count === 0).map((l) => l.label.toLowerCase()).join(', ')}.
          </Txt>
        ) : null}
      </View>
    </Card>
  );
}

import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';
import { demoTrackDays } from '../data/demoPlaceExtras';
import { appNow } from '../lib/appClock';
import { setRival, setSeen, useExtras } from '../lib/extrasStore';
import { plural } from '../lib/format';
import {
  bestOf,
  bestTimeline,
  formatLapTime,
  gapText,
  rivalNews,
  rivalStanding,
  setupLine,
  type LapTime,
} from '../lib/laptimes';
import { mergeTrackDays, trackDaysAt } from '../lib/trackDays';
import { useStore } from '../lib/store';
import type { Spot } from '../lib/types';
import { dayLabelShort, whenLabel } from '../lib/when';
import { COLOR, SPACING } from '../theme';
import { Callout } from './Detail';
import { displayHandle, DsText, EmptyState, ListRow, Section, Sheet, SheetOption } from './ds';

/** Personal-best timeline, rival and track days on the track screen (Level-up, places). */

// ---------------------------------------------------------------------------
// Personal best timeline: your best time per day at this layout, drawn with react-native-svg
// ---------------------------------------------------------------------------

const CHART_H = 112;
const PAD = 10;

export function BestTimeline({ laps, trackId, layout, me }: { laps: LapTime[]; trackId: string; layout: string; me: string }) {
  const points = useMemo(() => bestTimeline(laps, trackId, layout, me), [laps, trackId, layout, me]);
  const [w, setW] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setW(Math.round(e.nativeEvent.layout.width));
  if (points.length < 2) {
    return (
      <EmptyState variant="inline" title={points.length === 1 ? 'One time so far. Add another from a later track day to see your progress.' : 'Your progress shows here once you have two times at this track.'} />
    );
  }
  const first = points[0];
  const last = points[points.length - 1];
  const ms = points.map((p) => p.ms);
  const hi = Math.max(...ms);
  const lo = Math.min(...ms);
  const span = Math.max(1, hi - lo);
  // Quicker is higher, so getting better reads as going up.
  const x = (i: number) => PAD + (w - PAD * 2) * (i / (points.length - 1));
  const y = (v: number) => PAD + (CHART_H - PAD * 2) * ((v - lo) / span);
  const line = points.map((p, i) => `${x(i).toFixed(1)},${y(p.best).toFixed(1)}`).join(' ');
  const gained = first.ms - last.best;
  const summary = `Your best at ${layout}: ${formatLapTime(last.best)}, ${gained > 0 ? `${(gained / 1000).toFixed(3)} s quicker than your first time` : 'the same as your first time'}.`;
  return (
    <View style={{ gap: SPACING.xs }}>
      <DsText v="label">Your best times</DsText>
      <View onLayout={onLayout} accessible accessibilityRole="image" accessibilityLabel={`${summary} ${plural(points.length, 'track day')} charted.`}>
        {w > 0 ? (
          <Svg width={w} height={CHART_H} pointerEvents="none">
            <Line x1={PAD} x2={w - PAD} y1={CHART_H - 1} y2={CHART_H - 1} stroke={COLOR.surface.border} strokeWidth={1} />
            <Polyline points={line} fill="none" stroke={COLOR.text.secondary} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
            {points.map((p, i) => (
              <Circle key={p.on} cx={x(i)} cy={y(p.ms)} r={p.isBest ? 5 : 3.5} fill={p.isBest ? COLOR.state.success : COLOR.surface.card} stroke={p.isBest ? COLOR.state.success : COLOR.text.secondary} strokeWidth={1.5} />
            ))}
          </Svg>
        ) : (
          <View style={{ height: CHART_H }} />
        )}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <DsText v="caption">{dayLabelShort(`${first.on}T12:00:00`, appNow())}</DsText>
        <DsText v="caption">{dayLabelShort(`${last.on}T12:00:00`, appNow())}</DsText>
      </View>
      <DsText v="meta">{summary}</DsText>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Rival
// ---------------------------------------------------------------------------

export function RivalRow({ laps, trackId, layout, me }: { laps: LapTime[]; trackId: string; layout: string; me: string }) {
  const { users } = useStore();
  const { extras, ready } = useExtras();
  const [picking, setPicking] = useState(false);
  const [news, setNews] = useState<string[]>([]);
  const pick = extras.rivals[trackId];
  const rival = pick ? users.find((u) => u.id === pick.userId) : undefined;
  const name = rival ? displayHandle(rival.handle) : 'Your rival';
  const standing = pick ? rivalStanding(laps, trackId, layout, me, pick.userId) : null;
  const mineMs = standing?.mine?.ms;
  const theirMs = standing?.theirs?.ms;

  // When either of you has gone quicker since you last looked, say so once, then remember the new times.
  const lastKey = useRef('');
  useEffect(() => {
    if (!ready || !pick) return;
    const key = `${trackId}|${layout}|${pick.userId}`;
    const seen = pick.seen[layout];
    if (lastKey.current !== key) {
      lastKey.current = key;
      setNews(rivalNews(seen, { me: mineMs, them: theirMs }, name));
    } else {
      setNews((n) => [...n, ...rivalNews(seen, { me: mineMs, them: theirMs }, name)]);
    }
    setSeen(trackId, layout, { me: mineMs, them: theirMs });
  }, [ready, pick, trackId, layout, mineMs, theirMs, name]);

  // People with a time on this layout, in my vehicle type where I have one, quickest first.
  const candidates = useMemo(() => {
    const ids = [...new Set(laps.filter((l) => l.trackId === trackId && l.layout === layout && l.userId !== me && l.status !== 'rejected').map((l) => l.userId))];
    return ids
      .flatMap((id) => {
        const best = bestOf(laps, trackId, layout, id);
        const u = users.find((x) => x.id === id);
        return best && u ? [{ id, handle: u.handle, best }] : [];
      })
      .sort((a, b) => a.best.ms - b.best.ms)
      .slice(0, 10);
  }, [laps, trackId, layout, me, users]);

  const gapLine = !standing
    ? null
    : standing.gapMs === undefined
      ? mineMs === undefined
        ? `${name} is on ${formatLapTime(theirMs ?? 0)}. Add your own time to see the gap.`
        : `${name} has no time on this layout yet.`
      : standing.gapMs === 0
        ? `Dead even with ${name}.`
        : `You're ${(Math.abs(standing.gapMs) / 1000).toFixed(3)} s ${standing.gapMs > 0 ? 'behind' : 'ahead of'} ${name}.`;

  return (
    <>
      <View style={{ gap: SPACING.xs }}>
        <DsText v="label">Rival</DsText>
        {pick && rival ? (
          <>
            <ListRow
              leading={{ avatar: { name: rival.name, handle: rival.handle } }}
              title={`Chasing ${name}`}
              subtitle={gapLine ?? undefined}
              meta={mineMs !== undefined && theirMs !== undefined ? `You ${formatLapTime(mineMs)} · ${name} ${formatLapTime(theirMs)} (${gapText(mineMs - theirMs)})` : undefined}
              onPress={() => setPicking(true)}
              accessibilityLabel={`Chasing ${name}. ${gapLine ?? ''} Tap to change.`}
            />
            {news.map((n) => (
              <Callout key={n} tone="info" title={n} />
            ))}
          </>
        ) : (
          <ListRow leading={{ icon: 'plus' }} title="Chase someone" subtitle="Pick one person at this track and see the gap." onPress={() => setPicking(true)} />
        )}
      </View>
      <Sheet visible={picking} title="Who do you want to chase?" onClose={() => setPicking(false)}>
        <View>
          {candidates.length ? (
            candidates.map((c) => (
              <SheetOption
                key={c.id}
                label={displayHandle(c.handle)}
                detail={`${formatLapTime(c.best.ms)} · ${c.best.vehicle}`}
                onPress={() => {
                  setNews([]);
                  setRival(trackId, c.id);
                  setPicking(false);
                }}
              />
            ))
          ) : (
            <DsText v="secondary">Nobody else has a time on this layout yet.</DsText>
          )}
          {pick ? (
            <SheetOption
              label="No rival"
              destructive
              onPress={() => {
                setNews([]);
                setRival(trackId, null);
                setPicking(false);
              }}
            />
          ) : null}
        </View>
      </Sheet>
    </>
  );
}

// ---------------------------------------------------------------------------
// Track days
// ---------------------------------------------------------------------------

/** Upcoming track days at this circuit (meets of type Track day), and who from the app is going. */
export function TrackDays({ spot }: { spot: Spot }) {
  const store = useStore();
  const { events, users, me } = store;
  const demo = store.backend === 'local';
  const now = appNow();
  const days = useMemo(
    () => mergeTrackDays(trackDaysAt(events, spot.at, now), demo ? demoTrackDays(spot.id, now) : []),
    // `now` moves every render; the day is what matters here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [events, spot.at, spot.id, demo, now.toDateString()],
  );
  return (
    <Section title="Track days">
      {days.length ? (
        <View>
          {days.map((d) => {
            const handles = d.going.flatMap((id) => (id === me ? ['you'] : users.find((u) => u.id === id)?.handle ? [displayHandle(users.find((u) => u.id === id)!.handle)] : []));
            const goingLine = d.going.length
              ? `${plural(d.going.length, 'person', 'people')} going: ${handles.slice(0, 3).join(', ')}${d.going.length > 3 ? ` and ${d.going.length - 3} more` : ''}`
              : 'Nobody from Slipstream yet';
            return (
              <ListRow
                key={d.id}
                leading={{ icon: 'calendar' }}
                title={d.title}
                subtitle={goingLine}
                meta={whenLabel(d.startsAt, now)}
                onPress={d.eventId ? () => router.push({ pathname: '/event/[id]', params: { id: d.eventId! } }) : undefined}
              />
            );
          })}
        </View>
      ) : (
        <EmptyState variant="inline" title="No track days listed here yet. Meets of type Track day at this circuit show up here." />
      )}
    </Section>
  );
}

/** The setup line under one of your own times, or null. Never shown on anyone else's. */
export function setupMeta(l: LapTime, me: string): string | null {
  return l.userId === me && l.setup ? setupLine(l.setup) || null : null;
}

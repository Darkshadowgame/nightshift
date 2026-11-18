import * as Location from 'expo-location';
import { ReportLink } from '../../components/Community';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Image, Platform, ScrollView, View } from 'react-native';
import { navDirectionsAvailable } from '../../../modules/nav-directions';
import { CommonsStrip } from '../../components/CommonsStrip';
import { NightMap } from '../../components/NightMap';
import type { MapPath, MapPin } from '../../components/mapTypes';
import { Pin } from '../../components/Pin';
import { NavLaunch } from '../../components/NavLaunch';
import { usePhotoFlow } from '../../components/PhotoFlow';
import { Stars } from '../../components/Stars';
import { TrackPanel } from '../../components/TrackPanel';
import { UserLink } from '../../components/UserLink';
import { Button, Card, InlineError, NotFound, Row, Section, Tag, Txt } from '../../components/ui';
import { ZoneNotice } from '../../components/ZoneCard';
import { BAN_ZONES } from '../../data/seed';
import { SYSTEM_AUTHOR } from '../../data/places';
import { radiusFor } from '../../lib/commons';
import { trackOutline } from '../../lib/tracks';
import { driveTier } from '../../lib/rep';
import { feel } from '../../lib/feel';
import { ONLY_ON_PHONE, PLACE_NAMES, WHERE } from '../../lib/glossary';
import { photoUri } from '../../lib/photos';
import {
  advanceRun,
  averageStars,
  canRate,
  canVisit,
  CHECKPOINT_RADIUS_MILES,
  driveMiles,
  hasCompleted,
  isInfoOnly,
  myRating,
  NEW_RUN,
  runExpired,
  simulatedTimes,
  statsOf,
  type DriveRun,
} from '../../lib/spots';
import { preciseFix } from '../../lib/location';
import { useStore } from '../../lib/store';
import type { LatLng, Spot } from '../../lib/types';
import { BRAND, C, LAYER, RADIUS, SPOT_COLOURS, STATE } from '../../theme';

/** A drive, photo spot or track: details, start a drive or check in, then rate it. */
export default function SpotScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { spots } = useStore();
  const spot = spots.find((x) => x.id === id);
  // The header stays blank: the kind is the eyebrow under it, once.
  if (!spot) return <NotFound what="Place" message="This place is no longer on Nightshift." />;
  return <SpotDetail spot={spot} />;
}

function SpotDetail({ spot }: { spot: Spot }) {
  const store = useStore();
  const { me, users } = store;
  const colour = SPOT_COLOURS[spot.kind];
  const [run, setRun] = useState<DriveRun | null>(null);
  /** A rating that didn't save: shown under the stars. */
  const [rateError, setRateError] = useState<string | null>(null);
  const [justDone, setJustDone] = useState(false);
  const [rated, setRated] = useState(false);

  const author = spot.authorId ? users.find((u) => u.id === spot.authorId) : undefined;
  const mine = spot.authorId === me;
  const pending = spot.status === 'pending';
  const done = hasCompleted(spot, me);
  const people = statsOf(spot).completions.length;
  const { average, count } = averageStars(spot);
  // Every zone it's in, by id (worked out from today's zones when the place is read).
  const zones = (spot.banZoneIds ?? []).flatMap((id) => BAN_ZONES.filter((z) => z.id === id));
  const checkpoints = spot.path ?? [];
  const outline = spot.kind === 'track' ? trackOutline(spot.id) : null;
  const paths: MapPath[] = [
    ...(checkpoints.length > 1 ? [{ id: 'path', coords: checkpoints, colour, dashed: pending }] : []),
    ...(outline ? [{ id: 'outline', coords: outline.path, colour, width: 3 }] : []),
  ];
  const framed = spot.kind === 'drive' && checkpoints.length ? checkpoints : outline ? outline.path : [];

  const pins: MapPin[] =
    spot.kind === 'drive'
      ? checkpoints.map((p, i) => ({
          id: `cp${i}`,
          at: p,
          glyph: 'drive' as const,
          colour: run && i < run.passed ? STATE.success : i === 0 || i === checkpoints.length - 1 ? colour : C.fog,
          title: i === 0 ? 'Start' : i === checkpoints.length - 1 ? 'Finish' : `Checkpoint ${i + 1}`,
          size: i === 0 || i === checkpoints.length - 1 ? 34 : 24,
        }))
      : [{ id: 'spot', at: spot.at, glyph: spot.kind, colour, title: spot.name, size: 40 }];

  async function rate(n: number) {
    setRateError(null);
    try {
      await store.rateSpot(spot.id, n);
      setRated(true);
    } catch (e) {
      setRateError(e instanceof Error ? e.message : 'Could not save your rating.');
    }
  }

  const canRateNow = canRate(spot, me);
  const mineStars = myRating(spot, me);

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 18, paddingBottom: 48 }}>
      <View style={{ gap: 6 }}>
        <Row>
          <Txt v="eyebrow" style={{ color: colour }}>{PLACE_NAMES[spot.kind].one}</Txt>
          {pending ? <Tag label="Waiting for approval" tone="warning" /> : null}
        </Row>
        <Txt v="h1">{spot.name}</Txt>
        <Txt v="mono" style={{ color: C.chalk }}>
          {[
            spot.kind === 'drive' ? `${driveMiles(spot).toFixed(1)} MI · ${checkpoints.length} CHECKPOINTS · NEVER TIMED` : null,
            !isInfoOnly(spot.kind) ? `${spot.kind === 'drive' ? 'DRIVEN' : 'CHECKED IN'} BY ${people}` : null,
            spot.region ? spot.region.toUpperCase() : null,
          ]
            .filter(Boolean)
            .join(' · ')}
        </Txt>
        {spot.kind === 'drive' ? <DriveTierChip spot={spot} done={done} /> : null}
        {count > 0 ? (
          <Row>
            <Stars value={average} size={18} />
            <Txt v="mono">{average.toFixed(1)} FROM {count} RATING{count > 1 ? 'S' : ''}</Txt>
          </Row>
        ) : !isInfoOnly(spot.kind) ? (
          <Txt v="muted">No ratings yet.</Txt>
        ) : null}
        {spot.phoneOnly && (spot.phoneOnly.completions > 0 || spot.phoneOnly.stars) ? (
          <Row gap={6}>
            <Tag label={ONLY_ON_PHONE} tone="muted" />
            <Txt v="caption" style={{ flexShrink: 1 }}>
              {[
                spot.phoneOnly.completions > 0
                  ? `You ${spot.kind === 'drive' ? 'finished it' : 'checked in'} ${spot.phoneOnly.completions}× before signing in`
                  : null,
                spot.phoneOnly.stars ? `rated it ${spot.phoneOnly.stars}★` : null,
              ]
                .filter(Boolean)
                .join(', ')}
              . Not counted in rep.
            </Txt>
          </Row>
        ) : null}
        <Txt v="muted">{spot.description}</Txt>
        {author ? (
          <UserLink id={author.id} style={{ alignSelf: 'flex-start' }} label={`Open @${author.handle}`}>
            <Txt v="label" style={{ color: BRAND }}>Suggested by <Txt v="label" style={{ color: BRAND, textTransform: 'none' }}>{mine ? 'you' : `@${author.handle}`}</Txt> ›</Txt>
          </UserLink>
        ) : spot.authorId === SYSTEM_AUTHOR ? (
          <Txt v="label" style={{ color: C.fog }}>Added by Nightshift</Txt>
        ) : null}
      </View>

      {spot.warnings?.length ? (
        <Card accent={STATE.warning}>
          <Txt v="label" style={{ color: STATE.warning }}>Before you go</Txt>
          {spot.warnings.map((w) => (
            <Txt key={w} v="muted">{w}</Txt>
          ))}
        </Card>
      ) : null}

      <View style={{ height: 240, borderRadius: RADIUS.sheet, overflow: 'hidden', borderWidth: 1, borderColor: C.kerb }}>
        <NightMap
          pins={pins}
          paths={paths}
          centre={framed.length ? midpoint(framed) : spot.at}
          span={framed.length ? Math.max(spot.kind === 'drive' ? 0.08 : 0.012, spanOf(framed) * 1.6) : 0.05}
          showsUser={!!run}
          credit={spot.kind === 'drive' || outline ? '© OpenStreetMap contributors' : undefined}
        />
      </View>

      {zones.map((zone) => (
        <ZoneNotice key={zone.id} zone={zone} />
      ))}

      {/* A drive's one action is in its panel: "Navigate the drive" (which also counts it). On a photo spot, checking in is the main thing. */}
      {!pending && spot.kind !== 'drive' ? (
        <NavLaunch target={{ kind: 'spot', id: spot.id }} to={spot.at} label="Start navigation" kind={spot.kind === 'photo' ? 'secondary' : 'primary'} />
      ) : null}

      {pending ? (
        <Card>
          <Txt>{mine ? 'Thanks. Your suggestion is waiting for approval.' : 'This place is waiting for approval.'}</Txt>
          {mine ? (
            <Txt v="muted">
              {store.backend === 'local'
                ? "In the demo, suggestions are approved after about 10 seconds. You'll get +50 rep when it's live."
                : "Someone from Nightshift checks each suggestion. You'll get +50 rep when it's live."}
            </Txt>
          ) : null}
        </Card>
      ) : null}

      {!pending && spot.kind === 'drive' ? (
        <DrivePanel
          spot={spot}
          run={run}
          setRun={setRun}
          onFinished={() => {
            setJustDone(true);
            setRated(false);
          }}
        />
      ) : null}

      {!pending && spot.kind === 'photo' ? (
        <VisitPanel
          spot={spot}
          onVisited={() => {
            setJustDone(true);
            setRated(false);
          }}
        />
      ) : null}

      {spot.kind === 'track' ? (
        <>
          <TrackPanel spot={spot} outline={outline} />
          <Card>
            <Txt>Tracks are the only place times count. Look for track days on the Events tab.</Txt>
            <Button label="See events" kind="secondary" onPress={() => router.push('/events')} />
          </Card>
        </>
      ) : null}

      {spot.kind === 'venue' ? (
        <Card>
          <Txt>A place that welcomes meets. Check its own opening times and rules before you go, and keep it clean.</Txt>
        </Card>
      ) : null}

      {!isInfoOnly(spot.kind) && !pending ? (
        <Section title="Rating">
          <Card accent={justDone && !rated ? BRAND : undefined}>
            {mine ? (
              <Txt v="muted">You suggested this, so you can't rate it. You earn rep each time someone else {spot.kind === 'drive' ? 'drives it' : 'checks in here'}.</Txt>
            ) : canRateNow.ok ? (
              <>
                <Txt>
                  {rated
                    ? 'Thanks, rating saved.'
                    : justDone
                      ? `How was it? Rate the ${spot.kind === 'drive' ? 'drive' : 'spot'}.`
                      : mineStars
                        ? 'Your rating. Tap to change it.'
                        : 'Rate it from 1 to 5 stars.'}
                </Txt>
                <Stars value={mineStars ?? 0} onRate={rate} size={34} />
                <Txt v="caption">One rating each. A new one replaces your old one.</Txt>
              </>
            ) : (
              <Txt v="muted">{canRateNow.reason}</Txt>
            )}
            <InlineError message={rateError} />
          </Card>
        </Section>
      ) : null}

      <Photos spot={spot} />

      {done && !justDone && !isInfoOnly(spot.kind) ? (
        <Txt v="caption" style={{ textAlign: 'center' }}>
          You've {spot.kind === 'drive' ? 'finished this drive' : 'checked in here'}.
        </Txt>
      ) : null}
      {spot.authorId && !mine && spot.authorId !== SYSTEM_AUTHOR ? <ReportLink target="spot" id={spot.id} userId={spot.authorId} what="place" /> : null}
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Drives
// ---------------------------------------------------------------------------

function DrivePanel({
  spot,
  run,
  setRun,
  onFinished,
}: {
  spot: Spot;
  run: DriveRun | null;
  setRun: (r: DriveRun | null | ((r: DriveRun | null) => DriveRun | null)) => void;
  onFinished: () => void;
}) {
  const store = useStore();
  const { settings } = store;
  const [error, setError] = useState<string | null>(null);
  // The demo's "skip the GPS check"; signed in, the server always checks where you are.
  const simGps = settings.simulateGps && store.backend === 'local';
  const demo = store.backend === 'local';
  const checkpoints = spot.path ?? [];
  const miles = driveMiles(spot);
  /**
   * "Navigate the drive" opens the driving view, which counts the drive as you
   * pass the checkpoints (drive.tsx). Without Nightshift's own directions (the
   * web preview, an older install, or another directions app chosen in
   * Settings), the checkpoints can still be counted here, without directions.
   */
  const ownNav = Platform.OS === 'ios' && navDirectionsAvailable && (settings.directionsApp ?? 'nightshift') === 'nightshift';
  const watch = useRef<Location.LocationSubscription | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [simulating, setSimulating] = useState(false);
  const [passed, setPassed] = useState(false);
  const runRef = useRef(run);
  runRef.current = run;
  const done = hasCompleted(spot, store.me);

  /** Set once the screen has closed, so a watch that starts late is removed at once. */
  const closed = useRef(false);
  useEffect(() => {
    closed.current = false;
    return () => {
      closed.current = true;
    };
  }, []);

  const stop = useCallback(() => {
    watch.current?.remove();
    watch.current = null;
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setSimulating(false);
  }, []);

  useEffect(() => stop, [stop]);

  // When the last checkpoint is passed, judge the run. Only pass or fail comes back.
  useEffect(() => {
    if (!run || run.passed < checkpoints.length) return;
    stop();
    setRun(null);
    store
      .finishDrive(spot.id, run)
      .then((verdict) => {
        if (verdict.ok) {
          feel.success();
          setPassed(true);
          onFinished();
        } else setError(verdict.reason);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not record the drive.'));
  }, [run, checkpoints.length, spot.id, store, stop, setRun, onFinished]);

  /** Count the checkpoints with GPS here, without directions. */
  async function start() {
    // Tapping twice must not leave an old GPS watch running.
    watch.current?.remove();
    watch.current = null;
    setError(null);
    setPassed(false);
    setRun(NEW_RUN);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!perm.granted) {
        setRun(null);
        setError(
          `Drives need your location to pass the checkpoints. Allow it for Nightshift in Settings${demo ? ` (or, for testing, ${WHERE.demoSkipGps}: skip the GPS check)` : ''}.`,
        );
        return;
      }
      const sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 25 },
        (loc) => {
          const r = runRef.current;
          if (!r) return;
          const t = loc.timestamp || Date.now();
          if (runExpired(r, miles, t)) {
            stop();
            setRun(null);
            setError("That took longer than a drive allows, so it doesn't count. Start again when you're ready.");
            return;
          }
          const next = advanceRun(r, checkpoints, { lat: loc.coords.latitude, lng: loc.coords.longitude }, t);
          if (next !== r) {
            runRef.current = next;
            setRun(next);
          }
        },
      );
      // The screen closed (or the run was cancelled) while the watch was starting: turn GPS off again.
      if (closed.current || !runRef.current) {
        sub.remove();
        return;
      }
      (watch.current as Location.LocationSubscription | null)?.remove();
      watch.current = sub;
    } catch {
      setRun(null);
      setError('Could not read your location. Try again with a clear view of the sky.');
    }
  }

  /** Demo: walk the checkpoints as if driven at a steady, legal pace, so the same checks run. */
  function simulate() {
    setError(null);
    setPassed(false);
    setSimulating(true);
    const from = run ?? NEW_RUN;
    if (!run) setRun(NEW_RUN);
    const times = simulatedTimes(checkpoints, miles, Date.now());
    const offset = from.passed > 0 && from.startedAt !== undefined ? from.startedAt - times[0] : 0;
    timers.current = checkpoints.slice(from.passed).map((p, k) =>
      setTimeout(() => {
        const i = from.passed + k;
        setRun((r) => (r ? advanceRun(r, checkpoints, p, times[i] + offset) : r));
      }, 700 * (k + 1)),
    );
  }

  function cancel() {
    stop();
    setRun(null);
  }

  if (!run) {
    return (
      <Section title="Drive it">
        <Card accent={passed ? STATE.success : undefined}>
          {passed ? (
            <Txt>Drive complete. Every checkpoint passed.{done && spot.authorId !== store.me ? ' Rep added if this was your first time.' : ''}</Txt>
          ) : null}
          <NavLaunch
            target={{ kind: 'spot', id: spot.id }}
            to={checkpoints.length ? checkpoints[0] : spot.at}
            label={done || passed ? 'Navigate it again' : 'Navigate the drive'}
            kind="primary"
          />
          <Txt v="caption">
            {ownNav
              ? `Turn by turn through all ${checkpoints.length} checkpoints. Passing every one in order counts the drive.`
              : `Pass all ${checkpoints.length} checkpoints in order to count the drive.`}{' '}
            Drives are never timed or ranked: you only get pass or fail. Stick to the speed limits, as a run that's too quick doesn't count.
          </Txt>
          {simGps ? (
            <Button label="Simulate the drive" kind="secondary" onPress={simulate} />
          ) : !ownNav ? (
            <Button
              label="Count without directions"
              kind="secondary"
              onPress={start}
              accessibilityHint="Counts the checkpoints with GPS while you drive, with no directions"
            />
          ) : null}
          <InlineError message={error} />
        </Card>
      </Section>
    );
  }

  return (
    <Section title="Driving" right={<Txt v="mono" scale="chrome" style={{ color: BRAND }}>{run.passed}/{checkpoints.length} PASSED</Txt>}>
      <Card accent={LAYER.drive}>
        {checkpoints.map((_, i) => (
          <Row key={i} style={{ flexWrap: 'nowrap' }} gap={10}>
            <Pin glyph="drive" colour={i < run.passed ? STATE.success : i === run.passed ? LAYER.drive : C.fog} size={24} />
            <Txt style={{ flex: 1, color: i < run.passed ? STATE.success : i === run.passed ? C.chalk : C.fog }}>
              {i === 0 ? 'Start' : i === checkpoints.length - 1 ? 'Finish' : `Checkpoint ${i + 1}`}
            </Txt>
            <Txt v="mono" style={{ color: i < run.passed ? STATE.success : C.fog }}>{i < run.passed ? 'PASSED' : i === run.passed ? 'NEXT' : ''}</Txt>
          </Row>
        ))}
        <Txt v="caption">
          {simGps
            ? `Demo: skip the GPS check is on (${WHERE.demoSkipGps}), so the app walks the checkpoints for you at a legal pace.`
            : `Keep the app open. Each checkpoint counts when you're within ${CHECKPOINT_RADIUS_MILES} mi. Eyes on the road.`}
        </Txt>
        {simulating ? <Button label="Driving…" kind="secondary" onPress={simulate} busy /> : null}
        <Button label="Stop" kind="secondary" onPress={cancel} />
        <InlineError message={error} />
      </Card>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Photo spots
// ---------------------------------------------------------------------------

function VisitPanel({ spot, onVisited }: { spot: Spot; onVisited: () => void }) {
  const store = useStore();
  const { settings } = store;
  const [error, setError] = useState<string | null>(null);
  // The demo's "skip the GPS check"; signed in, the server always checks where you are.
  const simGps = settings.simulateGps && store.backend === 'local';
  const [step, setStep] = useState<'idle' | 'photo' | 'done'>('idle');
  const [busy, setBusy] = useState(false);
  /** The fix the distance check used, sent with the check-in (signed in, the server checks it again). */
  const visitFix = useRef<LatLng | null>(null);

  async function checkIn() {
    setError(null);
    setBusy(true);
    try {
      let pos: LatLng | null = null;
      if (!simGps) {
        const fix = await preciseFix();
        if (!fix.ok) {
          setError(
            fix.reason === 'denied'
              ? `Checking in here needs your location. Allow it for Nightshift in Settings${store.backend === 'local' ? ` (or, for testing, ${WHERE.demoSkipGps}: skip the GPS check)` : ''}.`
              : 'Could not read your location. Try again outside.',
          );
          return;
        }
        pos = fix.at;
      }
      visitFix.current = pos;
      const ok = canVisit(spot, pos, simGps);
      if (!ok.ok) setError(ok.reason);
      else setStep('photo');
    } catch {
      setError('Could not read your location. Try again outside.');
    } finally {
      setBusy(false);
    }
  }

  async function save(photo?: string) {
    setError(null);
    try {
      await store.visitSpot(spot.id, photo, visitFix.current);
      feel.success();
      setStep('done');
      onVisited();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save the check-in.');
    }
  }

  // Pick → crop → plate check → save (PhotoFlow.tsx).
  const flow = usePhotoFlow({ onPhoto: (ref) => save(ref), onError: setError, cameraDenied: 'Allow camera access to take a photo here.' });
  const pickPhoto = (camera: boolean) => flow.pick(camera);

  if (flow.view) return flow.view;

  return (
    <Section title="Check in">
      <Card accent={step === 'done' ? STATE.success : undefined}>
        {step === 'idle' ? (
          <>
            <Txt v="muted">
              Check in when you're here (within 0.2 mi), then add a photo if you like. Plates are blurred before anything is saved.
            </Txt>
            <Button label={busy ? 'Checking…' : 'Check in here'} onPress={checkIn} busy={busy} />
          </>
        ) : step === 'photo' ? (
          <>
            <Txt>You're here. Add a photo?</Txt>
            <Row style={{ flexWrap: 'nowrap' }}>
              <Button label="Camera" kind="secondary" style={{ flex: 1 }} onPress={() => pickPhoto(true)} disabled={busy || flow.busy} />
              <Button label="Library" kind="secondary" style={{ flex: 1 }} onPress={() => pickPhoto(false)} disabled={busy || flow.busy} />
            </Row>
            <Button label="Skip the photo" kind="secondary" onPress={() => save()} disabled={busy || flow.busy} />
          </>
        ) : (
          <>
            <Txt>Checked in.{spot.authorId !== store.me ? ' Rep added if this was your first time here.' : ''}</Txt>
            <Button label="Check in again" kind="secondary" onPress={() => setStep('idle')} />
          </>
        )}
        <InlineError message={error} />
      </Card>
    </Section>
  );
}

/** People's own photos from check-ins first (plate-blurred), then public photos taken nearby. */
function Photos({ spot }: { spot: Spot }) {
  // The suggester's photo (photo spots), then check-in photos: all plate-blurred.
  const members = [...(spot.photo ? [{ key: 'suggested', ref: spot.photo }] : []), ...spot.completions.flatMap((c, i) => (c.photo ? [{ key: `${c.userId}-${i}`, ref: c.photo }] : []))];
  const pending = spot.status === 'pending';
  // A drive: look round the middle of the road, wide enough to catch some of it.
  const path = spot.path ?? [];
  const at = spot.kind === 'drive' && path.length ? midpoint(path) : spot.at;
  const radius = radiusFor(spot.kind, spot.kind === 'drive' ? spanOf(path) * 69 : 0);
  return (
    <>
      {members.length || spot.kind === 'photo' ? (
        <Section title={members.length ? `Photos (${members.length})` : 'Photos'}>
          {members.length ? (
            <Row gap={8}>
              {members.map((m) => (
                <Image key={m.key} source={{ uri: photoUri(m.ref) }} style={{ width: 104, height: 104, borderRadius: RADIUS.card, borderWidth: 1, borderColor: C.kerb }} />
              ))}
            </Row>
          ) : (
            <Txt v="caption">No photos yet. Check in here with your car or bike to add the first.</Txt>
          )}
        </Section>
      ) : null}
      {/* Suggestions waiting for approval don't ask Commons yet. */}
      {!pending ? <CommonsStrip at={at} radiusM={radius} placeName={spot.name} /> : null}
    </>
  );
}

/** "Long drive · +175 rep": what finishing this drive for the first time is worth (rep.ts driveTier). */
function DriveTierChip({ spot, done }: { spot: Spot; done: boolean }) {
  const tier = driveTier(spot.miles);
  return (
    <Tag
      tone="brand"
      label={`${tier.label} · +${tier.rep} rep${done ? ' earned' : ''}`}
      accessibilityLabel={`${tier.label}. ${done ? `${tier.rep} rep earned` : `${tier.rep} rep the first time you finish it`}`}
    />
  );
}

function midpoint(points: LatLng[]): LatLng {
  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  return { lat: (Math.min(...lats) + Math.max(...lats)) / 2, lng: (Math.min(...lngs) + Math.max(...lngs)) / 2 };
}

function spanOf(points: LatLng[]): number {
  if (points.length < 2) return 0.05;
  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  return Math.max(Math.max(...lats) - Math.min(...lats), (Math.max(...lngs) - Math.min(...lngs)) / 1.6);
}

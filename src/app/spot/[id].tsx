import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Image, ScrollView, View } from 'react-native';
import { CommonsStrip } from '../../components/CommonsStrip';
import { NightMap } from '../../components/NightMap';
import type { MapPath, MapPin } from '../../components/mapTypes';
import { Pin } from '../../components/Pin';
import { PlateReview, type PendingPhoto } from '../../components/PlateReview';
import { Stars } from '../../components/Stars';
import { TrackPanel } from '../../components/TrackPanel';
import { UserLink } from '../../components/UserLink';
import { Button, Card, Row, Section, Txt } from '../../components/ui';
import { BAN_ZONES } from '../../data/seed';
import { SYSTEM_AUTHOR } from '../../data/places';
import { radiusFor } from '../../lib/commons';
import { banZoneWarning } from '../../lib/events';
import { trackOutline } from '../../lib/tracks';
import { driveTier } from '../../lib/rep';
import { feel } from '../../lib/feel';
import { findPlates, finishPhoto, plateRedactorAvailable, photoUri } from '../../lib/photos';
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
  SPOT_LABELS,
  statsOf,
  type DriveRun,
} from '../../lib/spots';
import { preciseFix } from '../../lib/location';
import { useStore } from '../../lib/store';
import type { LatLng, Spot } from '../../lib/types';
import { C, SPOT_COLOURS } from '../../theme';

/** A drive, photo spot or track: details, start a drive or check in, then rate it. */
export default function SpotScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const nav = useNavigation();
  const { spots } = useStore();
  const spot = spots.find((x) => x.id === id);

  useLayoutEffect(() => {
    if (spot) nav.setOptions({ title: SPOT_LABELS[spot.kind].toUpperCase() });
  }, [nav, spot]);

  if (!spot) {
    return (
      <View style={{ flex: 1, padding: 16 }}>
        <Txt>This place is no longer on Nightshift.</Txt>
      </View>
    );
  }
  return <SpotDetail spot={spot} />;
}

function SpotDetail({ spot }: { spot: Spot }) {
  const store = useStore();
  const { me, users } = store;
  const colour = SPOT_COLOURS[spot.kind];
  const [run, setRun] = useState<DriveRun | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [justDone, setJustDone] = useState(false);
  const [rated, setRated] = useState(false);

  const author = spot.authorId ? users.find((u) => u.id === spot.authorId) : undefined;
  const mine = spot.authorId === me;
  const pending = spot.status === 'pending';
  const done = hasCompleted(spot, me);
  const people = statsOf(spot).completions.length;
  const { average, count } = averageStars(spot);
  const zone = spot.banZone ? BAN_ZONES.find((z) => z.name === spot.banZone) : undefined;
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
          colour: run && i < run.passed ? C.lime : i === 0 || i === checkpoints.length - 1 ? colour : C.fog,
          title: i === 0 ? 'Start' : i === checkpoints.length - 1 ? 'Finish' : `Checkpoint ${i + 1}`,
          size: i === 0 || i === checkpoints.length - 1 ? 34 : 24,
        }))
      : [{ id: 'spot', at: spot.at, glyph: spot.kind, colour, title: spot.name, size: 40 }];

  function rate(n: number) {
    setError(null);
    try {
      store.rateSpot(spot.id, n);
      setRated(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save your rating.');
    }
  }

  const canRateNow = canRate(spot, me);
  const mineStars = myRating(spot, me);

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 18, paddingBottom: 48 }}>
      <View style={{ gap: 6 }}>
        <Row>
          <Txt v="eyebrow" style={{ color: colour }}>{SPOT_LABELS[spot.kind]}</Txt>
          {pending ? <Txt v="eyebrow" style={{ color: C.fog }}>· Waiting for approval</Txt> : null}
        </Row>
        <Txt v="h1">{spot.name}</Txt>
        <Txt v="mono" style={{ color: C.chalk }}>
          {[
            spot.kind === 'drive' ? `${driveMiles(spot).toFixed(1)} MI · ${checkpoints.length} CHECKPOINTS · NEVER TIMED` : null,
            !isInfoOnly(spot.kind) ? `${spot.kind === 'drive' ? 'DRIVEN' : 'VISITED'} BY ${people}` : null,
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
        <Txt v="muted">{spot.description}</Txt>
        {author ? (
          <UserLink id={author.id} style={{ alignSelf: 'flex-start' }} label={`Open @${author.handle}`}>
            <Txt v="label" style={{ color: C.sodium }}>Suggested by <Txt v="label" style={{ color: C.sodium, textTransform: 'none' }}>{mine ? 'you' : `@${author.handle}`}</Txt> ›</Txt>
          </UserLink>
        ) : spot.authorId === SYSTEM_AUTHOR ? (
          <Txt v="label" style={{ color: C.fog }}>Added by Nightshift</Txt>
        ) : null}
      </View>

      {spot.warnings?.length ? (
        <Card accent={C.sodium}>
          <Txt v="label" style={{ color: C.sodium }}>Before you go</Txt>
          {spot.warnings.map((w) => (
            <Txt key={w} v="muted">{w}</Txt>
          ))}
        </Card>
      ) : null}

      <View style={{ height: 240, borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: C.kerb }}>
        <NightMap
          pins={pins}
          paths={paths}
          centre={framed.length ? midpoint(framed) : spot.at}
          span={framed.length ? Math.max(spot.kind === 'drive' ? 0.08 : 0.012, spanOf(framed) * 1.6) : 0.05}
          showsUser={!!run}
          credit={spot.kind === 'drive' || outline ? '© OpenStreetMap contributors' : undefined}
        />
      </View>

      {zone ? (
        <Card accent={C.alert}>
          <Txt>{banZoneWarning(spot.name, zone)}</Txt>
        </Card>
      ) : null}

      {pending ? (
        <Card>
          <Txt>{mine ? 'Thanks. Your suggestion is waiting for approval.' : 'This place is waiting for approval.'}</Txt>
          <Txt v="muted">In the demo, suggestions are approved after about 10 seconds. You'll get +50 rep when it's live.</Txt>
        </Card>
      ) : null}

      {error ? (
        <Card accent={C.alert}>
          <Txt>{error}</Txt>
        </Card>
      ) : null}

      {!pending && spot.kind === 'drive' ? (
        <DrivePanel
          spot={spot}
          run={run}
          setRun={setRun}
          setError={setError}
          onFinished={() => {
            setJustDone(true);
            setRated(false);
          }}
        />
      ) : null}

      {!pending && spot.kind === 'photo' ? (
        <VisitPanel
          spot={spot}
          setError={setError}
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
            <Button label="See events" kind="ghost" onPress={() => router.push('/events')} />
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
          <Card accent={justDone && !rated ? C.sodium : undefined}>
            {mine ? (
              <Txt v="muted">You suggested this, so you can't rate it. You earn rep each time someone else {spot.kind === 'drive' ? 'drives it' : 'visits'}.</Txt>
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
                <Txt v="muted" style={{ fontSize: 12 }}>One rating each. A new one replaces your old one.</Txt>
              </>
            ) : (
              <Txt v="muted">{canRateNow.reason}</Txt>
            )}
          </Card>
        </Section>
      ) : null}

      <Photos spot={spot} />

      {done && !justDone && !isInfoOnly(spot.kind) ? (
        <Txt v="muted" style={{ textAlign: 'center', fontSize: 12 }}>
          You've {spot.kind === 'drive' ? 'finished this drive' : 'visited this spot'}.
        </Txt>
      ) : null}
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
  setError,
  onFinished,
}: {
  spot: Spot;
  run: DriveRun | null;
  setRun: (r: DriveRun | null | ((r: DriveRun | null) => DriveRun | null)) => void;
  setError: (e: string | null) => void;
  onFinished: () => void;
}) {
  const store = useStore();
  const { settings } = store;
  const checkpoints = spot.path ?? [];
  const miles = driveMiles(spot);
  const watch = useRef<Location.LocationSubscription | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [simulating, setSimulating] = useState(false);
  const [passed, setPassed] = useState(false);
  const runRef = useRef(run);
  runRef.current = run;

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
    const verdict = store.finishDrive(spot.id, run);
    setRun(null);
    if (verdict.ok) {
      feel.success();
      setPassed(true);
      onFinished();
    } else setError(verdict.reason);
  }, [run, checkpoints.length, spot.id, store, stop, setRun, setError, onFinished]);

  async function start() {
    // Tapping Start twice must not leave an old GPS watch running.
    watch.current?.remove();
    watch.current = null;
    setError(null);
    setPassed(false);
    setRun(NEW_RUN);
    if (settings.simulateGps) return;
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!perm.granted) {
        setRun(null);
        setError('Drives need your location to pass the checkpoints. Allow it for Nightshift in Settings (or, for testing, Me > Demo: skip the GPS check).');
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

  function simulate() {
    setError(null);
    setSimulating(true);
    const from = run ?? NEW_RUN;
    // Walk the checkpoints as if driven at a steady, legal pace, so the same checks run.
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
        <Card accent={passed ? C.lime : undefined}>
          {passed ? (
            <Txt>Drive complete. Every checkpoint passed.{hasCompleted(spot, store.me) && spot.authorId !== store.me ? ' Rep added if this was your first time.' : ''}</Txt>
          ) : (
            <Txt v="muted">
              Pass all {checkpoints.length} checkpoints in order to finish. Drives are never timed or ranked: you only get pass or fail. Stick to the speed limits, as a run that's too quick doesn't count.
            </Txt>
          )}
          <Button label={passed ? 'Drive it again' : 'Start drive'} kind={passed ? 'ghost' : 'neon'} onPress={start} />
        </Card>
      </Section>
    );
  }

  return (
    <Section title="Driving" right={<Txt v="mono" style={{ color: C.neon }}>{run.passed}/{checkpoints.length} PASSED</Txt>}>
      <Card accent={C.neon}>
        {checkpoints.map((_, i) => (
          <Row key={i} style={{ flexWrap: 'nowrap' }} gap={10}>
            <Pin glyph="drive" colour={i < run.passed ? C.lime : i === run.passed ? C.neon : C.fog} size={24} />
            <Txt style={{ flex: 1, color: i < run.passed ? C.lime : i === run.passed ? C.chalk : C.fog }}>
              {i === 0 ? 'Start' : i === checkpoints.length - 1 ? 'Finish' : `Checkpoint ${i + 1}`}
            </Txt>
            <Txt v="mono" style={{ color: i < run.passed ? C.lime : C.fog }}>{i < run.passed ? 'PASSED' : i === run.passed ? 'NEXT' : ''}</Txt>
          </Row>
        ))}
        <Txt v="muted" style={{ fontSize: 12 }}>
          {settings.simulateGps
            ? 'Demo: skip the GPS check is on (Me), so the app walks the checkpoints for you at a legal pace.'
            : `Keep the app open. Each checkpoint counts when you're within ${CHECKPOINT_RADIUS_MILES} mi. Eyes on the road.`}
        </Txt>
        {settings.simulateGps ? (
          <Button label={simulating ? 'Driving…' : 'Simulate the drive'} kind="neon" onPress={simulate} busy={simulating} />
        ) : null}
        <Button label="Stop" kind="ghost" onPress={cancel} />
      </Card>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Photo spots
// ---------------------------------------------------------------------------

function VisitPanel({ spot, setError, onVisited }: { spot: Spot; setError: (e: string | null) => void; onVisited: () => void }) {
  const store = useStore();
  const { settings } = store;
  const [step, setStep] = useState<'idle' | 'photo' | 'done'>('idle');
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<PendingPhoto | null>(null);

  async function checkIn() {
    setError(null);
    setBusy(true);
    try {
      let pos: LatLng | null = null;
      if (!settings.simulateGps) {
        const fix = await preciseFix();
        if (!fix.ok) {
          setError(
            fix.reason === 'denied'
              ? 'Checking in here needs your location. Allow it for Nightshift in Settings (or, for testing, Me > Demo: skip the GPS check).'
              : 'Could not read your location. Try again outside.',
          );
          return;
        }
        pos = fix.at;
      }
      const ok = canVisit(spot, pos, settings.simulateGps);
      if (!ok.ok) setError(ok.reason);
      else setStep('photo');
    } catch {
      setError('Could not read your location. Try again outside.');
    } finally {
      setBusy(false);
    }
  }

  function save(photo?: string) {
    try {
      store.visitSpot(spot.id, photo);
      feel.success();
      setStep('done');
      setPending(null);
      onVisited();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save the visit.');
    }
  }

  async function pickPhoto(camera: boolean) {
    setError(null);
    try {
      if (camera) {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) return setError('Allow camera access to take a photo here.');
      }
      const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.9, exif: false };
      const res = camera ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
      if (res.canceled) return;
      const a = res.assets[0];
      setBusy(true);
      if (plateRedactorAvailable) {
        const found = await findPlates(a.uri);
        setPending({ uri: a.uri, width: found?.width || a.width, height: found?.height || a.height, boxes: found?.boxes ?? [] });
      } else {
        save(await finishPhoto(a.uri, [], a.width, a.height));
      }
    } catch {
      setError("Couldn't prepare that photo. Try another one.");
    } finally {
      setBusy(false);
    }
  }

  async function confirm(boxes: PendingPhoto['boxes']) {
    if (!pending) return;
    setBusy(true);
    try {
      save(await finishPhoto(pending.uri, boxes, pending.width, pending.height));
    } catch {
      setError("Couldn't blur that photo. Try again.");
    } finally {
      setBusy(false);
    }
  }

  if (pending) return <PlateReview photo={pending} onDone={confirm} onCancel={() => setPending(null)} busy={busy} />;

  return (
    <Section title="Visit">
      <Card accent={step === 'done' ? C.lime : step === 'photo' ? C.neon : undefined}>
        {step === 'idle' ? (
          <>
            <Txt v="muted">
              Check in when you're here (within 0.2 mi), then add a photo if you like. Plates are blurred before anything is saved.
            </Txt>
            <Button label={busy ? 'Checking…' : 'Check in here'} kind="neon" onPress={checkIn} busy={busy} />
          </>
        ) : step === 'photo' ? (
          <>
            <Txt>You're here. Add a photo?</Txt>
            <Row style={{ flexWrap: 'nowrap' }}>
              <Button label="Camera" kind="neon" style={{ flex: 1 }} onPress={() => pickPhoto(true)} disabled={busy} />
              <Button label="Library" kind="ghost" style={{ flex: 1 }} onPress={() => pickPhoto(false)} disabled={busy} />
            </Row>
            <Button label="Skip the photo" kind="ghost" onPress={() => save()} disabled={busy} />
          </>
        ) : (
          <>
            <Txt>Visit saved.{spot.authorId !== store.me ? ' Rep added if this was your first visit.' : ''}</Txt>
            <Button label="Check in again" kind="ghost" onPress={() => setStep('idle')} />
          </>
        )}
      </Card>
    </Section>
  );
}

/** People's own photos from visits first (plate-blurred), then public photos taken nearby. */
function Photos({ spot }: { spot: Spot }) {
  const photos = spot.completions.filter((c) => c.photo);
  const pending = spot.status === 'pending';
  // A drive: look round the middle of the road, wide enough to catch some of it.
  const path = spot.path ?? [];
  const at = spot.kind === 'drive' && path.length ? midpoint(path) : spot.at;
  const radius = radiusFor(spot.kind, spot.kind === 'drive' ? spanOf(path) * 69 : 0);
  return (
    <Section title={photos.length ? `Photos (${photos.length})` : 'Photos'}>
      {photos.length ? (
        <Row gap={8}>
          {photos.map((c, i) => (
            <Image key={`${c.userId}-${i}`} source={{ uri: photoUri(c.photo!) }} style={{ width: 104, height: 104, borderRadius: 6, borderWidth: 1, borderColor: C.kerb }} />
          ))}
        </Row>
      ) : spot.kind === 'photo' ? (
        <Txt v="muted" style={{ fontSize: 13 }}>No photos from visits yet. Check in here to add the first.</Txt>
      ) : null}
      {/* Suggestions waiting for approval don't ask Commons yet. */}
      {!pending ? <CommonsStrip at={at} radiusM={radius} placeName={spot.name} /> : null}
    </Section>
  );
}

/** "Long drive · +175 rep": what finishing this drive for the first time is worth (rep.ts driveTier). */
function DriveTierChip({ spot, done }: { spot: Spot; done: boolean }) {
  const tier = driveTier(spot.miles);
  return (
    <View
      style={{ alignSelf: 'flex-start', borderWidth: 1, borderColor: C.neon, backgroundColor: `${C.neon}1f`, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3 }}
      accessibilityLabel={`${tier.label}. ${done ? `${tier.rep} rep earned` : `${tier.rep} rep the first time you finish it`}`}
    >
      <Txt v="label" style={{ color: C.neon }}>
        {tier.label} · +{tier.rep} rep{done ? ' earned' : ''}
      </Txt>
    </View>
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

import * as Location from 'expo-location';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Image, Platform, ScrollView, View, type ImageSourcePropType } from 'react-native';
import { navDirectionsAvailable } from '../../../modules/nav-directions';
import { openReport } from '../../components/Community';
import { CommonsStrip } from '../../components/CommonsStrip';
import { Callout, CheckInCelebration, DetailHero, MediaFrame, NotFoundState, PAGE } from '../../components/Detail';
import { Button, displayHandle, DsText, EmptyState, ErrorState, ListRow, screenHeader, Section, Sheet, SheetOption, StatBlock, Tag, type Stat } from '../../components/ds';
import type { MapPath, MapPin } from '../../components/mapTypes';
import { NavLaunch } from '../../components/NavLaunch';
import { NightMap } from '../../components/NightMap';
import { usePhotoFlow } from '../../components/PhotoFlow';
import { Stars } from '../../components/Stars';
import { TrackPanel } from '../../components/TrackPanel';
import { ZoneNotice } from '../../components/ZoneCard';
import { SYSTEM_AUTHOR } from '../../data/places';
import { BAN_ZONES } from '../../data/seed';
import { radiusFor } from '../../lib/commons';
import { plural } from '../../lib/format';
import { ONLY_ON_PHONE, PLACE_NAMES } from '../../lib/glossary';
import { preciseFix } from '../../lib/location';
import { photoUri } from '../../lib/photos';
import { driveTier, REP } from '../../lib/rep';
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
import { useStore } from '../../lib/store';
import { trackOutline } from '../../lib/tracks';
import type { LatLng, Spot } from '../../lib/types';
import { COLOR, LAYER, RADII, SPACING, SPOT_COLOURS } from '../../theme';
import { samplePhoto } from '../../lib/photoSource';
import { PhotoCredit } from '../../components/PhotoCredit';

/** A drive, photo spot or track: details, start a drive or check in, then rate it. */
export default function SpotScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { spots } = useStore();
  const spot = spots.find((x) => x.id === id);
  // The header stays blank: the kind is the eyebrow under it, once.
  if (!spot) return <NotFoundState what="Place" message="This place is no longer on Nightshift." />;
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
  const [menu, setMenu] = useState(false);

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

  // A drive: the line, with the start and finish pinned (and the next checkpoint while driving), not a
  // pin on every checkpoint (REVIEW-8: 18 hexes in a row read as a caterpillar).
  const placePhoto = samplePhoto(spot.id);
  const pins: MapPin[] =
    spot.kind === 'drive'
      ? checkpoints.flatMap((p, i) => (i === 0 || i === checkpoints.length - 1 || (run && i === run.passed) ? [{ p, i }] : [])).map(({ p, i }) => ({
          id: `cp${i}`,
          at: p,
          glyph: 'drive' as const,
          colour: run && i < run.passed ? COLOR.state.success : i === 0 || i === checkpoints.length - 1 ? colour : COLOR.text.secondary,
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
      setRateError(e instanceof Error ? e.message : "Couldn't save your rating.");
    }
  }

  const canRateNow = canRate(spot, me);
  const mineStars = myRating(spot, me);
  const canReport = !!spot.authorId && !mine && spot.authorId !== SYSTEM_AUTHOR;
  const photoCount = (spot.photo ? 1 : 0) + spot.completions.filter((c) => c.photo).length;

  // One fixed set per kind: a drive's length, checkpoints and who's driven it; a photo spot's check-ins, rating and photos.
  const stats: Stat[] =
    spot.kind === 'drive'
      ? [
          { label: 'Length', value: driveMiles(spot).toFixed(1), unit: 'mi' },
          { label: 'Checkpoints', value: String(checkpoints.length) },
          { label: 'Driven by', value: String(people) },
        ]
      : spot.kind === 'photo'
        ? [
            { label: 'Checked in', value: String(people) },
            { label: 'Rating', value: count ? average.toFixed(1) : '–', unit: count ? '/ 5' : undefined },
            { label: 'Photos', value: String(photoCount) },
          ]
        : [];

  const navTarget = { kind: 'spot' as const, id: spot.id };

  return (
    <ScrollView style={{ backgroundColor: COLOR.surface.bg }} contentContainerStyle={PAGE}>
      <Stack.Screen options={screenHeader({ onMenu: canReport ? () => setMenu(true) : undefined })} />
      <DetailHero
        kind={PLACE_NAMES[spot.kind].one}
        colour={colour}
        glyph={spot.kind}
        status={pending ? { label: 'Waiting for approval', tone: 'warning' } : done && !isInfoOnly(spot.kind) ? { label: spot.kind === 'drive' ? 'Driven' : 'Checked in', tone: 'success' } : null}
        title={spot.name}
        lines={[spot.region, spot.kind === 'drive' ? 'Never timed: pass or fail' : null]}
      >
        {spot.kind === 'drive' ? <DriveTierTag spot={spot} done={done} /> : null}
        {count > 0 ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
            <Stars value={average} size={18} />
            <DsText v="meta">
              {average.toFixed(1)} from {plural(count, 'rating')}
            </DsText>
          </View>
        ) : !isInfoOnly(spot.kind) ? (
          <DsText v="meta">No ratings yet</DsText>
        ) : null}
        <DsText v="secondary">{spot.description}</DsText>
        {author ? (
          <Button tier="tertiary" size="sm" style={{ marginLeft: -SPACING.xs }} label={`Suggested by ${mine ? 'you' : displayHandle(author.handle)} ›`} onPress={() => router.push({ pathname: '/user/[id]', params: { id: author.id } })} />
        ) : spot.authorId === SYSTEM_AUTHOR ? (
          <DsText v="caption">Added by Nightshift</DsText>
        ) : null}
        {spot.phoneOnly && (spot.phoneOnly.completions > 0 || spot.phoneOnly.stars) ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, flexWrap: 'wrap' }}>
            <Tag label={ONLY_ON_PHONE} />
            <DsText v="caption" style={{ flexShrink: 1 }}>
              {[
                spot.phoneOnly.completions > 0 ? `You ${spot.kind === 'drive' ? 'finished it' : 'checked in'} ${spot.phoneOnly.completions}× before signing in` : null,
                spot.phoneOnly.stars ? `rated it ${spot.phoneOnly.stars} stars` : null,
              ]
                .filter(Boolean)
                .join(', ')}
              . Not counted in rep.
            </DsText>
          </View>
        ) : null}
      </DetailHero>

      {stats.length ? <StatBlock stats={stats} /> : null}

      {spot.warnings?.length ? (
        <Callout tone="warning" title="Before you go">
          <View style={{ gap: SPACING.xs }}>
            {spot.warnings.map((w) => (
              <DsText key={w} v="secondary">
                {w}
              </DsText>
            ))}
          </View>
        </Callout>
      ) : null}
      {__DEV__ && spot.devNotes?.length ? <DsText v="caption">{`Data notes (development builds only): ${spot.devNotes.join(' ')}`}</DsText> : null}
      {zones.map((zone) => (
        <ZoneNotice key={zone.id} zone={zone} subject="This place" />
      ))}

      {pending ? (
        <Callout tone="info" title={mine ? 'Thanks. Your suggestion is waiting for approval.' : 'This place is waiting for approval.'}>
          {mine
            ? store.backend === 'local'
              ? "In the demo, suggestions are approved after about 10 seconds. You'll get +50 rep when it's live."
              : "Someone from Nightshift checks each suggestion. You'll get +50 rep when it's live."
            : undefined}
        </Callout>
      ) : null}

      {/* One primary per place: a drive's Navigate (which also counts it), a photo spot's Check in, Navigate everywhere else. */}
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
      {!pending && isInfoOnly(spot.kind) ? <NavLaunch target={navTarget} to={spot.at} kind="primary" /> : null}

      {/* A photo of the place itself, from Wikimedia Commons, credited (REVIEW-8: "a photo spot with no photo"). */}
      {placePhoto ? (
        <View>
          <Image
            source={placePhoto.image as ImageSourcePropType}
            style={{ width: '100%', aspectRatio: 4 / 3, borderRadius: RADII.card, backgroundColor: COLOR.surface.media }}
            resizeMode="cover"
            accessibilityLabel={`Photo: ${placePhoto.title}`}
            accessibilityIgnoresInvertColors
          />
          <PhotoCredit photoRef={spot.id} kind="place" overlay />
        </View>
      ) : null}

      <MediaFrame height={220}>
        <NightMap
          pins={pins}
          paths={paths}
          centre={framed.length ? midpoint(framed) : spot.at}
          span={framed.length ? Math.max(spot.kind === 'drive' ? 0.08 : 0.012, spanOf(framed) * 1.6) : 0.05}
          showsUser={!!run}
          credit={spot.kind === 'drive' || outline ? '© OpenStreetMap contributors' : undefined}
        />
      </MediaFrame>

      {spot.kind === 'track' ? (
        <>
          <TrackPanel spot={spot} outline={outline} />
          <Callout tone="neutral" title="Tracks are the only place times count." right={<Button tier="tertiary" size="sm" label="Events ›" onPress={() => router.push('/events')} />}>
            Look for track days in Events.
          </Callout>
        </>
      ) : null}

      {spot.kind === 'venue' ? (
        <Callout tone="neutral" title="A place that welcomes meets">
          Check its own opening times and rules before you go, and keep it clean.
        </Callout>
      ) : null}

      {!isInfoOnly(spot.kind) && !pending ? (
        <Section title="Rating">
          {mine ? (
            <DsText v="secondary">You suggested this, so you can't rate it. You earn rep each time someone else {spot.kind === 'drive' ? 'drives it' : 'checks in here'}.</DsText>
          ) : canRateNow.ok ? (
            <View style={{ gap: SPACING.sm }}>
              <DsText v={justDone && !rated ? 'bodyStrong' : 'body'}>
                {rated ? 'Thanks, rating saved.' : justDone ? `How was it? Rate the ${spot.kind === 'drive' ? 'drive' : 'spot'}.` : mineStars ? 'Your rating. Tap to change it.' : 'Rate it from 1 to 5 stars.'}
              </DsText>
              <Stars value={mineStars ?? 0} onRate={rate} size={34} />
              <DsText v="caption">One rating each. A new one replaces your old one.</DsText>
            </View>
          ) : (
            <DsText v="secondary">{canRateNow.reason}</DsText>
          )}
          {rateError ? <ErrorState title={rateError} /> : null}
        </Section>
      ) : null}

      <Photos spot={spot} />

      <Sheet visible={menu} title="Place options" onClose={() => setMenu(false)}>
        <View>
          <SheetOption
            label="Report this place"
            onPress={() => {
              setMenu(false);
              openReport('spot', spot.id, spot.authorId, 'place');
            }}
          />
        </View>
      </Sheet>
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
  // The demo never needs you to be there: the app drives the checkpoints for you at a legal pace.
  // Signed in, GPS counts them and the server checks the run again.
  const demo = store.backend === 'local';
  const simGps = demo;
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
  /** Finished before this screen opened: rep is for the first finish only. */
  const [doneBefore] = useState(done);
  const firstFinish = !doneBefore;

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
          setPassed(true);
          onFinished();
        } else setError(verdict.reason);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Couldn't record the drive."));
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
          'Drives need your location to pass the checkpoints. Allow it for Nightshift in Settings.',
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
      setError("Couldn't read your location. Try again with a clear view of the sky.");
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
    // One primary, "Start the drive" (REVIEW-8): Nightshift's own directions count it as you go; without
    // them (the web preview, another directions app) the checkpoints are counted here; the demo drives it for you.
    const startLabel = done || passed ? 'Drive it again' : 'Start the drive';
    return (
      <View style={{ gap: SPACING.md }}>
        {passed ? (
          <CheckInCelebration
            play
            title="Drive complete"
            body={`Every checkpoint passed.${spot.authorId === store.me ? '' : firstFinish ? ` +${driveTier(spot.miles).rep} rep.` : ' Rep is for the first finish only.'}`}
          />
        ) : null}
        {ownNav && !simGps ? (
          <NavLaunch target={{ kind: 'spot', id: spot.id }} to={checkpoints.length ? checkpoints[0] : spot.at} toName="the start" label={startLabel} kind="primary" />
        ) : (
          <>
            <Button
              label={startLabel}
              size="lg"
              block
              onPress={simGps ? simulate : start}
              accessibilityHint={simGps ? 'Demo: drives the checkpoints for you at a legal pace' : 'Counts the checkpoints with GPS while you drive'}
            />
            <NavLaunch target={{ kind: 'spot', id: spot.id }} to={checkpoints.length ? checkpoints[0] : spot.at} toName="the start" label="Directions to the start" kind="secondary" />
          </>
        )}
        <DsText v="caption">
          {`Pass all ${checkpoints.length} checkpoints in order to count it. Stick to the speed limits: a run that's too quick doesn't count.${simGps ? ' Demo: location check skipped, the app drives it for you.' : ''}`}
        </DsText>
        {error ? <ErrorState title={error} /> : null}
      </View>
    );
  }

  return (
    <Section title="Driving" right={<Tag label={`${run.passed} of ${checkpoints.length} passed`} tone="live" />}>
      <View>
        {checkpoints.map((_, i) => (
          <ListRow
            key={i}
            leading={{ pin: 'drive', colour: i < run.passed ? COLOR.state.success : i === run.passed ? LAYER.drive : COLOR.text.secondary }}
            title={i === 0 ? 'Start' : i === checkpoints.length - 1 ? 'Finish' : `Checkpoint ${i + 1}`}
            trailing={i < run.passed ? <Tag label="Passed" tone="success" /> : i === run.passed ? <Tag label="Next" /> : undefined}
          />
        ))}
      </View>
      <DsText v="caption">
        {simGps
          ? 'Demo: location check skipped, so the app drives the checkpoints for you at a legal pace.'
          : `Keep the app open. Each checkpoint counts when you're within ${CHECKPOINT_RADIUS_MILES} mi. Eyes on the road.`}
      </DsText>
      {simulating ? <Button label="Driving" tier="secondary" block busy onPress={simulate} /> : null}
      <Button label="Stop" tier="secondary" block onPress={cancel} />
      {error ? <ErrorState title={error} /> : null}
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Photo spots
// ---------------------------------------------------------------------------

function VisitPanel({ spot, onVisited }: { spot: Spot; onVisited: () => void }) {
  const store = useStore();
  const [error, setError] = useState<string | null>(null);
  // The demo never blocks a check-in on distance; signed in, the server always checks where you are.
  const simGps = store.backend === 'local';
  const visitedBefore = useRef(hasCompleted(spot, store.me)).current;
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
              ? 'Checking in here needs your location. Allow it for Nightshift in Settings.'
              : "Couldn't read your location. Try again outside.",
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
      setError("Couldn't read your location. Try again outside.");
    } finally {
      setBusy(false);
    }
  }

  async function save(photo?: string) {
    setError(null);
    try {
      await store.visitSpot(spot.id, photo, visitFix.current);
      setStep('done');
      onVisited();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save the check-in.");
    }
  }

  // Pick → crop → plate check → save (PhotoFlow.tsx).
  const flow = usePhotoFlow({ onPhoto: (ref) => save(ref), onError: setError, cameraDenied: 'Allow camera access to take a photo here.' });
  const pickPhoto = (camera: boolean) => flow.pick(camera);

  if (flow.view) return flow.view;

  if (step === 'done') {
    return (
      <View style={{ gap: SPACING.md }}>
        <CheckInCelebration
          play={false}
          title={`Checked in at ${spot.name}`}
          body={spot.authorId === store.me ? undefined : visitedBefore ? 'Rep is for your first visit only.' : `+${REP.photoSpot} rep for your first visit.`}
        />
        <NavLaunch target={{ kind: 'spot', id: spot.id }} to={spot.at} kind="secondary" />
        <Button label="Check in again" tier="tertiary" size="sm" style={{ alignSelf: 'center' }} onPress={() => setStep('idle')} />
      </View>
    );
  }

  return (
    <View style={{ gap: SPACING.md }}>
      {step === 'idle' ? (
        <>
          <Button label="Check in here" size="lg" block busy={busy} onPress={checkIn} accessibilityHint={simGps ? undefined : 'Checks you are within 0.2 mi of the spot'} />
          {error ? <ErrorState title={error} /> : null}
          <DsText v="caption">
            {simGps
              ? 'Demo: location check skipped. Add a photo after if you like; plates are blurred before anything is saved.'
              : "Check in when you're here (within 0.2 mi), then add a photo if you like. Plates are blurred before anything is saved."}
          </DsText>
          <NavLaunch target={{ kind: 'spot', id: spot.id }} to={spot.at} kind="secondary" />
        </>
      ) : (
        <>
          {/* The same check-in moment as an event's (the burst, the tick, the buzz). */}
          <CheckInCelebration play title={`You're at ${spot.name}`} body="Add a photo? Plates are blurred before anything is saved." />
          <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
            <Button label="Camera" style={{ flex: 1 }} block onPress={() => pickPhoto(true)} disabled={busy || flow.busy} />
            <Button label="Library" tier="secondary" style={{ flex: 1 }} block onPress={() => pickPhoto(false)} disabled={busy || flow.busy} />
          </View>
          <Button label="Skip the photo" tier="tertiary" size="sm" style={{ alignSelf: 'center' }} onPress={() => save()} disabled={busy || flow.busy} />
          {error ? <ErrorState title={error} /> : null}
        </>
      )}
    </View>
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
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm }}>
              {members.map((m) => (
                <Image key={m.key} source={{ uri: photoUri(m.ref) }} style={{ width: 104, height: 104, borderRadius: RADII.card, borderWidth: 1, borderColor: COLOR.surface.border, backgroundColor: COLOR.surface.media }} />
              ))}
            </View>
          ) : (
            <EmptyState variant="inline" title="No photos yet. Check in here with your car or bike to add the first." />
          )}
        </Section>
      ) : null}
      {/* Suggestions waiting for approval don't ask Commons yet. */}
      {!pending ? <CommonsStrip at={at} radiusM={radius} placeName={spot.name} /> : null}
    </>
  );
}

/** "Long drive · +175 rep": what finishing this drive for the first time is worth (rep.ts driveTier). */
function DriveTierTag({ spot, done }: { spot: Spot; done: boolean }) {
  const tier = driveTier(spot.miles);
  return (
    <Tag
      tone={done ? 'success' : 'neutral'}
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

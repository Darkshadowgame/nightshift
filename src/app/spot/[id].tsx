import * as Location from 'expo-location';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Platform, ScrollView, View } from 'react-native';
import { navDirectionsAvailable } from '../../../modules/nav-directions';
import { openReport } from '../../components/Community';
import { CommonsStrip } from '../../components/CommonsStrip';
import { useShareLink } from '../../components/ShareLink';
import { Callout, CheckInCelebration, MediaFrame, NotFoundState } from '../../components/Detail';
import {
  ActionBar,
  Button,
  ChipGroup,
  displayHandle,
  DsText,
  EmptyState,
  ErrorState,
  Hero,
  ListRow,
  PAGE_WITH_BAR,
  screenHeader,
  Section,
  Sheet,
  SheetOption,
  StatBlock,
  Tag,
  type ActionBarButton,
  type Stat,
  FitImage,
} from '../../components/ds';
import type { MapPath, MapPin } from '../../components/mapTypes';
import { useNavLaunch } from '../../components/NavLaunch';
import { NightMap } from '../../components/NightMap';
import { usePhotoFlow } from '../../components/PhotoFlow';
import { PhotoCredit } from '../../components/PhotoCredit';
import { Stars } from '../../components/Stars';
import { TrackPanel } from '../../components/TrackPanel';
import { ZoneNotice } from '../../components/ZoneCard';
import { SYSTEM_AUTHOR } from '../../data/places';
import { BAN_ZONES } from '../../data/seed';
import { appNow, realNowMs } from '../../lib/appClock';
import { radiusFor } from '../../lib/commons';
import { canTagFeel, FEEL_LABELS, FEELS, savedFeelTags, setFeels, topFeels, type Feel } from '../../lib/driveFeel';
import { driveSun, QUIET_CAVEAT, QUIET_WINDOW } from '../../lib/driveTimes';
import { groupDriveShare } from '../../lib/groupDrive';
import { plural } from '../../lib/format';
import { ONLY_ON_PHONE, PLACE_NAMES } from '../../lib/glossary';
import { preciseFix } from '../../lib/location';
import { targetParams } from '../../lib/navPlan';
import { photoUri } from '../../lib/photos';
import { samplePhoto } from '../../lib/photoSource';
import { driveTier } from '../../lib/rep';
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

/** What a panel puts on the page and in the ActionBar (one primary, at most one secondary). */
interface Panel {
  body: ReactNode;
  bar: { primary?: ActionBarButton | null; secondary?: ActionBarButton | null; status?: string | null } | null;
}

/**
 * A drive, photo spot, track or meet spot (T3 detail, Redesign 2 3.14): Hero (the photo first) →
 * facts → map → sections → ActionBar. A drive's one primary is Start (it navigates and counts the
 * drive); a photo spot's is Check in; anything else, Navigate.
 */
export default function SpotScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { spots } = useStore();
  const spot = spots.find((x) => x.id === id);
  // The header stays blank: the Hero carries the kind and the name.
  if (!spot) return <NotFoundState what="Place" message="This place is no longer on Slipstream." />;
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
  const sharer = useShareLink();
  // Feels: tagged by people who have driven it, kept on this phone (driveFeel.ts).
  const feelTags = savedFeelTags(store.settings.driveFeels);
  const feels = spot.kind === 'drive' ? topFeels(spot, feelTags) : [];
  const sun = spot.kind === 'drive' ? driveSun(appNow(), (spot.path?.length ? spot.path[Math.floor(spot.path.length / 2)] : spot.at)) : null;

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

  const finished = useCallback(() => {
    setJustDone(true);
    setRated(false);
  }, []);
  const nav = useNavLaunch({ target: { kind: 'spot', id: spot.id }, to: spot.kind === 'drive' && checkpoints.length ? checkpoints[0] : spot.at, toName: spot.kind === 'drive' ? 'the start' : spot.name });
  const drive = useDrivePanel(spot, run, setRun, finished, nav);
  const visit = useVisitPanel(spot, finished, nav);
  const panel: Panel | null = pending
    ? null
    : spot.kind === 'drive'
      ? drive
      : spot.kind === 'photo'
        ? visit
        : { body: null, bar: { primary: { label: nav.label, onPress: nav.open } } };

  const map = (
    <MediaFrame height={placePhoto ? 200 : 220}>
      <NightMap
        labels={false}
        pins={pins}
        paths={paths}
        centre={framed.length ? midpoint(framed) : spot.at}
        span={framed.length ? Math.max(spot.kind === 'drive' ? 0.08 : 0.012, spanOf(framed) * 1.6) : 0.05}
        showsUser={!!run}
        credit={spot.kind === 'drive' || outline ? '© OpenStreetMap contributors' : undefined}
      />
    </MediaFrame>
  );

  const doneTag = pending
    ? { label: 'Waiting for approval', tone: 'warning' as const }
    : done && !isInfoOnly(spot.kind)
      ? { label: '✓ Done', tone: 'success' as const }
      : null;

  return (
    <View style={{ flex: 1, backgroundColor: COLOR.surface.bg }}>
      <Stack.Screen
        options={screenHeader({
          // A leader shares the drive with regroup points into any chat or group (groupDrive.ts).
          action: spot.kind === 'drive' && !pending && checkpoints.length > 1 ? { label: 'Share', accessibilityLabel: 'Share this drive with your group', onPress: () => void sharer.share(groupDriveShare(spot)) } : undefined,
          onMenu: canReport ? () => setMenu(true) : undefined,
        })}
      />
      <ScrollView contentContainerStyle={PAGE_WITH_BAR}>
        {/* The photo first (a photo of the place from Wikimedia Commons, credited through the ⓘ); else the map. */}
        <Hero
          bleed
          photo={placePhoto ? placePhoto.image : null}
          media={placePhoto ? undefined : map}
          eyebrow={PLACE_NAMES[spot.kind].one}
          layerColour={colour}
          glyph={spot.kind}
          title={spot.name}
          tag={doneTag}
          meta={[spot.region, spot.kind === 'drive' ? `${driveTier(spot.miles).label} · never timed, pass or fail` : null]}
          overlay={placePhoto ? <PhotoCredit photoRef={spot.id} kind="place" overlay corner="topRight" /> : undefined}
        >
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
          {feels.length ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs }}>
              {feels.map((f) => (
                <Tag key={f.feel} label={FEEL_LABELS[f.feel]} />
              ))}
            </View>
          ) : null}
          <DsText v="secondary">{spot.description}</DsText>
          {author ? (
            <Button tier="tertiary" size="sm" style={{ marginLeft: -SPACING.xs }} label={`Suggested by ${mine ? 'you' : displayHandle(author.handle)} ›`} onPress={() => router.push({ pathname: '/user/[id]', params: { id: author.id } })} />
          ) : spot.authorId === SYSTEM_AUTHOR ? (
            <DsText v="caption">Added by Slipstream</DsText>
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
                .
              </DsText>
            </View>
          ) : null}
        </Hero>

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
        {zones.map((zone) => (
          <ZoneNotice key={zone.id} zone={zone} subject="This place" />
        ))}

        {pending ? (
          <Callout tone="info" title={mine ? 'Thanks. Your suggestion is waiting for approval.' : 'This place is waiting for approval.'}>
            {mine ? (store.backend === 'local' ? 'In the demo, suggestions are approved after about 10 seconds.' : 'Someone from Slipstream checks each suggestion before it goes on the map.') : undefined}
          </Callout>
        ) : null}

        {panel?.body}

        {placePhoto ? map : null}

        {sun ? (
          <Section title="Best time to drive it">
            <DsText v="body">{sun.note ?? `Sunrise ${sun.sunrise} · Sunset ${sun.sunset} today`}</DsText>
            <DsText v="secondary">{QUIET_WINDOW}</DsText>
            <DsText v="caption">{QUIET_CAVEAT}</DsText>
          </Section>
        ) : null}

        {spot.kind === 'track' ? (
          <>
            <TrackPanel spot={spot} outline={outline} />
            <Callout tone="neutral" title="Tracks are the only place times count.">
              Look for track days on Tonight.
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
              <DsText v="secondary">You suggested this, so you can't rate it.</DsText>
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
            {spot.kind === 'drive' ? (
              canTagFeel(spot, me) ? (
                <ChipGroup<Feel>
                  label="How did it feel?"
                  options={FEELS.map((f) => ({ key: f, label: FEEL_LABELS[f] }))}
                  selected={feelTags[spot.id] ?? []}
                  onChange={(next) => store.setSettings({ driveFeels: setFeels(feelTags, spot.id, next) })}
                  allLabel="Not sure"
                />
              ) : !mine && !done ? (
                <DsText v="caption">Drive it to say how it felt.</DsText>
              ) : null
            ) : null}
          </Section>
        ) : null}

        <Photos spot={spot} />
      </ScrollView>
      {panel?.bar ? <ActionBar {...panel.bar} /> : null}
      {nav.sheet}
      {sharer.sheet}

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
    </View>
  );
}

type Nav = ReturnType<typeof useNavLaunch>;

// ---------------------------------------------------------------------------
// Drives
// ---------------------------------------------------------------------------

/**
 * A drive's one primary is **Start**: it opens the driving view, which navigates and counts the
 * drive as you pass the checkpoints (drive.tsx; the demo drives it for you). Without Slipstream's
 * directions (signed in on the web preview, an older install, another directions app chosen),
 * Start counts the checkpoints here on GPS, and directions go in the secondary. The one other way
 * to count it (on GPS with no directions; in the demo, driven for you on this page) is the secondary.
 */
function useDrivePanel(
  spot: Spot,
  run: DriveRun | null,
  setRun: (r: DriveRun | null | ((r: DriveRun | null) => DriveRun | null)) => void,
  onFinished: () => void,
  nav: Nav,
): Panel {
  const store = useStore();
  const { settings } = store;
  const [error, setError] = useState<string | null>(null);
  // The demo never needs you to be there: the app drives the checkpoints for you at a legal pace.
  // Signed in, GPS counts them and the server checks the run again.
  const demo = store.backend === 'local';
  const checkpoints = spot.path ?? [];
  const miles = driveMiles(spot);
  /** The driving view counts the drive: in the demo everywhere, signed in with Slipstream's own directions on the iPhone. */
  const driveView = demo || (Platform.OS === 'ios' && navDirectionsAvailable && (settings.directionsApp ?? 'nightshift') === 'nightshift');
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

  const end = useCallback(() => {
    watch.current?.remove();
    watch.current = null;
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setSimulating(false);
  }, []);

  useEffect(() => end, [end]);

  // When the last checkpoint is passed, judge the run. Only pass or fail comes back.
  useEffect(() => {
    if (!run || run.passed < checkpoints.length) return;
    end();
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
  }, [run, checkpoints.length, spot.id, store, end, setRun, onFinished]);

  /** Count the checkpoints with GPS here, without directions. */
  async function countOnGps() {
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
        setError('Drives need your location to pass the checkpoints. Allow it for Slipstream in Settings.');
        return;
      }
      const sub = await Location.watchPositionAsync({ accuracy: Location.Accuracy.High, distanceInterval: 25 }, (loc) => {
        const r = runRef.current;
        if (!r) return;
        const t = loc.timestamp || realNowMs();
        if (runExpired(r, miles, t)) {
          end();
          setRun(null);
          setError("That took longer than a drive allows, so it doesn't count. Start again when you're ready.");
          return;
        }
        const next = advanceRun(r, checkpoints, { lat: loc.coords.latitude, lng: loc.coords.longitude }, t);
        if (next !== r) {
          runRef.current = next;
          setRun(next);
        }
      });
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

  /** Demo: pass the checkpoints here as if driven at a steady, legal pace, so the same checks run. */
  function simulate() {
    setError(null);
    setPassed(false);
    setSimulating(true);
    const from = run ?? NEW_RUN;
    if (!run) setRun(NEW_RUN);
    const times = simulatedTimes(checkpoints, miles, appNow().getTime());
    const offset = from.passed > 0 && from.startedAt !== undefined ? from.startedAt - times[0] : 0;
    timers.current = checkpoints.slice(from.passed).map((p, k) =>
      setTimeout(() => {
        const i = from.passed + k;
        setRun((r) => (r ? advanceRun(r, checkpoints, p, times[i] + offset) : r));
      }, 700 * (k + 1)),
    );
  }

  function cancel() {
    end();
    setRun(null);
  }

  if (run) {
    return {
      body: (
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
            {simulating
              ? 'Demo: the app drives the checkpoints for you at a legal pace.'
              : `Keep the app open. Each checkpoint counts when you're within ${CHECKPOINT_RADIUS_MILES} mi. Eyes on the road.`}
          </DsText>
          {error ? <ErrorState title={error} /> : null}
        </Section>
      ),
      bar: { status: simulating ? 'Driving it for you…' : `${run.passed} of ${checkpoints.length} passed`, secondary: { label: 'Cancel the drive', onPress: cancel } },
    };
  }

  const startLabel = done || passed ? 'Drive it again' : 'Start';
  const openDriveView = () => router.push({ pathname: '/drive', params: targetParams({ kind: 'spot', id: spot.id }) });
  return {
    body: (
      <View style={{ gap: SPACING.md }}>
        {passed ? <CheckInCelebration play title="Drive complete" body="Every checkpoint passed. It counts." /> : null}
        <DsText v="caption">{`Pass all ${checkpoints.length} checkpoints in order to count it. Stick to the speed limits: a run that's too quick doesn't count.`}</DsText>
        {error ? <ErrorState title={error} /> : null}
      </View>
    ),
    bar: driveView
      ? {
          primary: { label: startLabel, onPress: openDriveView, accessibilityHint: 'Directions to the start, then through every checkpoint. Counts the drive as you go.' },
          secondary: demo
            ? { label: 'Simulate the drive', onPress: simulate, accessibilityHint: 'Demo: drives the checkpoints for you here at a legal pace' }
            : { label: 'Count it on GPS only', onPress: countOnGps, accessibilityHint: 'Counts the checkpoints with GPS while you use another app for directions' },
        }
      : {
          primary: { label: startLabel, onPress: countOnGps, accessibilityHint: 'Counts the checkpoints with GPS while you drive' },
          secondary: { label: nav.label === 'Navigate' ? 'Directions to the start' : nav.label, onPress: nav.openOther },
        },
  };
}

// ---------------------------------------------------------------------------
// Photo spots
// ---------------------------------------------------------------------------

function useVisitPanel(spot: Spot, onVisited: () => void, nav: Nav): Panel {
  const store = useStore();
  const [error, setError] = useState<string | null>(null);
  // The demo never blocks a check-in on distance; signed in, the server always checks where you are.
  const simGps = store.backend === 'local';
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
          setError(fix.reason === 'denied' ? 'Checking in here needs your location. Allow it for Slipstream in Settings.' : "Couldn't read your location. Try again outside.");
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

  if (flow.view) return { body: flow.view, bar: null };

  const navButton = { label: nav.label, onPress: nav.open };
  if (step === 'done') {
    return {
      body: (
        <View style={{ gap: SPACING.md }}>
          <CheckInCelebration play={false} title={`Checked in at ${spot.name}`} />
          <Button label="Check in again" tier="tertiary" size="sm" style={{ alignSelf: 'center' }} onPress={() => setStep('idle')} />
        </View>
      ),
      bar: { secondary: navButton },
    };
  }
  if (step === 'photo') {
    return {
      body: (
        <View style={{ gap: SPACING.md }}>
          {/* The same check-in moment as an event's (the burst, the tick, the buzz). */}
          <CheckInCelebration play title={`You're at ${spot.name}`} body="Add a photo? Plates are blurred before anything is saved." />
          <Button label="Skip the photo" tier="tertiary" size="sm" style={{ alignSelf: 'center' }} onPress={() => save()} disabled={busy || flow.busy} />
          {error ? <ErrorState title={error} /> : null}
        </View>
      ),
      bar: {
        primary: { label: 'Take a photo', onPress: () => flow.pick(true), busy: busy || flow.busy },
        secondary: { label: 'Choose from your photos', onPress: () => flow.pick(false) },
      },
    };
  }
  return {
    body: (
      <View style={{ gap: SPACING.sm }}>
        {error ? <ErrorState title={error} /> : null}
        <DsText v="caption">
          {simGps
            ? 'Demo: no location check. Add a photo after if you like; plates are blurred before anything is saved.'
            : "Check in when you're here (within 0.2 mi), then add a photo if you like. Plates are blurred before anything is saved."}
        </DsText>
      </View>
    ),
    bar: {
      primary: { label: 'Check in here', onPress: checkIn, busy, haptic: 'success', accessibilityHint: simGps ? undefined : 'Checks you are within 0.2 mi of the spot' },
      secondary: navButton,
    },
  };
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
                <FitImage key={m.key} fit="cover" source={photoUri(m.ref)} frameAspect={1} style={{ width: 104, height: 104, borderRadius: RADII.card, borderWidth: 1, borderColor: COLOR.surface.border, backgroundColor: COLOR.surface.media }} />
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

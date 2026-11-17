import * as ImagePicker from 'expo-image-picker';
import { useMemo, useState } from 'react';
import { Image, Linking, Pressable, TextInput, View } from 'react-native';
import { RECORDS_READ_ON, type LapRecord } from '../data/trackInfo';
import { classOf } from '../lib/classes';
import { feel } from '../lib/feel';
import { addLap, removeLap, useLaps } from '../lib/lapStore';
import {
  formatLapTime,
  KART_CLASSES,
  layoutsWithTimes,
  leaderboard,
  makeLap,
  MAIN_LAYOUT,
  recordMs,
  VEHICLE_LABELS,
  type LapDraft,
  type TrackVehicle,
} from '../lib/laptimes';
import { findPlates, finishPhoto, photoUri, plateRedactorAvailable } from '../lib/photos';
import { useStore } from '../lib/store';
import { formatLength, isSpectatorVenue, layoutNames, outrightRecord, trackInfo, trackVehicles, type TrackOutline } from '../lib/tracks';
import type { Spot } from '../lib/types';
import { C, SPOT_COLOURS } from '../theme';
import { PlateReview, type PendingPhoto } from './PlateReview';
import { Button, Card, Chip, ClassBadge, Row, Section, Txt, s as ui } from './ui';

/** Track screen: the circuit's details and records, then the app's own track times. */
export function TrackPanel({ spot, outline }: { spot: Spot; outline: TrackOutline | null }) {
  return (
    <>
      <TrackDetails spot={spot} outline={outline} />
      <TrackTimes spot={spot} />
    </>
  );
}

function TrackDetails({ spot, outline }: { spot: Spot; outline: TrackOutline | null }) {
  const info = trackInfo(spot.id);
  const main = info?.layouts[0];
  const records = info?.records ?? [];
  const lengthKm = main?.km ?? (outline ? outline.metres / 1000 : null);
  const vehicles = trackVehicles(spot);
  return (
    <Section title="The track">
      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <Txt v="label">{info?.spectator ? 'Racing here' : 'Runs here'}</Txt>
          <Txt v="mono" style={{ color: C.chalk }}>{vehicles.map((v) => VEHICLE_LABELS[v].toUpperCase()).join(' · ')}</Txt>
        </Row>
        {info?.arriveAndDrive !== undefined ? (
          <Row style={{ justifyContent: 'space-between' }}>
            <Txt v="label">Arrive and drive</Txt>
            <Txt v="mono" style={{ color: info.arriveAndDrive ? C.lime : C.fog }}>{info.arriveAndDrive ? 'YES, HIRE KARTS' : 'NO, OWN KARTS ONLY'}</Txt>
          </Row>
        ) : null}
        {lengthKm ? (
          <Row style={{ justifyContent: 'space-between' }}>
            <Txt v="label">{info?.run ? 'Course length' : main ? `Length · ${main.name}` : 'Length (measured on the map)'}</Txt>
            <Txt v="mono" style={{ color: C.chalk }}>{formatLength(lengthKm)}</Txt>
          </Row>
        ) : null}
        {info && info.layouts.length > 1 ? (
          <View style={{ gap: 4 }}>
            <Txt v="label">Layouts</Txt>
            {info.layouts.map((l) => (
              <Row key={l.name} style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}>
                <Txt style={{ flex: 1 }}>{l.name}</Txt>
                <Txt v="mono">{formatLength(l.km)}</Txt>
              </Row>
            ))}
          </View>
        ) : null}
        {outline ? (
          <Txt v="muted" style={{ fontSize: 12 }}>
            {outline.closed ? 'Outline' : 'Course line'} on the map: {outline.layout ? `the ${outline.layout.name} layout` : 'the main layout as mapped'}, from OpenStreetMap.
          </Txt>
        ) : null}
        {info?.factSources?.length ? (
          <Pressable onPress={() => Linking.openURL(info.factSources![0]).catch(() => {})} accessibilityRole="link" hitSlop={6}>
            <Txt v="muted" style={{ fontSize: 12, color: C.neon }}>Venue details: {info.factSources[0].replace(/^https?:\/\/(www\.)?/, '').replace(/\/.*$/, '')} ›</Txt>
          </Pressable>
        ) : null}
      </Card>
      {records.length ? (
        <Card>
          <Txt v="label">{info?.run ? 'Hill record' : 'Lap records'}</Txt>
          {records.map((r) => (
            <RecordRow key={`${r.kind}-${r.layout}-${r.time}`} r={r} />
          ))}
          {info?.source ? (
            <Pressable onPress={() => Linking.openURL(info.source!).catch(() => {})} accessibilityRole="link" hitSlop={6}>
              <Txt v="muted" style={{ fontSize: 12, color: C.neon }}>
                Source: {/wikipedia\.org/.test(info.source) ? 'Wikipedia' : info.source.replace(/^https?:\/\/(www\.)?/, '').replace(/\/.*$/, '')}, read {RECORDS_READ_ON} ›
              </Txt>
            </Pressable>
          ) : null}
        </Card>
      ) : null}
    </Section>
  );
}

function RecordRow({ r }: { r: LapRecord }) {
  return (
    <View style={{ gap: 1, paddingVertical: 2 }}>
      <Row style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}>
        <Txt v="eyebrow" style={{ color: r.kind === 'bike' ? C.neon : C.lime, fontSize: 11 }}>
          {r.kind === 'bike' ? 'Bikes' : 'Outright'} · {r.layout}
        </Txt>
        <Txt v="h3" style={{ fontVariant: ['tabular-nums'], textTransform: 'none' }}>{r.time}{/^\d+\.\d+$/.test(r.time) ? 's' : ''}</Txt>
      </Row>
      <Txt v="muted" style={{ fontSize: 13 }}>
        {r.holder}
        {r.vehicle ? `, ${r.vehicle}` : ''} · {r.series ? `${r.series}, ` : ''}
        {r.year}
      </Txt>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Track times: entered by hand after a track day, with proof, shown per class
// ---------------------------------------------------------------------------

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function TrackTimes({ spot }: { spot: Spot }) {
  const store = useStore();
  const { me, users, builds } = store;
  const { laps } = useLaps();
  const published = layoutNames(spot.id);
  const layouts = layoutsWithTimes(laps, spot.id, published);
  const [layout, setLayout] = useState(layouts[0]);
  const vehicles = trackVehicles(spot);
  const [kinds, setKinds] = useState<TrackVehicle[]>(vehicles);
  const groups = useMemo(() => leaderboard(laps, spot.id, layout, kinds), [laps, spot.id, layout, kinds]);
  const [adding, setAdding] = useState(false);
  const run = trackInfo(spot.id)?.run;
  const mineFits = builds.some((b) => b.ownerId === me && vehicles.includes(b.kind));

  if (isSpectatorVenue(spot.id)) {
    return (
      <Section title="Track times" colour={SPOT_COLOURS.track}>
        <Card>
          <Txt v="muted">A spectator venue: no track days here, so there are no times to enter. Check its own fixtures for race meetings.</Txt>
        </Card>
      </Section>
    );
  }

  return (
    <Section title="Track times" colour={SPOT_COLOURS.track}>
      {vehicles.length > 1 ? (
        <Row gap={6}>
          {vehicles.map((v) => (
            <Chip
              key={v}
              label={VEHICLE_LABELS[v]}
              on={kinds.includes(v)}
              colour={C.neon}
              onPress={() => setKinds((k) => (k.includes(v) ? (k.length > 1 ? k.filter((x) => x !== v) : k) : [...k, v]))}
            />
          ))}
        </Row>
      ) : null}
      {layouts.length > 1 ? (
        <Row gap={6}>
          {layouts.map((l) => (
            <Chip key={l} label={l} on={l === layout} colour={C.lime} onPress={() => setLayout(l)} />
          ))}
        </Row>
      ) : null}
      {groups.length === 0 ? (
        <Card>
          <Txt v="muted">No times yet for {layout === MAIN_LAYOUT ? 'this track' : `the ${layout} layout`}. Been on a track day here? Add yours.</Txt>
        </Card>
      ) : (
        groups.map((g) => (
          <Card key={g.key}>
            <Row>
              {g.kind !== 'kart' && g.cls !== 'Hire' && g.cls !== 'Own' ? <ClassBadge letter={g.cls} size="sm" /> : null}
              <Txt v="label">
                {VEHICLE_LABELS[g.kind]} · {g.kind === 'kart' ? `${g.cls === 'Hire' ? 'Hire' : 'Own'} karts` : `Class ${g.cls}`}
              </Txt>
            </Row>
            {g.entries.map((l, i) => {
              const who = users.find((u) => u.id === l.userId);
              return (
                <Row key={l.id} style={{ flexWrap: 'nowrap' }} gap={10}>
                  <Txt v="mono" style={{ width: 18, color: i === 0 ? C.lime : C.fog }}>{i + 1}</Txt>
                  <View style={{ flex: 1 }}>
                    <Txt numberOfLines={1}>{l.userId === me ? 'You' : who ? `@${who.handle}` : 'Someone'} · {l.vehicle}</Txt>
                    <Txt v="mono" style={{ fontSize: 11 }}>
                      {l.on} · {l.status === 'verified' ? 'VERIFIED' : 'UNVERIFIED'}
                    </Txt>
                  </View>
                  <Txt v="h3" style={{ fontVariant: ['tabular-nums'], textTransform: 'none', color: i === 0 ? C.lime : C.chalk }}>{formatLapTime(l.ms)}</Txt>
                  {l.userId === me ? (
                    <Pressable onPress={() => removeLap(l.id)} hitSlop={8} accessibilityRole="button" accessibilityLabel={`Remove your time ${formatLapTime(l.ms)}`}>
                      <Txt v="label" style={{ color: C.alert }}>Remove</Txt>
                    </Pressable>
                  ) : null}
                </Row>
              );
            })}
          </Card>
        ))
      )}
      <Txt v="muted" style={{ fontSize: 12 }}>
        {run ? 'Run' : 'Lap'} times from real track days and events only, typed in from the timing sheet with a photo as proof, and
        grouped by vehicle type and the class of the build that set them (karts: hire or your own). They're kept on this phone and marked unverified for now: checking them
        against the proof arrives with the server. Drives and roads are never timed.
      </Txt>
      {adding ? (
        <AddTime spot={spot} vehicles={vehicles} layouts={published.length ? published : [MAIN_LAYOUT]} initialLayout={layout} onDone={() => setAdding(false)} />
      ) : mineFits || vehicles.includes('kart') ? (
        <Button label="+ Add a track time" kind="ghost" onPress={() => setAdding(true)} />
      ) : (
        <Txt v="muted" style={{ fontSize: 12 }}>
          Add a {vehicles.map((v) => (v === 'car' ? 'car' : 'bike')).join(' or ')} to your garage to enter a time.
        </Txt>
      )}
    </Section>
  );
}

function AddTime({
  spot,
  vehicles,
  layouts,
  initialLayout,
  onDone,
}: {
  spot: Spot;
  vehicles: TrackVehicle[];
  layouts: string[];
  initialLayout: string;
  onDone: () => void;
}) {
  const store = useStore();
  const { me, builds } = store;
  const mineAll = builds.filter((b) => b.ownerId === me && vehicles.includes(b.kind));
  const firstKind = (mineAll[0]?.kind ?? (vehicles.includes('kart') ? 'kart' : vehicles[0])) as TrackVehicle;
  const [draft, setDraft] = useState<LapDraft>({
    trackId: spot.id,
    layout: layouts.includes(initialLayout) ? initialLayout : layouts[0],
    on: today(),
    time: '',
    kind: firstKind,
    ...(firstKind === 'kart' ? { kartClass: 'Hire' as const } : { buildId: mineAll.find((b) => b.kind === firstKind)?.id }),
  });
  const mine = mineAll.filter((b) => b.kind === draft.kind);
  const [pending, setPending] = useState<PendingPhoto | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (patch: Partial<LapDraft>) => setDraft((d) => ({ ...d, ...patch }));
  const record = outrightRecord(spot.id, draft.layout);
  const ctx = { track: spot, layouts, vehicles, builds, me, now: new Date(), fastestMs: record ? recordMs(record.time) : null };

  async function pickProof(camera: boolean) {
    setError(null);
    try {
      if (camera) {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) return setError('Allow camera access to photograph the timing sheet.');
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
        set({ proof: await finishPhoto(a.uri, [], a.width, a.height) });
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
      set({ proof: await finishPhoto(pending.uri, boxes, pending.width, pending.height) });
      setPending(null);
    } catch {
      setError("Couldn't blur that photo. Try again.");
    } finally {
      setBusy(false);
    }
  }

  function save() {
    setError(null);
    try {
      const lap = makeLap(draft, ctx, `lap-${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`);
      addLap(lap);
      feel.success();
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save that time.');
    }
  }

  if (pending) return <PlateReview photo={pending} onDone={confirm} onCancel={() => setPending(null)} busy={busy} />;

  return (
    <Card accent={C.lime}>
      <Txt v="h3">Add a track time</Txt>
      {layouts.length > 1 ? (
        <>
          <Txt v="label">Layout</Txt>
          <Row gap={6}>
            {layouts.map((l) => (
              <Chip key={l} label={l} on={draft.layout === l} colour={C.lime} onPress={() => set({ layout: l })} />
            ))}
          </Row>
        </>
      ) : null}
      <Txt v="label">Track day date</Txt>
      <TextInput
        value={draft.on}
        onChangeText={(on) => set({ on: on.trim() })}
        placeholder="YYYY-MM-DD"
        placeholderTextColor={C.fog}
        style={ui.input}
        autoCorrect={false}
        maxLength={10}
        accessibilityLabel="Track day date, year month day"
      />
      <Txt v="label">Best time from the timing sheet</Txt>
      <TextInput
        value={draft.time}
        onChangeText={(time) => set({ time })}
        placeholder="e.g. 1:23.456"
        placeholderTextColor={C.fog}
        style={[ui.input, { fontVariant: ['tabular-nums'] }]}
        keyboardType="numbers-and-punctuation"
        autoCorrect={false}
        maxLength={10}
        accessibilityLabel="Best time"
      />
      {vehicles.length > 1 ? (
        <>
          <Txt v="label">Vehicle</Txt>
          <Row gap={6}>
            {vehicles.map((v) => (
              <Chip
                key={v}
                label={VEHICLE_LABELS[v]}
                on={draft.kind === v}
                colour={C.lime}
                onPress={() =>
                  set(v === 'kart' ? { kind: v, kartClass: draft.kartClass ?? 'Hire', buildId: undefined } : { kind: v, buildId: mineAll.find((b) => b.kind === v)?.id })
                }
              />
            ))}
          </Row>
        </>
      ) : null}
      <Txt v="label">Set in</Txt>
      {draft.kind === 'kart' ? (
        <Row gap={6}>
          {KART_CLASSES.map((k) => (
            <Chip key={k} label={k === 'Hire' ? "The venue's hire kart" : 'My own kart'} on={draft.kartClass === k} colour={C.lime} onPress={() => set({ kartClass: k })} />
          ))}
        </Row>
      ) : mine.length ? (
        <Row gap={6}>
          {mine.map((b) => (
            <Chip key={b.id} label={`${b.make} ${b.model} · ${classOf(b)}`} on={draft.buildId === b.id} colour={C.lime} onPress={() => set({ buildId: b.id })} />
          ))}
        </Row>
      ) : (
        <Txt v="muted" style={{ fontSize: 13 }}>Add this {draft.kind} to your garage first, so its class can be worked out.</Txt>
      )}
      <Txt v="label">Proof</Txt>
      {draft.proof ? (
        <Row style={{ flexWrap: 'nowrap' }} gap={10}>
          <Image source={{ uri: photoUri(draft.proof) }} style={{ width: 72, height: 72, borderRadius: 6, borderWidth: 1, borderColor: C.kerb }} />
          <Txt v="muted" style={{ flex: 1, fontSize: 13 }}>Proof added. Plates were blurred and the photo was saved without its metadata.</Txt>
        </Row>
      ) : (
        <Txt v="muted" style={{ fontSize: 13 }}>A photo of the printed timing sheet or a screenshot of the circuit's timing app. Any number plates in it are blurred first.</Txt>
      )}
      <Row style={{ flexWrap: 'nowrap' }}>
        <Button label="Camera" kind="ghost" style={{ flex: 1 }} onPress={() => pickProof(true)} disabled={busy} />
        <Button label="Library" kind="ghost" style={{ flex: 1 }} onPress={() => pickProof(false)} disabled={busy} />
      </Row>
      {error ? <Txt style={{ color: C.alert }}>{error}</Txt> : null}
      <Row style={{ flexWrap: 'nowrap' }}>
        <Button label="Save time" kind="neon" style={{ flex: 1 }} onPress={save} busy={busy} />
        <Button label="Cancel" kind="ghost" onPress={onDone} />
      </Row>
      <Txt v="muted" style={{ fontSize: 12 }}>
        Only enter a time from a real track day or event here, as printed by the circuit's timing. It shows as unverified until the server can check it.
      </Txt>
    </Card>
  );
}

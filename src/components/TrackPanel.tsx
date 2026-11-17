import { useMemo, useState } from 'react';
import { Image, Linking, Pressable, TextInput, View } from 'react-native';
import { RECORDS_READ_ON, type LapRecord } from '../data/trackInfo';
import { classOf } from '../lib/classes';
import { feel } from '../lib/feel';
import { addLap, removeLap, useLaps } from '../lib/lapStore';
import {
  formatLapTime,
  layoutsWithTimes,
  leaderboard,
  makeLap,
  MAIN_LAYOUT,
  recordMs,
  VEHICLE_LABELS,
  type LapDraft,
  type TrackVehicle,
} from '../lib/laptimes';
import { photoUri } from '../lib/photos';
import { useStore } from '../lib/store';
import { formatLength, isSpectatorVenue, layoutNames, outrightRecord, trackInfo, trackVehicles, type TrackOutline } from '../lib/tracks';
import type { Spot } from '../lib/types';
import { ONLY_ON_PHONE } from '../lib/glossary';
import { BRAND, C, RADIUS, SPOT_COLOURS, STATE } from '../theme';
import { usePhotoFlow } from './PhotoFlow';
import { Button, Card, Chip, ClassBadge, InlineError, LinkText, Row, Section, Tag, Txt, s as ui } from './ui';

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
          <Txt v="caption">
            {outline.closed ? 'Outline' : 'Course line'} on the map: {outline.layout ? `the ${outline.layout.name} layout` : 'the main layout as mapped'}, from OpenStreetMap.
          </Txt>
        ) : null}
        {info?.factSources?.length ? (
          <LinkText
            label={`Track details: ${info.factSources[0].replace(/^https?:\/\/(www\.)?/, '').replace(/\/.*$/, '')} ›`}
            onPress={() => Linking.openURL(info.factSources![0]).catch(() => {})}
          />
        ) : null}
      </Card>
      {records.length ? (
        <Card>
          <Txt v="label">{info?.run ? 'Hill record' : 'Lap records'}</Txt>
          {records.map((r) => (
            <RecordRow key={`${r.kind}-${r.layout}-${r.time}`} r={r} />
          ))}
          {info?.source ? (
            <LinkText
              label={`Source: ${/wikipedia\.org/.test(info.source) ? 'Wikipedia' : info.source.replace(/^https?:\/\/(www\.)?/, '').replace(/\/.*$/, '')}, read ${RECORDS_READ_ON} ›`}
              onPress={() => Linking.openURL(info.source!).catch(() => {})}
            />
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
        <Txt v="eyebrow" style={{ color: r.kind === 'bike' ? C.chalk : BRAND }}>
          {r.kind === 'bike' ? 'Bikes' : 'Outright'} · {r.layout}
        </Txt>
        <Txt v="h3" style={{ fontVariant: ['tabular-nums'], textTransform: 'none' }}>{r.time}{/^\d+\.\d+$/.test(r.time) ? 's' : ''}</Txt>
      </Row>
      <Txt v="caption">
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
    <Section title="Track times" colour={SPOT_COLOURS.track} right={<Tag label={ONLY_ON_PHONE} tone="muted" />}>
      {vehicles.length > 1 ? (
        <Row gap={6}>
          {vehicles.map((v) => (
            <Chip
              key={v}
              label={VEHICLE_LABELS[v]}
              on={kinds.includes(v)}
              onPress={() => setKinds((k) => (k.includes(v) ? (k.length > 1 ? k.filter((x) => x !== v) : k) : [...k, v]))}
            />
          ))}
        </Row>
      ) : null}
      {layouts.length > 1 ? (
        <Row gap={6}>
          {layouts.map((l) => (
            <Chip key={l} label={l} on={l === layout} onPress={() => setLayout(l)} />
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
              <ClassBadge letter={g.cls} size="sm" />
              <Txt v="label">
                {VEHICLE_LABELS[g.kind]} · Class {g.cls}
              </Txt>
            </Row>
            {g.entries.map((l, i) => {
              const who = users.find((u) => u.id === l.userId);
              return (
                <Row key={l.id} style={{ flexWrap: 'nowrap' }} gap={10}>
                  <Txt v="mono" style={{ width: 18, color: i === 0 ? BRAND : C.fog }}>{i + 1}</Txt>
                  <View style={{ flex: 1 }}>
                    <Txt numberOfLines={1}>{l.userId === me ? 'You' : who ? `@${who.handle}` : 'Someone'} · {l.vehicle}</Txt>
                    <Txt v="micro">
                      {l.on} · {l.status === 'verified' ? 'VERIFIED' : 'UNVERIFIED'}
                    </Txt>
                  </View>
                  <Txt v="h3" style={{ fontVariant: ['tabular-nums'], textTransform: 'none', color: i === 0 ? BRAND : C.chalk }}>{formatLapTime(l.ms)}</Txt>
                  {l.userId === me ? (
                    <Pressable onPress={() => removeLap(l.id)} hitSlop={12} accessibilityRole="button" accessibilityLabel={`Remove your time ${formatLapTime(l.ms)}`}>
                      <Txt v="label" style={{ color: STATE.danger }}>Remove</Txt>
                    </Pressable>
                  ) : null}
                </Row>
              );
            })}
          </Card>
        ))
      )}
      <Txt v="caption">
        {run ? 'Run' : 'Lap'} times from real track days and events only, typed in from the timing sheet with a photo as proof, and
        grouped by vehicle type and the class of the build that set them. {ONLY_ON_PHONE}: nobody else sees them yet, and they're marked
        unverified until the server can check the proof. Drives and roads are never timed.
      </Txt>
      {adding ? (
        <AddTime spot={spot} vehicles={vehicles} layouts={published.length ? published : [MAIN_LAYOUT]} initialLayout={layout} onDone={() => setAdding(false)} />
      ) : mineFits ? (
        <Button label="+ Add a track time" kind="secondary" onPress={() => setAdding(true)} />
      ) : (
        <Txt v="caption">
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
  const firstKind = (mineAll[0]?.kind ?? vehicles[0]) as TrackVehicle;
  const [draft, setDraft] = useState<LapDraft>({
    trackId: spot.id,
    layout: layouts.includes(initialLayout) ? initialLayout : layouts[0],
    on: today(),
    time: '',
    kind: firstKind,
    buildId: mineAll.find((b) => b.kind === firstKind)?.id,
  });
  const mine = mineAll.filter((b) => b.kind === draft.kind);
  const [error, setError] = useState<string | null>(null);
  const set = (patch: Partial<LapDraft>) => setDraft((d) => ({ ...d, ...patch }));
  const record = outrightRecord(spot.id, draft.layout);
  const ctx = { track: spot, layouts, vehicles, builds, me, now: new Date(), fastestMs: record ? recordMs(record.time) : null };

  // Pick → crop → plate check → save (PhotoFlow.tsx).
  const flow = usePhotoFlow({ onPhoto: (ref) => set({ proof: ref }), onError: setError, cameraDenied: 'Allow camera access to photograph the timing sheet.' });
  const pickProof = (camera: boolean) => flow.pick(camera);

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

  if (flow.view) return flow.view;

  return (
    <Card accent={SPOT_COLOURS.track}>
      <Txt v="h3">Add a track time</Txt>
      {layouts.length > 1 ? (
        <>
          <Txt v="label">Layout</Txt>
          <Row gap={6}>
            {layouts.map((l) => (
              <Chip key={l} label={l} on={draft.layout === l} onPress={() => set({ layout: l })} />
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
                onPress={() => set({ kind: v, buildId: mineAll.find((b) => b.kind === v)?.id })}
              />
            ))}
          </Row>
        </>
      ) : null}
      <Txt v="label">Set in</Txt>
      {mine.length ? (
        <Row gap={6}>
          {mine.map((b) => (
            <Chip key={b.id} label={`${b.make} ${b.model} · ${classOf(b)}`} on={draft.buildId === b.id} onPress={() => set({ buildId: b.id })} />
          ))}
        </Row>
      ) : (
        <Txt v="caption">Add this {draft.kind} to your garage first, so its class can be worked out.</Txt>
      )}
      <Txt v="label">Proof</Txt>
      {draft.proof ? (
        <Row style={{ flexWrap: 'nowrap' }} gap={10}>
          <Image source={{ uri: photoUri(draft.proof) }} style={{ width: 72, height: 72, borderRadius: RADIUS.card, borderWidth: 1, borderColor: C.kerb }} />
          <Txt v="caption" style={{ flex: 1 }}>Proof added. Plates were blurred and the photo was saved without its metadata.</Txt>
        </Row>
      ) : (
        <Txt v="caption">A photo of the printed timing sheet or a screenshot of the circuit's timing app. Any number plates in it are blurred first.</Txt>
      )}
      <Row style={{ flexWrap: 'nowrap' }}>
        <Button label="Camera" kind="secondary" style={{ flex: 1 }} onPress={() => pickProof(true)} disabled={flow.busy} />
        <Button label="Library" kind="secondary" style={{ flex: 1 }} onPress={() => pickProof(false)} disabled={flow.busy} />
      </Row>
      <Row style={{ flexWrap: 'nowrap' }}>
        <Button label="Save time" style={{ flex: 1 }} onPress={save} busy={flow.busy} />
        <Button label="Cancel" kind="secondary" onPress={onDone} />
      </Row>
      <InlineError message={error} />
      <Txt v="caption">
        Only enter a time from a real track day or event here, as printed by the circuit's timing. It's kept {ONLY_ON_PHONE.toLowerCase()} and shows as unverified until the server can check it.
      </Txt>
    </Card>
  );
}

import { useMemo, useState } from 'react';
import { Image, Linking, View } from 'react-native';
import { RECORDS_READ_ON, type LapRecord } from '../data/trackInfo';
import { classOf } from '../lib/classes';
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
import { COLOR, RADII, SPACING } from '../theme';
import { Field, TextField } from './Detail';
import { buzz, Button, ChipGroup, ChoiceGroup, ClassBadge, displayHandle, DsText, EmptyState, ErrorState, ListRow, RowDivider, Section, Tag } from './ds';
import { usePhotoFlow } from './PhotoFlow';

/** Track screen: the circuit's details and records, then the app's own track times. */
export function TrackPanel({ spot, outline }: { spot: Spot; outline: TrackOutline | null }) {
  return (
    <>
      <TrackDetails spot={spot} outline={outline} />
      <TrackTimes spot={spot} />
    </>
  );
}

const host = (url: string) => url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/.*$/, '');
const openUrl = (url: string) => Linking.openURL(url).catch(() => {});

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: SPACING.md }}>
      <DsText v="label" style={{ flexShrink: 1 }}>
        {label}
      </DsText>
      <DsText v="meta" style={{ color: COLOR.text.primary }}>
        {value}
      </DsText>
    </View>
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
      <View style={{ gap: SPACING.sm }}>
        <Fact label={info?.spectator ? 'Racing here' : 'Runs here'} value={vehicles.map((v) => VEHICLE_LABELS[v]).join(' · ')} />
        {lengthKm ? <Fact label={info?.run ? 'Course length' : main ? `Length · ${main.name}` : 'Length (measured on the map)'} value={formatLength(lengthKm)} /> : null}
        {info && info.layouts.length > 1 ? (
          <View style={{ gap: SPACING.xs }}>
            <DsText v="label">Layouts</DsText>
            {info.layouts.map((l) => (
              <View key={l.name} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: SPACING.md }}>
                <DsText v="body" style={{ flex: 1 }}>
                  {l.name}
                </DsText>
                <DsText v="meta">{formatLength(l.km)}</DsText>
              </View>
            ))}
          </View>
        ) : null}
        {outline ? (
          <DsText v="caption">
            {outline.closed ? 'Outline' : 'Course line'} on the map: {outline.layout ? `the ${outline.layout.name} layout` : 'the main layout as mapped'}, from OpenStreetMap.
          </DsText>
        ) : null}
        {info?.factSources?.length ? (
          <Button tier="tertiary" size="sm" style={{ marginLeft: -SPACING.xs }} label={`Track details: ${host(info.factSources[0])} ›`} onPress={() => openUrl(info.factSources![0])} />
        ) : null}
      </View>
      {records.length ? (
        <View style={{ gap: SPACING.sm }}>
          <DsText v="label">{info?.run ? 'Hill record' : 'Lap records'}</DsText>
          {records.map((r) => (
            <RecordRow key={`${r.kind}-${r.layout}-${r.time}`} r={r} />
          ))}
          {info?.source ? (
            <Button
              tier="tertiary"
              size="sm"
              style={{ marginLeft: -SPACING.xs }}
              label={`Source: ${/wikipedia\.org/.test(info.source) ? 'Wikipedia' : host(info.source)}, read ${RECORDS_READ_ON} ›`}
              onPress={() => openUrl(info.source!)}
            />
          ) : null}
        </View>
      ) : null}
    </Section>
  );
}

function RecordRow({ r }: { r: LapRecord }) {
  return (
    <View style={{ gap: SPACING.xxs }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: SPACING.md }}>
        <DsText v="bodyStrong" style={{ flexShrink: 1 }}>
          {r.kind === 'bike' ? 'Bikes' : 'Outright'} · {r.layout}
        </DsText>
        <DsText v="stat">
          {r.time}
          {/^\d+\.\d+$/.test(r.time) ? 's' : ''}
        </DsText>
      </View>
      <DsText v="caption">
        {r.holder}
        {r.vehicle ? `, ${r.vehicle}` : ''} · {r.series ? `${r.series}, ` : ''}
        {r.year}
      </DsText>
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
  /** Filter chips: nothing selected is every vehicle type. */
  const [picked, setPicked] = useState<TrackVehicle[]>([]);
  const kinds = picked.length ? picked : vehicles;
  const groups = useMemo(() => leaderboard(laps, spot.id, layout, kinds), [laps, spot.id, layout, kinds]);
  const [adding, setAdding] = useState(false);
  const run = trackInfo(spot.id)?.run;
  const mineFits = builds.some((b) => b.ownerId === me && vehicles.includes(b.kind));

  if (isSpectatorVenue(spot.id)) {
    return (
      <Section title="Track times">
        <DsText v="secondary">A spectator venue: no track days here, so there are no times to enter. Check its own fixtures for race meetings.</DsText>
      </Section>
    );
  }

  return (
    <Section title="Track times" right={<Tag label={ONLY_ON_PHONE} />}>
      {vehicles.length > 1 ? (
        <ChipGroup<TrackVehicle> label="Vehicles" allLabel="Every vehicle" options={vehicles.map((v) => ({ key: v, label: VEHICLE_LABELS[v] }))} selected={picked} onChange={setPicked} />
      ) : null}
      {layouts.length > 1 ? <ChoiceGroup label="Layout" options={layouts.map((l) => ({ key: l, label: l }))} value={layout} onChange={setLayout} /> : null}
      {groups.length === 0 ? (
        <EmptyState variant="inline" title={`No times yet for ${layout === MAIN_LAYOUT ? 'this track' : `the ${layout} layout`}. Been on a track day here? Add yours.`} />
      ) : (
        groups.map((g) => (
          <View key={g.key} style={{ gap: SPACING.xs }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
              <ClassBadge letter={g.cls} size="sm" decorative />
              <DsText v="label">
                {VEHICLE_LABELS[g.kind]} · Class {g.cls}
              </DsText>
            </View>
            {g.entries.map((l, i) => {
              const who = users.find((u) => u.id === l.userId);
              return (
                <View key={l.id}>
                  {i > 0 ? <RowDivider /> : null}
                  <ListRow
                    title={`${i + 1}. ${l.userId === me ? 'You' : who ? displayHandle(who.handle) : 'Someone'} · ${l.vehicle}`}
                    meta={`${l.on} · ${l.status === 'verified' ? 'Verified' : 'Unverified'}`}
                    trailing={
                      <View style={{ alignItems: 'flex-end' }}>
                        <DsText v="stat">{formatLapTime(l.ms)}</DsText>
                        {l.userId === me ? <Button tier="tertiary" size="sm" label="Remove" accessibilityLabel={`Remove your time ${formatLapTime(l.ms)}`} onPress={() => removeLap(l.id)} /> : null}
                      </View>
                    }
                  />
                </View>
              );
            })}
          </View>
        ))
      )}
      <DsText v="caption">
        {run ? 'Run' : 'Lap'} times from real track days and events only, typed in from the timing sheet with a photo as proof, and grouped by vehicle type and the class of the
        build that set them. {ONLY_ON_PHONE}: nobody else sees them yet, and they're marked unverified until the server can check the proof. Drives and roads are never timed.
      </DsText>
      {adding ? (
        <AddTime spot={spot} vehicles={vehicles} layouts={published.length ? published : [MAIN_LAYOUT]} initialLayout={layout} onDone={() => setAdding(false)} />
      ) : mineFits ? (
        <Button label="Add a track time" icon="plus" tier="secondary" block onPress={() => setAdding(true)} />
      ) : (
        <DsText v="caption">Add a {vehicles.map((v) => (v === 'car' ? 'car' : 'bike')).join(' or ')} to your garage to enter a time.</DsText>
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
      buzz('success');
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save that time.");
    }
  }

  if (flow.view) return flow.view;

  return (
    <View style={{ gap: SPACING.lg, padding: SPACING.lg, borderRadius: RADII.card, borderWidth: 1, borderColor: COLOR.surface.border, backgroundColor: COLOR.surface.card }}>
      <DsText v="title" accessibilityRole="header">
        Add a track time
      </DsText>
      {layouts.length > 1 ? <ChoiceGroup label="Layout" options={layouts.map((l) => ({ key: l, label: l }))} value={draft.layout} onChange={(l) => set({ layout: l })} /> : null}
      <Field label="Track day date">
        <TextField value={draft.on} onChangeText={(on) => set({ on: on.trim() })} placeholder="YYYY-MM-DD" autoCorrect={false} maxLength={10} accessibilityLabel="Track day date, year month day" />
      </Field>
      <Field label="Best time from the timing sheet">
        <TextField
          value={draft.time}
          onChangeText={(time) => set({ time })}
          placeholder="e.g. 1:23.456"
          style={{ fontVariant: ['tabular-nums'] }}
          keyboardType="numbers-and-punctuation"
          autoCorrect={false}
          maxLength={10}
          accessibilityLabel="Best time"
        />
      </Field>
      {vehicles.length > 1 ? (
        <ChoiceGroup
          label="Vehicle"
          options={vehicles.map((v) => ({ key: v, label: VEHICLE_LABELS[v] }))}
          value={draft.kind}
          onChange={(v) => set({ kind: v, buildId: mineAll.find((b) => b.kind === v)?.id })}
        />
      ) : null}
      {mine.length ? (
        <ChoiceGroup label="Set in" options={mine.map((b) => ({ key: b.id, label: `${b.make} ${b.model} · ${classOf(b)}` }))} value={draft.buildId ?? null} onChange={(id) => set({ buildId: id })} />
      ) : (
        <DsText v="caption">Add this {draft.kind} to your garage first, so its class can be worked out.</DsText>
      )}
      <Field label="Proof">
        {draft.proof ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.md }}>
            <Image source={{ uri: photoUri(draft.proof) }} style={{ width: 72, height: 72, borderRadius: RADII.control, borderWidth: 1, borderColor: COLOR.surface.border }} />
            <DsText v="caption" style={{ flex: 1 }}>
              Proof added. Plates were blurred and the photo was saved without its metadata.
            </DsText>
          </View>
        ) : (
          <DsText v="caption">A photo of the printed timing sheet or a screenshot of the circuit's timing app. Any number plates in it are blurred first.</DsText>
        )}
      </Field>
      <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
        <Button label="Camera" tier="secondary" style={{ flex: 1 }} block onPress={() => pickProof(true)} disabled={flow.busy} />
        <Button label="Library" tier="secondary" style={{ flex: 1 }} block onPress={() => pickProof(false)} disabled={flow.busy} />
      </View>
      <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
        <Button label="Save time" style={{ flex: 1 }} block onPress={save} busy={flow.busy} />
        <Button label="Cancel" tier="secondary" onPress={onDone} />
      </View>
      {error ? <ErrorState title={error} /> : null}
      <DsText v="caption">
        Only enter a time from a real track day or event here, as printed by the circuit's timing. It's kept {ONLY_ON_PHONE.toLowerCase()} and shows as unverified until the server can check it.
      </DsText>
    </View>
  );
}

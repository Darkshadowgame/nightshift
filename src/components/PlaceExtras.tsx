import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { demoAccessNotes, demoShots } from '../data/demoPlaceExtras';
import { appNow } from '../lib/appClock';
import { fetchAccessNotes, postAccessNote } from '../lib/backend/accessNotes';
import { addNote, toggleLike, useExtras } from '../lib/extrasStore';
import { plural } from '../lib/format';
import { newId } from '../lib/ids';
import { photoSource } from '../lib/photoSource';
import {
  accessProblem,
  accessSummary,
  EMPTY_ACCESS,
  LOW_CARS_LABELS,
  lightBadge,
  makeAccessNote,
  MAX_NOTE_TEXT,
  notesFor,
  progressText,
  sampleShots,
  SECURITY_LABELS,
  shotOfTheWeek,
  spotCollections,
  type AccessDraft,
  type AccessNote,
  type CollectionProgress,
  type LowCars,
  type Security,
  type ShotLike,
} from '../lib/placeExtras';
import { useStore } from '../lib/store';
import type { Spot } from '../lib/types';
import { dayKey, dayLabelShort } from '../lib/when';
import { COLOR, RADII, SPACING } from '../theme';
import { PhotoCredit } from './PhotoCredit';
import { Button, ChoiceGroup, DsText, EmptyState, ErrorState, Field, FitImage, Icon, ListRow, Press, Section, Sheet, SwitchRow, Tag, TextField } from './ds';

/** Photo-spot extras on the place page (Level-up, places): light badge, example shots, access notes, collections, shot of the week. */

/** The demo's made-up extras, or nothing signed in. Built once per screen. */
function useDemoExtras() {
  const store = useStore();
  const demo = store.backend === 'local';
  return useMemo(() => {
    if (!demo) return { shots: [], likes: [] as ShotLike[], notes: [] as AccessNote[] };
    const now = appNow();
    const s = demoShots(now);
    return { shots: s.shots, likes: s.likes, notes: demoAccessNotes(now) };
    // The demo clock only matters to the day; recomputing per mount is plenty.
  }, [demo]);
}

/** "Golden hour until 18:12" or "Good light from 17:20 (in 40 min)": worked out on the phone. */
export function LightBadge({ spot }: { spot: Spot }) {
  const [now, setNow] = useState(() => appNow());
  // Refresh each minute so the countdown and the window stay right while the page is open.
  useEffect(() => {
    const t = setInterval(() => setNow(appNow()), 60_000);
    return () => clearInterval(t);
  }, []);
  if (spot.kind !== 'photo') return null;
  const badge = lightBadge(now, spot.at);
  return badge ? <Tag label={badge.text} tone={badge.now ? 'info' : 'neutral'} raw /> : null;
}

/** Who took a shot, in words: "You", the demo person's handle is never shown (just the day). */
function dayText(on: string | undefined): string | null {
  return on ? dayLabelShort(`${on}T12:00:00`, appNow()) : null;
}

/** Up to three example framings from photos taken here, each with a like. */
export function ExampleShots({ spot }: { spot: Spot }) {
  const { me } = useStore();
  const demo = useDemoExtras();
  const { extras } = useExtras();
  const likes = useMemo(() => [...demo.likes, ...extras.likes], [demo.likes, extras.likes]);
  const shots = useMemo(
    () =>
      sampleShots(
        spot,
        demo.shots.filter((s) => s.spotId === spot.id),
      ),
    [spot, demo.shots],
  );
  if (spot.kind !== 'photo' || spot.status !== 'approved' || !shots.length) return null;
  return (
    <Section title="Where people park and stand">
      <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
        {shots.map((s) => {
          const count = new Set(likes.filter((l) => l.ref === s.ref).map((l) => l.userId)).size;
          const mine = likes.some((l) => l.ref === s.ref && l.userId === me);
          const when = dayText(s.on);
          return (
            <View key={s.ref} style={{ flex: 1, gap: SPACING.xs }}>
              <View style={{ borderRadius: RADII.card, overflow: 'hidden', borderWidth: 1, borderColor: COLOR.surface.border, backgroundColor: COLOR.surface.media }}>
                <FitImage fit="cover" source={photoSource(s.ref)} frameAspect={0.8} accessibilityLabel={`Example shot at ${spot.name}`} style={{ width: '100%', aspectRatio: 0.8 }} />
                <PhotoCredit photoRef={s.ref} overlay kind="car" />
              </View>
              <Press
                onPress={() => toggleLike(s.ref, me, appNow().toISOString())}
                haptic="select"
                label={mine ? `Unlike this shot, ${plural(count, 'like')}` : `Like this shot, ${plural(count, 'like')}`}
                state={{ selected: mine }}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, minHeight: 32 }}
              >
                <Icon name={mine ? 'heartOn' : 'heart'} size={18} colour={mine ? COLOR.text.primary : COLOR.text.secondary} />
                <DsText v="meta">{[count > 0 ? String(count) : null, when].filter(Boolean).join(' · ')}</DsText>
              </Press>
            </View>
          );
        })}
      </View>
      <DsText v="caption">Real photos taken here, so you know where to park and where to stand. Plates are blurred.</DsText>
    </Section>
  );
}

/** One featured photo for the spot's region, picked by likes over the last 7 days. */
export function ShotOfTheWeek({ spot }: { spot: Spot }) {
  const { spots, users } = useStore();
  const demo = useDemoExtras();
  const { extras } = useExtras();
  const featured = useMemo(
    () => shotOfTheWeek(spot.region, spots, demo.shots, [...demo.likes, ...extras.likes], appNow()),
    [spot.region, spots, demo.shots, demo.likes, extras.likes],
  );
  if (spot.kind !== 'photo' || !featured) return null;
  const at = spots.find((s) => s.id === featured.spotId);
  const by = featured.userId ? users.find((u) => u.id === featured.userId) : undefined;
  const here = featured.spotId === spot.id;
  return (
    <Section title={`Shot of the week · ${spot.region}`}>
      <Press
        onPress={here || !at ? undefined : () => router.push({ pathname: '/spot/[id]', params: { id: at.id } })}
        label={`Shot of the week in ${spot.region}${at ? `, at ${at.name}` : ''}`}
        disabled={here || !at}
        style={{ gap: SPACING.xs }}
      >
        <View style={{ borderRadius: RADII.card, overflow: 'hidden', borderWidth: 1, borderColor: COLOR.surface.border, backgroundColor: COLOR.surface.media }}>
          <FitImage fit="cover" source={photoSource(featured.ref)} frameAspect={16 / 9} style={{ width: '100%', aspectRatio: 16 / 9 }} />
          <PhotoCredit photoRef={featured.ref} overlay kind="car" />
        </View>
        <DsText v="meta">
          {[plural(featured.likes, 'like') + ' this week', at ? (here ? 'taken here' : at.name) : null, by ? `by ${by.handle}` : null].filter(Boolean).join(' · ')}
        </DsText>
      </Press>
    </Section>
  );
}

/** Notes from people who've been: what the barrier does, security, low cars. Anyone who has checked in can add one. */
export function AccessNotes({ spot }: { spot: Spot }) {
  const store = useStore();
  const { me } = store;
  const demoMode = store.backend === 'local';
  const demo = useDemoExtras();
  const { extras } = useExtras();
  const [remote, setRemote] = useState<AccessNote[] | null>(null);
  const [adding, setAdding] = useState(false);
  const active = spot.kind === 'photo' && spot.status === 'approved';

  useEffect(() => {
    if (demoMode || !active) return;
    let live = true;
    fetchAccessNotes(spot.id, me).then((r) => live && setRemote(r));
    return () => {
      live = false;
    };
  }, [demoMode, active, spot.id, me]);

  const notes = useMemo(() => notesFor([...demo.notes, ...(remote ?? []), ...extras.notes], spot.id), [demo.notes, remote, extras.notes, spot.id]);
  if (!active) return null;
  const been = spot.completions.some((c) => c.userId === me);
  const summary = accessSummary(notes);
  const mineNote = notes.find((n) => n.userId === me);

  return (
    <Section title="Getting in">
      {summary ? (
        <View style={{ gap: SPACING.xs }}>
          <DsText v="bodyStrong">{summary}</DsText>
          <DsText v="caption">{`From ${plural(notes.length, 'person', 'people')} who've been. Check for yourself on the day: rules change.`}</DsText>
        </View>
      ) : (
        <EmptyState variant="inline" title={been ? 'No notes yet. You have been here: add what you know.' : 'No notes yet. Check in here to add what you know about getting in.'} />
      )}
      {notes.some((n) => n.text) ? (
        <View style={{ gap: SPACING.xs }}>
          {notes
            .filter((n) => n.text)
            .slice(0, 3)
            .map((n) => (
              <DsText key={n.id} v="secondary">
                {`${n.userId === me ? 'You' : 'Someone who has been'}, ${dayText(n.on)}: ${n.text}`}
              </DsText>
            ))}
        </View>
      ) : null}
      {adding ? (
        <AccessForm
          spot={spot}
          initial={mineNote}
          onDone={() => setAdding(false)}
          onSaved={(n, shared) => {
            if (shared) setRemote((r) => [...(r ?? []), n]);
            else addNote(n);
          }}
        />
      ) : been ? (
        <Button label={mineNote ? 'Change your note' : 'Add what you know'} icon="plus" tier="secondary" block onPress={() => setAdding(true)} />
      ) : null}
    </Section>
  );
}

function draftOf(n: AccessNote | undefined): AccessDraft {
  return n ? { barrier: !!n.barrier, closes: n.closes ?? '', security: n.security ?? null, lowCars: n.lowCars ?? null, text: n.text ?? '' } : EMPTY_ACCESS;
}

function AccessForm({ spot, initial, onDone, onSaved }: { spot: Spot; initial?: AccessNote; onDone: () => void; onSaved: (n: AccessNote, shared: boolean) => void }) {
  const store = useStore();
  const [draft, setDraft] = useState<AccessDraft>(() => draftOf(initial));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (patch: Partial<AccessDraft>) => setDraft((d) => ({ ...d, ...patch }));

  async function save() {
    setError(null);
    const problem = accessProblem(draft);
    if (problem) return setError(problem);
    setBusy(true);
    try {
      const note = makeAccessNote(draft, { id: newId('note'), spotId: spot.id, userId: store.me, on: dayKey(appNow()) });
      // Signed in the note goes to the server; until that's available (or in the demo) it stays on this phone.
      const shared = store.backend !== 'local' && (await postAccessNote(spot.id, note)) === 'saved';
      onSaved(note, shared);
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save your note.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ gap: SPACING.lg, padding: SPACING.lg, borderRadius: RADII.card, borderWidth: 1, borderColor: COLOR.surface.border, backgroundColor: COLOR.surface.card }}>
      <DsText v="title" accessibilityRole="header">
        What you know about getting in
      </DsText>
      <SwitchRow label="It has a barrier or gate" value={draft.barrier} onValueChange={(barrier) => set({ barrier, ...(barrier ? {} : { closes: '' }) })} />
      {draft.barrier ? (
        <Field label="It shuts at (optional)">
          <TextField value={draft.closes} onChangeText={(closes) => set({ closes })} placeholder="e.g. 22:00" keyboardType="numbers-and-punctuation" maxLength={5} style={{ fontVariant: ['tabular-nums'] }} accessibilityLabel="Closing time" />
        </Field>
      ) : null}
      <ChoiceGroup<Security>
        label="Security"
        options={(Object.keys(SECURITY_LABELS) as Security[]).map((k) => ({ key: k, label: SECURITY_LABELS[k] }))}
        value={draft.security}
        onChange={(security) => set({ security: security === draft.security ? null : security })}
      />
      <ChoiceGroup<LowCars>
        label="Low cars"
        options={(Object.keys(LOW_CARS_LABELS) as LowCars[]).map((k) => ({ key: k, label: LOW_CARS_LABELS[k] }))}
        value={draft.lowCars}
        onChange={(lowCars) => set({ lowCars: lowCars === draft.lowCars ? null : lowCars })}
      />
      <Field label="Anything else (optional)" hint={`${draft.text.length} of ${MAX_NOTE_TEXT}`}>
        <TextField value={draft.text} onChangeText={(text) => set({ text })} placeholder="e.g. Quiet by the far fence" maxLength={MAX_NOTE_TEXT} accessibilityLabel="Anything else" />
      </Field>
      <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
        <Button label="Save note" tier="secondary" style={{ flex: 1 }} block onPress={save} busy={busy} />
        <Button label="Cancel" tier="tertiary" onPress={onDone} />
      </View>
      {error ? <ErrorState title={error} /> : null}
      <DsText v="caption">Notes never show your name. Keep it to what you saw.</DsText>
    </View>
  );
}

/** The themed sets this spot is in ("Coast and seafront: 3 of 8 done"), each opening its places. */
export function Collections({ spot }: { spot: Spot }) {
  const { spots, me } = useStore();
  const [open, setOpen] = useState<CollectionProgress | null>(null);
  const sets = useMemo(() => (spot.kind === 'photo' ? spotCollections(spot, spots, me) : []), [spot, spots, me]);
  if (!sets.length) return null;
  const current = open ? (sets.find((s) => s.def.key === open.def.key) ?? open) : null;
  return (
    <>
      <Section title="Collections">
        <View>
          {sets.map((p) => (
            <ListRow
              key={p.def.key}
              leading={{ icon: p.done === p.total ? 'success' : 'pin', colour: p.done === p.total ? COLOR.state.success : COLOR.text.secondary }}
              title={p.def.title}
              meta={progressText(p)}
              trailing={<ProgressBar done={p.done} total={p.total} />}
              onPress={() => setOpen(p)}
              accessibilityLabel={`${p.def.title}, ${progressText(p)}`}
            />
          ))}
        </View>
      </Section>
      <Sheet visible={!!current} title={current?.def.title ?? ''} onClose={() => setOpen(null)}>
        {current ? (
          <View>
            <DsText v="caption" style={{ marginBottom: SPACING.sm }}>
              {progressText(current)}
            </DsText>
            {current.spots.map((s) => {
              const done = s.completions.some((c) => c.userId === me);
              return (
                <ListRow
                  key={s.id}
                  leading={{ pin: 'photo', colour: done ? COLOR.state.success : COLOR.text.secondary }}
                  title={s.name}
                  meta={[s.region, done ? '✓ Done' : null].filter(Boolean).join(' · ')}
                  onPress={() => {
                    setOpen(null);
                    if (s.id !== spot.id) router.push({ pathname: '/spot/[id]', params: { id: s.id } });
                  }}
                />
              );
            })}
          </View>
        ) : null}
      </Sheet>
    </>
  );
}

function ProgressBar({ done, total }: { done: number; total: number }) {
  return (
    <View accessible={false} style={{ width: 56, height: 4, borderRadius: 2, backgroundColor: COLOR.surface.border, overflow: 'hidden' }}>
      <View style={{ width: `${Math.round((done / Math.max(1, total)) * 100)}%`, height: 4, backgroundColor: COLOR.state.success }} />
    </View>
  );
}

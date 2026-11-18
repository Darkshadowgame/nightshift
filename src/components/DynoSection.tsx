import { useState } from 'react';
import { Image, View } from 'react-native';
import { sheetCrank, sheetRun } from '../lib/classes';
import { changeText, isoDay, latestRun, runChange, runDay, runProblem, runsNewestFirst, runSummary, WHEEL_LOSS, withoutRun, withRun } from '../lib/dyno';
import { parseDynoText, toBhp, toLbFt, type PowerUnit, type TorqueUnit } from '../lib/dynoParse';
import { ocrText } from '../lib/ocr';
import { photoSource } from '../lib/photoSource';
import { photoUri } from '../lib/photos';
import { appNow } from '../lib/appClock';
import { newId, useStore } from '../lib/store';
import type { Build, DynoRun } from '../lib/types';
import { COLOR, RADII, SPACING } from '../theme';
import { Button, Card, DateTimeField, DsText, EmptyState, ErrorState, Field, ListRow, RowDivider, Section, SegmentedControl, StatBlock, TextField, metaLine, useToast } from './ds';
import { openReport } from './Community';
import { DynoBadge } from './DynoBadge';
import { usePhotoFlow } from './PhotoFlow';

interface Draft {
  id?: string;
  photo?: string;
  power: string;
  torque: string;
  powerUnit: PowerUnit;
  torqueUnit: TorqueUnit;
  at: 'wheels' | 'crank';
  date: string;
  shop: string;
  /** What the sheet's text gave, for "We read …: check these". Null: nothing read. */
  read: { power?: number; torque?: number; confidence: number } | null;
}

const POWER_UNITS: PowerUnit[] = ['bhp', 'PS', 'kW'];
const TORQUE_UNITS: TorqueUnit[] = ['lb-ft', 'Nm'];
/** A saved ISO day (isoDay) as a local Date at noon, or null. */
const dayDate = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return y && m && d ? new Date(y, m - 1, d, 12) : null;
};
const number = (s: string) => (s.trim() ? Number(s.replace(',', '.').replace(/[^0-9.]/g, '')) : undefined);

/**
 * The build page's Dyno section (REVIEW-9 dyno decisions): runs from dyno sheets, the latest as
 * a StatBlock with the change since the one before, and the history. Adding one: a photo of the
 * sheet (plate check only if a plate is found), its text read on the phone where the app can
 * (ocr.ts), then the figures in fields to check. Nothing is saved until the owner taps Save.
 */
export function DynoSection({ build: b, mine, onSave }: { build: Build; mine: boolean; onSave: (b: Build) => Promise<void> }) {
  const toast = useToast();
  const demo = useStore().backend === 'local';
  const [draft, setDraft] = useState<Draft | null>(null);
  const [reading, setReading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const runs = runsNewestFirst(b.dynoRuns);
  const latest = latestRun(b.dynoRuns);

  const blank = (photo?: string): Draft => ({ photo, power: '', torque: '', powerUnit: 'bhp', torqueUnit: 'lb-ft', at: 'wheels', date: isoDay(appNow()), shop: '', read: null });

  async function fromPhoto(ref: string) {
    setReading(true);
    const text = await ocrText(photoUri(ref)).catch(() => null);
    const r = text ? parseDynoText(text) : null;
    setReading(false);
    const d = blank(ref);
    if (r && (r.power || r.torque)) {
      d.power = r.power ? String(r.power.value) : '';
      d.powerUnit = r.power ? (r.power.unit === 'hp' || r.power.unit === 'whp' ? 'bhp' : r.power.unit) : 'bhp';
      d.torque = r.torque ? String(r.torque.value) : '';
      d.torqueUnit = r.torque?.unit ?? 'lb-ft';
      if (r.at) d.at = r.at;
      d.read = { power: r.powerBhp, torque: r.torqueLbFt, confidence: r.confidence };
    }
    setDraft(d);
  }
  const flow = usePhotoFlow({ onPhoto: (ref) => void fromPhoto(ref), onError: setError, plates: 'ifFound', cameraDenied: 'Allow camera access to photograph the dyno sheet.' });

  const power = draft ? number(draft.power) : undefined;
  const torque = draft ? number(draft.torque) : undefined;
  const run: DynoRun | null = draft
    ? {
        id: draft.id ?? newId('dy'),
        date: draft.date.trim(),
        powerBhp: power !== undefined ? Math.round(toBhp(power, draft.powerUnit) * 10) / 10 : NaN,
        ...(torque !== undefined ? { torqueLbFt: Math.round(toLbFt(torque, draft.torqueUnit) * 10) / 10 } : {}),
        at: draft.at,
        powerUnit: draft.powerUnit,
        torqueUnit: draft.torqueUnit,
        ...(draft.shop.trim() ? { shop: draft.shop.trim() } : {}),
        ...(draft.photo ? { photo: draft.photo } : {}),
      }
    : null;
  const problem = run ? runProblem(run) : null;

  async function save() {
    if (!run) return;
    if (problem) return setError(problem);
    setSaving(true);
    try {
      await onSave(withRun(b, run));
      setDraft(null);
      toast({ message: `Dyno run saved: ${runSummary(run)}` });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save the dyno run.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    try {
      await onSave(withoutRun(b, id));
      setDraft(null);
      toast({ message: 'Dyno run removed' });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't remove it.");
    }
  }

  if (!mine && !latest) return null;
  const change = latest ? runChange(latest, runs[1], b.kind) : null;
  // REVIEW-10 #3: only a run with its sheet feeds Class; say which figure Class uses, plainly.
  const fed = sheetRun(b);
  const crank = sheetCrank(b);
  const classCaption = !fed
    ? 'Typed figures with no sheet photo never change Class: it uses the claimed power (standard plus mods). Add a photo of the sheet to get the ✓ Dyno badge.'
    : fed.at === 'wheels'
      ? `Class uses about ${crank} bhp at the crank from the run with its sheet${fed.id !== latest?.id ? ` (${runDay(fed.date)})` : ''}: wheel power plus ${Math.round(WHEEL_LOSS[b.kind] * 100)}% for drivetrain loss.`
      : `Class uses the crank (flywheel) figure from the run with its sheet${fed.id !== latest?.id ? ` (${runDay(fed.date)})` : ''}.`;

  return (
    <Section title={`Dyno${runs.length ? ` (${runs.length})` : ''}`}>
      {latest ? (
        <View style={{ gap: SPACING.sm }}>
          <StatBlock
            stats={[
              { value: `${Math.round(latest.powerBhp)}`, unit: latest.at === 'wheels' ? 'whp' : 'bhp', label: latest.at === 'wheels' ? 'Peak · wheels' : 'Peak · crank' },
              ...(latest.torqueLbFt ? [{ value: `${Math.round(latest.torqueLbFt)}`, unit: 'lb-ft', label: 'Peak torque' }] : []),
            ]}
          />
          <DynoBadge build={b} />
          <DsText v="meta">{metaLine([runSummary(latest), latest.shop])}</DsText>
          {change ? <DsText v="secondary">{`Since ${runDay(runs[1].date)}: ${changeText(change)}`}</DsText> : null}
          <DsText v="caption">{classCaption}</DsText>
          {latest.photo ? (
            <Image source={photoSource(latest.photo)} style={{ width: '100%', aspectRatio: 4 / 3, borderRadius: RADII.control, backgroundColor: COLOR.surface.media }} resizeMode="contain" accessibilityLabel="The dyno sheet" />
          ) : null}
        </View>
      ) : (
        <EmptyState variant="inline" title="No dyno runs yet. Add a sheet from a rolling road and it replaces the estimate." />
      )}
      {runs.length > 1 ? (
        <View>
          {runs.slice(1).map((r, i) => {
            const c = runChange(r, runs[i + 2], b.kind);
            return (
              <View key={r.id}>
                {i ? <RowDivider /> : null}
                <ListRow
                  title={runSummary(r)}
                  subtitle={metaLine([r.shop, c ? changeText(c) : null])}
                  onPress={mine ? () => setDraft({ ...blank(r.photo), id: r.id, power: String(r.powerBhp), torque: r.torqueLbFt ? String(r.torqueLbFt) : '', at: r.at, date: r.date, shop: r.shop ?? '' }) : undefined}
                />
              </View>
            );
          })}
        </View>
      ) : null}
      {mine && !draft ? (
        <View style={{ gap: SPACING.sm }}>
          <Button label="Add a dyno sheet" icon="plus" tier="secondary" block busy={flow.busy || reading} onPress={() => flow.pick()} accessibilityLabel="Add a photo or screenshot of a dyno sheet" />
          <Button label="Type the figures" tier="tertiary" size="sm" onPress={() => setDraft(blank())} style={{ alignSelf: 'center' }} />
        </View>
      ) : null}
      {!mine && latest?.photo ? (
        <Button label="Report this dyno sheet" tier="tertiary" size="sm" onPress={() => openReport('build', b.id, b.ownerId, 'dyno sheet')} style={{ alignSelf: 'center' }} />
      ) : null}
      {error && !draft ? <ErrorState title={error} /> : null}
      {flow.view}

      {/* The form sits in the page (not a sheet), so its date picker is the only sheet (4.5). */}
      {draft ? (
        <Card>
          <View style={{ gap: SPACING.md }}>
            <DsText v="title">{draft.id ? 'Dyno run' : 'New dyno run'}</DsText>
            {draft.read ? (
              <DsText v="body" tone="primary">
                {`We read ${[draft.read.power ? `${Math.round(draft.read.power)} ${draft.at === 'wheels' ? 'whp' : 'bhp'}` : null, draft.read.torque ? `${Math.round(draft.read.torque)} lb-ft` : null].filter(Boolean).join(' and ')}: check these against the sheet.`}
              </DsText>
            ) : (
              <DsText v="body">Type the peak figures from your sheet.</DsText>
            )}
            {draft.photo ? <Image source={photoSource(draft.photo)} style={{ width: '100%', height: 160, borderRadius: RADII.control, backgroundColor: COLOR.surface.media }} resizeMode="contain" accessibilityLabel="The dyno sheet" /> : null}
            <Field label="Peak power">
              <View style={{ gap: SPACING.sm }}>
                <TextField value={draft.power} onChangeText={(power) => setDraft({ ...draft, power })} keyboardType="decimal-pad" placeholder="e.g. 312" accessibilityLabel="Peak power" />
                <SegmentedControl accessibilityLabel="Power unit" value={draft.powerUnit} onChange={(powerUnit) => setDraft({ ...draft, powerUnit })} options={POWER_UNITS.map((u) => ({ key: u, label: u }))} />
              </View>
            </Field>
            <Field label="Peak torque (optional)">
              <View style={{ gap: SPACING.sm }}>
                <TextField value={draft.torque} onChangeText={(t) => setDraft({ ...draft, torque: t })} keyboardType="decimal-pad" placeholder="e.g. 295" accessibilityLabel="Peak torque" />
                <SegmentedControl accessibilityLabel="Torque unit" value={draft.torqueUnit} onChange={(torqueUnit) => setDraft({ ...draft, torqueUnit })} options={TORQUE_UNITS.map((u) => ({ key: u, label: u }))} />
              </View>
            </Field>
            <SegmentedControl
              accessibilityLabel="Measured at"
              value={draft.at}
              onChange={(at) => setDraft({ ...draft, at })}
              options={[
                { key: 'wheels', label: 'At the wheels' },
                { key: 'crank', label: 'At the crank' },
              ]}
            />
            <DsText v="caption">Most rolling roads measure at the wheels; some also print a flywheel (crank) figure. Pick the one you typed.</DsText>
            <DateTimeField label="Day of the run" mode="date" past value={dayDate(draft.date)} maxDate={appNow()} onChange={(d) => setDraft({ ...draft, date: isoDay(d) })} />
            <Field label="Rolling road or shop (optional)">
              <TextField value={draft.shop} onChangeText={(shop) => setDraft({ ...draft, shop })} maxLength={60} accessibilityLabel="Rolling road or shop" />
            </Field>
            {/* REVIEW-10 #3: what earns the badge, said plainly where you add the run. */}
            <DsText v="caption" tone={draft.photo ? 'secondary' : 'warning'}>
              {draft.photo
                ? demo
                  ? 'With the sheet photo this run gets the ✓ Dyno badge and counts for Class. In the demo the badge is a sample: sheets aren\'t checked. Others can report fake sheets.'
                  : 'With the sheet photo this run gets the ✓ Dyno badge and counts for Class. Others can report fake sheets.'
                : 'Add a photo of the sheet to get the ✓ Dyno badge. Others can report fake sheets. Without a sheet, the run is kept in your history but doesn\'t change Class.'}
            </DsText>
            {error ? <ErrorState title={error} /> : null}
            <Button label="Save dyno run" block haptic="success" busy={saving} onPress={save} />
            <Button label="Cancel" tier="tertiary" size="sm" onPress={() => { setDraft(null); setError(null); }} style={{ alignSelf: 'center' }} />
            {draft.id ? <Button label="Remove this run" tier="destructive" block onPress={() => remove(draft.id!)} /> : null}
          </View>
        </Card>
      ) : null}
    </Section>
  );
}

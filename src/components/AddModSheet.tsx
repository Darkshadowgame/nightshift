import { useState } from 'react';
import { MOD_GROUPS, type QuickMod } from '../data/catalog';
import { allVariants } from '../data/vehicles';
import { classOf } from '../lib/classes';
import { powerText } from '../lib/dyno';
import { OFF_ROAD_TAG } from '../lib/legality';
import { newId, useStore } from '../lib/store';
import { groupCategory, hasQuickMod, quickModsFor, stageFromMods, suggestedGain } from '../lib/tune';
import type { Build, ModCategory } from '../lib/types';
import { findVariant } from '../lib/vehicles';
import { MOD_SECTIONS, sectionOfGroup, type ModSection } from './BuildBits';
import { Button, ChoiceGroup, DsText, ErrorState, Field, SegmentedControl, Sheet, TextField, useToast } from './ds';

/** The parts most people add first, in this order; the rest are behind "More parts". */
const FEATURED = [
  'remap', 'flash', 'fuel-map', 'induction', 'cai', 'cat-back', 'downpipe', 'intercooler', 'slip-on', 'full-system', 'airbox', 'derestrict', 'quickshifter',
  'coilovers', 'lowering-springs', 'pads-discs', 'bbk', 'arb', 'fork-springs', 'rear-shock', 'braided',
  'wheels', 'forged-wheels', 'tyres', 'semi-slicks', 'spacers',
  'wrap', 'tints', 'splitter', 'spoiler', 'buckets', 'led', 'debadge', 'tail-tidy', 'rearsets', 'head-unit',
];
const FIRST = 8;

/**
 * "Add a mod" (Redesign 2, 3.9): a short sheet, never the whole Edit build form. The kind of part
 * (Engine, Suspension, Wheels, Looks) → the common parts → an optional power gain → Add. The toast
 * says the build's class and power afterwards, so you see what it did.
 */
export function AddModSheet({ visible, build, onClose }: { visible: boolean; build: Build; onClose: () => void }) {
  const { saveBuild } = useStore();
  const toast = useToast();
  const asp = build.engineSwap ? undefined : findVariant(allVariants(), build.vehicleId)?.asp;
  const parts = quickModsFor(build.kind, asp).filter((c) => !hasQuickMod(build.mods, c));
  const [section, setSection] = useState<ModSection>('engine');
  const [picked, setPicked] = useState<QuickMod | null>(null);
  const [typed, setTyped] = useState('');
  const [gain, setGain] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [more, setMore] = useState(false);
  const inSection = parts.filter((c) => sectionOfGroup(c.group) === section);
  const rank = (key: string) => (FEATURED.includes(key) ? FEATURED.indexOf(key) : FEATURED.length);
  const ordered = [...inSection].sort((a, b) => rank(a.key) - rank(b.key));
  const shown = more ? ordered : ordered.slice(0, FIRST);
  const hidden = ordered.length - shown.length;
  const name = picked?.name ?? typed.trim();
  const stage = build.tuneStage ?? stageFromMods(build.mods);
  const suggested = picked ? suggestedGain(picked, build.engineSwap?.bhp ?? build.stockBhp, stage) : undefined;

  function close() {
    setPicked(null);
    setTyped('');
    setGain('');
    setError(null);
    onClose();
  }

  async function add() {
    if (!name) return setError('Pick a part, or type one.');
    const typedGain = Number(gain.replace(/[^0-9]/g, ''));
    const bhpGain = gain.trim() ? (typedGain > 0 && typedGain < 1000 ? typedGain : NaN) : suggested;
    if (Number.isNaN(bhpGain)) return setError('Type the gain as a number of bhp, or leave it empty.');
    const fallback: ModCategory = MOD_GROUPS.find((g) => sectionOfGroup(g.key) === section)?.category ?? 'other';
    const category = picked ? groupCategory(picked) : fallback;
    const next: Build = { ...build, mods: [...build.mods, { id: newId('m'), category, name: name.slice(0, 60), ...(bhpGain ? { bhpGain } : {}) }] };
    setBusy(true);
    try {
      await saveBuild(next);
      toast({ message: `Added ${name}. Now ${powerText(next)}, Class ${classOf(next)}` });
      close();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't add the mod.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet visible={visible} title="Add a mod" onClose={close} doneLabel="Cancel">
      <SegmentedControl<ModSection>
        accessibilityLabel="Kind of part"
        value={section}
        onChange={(s) => {
          setSection(s);
          setMore(false);
          setPicked(null);
          setError(null);
        }}
        options={MOD_SECTIONS.map((s) => ({ key: s.key, label: s.label }))}
      />
      {shown.length ? (
        <ChoiceGroup<string>
          label="Common parts"
          value={picked?.key ?? null}
          chips
          onChange={(k) => {
            const c = shown.find((x) => x.key === k) ?? null;
            setPicked(picked?.key === k ? null : c);
            setTyped('');
            setGain('');
            setError(null);
          }}
          options={shown.map((c) => ({ key: c.key, label: c.name }))}
        />
      ) : null}
      {hidden > 0 ? <Button label={`More parts (${hidden})`} tier="tertiary" size="sm" onPress={() => setMore(true)} style={{ alignSelf: 'flex-start' }} /> : null}
      <Field label={inSection.length ? 'Or type it' : 'The part'}>
        <TextField
          value={typed}
          onChangeText={(t) => {
            setTyped(t);
            if (t) setPicked(null);
            setError(null);
          }}
          placeholder="e.g. Wagner intercooler"
          maxLength={60}
          accessibilityLabel="Mod name"
        />
      </Field>
      {section === 'engine' ? (
        <Field label="Power gain, bhp (optional)" hint={suggested ? `Leave it empty to use about +${suggested} bhp.` : undefined}>
          <TextField value={gain} onChangeText={setGain} keyboardType="number-pad" placeholder={suggested ? `${suggested}` : 'e.g. 10'} maxLength={3} accessibilityLabel="Power gain in bhp" />
        </Field>
      ) : null}
      {picked?.roadLegal === false ? <DsText v="caption" tone="warning">{`${OFF_ROAD_TAG}: you can still log it.`}</DsText> : null}
      {error ? <ErrorState title={error} /> : null}
      <Button label={name ? `Add ${name}` : 'Add'} block haptic="success" busy={busy} onPress={add} />
    </Sheet>
  );
}

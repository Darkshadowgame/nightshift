import { useState } from 'react';
import { View } from 'react-native';
import { MOD_GROUPS, type QuickMod } from '../data/catalog';
import { allVariants } from '../data/vehicles';
import { appNow } from '../lib/appClock';
import { noteMod } from '../lib/buildLogStore';
import { classOf } from '../lib/classes';
import { isoDay, powerText } from '../lib/dyno';
import { OFF_ROAD_TAG } from '../lib/legality';
import { newId, useStore } from '../lib/store';
import { groupCategory, hasQuickMod, quickModsFor, stageFromMods, suggestedGain } from '../lib/tune';
import type { Build, Mod, ModCategory } from '../lib/types';
import { findVariant, type Aspiration } from '../lib/vehicles';
import { MOD_SECTIONS, sectionOfGroup, type ModSection } from './BuildBits';
import { COLOR } from '../theme';
import { Button, DsText, ErrorState, Field, Icon, ListRow, RowDivider, SegmentedControl, Sheet, TextField, useToast } from './ds';

/** The parts most people add first, in this order; the rest are behind "More parts". */
const FEATURED = [
  'remap', 'flash', 'fuel-map', 'induction', 'cai', 'cat-back', 'downpipe', 'intercooler', 'slip-on', 'full-system', 'airbox', 'derestrict', 'quickshifter',
  'coilovers', 'lowering-springs', 'pads-discs', 'bbk', 'arb', 'fork-springs', 'rear-shock', 'braided',
  'wheels', 'forged-wheels', 'tyres', 'semi-slicks', 'spacers',
  'wrap', 'tints', 'splitter', 'spoiler', 'buckets', 'led', 'debadge', 'tail-tidy', 'rearsets', 'head-unit',
];
/** Rows shown before "More parts": short enough that Add stays on screen at 375x667. */
const FIRST = 5;
/** The last row: type a part that isn't listed. */
const OTHER = '__other';

/**
 * "Add a mod" (Redesign 2, 3.9): a short sheet, never the whole Edit build form. The kind of part
 * (Engine, Suspension, Wheels, Looks) → the common parts as a list with a tick on the one picked
 * (4.4: one of more than five is a list, never chips) → "Something else" to type one → the power
 * gain once a part is picked → "Add {part}" (shown only once there's a part). The toast says the build's class and power afterwards.
 */
export function AddModSheet({
  visible,
  build,
  onClose,
  onAdd,
  asp: aspGiven,
  title = 'Add a mod',
}: {
  visible: boolean;
  build: Build;
  onClose: () => void;
  /**
   * The build form (Add a car or bike, Edit build): hand the mod back to the form's draft instead
   * of saving it, so a mod is picked the same way everywhere (K2).
   */
  onAdd?: (mod: Mod) => void;
  /** The engine kind when the form knows it (a guess for a typed car, the donor's after a swap). */
  asp?: Aspiration;
  /** The sheet's title: "Add a mod", or "Add to wishlist" when the part is planned, not fitted. */
  title?: string;
}) {
  const { saveBuild } = useStore();
  const toast = useToast();
  const asp = aspGiven ?? (build.engineSwap ? undefined : findVariant(allVariants(), build.vehicleId)?.asp);
  const parts = quickModsFor(build.kind, asp).filter((c) => !hasQuickMod(build.mods, c));
  const [section, setSection] = useState<ModSection>('engine');
  const [picked, setPicked] = useState<QuickMod | null>(null);
  const [typed, setTyped] = useState('');
  const [gain, setGain] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [more, setMore] = useState(false);
  const [other, setOther] = useState(false);
  const inSection = parts.filter((c) => sectionOfGroup(c.group) === section);
  const rank = (key: string) => (FEATURED.includes(key) ? FEATURED.indexOf(key) : FEATURED.length);
  const ordered = [...inSection].sort((a, b) => rank(a.key) - rank(b.key));
  const shown = more ? ordered : ordered.slice(0, FIRST);
  const hidden = ordered.length - shown.length;
  const name = picked?.name ?? (other ? typed.trim() : '');
  const stage = build.tuneStage ?? stageFromMods(build.mods);
  const suggested = picked ? suggestedGain(picked, build.engineSwap?.bhp ?? build.stockBhp, stage) : undefined;

  function close() {
    setPicked(null);
    setOther(false);
    setMore(false);
    setTyped('');
    setGain('');
    setError(null);
    onClose();
  }

  async function add() {
    if (!name) return setError(other ? 'Type the part, or pick one from the list.' : 'Pick a part, or tap Something else to type one.');
    const typedGain = Number(gain.replace(/[^0-9]/g, ''));
    const bhpGain = gain.trim() ? (typedGain > 0 && typedGain < 1000 ? typedGain : NaN) : suggested;
    if (Number.isNaN(bhpGain)) return setError('Type the gain as a number of bhp, or leave it empty.');
    const fallback: ModCategory = MOD_GROUPS.find((g) => sectionOfGroup(g.key) === section)?.category ?? 'other';
    const category = picked ? groupCategory(picked) : fallback;
    const mod: Mod = { id: newId('m'), category, name: name.slice(0, 60), ...(bhpGain ? { bhpGain } : {}) };
    if (onAdd) {
      onAdd(mod);
      close();
      return;
    }
    const next: Build = { ...build, mods: [...build.mods, mod] };
    setBusy(true);
    try {
      await saveBuild(next);
      // The day it went on, kept on the phone for the build timeline.
      noteMod(build.id, mod.name, { on: isoDay(appNow()) });
      // One line at 1.3x text too (4.7): the part's name is on the button just tapped.
      toast({ message: `Added. Now ${powerText(next)}, Class ${classOf(next)}` });
      close();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't add the mod.");
    } finally {
      setBusy(false);
    }
  }

  return (
    // One way out at a time (4.5, Review 21): Done until a part is picked, then the Add button is the
    // sheet's action and Done steps away, so nobody wonders which of the two saves. Untick the part (or
    // tap outside) to leave without adding.
    <Sheet visible={visible} title={title} onClose={close} hideDone={!!name}>
      <SegmentedControl<ModSection>
        accessibilityLabel="Kind of part"
        value={section}
        onChange={(s) => {
          setSection(s);
          setMore(false);
          setPicked(null);
          setOther(false);
          setTyped('');
          setError(null);
        }}
        options={MOD_SECTIONS.map((s) => ({ key: s.key, label: s.label }))}
      />
      <View accessibilityRole="radiogroup" accessibilityLabel="Common parts">
        {shown.map((c, i) => {
          const on = picked?.key === c.key;
          return (
            <View key={c.key}>
              {i ? <RowDivider /> : null}
              <ListRow
                title={c.name}
                chevron={false}
                trailing={on ? <Icon name="check" size={20} colour={COLOR.text.primary} /> : undefined}
                onPress={() => {
                  setPicked(on ? null : c);
                  setOther(false);
                  setTyped('');
                  setGain('');
                  setError(null);
                }}
                accessibilityLabel={on ? `${c.name}, selected` : c.name}
              />
            </View>
          );
        })}
        {shown.length ? <RowDivider /> : null}
        <ListRow
          title={inSection.length ? 'Something else' : 'Type the part'}
          chevron={false}
          trailing={other ? <Icon name="check" size={20} colour={COLOR.text.primary} /> : <Icon name="edit" size={18} colour={COLOR.text.secondary} />}
          onPress={() => {
            setOther(!other);
            setPicked(null);
            setGain('');
            setError(null);
          }}
          accessibilityLabel={other ? 'Something else, selected' : 'Something else: type the part'}
        />
      </View>
      {hidden > 0 && !other ? <Button label={`More parts (${hidden})`} tier="tertiary" size="sm" onPress={() => setMore(true)} style={{ alignSelf: 'flex-start' }} /> : null}
      {other ? (
        <Field label="The part">
          <TextField
            value={typed}
            onChangeText={(t) => {
              setTyped(t);
              setError(null);
            }}
            placeholder="e.g. Wagner intercooler"
            maxLength={60}
            autoFocus
            accessibilityLabel="Mod name"
          />
        </Field>
      ) : null}
      {section === 'engine' && name ? (
        <Field label="Power gain, bhp (optional)" hint={suggested ? `Leave it empty to use about +${suggested} bhp.` : undefined}>
          <TextField value={gain} onChangeText={setGain} keyboardType="number-pad" placeholder={suggested ? `${suggested}` : 'e.g. 10'} maxLength={3} accessibilityLabel="Power gain in bhp" />
        </Field>
      ) : null}
      {picked?.roadLegal === false ? <DsText v="caption" tone="warning">{`${OFF_ROAD_TAG}: you can still log it.`}</DsText> : null}
      {error ? <ErrorState title={error} /> : null}
      {/* No primary until there's a part to add (Review 19 #40, 4.3): then it names it. */}
      {name ? <Button label={`Add ${name}`} block haptic="success" busy={busy} onPress={add} /> : null}
    </Sheet>
  );
}

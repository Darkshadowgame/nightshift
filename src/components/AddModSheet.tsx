import { useState } from 'react';
import { View } from 'react-native';
import { MOD_GROUPS, type ModGroup, type QuickMod } from '../data/catalog';
import { allVariants } from '../data/vehicles';
import { OFF_ROAD_TAG } from '../lib/legality';
import { modCount, modUnit } from '../lib/modGroups';
import { newId, useStore } from '../lib/store';
import { groupCategory, hasQuickMod, quickModsFor, stageFromMods, suggestedGain } from '../lib/tune';
import type { Build } from '../lib/types';
import { findVariant } from '../lib/vehicles';
import { SPACING } from '../theme';
import { Button, Chip, DsText, ErrorState, Field, Sheet, Tabs, TextField, useToast } from './ds';

/**
 * "Add a mod" (REVIEW-10 #14): a short sheet, not the whole edit form. Pick a part (tabs for the
 * kind of part, chips for the parts) or type one, an optional note, Add. The tune stage and
 * gains stay in Edit build.
 */
export function AddModSheet({ visible, build, onClose }: { visible: boolean; build: Build; onClose: () => void }) {
  const { saveBuild } = useStore();
  const toast = useToast();
  const asp = build.engineSwap ? undefined : findVariant(allVariants(), build.vehicleId)?.asp;
  const chips = quickModsFor(build.kind, asp).filter((c) => !hasQuickMod(build.mods, c));
  const groups = MOD_GROUPS.filter((g) => chips.some((c) => c.group === g.key));
  const [group, setGroup] = useState<ModGroup>('engine');
  const [picked, setPicked] = useState<QuickMod | null>(null);
  const [typed, setTyped] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const active = groups.some((g) => g.key === group) ? group : groups[0]?.key ?? 'engine';
  const name = picked?.name ?? typed.trim();

  function close() {
    setPicked(null);
    setTyped('');
    setNote('');
    setError(null);
    onClose();
  }

  async function add() {
    if (!name) return;
    const category = picked ? groupCategory(picked) : MOD_GROUPS.find((g) => g.key === active)?.category ?? 'other';
    const gain = picked ? suggestedGain(picked, build.engineSwap?.bhp ?? build.stockBhp, build.tuneStage ?? stageFromMods(build.mods)) : undefined;
    const mods = [...build.mods, { id: newId('m'), category, name: name.slice(0, 60), ...(gain ? { bhpGain: gain } : {}), ...(note.trim() ? { note: note.trim().slice(0, 80) } : {}) }];
    const sameJob = build.mods.some((m) => modUnit(m) === modUnit({ name }));
    setBusy(true);
    try {
      await saveBuild({ ...build, mods });
      toast({ message: sameJob ? `Added ${name}. It counts with a part you have, so still ${modCount(mods)} mods.` : `Added ${name}` });
      close();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't add the mod.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet visible={visible} title="Add a mod" onClose={close} doneLabel="Cancel">
      <Tabs<ModGroup> accessibilityLabel="Part type" value={active} onChange={(g) => { setGroup(g); setPicked(null); }} options={groups.map((g) => ({ key: g.key, label: g.label }))} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm }} accessibilityRole="radiogroup" accessibilityLabel="Part">
        {chips
          .filter((c) => c.group === active)
          .map((c) => (
            <Chip
              key={c.key}
              role="radio"
              label={c.name}
              on={picked?.key === c.key}
              onPress={() => {
                setPicked(picked?.key === c.key ? null : c);
                setTyped('');
              }}
              accessibilityLabel={c.roadLegal === false ? `${c.name}, ${OFF_ROAD_TAG}` : c.name}
            />
          ))}
      </View>
      <Field label="Or type it">
        <TextField
          value={typed}
          onChangeText={(t) => {
            setTyped(t);
            if (t) setPicked(null);
          }}
          placeholder="e.g. Wagner intercooler"
          maxLength={60}
          accessibilityLabel="Mod name"
        />
      </Field>
      <Field label="Note (optional)" hint="Brand, spec or who fitted it.">
        <TextField value={note} onChangeText={setNote} placeholder="e.g. BC Racing BR, 30 mm drop" maxLength={80} accessibilityLabel="Note" />
      </Field>
      {picked?.roadLegal === false ? <DsText v="caption" tone="warning">{`${OFF_ROAD_TAG}: you can log it, but it earns no rep.`}</DsText> : null}
      {error ? <ErrorState title={error} /> : null}
      <Button label={name ? `Add ${name}` : 'Add'} block haptic="success" busy={busy} disabled={!name} hint="Pick a part or type one first" onPress={add} />
      <DsText v="caption">Tune stage and power gains are in Edit build.</DsText>
    </Sheet>
  );
}

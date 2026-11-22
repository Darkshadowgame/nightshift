import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { NotFoundState, PAGE } from '../../components/Detail';
import { Button, DsText, EmptyState, ErrorState, Field, ListRow, RowDivider, Section, Sheet, StatBlock, SwitchRow, TextField, useToast } from '../../components/ds';
import { costTotal, logOf, modKey, parsePounds, poundsText } from '../../lib/buildLog';
import { noteMod, setHideCosts, useBuildLog } from '../../lib/buildLogStore';
import { plural } from '../../lib/format';
import { countedMods } from '../../lib/modGroups';
import { useStore } from '../../lib/store';
import { SPACING } from '../../theme';

const HIDDEN = '£•••';

/**
 * What the build has cost: a running total and a price per mod, private to this phone. Nothing here
 * is saved to the server, shown on the build page, put on the spec card or shared; the build's own
 * share text never includes it. "Hide the total" masks it from you too (on a phone someone else might look at).
 */
export default function BuildCosts() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { builds, me } = useStore();
  const { log } = useBuildLog();
  const toast = useToast();
  const [editing, setEditing] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const b = builds.find((x) => x.id === id);
  if (!b || b.ownerId !== me) return <NotFoundState what="Build" message="Only the owner can see this." />;
  const bl = logOf(log, b.id);
  const mods = countedMods(b.mods);
  const { total, priced } = costTotal(b.mods, bl);
  const hide = log.hideCosts;
  const money = (n: number) => (hide ? HIDDEN : poundsText(n));

  function open(name: string) {
    setEditing(name);
    setText(bl.mods[modKey(name)]?.cost ? String(bl.mods[modKey(name)]!.cost) : '');
    setError(null);
  }
  function save() {
    if (!editing) return;
    const n = parsePounds(text);
    if (n === null) return setError('Type a whole number of pounds, like 450.');
    noteMod(b!.id, editing, { cost: n });
    setEditing(null);
    toast({ message: 'Saved on this phone' });
  }

  return (
    <ScrollView contentContainerStyle={PAGE} showsVerticalScrollIndicator={false}>
      <Section title="Spent so far">
        <StatBlock stats={[{ value: priced ? money(total) : '£0', label: priced ? `${plural(priced, 'mod')} priced` : 'Nothing priced yet' }]} />
        <DsText v="caption">Private. Only on this phone: never sent to the server, never shown to anyone else, and left off the spec card and anything you share.</DsText>
        <SwitchRow label="Hide the total from me" hint="Shows £••• here until you switch it off." value={hide} onValueChange={setHideCosts} />
      </Section>
      <Section title="By mod">
        {mods.length === 0 ? (
          <EmptyState variant="inline" title="Add a mod, then add what it cost." />
        ) : (
          <View>
            {mods.map((m, i) => {
              const cost = bl.mods[modKey(m.name)]?.cost;
              return (
                <View key={m.id}>
                  {i ? <RowDivider /> : null}
                  <ListRow
                    title={m.name}
                    chevron={false}
                    trailing={<DsText v={cost ? 'bodyStrong' : 'meta'}>{cost ? money(cost) : 'Add cost'}</DsText>}
                    onPress={() => open(m.name)}
                    accessibilityLabel={cost && !hide ? `${m.name}, ${poundsText(cost)}. Change` : `${m.name}. ${cost ? 'Change the cost' : 'Add a cost'}`}
                  />
                </View>
              );
            })}
          </View>
        )}
      </Section>
      <Sheet visible={!!editing} title={editing ?? 'Cost'} onClose={() => setEditing(null)} hideDone>
        <Field label="What it cost, in pounds" hint="Parts and fitting. Private to this phone.">
          <TextField value={text} onChangeText={(t) => { setText(t); setError(null); }} keyboardType="number-pad" placeholder="e.g. 450" maxLength={8} autoFocus accessibilityLabel="Cost in pounds" />
        </Field>
        {error ? <ErrorState title={error} /> : null}
        <Button label="Save" block onPress={save} />
        {editing && bl.mods[modKey(editing)]?.cost ? (
          <Button label="Remove the cost" tier="tertiary" block onPress={() => { noteMod(b.id, editing, { cost: null }); setEditing(null); toast({ message: 'Cost removed', tone: 'info' }); }} />
        ) : null}
      </Sheet>
    </ScrollView>
  );
}

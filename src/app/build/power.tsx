import { useLocalSearchParams } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { NotFoundState, PAGE } from '../../components/Detail';
import { DsText, Section, StatBlock } from '../../components/ds';
import { DynoSection } from '../../components/DynoSection';
import { bhpPerTonne, classOf, sheetRun } from '../../lib/classes';
import { headlinePower, whpText } from '../../lib/dyno';
import { useStore } from '../../lib/store';
import { SPACING } from '../../theme';

/**
 * Power and dyno (Redesign 2, 3.9; T5), pushed from the build page: how the bhp is worked out in
 * one line, the figures behind it (weight, bhp per tonne, wheel power) and the dyno runs. The only
 * screen that shows whp, bhp per tonne or a claimed figure.
 */
export default function PowerAndDyno() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { builds, me, saveBuild } = useStore();
  const b = builds.find((x) => x.id === id);
  if (!b) return <NotFoundState what="Build" message="This build no longer exists." />;
  const mine = b.ownerId === me;
  const power = headlinePower(b);
  const whp = whpText(b);
  const fromSheet = !!sheetRun(b);
  const how = fromSheet
    ? `${power.bhp} bhp${power.est ? ', worked out from the wheel figure on the dyno sheet' : ', from the dyno sheet'}.`
    : `${power.bhp} bhp claimed: the ${b.engineSwap ? 'donor engine' : 'standard'} ${b.engineSwap?.bhp ?? b.stockBhp} bhp plus the mods. Add a run with its sheet photo to get ✓ Dyno.`;

  return (
    <ScrollView contentContainerStyle={PAGE}>
      <Section title="Power">
        <DsText v="title">{`${b.make} ${b.model}`}</DsText>
        <DsText v="body">{how}</DsText>
        <StatBlock
          stats={[
            { value: `${power.bhp}`, unit: power.est ? 'bhp est.' : 'bhp', label: fromSheet ? 'Dyno' : 'Claimed' },
            { value: `${b.weightKg}`, unit: 'kg', label: b.kind === 'bike' ? 'Wet weight' : 'Kerb weight' },
            { value: `${bhpPerTonne(b)}`, label: 'bhp per tonne' },
          ]}
        />
        <View style={{ gap: SPACING.xs }}>
          {whp ? <DsText v="secondary">{whp}</DsText> : null}
          <DsText v="caption">{`Class ${classOf(b)} comes from bhp per tonne. ${b.kind === 'bike' ? 'Bikes' : 'Cars'} have their own scale.`}</DsText>
        </View>
      </Section>
      <DynoSection build={b} mine={mine} onSave={saveBuild} />
    </ScrollView>
  );
}

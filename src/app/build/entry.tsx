import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { NotFoundState, PAGE } from '../../components/Detail';
import { Button, DateTimeField, DsText, ErrorState, Field, FitImage, Section, useToast } from '../../components/ds';
import { usePhotoFlow } from '../../components/PhotoFlow';
import { appNow } from '../../lib/appClock';
import { fittedOn, logOf, modKey } from '../../lib/buildLog';
import { noteMod, useBuildLog } from '../../lib/buildLogStore';
import { isoDay } from '../../lib/dyno';
import { photoSource } from '../../lib/photoSource';
import { useStore } from '../../lib/store';
import { COLOR, RADII, SPACING } from '../../theme';

const toDate = (day: string) => {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

/** One photo slot: a thumbnail with Replace and Remove, or Add. Saves straight away. */
function Slot({ label, photo, onPhoto, onRemove, onError }: { label: string; photo?: string; onPhoto: (ref: string) => void; onRemove: () => void; onError: (m: string | null) => void }) {
  const flow = usePhotoFlow({ aspect: '4:3', onError, onPhoto: (ref) => onPhoto(ref) });
  return (
    <Field label={label}>
      {flow.view}
      {photo ? (
        <View style={{ gap: SPACING.sm }}>
          <FitImage fit="cover" source={photoSource(photo)} frameAspect={4 / 3} style={{ width: '100%', aspectRatio: 4 / 3, borderRadius: RADII.card, backgroundColor: COLOR.surface.media }} accessibilityLabel={`${label} photo`} />
          <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
            <Button label="Replace" tier="secondary" size="sm" busy={flow.busy} onPress={() => flow.pick()} />
            <Button label="Remove" tier="tertiary" size="sm" onPress={onRemove} />
          </View>
        </View>
      ) : (
        <Button label={`Add a ${label.toLowerCase()} photo`} tier="secondary" icon="plus" busy={flow.busy} onPress={() => flow.pick()} />
      )}
    </Field>
  );
}

/**
 * A mod's day and its before and after photos (pushed from the timeline, owner only). Each change
 * is kept as it's made, on this phone. The photos go through the same crop and number-plate check as
 * every other photo.
 */
export default function ModEntry() {
  const { id, mod: modName } = useLocalSearchParams<{ id: string; mod: string }>();
  const { builds, me } = useStore();
  const { log } = useBuildLog();
  const toast = useToast();
  const [error, setError] = useState<string | null>(null);
  const b = builds.find((x) => x.id === id);
  const mod = b?.mods.find((m) => m.name === modName);
  if (!b || !mod || b.ownerId !== me) return <NotFoundState what="Mod" message="This mod isn't on your build any more." />;
  const bl = logOf(log, b.id);
  const note = bl.mods[modKey(mod.name)];
  const today = appNow();
  const day = fittedOn(b, mod, bl, today);
  const save = (patch: Parameters<typeof noteMod>[2], message: string) => {
    noteMod(b.id, mod.name, patch);
    toast({ message });
  };

  return (
    <ScrollView contentContainerStyle={PAGE} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <View style={{ gap: SPACING.xs }}>
        <DsText v="title" accessibilityRole="header">{mod.name}</DsText>
        <DsText v="secondary">{`${b.make} ${b.model}`}</DsText>
      </View>
      <Section title="When">
        <DateTimeField label="Day it went on" mode="date" past days={14} value={day ? toDate(day) : null} placeholder="Pick a day" maxDate={today} onChange={(d) => save({ on: isoDay(d) }, 'Day saved')} />
      </Section>
      <Section title="Photos">
        <DsText v="secondary">Kept on this phone, and shown on the timeline.</DsText>
        <Slot label="Before" photo={note?.before} onError={setError} onPhoto={(ref) => save({ before: ref }, 'Photo saved')} onRemove={() => noteMod(b.id, mod.name, { before: null })} />
        <Slot label="After" photo={note?.after} onError={setError} onPhoto={(ref) => save({ after: ref }, 'Photo saved')} onRemove={() => noteMod(b.id, mod.name, { after: null })} />
        {error ? <ErrorState title={error} /> : null}
      </Section>
    </ScrollView>
  );
}

import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { NightMap } from '../../components/NightMap';
import type { MapPin, NightMapHandle } from '../../components/mapTypes';
import { PlaceSearch } from '../../components/PlaceSearch';
import { Button, Card, Chip, Row, Section, Txt, s as ui } from '../../components/ui';
import { BAN_ZONES } from '../../data/seed';
import { banZoneWarning } from '../../lib/events';
import { draftBanZone, draftProblem, longGap, MAX_POINT_GAP_MILES, pathMiles, type SpotDraft } from '../../lib/spots';
import { nameForPlace } from '../../lib/location';
import { shouldAutoName } from '../../lib/placeNames';
import { useStore } from '../../lib/store';
import type { LatLng } from '../../lib/types';
import { C, SPOT_COLOURS } from '../../theme';

/** Suggest a drive (long-press points along the road) or a photo spot (one point). */
export default function SuggestPlace() {
  const params = useLocalSearchParams<{ kind?: string }>();
  const { users, me, spots, suggestSpot } = useStore();
  const meUser = users.find((u) => u.id === me);
  const [kind, setKind] = useState<SpotDraft['kind']>(params.kind === 'photo' ? 'photo' : 'drive');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [points, setPoints] = useState<LatLng[]>([]);
  const [error, setError] = useState<string | null>(null);

  const draft: SpotDraft = { kind, name, description, points };
  const zone = draftBanZone(points, BAN_ZONES);
  const colour = SPOT_COLOURS[kind];
  const miles = pathMiles(points);
  const gap = kind === 'drive' ? longGap(points) : null;

  function pick(k: SpotDraft['kind']) {
    setKind(k);
    setPoints((p) => (k === 'photo' ? p.slice(-1) : p));
    setError(null);
  }

  const mapRef = useRef<NightMapHandle>(null);
  /** The geocoder's last name, so a name you typed is never replaced. */
  const autoName = useRef<string | undefined>(undefined);

  function add(at: LatLng) {
    setError(null);
    setPoints((p) => (kind === 'photo' ? [at] : [...p, at]));
    // Name a photo spot after where it is, and a drive after where it starts. You can edit it.
    if (kind === 'photo' || points.length === 0) {
      nameForPlace(at).then((found) => {
        if (!found) return;
        setName((n) => {
          if (!shouldAutoName(n, autoName.current)) return n;
          autoName.current = found;
          return found;
        });
      });
    }
  }

  function submit() {
    setError(null);
    const problem = draftProblem(draft, spots);
    if (problem) return setError(problem);
    try {
      const { id } = suggestSpot(draft);
      router.replace({ pathname: '/spot/[id]', params: { id } });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save your suggestion.');
    }
  }

  const pins: MapPin[] = points.map((p, i) => ({
    id: `p${i}`,
    at: p,
    glyph: kind,
    colour: kind === 'photo' || i === 0 || i === points.length - 1 ? colour : C.fog,
    title: kind === 'photo' ? 'Photo spot' : i === 0 ? 'Start' : `Point ${i + 1}`,
    size: kind === 'photo' || i === 0 || i === points.length - 1 ? 34 : 24,
  }));

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 18, paddingBottom: 60 }} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive" automaticallyAdjustKeyboardInsets>
      <Row gap={6}>
        <Chip label="Drive" on={kind === 'drive'} colour={SPOT_COLOURS.drive} onPress={() => pick('drive')} />
        <Chip label="Photo spot" on={kind === 'photo'} colour={SPOT_COLOURS.photo} onPress={() => pick('photo')} />
      </Row>

      <Txt v="muted">
        {kind === 'drive'
          ? 'A great road to drive within the speed limits. Drives are never timed or ranked. Long-press the map along the road, start to finish: each point becomes a checkpoint.'
          : 'Somewhere that looks good in photos, with space to pull fully off the road. Long-press the map to place it.'}
      </Txt>

      <PlaceSearch onPick={(h) => mapRef.current?.animateTo(h.at, kind === 'drive' ? 0.25 : 0.06)} />

      <View style={{ height: 300, borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: colour }}>
        <NightMap
          ref={mapRef}
          pins={pins}
          paths={
            kind === 'drive' && points.length > 1
              ? [
                  { id: 'draft', coords: points, colour },
                  ...(gap ? [{ id: 'gap', coords: [points[gap.index], points[gap.index + 1]], colour: C.alert, dashed: true }] : []),
                ]
              : []
          }
          circles={BAN_ZONES.map((z) => ({ id: z.id, centre: z.centre, radiusMiles: z.radiusMiles, colour: C.alert }))}
          centre={meUser?.home ?? { lat: 52.7, lng: -1.7 }}
          span={0.6}
          onLongPress={add}
        />
      </View>

      <Row style={{ justifyContent: 'space-between' }}>
        <Txt v="mono">
          {kind === 'drive'
            ? `${points.length} POINT${points.length === 1 ? '' : 'S'}${points.length > 1 ? ` · ${miles.toFixed(1)} MI` : ''}`
            : points.length
              ? 'PLACED'
              : 'NOT PLACED'}
        </Txt>
        <Row gap={6}>
          {kind === 'drive' ? <Chip label="Undo point" onPress={() => setPoints((p) => p.slice(0, -1))} /> : null}
          <Chip label="Clear" onPress={() => setPoints([])} />
        </Row>
      </Row>

      {kind === 'drive' ? (
        gap ? (
          <Card accent={C.alert}>
            <Txt>
              Points {gap.index + 1} and {gap.index + 2} are {gap.miles.toFixed(1)} mi apart (red line). Add points along the road in
              between, at least every {MAX_POINT_GAP_MILES} mi, so the drive follows the road and the pace check is fair.
            </Txt>
            <Txt v="muted">New points go on the end, so Undo back to point {gap.index + 1} and drop the missing ones in order.</Txt>
          </Card>
        ) : (
          <Txt v="muted">Drop a point at least every {MAX_POINT_GAP_MILES} mi along the road.</Txt>
        )
      ) : null}

      {zone ? (
        <Card accent={C.alert}>
          <Txt>{banZoneWarning(name.trim() || 'This place', zone)}</Txt>
          <Txt v="muted">You can still suggest it, but think twice about sending people here at night.</Txt>
        </Card>
      ) : null}

      <Section title="Details">
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder={kind === 'drive' ? 'Name, e.g. Snake Pass (A57)' : 'Name, e.g. Ladybower viaduct'}
          placeholderTextColor={C.fog}
          style={ui.input}
          maxLength={40}
        />
        {autoName.current && name === autoName.current ? (
          <Txt v="muted" style={{ fontSize: 12 }}>Named from the map. Edit it to the name people know it by.</Txt>
        ) : null}
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder={kind === 'drive' ? 'What makes it good? Where to start?' : 'Best time of day, where to park'}
          placeholderTextColor={C.fog}
          style={[ui.input, { minHeight: 80, textAlignVertical: 'top' }]}
          multiline
          maxLength={240}
        />
      </Section>

      {error ? (
        <Card accent={C.alert}>
          <Txt>{error}</Txt>
        </Card>
      ) : null}

      <Card>
        <Txt v="muted">
          Suggestions are checked before they go on the map. You get +50 rep once it's approved, then more each time someone else{' '}
          {kind === 'drive' ? 'drives it' : 'visits'}, scaled by their ratings. You can't rate your own.
        </Txt>
      </Card>

      <Button label={kind === 'drive' ? 'Suggest this drive' : 'Suggest this spot'} onPress={submit} />
    </ScrollView>
  );
}

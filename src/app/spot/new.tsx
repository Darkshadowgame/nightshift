import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { MapPicker } from '../../components/MapPicker';
import { usePhotoFlow } from '../../components/PhotoFlow';
import { photoUri } from '../../lib/photos';
import { NightMap } from '../../components/NightMap';
import type { MapPin } from '../../components/mapTypes';
import { Button, Card, Chip, Row, Section, Txt, s as ui } from '../../components/ui';
import { BAN_ZONES } from '../../data/seed';
import { zoneShapes } from '../../lib/zones';
import { banZoneWarning } from '../../lib/events';
import { draftBanZone, draftProblem, longGap, MAX_POINT_GAP_MILES, pathMiles, type SpotDraft } from '../../lib/spots';
import { fitRegion } from '../../lib/geo';
import { nameForPlace } from '../../lib/location';
import { shouldAutoName } from '../../lib/placeNames';
import { useStore } from '../../lib/store';
import type { LatLng } from '../../lib/types';
import { C, SPOT_COLOURS } from '../../theme';

/** Ban zones drawn on the map: circles, and council outlines for borough-wide orders. */
const BAN_SHAPES = zoneShapes(BAN_ZONES, C.alert);

/** Suggest a drive (checkpoints along the road) or a photo spot (one point), chosen on the full-screen map picker. */
export default function SuggestPlace() {
  const params = useLocalSearchParams<{ kind?: string }>();
  const { users, me, spots, suggestSpot } = useStore();
  const meUser = users.find((u) => u.id === me);
  const [kind, setKind] = useState<SpotDraft['kind']>(params.kind === 'photo' ? 'photo' : 'drive');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [points, setPoints] = useState<LatLng[]>([]);
  const [error, setError] = useState<string | null>(null);
  /** Photo spots: a photo of the place with a car or bike in it (cropped, plates checked). */
  const [photo, setPhoto] = useState<string | undefined>(undefined);
  const flow = usePhotoFlow({ onPhoto: (ref) => setPhoto(ref), onError: setError, cameraDenied: 'Allow camera access to photograph the spot.' });

  const draft: SpotDraft = { kind, name, description, points, ...(kind === 'photo' && photo ? { photo } : {}) };
  const zone = draftBanZone(points, BAN_ZONES);
  const colour = SPOT_COLOURS[kind];
  const miles = pathMiles(points);
  const gap = kind === 'drive' ? longGap(points) : null;

  function pick(k: SpotDraft['kind']) {
    setKind(k);
    setPoints((p) => (k === 'photo' ? p.slice(-1) : p));
    setError(null);
  }

  const [picking, setPicking] = useState(false);
  /** The geocoder's last name, so a name you typed is never replaced. */
  const autoName = useRef<string | undefined>(undefined);

  /** Back from the picker with the place, or the whole drive so far. */
  function placed(next: LatLng[]) {
    setPicking(false);
    setError(null);
    const startMoved = next[0] && (next[0].lat !== points[0]?.lat || next[0].lng !== points[0]?.lng);
    setPoints(kind === 'photo' ? next.slice(-1) : next);
    // Name a photo spot after where it is, and a drive after where it starts. You can edit it.
    const at = kind === 'photo' ? next[next.length - 1] : next[0];
    if (at && startMoved) {
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

  const home = meUser?.home ?? { lat: 52.7, lng: -1.7 };
  // The preview frames what's placed (or opens on home); tapping it opens the picker.
  const view = fitRegion(points, kind === 'drive' ? 0.08 : 0.03) ?? { centre: home, span: 0.6 };

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
          ? 'A great road to drive within the speed limits. Drives are never timed or ranked. Draw it on the map from start to finish: each point becomes a checkpoint.'
          : 'Somewhere that looks good in photos, with space to pull fully off the road.'}
      </Txt>

      <Button
        label={
          kind === 'drive'
            ? points.length ? 'Carry on drawing on the map' : 'Draw the drive on the map'
            : points.length ? 'Move it on the map' : 'Choose on the map'
        }
        onPress={() => setPicking(true)}
        accessibilityHint="Opens a full-screen map with a crosshair"
      />

      <Pressable
        onPress={() => setPicking(true)}
        accessibilityRole="button"
        accessibilityLabel={points.length ? 'Preview of the place. Open the map to change it' : 'Open the map to choose the place'}
        style={{ height: 200, borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: points.length ? colour : C.kerb }}
      >
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <NightMap
            pins={pins}
            paths={
              kind === 'drive' && points.length > 1
                ? [
                    { id: 'draft', coords: points, colour },
                    ...(gap ? [{ id: 'gap', coords: [points[gap.index], points[gap.index + 1]], colour: C.alert, dashed: true }] : []),
                  ]
                : []
            }
            circles={BAN_SHAPES.circles}
            polygons={BAN_SHAPES.polygons}
            centre={view.centre}
            span={view.span}
            follow
          />
        </View>
        {points.length === 0 ? (
          <View pointerEvents="none" style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(11,15,23,0.55)' }]}>
            <Txt v="label" style={{ color: C.chalk }}>Tap to open the map</Txt>
          </View>
        ) : null}
      </Pressable>

      <Row style={{ justifyContent: 'space-between' }}>
        <Txt v="mono">
          {kind === 'drive'
            ? `${points.length} POINT${points.length === 1 ? '' : 'S'}${points.length > 1 ? ` · ${miles.toFixed(1)} MI` : ''}`
            : points.length
              ? 'PLACED'
              : 'NOT PLACED'}
        </Txt>
        <Row gap={6}>
          {kind === 'drive' && points.length ? <Chip label="Undo point" onPress={() => setPoints((p) => p.slice(0, -1))} /> : null}
          {points.length ? <Chip label="Clear" onPress={() => setPoints([])} /> : null}
        </Row>
      </Row>

      {kind === 'drive' ? (
        gap ? (
          <Card accent={C.alert}>
            <Txt>
              Points {gap.index + 1} and {gap.index + 2} are {gap.miles.toFixed(1)} mi apart (red line). Add points along the road in
              between, at least every {MAX_POINT_GAP_MILES} mi, so the drive follows the road and the pace check is fair.
            </Txt>
            <Txt v="muted">New points go on the end, so Undo back to point {gap.index + 1} and add the missing ones in order.</Txt>
          </Card>
        ) : (
          <Txt v="muted">Add a checkpoint at least every {MAX_POINT_GAP_MILES} mi along the road.</Txt>
        )
      ) : null}

      {zone ? (
        <Card accent={C.alert}>
          <Txt>{banZoneWarning(name.trim() || 'This place', zone)}</Txt>
          <Txt v="muted">You can still suggest it, but think twice about sending people here at night.</Txt>
        </Card>
      ) : null}

      {kind === 'photo' ? (
        <Section title="Photo with a car or bike">
          {flow.view ?? (
            <Card>
              <Txt v="muted">
                Photo spots are for car and bike photos, so add one taken here with a car or bike in it. You can crop it, and number
                plates are blurred before it's saved. It shows on the spot while it waits for approval.
              </Txt>
              {photo ? (
                <Image source={{ uri: photoUri(photo) }} style={{ width: '100%', aspectRatio: 4 / 3, borderRadius: 6, borderWidth: 1, borderColor: C.kerb }} />
              ) : null}
              <Row style={{ flexWrap: 'nowrap' }}>
                <Button label={photo ? 'Retake' : 'Camera'} kind="ghost" style={{ flex: 1 }} onPress={() => flow.pick(true)} disabled={flow.busy} />
                <Button label="Library" kind="ghost" style={{ flex: 1 }} onPress={() => flow.pick(false)} disabled={flow.busy} />
              </Row>
            </Card>
          )}
        </Section>
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

      <MapPicker
        visible={picking}
        mode={kind === 'drive' ? 'path' : 'point'}
        title={kind === 'drive' ? 'DRAW THE DRIVE' : 'PLACE THE PHOTO SPOT'}
        hint={
          kind === 'drive'
            ? 'Move the map so the crosshair is on the road, then add checkpoints from start to finish.'
            : 'Move the map so the crosshair is on the spot, or tap the map.'
        }
        confirmLabel="Set spot here"
        colour={colour}
        start={home}
        span={kind === 'drive' ? 0.12 : 0.04}
        initial={points}
        showKinds={kind === 'drive' ? ['drive'] : ['photo']}
        onDone={(stops) => placed(stops.map((x) => x.at))}
        onCancel={() => setPicking(false)}
      />
    </ScrollView>
  );
}

import type { ReactNode } from 'react';
import { View } from 'react-native';
import { LAYER_INFO, type Layer } from '../lib/mapLayers';
import { PLACE_NAMES } from '../lib/glossary';
import { VEHICLE_CHIPS } from '../lib/photoVehicles';
import type { MapFocus } from '../lib/mapFocus';
import type { VehicleKind } from '../lib/types';
import { SPACING } from '../theme';
import { MAP_STYLE_LABELS, type MapStyleChoice } from '../lib/sun';
import { ChipGroup, DsText, RowDivider, Section, SegmentedControl, Sheet, SwitchRow } from './ds';

/**
 * What Things to do can add to the map (Redesign 2, 2 "Map layers"; owner decision 7 keeps Posts;
 * owner decision 18 Nov 2026 brings back Shops and Speed cameras; owner decision 21 Nov 2026 splits
 * Meets from Things to do). All off by default in the old layout; the first time Things to do opens
 * with none on, Tonight turns Drives, Photo spots and Tracks on (mapFocus.ts).
 */
const ROWS: { key: Layer; label: string; hint: string }[] = [
  { key: 'drive', label: PLACE_NAMES.drive.many, hint: 'Great roads to drive' },
  { key: 'photo', label: PLACE_NAMES.photo.many, hint: 'Places for car and bike photos' },
  { key: 'track', label: PLACE_NAMES.track.many, hint: 'Circuits and track-day venues' },
  { key: 'posts', label: LAYER_INFO.posts.label, hint: 'Community posts with a place' },
  { key: 'shops', label: LAYER_INFO.shops.label, hint: 'Tuning, parts and detailing, from OpenStreetMap' },
  { key: 'cameras', label: LAYER_INFO.cameras.label, hint: 'Fixed and average speed cameras. Show when zoomed in' },
];

export interface LayersPanelProps {
  visible: boolean;
  onClose: () => void;
  on: Partial<Record<Layer, boolean>>;
  onToggle: (key: Layer) => void;
  /** The map's look: Auto (by sunrise and sunset), Day or Night. */
  mapStyle?: MapStyleChoice;
  onMapStyle?: (v: MapStyleChoice) => void;
  /** The Meets group's options (EventFilters.tsx: When, Type, Only ones I can go to). */
  events?: ReactNode;
  /** Which group the map is showing: it opens first, and the other follows. */
  focus?: MapFocus;
  /** Photo spots' Cars / Bikes filter (nothing selected = all), shown under Photo spots while it's on. */
  photoVehicles?: VehicleKind[];
  onPhotoVehicles?: (next: VehicleKind[]) => void;
}

const STYLES: MapStyleChoice[] = ['auto', 'day', 'night'];

/**
 * The map's Layers sheet, in two headed groups that match the Meets / Things to do switch on the map:
 * Meets (When, Type, Only ones I can go to) and Things to do (Drives, Photo spots, Tracks, Posts,
 * Shops, Speed cameras and the Cars / Bikes filter). The group the map is showing comes first; Map
 * style is shared and sits last. The only place layers are set (saved in Settings through mapLayers.ts).
 */
export function LayersPanel({ visible, onClose, on, onToggle, mapStyle, onMapStyle, events, focus = 'meets', photoVehicles, onPhotoVehicles }: LayersPanelProps) {
  const meets = events ? (
    <View key="meets" testID="layers-meets">
      <Section title="Meets">{events}</Section>
    </View>
  ) : null;
  const things = (
    <View key="places" testID="layers-places">
      <Section title="Things to do">
      <View>
        {ROWS.map((r, i) => (
          <View key={r.key}>
            {i > 0 ? <RowDivider /> : null}
            <SwitchRow label={r.label} hint={r.hint} value={!!on[r.key]} onValueChange={() => onToggle(r.key)} />
            {r.key === 'photo' && on.photo && onPhotoVehicles ? (
              <View style={{ paddingBottom: SPACING.sm }}>
                <ChipGroup<VehicleKind> label="For" allLabel="Cars and bikes" options={VEHICLE_CHIPS} selected={photoVehicles ?? []} onChange={onPhotoVehicles} />
              </View>
            ) : null}
          </View>
        ))}
      </View>
      </Section>
    </View>
  );
  return (
    <Sheet visible={visible} title="Map layers" onClose={onClose}>
      <View style={{ gap: SPACING.xl }}>
        {focus === 'places' ? [things, meets] : [meets, things]}
        {onMapStyle ? (
          <Section title="Map style" gap="sm">
            <SegmentedControl
              accessibilityLabel="Map style"
              value={mapStyle ?? 'auto'}
              onChange={onMapStyle}
              options={STYLES.map((k) => ({ key: k, label: MAP_STYLE_LABELS[k] }))}
            />
            <DsText v="caption">Auto follows the app: light or dark with Settings › Appearance.</DsText>
          </Section>
        ) : null}
      </View>
    </Sheet>
  );
}

import type { ReactNode } from 'react';
import { View } from 'react-native';
import { LAYER_INFO, type Layer } from '../lib/mapLayers';
import { PLACE_NAMES } from '../lib/glossary';
import { VEHICLE_CHIPS } from '../lib/photoVehicles';
import type { VehicleKind } from '../lib/types';
import { SPACING } from '../theme';
import { MAP_STYLE_LABELS, type MapStyleChoice } from '../lib/sun';
import { ChipGroup, DsText, RowDivider, SegmentedControl, Sheet, SwitchRow } from './ds';

/**
 * What Tonight's map can add to the events (Redesign 2, 2 "Map layers"; owner decision 7 keeps Posts;
 * owner decision 18 Nov 2026 brings back Shops and Speed cameras). All off by default.
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
  /** The Events section at the top (EventFilters.tsx). */
  events?: ReactNode;
  /** Photo spots' Cars / Bikes filter (nothing selected = all), shown under Photo spots while it's on. */
  photoVehicles?: VehicleKind[];
  onPhotoVehicles?: (next: VehicleKind[]) => void;
}

const STYLES: MapStyleChoice[] = ['auto', 'day', 'night'];

/**
 * The map's Layers sheet: the map always shows events; these add Drives, Photo spots, Tracks, Posts,
 * Shops and Speed cameras (all off by default, saved in Settings through mapLayers.ts). The only place
 * layers are set.
 */
export function LayersPanel({ visible, onClose, on, onToggle, mapStyle, onMapStyle, events, photoVehicles, onPhotoVehicles }: LayersPanelProps) {
  return (
    <Sheet visible={visible} title="Map layers" onClose={onClose}>
      <View style={{ gap: SPACING.sm }}>
        {events}
        {onMapStyle ? (
          <View style={{ gap: SPACING.xs, marginBottom: SPACING.md }}>
            <DsText v="label">Map style</DsText>
            <SegmentedControl
              accessibilityLabel="Map style"
              value={mapStyle ?? 'auto'}
              onChange={onMapStyle}
              options={STYLES.map((k) => ({ key: k, label: MAP_STYLE_LABELS[k] }))}
            />
            <DsText v="caption">Auto follows the app: light or dark with Settings › Appearance.</DsText>
          </View>
        ) : null}
        <DsText v="secondary">{events ? 'Add more:' : 'The map always shows meets. Add more:'}</DsText>
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
      </View>
    </Sheet>
  );
}

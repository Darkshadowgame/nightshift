import { View } from 'react-native';
import { LAYER_INFO, type Layer } from '../lib/mapLayers';
import { PLACE_NAMES } from '../lib/glossary';
import { SPACING } from '../theme';
import { DsText, RowDivider, Sheet, SwitchRow } from './ds';

/** What Tonight's map can add to the events (Redesign 2, 2 "Map layers"; owner decision 7 keeps Posts). */
const ROWS: { key: Layer; label: string; hint: string }[] = [
  { key: 'drive', label: PLACE_NAMES.drive.many, hint: 'Great roads to drive' },
  { key: 'photo', label: PLACE_NAMES.photo.many, hint: 'Places for car and bike photos' },
  { key: 'track', label: PLACE_NAMES.track.many, hint: 'Circuits and track-day venues' },
  { key: 'posts', label: LAYER_INFO.posts.label, hint: 'Community posts with a place' },
];

export interface LayersPanelProps {
  visible: boolean;
  onClose: () => void;
  on: Partial<Record<Layer, boolean>>;
  onToggle: (key: Layer) => void;
}

/**
 * The map's Layers sheet: the map always shows events; these add Drives, Photo spots, Tracks and
 * Posts (all off by default, saved in Settings through mapLayers.ts). The only place layers are set.
 */
export function LayersPanel({ visible, onClose, on, onToggle }: LayersPanelProps) {
  return (
    <Sheet visible={visible} title="Map layers" onClose={onClose}>
      <View style={{ gap: SPACING.sm }}>
        <DsText v="secondary">The map always shows meets. Add more:</DsText>
        <View>
          {ROWS.map((r, i) => (
            <View key={r.key}>
              {i > 0 ? <RowDivider /> : null}
              <SwitchRow label={r.label} hint={r.hint} value={!!on[r.key]} onValueChange={() => onToggle(r.key)} />
            </View>
          ))}
        </View>
      </View>
    </Sheet>
  );
}

import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { LAYER_INFO, TONIGHT_LAYERS, type Layer } from '../lib/mapLayers';
import { ALL_CATEGORIES, CATEGORY_HINTS, CATEGORY_LABELS, MENU_ORDER, type ShopCategory } from '../lib/shopCategories';
import { VEHICLE_LABELS, type TrackVehicle } from '../lib/laptimes';
import { ALL_VEHICLES } from '../lib/tracks';
import { COLOR, RADII, SPACING, tint } from '../theme';
import { Button, Chip, DsText, Press, Sheet } from './ds';
import { Pin, type Glyph } from './Pin';

/**
 * The layers button's panel (MAP-REDESIGN.md): every map layer as a tile, the
 * Tracks and Shops options under them when those layers are on, and the map
 * key. Each tile turns its layer on or off; all choices are saved in Settings
 * (mapLayers.ts). A DS Sheet, so it opens from the bottom within thumb reach. Tiles carry their
 * layer colour (the layers panel is one of the places layer colours belong); the Tracks and
 * Shops filters are ordinary Chips.
 */
export interface LayersPanelProps {
  visible: boolean;
  onClose: () => void;
  on: Record<Layer, boolean>;
  onToggle: (key: Layer) => void;
  /** Hide the Meet spots tile when there are none. */
  hidden?: Layer[];
  trackKinds: TrackVehicle[];
  onTrackKind: (v: TrackVehicle) => void;
  watchRacing: boolean;
  onWatchRacing: () => void;
  shopCategories: ShopCategory[];
  onShopCategory: (c: ShopCategory) => void;
  onAllShops: () => void;
  partnersOnly: boolean;
  onPartnersOnly: () => void;
  keyRows: { glyph: Glyph; colour: string; label: string }[];
}

export function LayersPanel(p: LayersPanelProps) {
  const [showKey, setShowKey] = useState(false);
  const layers = TONIGHT_LAYERS.filter((k) => !p.hidden?.includes(k));
  return (
    <Sheet visible={p.visible} title="Map layers" onClose={p.onClose}>
      <View style={{ gap: SPACING.lg }}>
        <View style={st.grid}>
          {layers.map((key) => {
            const info = LAYER_INFO[key];
            const on = p.on[key];
            return (
              <Press
                key={key}
                onPress={() => p.onToggle(key)}
                haptic="select"
                role="switch"
                state={{ checked: on }}
                label={info.label}
                hint={info.hint}
                style={[st.tile, on && { borderColor: info.colour, backgroundColor: tint(info.colour) }]}
              >
                <Pin glyph={info.glyph} colour={on ? info.colour : COLOR.text.secondary} size={26} />
                <View style={{ flex: 1 }}>
                  <DsText v="label" numberOfLines={2} style={{ color: on ? COLOR.text.primary : COLOR.text.secondary }}>
                    {info.label}
                  </DsText>
                  <DsText v="tag" style={{ color: on ? info.colour : COLOR.text.secondary }}>
                    {on ? 'On' : 'Off'}
                  </DsText>
                </View>
              </Press>
            );
          })}
        </View>

        {p.on.track ? (
          <View style={st.group}>
            <DsText v="label">{LAYER_INFO.track.label}: show circuits for</DsText>
            <View style={st.chips}>
              {ALL_VEHICLES.map((v) => (
                <Chip key={v} label={VEHICLE_LABELS[v]} on={p.trackKinds.includes(v)} onPress={() => p.onTrackKind(v)} />
              ))}
              <Chip label="Racing to watch" on={p.watchRacing} onPress={p.onWatchRacing} accessibilityLabel="Racing to watch: speedway, ovals and road races" />
            </View>
          </View>
        ) : null}

        {p.on.shops ? (
          <View style={st.group}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <DsText v="label">Shops to show</DsText>
              {p.shopCategories.length < ALL_CATEGORIES.length ? <Button label="Show all" tier="tertiary" size="sm" onPress={p.onAllShops} accessibilityLabel="Show all kinds of shop" /> : null}
            </View>
            <View style={st.chips}>
              {MENU_ORDER.map((c) => (
                <Chip
                  key={c}
                  label={CATEGORY_LABELS[c]}
                  on={p.shopCategories.includes(c)}
                  onPress={() => p.onShopCategory(c)}
                  accessibilityLabel={`${CATEGORY_LABELS[c]}. ${CATEGORY_HINTS[c]}`}
                />
              ))}
            </View>
            <View style={st.chips}>
              <Chip label="Partners only" on={p.partnersOnly} onPress={p.onPartnersOnly} />
            </View>
            <DsText v="caption">Partners pay to be highlighted and are always marked Partner. Other listings come from OpenStreetMap.</DsText>
          </View>
        ) : null}

        <View style={st.group}>
          <Press onPress={() => setShowKey((x) => !x)} state={{ expanded: showKey }} label="Map key" style={st.keyHead}>
            <DsText v="eyebrow" tone="primary">
              Map key
            </DsText>
            <DsText v="buttonSm" tone="action">
              {showKey ? 'Hide' : 'Show'}
            </DsText>
          </Press>
          {showKey ? (
            <View style={{ gap: SPACING.xxs }}>
              <DsText v="caption">Filled pins are events. Outlined pins are places. A number on a pin is a group: tap it to zoom in.</DsText>
              {p.keyRows.map((r) => (
                <View key={r.label} style={st.keyRow}>
                  <Pin glyph={r.glyph} colour={r.colour} size={22} />
                  <DsText v="caption" tone="primary" style={{ flexShrink: 1 }}>
                    {r.label}
                  </DsText>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </View>
    </Sheet>
  );
}

const st = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  tile: {
    flexBasis: '48%',
    flexGrow: 1,
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADII.control,
    borderWidth: 1,
    borderColor: COLOR.surface.raisedHi,
    backgroundColor: COLOR.surface.bg,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  group: { gap: SPACING.sm, borderTopWidth: 1, borderTopColor: COLOR.surface.border, paddingTop: SPACING.md },
  keyHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 44 },
  keyRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, minHeight: 32 },
});

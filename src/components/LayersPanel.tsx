import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { feel } from '../lib/feel';
import { ALL_LAYERS, LAYER_INFO, type Layer } from '../lib/mapLayers';
import { ALL_CATEGORIES, CATEGORY_HINTS, CATEGORY_LABELS, MENU_ORDER, type ShopCategory } from '../lib/shopCategories';
import { VEHICLE_LABELS, type TrackVehicle } from '../lib/laptimes';
import { ALL_VEHICLES } from '../lib/tracks';
import { BRAND, C, LAYER, PARTNER_COLOUR, RADIUS, SHOP_COLOUR, SURFACE, TYPE } from '../theme';
import { Pin, type Glyph } from './Pin';
import { Chip, Row, Txt } from './ui';

/**
 * The layers button's panel (MAP-REDESIGN.md): every map layer as a tile, the
 * Tracks and Shops options under them when those layers are on, and the map
 * key. Each tile turns its layer on or off; all choices are saved in Settings
 * (mapLayers.ts). Opens from the bottom, within thumb reach.
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
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const screen = useWindowDimensions();
  const [showKey, setShowKey] = useState(false);
  const layers = ALL_LAYERS.filter((k) => !p.hidden?.includes(k));
  return (
    <Modal visible={p.visible} transparent animationType={reduced ? 'fade' : 'slide'} onRequestClose={p.onClose} statusBarTranslucent>
      <View style={st.wrap}>
        <Pressable style={StyleSheet.absoluteFill} onPress={p.onClose} accessibilityRole="button" accessibilityLabel="Close map layers" />
        <View style={[st.panel, { maxHeight: screen.height * 0.85, paddingBottom: insets.bottom + 12 }]} accessibilityViewIsModal>
          <Row style={st.head}>
            <Txt v="h3" scale="chrome" accessibilityRole="header">Map layers</Txt>
            <Pressable onPress={p.onClose} hitSlop={12} accessibilityRole="button" accessibilityLabel="Done" style={st.done}>
              <Txt v="label" scale="chrome" style={{ color: BRAND, fontSize: TYPE.muted }}>Done</Txt>
            </Pressable>
          </Row>
          <ScrollView contentContainerStyle={{ gap: 16, paddingBottom: 8 }}>
            <View style={st.grid}>
              {layers.map((key) => {
                const info = LAYER_INFO[key];
                const on = p.on[key];
                return (
                  <Pressable
                    key={key}
                    onPress={() => {
                      feel.select();
                      p.onToggle(key);
                    }}
                    accessibilityRole="switch"
                    accessibilityState={{ checked: on }}
                    accessibilityLabel={info.label}
                    accessibilityHint={info.hint}
                    style={({ pressed }) => [st.tile, on && { borderColor: info.colour, backgroundColor: `${info.colour}1c` }, pressed && { opacity: 0.85 }]}
                  >
                    <Pin glyph={info.glyph} colour={on ? info.colour : C.fog} size={26} />
                    <View style={{ flex: 1 }}>
                      <Txt v="label" scale="chrome" style={{ color: on ? C.chalk : C.fog, fontSize: TYPE.caption }} numberOfLines={2}>
                        {info.label}
                      </Txt>
                      <Txt v="micro" scale="chrome" style={{ color: on ? info.colour : C.fog }}>{on ? 'On' : 'Off'}</Txt>
                    </View>
                  </Pressable>
                );
              })}
            </View>

            {p.on.track ? (
              <View style={st.group}>
                <Txt v="micro">{LAYER_INFO.track.label}: show circuits for</Txt>
                <Row gap={6}>
                  {ALL_VEHICLES.map((v) => (
                    <Chip key={v} label={VEHICLE_LABELS[v]} on={p.trackKinds.includes(v)} colour={LAYER.track} onPress={() => p.onTrackKind(v)} />
                  ))}
                  <Chip label="Racing to watch" on={p.watchRacing} colour={LAYER.track} onPress={p.onWatchRacing} accessibilityLabel="Racing to watch: speedway, ovals and road races" />
                </Row>
              </View>
            ) : null}

            {p.on.shops ? (
              <View style={st.group}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <Txt v="micro">Shops to show</Txt>
                  {p.shopCategories.length < ALL_CATEGORIES.length ? (
                    <Pressable onPress={p.onAllShops} hitSlop={12} accessibilityRole="button" accessibilityLabel="Show all kinds of shop">
                      <Txt v="micro" style={{ color: BRAND }}>Show all</Txt>
                    </Pressable>
                  ) : null}
                </Row>
                <Row gap={6}>
                  {MENU_ORDER.map((c) => (
                    <Chip
                      key={c}
                      label={CATEGORY_LABELS[c]}
                      on={p.shopCategories.includes(c)}
                      colour={SHOP_COLOUR}
                      onPress={() => p.onShopCategory(c)}
                      accessibilityLabel={`${CATEGORY_LABELS[c]}. ${CATEGORY_HINTS[c]}`}
                    />
                  ))}
                </Row>
                <Row gap={6}>
                  <Chip label="Partners only" on={p.partnersOnly} colour={PARTNER_COLOUR} onPress={p.onPartnersOnly} />
                </Row>
                <Txt v="caption">Partners pay to be highlighted and are always marked Partner. Other listings come from OpenStreetMap.</Txt>
              </View>
            ) : null}

            <View style={st.group}>
              <Pressable
                onPress={() => setShowKey((x) => !x)}
                accessibilityRole="button"
                accessibilityState={{ expanded: showKey }}
                style={({ pressed }) => [st.keyHead, pressed && { opacity: 0.8 }]}
              >
                <Txt v="label" scale="chrome" style={{ color: C.chalk, fontSize: TYPE.muted }}>Map key</Txt>
                <Txt v="label" scale="chrome" style={{ color: BRAND, fontSize: TYPE.muted }}>{showKey ? 'Hide' : 'Show ›'}</Txt>
              </Pressable>
              {showKey ? (
                <View style={{ gap: 2 }}>
                  <Txt v="caption">Filled pins are events. Outlined pins are places. A number on a pin is a group: tap it to zoom in.</Txt>
                  {p.keyRows.map((r) => (
                    <View key={r.label} style={st.keyRow}>
                      <Pin glyph={r.glyph} colour={r.colour} size={22} />
                      <Txt v="caption" style={{ color: C.chalk, flexShrink: 1 }}>{r.label}</Txt>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const st = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'flex-end', backgroundColor: SURFACE.scrim },
  panel: {
    backgroundColor: SURFACE.surface,
    borderTopLeftRadius: RADIUS.sheet + 4,
    borderTopRightRadius: RADIUS.sheet + 4,
    borderColor: C.kerbHi,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  head: { justifyContent: 'space-between', flexWrap: 'nowrap', minHeight: 48 },
  done: { minHeight: 44, justifyContent: 'center', paddingLeft: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tile: {
    flexBasis: '48%',
    flexGrow: 1,
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.card,
    borderWidth: 1.5,
    borderColor: C.kerbHi,
    backgroundColor: C.asphalt,
  },
  group: { gap: 8, borderTopWidth: 1, borderTopColor: C.kerb, paddingTop: 12 },
  keyHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 44 },
  keyRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 32 },
});


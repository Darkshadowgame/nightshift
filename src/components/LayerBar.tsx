import { useRef, type ComponentRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { feel } from '../lib/feel';
import { C, F } from '../theme';
import { Pin, type Glyph } from './Pin';

/**
 * The map's layer bar: one row of evenly sized pill toggles (icon and a short
 * label), scrolling sideways. A tap only ever turns that layer on or off, with
 * a light haptic. A layer can have a small ▾ (also on long-press) that opens a
 * menu floating over the map; nothing ever opens under the bar, so the bar
 * never changes height or shifts.
 *
 * To add a layer, add an entry to the screen's layer list: { key, label,
 * glyph, colour }, and `menu` if it has options.
 */

export interface LayerPill {
  key: string;
  label: string;
  glyph: Glyph;
  colour: string;
  on: boolean;
  /** A second, smaller line, e.g. the current filter ("Karts"). */
  note?: string;
  /** Opens the layer's options, anchored under the pill (window coordinates). */
  menu?: (anchor: { x: number; y: number }) => void;
}

export interface ActionPill {
  key: string;
  label: string;
  colour: string;
  onPress: () => void;
}

export const PILL_WIDTH = 86;
const PILL_HEIGHT = 38;

export function LayerBar({ layers, actions, onToggle }: { layers: LayerPill[]; actions: ActionPill[]; onToggle: (key: string) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.row} keyboardShouldPersistTaps="handled">
      {layers.map((l) => (
        <LayerToggle key={l.key} layer={l} onToggle={onToggle} />
      ))}
      <View style={st.divider} />
      {actions.map((a) => (
        <Pressable
          key={a.key}
          onPress={() => {
            feel.tap();
            a.onPress();
          }}
          accessibilityRole="button"
          hitSlop={{ top: 4, bottom: 4 }}
          style={({ pressed }) => [st.action, { borderColor: `${a.colour}88` }, pressed && { opacity: 0.7 }]}
        >
          <Text style={[st.label, { color: a.colour }]} numberOfLines={1}>
            {a.label}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

function LayerToggle({ layer: l, onToggle }: { layer: LayerPill; onToggle: (key: string) => void }) {
  const box = useRef<ComponentRef<typeof View>>(null);
  const openMenu = () => {
    if (!l.menu) return;
    feel.select();
    box.current?.measureInWindow((x, y, _w, h) => l.menu?.({ x, y: y + h + 6 }));
  };
  return (
    <View
      ref={box}
      collapsable={false}
      style={[
        st.pill,
        l.on ? { borderColor: l.colour, backgroundColor: `${l.colour}24`, shadowColor: l.colour, shadowOpacity: 0.55 } : null,
      ]}
    >
      <Pressable
        onPress={() => {
          feel.select();
          onToggle(l.key);
        }}
        onLongPress={l.menu ? openMenu : undefined}
        delayLongPress={350}
        accessibilityRole="switch"
        accessibilityState={{ checked: l.on }}
        accessibilityLabel={`${l.label}${l.note ? `, ${l.note}` : ''}`}
        accessibilityHint={l.menu ? 'Long-press for options' : undefined}
        hitSlop={{ top: 4, bottom: 4 }}
        style={({ pressed }) => [st.main, pressed && { opacity: 0.7 }]}
      >
        <View style={{ opacity: l.on ? 1 : 0.55 }}>
          <Pin glyph={l.glyph} colour={l.on ? l.colour : C.fog} size={18} />
        </View>
        <View style={{ flexShrink: 1 }}>
          <Text style={[st.label, { color: l.on ? l.colour : C.fog }]} numberOfLines={1}>
            {l.label}
          </Text>
          {l.note ? (
            <Text style={[st.note, { color: l.on ? C.chalk : C.fog }]} numberOfLines={1}>
              {l.note}
            </Text>
          ) : null}
        </View>
      </Pressable>
      {l.menu ? (
        <Pressable
          onPress={openMenu}
          accessibilityRole="button"
          accessibilityLabel={`${l.label} options`}
          hitSlop={{ top: 4, bottom: 4, right: 4 }}
          style={({ pressed }) => [st.caret, pressed && { opacity: 0.6 }]}
        >
          <Text style={[st.label, { color: l.on ? l.colour : C.fog }]}>▾</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const st = StyleSheet.create({
  row: { gap: 6, paddingVertical: 8, alignItems: 'center' },
  pill: {
    width: PILL_WIDTH,
    height: PILL_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: PILL_HEIGHT / 2,
    borderWidth: 1,
    borderColor: C.kerb,
    backgroundColor: 'rgba(11,15,23,0.9)',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 6,
    shadowOpacity: 0,
  },
  main: { flex: 1, height: '100%', flexDirection: 'row', alignItems: 'center', gap: 5, paddingLeft: 8, paddingRight: 4 },
  caret: { height: '100%', justifyContent: 'center', paddingRight: 9, paddingLeft: 2 },
  label: { fontFamily: F.label, fontSize: 12, letterSpacing: 0.8, textTransform: 'uppercase' },
  note: { fontFamily: F.label, fontSize: 9, letterSpacing: 0.4, textTransform: 'uppercase', marginTop: -1 },
  divider: { width: 1, height: 22, backgroundColor: C.kerbHi, marginHorizontal: 2 },
  action: {
    height: PILL_HEIGHT,
    borderRadius: PILL_HEIGHT / 2,
    borderWidth: 1,
    paddingHorizontal: 12,
    justifyContent: 'center',
    backgroundColor: 'rgba(11,15,23,0.9)',
  },
});

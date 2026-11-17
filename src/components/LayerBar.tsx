import { useRef, type ComponentRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { feel } from '../lib/feel';
import { C, F, FONT_SCALE, RADIUS, SURFACE, TYPE } from '../theme';
import { Pin, type Glyph } from './Pin';

/**
 * The map's layer bar: one row of pill toggles (icon and a short label) that
 * share the screen's width. It never scrolls sideways (REVIEW-5 B3): on a
 * narrow screen or with larger text the pills go icon-only (`compact`), and
 * the labels stay in the accessibility label and the map key. Pills grow in
 * height rather than clip. A tap only ever turns that layer on or off, with a
 * light haptic. A layer can have a small ▾ (also on long-press) that opens a
 * menu floating over the map; nothing ever opens under the bar.
 *
 * Actions (Find, Near me, Suggest a place) are not on the bar: Find is in the
 * top row, Near me is a map button, Suggest a place is in the layers menu.
 */

export interface LayerPill {
  key: string;
  label: string;
  glyph: Glyph;
  colour: string;
  on: boolean;
  /** A second, smaller line, e.g. the current filter ("Cars"). */
  note?: string;
  /** Opens the layer's options, anchored under the pill (window coordinates). */
  menu?: (anchor: { x: number; y: number }) => void;
}

export function LayerBar({ layers, compact, onToggle }: { layers: LayerPill[]; compact: boolean; onToggle: (key: string) => void }) {
  return (
    <View style={st.row}>
      {layers.map((l) => (
        <LayerToggle key={l.key} layer={l} compact={compact} onToggle={onToggle} />
      ))}
    </View>
  );
}

function LayerToggle({ layer: l, compact, onToggle }: { layer: LayerPill; compact: boolean; onToggle: (key: string) => void }) {
  const box = useRef<ComponentRef<typeof View>>(null);
  const openMenu = () => {
    if (!l.menu) return;
    feel.select();
    box.current?.measureInWindow((x, y, _w, h) => l.menu?.({ x, y: y + h + 6 }));
  };
  const tint = l.on ? l.colour : C.fog;
  return (
    <View
      ref={box}
      collapsable={false}
      style={[st.pill, l.on ? { borderColor: l.colour, shadowColor: l.colour, shadowOpacity: 0.55 } : null]}
    >
      {/* The tint sits over the glass, so pins under the bar never show through an "on" pill. */}
      {l.on ? <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: `${l.colour}24`, borderRadius: RADIUS.pill }]} /> : null}
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
        style={({ pressed }) => [st.main, compact && { justifyContent: 'center', paddingLeft: l.menu ? 6 : 0, paddingRight: 0 }, pressed && { opacity: 0.8 }]}
      >
        {/* Off: fog at full strength (not faded), so the icon keeps 3:1 on the glass. */}
        <Pin glyph={l.glyph} colour={tint} size={18} />
        {compact ? null : (
          <View style={{ flexShrink: 1 }}>
            <Text style={[st.label, { color: tint }]} numberOfLines={1} maxFontSizeMultiplier={FONT_SCALE.chrome}>
              {l.label}
            </Text>
            {l.note ? (
              <Text style={[st.note, { color: l.on ? C.chalk : C.fog }]} numberOfLines={1} maxFontSizeMultiplier={FONT_SCALE.chrome}>
                {l.note}
              </Text>
            ) : null}
          </View>
        )}
      </Pressable>
      {l.menu ? (
        <Pressable
          onPress={openMenu}
          accessibilityRole="button"
          accessibilityLabel={`${l.label} options`}
          hitSlop={{ top: 4, bottom: 4, right: 4 }}
          style={({ pressed }) => [st.caret, pressed && { opacity: 0.7 }]}
        >
          <Text style={[st.label, { color: tint }]} maxFontSizeMultiplier={FONT_SCALE.chrome}>▾</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const st = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6, paddingVertical: 8, alignItems: 'stretch' },
  pill: {
    // Size to the label, then share what's left; shrink (ellipsis) rather than scroll.
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 'auto',
    minWidth: 0,
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: C.kerbHi,
    backgroundColor: SURFACE.glass,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 6,
    shadowOpacity: 0,
  },
  main: { flex: 1, alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', gap: 5, paddingLeft: 8, paddingRight: 4, paddingVertical: 6, minWidth: 0 },
  caret: { alignSelf: 'stretch', justifyContent: 'center', paddingRight: 9, paddingLeft: 1 },
  label: { fontFamily: F.label, fontSize: TYPE.label, letterSpacing: 0.5, textTransform: 'uppercase' },
  note: { fontFamily: F.label, fontSize: TYPE.micro, letterSpacing: 0.4, textTransform: 'uppercase', lineHeight: 12 },
});

import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import type { BannerInfo, MapOrientation, NavIcon as NavIconChoice, ShownLimit } from '../lib/driveView';
import { NAV_ICON_COLOURS, NAV_ICON_SHAPES, navIconOf } from '../lib/driveView';
import { ARROWS, formatDistance } from '../lib/nav';
import { BRAND, C, DRIVE_TYPE, F, FONT_SCALE, RADIUS, ROAD_COLOUR, STATE, SURFACE, TYPE } from '../theme';
import { NavIcon } from './NavIcon';

/**
 * The driving view's pieces (src/app/drive.tsx), Waze and Apple Maps style:
 * the next turn across the top, your road, speed, the limit and the trip along
 * the bottom, and a few big round buttons on the map. Dark, large, readable at
 * a glance; text scales with the iPhone's text size up to 1.2x.
 */

const S = FONT_SCALE.drive;

// ---------------------------------------------------------------------------
// Top: the next manoeuvre
// ---------------------------------------------------------------------------

export function DriveBanner({
  top,
  banner,
  status,
  danger,
}: {
  top: number;
  /** The next turn, or null while planning, arrived or without a route. */
  banner: BannerInfo | null;
  /** Shown instead of a turn: "Planning the route…", "You've arrived at…". */
  status: { arrow: string; title: string; distance?: string } | null;
  danger?: boolean;
}) {
  const arrow = banner ? ARROWS[banner.kind] : status?.arrow ?? '…';
  const distance = banner ? formatDistance(banner.distance) : status?.distance;
  const title = banner ? banner.title : status?.title ?? '';
  const label = banner ? `${distance}. ${banner.text}` : title;
  return (
    <View accessibilityLiveRegion="polite" accessible accessibilityLabel={label}>
      <View style={[st.banner, { paddingTop: top + 8 }, danger && { borderBottomColor: STATE.danger }]}>
        <Text style={st.arrow} allowFontScaling={false}>{arrow}</Text>
        <View style={{ flex: 1 }}>
          {distance ? <Text style={st.bannerDistance} maxFontSizeMultiplier={S}>{distance}</Text> : null}
          <Text style={st.bannerTitle} numberOfLines={2} maxFontSizeMultiplier={S}>{title}</Text>
        </View>
      </View>
      {banner?.then ? (
        <View style={st.then}>
          <Text style={st.thenLabel} maxFontSizeMultiplier={S}>THEN</Text>
          <Text style={st.thenArrow} allowFontScaling={false}>{ARROWS[banner.then.kind]}</Text>
          <Text style={st.thenText} numberOfLines={1} maxFontSizeMultiplier={S}>{banner.then.title}</Text>
        </View>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Bottom: road, speed, limit, trip, End
// ---------------------------------------------------------------------------

/** A UK speed-limit sign: red ring, black number. Hidden when the limit is unknown. */
export function LimitRoundel({ limit, size = 60 }: { limit: ShownLimit; size?: number }) {
  const what = limit.source === 'zone' ? 'Average speed zone' : limit.source === 'camera' ? 'Speed camera' : 'Speed';
  return (
    <View
      style={[st.roundel, { width: size, height: size, borderRadius: size / 2, borderWidth: Math.round(size * 0.11) }]}
      accessible
      accessibilityLabel={`${what} limit ${limit.value} ${limit.unit === 'mph' ? 'miles' : 'kilometres'} per hour`}
    >
      <Text style={[st.roundelText, { fontSize: size * (limit.value >= 100 ? 0.32 : 0.4) }]} allowFontScaling={false}>{limit.value}</Text>
    </View>
  );
}

export function DriveBar({
  bottom,
  road,
  speedMph,
  over,
  limit,
  trip,
  sub,
  onEnd,
  children,
}: {
  bottom: number;
  road: string | null;
  speedMph: number | null;
  over: boolean;
  limit: ShownLimit | null;
  /** Arrival time, distance and time left; null before there's a route. */
  trip: { eta: string; distance: string; time: string } | null;
  /** Small lines under the trip (next stop, the drive's checkpoints). */
  sub?: ReactNode;
  onEnd: () => void;
  children?: ReactNode;
}) {
  return (
    <View style={[st.bar, { paddingBottom: bottom + 10 }]}>
      <View style={st.row}>
        <View
          style={[st.speedBox, over && st.speedOver]}
          accessible
          accessibilityLabel={speedMph != null ? `Your speed ${speedMph} miles per hour${over ? ', over the limit' : ''}` : 'Speed unknown'}
        >
          <Text style={[st.speed, over && { color: STATE.danger }]} maxFontSizeMultiplier={S}>{speedMph ?? '–'}</Text>
          <Text style={st.unit} maxFontSizeMultiplier={S}>MPH</Text>
        </View>
        {limit ? <LimitRoundel limit={limit} /> : null}
        <Text style={st.road} numberOfLines={2} maxFontSizeMultiplier={S} accessibilityLabel={road ? `On ${road}` : undefined}>
          {road ?? ' '}
        </Text>
      </View>
      {children}
      <View style={st.row}>
        <View style={st.trip} accessible accessibilityLabel={trip ? `Arrive at ${trip.eta}. ${trip.distance}, ${trip.time} to go` : 'Planning the route'}>
          {trip ? (
            <>
              <Readout value={trip.eta} label="ARRIVE" />
              <Readout value={trip.distance} label="TO GO" />
              <Readout value={trip.time} label="TIME" />
            </>
          ) : (
            <Text style={st.sub} maxFontSizeMultiplier={S}>Planning the route…</Text>
          )}
        </View>
        <Pressable onPress={onEnd} accessibilityRole="button" accessibilityLabel="End navigation" style={({ pressed }) => [st.end, pressed && { opacity: 0.8 }]}>
          <Text style={st.endText} maxFontSizeMultiplier={S}>END</Text>
        </Pressable>
      </View>
      {sub}
    </View>
  );
}

function Readout({ value, label }: { value: string; label: string }) {
  return (
    <View style={{ flexShrink: 1 }}>
      <Text style={st.readout} numberOfLines={1} adjustsFontSizeToFit maxFontSizeMultiplier={S}>{value}</Text>
      <Text style={st.readoutLabel} maxFontSizeMultiplier={S}>{label}</Text>
    </View>
  );
}

export function SubLine({ children, colour }: { children: ReactNode; colour?: string }) {
  return (
    <Text style={[st.sub, colour ? { color: colour } : null]} numberOfLines={2} maxFontSizeMultiplier={S}>
      {children}
    </Text>
  );
}

// ---------------------------------------------------------------------------
// On the map
// ---------------------------------------------------------------------------

/** A big round button over the map (56 pt). */
export function MapButton({ onPress, label, children, active }: { onPress: () => void; label: string; children: ReactNode; active?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      style={({ pressed }) => [st.mapButton, active && { borderColor: BRAND }, pressed && { opacity: 0.8 }]}
    >
      {children}
    </Pressable>
  );
}

/** The compass: a needle pointing at north, with "N" when the map is north-up. */
export function CompassGlyph({ mapHeading, mode }: { mapHeading: number; mode: MapOrientation }) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ transform: [{ rotate: `${Math.round(-mapHeading)}deg` }] }}>
        <Svg width={30} height={30} viewBox="0 0 30 30">
          <Path d="M15 3 19.5 15H10.5Z" fill={STATE.danger} />
          <Path d="M15 27 10.5 15H19.5Z" fill={C.chalk} />
        </Svg>
      </View>
      <Text style={st.compassMode} maxFontSizeMultiplier={S}>{mode === 'north' ? 'N UP' : 'HEAD'}</Text>
    </View>
  );
}

export function SpeakerGlyph({ muted }: { muted: boolean }) {
  return (
    <Svg width={28} height={28} viewBox="0 0 24 24">
      <Path d="M4 9.5h3.5L12 5.5v13L7.5 14.5H4z" fill={muted ? C.fog : C.chalk} />
      {muted ? (
        <Path d="M16 9.5l5 5M21 9.5l-5 5" stroke={STATE.danger} strokeWidth={2.2} strokeLinecap="round" />
      ) : (
        <Path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" fill="none" stroke={C.chalk} strokeWidth={2} strokeLinecap="round" />
      )}
    </Svg>
  );
}

export function RecentreGlyph() {
  return (
    <Svg width={26} height={26} viewBox="0 0 24 24">
      <Path d="M12 2 19 21 12 17 5 21Z" fill={BRAND} />
    </Svg>
  );
}

/** One alert that matters now, small, over the top of the map: a camera, a zone. */
export function AlertPill({ text, tone = 'warning' }: { text: string; tone?: 'warning' | 'road' }) {
  return (
    <View style={[st.pill, tone === 'road' && { borderColor: ROAD_COLOUR }]} accessibilityLiveRegion="polite">
      <Text style={[st.pillText, tone === 'road' && { color: ROAD_COLOUR }]} numberOfLines={2} maxFontSizeMultiplier={S}>{text}</Text>
    </View>
  );
}

/** REPORT: one tap opens the report grid (RoadReportControls). */
export function ReportButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel="Report something on the road" hitSlop={6} style={({ pressed }) => [st.report, pressed && { opacity: 0.85 }]}>
      <Text style={st.reportText} maxFontSizeMultiplier={S}>REPORT</Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Your icon: the picker (Settings › Navigation, and tapping yourself on the map while stopped)
// ---------------------------------------------------------------------------

export function NavIconChoices({ value, onChange }: { value: Partial<NavIconChoice> | null | undefined; onChange: (v: NavIconChoice) => void }) {
  const icon = navIconOf(value);
  return (
    <View style={{ gap: 12 }}>
      <View style={st.choiceRow}>
        {NAV_ICON_SHAPES.map((s) => (
          <Pressable
            key={s.id}
            onPress={() => onChange({ shape: s.id, colour: icon.colour })}
            accessibilityRole="radio"
            accessibilityState={{ checked: icon.shape === s.id }}
            accessibilityLabel={s.label}
            style={({ pressed }) => [st.choice, icon.shape === s.id && { borderColor: BRAND }, pressed && { opacity: 0.8 }]}
          >
            <NavIcon shape={s.id} colour={icon.hex} size={48} />
            <Text style={st.choiceLabel} numberOfLines={1} maxFontSizeMultiplier={FONT_SCALE.chrome}>{s.label}</Text>
          </Pressable>
        ))}
      </View>
      <View style={st.choiceRow}>
        {NAV_ICON_COLOURS.map((c) => (
          <Pressable
            key={c.id}
            onPress={() => onChange({ shape: icon.shape, colour: c.id })}
            accessibilityRole="radio"
            accessibilityState={{ checked: icon.colour === c.id }}
            accessibilityLabel={c.label}
            hitSlop={4}
            style={({ pressed }) => [st.swatchRing, icon.colour === c.id && { borderColor: BRAND }, pressed && { opacity: 0.8 }]}
          >
            <View style={[st.swatch, { backgroundColor: c.hex }]} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export function IconPickerSheet({ visible, value, onChange, onClose, bottom }: { visible: boolean; value: Partial<NavIconChoice> | null | undefined; onChange: (v: NavIconChoice) => void; onClose: () => void; bottom: number }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: SURFACE.scrim }} onPress={onClose} accessibilityLabel="Close" />
      <View style={[st.sheet, { paddingBottom: bottom + 16 }]}>
        <Text style={st.sheetTitle} maxFontSizeMultiplier={S}>YOUR ICON ON THE MAP</Text>
        <NavIconChoices value={value} onChange={onChange} />
        <Pressable onPress={onClose} accessibilityRole="button" style={({ pressed }) => [st.done, pressed && { opacity: 0.8 }]}>
          <Text style={st.doneText} maxFontSizeMultiplier={S}>DONE</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const st = StyleSheet.create({
  banner: {
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingBottom: 12,
    backgroundColor: C.tarmac, borderBottomWidth: 3, borderBottomColor: BRAND,
  },
  /** The turn arrow: brand, never the Drives layer's blue. */
  arrow: { fontSize: 66, lineHeight: 72, color: BRAND, width: 72, textAlign: 'center' },
  bannerDistance: { fontFamily: F.display, fontSize: DRIVE_TYPE.banner, lineHeight: DRIVE_TYPE.banner + 4, color: C.chalk, fontVariant: ['tabular-nums'] },
  bannerTitle: { fontFamily: F.bodyBold, fontSize: 24, lineHeight: 29, color: C.chalk },
  then: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 6, backgroundColor: C.asphalt, borderBottomWidth: 1, borderBottomColor: C.kerb },
  thenLabel: { fontFamily: F.labelBold, fontSize: TYPE.muted, color: C.fog, letterSpacing: 1.2 },
  thenArrow: { fontSize: 24, lineHeight: 28, color: BRAND },
  thenText: { flex: 1, fontFamily: F.bodyBold, fontSize: DRIVE_TYPE.body, color: C.chalk },

  bar: { backgroundColor: C.tarmac, paddingHorizontal: 14, paddingTop: 12, gap: 10, borderTopWidth: 1, borderTopColor: C.kerb },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  speedBox: { minWidth: 86, alignItems: 'center', borderWidth: 2, borderColor: C.kerbHi, borderRadius: 12, paddingVertical: 2, paddingHorizontal: 8 },
  speedOver: { borderColor: STATE.danger, backgroundColor: '#3a0d0d' },
  speed: { fontFamily: F.display, fontSize: DRIVE_TYPE.speed, lineHeight: 48, color: C.chalk, fontVariant: ['tabular-nums'] },
  unit: { fontFamily: F.labelBold, fontSize: TYPE.caption, color: C.fog, letterSpacing: 1.5 },
  roundel: { backgroundColor: '#ffffff', borderColor: '#d61f1f', alignItems: 'center', justifyContent: 'center' },
  roundelText: { fontFamily: F.display, color: '#111111' },
  road: { flex: 1, fontFamily: F.bodyBold, fontSize: DRIVE_TYPE.readout, lineHeight: 27, color: C.chalk },
  trip: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, minHeight: 60 },
  readout: { fontFamily: F.display, fontSize: DRIVE_TYPE.readout, color: C.chalk, fontVariant: ['tabular-nums'] },
  readoutLabel: { fontFamily: F.labelBold, fontSize: TYPE.label, color: C.fog, letterSpacing: 1.2 },
  sub: { fontFamily: F.body, fontSize: TYPE.body, color: C.fog },
  end: { width: 100, height: 60, borderRadius: 12, backgroundColor: STATE.danger, alignItems: 'center', justifyContent: 'center' },
  /** Asphalt on red: 5.9:1, readable in sunlight. */
  endText: { fontFamily: F.display, fontSize: 24, color: C.asphalt, letterSpacing: 2 },

  mapButton: {
    width: 58, height: 58, borderRadius: 29, backgroundColor: SURFACE.glassRaised, borderWidth: 2, borderColor: C.kerbHi,
    alignItems: 'center', justifyContent: 'center',
  },
  compassMode: { fontFamily: F.labelBold, fontSize: 9, color: C.fog, letterSpacing: 0.5, marginTop: -2 },
  pill: { backgroundColor: SURFACE.glassRaised, borderRadius: RADIUS.card, borderWidth: 2, borderColor: STATE.warning, paddingHorizontal: 10, paddingVertical: 6 },
  pillText: { fontFamily: F.labelBold, fontSize: 17, color: STATE.warning, letterSpacing: 0.8 },
  report: { height: 58, minWidth: 120, paddingHorizontal: 18, borderRadius: 29, backgroundColor: ROAD_COLOUR, alignItems: 'center', justifyContent: 'center' },
  reportText: { fontFamily: F.display, fontSize: 20, color: C.asphalt, letterSpacing: 1.5 },

  sheet: { backgroundColor: C.tarmac, padding: 16, gap: 14, borderTopLeftRadius: RADIUS.sheet, borderTopRightRadius: RADIUS.sheet },
  sheetTitle: { fontFamily: F.display, fontSize: 18, color: C.chalk, letterSpacing: 1.5 },
  choiceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: { width: 92, minHeight: 76, alignItems: 'center', justifyContent: 'center', gap: 4, borderWidth: 2, borderColor: C.kerbHi, borderRadius: RADIUS.card, backgroundColor: C.asphalt },
  choiceLabel: { fontFamily: F.label, fontSize: TYPE.label, color: C.chalk },
  swatchRing: { width: 48, height: 48, borderRadius: 24, borderWidth: 3, borderColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  swatch: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: C.kerbHi },
  done: { height: 56, borderRadius: 12, backgroundColor: BRAND, alignItems: 'center', justifyContent: 'center' },
  doneText: { fontFamily: F.display, fontSize: 20, color: C.ink, letterSpacing: 1.5 },
});

import { useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import type { BannerInfo, MapOrientation, NavIcon as NavIconChoice, ShownLimit } from '../lib/driveView';
import { NAV_ICON_COLOURS, NAV_ICON_SHAPES, navIconOf } from '../lib/driveView';
import { ARROWS, formatDistance } from '../lib/nav';
import { ART, COLOR, RADII, ROAD_COLOUR, SPACING, tint } from '../theme';
import { photoUri } from '../lib/photos';
import { Button, ChoiceGroup, DsText, Icon, Press, Sheet } from './ds';
import { usePhotoFlow } from './PhotoFlow';
import { LaneStrip } from './LaneStrip';
import type { LaneStrip as LaneStripData } from '../lib/lanes';
import { NavIcon } from './NavIcon';

/**
 * The driving view's pieces (src/app/drive.tsx), Waze and Apple Maps style:
 * the next turn across the top, your road, speed, the limit and the trip along
 * the bottom, and a few big round buttons on the map. Dark, large, readable at
 * a glance; text scales with the iPhone's text size up to 1.2x.
 */

// ---------------------------------------------------------------------------
// Top: the next manoeuvre
// ---------------------------------------------------------------------------

export function DriveBanner({
  top,
  banner,
  status,
  danger,
  lanes,
}: {
  top: number;
  /** Lane guidance for the next manoeuvre (OpenStreetMap), when it's close and known. */
  lanes?: LaneStripData | null;
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
      <View style={[st.banner, { paddingTop: top + SPACING.sm }, danger && { borderBottomColor: COLOR.state.danger }]}>
        <DsText v="driveArrow" style={st.arrow} allowFontScaling={false}>
          {arrow}
        </DsText>
        <View style={{ flex: 1 }}>
          {distance ? <DsText v="driveDistance">{distance}</DsText> : null}
          <DsText v="driveTitle" numberOfLines={2}>
            {title}
          </DsText>
        </View>
      </View>
      {banner && lanes ? <LaneStrip strip={lanes} /> : null}
      {banner?.then ? (
        <View style={st.then}>
          <DsText v="driveLabel">Then</DsText>
          <DsText v="driveTitle" tone="action" allowFontScaling={false}>
            {ARROWS[banner.then.kind]}
          </DsText>
          <DsText v="driveBody" numberOfLines={1} style={{ flex: 1 }}>
            {banner.then.title}
          </DsText>
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
      <DsText v="driveSpeed" allowFontScaling={false} style={[st.roundelText, { fontSize: size * (limit.value >= 100 ? 0.32 : 0.4), lineHeight: size * 0.5 }]}>
        {limit.value}
      </DsText>
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
    <View style={[st.bar, { paddingBottom: bottom + SPACING.sm }]}>
      <View style={st.row}>
        <View
          style={[st.speedBox, over && st.speedOver]}
          accessible
          accessibilityLabel={speedMph != null ? `Your speed ${speedMph} miles per hour${over ? ', over the limit' : ''}` : 'Speed unknown'}
        >
          <DsText v="driveSpeed" tone={over ? 'danger' : 'primary'}>
            {speedMph ?? '–'}
          </DsText>
          <DsText v="driveLabel" tone="secondary">
            mph
          </DsText>
        </View>
        {limit ? <LimitRoundel limit={limit} /> : null}
        <DsText v="driveRoad" numberOfLines={2} style={{ flex: 1 }} accessibilityLabel={road ? `On ${road}` : undefined}>
          {road ?? ' '}
        </DsText>
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
            <SubLine>Planning the route…</SubLine>
          )}
        </View>
        <Press onPress={onEnd} haptic="warning" label="End navigation" style={st.end}>
          {/* Asphalt on red: 5.9:1, readable in sunlight. */}
          <DsText v="driveButton" tone="onAction">
            End
          </DsText>
        </Press>
      </View>
      {sub}
    </View>
  );
}

function Readout({ value, label }: { value: string; label: string }) {
  return (
    <View style={{ flexShrink: 1 }}>
      <DsText v="driveReadout" numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </DsText>
      <DsText v="driveLabel" tone="secondary">
        {label}
      </DsText>
    </View>
  );
}

export function SubLine({ children, colour }: { children: ReactNode; colour?: string }) {
  return (
    <DsText v="driveBody" tone="secondary" numberOfLines={2} style={colour ? { color: colour } : undefined}>
      {children}
    </DsText>
  );
}

// ---------------------------------------------------------------------------
// On the map
// ---------------------------------------------------------------------------

/** A big round button over the map (56 pt). */
export function MapButton({ onPress, label, children, active }: { onPress: () => void; label: string; children: ReactNode; active?: boolean }) {
  return (
    <Press onPress={onPress} haptic="tap" label={label} hitSlop={6} style={[st.mapButton, active && { borderColor: COLOR.text.primary }]}>
      {children}
    </Press>
  );
}

/** The compass: a needle pointing at north, with "N" when the map is north-up. */
export function CompassGlyph({ mapHeading, mode }: { mapHeading: number; mode: MapOrientation }) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ transform: [{ rotate: `${Math.round(-mapHeading)}deg` }] }}>
        <Svg width={30} height={30} viewBox="0 0 30 30">
          <Path d="M15 3 19.5 15H10.5Z" fill={COLOR.state.danger} />
          <Path d="M15 27 10.5 15H19.5Z" fill={COLOR.text.primary} />
        </Svg>
      </View>
      <DsText v="tag" tone="secondary" style={{ marginTop: -SPACING.xxs }}>
        {mode === 'north' ? 'N up' : 'Head'}
      </DsText>
    </View>
  );
}

export function SpeakerGlyph({ muted }: { muted: boolean }) {
  return (
    <Svg width={28} height={28} viewBox="0 0 24 24">
      <Path d="M4 9.5h3.5L12 5.5v13L7.5 14.5H4z" fill={muted ? COLOR.text.secondary : COLOR.text.primary} />
      {muted ? (
        <Path d="M16 9.5l5 5M21 9.5l-5 5" stroke={COLOR.state.danger} strokeWidth={2.2} strokeLinecap="round" />
      ) : (
        <Path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" fill="none" stroke={COLOR.text.primary} strokeWidth={2} strokeLinecap="round" />
      )}
    </Svg>
  );
}

export function RecentreGlyph() {
  return (
    <Svg width={26} height={26} viewBox="0 0 24 24">
      <Path d="M12 2 19 21 12 17 5 21Z" fill={COLOR.text.primary} />
    </Svg>
  );
}

/** One alert that matters now, small, over the top of the map: a camera, a zone. */
export function AlertPill({ text, tone = 'warning' }: { text: string; tone?: 'warning' | 'road' }) {
  return (
    <View style={[st.pill, tone === 'road' && { borderColor: ROAD_COLOUR }]} accessibilityLiveRegion="polite">
      <DsText v="driveBody" tone="warning" numberOfLines={2} style={tone === 'road' ? { color: ROAD_COLOUR } : undefined}>
        {text}
      </DsText>
    </View>
  );
}

/** REPORT: one tap opens the report grid (RoadReportControls). */
/**
 * Report: a secondary round button like the map's others (Review 19), so End is the only coloured
 * button on the driving view. The warning mark says what it's for; the label says it in words.
 */
export function ReportButton({ onPress }: { onPress: () => void }) {
  return (
    <Press onPress={onPress} label="Report something on the road" haptic="tap" hitSlop={6} style={st.mapButton}>
      <View aria-hidden>
        <Icon name="alert" size={28} />
      </View>
    </Press>
  );
}

// ---------------------------------------------------------------------------
// Your icon: the picker (Settings › Navigation, and tapping yourself on the map while stopped)
// ---------------------------------------------------------------------------

export function NavIconChoices({ value, onChange }: { value: Partial<NavIconChoice> | null | undefined; onChange: (v: NavIconChoice) => void }) {
  const icon = navIconOf(value);
  const [error, setError] = useState<string | null>(null);
  // Your own image: pick → square crop → plate check when one is found → stored on this phone only.
  const flow = usePhotoFlow({
    aspect: '1:1',
    plates: 'ifFound',
    onError: setError,
    onPhoto: (ref) => onChange({ shape: 'photo', colour: icon.colour, photo: ref }),
  });
  const shapes = [...NAV_ICON_SHAPES.map((x) => ({ key: x.id, label: x.label })), { key: 'photo' as const, label: 'Your own image' }];
  return (
    <View style={{ gap: SPACING.md }}>
      <View style={st.preview} aria-hidden>
        <NavIcon shape={icon.shape} colour={icon.hex} photo={icon.photo ? photoUri(icon.photo) : null} size={56} />
      </View>
      <ChoiceGroup
        label="Shape"
        value={icon.shape}
        onChange={(shape) => {
          if (shape === 'photo' && !icon.photo) flow.pick();
          else onChange({ shape, colour: icon.colour, ...(icon.photo ? { photo: icon.photo } : {}) });
        }}
        options={shapes}
      />
      {icon.shape === 'photo' ? (
        <View style={{ gap: SPACING.xs }}>
          <Button label="Choose another image" tier="secondary" size="sm" busy={flow.busy} onPress={() => flow.pick()} />
          <DsText v="caption">Kept on this phone only. Nobody else sees your icon.</DsText>
        </View>
      ) : null}
      {error ? (
        <DsText v="caption" tone="danger">
          {error}
        </DsText>
      ) : null}
      <ChoiceGroup
        label={icon.shape === 'photo' ? 'Ring colour' : 'Colour'}
        value={icon.colour}
        onChange={(colour) => onChange({ shape: icon.shape, colour, ...(icon.photo ? { photo: icon.photo } : {}) })}
        options={NAV_ICON_COLOURS.map((c) => ({ key: c.id, label: c.label }))}
      />
      {flow.view}
    </View>
  );
}

/** Pick your icon on the map: the DS Sheet, so it looks like every other picker. `bottom` is kept for callers; the Sheet handles the inset. */
export function IconPickerSheet({ visible, value, onChange, onClose }: { visible: boolean; value: Partial<NavIconChoice> | null | undefined; onChange: (v: NavIconChoice) => void; onClose: () => void; bottom?: number }) {
  return (
    <Sheet visible={visible} title="Your icon on the map" onClose={onClose}>
      <NavIconChoices value={value} onChange={onChange} />
    </Sheet>
  );
}

const st = StyleSheet.create({
  banner: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md, paddingHorizontal: SPACING.md, paddingBottom: SPACING.md,
    backgroundColor: COLOR.surface.card, borderBottomWidth: 1, borderBottomColor: COLOR.surface.borderStrong,
  },
  /** The turn arrow: chalk, big (sodium is only the primary button and selected states). */
  arrow: { color: COLOR.text.primary, width: 72, textAlign: 'center' },
  then: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.xs, backgroundColor: COLOR.surface.bg, borderBottomWidth: 1, borderBottomColor: COLOR.surface.border },

  bar: { backgroundColor: COLOR.surface.card, paddingHorizontal: SPACING.md, paddingTop: SPACING.md, gap: SPACING.sm, borderTopWidth: 1, borderTopColor: COLOR.surface.border },
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  speedBox: { minWidth: 86, alignItems: 'center', borderWidth: 2, borderColor: COLOR.surface.raisedHi, borderRadius: RADII.card, paddingVertical: SPACING.xxs, paddingHorizontal: SPACING.sm },
  speedOver: { borderColor: COLOR.state.danger, backgroundColor: tint(COLOR.state.danger) },
  /** A real UK sign: white disc, red ring, black number, whatever the theme. */
  roundel: { backgroundColor: ART.signWhite, borderColor: ART.signRed, alignItems: 'center', justifyContent: 'center' },
  roundelText: { color: ART.signBlack, textAlign: 'center' },
  trip: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: SPACING.sm, minHeight: 60 },
  end: { width: 100, height: 60, borderRadius: RADII.card, backgroundColor: COLOR.state.danger, alignItems: 'center', justifyContent: 'center' },

  mapButton: {
    width: 58, height: 58, borderRadius: RADII.pill, backgroundColor: COLOR.surface.glassRaised, borderWidth: 2, borderColor: COLOR.surface.raisedHi,
    alignItems: 'center', justifyContent: 'center',
  },
  pill: { backgroundColor: COLOR.surface.glassRaised, borderRadius: RADII.control, borderWidth: 2, borderColor: COLOR.state.warning, paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs },

  preview: { alignSelf: 'center', width: 76, height: 76, alignItems: 'center', justifyContent: 'center', borderRadius: RADII.card, backgroundColor: COLOR.surface.bg },
});

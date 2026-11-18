import { Pressable, StyleSheet, View } from 'react-native';
import { KIND_INFO, promptText, REPORT_GRID, type RoadReport, type RoadReportKind, type RoadVote } from '../lib/roadReports';
import { COLOR, RADII, ROAD_COLOUR, SPACING } from '../theme';
import { DsText, Press } from './ds';
import { Pin } from './Pin';

/**
 * The driving view's road-report controls. Big targets, few words, nothing to
 * read twice: report in two taps (REPORT, then what), undo for 5 seconds, and
 * a "Still there?" that goes away by itself after 8 seconds (ignoring it costs
 * nothing).
 */

/** The second tap: what you're reporting. */
export function ReportGrid({ onPick, onClose, bottom }: { onPick: (kind: RoadReportKind) => void; onClose: () => void; bottom: number }) {
  const rows: RoadReportKind[][] = [];
  for (let i = 0; i < REPORT_GRID.length; i += 2) rows.push(REPORT_GRID.slice(i, i + 2));
  return (
    <View style={StyleSheet.absoluteFill} accessibilityViewIsModal>
      <Pressable style={[StyleSheet.absoluteFill, st.backdrop]} onPress={onClose} accessibilityLabel="Close without reporting" />
      <View style={[st.sheet, { paddingBottom: bottom + SPACING.sm }]}>
        <DsText v="driveButton" accessibilityRole="header" style={{ marginLeft: SPACING.xs }}>
          Report
        </DsText>
        {rows.map((row) => (
          <View key={row.join()} style={st.gridRow}>
            {row.map((k) => (
              <Press key={k} onPress={() => onPick(k)} haptic="success" label={`Report ${KIND_INFO[k].label}`} style={st.tile} pressedStyle={{ backgroundColor: COLOR.surface.raisedHi }}>
                <Pin glyph={k} colour={ROAD_COLOUR} size={36} />
                <DsText v="driveRoad" numberOfLines={2} style={{ flex: 1 }}>
                  {KIND_INFO[k].label}
                </DsText>
              </Press>
            ))}
          </View>
        ))}
        <Press onPress={onClose} label="Cancel" style={st.cancel}>
          <DsText v="driveButton">Cancel</DsText>
        </Press>
      </View>
    </View>
  );
}

/** Sent in a few seconds, unless you undo it. */
export function UndoBar({ kind, secondsLeft, onUndo }: { kind: RoadReportKind; secondsLeft: number; onUndo: () => void }) {
  return (
    <View style={st.bar} accessibilityLiveRegion="polite">
      <Pin glyph={kind} colour={ROAD_COLOUR} size={34} />
      <DsText v="driveRoad" numberOfLines={2} style={{ flex: 1 }}>
        {KIND_INFO[kind].label} reported
      </DsText>
      <Press onPress={onUndo} label="Undo the report" style={st.undo}>
        <DsText v="driveButton" tone="onAction">
          Undo {secondsLeft}
        </DsText>
      </Press>
    </View>
  );
}

/** Just driven past someone's report: still there? */
export function StillTherePrompt({ report, onAnswer, onDismiss }: { report: RoadReport; onAnswer: (vote: RoadVote) => void; onDismiss: () => void }) {
  return (
    <View style={[st.bar, { flexDirection: 'column', alignItems: 'stretch', gap: SPACING.sm }]} accessibilityLiveRegion="polite">
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.md }}>
        <Pin glyph={report.kind} colour={ROAD_COLOUR} size={34} />
        <DsText v="driveRoad" style={{ flex: 1 }}>
          {promptText(report)}
        </DsText>
        <Press onPress={onDismiss} hitSlop={12} label="Not sure. Close">
          <DsText v="driveLabel" tone="secondary">
            Skip
          </DsText>
        </Press>
      </View>
      <View style={{ flexDirection: 'row', gap: SPACING.md }}>
        <Press onPress={() => onAnswer('still_there')} haptic="success" label="Yes, still there" style={[st.answer, { backgroundColor: COLOR.state.success }]}>
          <DsText v="driveButton" tone="onAction">
            Yes
          </DsText>
        </Press>
        <Press onPress={() => onAnswer('gone')} haptic="success" label="No, it's gone" style={[st.answer, { borderWidth: 2, borderColor: COLOR.surface.raisedHi }]}>
          <DsText v="driveButton">No, gone</DsText>
        </Press>
      </View>
    </View>
  );
}

/** "CRASH REPORTED AHEAD · 0.5 MI" under the turn banner. */
export function ReportAlert({ text }: { text: string }) {
  return (
    <View style={st.alert} accessibilityLiveRegion="assertive">
      <DsText v="driveButton" tone="onAction" numberOfLines={2}>
        {text}
      </DsText>
    </View>
  );
}

const st = StyleSheet.create({
  backdrop: { backgroundColor: COLOR.surface.scrim },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: COLOR.surface.card, borderTopWidth: 3, borderTopColor: ROAD_COLOUR, padding: SPACING.md, gap: SPACING.sm },
  gridRow: { flexDirection: 'row', gap: SPACING.sm },
  tile: {
    flex: 1, minHeight: 76, borderRadius: RADII.card, borderWidth: 2, borderColor: COLOR.surface.raisedHi, backgroundColor: COLOR.surface.bg,
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingHorizontal: SPACING.md,
  },
  cancel: { height: 60, borderRadius: RADII.card, borderWidth: 2, borderColor: COLOR.surface.raisedHi, alignItems: 'center', justifyContent: 'center' },
  bar: {
    backgroundColor: COLOR.surface.card, borderTopWidth: 3, borderTopColor: ROAD_COLOUR, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
  },
  undo: { height: 60, minWidth: 120, borderRadius: RADII.card, backgroundColor: ROAD_COLOUR, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING.md },
  answer: { flex: 1, height: 64, borderRadius: RADII.card, alignItems: 'center', justifyContent: 'center' },
  alert: { backgroundColor: ROAD_COLOUR, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm },
});

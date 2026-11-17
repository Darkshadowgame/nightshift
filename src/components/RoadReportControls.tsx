import { Pressable, StyleSheet, Text, View } from 'react-native';
import { KIND_INFO, promptText, REPORT_GRID, type RoadReport, type RoadReportKind, type RoadVote } from '../lib/roadReports';
import { C, F, ROAD_COLOUR } from '../theme';
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
      <View style={[st.sheet, { paddingBottom: bottom + 10 }]}>
        <Text style={st.title} accessibilityRole="header">REPORT</Text>
        {rows.map((row) => (
          <View key={row.join()} style={st.gridRow}>
            {row.map((k) => (
              <Pressable
                key={k}
                onPress={() => onPick(k)}
                accessibilityRole="button"
                accessibilityLabel={`Report ${KIND_INFO[k].label}`}
                style={({ pressed }) => [st.tile, pressed && { backgroundColor: C.kerbHi }]}
              >
                <Pin glyph={k} colour={ROAD_COLOUR} size={36} />
                <Text style={st.tileText} numberOfLines={2}>{KIND_INFO[k].label}</Text>
              </Pressable>
            ))}
          </View>
        ))}
        <Pressable onPress={onClose} accessibilityRole="button" style={({ pressed }) => [st.cancel, pressed && { opacity: 0.7 }]}>
          <Text style={st.cancelText}>CANCEL</Text>
        </Pressable>
      </View>
    </View>
  );
}

/** Sent in a few seconds, unless you undo it. */
export function UndoBar({ kind, secondsLeft, onUndo }: { kind: RoadReportKind; secondsLeft: number; onUndo: () => void }) {
  return (
    <View style={st.bar} accessibilityLiveRegion="polite">
      <Pin glyph={kind} colour={ROAD_COLOUR} size={34} />
      <Text style={st.barText} numberOfLines={2}>{KIND_INFO[kind].label.toUpperCase()} REPORTED</Text>
      <Pressable onPress={onUndo} accessibilityRole="button" accessibilityLabel="Undo the report" style={({ pressed }) => [st.undo, pressed && { opacity: 0.7 }]}>
        <Text style={st.undoText}>UNDO {secondsLeft}</Text>
      </Pressable>
    </View>
  );
}

/** Just driven past someone's report: still there? */
export function StillTherePrompt({ report, onAnswer, onDismiss }: { report: RoadReport; onAnswer: (vote: RoadVote) => void; onDismiss: () => void }) {
  return (
    <View style={[st.bar, { flexDirection: 'column', alignItems: 'stretch', gap: 10 }]} accessibilityLiveRegion="polite">
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Pin glyph={report.kind} colour={ROAD_COLOUR} size={34} />
        <Text style={[st.barText, { flex: 1 }]}>{promptText(report)}</Text>
        <Pressable onPress={onDismiss} hitSlop={12} accessibilityRole="button" accessibilityLabel="Not sure. Close">
          <Text style={st.skip}>SKIP</Text>
        </Pressable>
      </View>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Pressable onPress={() => onAnswer('still_there')} accessibilityRole="button" accessibilityLabel="Yes, still there" style={({ pressed }) => [st.answer, { backgroundColor: C.lime }, pressed && { opacity: 0.8 }]}>
          <Text style={[st.answerText, { color: C.asphalt }]}>YES</Text>
        </Pressable>
        <Pressable onPress={() => onAnswer('gone')} accessibilityRole="button" accessibilityLabel="No, it's gone" style={({ pressed }) => [st.answer, { borderWidth: 2, borderColor: C.kerbHi }, pressed && { opacity: 0.8 }]}>
          <Text style={st.answerText}>NO, GONE</Text>
        </Pressable>
      </View>
    </View>
  );
}

/** "CRASH REPORTED AHEAD · 0.5 MI" under the turn banner. */
export function ReportAlert({ text }: { text: string }) {
  return (
    <View style={st.alert} accessibilityLiveRegion="assertive">
      <Text style={st.alertText} numberOfLines={2}>{text}</Text>
    </View>
  );
}

const st = StyleSheet.create({
  backdrop: { backgroundColor: 'rgba(5,8,12,0.6)' },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: C.tarmac, borderTopWidth: 3, borderTopColor: ROAD_COLOUR, padding: 12, gap: 10 },
  title: { fontFamily: F.display, fontSize: 20, color: C.chalk, letterSpacing: 2, marginLeft: 4 },
  gridRow: { flexDirection: 'row', gap: 10 },
  tile: {
    flex: 1, minHeight: 76, borderRadius: 12, borderWidth: 2, borderColor: C.kerbHi, backgroundColor: C.asphalt,
    flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12,
  },
  tileText: { flex: 1, fontFamily: F.bodyBold, fontSize: 20, lineHeight: 24, color: C.chalk },
  cancel: { height: 60, borderRadius: 12, borderWidth: 2, borderColor: C.kerbHi, alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontFamily: F.labelBold, fontSize: 20, color: C.chalk, letterSpacing: 1.5 },
  bar: {
    backgroundColor: C.tarmac, borderTopWidth: 3, borderTopColor: ROAD_COLOUR, paddingHorizontal: 16, paddingVertical: 12,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  barText: { flex: 1, fontFamily: F.bodyBold, fontSize: 21, lineHeight: 26, color: C.chalk },
  undo: { height: 60, minWidth: 120, borderRadius: 12, backgroundColor: ROAD_COLOUR, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  undoText: { fontFamily: F.display, fontSize: 20, color: C.asphalt, letterSpacing: 1 },
  skip: { fontFamily: F.labelBold, fontSize: 16, color: C.fog, letterSpacing: 1 },
  answer: { flex: 1, height: 64, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  answerText: { fontFamily: F.display, fontSize: 22, color: C.chalk, letterSpacing: 1.5 },
  alert: { backgroundColor: ROAD_COLOUR, paddingHorizontal: 16, paddingVertical: 8 },
  alertText: { fontFamily: F.labelBold, fontSize: 20, color: C.asphalt, letterSpacing: 1 },
});

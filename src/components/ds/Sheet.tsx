import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, View } from 'react-native';
import Animated, { FadeIn, SlideInDown, useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { confirmLabels } from '../../lib/glossary';
import { COLOR, ELEVATION, MOTION, RADII, SPACING } from '../../theme';
import { Button } from './Button';
import { Press } from './Press';
import { DsText } from './Text';

/**
 * The panel of a bottom sheet: grabber, title, Done, then the content. Exported on its own so
 * the gallery (and tests) can show it without a modal.
 */
export function SheetPanel({ title, onClose, doneLabel = 'Done', children, bottomInset = 0 }: { title: string; onClose: () => void; doneLabel?: string; children: ReactNode; bottomInset?: number }) {
  return (
    <View
      style={[
        {
          backgroundColor: COLOR.surface.card,
          borderTopLeftRadius: RADII.sheet,
          borderTopRightRadius: RADII.sheet,
          borderWidth: 1,
          borderBottomWidth: 0,
          borderColor: COLOR.surface.raisedHi,
          paddingHorizontal: SPACING.lg,
          paddingBottom: Math.max(bottomInset, SPACING.lg),
          // Shrinks to fit the cap on Sheet's wrapper; the ScrollView takes the cut, not the buttons.
          flexShrink: 1,
          minHeight: 0,
        },
        ELEVATION.sheet,
      ]}
    >
      <View style={{ alignItems: 'center', paddingTop: SPACING.sm }} aria-hidden>
        <View style={{ width: 36, height: 5, borderRadius: RADII.pill, backgroundColor: COLOR.surface.raisedHi }} />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: 48, gap: SPACING.sm }}>
        <DsText v="heading" accessibilityRole="header" numberOfLines={1} style={{ flex: 1 }}>
          {title}
        </DsText>
        <Press onPress={onClose} label={doneLabel} hitSlop={8} style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: SPACING.xs }}>
          <DsText v="buttonSm" tone="action">
            {doneLabel}
          </DsText>
        </Press>
      </View>
      <ScrollView bounces={false} keyboardShouldPersistTaps="handled" style={{ flexGrow: 0, flexShrink: 1 }} contentContainerStyle={{ gap: SPACING.md, paddingBottom: SPACING.sm }}>
        {children}
      </ScrollView>
    </View>
  );
}

/**
 * Pick from options, or a short secondary task, in a bottom sheet. One mechanism for every
 * picker and options menu (replaces OptionsSheet, NavLaunch's picker, SharePicker's page sheet,
 * VoicePicker). Slides up; with reduced motion it fades. Tap the scrim or Done to close.
 * Create and edit flows are modal routes, not sheets.
 */
export function Sheet({ visible, title, onClose, doneLabel, children }: { visible: boolean; title: string; onClose: () => void; doneLabel?: string; children: ReactNode }) {
  const reduced = useReducedMotion();
  const insets = useSafeAreaInsets();
  // The height cap is layout, not a percentage: the wrapper is a shrinkable flex item of a
  // full-screen column (which KeyboardAvoidingView shortens above the keyboard on iOS), kept
  // clear of the status bar by a top margin, and the panel and its ScrollView shrink inside it.
  // (A `maxHeight: '90%'` on the panel resolved against this wrapper on web, so every sheet lost
  // its last 10% and showed the tab bar below; on iOS it resolved against nothing, so no cap.)
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Animated.View entering={FadeIn.duration(MOTION.fast)} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: COLOR.surface.scrim }}>
          <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityRole="button" accessibilityLabel={`Close ${title}`} />
        </Animated.View>
        <Animated.View
          entering={reduced ? FadeIn.duration(MOTION.fast) : SlideInDown.duration(MOTION.sheet)}
          accessibilityViewIsModal
          style={{ marginTop: insets.top + SPACING.xl, flexShrink: 1, minHeight: 0 }}
        >
          <SheetPanel title={title} onClose={onClose} doneLabel={doneLabel} bottomInset={insets.bottom}>
            {children}
          </SheetPanel>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/** One option in a Sheet menu: full-width, 52 tall, optional detail; `destructive` in red. */
export function SheetOption({ label, detail, onPress, destructive }: { label: string; detail?: string; onPress: () => void; destructive?: boolean }) {
  return (
    <Press onPress={onPress} haptic={destructive ? 'warning' : 'none'} label={detail ? `${label}, ${detail}` : label} style={{ minHeight: 52, justifyContent: 'center', borderBottomWidth: 1, borderBottomColor: COLOR.surface.border }}>
      <DsText v="body" tone={destructive ? 'danger' : 'primary'}>
        {label}
      </DsText>
      {detail ? <DsText v="caption">{detail}</DsText> : null}
    </Press>
  );
}

/**
 * Confirm before something that can't be undone: the question, then "{Verb} it" (destructive red,
 * or primary for a non-destructive switch) and "Keep it". Lives in a Sheet so it looks the same
 * wherever it's asked.
 */
export function ConfirmSheet({
  visible,
  title,
  message,
  verb,
  cancelLabel,
  destructive = true,
  busy,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  message: string;
  /** "Leave" gives "Leave it / Keep it" (glossary.confirmLabels). */
  verb: string;
  /** Instead of "Keep it": "Keep editing" when leaving a form with changes (4.2). */
  cancelLabel?: string;
  destructive?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Sheet visible={visible} title={title} onClose={onCancel} doneLabel="Cancel">
      <ConfirmBody message={message} verb={verb} cancelLabel={cancelLabel} destructive={destructive} busy={busy} onConfirm={onConfirm} onCancel={onCancel} />
    </Sheet>
  );
}

/** The inside of ConfirmSheet, on its own for the gallery. */
export function ConfirmBody({ message, verb, cancelLabel, destructive = true, busy, onConfirm, onCancel }: { message: string; verb: string; cancelLabel?: string; destructive?: boolean; busy?: boolean; onConfirm: () => void; onCancel: () => void }) {
  const labels = { ...confirmLabels(verb), ...(cancelLabel ? { cancel: cancelLabel } : null) };
  return (
    <View style={{ gap: SPACING.md }}>
      <DsText v="body">{message}</DsText>
      <Button label={labels.confirm} tier={destructive ? 'destructive' : 'primary'} block busy={busy} onPress={onConfirm} />
      <Button label={labels.cancel} tier="secondary" block onPress={onCancel} />
    </View>
  );
}

import { Children, isValidElement, type ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, View } from 'react-native';
import Animated, { FadeIn, SlideInDown, useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { confirmLabels } from '../../lib/glossary';
import { COLOR, ELEVATION, MOTION, RADII, SPACING } from '../../theme';
import { ActionBar, InSheetContext } from './ActionBar';
import { Button } from './Button';
import { Press } from './Press';
import { DsText } from './Text';

/**
 * A sheet's primary is never scrolled out of sight (REVIEW-11: Add a mod's button sat under the
 * sheet's bottom at 375x667). The last child, when it is an `ActionBar` or a block primary
 * `Button` (no tier, or tier "primary"), is lifted out of the scroll and pinned under it.
 */
export function splitFooter(children: ReactNode): { body: ReactNode[]; footer: ReactNode | null } {
  const list = Children.toArray(children);
  const last = list[list.length - 1];
  if (isValidElement(last)) {
    const props = last.props as { tier?: string; block?: boolean };
    if (last.type === ActionBar || (last.type === Button && props.block && (!props.tier || props.tier === 'primary'))) {
      return { body: list.slice(0, -1), footer: last };
    }
  }
  return { body: list, footer: null };
}

/**
 * The panel of a bottom sheet: grabber, title, Done, then the content, and the pinned primary
 * (see `splitFooter`). Exported on its own so the gallery (and tests) can show it without a modal.
 */
export function SheetPanel({ title, onClose, doneLabel = 'Done', hideDone, children, bottomInset = 0 }: { title: string; onClose: () => void; doneLabel?: string; hideDone?: boolean; children: ReactNode; bottomInset?: number }) {
  const { body, footer } = splitFooter(children);
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
        <DsText v="heading" accessibilityRole="header" numberOfLines={2} style={{ flex: 1 }}>
          {title}
        </DsText>
        {hideDone ? null : (
          <Press onPress={onClose} label={doneLabel} hitSlop={8} style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: SPACING.xs }}>
            <DsText v="buttonSm" tone="action">
              {doneLabel}
            </DsText>
          </Press>
        )}
      </View>
      <ScrollView bounces={false} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" style={{ flexGrow: 0, flexShrink: 1 }} contentContainerStyle={{ gap: SPACING.md, paddingBottom: SPACING.sm }}>
        {body}
      </ScrollView>
      {footer ? (
        <View style={{ flexShrink: 0, paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: COLOR.surface.border }}>
          <InSheetContext.Provider value>{footer}</InSheetContext.Provider>
        </View>
      ) : null}
    </View>
  );
}

/**
 * Pick from options, or a short secondary task, in a bottom sheet. One mechanism for every
 * picker and options menu (replaces OptionsSheet, NavLaunch's picker, SharePicker's page sheet,
 * VoicePicker). Slides up; with reduced motion it fades. Tap the scrim or Done to close.
 * Create and edit flows are modal routes, not sheets.
 */
export function Sheet({ visible, title, onClose, onDone, doneLabel, hideDone, children }: { visible: boolean; title: string; onClose: () => void; /** The header Done, when it means more than closing (the vote sheet: you're done voting). Defaults to onClose. */ onDone?: () => void; doneLabel?: string; /** No header Done: the sheet's own buttons are the only way out (ConfirmSheet). The scrim still closes it. */ hideDone?: boolean; children: ReactNode }) {
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
          <SheetPanel title={title} onClose={onDone ?? onClose} doneLabel={doneLabel} hideDone={hideDone} bottomInset={insets.bottom}>
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
 * The one confirm (Redesign 2, 4.5; Review 13): the question, then two buttons in the body and no
 * header Done or Cancel. Every confirm in the app is this sheet:
 *
 * - Something destructive: "{Verb} it" (red) and "Keep it". `verb="Leave"` gives Leave it / Keep it.
 * - An ambiguous verb: both outcomes in plain words, `confirmLabel` and `cancelLabel` (leaving a
 *   meet: "Yes, I can't go" / "I'm still going", glossary `LEAVE_MEET`).
 * - Leaving a form with changes: `verb="Discard"`, `cancelLabel="Keep editing"`.
 * - A non-destructive switch: `destructive={false}` draws "{Verb} it" as the primary.
 * - The meet-ban warning (owner decision 9.3): `safeFirst` puts the way back ("Change location")
 *   on top as the primary and the risky choice under it ("Post anyway", `confirmLabel`).
 *
 * The scrim still closes it, as the cancel.
 */
export function ConfirmSheet({
  visible,
  title,
  message,
  verb,
  confirmLabel,
  cancelLabel,
  destructive = true,
  safeFirst,
  busy,
  onConfirm,
  onCancel,
  onDismiss,
  children,
}: {
  visible: boolean;
  title: string;
  message: string;
  /** "Leave" gives "Leave it / Keep it" (glossary.confirmLabels). */
  verb: string;
  /** Instead of "{Verb} it": when the verb is ambiguous ("Yes, I can't go"), or the meet-ban warning ("Post anyway"). */
  confirmLabel?: string;
  /** Instead of "Keep it": "Keep editing" when leaving a form with changes (4.2), "I'm still going", "Change location" on the ban warning. */
  cancelLabel?: string;
  destructive?: boolean;
  /** The way back is the primary, on top (the meet-ban warning). */
  safeFirst?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  /** The scrim (and Android back): closes without either choice. Defaults to `onCancel`. */
  onDismiss?: () => void;
  /** A quiet line under the message ("Nightshift only warns…"). */
  children?: ReactNode;
}) {
  return (
    // One way to back out (rule 4.5, REVIEW-11): the cancel button in the body, no header Cancel as well.
    <Sheet visible={visible} title={title} onClose={onDismiss ?? onCancel} hideDone>
      <ConfirmBody message={message} verb={verb} confirmLabel={confirmLabel} cancelLabel={cancelLabel} destructive={destructive} safeFirst={safeFirst} busy={busy} onConfirm={onConfirm} onCancel={onCancel}>
        {children}
      </ConfirmBody>
    </Sheet>
  );
}

/** The inside of ConfirmSheet, on its own for the gallery (and a photo's inline remove). */
export function ConfirmBody({
  message,
  verb,
  confirmLabel,
  cancelLabel,
  destructive = true,
  safeFirst,
  busy,
  onConfirm,
  onCancel,
  children,
}: {
  message: string;
  verb: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  safeFirst?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  children?: ReactNode;
}) {
  const labels = confirmLabels(verb, { confirm: confirmLabel, cancel: cancelLabel });
  const confirm = <Button key="confirm" label={labels.confirm} tier={destructive ? 'destructive' : 'primary'} block busy={busy} onPress={onConfirm} />;
  const cancel = <Button key="cancel" label={labels.cancel} tier={safeFirst ? 'primary' : 'secondary'} block onPress={onCancel} />;
  return (
    <View style={{ gap: SPACING.md }}>
      <DsText v="body">{message}</DsText>
      {children}
      {safeFirst ? [cancel, confirm] : [confirm, cancel]}
    </View>
  );
}

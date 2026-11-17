import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Haptics for the key moments. Haptics aren't motion, so they stay on with
 * reduced motion. Failures are ignored: a missing buzz should never break a tap.
 */
function run(fn: () => Promise<void>) {
  if (Platform.OS === 'web') return;
  fn().catch(() => {});
}

export const feel = {
  /** Going, small confirmations. */
  tap: () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  /** Choosing one of several (votes). */
  select: () => run(() => Haptics.selectionAsync()),
  /** The class letter flipping. */
  thump: () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
  /** Checked in, unlocked, class up landed. */
  success: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  /** Move on: a distinct pattern so hosts know it went out. */
  warning: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
};

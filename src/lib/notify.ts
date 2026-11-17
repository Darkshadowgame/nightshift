import * as Notifications from 'expo-notifications';
import { planReminders, type Reminder } from './reminders';

/**
 * The thin side-effect layer for local notifications (no push server, so no
 * paid Apple account is needed). What to schedule is worked out in reminders.ts.
 */

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const notificationsSupported = true;

export async function permissionGranted(): Promise<boolean> {
  try {
    const p = await Notifications.getPermissionsAsync();
    return p.granted;
  } catch {
    return false;
  }
}

/** Asks once (iOS only shows the prompt the first time). Returns whether reminders can be sent. */
export async function askPermission(): Promise<boolean> {
  try {
    const p = await Notifications.getPermissionsAsync();
    if (p.granted) return true;
    if (!p.canAskAgain) return false;
    const r = await Notifications.requestPermissionsAsync({ ios: { allowAlert: true, allowBadge: false, allowSound: true } });
    return r.granted;
  } catch {
    return false;
  }
}

function content(r: Reminder): Notifications.NotificationContentInput {
  return { title: r.title, body: r.body, data: { url: r.url, eventId: r.eventId, key: r.key } };
}

/** Make the phone's scheduled reminders match `wanted`. Safe to call often. */
export async function syncReminders(wanted: Reminder[]): Promise<void> {
  if (!(await permissionGranted())) return;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const plan = planReminders(
    scheduled.map((n) => n.identifier),
    wanted,
  );
  for (const key of plan.cancel) await Notifications.cancelScheduledNotificationAsync(key);
  for (const r of plan.schedule) {
    await Notifications.scheduleNotificationAsync({
      identifier: r.key,
      content: content(r),
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: r.at },
    });
  }
}

/** Show a notification now (e.g. "the meet moved on"). */
export async function notifyNow(r: Reminder): Promise<void> {
  if (!(await permissionGranted())) return;
  await Notifications.scheduleNotificationAsync({ identifier: r.key, content: content(r), trigger: null });
}

/** Calls `open(url)` when someone taps a notification, including the one that launched the app. */
export function onNotificationTap(open: (url: string) => void): () => void {
  const handle = (response: Notifications.NotificationResponse | null) => {
    const url = response?.notification.request.content.data?.url;
    if (typeof url === 'string' && url.startsWith('/')) open(url);
  };
  const last = Notifications.getLastNotificationResponse();
  if (last) {
    handle(last);
    Notifications.clearLastNotificationResponse();
  }
  const sub = Notifications.addNotificationResponseReceivedListener(handle);
  return () => sub.remove();
}

/** For trying reminders out: a sample one in a few seconds (lock the phone to see it). */
export async function testReminder(seconds = 5): Promise<boolean> {
  if (!(await askPermission())) return false;
  await Notifications.scheduleNotificationAsync({
    content: { title: 'Nightshift reminders work', body: 'You’ll get one at the reveal and 30 min before the start.', data: { url: '/notifications' } },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds },
  });
  return true;
}

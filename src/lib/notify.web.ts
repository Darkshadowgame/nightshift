import type { Reminder } from './reminders';

/** The web preview has no local notifications: the in-app list still works. */
export const notificationsSupported = false;
export async function permissionGranted(): Promise<boolean> {
  return false;
}
export async function askPermission(): Promise<boolean> {
  return false;
}
export async function syncReminders(_wanted: Reminder[]): Promise<void> {}
export async function notifyNow(_r: Reminder): Promise<void> {}
export function onNotificationTap(_open: (url: string) => void): () => void {
  return () => {};
}
export async function testReminder(_seconds = 5): Promise<boolean> {
  return false;
}

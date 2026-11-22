import * as Location from 'expo-location';
import { AppState, Platform } from 'react-native';
import type { Fix } from './nav';
import { realNowMs } from './appClock';

/**
 * Navigation keeps getting your location with the phone locked or Slipstream in the background,
 * and only while you are navigating. The "location" background mode (app.json) plus expo-location's
 * background updates, started while the app is open: iOS allows that on "When In Use" (it shows the
 * blue indicator), so there is no "Always" permission. Stopped the moment navigation ends.
 * The app's own foreground watch keeps running as before; this only delivers while the app is not in front.
 */

const TASK = 'slipstream-nav-location';

type TaskManagerModule = typeof import('expo-task-manager');

/** expo-task-manager, or null where it isn't there (web, Expo Go, a build without it). */
function taskManager(): TaskManagerModule | null {
  if (Platform.OS !== 'ios') return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-task-manager') as TaskManagerModule;
  } catch {
    return null;
  }
}

let sink: ((fix: Fix) => void) | null = null;

/** A GPS reading as the driving view wants it. */
export function fixFromLocation(loc: Location.LocationObject): Fix {
  return {
    at: { lat: loc.coords.latitude, lng: loc.coords.longitude },
    speed: loc.coords.speed != null && loc.coords.speed >= 0 ? loc.coords.speed : null,
    course: loc.coords.heading != null && loc.coords.heading >= 0 ? loc.coords.heading : null,
    accuracy: loc.coords.accuracy ?? null,
    t: loc.timestamp || realNowMs(),
  };
}

// Tasks are defined when this file loads. Fixes only pass on while the app is in the background:
// in front, the foreground watch already delivers them.
try {
  taskManager()?.defineTask(TASK, async ({ data, error }: { data?: unknown; error?: unknown }) => {
    if (error || !sink || AppState.currentState === 'active') return;
    const locations = (data as { locations?: Location.LocationObject[] } | undefined)?.locations;
    if (Array.isArray(locations)) for (const loc of locations) sink(fixFromLocation(loc));
  });
} catch {
  // No task manager in this build: navigation simply pauses in the background as before.
}

/** Starts background updates (call while the app is open). True when they are running. */
export async function startNavBackground(onFix: (fix: Fix) => void): Promise<boolean> {
  const tm = taskManager();
  if (!tm) return false;
  try {
    sink = onFix;
    if (await Location.hasStartedLocationUpdatesAsync(TASK)) return true;
    await Location.startLocationUpdatesAsync(TASK, {
      accuracy: Location.Accuracy.BestForNavigation,
      distanceInterval: 0,
      activityType: Location.ActivityType.AutomotiveNavigation,
      pausesUpdatesAutomatically: false,
      showsBackgroundLocationIndicator: true,
    });
    return true;
  } catch {
    sink = null;
    return false;
  }
}

/** Stops background updates. Safe to call when they never started. */
export async function stopNavBackground(): Promise<void> {
  sink = null;
  if (!taskManager()) return;
  try {
    if (await Location.hasStartedLocationUpdatesAsync(TASK)) await Location.stopLocationUpdatesAsync(TASK);
  } catch {
    // Nothing was running.
  }
}

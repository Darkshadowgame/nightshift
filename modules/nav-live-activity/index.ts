import { requireOptionalNativeModule } from 'expo';

/** What the lock screen and Dynamic Island show. All text is worded in JavaScript (src/lib/liveActivity.ts). */
export interface NavActivityState {
  /** straight, left, right, slightLeft, slightRight, sharpLeft, sharpRight, keepLeft, keepRight, uturn, roundabout, arrive. */
  arrow: string;
  distance: string;
  road: string;
  remaining: string;
  eta: string;
  destination: string;
}

interface Native {
  isEnabled(): boolean;
  start(state: NavActivityState): Promise<boolean>;
  update(state: NavActivityState): Promise<boolean>;
  end(state: NavActivityState | null, lingerSeconds: number): Promise<boolean>;
}

/** Null on web, Android, Expo Go, and any build made before this module existed. */
export const nativeLiveActivity = requireOptionalNativeModule<Native>('NavLiveActivity');

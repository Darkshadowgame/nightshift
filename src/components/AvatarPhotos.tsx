import { useCallback, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { legacyAvatar } from '../lib/avatar';
import { buildPicture } from '../lib/similarPhoto';
import { photoSource } from '../lib/photoSource';
import { useStore } from '../lib/store';
import { mainBuild } from './Community';
import { AvatarPhotoContext, type Photo } from './ds';

/**
 * Profile pictures for every Avatar. Someone's own choice (profile avatar_ref: a library photo or one of
 * their vehicle photos, seen by everyone) comes first; otherwise their main build's photo (in the demo,
 * its stand-in when they haven't added one), so the Going list, chats and People read as cars, not grey
 * letters. Someone with no picture and no car or bike keeps their initials.
 *
 * It also moves the old per-phone choice (settings.avatarRef) onto the profile, once, and then stops
 * using it.
 */
export function AvatarPhotos({ children }: { children: ReactNode }) {
  const { users, builds, backend, me, settings, setSettings, setAvatar, ready } = useStore();
  const demo = backend === 'local';
  const byHandle = useMemo(() => {
    const map = new Map<string, Photo>();
    for (const u of users) {
      const mine = builds.filter((x) => x.ownerId === u.id);
      const b = mainBuild(mine);
      const pic = b ? buildPicture(b, demo) : null;
      if (u.avatarRef) map.set(u.handle.toLowerCase(), photoSource(u.avatarRef));
      else if (pic) map.set(u.handle.toLowerCase(), photoSource(pic.ref));
    }
    return map;
  }, [users, builds, demo]);
  const lookup = useCallback((handle: string) => byHandle.get(handle.replace(/^@/, '').toLowerCase()) ?? null, [byHandle]);

  // Once per run: the old choice goes up to the profile (if the profile has none yet) and is forgotten.
  const tried = useRef(false);
  const meUser = users.find((u) => u.id === me);
  const legacy = settings.avatarRef;
  useEffect(() => {
    if (!ready || tried.current || !legacy || !meUser?.handle) return;
    const mine = builds.filter((x) => x.ownerId === me);
    if (!demo && mine.length === 0) return; // vehicles not loaded yet
    tried.current = true;
    const todo = legacyAvatar(legacy, meUser.avatarRef, mine, me, demo);
    if (todo === 'adopt') {
      // Only forget it once it is safely on the profile; offline, try again next run.
      setAvatar(legacy, true)
        .then(() => setSettings({ avatarRef: null }))
        .catch(() => {});
    } else {
      setSettings({ avatarRef: null });
    }
  }, [ready, legacy, meUser, builds, me, demo, setAvatar, setSettings]);

  return <AvatarPhotoContext.Provider value={lookup}>{children}</AvatarPhotoContext.Provider>;
}

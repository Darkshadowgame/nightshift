import { useCallback, useMemo, type ReactNode } from 'react';
import { buildPicture } from '../lib/similarPhoto';
import { photoSource } from '../lib/photoSource';
import { useStore } from '../lib/store';
import { mainBuild } from './Community';
import { AvatarPhotoContext, type Photo } from './ds';

/**
 * Car-photo avatars (Review 19 #33): everyone's Avatar shows their main build's photo by default
 * (in the demo, its stand-in when they haven't added one), so the Going list, chats and People read
 * as cars, not grey letters. Someone with no car or bike keeps their initials.
 */
export function AvatarPhotos({ children }: { children: ReactNode }) {
  const { users, builds, backend, me, settings } = useStore();
  const demo = backend === 'local';
  const byHandle = useMemo(() => {
    const map = new Map<string, Photo>();
    for (const u of users) {
      const mine = builds.filter((x) => x.ownerId === u.id);
      const b = mainBuild(mine);
      const pic = b ? buildPicture(b, demo) : null;
      // Your own choice (Me, local only) wins, while that photo is still one of your vehicles'.
      const chosen = u.id === me && settings.avatarRef && mine.some((x) => x.photos.includes(settings.avatarRef!)) ? settings.avatarRef : null;
      if (chosen) map.set(u.handle.toLowerCase(), photoSource(chosen));
      else if (pic) map.set(u.handle.toLowerCase(), photoSource(pic.ref));
    }
    return map;
  }, [users, builds, demo, me, settings.avatarRef]);
  const lookup = useCallback((handle: string) => byHandle.get(handle.replace(/^@/, '').toLowerCase()) ?? null, [byHandle]);
  return <AvatarPhotoContext.Provider value={lookup}>{children}</AvatarPhotoContext.Provider>;
}

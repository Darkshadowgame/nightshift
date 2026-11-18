import { useState } from 'react';
import { Image, View } from 'react-native';
import { useNow } from '../lib/clock';
import { dynoBadge, runDay } from '../lib/dyno';
import { photoSource } from '../lib/photoSource';
import { useStore } from '../lib/store';
import type { Build } from '../lib/types';
import { COLOR, RADII, SPACING } from '../theme';
import { DsText, Press, Sheet, Tag, metaLine } from './ds';

/**
 * "✓ Dyno" next to a build's power when a dyno run backs it (dyno.ts dynoBadge: a sheet photo, a
 * matching figure, under two years old; signed in, the server agrees). The DS Tag, success tone.
 * Older runs read "Dyno 2023", muted. Tapping it opens the run: the sheet, the day, the rolling
 * road, wheels or crank. Nothing at all for a claimed figure.
 */
export function DynoBadge({ build }: { build: Build }) {
  const now = useNow();
  const [open, setOpen] = useState(false);
  // REVIEW-10 #3: in the demo nobody checks the sheet, so the badge says so.
  const demo = useStore().backend === 'local';
  const badge = dynoBadge(build, now);
  if (!badge) return null;
  const run = badge.run;
  const proven = badge.state === 'proven';
  return (
    <>
      <Press
        onPress={() => setOpen(true)}
        label={proven ? (demo ? 'Dyno, demo: sheet not checked' : 'Dyno proven') : `Dyno run from ${badge.year}`}
        hint="Shows the dyno sheet"
        hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
        style={{ alignSelf: 'flex-start' }}
      >
        <Tag label={proven ? (demo ? '✓ Dyno · Demo' : '✓ Dyno') : `Dyno ${badge.year}`} tone={proven ? 'success' : 'neutral'} />
      </Press>
      <Sheet visible={open} title={proven ? (demo ? 'Dyno (demo)' : 'Dyno proven') : `Dyno run, ${badge.year}`} onClose={() => setOpen(false)}>
        <View style={{ gap: SPACING.sm }}>
          <DsText v="bodyStrong">{`${build.make} ${build.model}`}</DsText>
          <DsText v="body">
            {metaLine([
              `${Math.round(run.powerBhp)} ${run.at === 'wheels' ? 'whp' : 'bhp'}`,
              run.torqueLbFt ? `${Math.round(run.torqueLbFt)} lb-ft` : null,
              run.at === 'wheels' ? 'at the wheels' : 'at the crank (flywheel)',
            ])}
          </DsText>
          <DsText v="secondary">{metaLine([runDay(run.date, now), run.shop])}</DsText>
          {run.photo ? (
            <Image source={photoSource(run.photo)} style={{ width: '100%', aspectRatio: 4 / 3, borderRadius: RADII.control, backgroundColor: COLOR.surface.media }} resizeMode="contain" accessibilityLabel="The dyno sheet" />
          ) : null}
          <DsText v="caption">
            {proven
              ? demo
                ? 'Demo badges aren\'t checked: any photo counts here. Signed in, Nightshift checks the run and others can report a fake or edited sheet.'
                : 'The power shown matches this run and its sheet. Others can report a fake or edited sheet.'
              : 'This run is more than two years old, so it no longer counts as proof.'}
          </DsText>
        </View>
      </Sheet>
    </>
  );
}

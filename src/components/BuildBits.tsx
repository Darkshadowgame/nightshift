import { carShape } from '../lib/buildShape';
import { classOf } from '../lib/classes';
import { dynoBadge, powerText } from '../lib/dyno';
import { plural } from '../lib/format';
import { modCount } from '../lib/modGroups';
import { photoSource } from '../lib/photoSource';
import { buildPicture } from '../lib/similarPhoto';
import { useStore } from '../lib/store';
import type { ModGroup } from '../data/catalog';
import type { Build, ModCategory } from '../lib/types';
import { PaintedArt } from './BuildArt';
import { PhotoCard, metaLine, type CardAction } from './ds';
import { PhotoCredit } from './PhotoCredit';

/** "Ford Fiesta ST Mk8": a build's name, as typed. */
export const buildName = (b: Pick<Build, 'make' | 'model'>) => `${b.make} ${b.model}`.trim();

/**
 * The one power line for a build (Redesign 2, 4.9 and K5): "197 bhp ✓ Dyno · 3 mods". One
 * number (bhp); "✓ Dyno" only when a sheet proves it. whp, bhp per tonne and claimed figures live
 * on the build's Power and dyno page only.
 */
export function powerLine(b: Build, now: Date, withMods = true): string {
  const proven = dynoBadge(b, now)?.state === 'proven';
  return metaLine([`${powerText(b)}${proven ? ' ✓ Dyno' : ''}`, withMods ? (modCount(b.mods) ? plural(modCount(b.mods), 'mod') : 'Stock') : null]);
}

/**
 * What a build shows as its picture on this phone: its photo; in the demo, a similar licensed sample
 * photo (labelled "similar" behind the ⓘ); else nothing, and it's drawn in its paint.
 */
export function useBuildPicture(build: Pick<Build, 'photos' | 'make' | 'model' | 'kind'>) {
  const { backend } = useStore();
  return buildPicture(build, backend === 'local');
}

/**
 * A build as a browse card (Garage's main build, Me): the photo at 4:3 (or `aspect`), or the build
 * drawn in its paint (never grey); the class badge and name on the photo; the power line under it;
 * one secondary.
 */
export function BuildCard({ build, now, onPress, action, aspect }: { build: Build; now: Date; onPress?: () => void; action?: CardAction | null; aspect?: number }) {
  const pic = useBuildPicture(build);
  const shape = build.kind === 'car' ? carShape(build) : undefined;
  return (
    <PhotoCard
      kind="build"
      aspect={aspect}
      photo={pic ? photoSource(pic.ref) : null}
      fallback={pic ? undefined : <PaintedArt paint={build.colour} vehicle={build.kind} shape={shape} />}
      paint={build.colour}
      vehicle={build.kind}
      shape={shape}
      title={buildName(build)}
      classLetter={classOf(build)}
      titleOnPhoto
      meta={powerLine(build, now)}
      detail={build.nickname || undefined}
      action={action}
      onPress={onPress}
      accessibilityHint="Opens the build"
      overlay={pic ? <PhotoCredit photoRef={pic.ref} kind={build.kind} similar={pic.similar} overlay corner="topRight" /> : null}
    />
  );
}

/** The four kinds of part (Redesign 2, 3.9): the Add a mod sheet's segments and the build page's mod groups. */
export type ModSection = 'engine' | 'suspension' | 'wheels' | 'looks';
export const MOD_SECTIONS: { key: ModSection; label: string }[] = [
  { key: 'engine', label: 'Engine' },
  { key: 'suspension', label: 'Suspension' },
  { key: 'wheels', label: 'Wheels' },
  { key: 'looks', label: 'Looks' },
];

/** Which section a quick-mod group (catalog.ts MOD_GROUPS) sits in. */
export function sectionOfGroup(group: ModGroup): ModSection {
  if (group === 'suspension' || group === 'brakes') return 'suspension';
  if (group === 'wheels') return 'wheels';
  if (group === 'body' || group === 'aero' || group === 'interior' || group === 'lighting' || group === 'audio' || group === 'controls') return 'looks';
  return 'engine';
}

/** Which section a saved mod's category sits in. */
export function sectionOfCategory(category: ModCategory): ModSection {
  if (category === 'suspension' || category === 'brakes') return 'suspension';
  if (category === 'wheels') return 'wheels';
  if (category === 'engine' || category === 'turbo' || category === 'intake' || category === 'exhaust') return 'engine';
  return 'looks';
}

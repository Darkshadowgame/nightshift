import { useLocalSearchParams } from 'expo-router';
import { Image, ScrollView, View } from 'react-native';
import { PaintedArt } from '../../components/BuildArt';
import { useBuildPicture } from '../../components/BuildBits';
import { NotFoundState } from '../../components/Detail';
import { ActionBar, ClassBadge, DsText, FitImage, PAGE_WITH_BAR } from '../../components/ds';
import { useShareLink } from '../../components/ShareLink';
import { carShape } from '../../lib/buildShape';
import { specCard, specText } from '../../lib/buildLog';
import { plural } from '../../lib/format';
import { photoSource } from '../../lib/photoSource';
import { buildSharePayload } from '../../lib/share';
import { useStore } from '../../lib/store';
import { ASPECT, COLOR, F, RADII, SPACING } from '../../theme';

const MARK = require('../../../assets/icon.png'); // eslint-disable-line @typescript-eslint/no-require-imports

/**
 * Spec card: the vehicle's key numbers on one clean Slipstream card, made to be shared outside the
 * app. No installed module can turn a view into a picture (view-shot would be a new native module),
 * so the card is laid out to be screenshotted as it stands, and Share sends the same words with the
 * build's link. It shows the make, model, power, class and key mods. Never a number plate: there is none
 * to show, and the photo is one that already went through the plate check.
 */
export default function SpecCardScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { builds } = useStore();
  const sharer = useShareLink('build');
  const b = builds.find((x) => x.id === id);
  const pic = useBuildPicture(b ?? { photos: [], make: '', model: '', kind: 'car' });
  if (!b) return <NotFoundState what="Build" message="This build no longer exists." />;
  const card = specCard(b);
  const photo = pic?.ref;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={[PAGE_WITH_BAR, { alignItems: 'center' }]} showsVerticalScrollIndicator={false}>
        <View
          accessible
          accessibilityLabel={`Spec card: ${specText(card)}`}
          style={{ width: '100%', maxWidth: 400, borderRadius: RADII.card, overflow: 'hidden', backgroundColor: COLOR.surface.card, borderWidth: 1, borderColor: COLOR.surface.border }}
        >
          <View style={{ aspectRatio: ASPECT.build, backgroundColor: COLOR.surface.media }}>
            {photo ? (
              <FitImage fit="cover" source={photoSource(photo)} frameAspect={ASPECT.build} style={{ width: '100%', height: '100%' }} accessibilityLabel={`${card.title}`} />
            ) : (
              <PaintedArt paint={b.colour} vehicle={b.kind} shape={b.kind === 'car' ? carShape(b) : undefined} />
            )}
            <View style={{ position: 'absolute', top: SPACING.md, left: SPACING.md }}>
              <ClassBadge letter={card.letter} size="lg" />
            </View>
          </View>
          <View style={{ padding: SPACING.lg, gap: SPACING.md }}>
            <View style={{ gap: SPACING.xxs }}>
              <DsText v="display" accessibilityRole="header">{card.title}</DsText>
              <DsText v="secondary">{card.sub}</DsText>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: SPACING.xs }}>
              <DsText v="display" style={{ fontSize: 44, lineHeight: 48 }}>{`${card.bhp}`}</DsText>
              <DsText v="bodyStrong" tone="secondary">{card.est ? 'bhp est.' : 'bhp'}</DsText>
            </View>
            <View style={{ height: 3, width: 48, backgroundColor: COLOR.action.primary }} />
            <View style={{ gap: SPACING.xs }}>
              <DsText v="eyebrow">Key mods</DsText>
              {card.keyMods.length ? card.keyMods.map((m) => <DsText key={m} v="body">{m}</DsText>) : <DsText v="body">Standard, as it left the factory</DsText>}
              {card.more ? <DsText v="caption">{`and ${plural(card.more, 'more mod')}`}</DsText> : null}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: COLOR.surface.border }}>
              <Image source={MARK} style={{ width: 24, height: 24, borderRadius: RADII.tag }} accessibilityIgnoresInvertColors aria-hidden />
              <DsText v="bodyStrong" style={{ fontFamily: F.displayItalic, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Slip<DsText v="bodyStrong" tone="brand" style={{ fontFamily: F.displayItalic, textTransform: 'uppercase', letterSpacing: 0.5 }}>stream</DsText>
              </DsText>
            </View>
          </View>
        </View>
        <DsText v="caption" style={{ textAlign: 'center', marginTop: SPACING.md }}>Take a screenshot of the card to share the picture.</DsText>
      </ScrollView>
      <ActionBar primary={{ label: 'Share', icon: 'share', onPress: () => sharer.share(buildSharePayload(b, specText(card))) }} />
      {sharer.sheet}
    </View>
  );
}

import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { ActionBar, DsText, ErrorState, PAGE_WITH_BAR, useToast } from '../components/ds';
import { SITE_URL } from '../lib/legal';
import { recapText, type Recap } from '../lib/passport';
import { shareLink } from '../lib/share';
import { useVisits } from '../lib/useVisits';
import { COLOR, RADII, SPACING } from '../theme';

/** One number on the card. */
function Figure({ value, label }: { value: number; label: string }) {
  return (
    <View style={{ width: '50%', paddingVertical: SPACING.sm, gap: SPACING.xxs }} accessible accessibilityLabel={`${value} ${label}`}>
      <DsText v="stat" style={{ fontVariant: ['tabular-nums'] }}>
        {value}
      </DsText>
      <DsText v="label">{label}</DsText>
    </View>
  );
}

/** The card people share: drawn here, in the brand's colours, with a tread ring as its one decoration. */
function RecapCard({ r }: { r: Recap }) {
  return (
    <View
      style={{
        borderRadius: RADII.card,
        padding: SPACING.lg,
        backgroundColor: COLOR.surface.card,
        borderWidth: 1,
        borderColor: COLOR.surface.border,
        overflow: 'hidden',
      }}
    >
      <View style={{ position: 'absolute', right: -36, top: -36 }} pointerEvents="none" aria-hidden>
        <Svg width={140} height={140} viewBox="0 0 140 140">
          <Circle cx={70} cy={70} r={56} fill="none" stroke={COLOR.action.primary} strokeWidth={14} strokeDasharray="8 6" opacity={0.9} />
        </Svg>
      </View>
      <DsText v="eyebrow">Slipstream</DsText>
      <DsText v="titleLg" accessibilityRole="header">{`${r.year} so far`}</DsText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: SPACING.md }}>
        <Figure value={r.meets} label={r.meets === 1 ? 'Meet' : 'Meets'} />
        <Figure value={r.drives} label={r.drives === 1 ? 'Drive' : 'Drives'} />
        <Figure value={r.photoSpots} label={r.photoSpots === 1 ? 'Photo spot' : 'Photo spots'} />
        <Figure value={r.regions} label={r.regions === 1 ? 'Region' : 'Regions'} />
        <Figure value={r.people} label={r.people === 1 ? 'Person met' : 'People met'} />
        {r.hosted > 0 ? <Figure value={r.hosted} label="Hosted" /> : null}
      </View>
    </View>
  );
}

/**
 * Season recap (level-up): your year so far from meets, drives and photo spots already on the
 * phone, as a card you can share. The share carries the figures as words and the site link. Never
 * personal places: only counts.
 */
export default function RecapScreen() {
  const { recap } = useVisits();
  const toast = useToast();
  const [error, setError] = useState<string | null>(null);

  async function share() {
    setError(null);
    const result = await shareLink({ title: `My ${recap.year} on Slipstream`, text: recapText(recap), url: SITE_URL });
    if (result === 'copied') toast({ message: 'Link copied' });
    else if (result === 'manual') setError("Couldn't open sharing. Take a screenshot of the card instead.");
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLOR.surface.bg }}>
      <ScrollView contentContainerStyle={PAGE_WITH_BAR} showsVerticalScrollIndicator={false}>
        <RecapCard r={recap} />
        <DsText v="secondary">Counted from the meets you checked in at, and the drives and photo spots you've done this year.</DsText>
        {error ? <ErrorState title={error} /> : null}
      </ScrollView>
      <ActionBar primary={{ label: 'Share', onPress: () => void share() }} />
    </View>
  );
}

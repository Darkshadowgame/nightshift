import { View } from 'react-native';
import { listingFacts, priceLabel, type Listing } from '../lib/forum';
import { COLOR, SPACING } from '../theme';
import { Button, Card, DsText, Tag } from './ds';

/** "Sold" for a sale, "Found" for a wanted listing. */
export function soldWord(l: Listing): string {
  return l.kind === 'wanted' ? 'Found' : 'Sold';
}

/**
 * The facts of a For sale and wanted listing at the top of its thread: for sale or wanted, the
 * price (or budget) big, condition and collection or postage, and Sold. The price is chalk, not
 * sodium (it isn't a button). A sold listing goes quiet: muted price, dashed border, a Sold tag.
 * The author gets "Mark as sold" (or "Back on sale").
 */
export function ListingCard({ listing, mine, busy, onSold }: { listing: Listing; mine: boolean; busy?: boolean; onSold?: (sold: boolean) => void }) {
  const sold = !!listing.soldAt;
  const facts = listingFacts(listing);
  return (
    <Card style={sold ? { borderStyle: 'dashed', backgroundColor: COLOR.surface.bg } : undefined}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
        <DsText v="eyebrow" tone="secondary">
          {listing.kind === 'wanted' ? 'Wanted' : 'For sale'}
        </DsText>
        <View style={{ flex: 1 }} />
        {sold ? <Tag label={soldWord(listing)} tone="success" /> : null}
      </View>
      <DsText v="titleLg" style={sold ? { color: COLOR.text.secondary, textDecorationLine: 'line-through' } : undefined} accessibilityLabel={`${priceLabel(listing)}${sold ? `, ${soldWord(listing).toLowerCase()}` : ''}`}>
        {priceLabel(listing)}
      </DsText>
      {facts.length ? <DsText v="meta">{facts.join(' · ')}</DsText> : null}
      <DsText v="caption">Posts only: no payments through Slipstream. Meet somewhere public and pay in person.</DsText>
      {mine && onSold ? (
        sold ? (
          <Button tier="tertiary" size="sm" label={listing.kind === 'wanted' ? 'Still looking' : 'Back on sale'} busy={busy} onPress={() => onSold(false)} style={{ alignSelf: 'flex-start' }} />
        ) : (
          <Button tier="secondary" label={listing.kind === 'wanted' ? 'Mark as found' : 'Mark as sold'} busy={busy} onPress={() => onSold(true)} block />
        )
      ) : null}
    </Card>
  );
}

import { useState } from 'react';
import { View } from 'react-native';
import { listingFacts, parsePrice, priceLabel, soldPriceProblem, type Listing } from '../lib/forum';
import { COLOR, SPACING } from '../theme';
import { Button, Card, DsText, Field, Tag, TextField } from './ds';

/** "Sold" for a sale, "Found" for a wanted listing. */
export function soldWord(l: Listing): string {
  return l.kind === 'wanted' ? 'Found' : 'Sold';
}

/**
 * The facts of a For sale and wanted listing at the top of its thread: for sale or wanted, the
 * price (or budget) big, condition and collection or postage, and Sold. The price is chalk, not
 * sodium (it isn't a button). A sold listing goes quiet: muted price, dashed border, a Sold tag.
 * The author gets "Mark as sold" (or "Back on sale"). For a sale, "Mark as sold" first asks what it
 * went for (optional, a price only: never who bought it), so others can see what parts sell for.
 * `fits` is "Fits your <model>" when the listing's group is in your garage.
 */
export function ListingCard({ listing, mine, busy, onSold, fits }: { listing: Listing; mine: boolean; busy?: boolean; onSold?: (sold: boolean, pricePence?: number | null) => void; fits?: string | null }) {
  const sold = !!listing.soldAt;
  const [asking, setAsking] = useState(false);
  const [typed, setTyped] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  function confirm() {
    const pence = parsePrice(typed);
    const bad = pence !== null && Number.isNaN(pence) ? 'Type the price as a number, like 45 or 45.50.' : soldPriceProblem(pence);
    if (bad) return setProblem(bad);
    setProblem(null);
    setAsking(false);
    onSold?.(true, pence);
  }
  const facts = listingFacts(listing);
  return (
    <Card style={sold ? { borderStyle: 'dashed', backgroundColor: COLOR.surface.bg } : undefined}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
        <DsText v="eyebrow" tone="secondary">
          {listing.kind === 'wanted' ? 'Wanted' : 'For sale'}
        </DsText>
        <View style={{ flex: 1 }} />
        {sold ? <Tag label={soldWord(listing)} tone="success" /> : fits ? <Tag label={fits} tone="info" /> : null}
      </View>
      <DsText v="titleLg" style={sold ? { color: COLOR.text.secondary, textDecorationLine: 'line-through' } : undefined} accessibilityLabel={`${priceLabel(listing)}${sold ? `, ${soldWord(listing).toLowerCase()}` : ''}`}>
        {priceLabel(listing)}
      </DsText>
      {sold && listing.soldPricePence != null ? <DsText v="meta">{`Sold for ${priceLabel({ kind: 'sale', pricePence: listing.soldPricePence })}`}</DsText> : null}
      {facts.length ? <DsText v="meta">{facts.join(' · ')}</DsText> : null}
      <DsText v="caption">Posts only: no payments through Slipstream. Meet somewhere public and pay in person.</DsText>
      {mine && onSold ? (
        sold ? (
          <Button tier="tertiary" size="sm" label={listing.kind === 'wanted' ? 'Still looking' : 'Back on sale'} busy={busy} onPress={() => onSold(false)} style={{ alignSelf: 'flex-start' }} />
        ) : asking ? (
          <View style={{ gap: SPACING.sm }}>
            <Field label="What did it go for? (optional)" hint="Shows others what parts sell for. Never who bought it." error={problem}>
              <TextField value={typed} onChangeText={setTyped} placeholder="e.g. 45" keyboardType="decimal-pad" accessibilityLabel="What it sold for, in pounds" returnKeyType="done" onSubmitEditing={confirm} />
            </Field>
            <Button tier="secondary" label="Mark as sold" busy={busy} onPress={confirm} block />
            <Button tier="tertiary" size="sm" label="Cancel" onPress={() => { setAsking(false); setProblem(null); }} style={{ alignSelf: 'flex-start' }} />
          </View>
        ) : (
          <Button tier="secondary" label={listing.kind === 'wanted' ? 'Mark as found' : 'Mark as sold'} busy={busy} onPress={() => (listing.kind === 'wanted' ? onSold(true) : setAsking(true))} block />
        )
      ) : null}
    </Card>
  );
}

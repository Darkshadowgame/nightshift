import { useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { Linking, ScrollView, View } from 'react-native';
import { NotFoundState } from '../../components/Detail';
import { ActionBar, Button, DsText, EmptyState, Hero, LoadingState, PAGE_WITH_BAR, Section } from '../../components/ds';
import { NightMap } from '../../components/NightMap';
import { useNavLaunch } from '../../components/NavLaunch';
import { SuggestMissing } from '../../components/SuggestMissing';
import { DEMO_PARTNERS, PARTNERS } from '../../data/partners';
import { formatOpeningHours, openState, parseOpeningHours } from '../../lib/openingHours';
import { demoPartners, partnerBadge, type Partner } from '../../lib/partners';
import { CATEGORY_LABELS, type ShopCategory } from '../../lib/shopCategories';
import { useShopIndex } from '../../lib/shopData';
import { isLegacyShopId } from '../../lib/shopCodec';
import { formatPhone, phoneLink, safeWebLink, SHOP_CAVEAT, websiteLabel } from '../../lib/shops';
import { useStore } from '../../lib/store';
import { useNow } from '../../lib/clock';
import type { LatLng } from '../../lib/types';
import { COLOR, PARTNER_COLOUR, SHOP_COLOUR, SPACING } from '../../theme';

/** What the screen shows: an OpenStreetMap listing or a partner. */
interface Listing {
  id: string;
  name: string;
  at: LatLng;
  categories: ShopCategory[];
  brand?: string;
  hours?: string;
  website?: string;
  phone?: string;
  partner?: Partner;
}

function open(url: string) {
  Linking.openURL(url).catch(() => {});
}

/**
 * A shop or partner (T3 detail; opened from a shop or partner pin on Tonight's Shops layer, off by default):
 * Hero with the map → hours → offer → ActionBar (Navigate, and Website or Call).
 */
export default function ShopScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { users, me } = useStore();
  const now = useNow();
  const home = users.find((u) => u.id === me)?.home;

  const isShop = !!id && !id.startsWith('partner:');
  const { index: shopIdx, failed } = useShopIndex(isShop);
  const listing = useMemo<Listing | null>(() => {
    if (!id) return null;
    if (id.startsWith('partner:')) {
      const p = [...PARTNERS, ...demoPartners(DEMO_PARTNERS, home)].find((x) => x.id === id.slice('partner:'.length));
      return p ? { id, name: p.name, at: p.at, categories: p.categories, hours: p.hours, website: p.link, phone: p.phone, partner: p } : null;
    }
    const s = shopIdx?.find(id);
    return s ? { ...s } : null;
  }, [id, home, shopIdx]);

  const at = listing?.at ?? { lat: 0, lng: 0 };
  const nav = useNavLaunch({ target: { kind: 'place', name: listing?.name ?? '', lat: at.lat, lng: at.lng }, to: at });

  // The header stays blank, like every detail screen: the eyebrow says Shop or Partner, once.
  if (!listing && isShop && !shopIdx && !failed) {
    return (
      <View style={{ flex: 1, padding: SPACING.screen, backgroundColor: COLOR.surface.bg }}>
        <LoadingState variant="inline" label="Loading the listing" />
      </View>
    );
  }

  if (!listing) {
    return (
      <NotFoundState
        what="Shop"
        message={
          failed
            ? "Couldn't load the shop listings just now. Try again in a moment."
            : isLegacyShopId(id ?? '')
              ? 'This link is from an older version of the app and no longer points at a shop.'
              : 'This shop is no longer on the map. The listings are refreshed from OpenStreetMap with app updates.'
        }
      />
    );
  }

  const p = listing.partner;
  const colour = p ? PARTNER_COLOUR : SHOP_COLOUR;
  const hours = parseOpeningHours(listing.hours);
  const state = hours ? openState(hours, now) : null;
  const web = safeWebLink(listing.website);

  const glyph = p ? 'partner' : (listing.categories[0] ?? 'shop');
  const website = web && !p?.demo ? web : null;
  const second = website
    ? { label: 'Website', onPress: () => open(website), accessibilityLabel: `Open the website, ${websiteLabel(website).split('/')[0]}` }
    : listing.phone
      ? { label: `Call ${formatPhone(listing.phone)}`, onPress: () => open(phoneLink(listing.phone!)) }
      : null;

  return (
    <View style={{ flex: 1, backgroundColor: COLOR.surface.bg }}>
    <ScrollView contentContainerStyle={PAGE_WITH_BAR}>
      <Hero
        bleed
        media={
          <NightMap
            labels={false}
            pins={[{ id: 'shop', at: listing.at, glyph, colour, title: listing.name, size: 34 }]}
            centre={listing.at}
            span={0.012}
            credit={p ? undefined : '© OpenStreetMap contributors'}
          />
        }
        eyebrow={p ? partnerBadge(p) : 'Shop'}
        layerColour={colour}
        glyph={glyph}
        tag={state ? { label: state.open ? 'Open' : 'Closed', tone: state.open ? 'success' : 'neutral' } : null}
        title={listing.name}
        meta={[listing.categories.map((c) => CATEGORY_LABELS[c]).join(' · '), state?.label, listing.brand]}
      >
        {p?.description ? <DsText v="secondary">{p.description}</DsText> : null}
        {website && listing.phone ? <Button label={`Call ${formatPhone(listing.phone)}`} tier="tertiary" size="sm" style={{ marginLeft: -SPACING.xs }} onPress={() => open(phoneLink(listing.phone!))} /> : null}
      </Hero>

      {p ? (
        <Section title={p.demo ? 'Sample partner offer' : 'Partner offer'}>
          {p.offer ? <DsText v="body">{p.offer}</DsText> : <EmptyState variant="inline" title="No offer listed right now." />}
          {p.link && safeWebLink(p.link) && !p.demo ? <Button label="See the offer" tier="tertiary" size="sm" onPress={() => open(p.link!)} /> : null}
          <DsText v="caption">
            {p.demo ? 'A made-up business to show how partners look. It isn’t real and neither is the offer.' : 'Partners pay Slipstream to be highlighted on the map. They are always marked Partner.'}
          </DsText>
        </Section>
      ) : null}

      <Section title="Opening hours">
        {hours ? (
          <View style={{ gap: SPACING.xs }}>
            {formatOpeningHours(hours).map((line) => (
              <View key={line.days} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: SPACING.md }}>
                <DsText v="meta" style={{ color: COLOR.text.primary }}>
                  {line.days}
                </DsText>
                <DsText v="meta" style={line.hours === 'Closed' ? undefined : { color: COLOR.text.primary }}>
                  {line.hours}
                </DsText>
              </View>
            ))}
            {hours.holidays ? null : <DsText v="caption">Bank holidays may differ.</DsText>}
          </View>
        ) : listing.hours ? (
          <>
            <DsText v="body" selectable>
              {listing.hours}
            </DsText>
            <DsText v="caption">Shown as listed: the app couldn’t read these hours, so it can’t say if it’s open now.</DsText>
          </>
        ) : (
          <EmptyState variant="inline" title="No opening hours listed. Check with them before you go." />
        )}
      </Section>

      <SuggestMissing
        screen="shop"
        label="Suggest an edit or a missing shop"
        placeholder="e.g. closed down, new hours, or a shop that’s missing"
        notesPlaceholder="Notes (optional): name, where it is, website"
        context={`${listing.name} · ${listing.id}`}
      />

      {p ? null : (
        <View style={{ gap: SPACING.xs }}>
          <DsText v="caption">{SHOP_CAVEAT} © OpenStreetMap contributors, ODbL.</DsText>
          <Button tier="tertiary" size="sm" style={{ marginLeft: -SPACING.xs }} label="Licence ›" onPress={() => open('https://www.openstreetmap.org/copyright')} />
        </View>
      )}
    </ScrollView>
    <ActionBar primary={{ label: nav.label, onPress: nav.open }} secondary={second} />
    {nav.sheet}
    </View>
  );
}

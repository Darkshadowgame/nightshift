import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useLayoutEffect, useMemo } from 'react';
import { Linking, Pressable, ScrollView, View } from 'react-native';
import { NightMap } from '../../components/NightMap';
import { NavLaunch } from '../../components/NavLaunch';
import { Pin } from '../../components/Pin';
import { SuggestMissing } from '../../components/SuggestMissing';
import { Button, Card, Row, Section, Txt } from '../../components/ui';
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
import { C, PARTNER_COLOUR, SHOP_COLOUR } from '../../theme';

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

/** A shop from the Shops layer: what it is, opening hours, website and phone, directions, and "suggest an edit". */
export default function ShopScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const nav = useNavigation();
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

  useLayoutEffect(() => {
    nav.setOptions({ title: listing?.partner ? 'PARTNER' : 'SHOP' });
  }, [nav, listing]);

  if (!listing && isShop && !shopIdx && !failed) {
    return (
      <View style={{ flex: 1, padding: 16 }}>
        <Txt v="muted">Loading the listing…</Txt>
      </View>
    );
  }

  if (!listing) {
    return (
      <View style={{ flex: 1, padding: 16 }}>
        <Txt>
          {failed
            ? "Couldn't load the shop listings just now. Try again in a moment."
            : isLegacyShopId(id ?? '')
              ? 'This link is from an older version of the app and no longer points at a shop. Find it on the map with the Shops layer.'
              : 'This shop is no longer on the map. The listings are refreshed from OpenStreetMap with app updates.'}
        </Txt>
      </View>
    );
  }

  const p = listing.partner;
  const colour = p ? PARTNER_COLOUR : SHOP_COLOUR;
  const hours = parseOpeningHours(listing.hours);
  const state = hours ? openState(hours, now) : null;
  const web = safeWebLink(listing.website);

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 18, paddingBottom: 48 }}>
      <View style={{ gap: 6 }}>
        <Row>
          {p ? (
            <View style={{ borderWidth: 1, borderColor: PARTNER_COLOUR, backgroundColor: `${PARTNER_COLOUR}22`, borderRadius: 4, paddingHorizontal: 7, paddingVertical: 2 }}>
              <Txt v="eyebrow" style={{ color: PARTNER_COLOUR, fontSize: 11 }}>★ {partnerBadge(p)}</Txt>
            </View>
          ) : (
            <Txt v="eyebrow" style={{ color: SHOP_COLOUR }}>Shop</Txt>
          )}
        </Row>
        <Txt v="h1">{listing.name}</Txt>
        <Row gap={10}>
          {listing.categories.map((c) => (
            <Row key={c} gap={4}>
              <Pin glyph={c} colour={colour} size={18} />
              <Txt v="mono" style={{ color: C.chalk }}>{CATEGORY_LABELS[c].toUpperCase()}</Txt>
            </Row>
          ))}
        </Row>
        {listing.brand ? <Txt v="muted">{listing.brand}</Txt> : null}
        {state ? (
          <Txt v="label" style={{ color: state.open ? C.lime : C.fog, fontSize: 13 }} accessibilityLiveRegion="polite">
            {state.label}
          </Txt>
        ) : null}
        {p?.description ? <Txt v="muted">{p.description}</Txt> : null}
      </View>

      {p ? (
        <Card accent={PARTNER_COLOUR}>
          <Txt v="label" style={{ color: PARTNER_COLOUR }}>{p.demo ? 'Sample partner offer' : 'Partner offer'}</Txt>
          {p.offer ? <Txt>{p.offer}</Txt> : <Txt v="muted">No offer listed right now.</Txt>}
          {p.link && safeWebLink(p.link) && !p.demo ? <Button label="See the offer" kind="ghost" onPress={() => open(p.link!)} /> : null}
          <Txt v="muted" style={{ fontSize: 12 }}>
            {p.demo
              ? 'A made-up business to show how partners look. It isn’t real and neither is the offer.'
              : 'Partners pay Nightshift to be highlighted on the map. They are always marked Partner.'}
          </Txt>
        </Card>
      ) : null}

      <View style={{ height: 200, borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: C.kerb }}>
        <NightMap
          pins={[{ id: 'shop', at: listing.at, glyph: p ? 'partner' : (listing.categories[0] ?? 'shop'), colour, title: listing.name, size: 34 }]}
          centre={listing.at}
          span={0.012}
          credit={p ? undefined : '© OpenStreetMap contributors'}
        />
      </View>

      <Section title="Get there">
        <NavLaunch target={{ kind: 'place', name: listing.name, lat: listing.at.lat, lng: listing.at.lng }} to={listing.at} />
        {web || listing.phone ? (
          <Row style={{ flexWrap: 'nowrap' }}>
            {web && !p?.demo ? (
              <View style={{ flex: 1 }}>
                <Button label="Website" kind="ghost" onPress={() => open(web)} accessibilityLabel={`Open the website, ${websiteLabel(web).split('/')[0]}`} />
              </View>
            ) : null}
            {listing.phone ? (
              <View style={{ flex: 1 }}>
                <Button label={`Call ${formatPhone(listing.phone)}`} kind="ghost" onPress={() => open(phoneLink(listing.phone!))} />
              </View>
            ) : null}
          </Row>
        ) : null}
      </Section>

      <Section title="Opening hours">
        <Card>
          {hours ? (
            formatOpeningHours(hours).map((line) => (
              <Row key={line.days} style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}>
                <Txt v="mono" style={{ color: C.chalk }}>{line.days.toUpperCase()}</Txt>
                <Txt v="mono" style={{ color: line.hours === 'Closed' ? C.fog : C.chalk }}>{line.hours.toUpperCase()}</Txt>
              </Row>
            ))
          ) : listing.hours ? (
            <>
              <Txt selectable>{listing.hours}</Txt>
              <Txt v="muted" style={{ fontSize: 12 }}>Shown as listed: the app couldn’t read these hours, so it can’t say if it’s open now.</Txt>
            </>
          ) : (
            <Txt v="muted">No opening hours listed. Check with them before you go.</Txt>
          )}
          {hours?.holidays ? null : hours ? <Txt v="muted" style={{ fontSize: 12 }}>Bank holidays may differ.</Txt> : null}
        </Card>
      </Section>

      <SuggestMissing
        screen="shop"
        label="Suggest an edit or a missing shop"
        placeholder="e.g. closed down, new hours, or a shop that’s missing"
        notesPlaceholder="Notes (optional): name, where it is, website"
        context={`${listing.name} · ${listing.id}`}
      />

      {p ? null : (
        <Pressable onPress={() => open('https://www.openstreetmap.org/copyright')} accessibilityRole="link" hitSlop={6}>
          <Txt v="muted" style={{ fontSize: 12 }}>
            {SHOP_CAVEAT} © OpenStreetMap contributors, ODbL. <Txt v="muted" style={{ fontSize: 12, color: C.neon }}>Licence ›</Txt>
          </Txt>
        </Pressable>
      )}
    </ScrollView>
  );
}

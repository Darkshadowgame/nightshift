import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { TabHref } from '../lib/backFallback';
import { useCommunity } from '../lib/communityStore';
import { COLOR, SPACING } from '../theme';
import { Text, View } from 'react-native';
import { Press, TAB_BAR_HEIGHT, typeStyle } from './ds';
import { Pin, type Glyph } from './Pin';

const TABS: { href: TabHref; label: string; glyph: Glyph }[] = [
  { href: '/', label: 'Tonight', glyph: 'map' },
  { href: '/community', label: 'Community', glyph: 'community' },
  { href: '/garage', label: 'Garage', glyph: 'car' },
  { href: '/me', label: 'Me', glyph: 'me' },
];

/**
 * The tab bar on a pushed person screen (a profile, a chat: Review 19 #35), so a tab is always one
 * tap away however deep you went (event › going list › profile › chat). It looks and reads like the
 * real tab bar ((tabs)/_layout.tsx): the same icons, labels and Community badge, the owning tab lit.
 * A tap closes the pushed screens and opens that tab. Pass it as an ActionBar's `footer`, or on its own.
 */
export function StackTabBar({ current = '/community' }: { current?: TabHref }) {
  const insets = useSafeAreaInsets();
  const { badge } = useCommunity();
  return (
    <View
      accessibilityRole="tablist"
      style={{ flexDirection: 'row', height: TAB_BAR_HEIGHT + insets.bottom, paddingBottom: insets.bottom, backgroundColor: COLOR.surface.bg, borderTopWidth: 1, borderTopColor: COLOR.surface.border }}
    >
      {TABS.map((t) => {
        const on = t.href === current;
        const colour = on ? COLOR.action.selected : COLOR.text.secondary;
        const count = t.href === '/community' && badge > 0 ? badge : 0;
        return (
          <Press
            key={t.href}
            role="tab"
            state={{ selected: on }}
            label={count ? `${t.label}, ${count} new` : t.label}
            feedback="none"
            onPress={() => {
              if (router.canDismiss()) router.dismissAll();
              router.navigate(t.href);
            }}
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.xxs }}
          >
            <View>
              <Pin glyph={t.glyph} colour={colour} size={26} />
              {count ? (
                <View style={{ position: 'absolute', top: -4, right: -12, minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 4, backgroundColor: COLOR.badge.bg, alignItems: 'center', justifyContent: 'center' }}>
                  <Text allowFontScaling={false} style={{ ...typeStyle('tag', COLOR.badge.fg), lineHeight: 14 }}>
                    {count > 99 ? '99+' : count}
                  </Text>
                </View>
              ) : null}
            </View>
            <Text allowFontScaling={false} style={{ ...typeStyle('tag'), lineHeight: 12, color: colour }}>
              {t.label}
            </Text>
          </Press>
        );
      })}
    </View>
  );
}

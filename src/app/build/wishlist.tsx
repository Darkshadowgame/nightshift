import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { AddModSheet } from '../../components/AddModSheet';
import { sectionOfCategory, MOD_SECTIONS } from '../../components/BuildBits';
import { NotFoundState, PAGE } from '../../components/Detail';
import { at, personMark } from '../../components/Community';
import { ActionBar, Button, DsText, EmptyState, ListRow, PAGE_WITH_BAR, RowDivider, Section, Sheet, useToast } from '../../components/ds';
import { appNow } from '../../lib/appClock';
import { logOf, whoFitted, type WishItem } from '../../lib/buildLog';
import { noteMod, unwish, useBuildLog, wish } from '../../lib/buildLogStore';
import { classOf } from '../../lib/classes';
import { isoDay, powerText } from '../../lib/dyno';
import { plural } from '../../lib/format';
import { newId, useStore } from '../../lib/store';
import { SPACING } from '../../theme';

/**
 * Wishlist: the parts you plan to fit, kept apart from the mods that are on (they never count in
 * the mods, the class or the power). Tap one for who has fitted it, as other people's builds
 * to look at. "Fitted it" moves it onto the build with today's date. Phone only, like the cost.
 */
export default function Wishlist() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { builds, users, me, saveBuild } = useStore();
  const { log } = useBuildLog();
  const toast = useToast();
  const [adding, setAdding] = useState(false);
  const [open, setOpen] = useState<WishItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const b = builds.find((x) => x.id === id);
  if (!b || b.ownerId !== me) return <NotFoundState what="Build" message="Only the owner can see this." />;
  const wishes = logOf(log, b.id).wishes;
  const fitted = open ? whoFitted(open.name, builds, me) : [];
  const label = (c: WishItem['category']) => MOD_SECTIONS.find((s) => s.key === sectionOfCategory(c))?.label ?? 'Other';

  async function fitIt(w: WishItem) {
    setError(null);
    try {
      const next = { ...b!, mods: [...b!.mods, { id: newId('m'), category: w.category, name: w.name }] };
      await saveBuild(next);
      noteMod(b!.id, w.name, { on: isoDay(appNow()) });
      unwish(b!.id, w.id);
      setOpen(null);
      toast({ message: `Fitted. Now ${powerText(next)}, Class ${classOf(next)}` });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't add it to the build.");
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={PAGE_WITH_BAR} showsVerticalScrollIndicator={false}>
        <View style={{ gap: SPACING.xs }}>
          <DsText v="title" accessibilityRole="header">{`${b.make} ${b.model}`}</DsText>
          <DsText v="secondary">{wishes.length ? `${plural(wishes.length, 'part')} planned. Not fitted yet.` : 'Parts you plan to fit'}</DsText>
        </View>
        <Section title="Planned">
          {wishes.length === 0 ? (
            <EmptyState variant="inline" title="Nothing planned. Add the parts you want next." />
          ) : (
            <View>
              {wishes.map((w, i) => (
                <View key={w.id}>
                  {i ? <RowDivider /> : null}
                  <ListRow title={w.name} subtitle={label(w.category)} onPress={() => { setError(null); setOpen(w); }} accessibilityLabel={`${w.name}, planned. Who has fitted it`} />
                </View>
              ))}
            </View>
          )}
        </Section>
      </ScrollView>
      <ActionBar primary={{ label: 'Add to wishlist', icon: 'plus', onPress: () => setAdding(true) }} />
      <AddModSheet
        visible={adding}
        build={b}
        title="Add to wishlist"
        onClose={() => setAdding(false)}
        onAdd={(m) => {
          wish(b.id, { id: m.id, name: m.name, category: m.category });
          toast({ message: 'Added to your wishlist' });
        }}
      />
      <Sheet visible={!!open} title={open?.name ?? ''} onClose={() => setOpen(null)}>
        <Section title="Who has fitted this">
          {fitted.length === 0 ? (
            <EmptyState variant="inline" title="Nobody on Slipstream has fitted this yet." />
          ) : (
            <View>
              {fitted.map((f, i) => {
                const owner = users.find((u) => u.id === f.ownerId);
                return (
                  <View key={f.id}>
                    {i ? <RowDivider /> : null}
                    <ListRow
                      leading={owner ? { avatar: personMark(owner) } : undefined}
                      title={owner ? at(owner) : 'A member'}
                      subtitle={`${f.make} ${f.model} · ${powerText(f)}`}
                      onPress={() => {
                        setOpen(null);
                        router.push({ pathname: '/build/[id]', params: { id: f.id } });
                      }}
                      accessibilityLabel={`${owner ? at(owner) : 'A member'}'s ${f.make} ${f.model}`}
                    />
                  </View>
                );
              })}
            </View>
          )}
        </Section>
        {error ? <DsText v="caption" tone="danger">{error}</DsText> : null}
        {open ? <Button label="I've fitted it" block haptic="success" onPress={() => fitIt(open)} /> : null}
        {open ? (
          <Button
            label="Remove from wishlist"
            tier="tertiary"
            block
            onPress={() => {
              unwish(b.id, open.id);
              setOpen(null);
              toast({ message: 'Removed from your wishlist', tone: 'info' });
            }}
          />
        ) : null}
      </Sheet>
    </View>
  );
}

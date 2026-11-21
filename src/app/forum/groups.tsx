import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { allVariants } from '../../data/vehicles';
import { DsText, EmptyState, ListRow, PAGE_WITH_BAR, RowDivider, SearchField, Section } from '../../components/ds';
import { browseGroups, findGroup, groupKindLabel, searchGroups, suggestedGroups, type ForumGroup } from '../../lib/forumGroups';
import { useStore } from '../../lib/store';
import { findVariant } from '../../lib/vehicles';
import { COLOR, SPACING } from '../../theme';

/**
 * Forum groups: a make or a model, like a Facebook group. Yours first, then ones to join from the
 * vehicles in your garage, then the makes people use most. Search finds any make or model in the
 * app's vehicle list. A row opens the group; joining is on the group's own page.
 */
function GroupRows({ groups, joined }: { groups: ForumGroup[]; joined: string[] }) {
  return (
    <View>
      {groups.map((g, i) => (
        <View key={g.key}>
          {i ? <RowDivider inset /> : null}
          <ListRow
            leading={{ avatar: { name: g.label } }}
            title={g.label}
            subtitle={groupKindLabel(g)}
            trailing={joined.includes(g.key) ? <DsText v="meta" tone="secondary">Joined</DsText> : undefined}
            onPress={() => router.push({ pathname: '/forum/group', params: { key: g.key } })}
            accessibilityLabel={`${g.label}, ${groupKindLabel(g)}${joined.includes(g.key) ? ', joined' : ''}`}
          />
        </View>
      ))}
    </View>
  );
}

export default function ForumGroups() {
  const { settings, builds, me } = useStore();
  const list = allVariants();
  const joined = settings.forumGroups ?? [];
  const [typed, setTyped] = useState('');
  const [query, setQuery] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setQuery(typed.trim()), 250);
    return () => clearTimeout(t);
  }, [typed]);

  const mine = useMemo(() => joined.map((k) => findGroup(list, k)).filter((g): g is ForumGroup => !!g), [joined, list]);
  const garage = useMemo(
    () =>
      suggestedGroups(
        list,
        builds.filter((b) => b.ownerId === me).map((b) => findVariant(list, b.vehicleId)).filter((v): v is NonNullable<typeof v> => !!v),
        joined,
      ),
    [builds, me, joined, list],
  );
  const popular = useMemo(() => browseGroups(list, [...joined, ...garage.map((g) => g.key)]), [list, joined, garage]);
  const found = query ? searchGroups(list, query) : null;

  return (
    <ScrollView contentContainerStyle={[PAGE_WITH_BAR, { gap: SPACING.lg }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} style={{ backgroundColor: COLOR.surface.bg }}>
      <SearchField value={typed} onChangeText={setTyped} placeholder="Search a make or model" loading={typed.trim() !== query && typed.trim() !== ''} />
      {found ? (
        found.length ? (
          <GroupRows groups={found} joined={joined} />
        ) : (
          <EmptyState variant="inline" title={`No make or model called "${query}".`} action={{ label: 'Clear search', onPress: () => setTyped('') }} />
        )
      ) : (
        <>
          {mine.length ? (
            <Section title="Your groups">
              <GroupRows groups={mine} joined={joined} />
            </Section>
          ) : null}
          {garage.length ? (
            <Section title="From your garage">
              <GroupRows groups={garage} joined={joined} />
            </Section>
          ) : null}
          <Section title="Makes">
            <GroupRows groups={popular} joined={joined} />
          </Section>
        </>
      )}
    </ScrollView>
  );
}

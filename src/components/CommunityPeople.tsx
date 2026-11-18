import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { SAMPLE_PEOPLE } from '../data/seed';
import { ANY_NEAR, isFiltered, makesNear, personCards, type NearFilter } from '../lib/carsNear';
import { classOf } from '../lib/classes';
import { useCommunity, useCommunityQuery } from '../lib/communityStore';
import { idsIn } from '../lib/connections';
import { plural } from '../lib/format';
import { useStore } from '../lib/store';
import { CLASS_LETTERS, type ClassLetter, type VehicleKind } from '../lib/types';
import { SPACING } from '../theme';
import { at, MEET_ACTION, openProfile, personMark, PersonNearRow } from './Community';
import { Button, Card, ChipGroup, DsText, EmptyState, ErrorState, ListRow, LoadingState, RowDivider, SegmentedControl, Sheet, SwitchRow, Tag, metaLine, selectionSummary } from './ds';
import { useRepFor } from './Rep';
import { levelLabel } from '../lib/rep';

const DISTANCES = [10, 25, 50, 100] as const;
type Distance = `${(typeof DISTANCES)[number]}`;
type View_ = 'near' | 'connections';

/**
 * Community › People: one Requests row (the only place requests are listed), then people near you
 * or your connections. Filters sit in a sheet and start empty (nothing on = everyone).
 * Rate builds is a quiet entry at the bottom.
 */
export function CommunityPeople() {
  const { users, builds, me } = useStore();
  const community = useCommunity();
  const repFor = useRepFor();
  const meUser = users.find((u) => u.id === me);
  const travel = meUser?.travelMiles ?? 25;
  const [view, setView] = useState<View_>('near');
  const [miles, setMiles] = useState<number>((DISTANCES as readonly number[]).includes(travel) ? travel : 25);
  const [kinds, setKinds] = useState<VehicleKind[]>([]);
  const [classes, setClasses] = useState<ClassLetter[]>([]);
  const [makes, setMakes] = useState<string[]>([]);
  const [filtering, setFiltering] = useState(false);
  const [switchError, setSwitchError] = useState<string | null>(null);
  const near = useCommunityQuery((s) => s.peopleNear(miles), [miles]);
  const list = near.data ?? [];
  const filter: NearFilter = { ...ANY_NEAR, kind: kinds.length === 1 ? kinds[0] : 'all', classes, makes };
  const cards = useMemo(() => personCards(list, users, builds, filter), [list, users, builds, kinds, classes, makes]); // eslint-disable-line react-hooks/exhaustive-deps
  const allMakes = useMemo(() => makesNear(list, builds), [list, builds]);
  const noHome = !meUser?.home || (meUser.home.lat === 0 && meUser.home.lng === 0);
  const incoming = community.incoming;
  const connected = idsIn(community.connections, 'connected').filter((id) => !community.blocked.has(id));
  const filtered = isFiltered(filter);
  const clear = () => {
    setKinds([]);
    setClasses([]);
    setMakes([]);
  };
  const summary = metaLine([
    selectionSummary(kinds.map((k) => (k === 'car' ? 'Cars' : 'Bikes')), 'Cars and bikes'),
    classes.length ? `class ${classes.join(', ')}` : null,
    makes.length ? selectionSummary(makes, '') : null,
  ]);

  return (
    <View style={{ gap: SPACING.lg }}>
      <View>
        <ListRow
          title={incoming.length ? 'Requests' : 'Connections'}
          subtitle={
            incoming.length
              ? `${plural(incoming.length, 'person wants', 'people want')} to connect`
              : metaLine([plural(connected.length, 'connection'), 'requests you sent', 'blocked people'])
          }
          trailing={incoming.length ? <Tag label={String(incoming.length)} tone="selected" /> : undefined}
          onPress={() => router.push('/connections')}
          accessibilityLabel={incoming.length ? `Requests: ${plural(incoming.length, 'person wants', 'people want')} to connect` : 'Connections, requests you sent and blocked people'}
        />
        <RowDivider />
      </View>

      <SegmentedControl<View_>
        value={view}
        onChange={setView}
        accessibilityLabel="Which people"
        options={[
          { key: 'near', label: 'Near you' },
          { key: 'connections', label: 'Connections', count: connected.length },
        ]}
      />

      {view === 'connections' ? (
        connected.length === 0 ? (
          <EmptyState glyph="community" title="No connections yet" body="Meet people at an event, open their profile and tap Connect. Once they accept, you can message each other." action={MEET_ACTION} />
        ) : (
          <View>
            {connected.map((id, i) => {
              const u = users.find((x) => x.id === id);
              const lead = builds.filter((b) => b.ownerId === id)[0];
              return (
                <View key={id}>
                  {i ? <RowDivider inset /> : null}
                  <ListRow
                    leading={{ avatar: personMark(u) }}
                    title={at(u)}
                    subtitle={u?.name}
                    meta={metaLine([levelLabel(repFor(id).level.level), lead ? `${lead.make} ${lead.model} · class ${classOf(lead)}` : null])}
                    onPress={() => openProfile(id)}
                  />
                </View>
              );
            })}
          </View>
        )
      ) : noHome ? (
        <EmptyState glyph="community" title="Set your home area first" body="People near you is worked out from your rough home area." action={{ label: 'Edit profile', onPress: () => router.push('/profile') }} />
      ) : (
        <View style={{ gap: SPACING.sm }}>
          {/* Opt-in (REVIEW-10 #6): off for new people; the switch lives here, where the list is. */}
          <Card>
            <SwitchRow
              label="Show me to drivers near me (rough distance only)"
              hint={
                community.showInNearby
                  ? 'Drivers near you see your builds and "Under 5 mi" or "About 12 mi". Never where you live.'
                  : "You're hidden. Turn this on to appear here for drivers near you, with a rough distance only."
              }
              value={community.showInNearby}
              onValueChange={(v) => {
                setSwitchError(null);
                community.run((s) => s.setShowInNearby(v)).catch((e: unknown) => setSwitchError(e instanceof Error ? e.message : String(e)));
              }}
            />
            {switchError ? <ErrorState title={`Couldn't change that. ${switchError}`} /> : null}
          </Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
            <DsText v="meta" style={{ flex: 1 }} numberOfLines={2}>
              {metaLine([near.data ? plural(cards.length, 'person', 'people') : null, `within ${miles} mi`, summary])}
            </DsText>
            <Button label={filtered ? 'Filters on' : 'Filter'} tier="secondary" size="sm" onPress={() => setFiltering(true)} accessibilityLabel={`Filter people. Now: within ${miles} miles, ${summary}`} />
          </View>
          {near.error ? <ErrorState title={`Couldn't load people near you. ${near.error}`} /> : null}
          {near.loading && !near.data ? (
            <LoadingState label="Looking for people near you" />
          ) : cards.length === 0 ? (
            <EmptyState
              glyph="community"
              title={filtered ? 'Nothing matches' : 'Nobody near you yet'}
              body={filtered ? 'Try fewer filters or a bigger distance.' : `Nobody within ${miles} mi has shared their builds yet. Try a bigger distance.`}
              action={filtered ? { label: 'Clear filters', onPress: clear } : { label: 'Change distance', onPress: () => setFiltering(true) }}
            />
          ) : (
            <View>
              {cards.map((c, i) => (
                <View key={c.user.id}>
                  {i ? <RowDivider inset /> : null}
                  <PersonNearRow card={c} level={repFor(c.user.id).level.level} state={community.stateOf(c.user.id)} sample={SAMPLE_PEOPLE.includes(c.user.id)} />
                </View>
              ))}
            </View>
          )}
          <DsText v="caption">Distances are rough, from home areas. Nobody sees where anyone lives.</DsText>
        </View>
      )}

      <View>
        <RowDivider />
        <ListRow title="Rate builds near you" subtitle="Like or pass, one build at a time" onPress={() => router.push('/rate')} />
      </View>

      <Sheet visible={filtering} title="Filter people" onClose={() => setFiltering(false)}>
        <View style={{ gap: SPACING.sm }}>
          <DsText v="label">Within</DsText>
          <SegmentedControl<Distance>
            value={String(miles) as Distance}
            onChange={(d) => setMiles(Number(d))}
            accessibilityLabel="Distance"
            options={DISTANCES.map((d) => ({ key: `${d}` as Distance, label: `${d} mi` }))}
          />
        </View>
        <ChipGroup<VehicleKind> label="Cars or bikes" allLabel="Cars and bikes" options={[{ key: 'car', label: 'Cars' }, { key: 'bike', label: 'Bikes' }]} selected={kinds} onChange={setKinds} />
        <ChipGroup<ClassLetter> label="Class" allLabel="Any class" options={CLASS_LETTERS.map((c) => ({ key: c, label: c }))} selected={classes} onChange={setClasses} />
        {allMakes.length > 1 ? <ChipGroup<string> label="Make" allLabel="Any make" raw options={allMakes.map((m) => ({ key: m, label: m }))} selected={makes} onChange={setMakes} /> : null}
      </Sheet>
    </View>
  );
}

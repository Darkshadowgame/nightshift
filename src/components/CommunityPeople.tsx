import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { ANY_NEAR, isFiltered, makesNear, personCards, type NearFilter } from '../lib/carsNear';
import { useCommunity, useCommunityQuery } from '../lib/communityStore';
import { idsIn } from '../lib/connections';
import { withoutBlocked } from '../lib/blocking';
import { plural } from '../lib/format';
import { modelKey, SAME_MODEL_MAX } from '../lib/sameModel';
import { useStore } from '../lib/store';
import { CLASS_LETTERS, type ClassLetter, type VehicleKind } from '../lib/types';
import { SPACING } from '../theme';
import { PersonNearRow } from './Community';
import { PeopleStrip } from './PeopleStrip';
import { useNow } from '../lib/clock';
import { atYourMeets } from '../lib/people';
import { Button, Card, ChipGroup, displayHandle, DsText, EmptyState, ErrorState, ListRow, LoadingState, RowDivider, Section, ChoiceGroup, Sheet, metaLine, selectionSummary } from './ds';

const DISTANCES = [10, 25, 50, 100] as const;
type Distance = `${(typeof DISTANCES)[number]}`;

/** "Not now" on the People near you question is kept on the phone: asked once, never nagged. */
const NOT_NOW_KEY = 'nightshift.peopleNear.notNow';
let notNow = false;

/**
 * Community › People (Redesign 2, 3.7): one row for requests (only when there are some), one row
 * for your connections, then People near you, which is opt-in: until you say yes there is one
 * question, "See car people near you?", because saying yes shows you to them too. People are rows
 * (avatar, @handle, build and class, rough distance); filters sit in a sheet behind Filter.
 */
export function CommunityPeople() {
  const { users, builds, me, events } = useStore();
  const now = useNow();
  const community = useCommunity();
  const meUser = users.find((u) => u.id === me);
  // Quiet introductions: same make and model, same region (the server or the demo decides; never a distance).
  const sameIds = useCommunityQuery((s) => s.sameModelNear(), []);
  const sameList = useMemo(() => {
    const mine = new Map(builds.filter((b) => b.ownerId === me).map((b) => [modelKey(b), b]));
    return withoutBlocked(sameIds.data ?? [], (id) => id, community.blocked)
      .map((id) => {
        const user = users.find((u) => u.id === id);
        const build = builds.find((b) => b.ownerId === id && mine.has(modelKey(b)));
        return user && build ? { user, build } : null;
      })
      .filter((x): x is { user: (typeof users)[number]; build: (typeof builds)[number] } => !!x)
      .slice(0, SAME_MODEL_MAX);
  }, [sameIds.data, users, builds, me, community.blocked]);
  const travel = meUser?.travelMiles ?? 25;
  const [miles, setMiles] = useState<number>((DISTANCES as readonly number[]).includes(travel) ? travel : 25);
  const [kinds, setKinds] = useState<VehicleKind[]>([]);
  const [classes, setClasses] = useState<ClassLetter[]>([]);
  const [makes, setMakes] = useState<string[]>([]);
  const [filtering, setFiltering] = useState(false);
  const [later, setLater] = useState(notNow);
  useEffect(() => {
    if (notNow) return;
    let live = true;
    AsyncStorage.getItem(NOT_NOW_KEY)
      .then((v) => {
        if (v !== '1' || !live) return;
        notNow = true;
        setLater(true);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);
  const [busy, setBusy] = useState(false);
  const [switchError, setSwitchError] = useState<string | null>(null);
  const optedIn = community.showInNearby;
  const near = useCommunityQuery((s) => (optedIn ? s.peopleNear(miles) : Promise.resolve([])), [miles, optedIn]);
  const list = near.data ?? [];
  const filter: NearFilter = { ...ANY_NEAR, kind: kinds.length === 1 ? kinds[0] : 'all', classes, makes };
  const cards = useMemo(() => personCards(list, users, builds, filter), [list, users, builds, kinds, classes, makes]); // eslint-disable-line react-hooks/exhaustive-deps
  const allMakes = useMemo(() => makesNear(list, builds), [list, builds]);
  const noHome = !meUser?.home || (meUser.home.lat === 0 && meUser.home.lng === 0);
  const incoming = community.incoming;
  const connected = idsIn(community.connections, 'connected').filter((id) => !community.blocked.has(id));
  const filtered = isFiltered(filter);
  // Who's going to the meets you're going to (Review 19 #54): faces to connect with, opted in or not.
  const meetPeople = useMemo(() => atYourMeets(me, events, users, now).filter((u) => !community.blocked.has(u.id)), [me, events, users, now, community.blocked]);
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

  const optIn = (on: boolean) => {
    setSwitchError(null);
    setBusy(true);
    community
      .run((s) => s.setShowInNearby(on))
      .catch((e: unknown) => setSwitchError(e instanceof Error ? e.message : String(e)))
      .finally(() => setBusy(false));
  };

  let nearBody;
  if (noHome) {
    nearBody = <EmptyState variant="inline" title="Set your home area to see people near you." action={{ label: 'Edit profile', onPress: () => router.push('/profile') }} />;
  } else if (!optedIn && later) {
    nearBody = <EmptyState variant="inline" title="Off. You're hidden from people near you too." action={{ label: 'Turn on', onPress: () => optIn(true) }} />;
  } else if (!optedIn) {
    nearBody = (
      <Card>
        <DsText v="bodyStrong">See car people near you?</DsText>
        <DsText v="secondary">You'll be shown to them too, as a rough distance. Never where you live.</DsText>
        <View style={{ flexDirection: 'row', gap: SPACING.sm, flexWrap: 'wrap' }}>
          <Button label="Show me" tier="secondary" size="sm" busy={busy} onPress={() => optIn(true)} />
          <Button
            label="Not now"
            tier="tertiary"
            size="sm"
            onPress={() => {
              notNow = true;
              setLater(true);
              AsyncStorage.setItem(NOT_NOW_KEY, '1').catch(() => {});
            }}
          />
        </View>
      </Card>
    );
  } else {
    nearBody = (
      <View style={{ gap: SPACING.sm }}>
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
            variant="inline"
            title={filtered ? 'Nobody matches those filters.' : `Nobody within ${miles} mi yet.`}
            action={filtered ? { label: 'Clear filters', onPress: clear } : { label: 'Change distance', onPress: () => setFiltering(true) }}
          />
        ) : (
          <View>
            {cards.map((c, i) => (
              <View key={c.user.id}>
                {i ? <RowDivider inset /> : null}
                <PersonNearRow card={c} state={community.stateOf(c.user.id)} />
              </View>
            ))}
          </View>
        )}
        <DsText v="caption">Distances are rough, between home areas, never exact. You can turn this off in Settings › Privacy.</DsText>
      </View>
    );
  }

  return (
    <View style={{ gap: SPACING.section }}>
      <View>
        {incoming.length ? (
          <>
            <ListRow
              leading={{ icon: 'bell' }}
              title={`${plural(incoming.length, 'person wants', 'people want')} to connect`}
              onPress={() => router.push('/connections')}
            />
            <RowDivider />
          </>
        ) : null}
        <ListRow
          leading={{ icon: 'check' }}
          title={`Your connections (${connected.length})`}
          subtitle={connected.length ? 'Message them, or see who you blocked' : 'Say hello at a meet, then connect from their profile'}
          onPress={() => router.push('/connections')}
        />
        <RowDivider />
      </View>

      {meetPeople.length ? (
        <Section title="At your meets">
          <PeopleStrip people={meetPeople} label="People going to your meets" />
        </Section>
      ) : null}

      {sameList.length ? (
        <Section title="Same model near you">
          <View>
            {sameList.map(({ user, build }, i) => (
              <View key={user.id}>
                {i ? <RowDivider inset /> : null}
                <ListRow
                  leading={{ avatar: { name: user.name, handle: user.handle } }}
                  title={displayHandle(user.handle)}
                  subtitle={metaLine([`${build.make} ${build.model}`, user.region])}
                  onPress={() => router.push({ pathname: '/user/[id]', params: { id: user.id } })}
                />
              </View>
            ))}
          </View>
          <DsText v="caption">Same region, same model. You can turn this off in Settings › Privacy.</DsText>
        </Section>
      ) : null}

      <Section title="People near you">
        {nearBody}
        {switchError ? <ErrorState title={`Couldn't change that. ${switchError}`} /> : null}
      </Section>

      <Sheet visible={filtering} title="Filter people" onClose={() => setFiltering(false)}>
        <ChoiceGroup<Distance> label="Within" value={String(miles) as Distance} onChange={(d) => setMiles(Number(d))} options={DISTANCES.map((d) => ({ key: `${d}` as Distance, label: `${d} mi` }))} />
        <ChipGroup<VehicleKind> label="Cars or bikes" allLabel="Cars and bikes" options={[{ key: 'car', label: 'Cars' }, { key: 'bike', label: 'Bikes' }]} selected={kinds} onChange={setKinds} />
        <ChipGroup<ClassLetter> label="Class" allLabel="Any class" options={CLASS_LETTERS.map((c) => ({ key: c, label: c }))} selected={classes} onChange={setClasses} />
        {allMakes.length > 1 ? <ChipGroup<string> label="Make" allLabel="Any make" raw options={allMakes.map((m) => ({ key: m, label: m }))} selected={makes} onChange={setMakes} /> : null}
      </Sheet>
    </View>
  );
}

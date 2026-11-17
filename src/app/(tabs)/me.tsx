import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Switch, View } from 'react-native';
import { Button, Card, Row, Section, Txt } from '../../components/ui';
import { allAwards, awardRep, hasLegend } from '../../lib/awards';
import { useStore, type Settings } from '../../lib/store';
import { C } from '../../theme';

export default function Me() {
  const { users, me, crews, settings, setSettings, resetDemo, builds, events, votes, now } = useStore();
  const awards = allAwards(votes, events, builds, now);
  const myAwards = awards.filter((a) => a.ownerId === me);
  const [confirmReset, setConfirmReset] = useState(false);
  const user = users.find((u) => u.id === me);
  const crew = crews.find((c) => c.id === user?.crewId);
  const hosting = events.filter((e) => e.hostIds.includes(me) || (e.crewId && crew?.id === e.crewId)).length;

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 20, paddingBottom: 40 }}>
      <Card>
        <Row>
          <Txt v="h2">@{user?.handle}</Txt>
          {hasLegend(awards, me, now) ? <Txt v="eyebrow" style={{ color: C.lime }}>Legend this week</Txt> : null}
        </Row>
        <Txt>{user?.name}</Txt>
        <Txt v="muted">{user?.region}{crew ? ` · Crew: ${crew.name}` : ''}</Txt>
        <Row gap={16}>
          <Txt v="mono">{builds.filter((b) => b.ownerId === me).length} BUILDS</Txt>
          <Txt v="mono">{hosting} EVENTS HOSTED</Txt>
          <Txt v="mono">{myAwards.length} TROPHIES</Txt>
          <Txt v="mono" style={{ color: C.sodium }}>{awardRep(awards, me)} REP FROM AWARDS</Txt>
        </Row>
        <Row style={{ flexWrap: 'nowrap' }}>
          <Button label="Edit profile" kind="ghost" style={{ flex: 1 }} onPress={() => router.push('/profile')} />
          <Button label="Public view" kind="ghost" style={{ flex: 1 }} onPress={() => router.push({ pathname: '/user/[id]', params: { id: me } })} />
        </Row>
      </Card>

      <Section title="Privacy">
        <Toggle
          label="Cruise mode"
          hint="Show your build as part of a fuzzy group on the live map. Arrives in Phase 2."
          value={settings.cruiseMode}
          onChange={(v) => setSettings({ cruiseMode: v })}
          later
        />
        <Toggle
          label="Hide my home area"
          hint="Never show you on the map within a mile of home."
          value={settings.hideHomeZone}
          onChange={(v) => setSettings({ hideHomeZone: v })}
          later
        />
        <Toggle
          label="Walkie-talkie with strangers"
          hint="Let people you don't know talk to you within 500 m. Arrives with drive mode in Phase 4."
          value={settings.pttStrangers}
          onChange={(v) => setSettings({ pttStrangers: v })}
          later
        />
      </Section>

      <Section title="Demo">
        <Toggle
          label="Skip the GPS check at check-in"
          hint="On the demo build you aren't really at the meet, so this lets you try check-ins and rolling meets from the sofa."
          value={settings.simulateGps}
          onChange={(v) => setSettings({ simulateGps: v })}
        />
        <Card>
          <Txt v="muted">
            Everything is stored on this phone for now and the other people are sample data. Sharing between phones arrives when the app gets its backend. Resetting also clears your profile.
          </Txt>
          {confirmReset ? (
            <Row style={{ flexWrap: 'nowrap' }}>
              <Button label="Reset everything" kind="danger" style={{ flex: 1 }} onPress={() => { resetDemo(); setConfirmReset(false); }} />
              <Button label="Keep" kind="ghost" onPress={() => setConfirmReset(false)} />
            </Row>
          ) : (
            <Button label="Reset demo data" kind="ghost" onPress={() => setConfirmReset(true)} />
          )}
        </Card>
      </Section>
    </ScrollView>
  );
}

function Toggle({ label, hint, value, onChange, later }: { label: string; hint: string; value: boolean; onChange: (v: boolean) => void; later?: boolean }) {
  return (
    <Row style={{ flexWrap: 'nowrap', justifyContent: 'space-between' }} gap={12}>
      <View style={{ flex: 1 }}>
        <Txt>{label}</Txt>
        <Txt v="muted">{hint}</Txt>
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: later ? C.kerbHi : C.sodium, false: C.kerb }} />
    </Row>
  );
}

export type { Settings };

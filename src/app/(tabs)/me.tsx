import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Switch, View } from 'react-native';
import { Pin } from '../../components/Pin';
import { LevelTag, RepPanel, useRep } from '../../components/Rep';
import { Button, Card, Row, Section, Txt } from '../../components/ui';
import { allAwards, hasLegend } from '../../lib/awards';
import { askPermission, notificationsSupported, permissionGranted, testReminder } from '../../lib/notify';
import { SPOT_LABELS } from '../../lib/spots';
import { useStore, type Settings } from '../../lib/store';
import { C, SPOT_COLOURS } from '../../theme';

export default function Me() {
  const { users, me, crews, settings, setSettings, resetDemo, builds, events, votes, now, spots } = useStore();
  const rep = useRep(me);
  const awards = allAwards(votes, events, builds, now);
  const myAwards = awards.filter((a) => a.ownerId === me);
  const [confirmReset, setConfirmReset] = useState(false);
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [testNote, setTestNote] = useState<string | null>(null);
  useEffect(() => {
    permissionGranted().then(setAllowed);
  }, []);
  const user = users.find((u) => u.id === me);
  const crew = crews.find((c) => c.id === user?.crewId);
  const mySpots = spots.filter((x) => x.authorId === me);
  const hosting = events.filter((e) => e.hostIds.includes(me) || (e.crewId && crew?.id === e.crewId)).length;

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 20, paddingBottom: 40 }}>
      <Card>
        <Row>
          <Txt v="h2">@{user?.handle}</Txt>
          <LevelTag level={rep.level.level} />
          {hasLegend(awards, me, now) ? <Txt v="eyebrow" style={{ color: C.lime }}>Legend this week</Txt> : null}
        </Row>
        <Txt>{user?.name}</Txt>
        <Txt v="muted">{user?.region}{crew ? ` · Crew: ${crew.name}` : ''}</Txt>
        <Row gap={16}>
          <Txt v="mono">{builds.filter((b) => b.ownerId === me).length} BUILDS</Txt>
          <Txt v="mono">{hosting} EVENTS HOSTED</Txt>
          <Txt v="mono">{myAwards.length} TROPHIES</Txt>
        </Row>
        <Row style={{ flexWrap: 'nowrap' }}>
          <Button label="Edit profile" kind="ghost" style={{ flex: 1 }} onPress={() => router.push('/profile')} />
          <Button label="Public view" kind="ghost" style={{ flex: 1 }} onPress={() => router.push({ pathname: '/user/[id]', params: { id: me } })} />
        </Row>
      </Card>

      <RepPanel ledger={rep.ledger} level={rep.level} title="Your rep" />

      <Section title="Crew" right={<Pressable onPress={() => router.push('/crews')} hitSlop={8} accessibilityRole="link"><Txt v="label" style={{ color: C.sodium }}>All crews ›</Txt></Pressable>}>
        {crew ? (
          <Pressable
            onPress={() => router.push({ pathname: '/crew/[id]', params: { id: crew.id } })}
            accessibilityRole="button"
            accessibilityLabel={`Open ${crew.name}`}
            style={({ pressed }) => [pressed && { opacity: 0.8 }]}
          >
            <Card accent={C.neon}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Row>
                  <Txt v="h3">{crew.name}</Txt>
                  <Txt v="mono" style={{ color: C.neon }}>[{crew.tag}]</Txt>
                </Row>
                <Txt v="label" style={{ color: C.sodium }}>Open ›</Txt>
              </Row>
              <Txt v="muted">{crew.memberIds.length} members</Txt>
            </Card>
          </Pressable>
        ) : (
          <Card>
            <Txt v="muted">You're not in a crew. Crews host events together.</Txt>
            <Row style={{ flexWrap: 'nowrap' }}>
              <Button label="Find a crew" kind="ghost" style={{ flex: 1 }} onPress={() => router.push('/crews')} />
              <Button label="Start one" style={{ flex: 1 }} onPress={() => router.push('/crew/new')} />
            </Row>
          </Card>
        )}
      </Section>

      <Section title="Your places">
        <Card>
          {mySpots.length === 0 ? (
            <Txt v="muted">Suggest a great road to drive or a photo spot. You earn rep when it's approved and each time someone else uses it.</Txt>
          ) : null}
          {mySpots.map((x) => (
            <Pressable
              key={x.id}
              onPress={() => router.push({ pathname: '/spot/[id]', params: { id: x.id } })}
              accessibilityRole="button"
              style={({ pressed }) => [pressed && { opacity: 0.7 }]}
            >
              <Row style={{ flexWrap: 'nowrap' }} gap={10}>
                <Pin glyph={x.kind} colour={x.status === 'pending' ? C.fog : SPOT_COLOURS[x.kind]} size={28} />
                <View style={{ flex: 1 }}>
                  <Txt numberOfLines={1}>{x.name}</Txt>
                  <Txt v="mono">{SPOT_LABELS[x.kind].toUpperCase()} · {x.status === 'pending' ? 'WAITING FOR APPROVAL' : 'LIVE'}</Txt>
                </View>
                <Txt v="label" style={{ color: C.sodium }}>›</Txt>
              </Row>
            </Pressable>
          ))}
          <Row style={{ flexWrap: 'nowrap' }}>
            <Button label="Suggest a drive" kind="ghost" style={{ flex: 1 }} onPress={() => router.push({ pathname: '/spot/new', params: { kind: 'drive' } })} />
            <Button label="Photo spot" kind="ghost" style={{ flex: 1 }} onPress={() => router.push({ pathname: '/spot/new', params: { kind: 'photo' } })} />
          </Row>
        </Card>
      </Section>

      <Section title="Reminders">
        <Toggle
          label="Event reminders"
          hint="When an event's location unlocks and 30 minutes before the start, for events you're going to or hosting. Also when a rolling meet you're checked in at moves on."
          value={settings.reminders}
          onChange={(v) => {
            setSettings({ reminders: v });
            if (v) askPermission().then(setAllowed);
          }}
        />
        {!notificationsSupported ? (
          <Txt v="muted" style={{ fontSize: 12 }}>Notifications only work in the iPhone app. The list under the bell works everywhere.</Txt>
        ) : allowed === false && settings.reminders ? (
          <Card accent={C.alert}>
            <Txt v="muted">Notifications are off for Nightshift. Allow them in the iPhone Settings app › Nightshift › Notifications, or tap below.</Txt>
            <Button label="Allow notifications" kind="ghost" onPress={() => askPermission().then(setAllowed)} />
          </Card>
        ) : null}
        {notificationsSupported ? (
          <Button
            label="Send a test reminder"
            kind="ghost"
            onPress={async () => {
              const ok = await testReminder(5);
              setAllowed(ok);
              setTestNote(ok ? 'Coming in 5 seconds. Lock the phone to see it on the lock screen.' : 'Notifications are not allowed yet.');
            }}
          />
        ) : null}
        {testNote ? <Txt v="muted" style={{ fontSize: 12 }}>{testNote}</Txt> : null}
      </Section>

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
          label="Simulate GPS"
          hint="On the demo build you aren't really there, so this skips the distance check at check-ins and photo spots, and lets you simulate drives from the sofa."
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
      <Switch value={value} onValueChange={onChange} accessibilityLabel={label} trackColor={{ true: later ? C.kerbHi : C.sodium, false: C.kerb }} />
    </Row>
  );
}

export type { Settings };

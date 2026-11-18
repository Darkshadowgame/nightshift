import { router } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { LEGAL_ROWS, openLegal } from '../components/AboutSection';
import { AppUpdates, updateDetails, versionLine } from '../components/AppUpdates';
import { NavIconChoices } from '../components/DriveHud';
import { Button, ChoiceGroup, ConfirmSheet, DsText, ErrorState, ListRow, RowDivider, Section, SwitchRow, useToast } from '../components/ds';
import { TravelPrefs } from '../components/TravelPrefs';
import { VoicePicker } from '../components/VoicePicker';
import { useAuth } from '../lib/auth';
import { useCommunity, useCommunityQuery } from '../lib/communityStore';
import { DIRECTIONS_APPS } from '../lib/directions';
import { travelOf } from '../lib/discover';
import { SCREEN_TITLES } from '../lib/glossary';
import { clearLaps } from '../lib/lapStore';
import { LEGAL_PAGES } from '../lib/legal';
import { layerOn, setLayer, type Layer } from '../lib/mapLayers';
import { askPermission, notificationsSupported, permissionGranted, testReminder } from '../lib/notify';
import { useStore } from '../lib/store';
import { COLOR, SPACING } from '../theme';

/** The layers that start off (they're for driving, not for finding a meet). The rest are under Layers on Tonight's map. */
const EXTRA_LAYERS: { key: Layer; label: string; hint: string }[] = [
  { key: 'cameras', label: 'Speed cameras', hint: 'Fixed and average-speed cameras, once you zoom in. May be incomplete.' },
  { key: 'shops', label: 'Shops', hint: 'Car and bike businesses from OpenStreetMap, and partners (always marked).' },
  { key: 'roads', label: 'Road reports', hint: "Drivers' reports and road closures." },
];

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Section title={title} gap="sm">
      {children}
    </Section>
  );
}

/**
 * Settings: one screen of groups (docs/SPEC.md). Account, Navigation and voice,
 * Map layers, Notifications, Privacy, Feedback, About and legal; in the demo,
 * Demo. Developer switches (reset, test reminder, versions) stay hidden unless
 * this is a development build or the version line is long-pressed.
 */
export default function SettingsScreen() {
  const auth = useAuth();
  const store = useStore();
  const { users, me, settings, setSettings, resetDemo, restartDemoEvents, refreshReminders, setTravelPrefs, backend } = store;
  const community = useCommunity();
  const status = useCommunityQuery((s) => s.moderationStatus(), []);
  const toast = useToast();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [error, setError] = useState<{ at: string; text: string } | null>(null);
  const [confirm, setConfirm] = useState<null | 'reset' | 'delete'>(null);
  const [busy, setBusy] = useState<null | 'out' | 'delete'>(null);
  const [developer, setDeveloper] = useState(__DEV__);
  useEffect(() => {
    permissionGranted().then(setAllowed);
  }, []);
  const user = users.find((u) => u.id === me);
  const travel = travelOf(user);
  const demo = backend === 'local';
  const allow = () =>
    askPermission().then((ok) => {
      setAllowed(ok);
      if (ok) refreshReminders();
    });
  const failed = (at: string) => (e: unknown) => setError({ at, text: e instanceof Error ? e.message : "Couldn't save that." });

  async function account(kind: 'out' | 'delete') {
    setError(null);
    setBusy(kind);
    try {
      if (kind === 'out') await auth.signOut();
      else await store.deleteAccount();
    } catch (e) {
      failed('account')(e);
      setBusy(null);
      setConfirm(null);
    }
  }

  return (
    <ScrollView contentContainerStyle={st.page}>
      <Group title="Account">
        {demo ? (
          <>
            <DsText v="body">You're trying the demo.</DsText>
            <DsText v="secondary">Sign in with your email to meet real people: going, check-ins, chat and votes are then shared. The demo stays here for later.</DsText>
            <Button label="Sign in or create an account" block onPress={() => auth.leaveDemo()} />
          </>
        ) : (
          <>
            <DsText v="body">Signed in{auth.email ? ` as ${auth.email}` : ''}</DsText>
            <DsText v="secondary">
              {store.online
                ? store.pendingWrites > 0
                  ? `Sending ${store.pendingWrites} change${store.pendingWrites === 1 ? '' : 's'} made offline…`
                  : 'Your profile, garage, events and chat are on Nightshift’s server, so other people see them.'
                : `Offline: showing what this phone last saw.${store.pendingWrites > 0 ? ` ${store.pendingWrites} change${store.pendingWrites === 1 ? '' : 's'} will be sent when you're back online.` : ''}`}
            </DsText>
            <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
              <Button label="Sign out" tier="secondary" busy={busy === 'out'} onPress={() => account('out')} style={{ flex: 1 }} block />
              <Button label="Delete account" tier="destructive" onPress={() => setConfirm('delete')} style={{ flex: 1 }} block />
            </View>
          </>
        )}
        <ListRow title="Your profile" subtitle="Handle, name and home area" onPress={() => router.push('/profile')} />
        {error?.at === 'account' ? <ErrorState title={error.text} /> : null}
      </Group>

      <Group title="Navigation and voice">
        <ChoiceGroup
          label="Navigate opens"
          value={settings.directionsApp ?? 'nightshift'}
          onChange={(id) => setSettings({ directionsApp: id })}
          options={DIRECTIONS_APPS.map((a) => ({ key: a.id, label: a.label }))}
        />
        <DsText v="caption">Nightshift guides you turn by turn, with a voice and camera alerts. The others open that app.</DsText>
        <ChoiceGroup
          label="The driving map"
          value={settings.navMap === 'north' ? 'north' : 'heading'}
          onChange={(k) => setSettings({ navMap: k })}
          options={[
            { key: 'heading', label: 'Turns with you' },
            { key: 'north', label: 'North up' },
          ]}
        />
        <DsText v="label">Your icon on the map</DsText>
        <NavIconChoices value={settings.navIcon} onChange={(v) => setSettings({ navIcon: v })} />
        <SwitchRow label="Spoken directions" hint="A British voice reads each turn and turns music down while it speaks." value={settings.navVoice !== false} onValueChange={(v) => setSettings({ navVoice: v })} />
        {settings.navVoice !== false ? <VoicePicker /> : null}
        <SwitchRow
          label="Speed camera alerts"
          hint="Says when a camera or average-speed zone is about half a mile ahead, with its limit. Speed limits only, never police."
          value={settings.navCameraAlerts !== false}
          onValueChange={(v) => setSettings({ navCameraAlerts: v })}
        />
      </Group>

      <Group title="Map layers">
        {EXTRA_LAYERS.map((l) => (
          <SwitchRow key={l.key} label={l.label} hint={l.hint} value={layerOn(settings, l.key)} onValueChange={(v) => setSettings(setLayer(settings, l.key, v))} />
        ))}
        <DsText v="caption">These start off. Events, drives, photo spots, tracks and meet spots are under Layers on the Tonight map.</DsText>
      </Group>

      <Group title="Notifications">
        <SwitchRow
          label="Event reminders"
          hint="When the stop unlocks and 30 minutes before the start, for events you're going to or hosting."
          value={settings.reminders}
          onValueChange={(v) => {
            setSettings({ reminders: v });
            if (v) allow();
          }}
        />
        <TravelPrefs
          miles={travel.miles}
          alerts={travel.alerts}
          onChange={(next) => {
            setError(null);
            setTravelPrefs(next).catch(failed('travel'));
            if (next.alerts === 'notify') askPermission().then(setAllowed);
          }}
        />
        {error?.at === 'travel' ? <ErrorState title={error.text} /> : null}
        {!notificationsSupported ? (
          <DsText v="caption">Notifications only work in the iPhone app. The list under the bell works everywhere.</DsText>
        ) : allowed === false && (settings.reminders || travel.alerts === 'notify') ? (
          <View style={{ gap: SPACING.sm }}>
            <DsText v="caption" tone="warning">Notifications are off for Nightshift, so these land under the bell only.</DsText>
            <Button label="Allow notifications" tier="secondary" size="sm" onPress={allow} />
          </View>
        ) : null}
      </Group>

      <Group title="Privacy">
        <DsText v="secondary">
          Nobody is ever shown on the map. Other people see your builds, trophies, crew and level, never a location. Your home area is saved to about 1 km
          and only used to find events near you.
        </DsText>
        <SwitchRow
          label="Show me in People near you"
          hint="People near you see your builds and a rough distance, never where you live."
          value={community.showInNearby}
          onValueChange={(v) => {
            setError(null);
            community.run((s) => s.setShowInNearby(v)).catch(failed('community'));
          }}
        />
        {error?.at === 'community' ? <ErrorState title={error.text} /> : null}
        <ListRow title="Connections and blocked people" subtitle="Only people you're connected with can message you" onPress={() => router.push('/connections')} />
        {status.data?.suspended ? (
          <DsText v="caption" tone="warning">
            {status.data.message ?? 'Your account is suspended: you can read and report, not post or message.'}
          </DsText>
        ) : null}
        {status.data?.isStaff ? <ListRow title="Moderation" subtitle="Reports from everyone, for the Nightshift team only" onPress={() => router.push('/moderation')} /> : null}
        {status.data?.isStaff ? <ListRow title="Moderation team" subtitle="Staff, their roles and how much each does" onPress={() => router.push('/moderation-team')} /> : null}
        {status.data?.role === 'admin' || status.data?.role === 'owner' ? (
          <ListRow title="Audit log" subtitle="Every moderation action, by whom" onPress={() => router.push('/moderation-log')} />
        ) : null}
      </Group>

      <Group title="Feedback">
        <DsText v="secondary">Found a bug, got an idea, or is a place or event wrong? It goes straight to the Nightshift team, and you can see what happens to it.</DsText>
        <Button label={SCREEN_TITLES.feedback} tier="secondary" block onPress={() => router.push({ pathname: '/feedback', params: { from: '/settings' } })} />
      </Group>

      <Group title="About and legal">
        <ListRow title={SCREEN_TITLES.help} subtitle="Stops, check-in, classes, trophies and rep" onPress={() => router.push('/help')} />
        <RowDivider />
        {LEGAL_ROWS.map((r) => (
          <View key={r.key}>
            <ListRow title={LEGAL_PAGES[r.key].label} subtitle={r.subtitle} onPress={() => openLegal(r.key)} accessibilityHint="Opens in Safari" />
            <RowDivider />
          </View>
        ))}
        <ListRow title="Open data and credits" subtitle="OpenStreetMap, Wikimedia Commons, TfL and more" onPress={() => router.push('/credits')} />
        <DsText v="caption">Nightshift is 18+. No ads, no tracking and we never sell your data.</DsText>
        {/* A long press on the version shows the developer switches. */}
        <Pressable
          onLongPress={() => {
            setDeveloper(true);
            toast({ message: 'Developer settings are at the bottom', tone: 'info' });
          }}
          delayLongPress={800}
          accessibilityRole="text"
          accessibilityHint="Long press for developer settings"
          style={{ minHeight: 44, justifyContent: 'center' }}
        >
          <DsText v="meta">{versionLine()}</DsText>
        </Pressable>
        <AppUpdates />
      </Group>

      {demo ? (
        <Group title="Demo">
          <SwitchRow
            label="Skip the GPS check"
            hint="Try check-ins, photo spots and drives without being there. Off, you have to be there, as in the real app."
            value={!!settings.simulateGps}
            onValueChange={(v) => setSettings({ simulateGps: v })}
          />
          <ListRow
            title="Restart the demo events"
            subtitle="Lays the sample events out again round your home area. Your profile, garage and what you made stay."
            onPress={() => {
              restartDemoEvents();
              toast({ message: 'Demo events restarted' });
            }}
          />
        </Group>
      ) : null}

      {developer ? (
        <Group title="Developer">
          {updateDetails().map((line) => (
            <DsText key={line} v="meta" selectable>
              {line}
            </DsText>
          ))}
          {notificationsSupported ? (
            <Button
              label="Send a test reminder"
              tier="secondary"
              size="sm"
              onPress={async () => {
                const ok = await testReminder(5);
                setAllowed(ok);
                if (ok) refreshReminders();
                toast(ok ? { message: 'Coming in 5 seconds. Lock the phone to see it.' } : { message: 'Notifications are not allowed yet.', tone: 'danger' });
              }}
            />
          ) : null}
          {demo ? <Button label="Reset demo data" tier="destructive" size="sm" onPress={() => setConfirm('reset')} /> : null}
        </Group>
      ) : null}

      <ConfirmSheet
        visible={confirm === 'reset'}
        title="Reset the demo"
        message="This clears your demo profile, garage and everything else in the demo, and starts again from the beginning."
        verb="Reset"
        onConfirm={() => {
          resetDemo();
          clearLaps();
          setConfirm(null);
        }}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmSheet
        visible={confirm === 'delete'}
        title="Delete your account"
        message="This deletes your profile, home area, garage and photos, check-ins, chat, posts and messages, votes, notices and crew place, straight away. Events only you host are cancelled; crews you own pass to a host. Places you suggested stay, without your name. It can't be undone."
        verb="Delete"
        busy={busy === 'delete'}
        onConfirm={() => account('delete')}
        onCancel={() => setConfirm(null)}
      />
    </ScrollView>
  );
}

const st = StyleSheet.create({
  page: { padding: SPACING.screen, gap: SPACING.section, paddingBottom: SPACING.xxxl },
});

import { BUSY_REQUESTS } from '../data/busyNight';
import { router } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { LEGAL_ROWS, openLegal } from '../components/AboutSection';
import { AppUpdates, updateDetails, versionLine } from '../components/AppUpdates';
import { Button, ChoiceGroup, ConfirmSheet, DsText, ErrorState, ListRow, RowDivider, Section, SwitchRow, useToast } from '../components/ds';
import { TravelPrefs } from '../components/TravelPrefs';
import { useAuth } from '../lib/auth';
import { useCommunity, useCommunityQuery } from '../lib/communityStore';
import { DIRECTIONS_APPS } from '../lib/directions';
import { travelOf } from '../lib/discover';
import { SCREEN_TITLES } from '../lib/glossary';
import { clearLaps } from '../lib/lapStore';
import { LEGAL_PAGES } from '../lib/legal';
import { askPermission, notificationsSupported, permissionGranted, testReminder } from '../lib/notify';
import { useStore } from '../lib/store';
import { SPACING } from '../theme';

/**
 * The way out of the demo: "Back to my account" when an account is waiting behind it, else "Leave the
 * demo", which opens the sign-in form (the demo stays on the phone for later).
 */
export function LeaveDemoRow() {
  const auth = useAuth();
  return auth.accountWaiting ? (
    <ListRow
      title="Back to my account"
      subtitle={`${auth.email ? `${auth.email} is` : 'Your account is'} just as you left it.`}
      onPress={() => auth.backToAccount()}
    />
  ) : (
    <ListRow title="Leave the demo" subtitle="Sign in or create an account. The demo stays here for later." onPress={() => router.push('/account')} />
  );
}

/** One group of rows: the caps eyebrow, then rows that touch with a hairline. */
function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Section title={title} gap="sm">
      {children}
    </Section>
  );
}

/**
 * Settings (Redesign 2, 3.11; T5): Account → Privacy → Profile → Notifications → Directions →
 * About → Demo → Staff (staff only). Signed in, Demo offers "Try the demo" (auth.tryDemo: the session
 * stays, nothing from the demo goes to the account); in the demo, every demo control is in Demo,
 * the way out too ("Back to my account" or "Leave the demo"). Privacy sits second so "Show me in People near
 * you" is on the first screen (REVIEW-12 #6). "Directions open in" is a setting, so it's a
 * ChoiceGroup of pills, never a SegmentedControl (4.4). The driving view's own settings (map heading,
 * icon, voice, cameras) live in its ··· menu; map layers live in the map's Layers sheet. The
 * developer group shows in development builds, or after a long press on the version line.
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
  const [confirm, setConfirm] = useState<null | 'reset' | 'delete' | 'restart'>(null);
  const [busy, setBusy] = useState<null | 'out' | 'delete'>(null);
  const [developer, setDeveloper] = useState(__DEV__);
  useEffect(() => {
    permissionGranted().then(setAllowed);
  }, []);
  const user = users.find((u) => u.id === me);
  const travel = travelOf(user);
  const demo = backend === 'local';
  const staff = !!status.data?.isStaff;
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
    <ScrollView contentContainerStyle={st.page} showsVerticalScrollIndicator={false}>
      <Group title="Account">
        {demo ? (
          // Every demo control, the way out included, is in the Demo group at the bottom (owner, Review 17).
          <ListRow title="You're trying the demo" subtitle="Leave it at the bottom of this page." />
        ) : (
          <View>
            <ListRow title={auth.email ? `Signed in as ${auth.email}` : 'Signed in'} subtitle={store.online ? (store.pendingWrites > 0 ? 'Sending changes made offline…' : undefined) : 'Offline: showing what this phone last saw'} />
            <RowDivider />
            <ListRow title={busy === 'out' ? 'Signing out…' : 'Sign out'} onPress={() => account('out')} />
            <RowDivider />
            <ListRow title="Delete account" subtitle="Deletes everything, straight away" onPress={() => setConfirm('delete')} />
          </View>
        )}
        {error?.at === 'account' ? <ErrorState title={error.text} /> : null}
      </Group>

      <Group title="Privacy">
        <SwitchRow
          label="Show me in People near you"
          hint="Off by default. Others see a rough distance."
          value={community.showInNearby}
          onValueChange={(v) => {
            setError(null);
            community
              .run((s) => s.setShowInNearby(v))
              .then(() => toast(v ? { message: 'Shown in People near you' } : { message: 'Hidden from People near you', tone: 'info' }))
              .catch(failed('community'));
          }}
        />
        {error?.at === 'community' ? <ErrorState title={error.text} /> : null}
        <ListRow title="Connections and blocked people" onPress={() => router.push('/connections')} />
        {status.data?.suspended ? (
          <DsText v="caption" tone="warning">
            {status.data.message ?? 'Your account is suspended: you can read and report, not post or message.'}
          </DsText>
        ) : null}
      </Group>

      <Group title="Profile">
        <ListRow title="Handle, name and home area" subtitle={user ? `@${user.handle}` : undefined} onPress={() => router.push('/profile')} />
      </Group>

      <Group title="Notifications">
        <SwitchRow
          label="Meet reminders"
          hint="When the location shows, and before the start."
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
        {/* Without phone notifications they simply show under the bell: no platform note (Review 15). */}
        {!notificationsSupported ? null : allowed === false && (settings.reminders || travel.alerts === 'notify') ? (
          <View style={{ gap: SPACING.sm }}>
            <DsText v="caption" tone="warning">Notifications are off for Slipstream, so these show under the bell only.</DsText>
            <Button label="Allow notifications" tier="secondary" size="sm" onPress={allow} />
          </View>
        ) : null}
      </Group>

      <Group title="Directions">
        <ChoiceGroup
          label="Open in"
          value={settings.directionsApp ?? 'nightshift'}
          onChange={(id) => setSettings({ directionsApp: id })}
          options={DIRECTIONS_APPS.map((a) => ({ key: a.id, label: a.label }))}
          chips
        />
      </Group>

      <Group title="About">
        <View>
          <ListRow title={SCREEN_TITLES.help} onPress={() => router.push('/help')} />
          <RowDivider />
          <ListRow title={SCREEN_TITLES.feedback} onPress={() => router.push({ pathname: '/feedback', params: { from: '/settings' } })} />
          {LEGAL_ROWS.map((r) => (
            <View key={r.key}>
              <RowDivider />
              <ListRow title={LEGAL_PAGES[r.key].label} subtitle={r.subtitle} onPress={() => openLegal(r.key)} accessibilityHint="Opens in Safari" />
            </View>
          ))}
          <RowDivider />
          <ListRow title="Open data and credits" onPress={() => router.push('/credits')} />
        </View>
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
          <View>
            <ListRow title="Restart the demo night" subtitle="Your profile and garage stay" onPress={() => setConfirm('restart')} />
            <RowDivider />
            {/* Off by default: the fixed demo night stays as the scorecard knows it. */}
            <SwitchRow
              label="Busy night"
              hint="Fill the demo with about 60 more sample people, 20 more meets, posts, chats and road reports. Made up, and kept on this phone."
              value={!!settings.busyNight}
              onValueChange={(on) => {
                store.setBusyNight(on);
                // Names the Community badge it brings, so the number isn't a surprise (Review 19).
                toast({ message: on ? `Busy night on · ${BUSY_REQUESTS} people want to connect` : 'Back to the normal demo night' });
              }}
            />
            <RowDivider />
            {/* The off switch next to the on switch (owner, Review 17). */}
            <LeaveDemoRow />
          </View>
        </Group>
      ) : auth.status === 'signedIn' ? (
        <Group title="Demo">
          <View>
            <ListRow title="Try the demo" subtitle="See the app full of sample meets and people. Your account is untouched." onPress={() => auth.tryDemo()} />
            <RowDivider />
            <ListRow title="Try the busy demo" subtitle="The demo with Busy night on: many more sample meets, people and posts." onPress={() => auth.tryDemo({ busy: true })} />
          </View>
        </Group>
      ) : null}

      {staff ? (
        <Group title="Staff">
          <View>
            <ListRow title="Moderation" subtitle="Reports from everyone" onPress={() => router.push('/moderation')} />
            <RowDivider />
            <ListRow title="Moderation team" onPress={() => router.push('/moderation-team')} />
            {status.data?.role === 'admin' || status.data?.role === 'owner' ? (
              <>
                <RowDivider />
                <ListRow title="Audit log" onPress={() => router.push('/moderation-log')} />
              </>
            ) : null}
          </View>
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
                toast(ok ? { message: 'Coming in 5 seconds' } : { message: 'Notifications are not allowed yet.', tone: 'danger' });
              }}
            />
          ) : null}
          {demo ? <Button label="Reset demo data" tier="destructive" size="sm" onPress={() => setConfirm('reset')} /> : null}
        </Group>
      ) : null}

      <ConfirmSheet
        visible={confirm === 'restart'}
        title="Restart the demo night"
        message="The demo's meets start again from Friday 21:10. Your profile and garage stay."
        verb="Restart"
        onConfirm={() => {
          restartDemoEvents();
          setConfirm(null);
          toast({ message: 'Demo night restarted' });
        }}
        onCancel={() => setConfirm(null)}
      />
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
        message="This deletes your profile, home area, garage and photos, check-ins, chat, posts and messages, votes and notices, straight away. Meets only you host are cancelled. Places you suggested stay, without your name. It can't be undone."
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

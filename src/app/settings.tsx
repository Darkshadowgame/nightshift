import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { AboutSection } from '../components/AboutSection';
import { AccountSection } from '../components/AccountSection';
import { AppUpdates } from '../components/AppUpdates';
import { NavIconChoices } from '../components/DriveHud';
import { TravelPrefs } from '../components/TravelPrefs';
import { Button, Card, Chip, ConfirmBox, InlineError, LinkText, Row, Section, ToggleRow, Txt } from '../components/ui';
import { CAMERA_CAVEAT } from '../lib/cameras';
import { DIRECTIONS_APPS } from '../lib/directions';
import { travelOf } from '../lib/discover';
import { PLACE_NAMES } from '../lib/glossary';
import { clearLaps } from '../lib/lapStore';
import { layerOn, setLayer, type Layer } from '../lib/mapLayers';
import { askPermission, notificationsSupported, permissionGranted, testReminder } from '../lib/notify';
import { useStore } from '../lib/store';
import { STATE } from '../theme';

/** Map layers, all saved the same way as the map's own buttons (mapLayers.ts). */
const LAYER_ROWS: { key: Layer; label: string; hint?: string }[] = [
  { key: 'events', label: 'Events' },
  { key: 'photo', label: PLACE_NAMES.photo.many },
  { key: 'drive', label: PLACE_NAMES.drive.many },
  { key: 'track', label: PLACE_NAMES.track.many },
  { key: 'venue', label: PLACE_NAMES.venue.many, hint: 'Cafés and museums that welcome meets.' },
  { key: 'shops', label: 'Shops', hint: 'Car and bike businesses from OpenStreetMap, and partners (always marked).' },
  { key: 'cameras', label: 'Speed cameras', hint: `Fixed cameras and average-speed zones, once you zoom in. ${CAMERA_CAVEAT}` },
  { key: 'roads', label: 'Road reports', hint: "Drivers' reports and road closures. Some reports only show in the driving view, along your route." },
];

/**
 * Settings (REVIEW-5 M7): everything that used to fill Me. Map layers, events
 * near you, reminders, navigation, privacy, account, the demo and app updates.
 */
export default function SettingsScreen() {
  const { users, me, settings, setSettings, resetDemo, restartDemoEvents, refreshReminders, setTravelPrefs, backend } = useStore();
  const [travelError, setTravelError] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [restarted, setRestarted] = useState(false);
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [testNote, setTestNote] = useState<string | null>(null);
  useEffect(() => {
    permissionGranted().then(setAllowed);
  }, []);
  const user = users.find((u) => u.id === me);
  const travel = travelOf(user);
  const allow = () =>
    askPermission().then((ok) => {
      setAllowed(ok);
      if (ok) refreshReminders();
    });

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 20, paddingBottom: 40 }}>
      <Section title="Map layers">
        <Card>
          {LAYER_ROWS.map((l) => (
            <ToggleRow
              key={l.key}
              label={l.label}
              hint={l.hint}
              value={layerOn(settings, l.key)}
              onValueChange={(v) => setSettings(setLayer(settings, l.key, v))}
            />
          ))}
          <Txt v="caption">Also on the map: the pills along the top and the layers button on the right.</Txt>
        </Card>
      </Section>

      <Section title="Events near you" right={<LinkText label="Find events ›" onPress={() => router.push('/find')} />}>
        <Card>
          <TravelPrefs
            miles={travel.miles}
            alerts={travel.alerts}
            onChange={(next) => {
              setTravelError(null);
              setTravelPrefs(next).catch((e) => setTravelError(e instanceof Error ? e.message : 'Could not save that.'));
              if (next.alerts === 'notify') askPermission().then(setAllowed);
            }}
          />
          <InlineError message={travelError} />
          {travel.alerts === 'notify' && notificationsSupported && allowed === false ? (
            <Txt v="caption" style={{ color: STATE.warning }}>Notifications are off for Nightshift, so new events land under the bell only. Allow them under Reminders.</Txt>
          ) : null}
        </Card>
      </Section>

      <Section title="Reminders">
        <Card>
          <ToggleRow
            label="Event reminders"
            hint="When the stop unlocks and 30 minutes before the start, for events you're going to or hosting, and when a rolling meet you're at moves on."
            value={settings.reminders}
            onValueChange={(v) => {
              setSettings({ reminders: v });
              if (v) allow();
            }}
          />
          {!notificationsSupported ? (
            <Txt v="caption">Notifications only work in the iPhone app. The list under the bell works everywhere.</Txt>
          ) : allowed === false && (settings.reminders || travel.alerts === 'notify') ? (
            <View style={{ gap: 8 }}>
              <Txt v="caption" style={{ color: STATE.warning }}>Notifications are off for Nightshift. Allow them here or in the iPhone Settings app › Nightshift › Notifications.</Txt>
              <Button label="Allow notifications" kind="secondary" size="sm" onPress={allow} />
            </View>
          ) : null}
          {notificationsSupported ? (
            <Button
              label="Send a test reminder"
              kind="secondary"
              size="sm"
              onPress={async () => {
                const ok = await testReminder(5);
                setAllowed(ok);
                if (ok) refreshReminders();
                setTestNote(ok ? 'Coming in 5 seconds. Lock the phone to see it on the lock screen.' : 'Notifications are not allowed yet.');
              }}
            />
          ) : null}
          {testNote ? <Txt v="caption" accessibilityLiveRegion="polite">{testNote}</Txt> : null}
        </Card>
      </Section>

      <Section title="Navigation">
        <Card>
          <Txt>Start navigation opens</Txt>
          <Row>
            {DIRECTIONS_APPS.map((a) => (
              <Chip key={a.id} label={a.label} on={(settings.directionsApp ?? 'nightshift') === a.id} onPress={() => setSettings({ directionsApp: a.id })} />
            ))}
          </Row>
          <Txt v="caption">Nightshift guides you turn by turn, with a voice and camera alerts. The others open that app. "Open in another app" still lets you pick each time.</Txt>
          <Txt>The driving map</Txt>
          <Row>
            <Chip label="Turns with you" on={settings.navMap !== 'north'} onPress={() => setSettings({ navMap: 'heading' })} />
            <Chip label="North up" on={settings.navMap === 'north'} onPress={() => setSettings({ navMap: 'north' })} />
          </Row>
          <Txt v="caption">The compass button on the driving screen switches it too.</Txt>
          <Txt>Your icon on the map</Txt>
          <NavIconChoices value={settings.navIcon} onChange={(v) => setSettings({ navIcon: v })} />
          <Txt v="caption">Stopped, tap your icon on the driving screen to change it.</Txt>
          <ToggleRow
            label="Spoken directions"
            hint="A British voice reads each turn and turns music down while it speaks. Mute it for one trip on the driving screen."
            value={settings.navVoice !== false}
            onValueChange={(v) => setSettings({ navVoice: v })}
          />
          <ToggleRow
            label="Speed camera alerts"
            hint="Says when a camera or average-speed zone is about half a mile ahead, with its limit. Speed limits only, never police."
            value={settings.navCameraAlerts !== false}
            onValueChange={(v) => setSettings({ navCameraAlerts: v })}
          />
        </Card>
      </Section>

      <Section title="Privacy">
        <Card>
          <Txt v="muted">
            Nobody is ever shown on the map. Other people see your builds, trophies, crew and level, never a location. Your home area is saved to
            about 1 km and only used to find events near you.
          </Txt>
          <Txt v="caption">Coming later: cruise mode and walkie-talkie with people nearby. Their settings will be here.</Txt>
        </Card>
      </Section>

      <AccountSection />

      <AboutSection />

      {backend === 'local' ? (
        <Section title="Demo">
          <Card>
            <ToggleRow
              label="Skip the GPS check"
              hint="For testing only: check in and visit photo spots from anywhere, and simulate drives. Off, you have to be there."
              value={settings.simulateGps}
              onValueChange={(v) => setSettings({ simulateGps: v })}
            />
          </Card>
          <Card>
            <Txt>Restart the demo events</Txt>
            <Txt v="caption">
              Draws the sample events round your home area again: a rolling meet live now, a crew meet soon, an invite later, requests, chat and votes.
              Drives and photo spots go back to not done. Your profile, builds, photos, crew and anything you made stay.
            </Txt>
            <Button
              label={restarted ? 'Restarted ✓' : 'Restart the demo events'}
              kind="secondary"
              size="sm"
              onPress={() => {
                restartDemoEvents();
                setRestarted(true);
              }}
            />
          </Card>
          {confirmReset ? (
            <ConfirmBox
              message="Reset the demo? This clears your demo profile, builds and everything else in the demo."
              verb="Reset"
              onConfirm={() => {
                resetDemo();
                clearLaps();
                setConfirmReset(false);
              }}
              onCancel={() => setConfirmReset(false)}
            />
          ) : (
            <Button label="Reset demo data" kind="danger" onPress={() => setConfirmReset(true)} />
          )}
        </Section>
      ) : null}

      <Section title="App updates">
        <AppUpdates />
      </Section>
    </ScrollView>
  );
}

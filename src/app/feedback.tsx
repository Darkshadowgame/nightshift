import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Image, Pressable, ScrollView, TextInput, View } from 'react-native';
import { usePhotoFlow } from '../components/PhotoFlow';
import { Button, Card, Chip, InlineError, Row, Section, ToggleRow, Txt, s as ui } from '../components/ui';
import { FEEDBACK_KINDS, FEEDBACK_MAX, FEEDBACK_PHOTOS_MAX, kindLabel, makeReport, statusLabel, type FeedbackKind } from '../lib/feedbackQueue';
import { currentPosition } from '../lib/location';
import { deletePhotos, photoUri } from '../lib/photos';
import { newId, useStore } from '../lib/store';
import { BRAND, C, STATE } from '../theme';

/**
 * Send feedback (Settings, Me and the sign-in screen open it). A type, a
 * message, screenshots or photos (signed in; through the plate check), and,
 * only when ticked, where you are. The app version, device, the screen it was
 * opened from and the backend mode go with it. It works signed out and queues
 * offline (feedbackQueue.ts). Below the form, "Your feedback" shows what
 * happened to each report: New, Seen, Planned, or Fixed in vX.
 */
export default function FeedbackScreen() {
  const { from, kind: kindParam } = useLocalSearchParams<{ from?: string; kind?: string }>();
  const { backend, queueFeedback, feedbackContext, refreshFeedback, sentFeedback, pendingFeedback } = useStore();
  const signedIn = backend === 'supabase';
  const [kind, setKind] = useState<FeedbackKind>(FEEDBACK_KINDS.some((k) => k.kind === kindParam) ? (kindParam as FeedbackKind) : 'bug');
  const [message, setMessage] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [withLocation, setWithLocation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const route = (typeof from === 'string' && from) || 'unknown';
  const context = feedbackContext(route);

  const flow = usePhotoFlow({
    onError: setError,
    onPhoto: (ref, replaces) => setPhotos((ps) => (replaces ? ps.map((p) => (p === replaces ? ref : p)) : [...ps, ref].slice(0, FEEDBACK_PHOTOS_MAX))),
  });

  // The store hands out a new refreshFeedback on every change: keep the latest without re-running the focus effect.
  const refreshRef = useRef(refreshFeedback);
  refreshRef.current = refreshFeedback;
  const refresh = useCallback(() => {
    setListError(null);
    refreshRef.current().catch(() => setListError("Couldn't check for updates just now."));
  }, []);
  useFocusEffect(refresh);

  // Photos added but never sent: their files go when the screen closes.
  const unsent = useRef<string[]>([]);
  unsent.current = photos;
  useEffect(() => () => deletePhotos(unsent.current), []);

  async function send() {
    setError(null);
    setBusy(true);
    try {
      let location: { lat: number; lng: number } | null = null;
      if (withLocation) {
        const pos = await currentPosition(true);
        if (!pos.ok) {
          setError(pos.reason === 'denied' ? 'Location is off for Nightshift. Untick "Include my location" to send without it.' : "Couldn't find where you are. Untick it to send without.");
          return;
        }
        location = pos.at;
      }
      queueFeedback(makeReport({ kind, message, screen: route, photos: signedIn ? photos : [], context, location }, newId('fb'), new Date()));
      setSent(true);
      setMessage('');
      setPhotos([]);
      setWithLocation(false);
      setTimeout(refresh, 4000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Couldn’t save that.');
    } finally {
      setBusy(false);
    }
  }

  function removePhoto(ref: string) {
    setPhotos((ps) => ps.filter((p) => p !== ref));
    deletePhotos([ref]);
  }

  const waiting = new Set((pendingFeedback ?? []).map((f) => f.id));
  const list = sentFeedback ?? [];

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 20, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
      {flow.view}
      {sent ? (
        <Card accent={STATE.success}>
          <Txt v="h3">Thanks, it’s with the team</Txt>
          <Txt v="muted">
            {waiting.size > 0
              ? 'No signal right now, so it’s waiting on your phone and goes as soon as there is.'
              : 'Every report is read. Check back here to see what happens to it.'}
          </Txt>
          <Button label="Send more feedback" kind="secondary" size="sm" onPress={() => setSent(false)} />
        </Card>
      ) : (
        <Section title="Send feedback">
          <Card>
            <Txt v="label">What kind?</Txt>
            <Row style={{ flexWrap: 'wrap' }}>
              {FEEDBACK_KINDS.map((k) => (
                <Chip key={k.kind} label={k.label} raw on={kind === k.kind} onPress={() => setKind(k.kind)} />
              ))}
            </Row>
            <Txt v="caption">{FEEDBACK_KINDS.find((k) => k.kind === kind)?.hint}</Txt>
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder={kind === 'bug' ? 'What happened, and what did you expect?' : kind === 'looks_wrong' ? 'Which place or event, and what’s wrong?' : 'Tell us…'}
              placeholderTextColor={C.fog}
              style={[ui.input, { minHeight: 120, textAlignVertical: 'top' }]}
              multiline
              maxLength={FEEDBACK_MAX}
              accessibilityLabel="Your feedback"
            />

            <Txt v="label">Screenshots or photos</Txt>
            {signedIn ? (
              <View style={{ gap: 8 }}>
                {photos.length ? (
                  <Row style={{ flexWrap: 'wrap' }}>
                    {photos.map((p, i) => (
                      <Pressable
                        key={p}
                        onPress={() => removePhoto(p)}
                        accessibilityRole="button"
                        accessibilityLabel={`Remove photo ${i + 1}`}
                        style={{ width: 72, height: 72, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: C.kerbHi }}
                      >
                        <Image source={{ uri: photoUri(p) }} style={{ width: '100%', height: '100%' }} accessibilityIgnoresInvertColors />
                      </Pressable>
                    ))}
                  </Row>
                ) : null}
                {photos.length < FEEDBACK_PHOTOS_MAX ? (
                  <Row style={{ flexWrap: 'nowrap' }}>
                    <Button label="Add a screenshot" kind="secondary" size="sm" style={{ flex: 1 }} busy={flow.busy} onPress={() => flow.pick(false)} />
                    <Button label="Take a photo" kind="secondary" size="sm" style={{ flex: 1 }} onPress={() => flow.pick(true)} />
                  </Row>
                ) : null}
                <Txt v="caption">Up to {FEEDBACK_PHOTOS_MAX}. Number plates are found and blurred first; tap a photo to take it off. Only the Nightshift team sees them.</Txt>
              </View>
            ) : (
              <Txt v="caption">Sign in to add screenshots. You can still send this without them.</Txt>
            )}

            <ToggleRow
              label="Include my location"
              hint="Off unless you tick it. Useful when a place is wrong where you are. It goes with this report only."
              value={withLocation}
              onValueChange={setWithLocation}
            />

            <Button label="Send feedback" onPress={send} busy={busy} disabled={!message.trim()} />
            <InlineError message={error} />

            <Pressable onPress={() => setShowDetails((v) => !v)} accessibilityRole="button" hitSlop={8} style={{ minHeight: 44, justifyContent: 'center' }}>
              <Txt v="label" style={{ color: BRAND }}>{showDetails ? 'Hide what’s sent with it' : 'What’s sent with it ›'}</Txt>
            </Pressable>
            {showDetails ? (
              <View style={{ gap: 2 }}>
                <Txt v="caption">App version: {process.env.EXPO_PUBLIC_APP_VERSION ?? 'development'}{context.runtime ? ` (runtime ${context.runtime})` : ''}</Txt>
                <Txt v="caption">Device: {[context.model, context.os].filter(Boolean).join(', ')}</Txt>
                <Txt v="caption">Screen: {route}</Txt>
                <Txt v="caption">Mode: {context.backend}</Txt>
                <Txt v="caption">{signedIn ? 'Your account, so we can see your reports here.' : 'No account: it’s sent anonymously.'} Never your name, email or location (unless ticked).</Txt>
              </View>
            ) : null}
          </Card>
        </Section>
      )}

      <Section title="Your feedback">
        {list.length === 0 ? (
          <Card>
            <Txt v="muted">Nothing sent from this phone yet. What you send shows here with what happened to it: New, Seen, Planned, or Fixed in a version.</Txt>
          </Card>
        ) : (
          <Card>
            {list.map((f) => {
              const label = statusLabel(f, waiting.has(f.id));
              const tone = f.status === 'done' ? STATE.success : f.status === 'planned' ? BRAND : waiting.has(f.id) ? STATE.warning : C.fog;
              return (
                <View key={f.id} style={{ gap: 2, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.kerb }}>
                  <Row style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}>
                    <Txt v="caption" style={{ flex: 1 }}>{kindLabel(f.kind)} · {new Date(f.at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</Txt>
                    <Txt v="label" style={{ color: tone }}>{label}</Txt>
                  </Row>
                  <Txt numberOfLines={2}>{f.summary}</Txt>
                </View>
              );
            })}
            <Button label="Check for updates" kind="ghost" size="sm" onPress={refresh} />
            <InlineError message={listError} />
          </Card>
        )}
      </Section>
    </ScrollView>
  );
}

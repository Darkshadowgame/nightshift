import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useDiscardGuard } from '../components/ComposerParts';
import { usePhotoFlow } from '../components/PhotoFlow';
import { ActionBar, Button, ChoiceGroup, DsText, EmptyState, ErrorState, ListRow, PAGE_WITH_BAR, Section, SwitchRow, Tag, typeStyle, useToast } from '../components/ds';
import { appNow } from '../lib/appClock';
import { FEEDBACK_KINDS, FEEDBACK_MAX, FEEDBACK_PHOTOS_MAX, kindLabel, makeReport, statusLabel, type FeedbackKind } from '../lib/feedbackQueue';
import { currentPosition } from '../lib/location';
import { deletePhotos, photoUri } from '../lib/photos';
import { newId, useStore } from '../lib/store';
import { COLOR, RADII, SPACING } from '../theme';

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
  // Back with a message typed asks first (4.2): "Discard it" / "Keep editing".
  const guard = useDiscardGuard(!sent && (message.trim().length > 0 || photos.length > 0), 'your feedback');
  const route = (typeof from === 'string' && from) || 'unknown';
  const context = feedbackContext(route);
  const toast = useToast();

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
    if (!message.trim()) return setError('Write something first.');
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
      queueFeedback(makeReport({ kind, message, screen: route, photos: signedIn ? photos : [], context, location }, newId('fb'), appNow()));
      setSent(true);
      toast({ message: 'Feedback sent' });
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
    <View style={{ flex: 1 }}>
    <ScrollView contentContainerStyle={PAGE_WITH_BAR} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      {flow.view}
      {sent ? (
        <View style={st.done} accessibilityLiveRegion="polite">
          <DsText v="title">Thanks, it’s with the team</DsText>
          <DsText v="secondary">
            {waiting.size > 0
              ? 'No signal right now, so it’s waiting on your phone and goes as soon as there is.'
              : 'Every report is read. Check back here to see what happens to it.'}
          </DsText>
        </View>
      ) : (
        <View style={{ gap: SPACING.lg }}>
          <ChoiceGroup label="What kind?" value={kind} onChange={setKind} options={FEEDBACK_KINDS.map((k) => ({ key: k.kind, label: k.label }))} />
          <DsText v="caption">{FEEDBACK_KINDS.find((k) => k.kind === kind)?.hint}</DsText>
          <View style={{ gap: SPACING.xs }}>
            <DsText v="label">Your message</DsText>
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder={kind === 'bug' ? 'What happened, and what did you expect?' : kind === 'looks_wrong' ? 'Which place or event, and what’s wrong?' : 'Tell us…'}
              placeholderTextColor={COLOR.text.secondary}
              style={[typeStyle('input'), st.input]}
              multiline
              maxLength={FEEDBACK_MAX}
              accessibilityLabel="Your feedback"
            />
          </View>

          <View style={{ gap: SPACING.sm }}>
            <DsText v="label">Screenshots or photos</DsText>
            {signedIn ? (
              <>
                {photos.length ? (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm }}>
                    {photos.map((p, i) => (
                      <Pressable key={p} onPress={() => removePhoto(p)} accessibilityRole="button" accessibilityLabel={`Remove photo ${i + 1}`} style={st.thumb}>
                        <Image source={{ uri: photoUri(p) }} style={{ width: '100%', height: '100%' }} accessibilityIgnoresInvertColors />
                      </Pressable>
                    ))}
                  </View>
                ) : null}
                {photos.length < FEEDBACK_PHOTOS_MAX ? (
                  <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
                    <Button label="Add a screenshot" tier="secondary" size="sm" block style={{ flex: 1 }} busy={flow.busy} onPress={() => flow.pick(false)} />
                    <Button label="Take a photo" tier="secondary" size="sm" block style={{ flex: 1 }} onPress={() => flow.pick(true)} />
                  </View>
                ) : null}
                <DsText v="caption">Up to {FEEDBACK_PHOTOS_MAX}. Number plates are found and blurred first; tap a photo to take it off. Only the Nightshift team sees them.</DsText>
              </>
            ) : (
              <DsText v="caption">Sign in to add screenshots. You can still send this without them.</DsText>
            )}
          </View>

          <SwitchRow
            label="Include my location"
            hint="Off unless you turn it on. Useful when a place is wrong where you are. It goes with this report only."
            value={withLocation}
            onValueChange={setWithLocation}
          />

          {error ? <ErrorState title={error} /> : null}

          <Button label={showDetails ? 'Hide what’s sent with it' : 'What’s sent with it'} tier="tertiary" size="sm" onPress={() => setShowDetails((v) => !v)} />
          {showDetails ? (
            <View style={{ gap: SPACING.xxs }}>
              <DsText v="caption">App version: {process.env.EXPO_PUBLIC_APP_VERSION ?? 'development'}{context.runtime ? ` (runtime ${context.runtime})` : ''}</DsText>
              <DsText v="caption">Device: {[context.model, context.os].filter(Boolean).join(', ')}</DsText>
              <DsText v="caption">Screen: {route}</DsText>
              <DsText v="caption">Mode: {context.backend}</DsText>
              <DsText v="caption">{signedIn ? 'Your account, so we can see your reports here.' : 'No account: it’s sent anonymously.'} Never your name, email or location (unless turned on).</DsText>
            </View>
          ) : null}
        </View>
      )}

      <Section title="Your feedback" right={list.length ? <Button label="Check for updates" tier="tertiary" size="sm" onPress={refresh} /> : undefined}>
        {list.length === 0 ? (
          <EmptyState variant="inline" title="Nothing sent from this phone yet. What you send shows here, with what happened to it." />
        ) : (
          list.map((f) => {
            const label = statusLabel(f, waiting.has(f.id));
            const tone = f.status === 'done' ? 'success' : f.status === 'planned' ? 'info' : waiting.has(f.id) ? 'warning' : 'neutral';
            return (
              <ListRow
                key={f.id}
                title={f.summary}
                meta={`${kindLabel(f.kind)} · ${new Date(f.at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`}
                trailing={<Tag label={label} tone={tone} />}
              />
            );
          })
        )}
        {listError ? <ErrorState title={listError} onRetry={refresh} /> : null}
      </Section>
    </ScrollView>
    {sent ? (
      <ActionBar secondary={{ label: 'Send more feedback', onPress: () => setSent(false) }} />
    ) : (
      <ActionBar primary={{ label: 'Send feedback', onPress: send, busy, haptic: 'success' }} />
    )}
    {guard.sheet}
    </View>
  );
}

const st = StyleSheet.create({
  done: { gap: SPACING.sm, padding: SPACING.lg, borderRadius: RADII.card, borderWidth: 1, borderColor: COLOR.surface.border, backgroundColor: COLOR.surface.card },
  input: { minHeight: 120, textAlignVertical: 'top', padding: SPACING.md, borderRadius: RADII.control, borderWidth: 1, borderColor: COLOR.surface.borderStrong, backgroundColor: COLOR.surface.card },
  thumb: { width: 72, height: 72, borderRadius: RADII.control, overflow: 'hidden', borderWidth: 1, borderColor: COLOR.surface.raisedHi },
});

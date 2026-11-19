import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActionBar, Button, DsText, ErrorState, Gradient, Icon, IconButton, Press, Section, typeStyle } from '../components/ds';
import { openLegal } from '../components/AboutSection';
import { FadeUp } from '../components/motion';
import { PhotoCredit } from '../components/PhotoCredit';
import { Pin, type Glyph } from '../components/Pin';
import { Wordmark } from '../components/Wordmark';
import { SAMPLE_PHOTOS } from '../data/samplePhotos';
import { isReviewEmail, useAuth } from '../lib/auth';
import { COLOR, FONT_SCALE, RADII, SPACING } from '../theme';

/** Set once someone ticks the 18+ and terms box, so it stays ticked next time. Bump the date when the terms change. */
const AGREED_KEY = 'nightshift.agreed';
const TERMS_VERSION = '2026-11-17';

/** The picture behind the tagline: a sample build in a car park, credited through the ⓘ. */
const HERO_REF = 'b-kez-0';

/** The core loop in three short lines (Redesign 2, 3.1). */
const PITCH: { glyph: Glyph; text: string }[] = [
  { glyph: 'meet', text: "See tonight's meets near you" },
  { glyph: 'car', text: "Say you're going, with your car" },
  { glyph: 'show', text: 'Check in and vote for the best build' },
];

/** "I'm 18+ and agree to the Terms": one line, required before an account is made (App Store 1.2 and the Terms). */
function AgreeRow({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs }}>
      <Press
        onPress={() => onChange(!on)}
        haptic="select"
        role="checkbox"
        state={{ checked: on }}
        label="I'm 18 or over and I agree to the Terms of Use and Community Guidelines"
        hitSlop={8}
        style={{ flex: 1, flexDirection: 'row', gap: SPACING.sm, alignItems: 'center', minHeight: 44 }}
      >
        <View style={[st.box, on && st.boxOn]}>{on ? <Icon name="check" size={16} colour={COLOR.text.onAction} /> : null}</View>
        <DsText v="secondary" style={{ flex: 1 }}>
          I'm 18+ and agree to the Terms
        </DsText>
      </Press>
      <Button label="Read" tier="tertiary" size="sm" onPress={() => openLegal('terms')} accessibilityLabel="Read the Terms of Use" accessibilityHint="Opens in Safari" />
    </View>
  );
}

/**
 * First run (Redesign 2, 3.1): what Nightshift is in one line, a photo, the loop in three lines,
 * then Try the demo (primary) and Sign in (secondary) in the ActionBar, both on screen at 375x667.
 * Sign in opens the email step (a form with its own back): an email code, or for the App Review
 * account a password. The email has a 6-digit code once Nightshift's own mail is set up; until
 * then Supabase's built-in sender mails a sign-in link. Tapping that link on the phone opens the
 * app signed in; pasting it here works too.
 */
export default function SignIn() {
  const auth = useAuth();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const small = height < 740;
  const [step, setStep] = useState<'start' | 'email'>('start');
  const [busy, setBusy] = useState<null | 'demo'>(null);
  const [error, setError] = useState<{ at: 'demo'; text: string } | null>(null);
  const [agreed, setAgreed] = useAgreed(() => setError(null));

  // The 18+ box is on the first screen only, and both ways in need it: the demo too.
  async function demo() {
    setError(null);
    if (!agreed) return setError({ at: 'demo', text: TICK_FIRST });
    setBusy('demo');
    try {
      await auth.startDemo();
    } catch (e) {
      setError({ at: 'demo', text: e instanceof Error ? e.message : 'Something went wrong. Try again.' });
    } finally {
      setBusy(null);
    }
  }
  const err = (at: 'demo') => (error?.at === at ? <ErrorState title={error.text} /> : null);

  if (step === 'email') return <EmailSignIn onBack={() => setStep('start')} />;

  const photo = SAMPLE_PHOTOS[HERO_REF];
  return (
      <View style={{ flex: 1, backgroundColor: COLOR.surface.bg }}>
        <ScrollView contentContainerStyle={{ paddingTop: insets.top + SPACING.md, paddingBottom: SPACING.lg, gap: SPACING.lg }}>
          <View style={{ paddingHorizontal: SPACING.screen }}>
            <Wordmark compact />
          </View>
          <View style={{ height: small ? 190 : 260, overflow: 'hidden', backgroundColor: COLOR.surface.media }}>
            {photo ? <Image source={photo.image} style={StyleSheet.absoluteFill} resizeMode="cover" accessibilityIgnoresInvertColors aria-hidden /> : null}
            <Gradient />
            <View style={{ position: 'absolute', left: SPACING.screen, right: SPACING.screen, bottom: SPACING.md }}>
              <DsText v="hero" accessibilityRole="header">
                What's on tonight near you. Go with your car.
              </DsText>
            </View>
            <PhotoCredit photoRef={HERO_REF} overlay corner="topRight" />
          </View>
          <View style={{ paddingHorizontal: SPACING.screen, gap: SPACING.sm }}>
            {PITCH.map((l, i) => (
              <FadeUp key={l.glyph} index={i}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
                  <View aria-hidden>
                    <Pin glyph={l.glyph} colour={COLOR.text.secondary} size={24} />
                  </View>
                  <DsText v="body" style={{ flex: 1 }}>
                    {l.text}
                  </DsText>
                </View>
              </FadeUp>
            ))}
          </View>
          <View style={{ paddingHorizontal: SPACING.screen, gap: SPACING.sm }}>
            <AgreeRow on={agreed} onChange={setAgreed} />
            {err('demo')}
          </View>
        </ScrollView>
        <ActionBar
          primary={{ label: 'Try the demo', onPress: demo, busy: busy === 'demo', accessibilityHint: 'Sample people and meets. Nothing leaves this phone.' }}
          secondary={{
            label: 'Sign in',
            onPress: () => {
              setError(null);
              if (!agreed) return setError({ at: 'demo', text: TICK_FIRST });
              setStep('email');
            },
          }}
        />
      </View>
  );
}

/** Set the 18+ box from what was ticked last time; ticking it saves it. */
function useAgreed(onTick?: () => void): [boolean, (v: boolean) => void] {
  const [agreed, setAgreedState] = useState(false);
  useEffect(() => {
    AsyncStorage.getItem(AGREED_KEY)
      .then((v) => v === TERMS_VERSION && setAgreedState(true))
      .catch(() => {});
  }, []);
  const set = (v: boolean) => {
    setAgreedState(v);
    if (v) onTick?.();
    (v ? AsyncStorage.setItem(AGREED_KEY, TERMS_VERSION) : AsyncStorage.removeItem(AGREED_KEY)).catch(() => {});
  };
  return [agreed, set];
}

const TICK_FIRST = "Tick the box to say you're 18 or over first.";

/**
 * The email step: an email code, or for the App Review account a password. On the first-run screen it
 * draws its own header (`onBack` returns to the start). Opened from the demo (Settings › Demo ›
 * Leave the demo, or the Demo night sheet: the `account` route) it sits under the app's own header,
 * whose back arrow returns to where you were (`onBack` omitted); the 18+ box shows there if it
 * hasn't been ticked on this phone yet.
 */
export function EmailSignIn({ onBack }: { onBack?: () => void }) {
  const auth = useAuth();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [link, setLink] = useState('');
  const [showLink, setShowLink] = useState(false);
  const [busy, setBusy] = useState<null | 'send' | 'verify' | 'link'>(null);
  /** The last error and which action it came from, shown under that action. */
  const [error, setError] = useState<{ at: NonNullable<typeof busy>; text: string } | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [agreed, setAgreed] = useAgreed(() => setError(null));
  /** Whether the 18+ box was already ticked when this opened: if not, it shows here (the demo's sign-in). */
  const [askAgree, setAskAgree] = useState(false);
  useEffect(() => {
    if (onBack) return;
    AsyncStorage.getItem(AGREED_KEY)
      .then((v) => v !== TERMS_VERSION && setAskAgree(true))
      .catch(() => setAskAgree(true));
  }, [onBack]);
  const [password, setPassword] = useState('');
  const review = isReviewEmail(email);
  const mustAgree = () => {
    if (!agreed) throw new Error(TICK_FIRST);
  };

  async function run(kind: NonNullable<typeof busy>, fn: () => Promise<void>) {
    setError(null);
    setNote(null);
    setBusy(kind);
    try {
      await fn();
    } catch (e) {
      setError({ at: kind, text: e instanceof Error ? e.message : 'Something went wrong. Try again.' });
    } finally {
      setBusy(null);
    }
  }

  const send = () =>
    run('send', async () => {
      mustAgree();
      if (!email.trim()) throw new Error('Type your email address first.');
      await auth.sendCode(email);
      setSentTo(email.trim().toLowerCase());
      setCode('');
    });
  const withPassword = () =>
    run('send', async () => {
      mustAgree();
      if (!password) throw new Error('Type the password first.');
      await auth.signInWithPassword(email, password);
    });
  const verify = () =>
    run('verify', async () => {
      if (code.length !== 6) throw new Error('Type the 6-digit code from the email.');
      await auth.verifyCode(sentTo ?? email, code);
    });
  const useLink = () =>
    run('link', async () => {
      if (!link.trim()) throw new Error('Paste the link from the email first.');
      const ok = await auth.openLink(link);
      if (!ok) throw new Error("That isn't a Nightshift sign-in link. Copy the whole link from the email.");
    });

  const input = [typeStyle('input'), st.input];
  const err = (at: NonNullable<typeof busy>) => (error?.at === at ? <ErrorState title={error.text} /> : null);

  const primary = sentTo
    ? { label: 'Sign in', onPress: verify, busy: busy === 'verify', haptic: 'success' as const }
    : review
      ? { label: 'Sign in with password', onPress: withPassword, busy: busy === 'send', haptic: 'success' as const }
      : { label: 'Email me a code', onPress: send, busy: busy === 'send' };
  return (
    <View style={{ flex: 1, backgroundColor: COLOR.surface.bg }}>
      {onBack ? (
      <View style={[st.header, { paddingTop: insets.top + SPACING.xs }]}>
        <IconButton
          icon="back"
          label="Go back"
          colour={COLOR.text.primary}
          onPress={() => {
            setError(null);
            setNote(null);
            if (sentTo) setSentTo(null);
            else onBack();
          }}
        />
        <DsText v="heading" accessibilityRole="header">
          {sentTo ? 'CHECK YOUR EMAIL' : 'SIGN IN'}
        </DsText>
      </View>
      ) : null}
      <ScrollView
        contentContainerStyle={{ padding: SPACING.screen, gap: SPACING.section, paddingBottom: SPACING.xl }}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        keyboardDismissMode="interactive"
      >
        {askAgree && !sentTo ? <AgreeRow on={agreed} onChange={setAgreed} /> : null}
        {!sentTo ? (
          <Section title="Your email">
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={COLOR.text.secondary}
              style={input}
              autoFocus
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              keyboardType="email-address"
              textContentType="emailAddress"
              returnKeyType="send"
              onSubmitEditing={review ? undefined : send}
              maxFontSizeMultiplier={FONT_SCALE.chrome}
              accessibilityLabel="Email address"
            />
            {review ? (
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Password (App Review account)"
                placeholderTextColor={COLOR.text.secondary}
                style={input}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="password"
                returnKeyType="go"
                onSubmitEditing={withPassword}
                accessibilityLabel="Password"
              />
            ) : null}
            <DsText v="caption">No password: we email you a 6-digit code. New here? The same code makes your account.</DsText>
            {err('send')}
          </Section>
        ) : (
          <Section title="The code">
            <DsText v="secondary">We sent a sign-in email to {sentTo}. Type the 6-digit code, or tap the link in the email on this phone.</DsText>
            <TextInput
              value={code}
              onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              placeholderTextColor={COLOR.text.secondary}
              style={[input, st.code]}
              keyboardType="number-pad"
              autoComplete="one-time-code"
              textContentType="oneTimeCode"
              maxLength={6}
              returnKeyType="done"
              onSubmitEditing={verify}
              maxFontSizeMultiplier={FONT_SCALE.chrome}
              accessibilityLabel="6-digit code"
            />
            {err('verify')}
            {err('send')}
            {note ? (
              <DsText v="secondary" accessibilityLiveRegion="polite">
                {note}
              </DsText>
            ) : null}
            {showLink ? (
              <View style={{ gap: SPACING.sm }}>
                <DsText v="caption">Opened the email somewhere else? Copy the sign-in link from it and paste it here.</DsText>
                <TextInput
                  value={link}
                  onChangeText={setLink}
                  placeholder="https://…supabase.co/auth/v1/verify?token=…"
                  placeholderTextColor={COLOR.text.secondary}
                  style={input}
                  autoCapitalize="none"
                  autoCorrect={false}
                  accessibilityLabel="Sign-in link"
                />
                <Button label="Use this link" tier="secondary" block onPress={useLink} busy={busy === 'link'} />
                {err('link')}
              </View>
            ) : (
              <Button label="The email has a link, not a code" tier="tertiary" size="sm" onPress={() => setShowLink(true)} style={{ alignSelf: 'flex-start' }} />
            )}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm }}>
              <Button
                label="Send it again"
                tier="tertiary"
                size="sm"
                onPress={() =>
                  run('send', async () => {
                    await auth.sendCode(sentTo);
                    setNote('Sent again. Codes last 10 minutes; you can ask once a minute.');
                  })
                }
              />
              <Button
                label="Use another email"
                tier="tertiary"
                size="sm"
                onPress={() => {
                  setSentTo(null);
                  setError(null);
                  setNote(null);
                }}
              />
            </View>
          </Section>
        )}
        <Button
          label="Trouble signing in? Send feedback"
          tier="tertiary"
          size="sm"
          style={{ alignSelf: 'flex-start' }}
          onPress={() => router.push({ pathname: '/feedback', params: { from: '/signin', kind: 'bug' } })}
        />
      </ScrollView>
      <ActionBar primary={primary} />
    </View>
  );
}

const st = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, paddingHorizontal: SPACING.xs, paddingBottom: SPACING.xs },
  input: { minHeight: 48, paddingHorizontal: SPACING.md, borderRadius: RADII.control, borderWidth: 1, borderColor: COLOR.surface.borderStrong, backgroundColor: COLOR.surface.card },
  code: { textAlign: 'center', letterSpacing: 8 },
  box: { width: 24, height: 24, borderRadius: RADII.tag, borderWidth: 2, borderColor: COLOR.text.secondary, alignItems: 'center', justifyContent: 'center' },
  boxOn: { borderColor: COLOR.text.primary, backgroundColor: COLOR.text.primary },
});

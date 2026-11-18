import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, DsText, ErrorState, Icon, Press, Section, typeStyle } from '../components/ds';
import { openLegal } from '../components/AboutSection';
import { Wordmark } from '../components/Wordmark';
import { isReviewEmail, useAuth } from '../lib/auth';
import { COLOR, FONT_SCALE, RADII, SPACING } from '../theme';

/** Set once someone ticks the 18+ and terms box, so it stays ticked next time. Bump the date when the terms change. */
const AGREED_KEY = 'nightshift.agreed';
const TERMS_VERSION = '2026-11-17';

/** "I'm 18 or over and agree…": required before an account is made (App Store 1.2 and the Terms). */
function AgreeRow({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={{ gap: SPACING.xs }}>
      <Press
        onPress={() => onChange(!on)}
        haptic="select"
        role="checkbox"
        state={{ checked: on }}
        label="I'm 18 or over and I agree to the Terms of Use and Community Guidelines"
        hitSlop={8}
        style={{ flexDirection: 'row', gap: SPACING.md, alignItems: 'flex-start', minHeight: 44 }}
      >
        <View style={[st.box, on && { borderColor: COLOR.action.selected, backgroundColor: COLOR.action.selected }]}>
          {on ? <Icon name="check" size={16} colour={COLOR.action.onPrimary} /> : null}
        </View>
        <DsText v="body" style={{ flex: 1 }}>
          I'm 18 or over and I agree to the Terms of Use and Community Guidelines. Zero tolerance for abuse, harassment or organising street racing.
        </DsText>
      </Press>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm }}>
        <Button label="Terms" tier="tertiary" size="sm" onPress={() => openLegal('terms')} accessibilityHint="Opens in Safari" />
        <Button label="Community rules" tier="tertiary" size="sm" onPress={() => openLegal('guidelines')} accessibilityHint="Opens in Safari" />
        <Button label="Privacy" tier="tertiary" size="sm" onPress={() => openLegal('privacy')} accessibilityHint="Opens in Safari" />
      </View>
    </View>
  );
}

/**
 * First run: sign in with an email code, or try the demo without an account.
 * The email has a 6-digit code once Nightshift's own mail is set up; until
 * then Supabase's built-in sender mails a sign-in link (to the project team
 * only). Tapping that link on the phone opens the app signed in; pasting it
 * here works too.
 */
export default function SignIn() {
  const auth = useAuth();
  const insets = useSafeAreaInsets();
  // A small phone (iPhone SE, 375x667): the shorter pitch keeps "Try the demo" on the first screen.
  const short = useWindowDimensions().height < 740;
  const [email, setEmail] = useState('');
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [link, setLink] = useState('');
  const [showLink, setShowLink] = useState(false);
  const [busy, setBusy] = useState<null | 'send' | 'verify' | 'link' | 'demo'>(null);
  /** The last error and which action it came from, shown under that action. */
  const [error, setErrorState] = useState<{ at: NonNullable<typeof busy>; text: string } | null>(null);
  const setError = (x: null) => setErrorState(x);
  const errorAt = (at: NonNullable<typeof busy> | 'code') => (error && (error.at === at || (at === 'code' && (error.at === 'verify' || (error.at === 'send' && !!sentTo)))) ? error.text : null);
  const [note, setNote] = useState<string | null>(null);
  const [agreed, setAgreedState] = useState(false);
  const [password, setPassword] = useState('');
  const review = isReviewEmail(email);
  useEffect(() => {
    AsyncStorage.getItem(AGREED_KEY)
      .then((v) => v === TERMS_VERSION && setAgreedState(true))
      .catch(() => {});
  }, []);
  const setAgreed = (v: boolean) => {
    setAgreedState(v);
    (v ? AsyncStorage.setItem(AGREED_KEY, TERMS_VERSION) : AsyncStorage.removeItem(AGREED_KEY)).catch(() => {});
  };
  const mustAgree = () => {
    if (!agreed) throw new Error('Tick the box to confirm you are 18 or over and agree to the terms.');
  };

  async function run(kind: NonNullable<typeof busy>, fn: () => Promise<void>) {
    setError(null);
    setNote(null);
    setBusy(kind);
    try {
      await fn();
    } catch (e) {
      setErrorState({ at: kind, text: e instanceof Error ? e.message : 'Something went wrong. Try again.' });
    } finally {
      setBusy(null);
    }
  }

  const send = () =>
    run('send', async () => {
      mustAgree();
      await auth.sendCode(email);
      setSentTo(email.trim().toLowerCase());
      setCode('');
    });
  const verify = () => run('verify', () => auth.verifyCode(sentTo ?? email, code));
  const useLink = () =>
    run('link', async () => {
      const ok = await auth.openLink(link);
      if (!ok) throw new Error("That isn't a Nightshift sign-in link. Copy the whole link from the email.");
    });

  const input = [typeStyle('input'), st.input];
  const err = (at: Parameters<typeof errorAt>[0]) => {
    const t = errorAt(at);
    return t ? <ErrorState title={t} /> : null;
  };

  return (
    <ScrollView
      contentContainerStyle={[st.page, { paddingTop: insets.top + SPACING.xl, paddingBottom: insets.bottom + SPACING.xxxl }]}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
      keyboardDismissMode="interactive"
    >
      <Wordmark short={short} />

      {!sentTo ? (
        <Section title="Sign in or create an account">
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={COLOR.text.secondary}
            style={input}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
            returnKeyType="send"
            onSubmitEditing={send}
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
              onSubmitEditing={() => run('send', async () => { mustAgree(); await auth.signInWithPassword(email, password); })}
              accessibilityLabel="Password"
            />
          ) : null}
          <AgreeRow on={agreed} onChange={setAgreed} />
          {review ? (
            <Button
              label="Sign in with password"
              block
              onPress={() => run('send', async () => { mustAgree(); await auth.signInWithPassword(email, password); })}
              busy={busy === 'send'}
              disabled={!password}
              hint="Type the password first"
            />
          ) : (
            <Button label="Email me a code" block onPress={send} busy={busy === 'send'} />
          )}
          {err('send')}
          <DsText v="caption">No password: we email you a 6-digit code. New here? The same code makes your account.</DsText>
        </Section>
      ) : (
        <Section title="Check your email">
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
          <Button label="Sign in" block onPress={verify} busy={busy === 'verify'} disabled={code.length !== 6} hint="Type the 6-digit code" />
          {err('code')}
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
              <Button label="Use this link" tier="secondary" block onPress={useLink} busy={busy === 'link'} disabled={!link.trim()} hint="Paste the link first" />
              {err('link')}
            </View>
          ) : (
            <Button label="The email has a link, not a code" tier="tertiary" size="sm" onPress={() => setShowLink(true)} />
          )}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm }}>
            <Button label="Send it again" tier="tertiary" size="sm" onPress={() => run('send', async () => { await auth.sendCode(sentTo); setNote('Sent again. Codes last 10 minutes; you can ask once a minute.'); })} />
            <Button label="Use another email" tier="tertiary" size="sm" onPress={() => { setSentTo(null); setError(null); setNote(null); }} />
          </View>
        </Section>
      )}

      {note ? <DsText v="secondary" accessibilityLiveRegion="polite">{note}</DsText> : null}

      {/* Straight after the email button, so a 375x667 phone shows both choices without scrolling. */}
      <View style={{ gap: SPACING.sm }}>
        <Button label="Try the demo without an account" tier="secondary" block busy={busy === 'demo'} onPress={() => run('demo', () => auth.startDemo())} />
        <DsText v="caption">Just looking? Sample people and events round your area. Nothing leaves your phone, and you can sign in later.</DsText>
        {err('demo')}
      </View>

      <Button label="Trouble signing in? Send feedback" tier="tertiary" size="sm" onPress={() => router.push({ pathname: '/feedback', params: { from: '/signin', kind: 'bug' } })} />
    </ScrollView>
  );
}

const st = StyleSheet.create({
  page: { paddingHorizontal: SPACING.screen, gap: SPACING.section },
  input: { minHeight: 48, paddingHorizontal: SPACING.md, borderRadius: RADII.control, borderWidth: 1, borderColor: COLOR.surface.borderStrong, backgroundColor: COLOR.surface.card },
  code: { textAlign: 'center', letterSpacing: 8 },
  box: { width: 24, height: 24, marginTop: SPACING.xxs, borderRadius: RADII.tag, borderWidth: 2, borderColor: COLOR.text.secondary, alignItems: 'center', justifyContent: 'center' },
});

import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Card, InlineError, LinkText, Row, Section, Txt, s as ui } from '../components/ui';
import { openLegal } from '../components/AboutSection';
import { Wordmark } from '../components/Wordmark';
import { isReviewEmail, useAuth } from '../lib/auth';
import { BRAND, C } from '../theme';

/** Set once someone ticks the 18+ and terms box, so it stays ticked next time. Bump the date when the terms change. */
const AGREED_KEY = 'nightshift.agreed';
const TERMS_VERSION = '2026-11-17';

/** "I'm 18 or over and agree…": required before an account is made (App Store 1.2 and the Terms). */
function AgreeRow({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={{ gap: 6 }}>
      <Pressable
        onPress={() => onChange(!on)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: on }}
        accessibilityLabel="I'm 18 or over and I agree to the Terms of Use and Community Guidelines"
        hitSlop={8}
        style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start', minHeight: 44 }}
      >
        <View
          style={{
            width: 24,
            height: 24,
            marginTop: 1,
            borderRadius: 6,
            borderWidth: 2,
            borderColor: on ? BRAND : C.fog,
            backgroundColor: on ? BRAND : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {on ? <Txt style={{ color: C.ink, fontSize: 16, lineHeight: 18 }}>✓</Txt> : null}
        </View>
        <Txt style={{ flex: 1 }}>I'm 18 or over and I agree to the Terms of Use and Community Guidelines. Zero tolerance for abuse, harassment or organising street racing.</Txt>
      </Pressable>
      <Row gap={16}>
        <LinkText label="Terms ›" onPress={() => openLegal('terms')} />
        <LinkText label="Community rules ›" onPress={() => openLegal('guidelines')} />
        <LinkText label="Privacy ›" onPress={() => openLegal('privacy')} />
      </Row>
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

  return (
    <ScrollView
      contentContainerStyle={{ padding: 16, paddingTop: insets.top + 28, paddingBottom: insets.bottom + 40, gap: 24 }}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
      keyboardDismissMode="interactive"
    >
      <View style={{ gap: 14 }}>
        <Wordmark />
        <Txt v="label">18+ only</Txt>
      </View>

      {!sentTo ? (
        <Section title="Sign in or create an account">
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={C.fog}
            style={ui.input}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
            returnKeyType="send"
            onSubmitEditing={send}
            accessibilityLabel="Email address"
          />
          {review ? (
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Password (App Review account)"
              placeholderTextColor={C.fog}
              style={ui.input}
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
              onPress={() => run('send', async () => { mustAgree(); await auth.signInWithPassword(email, password); })}
              busy={busy === 'send'}
              disabled={!password}
            />
          ) : (
            <Button label="Email me a code" onPress={send} busy={busy === 'send'} />
          )}
          <InlineError message={errorAt('send')} />
          <Txt v="caption">No password. We email you a 6-digit code each time you sign in. New here? The same code makes your account.</Txt>
        </Section>
      ) : (
        <Section title="Check your email">
          <Txt v="muted">
            We sent a sign-in email to {sentTo}. Type the 6-digit code, or tap the link in the email on this phone.
          </Txt>
          <TextInput
            value={code}
            onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 6))}
            placeholder="123456"
            placeholderTextColor={C.fog}
            style={[ui.input, { fontSize: 24, letterSpacing: 8, textAlign: 'center' }]}
            keyboardType="number-pad"
            autoComplete="one-time-code"
            textContentType="oneTimeCode"
            maxLength={6}
            returnKeyType="done"
            onSubmitEditing={verify}
            accessibilityLabel="6-digit code"
          />
          <Button label="Sign in" onPress={verify} busy={busy === 'verify'} disabled={code.length !== 6} />
          <InlineError message={errorAt('code')} />
          {showLink ? (
            <View style={{ gap: 8 }}>
              <Txt v="caption">Opened the email somewhere else? Copy the sign-in link from it and paste it here.</Txt>
              <TextInput
                value={link}
                onChangeText={setLink}
                placeholder="https://…supabase.co/auth/v1/verify?token=…"
                placeholderTextColor={C.fog}
                style={ui.input}
                autoCapitalize="none"
                autoCorrect={false}
                accessibilityLabel="Sign-in link"
              />
              <Button label="Use this link" kind="secondary" onPress={useLink} busy={busy === 'link'} disabled={!link.trim()} />
              <InlineError message={errorAt('link')} />
            </View>
          ) : (
            <LinkText label="The email has a link, not a code ›" onPress={() => setShowLink(true)} />
          )}
          <Row gap={20}>
            <LinkText label="Send it again ›" onPress={() => run('send', async () => { await auth.sendCode(sentTo); setNote('Sent again. Codes last 10 minutes; you can ask once a minute.'); })} />
            <LinkText label="Use another email ›" onPress={() => { setSentTo(null); setError(null); setNote(null); }} />
          </Row>
        </Section>
      )}

      {note ? <Txt v="muted" accessibilityLiveRegion="polite">{note}</Txt> : null}

      <Card>
        <Txt>Just looking?</Txt>
        <Txt v="muted">Try Nightshift with sample people and events round your area. Nothing leaves your phone, and you can sign in later.</Txt>
        <Button label="Try the demo without an account" kind="secondary" busy={busy === 'demo'} onPress={() => run('demo', () => auth.startDemo())} />
        <InlineError message={errorAt('demo')} />
      </Card>

      <LinkText label="Trouble signing in? Send feedback ›" onPress={() => router.push({ pathname: '/feedback', params: { from: '/signin', kind: 'bug' } })} />
    </ScrollView>
  );
}

import { useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FadeUp, PulseRing } from '../components/motion';
import { Pin, type Glyph } from '../components/Pin';
import { Button, Card, Row, Section, Txt, s as ui } from '../components/ui';
import { useAuth } from '../lib/auth';
import { C } from '../theme';

const PITCH: { glyph: Glyph; colour: string; text: string }[] = [
  { glyph: 'locked', colour: C.sodium, text: 'Meets and cruises that unlock for the people going, on the night.' },
  { glyph: 'track', colour: C.lime, text: 'Your garage, classed S to D on power-to-weight. Win covers and trophies.' },
  { glyph: 'drive', colour: C.neon, text: 'Great roads to drive and photo spots, rated by the scene. Never timed.' },
];

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
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  async function run(kind: NonNullable<typeof busy>, fn: () => Promise<void>) {
    setError(null);
    setNote(null);
    setBusy(kind);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Try again.');
    } finally {
      setBusy(null);
    }
  }

  const send = () =>
    run('send', async () => {
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
        <Row gap={12} style={{ flexWrap: 'nowrap' }}>
          <PulseRing live colour={C.sodium} size={44}>
            <Pin glyph="rolling" colour={C.sodium} size={44} />
          </PulseRing>
          <Txt v="h1" style={{ fontSize: 34, lineHeight: 38 }}>
            Night<Txt v="h1" style={{ fontSize: 34, lineHeight: 38, color: C.sodium }}>shift</Txt>
          </Txt>
        </Row>
        <Txt style={{ fontSize: 17, lineHeight: 23 }}>The UK car and bike scene on one map, after dark.</Txt>
        <View style={{ gap: 10 }}>
          {PITCH.map((p, i) => (
            <FadeUp key={p.text} index={i} stagger={90}>
              <Row gap={10} style={{ flexWrap: 'nowrap' }}>
                <Pin glyph={p.glyph} colour={p.colour} size={26} />
                <Txt v="muted" style={{ flex: 1 }}>{p.text}</Txt>
              </Row>
            </FadeUp>
          ))}
        </View>
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
          <Button label="Email me a code" onPress={send} busy={busy === 'send'} />
          <Txt v="muted" style={{ fontSize: 12 }}>No password. We email you a 6-digit code each time you sign in. New here? The same code makes your account.</Txt>
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
          {showLink ? (
            <View style={{ gap: 8 }}>
              <Txt v="muted" style={{ fontSize: 12 }}>Opened the email somewhere else? Copy the sign-in link from it and paste it here.</Txt>
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
              <Button label="Use this link" kind="ghost" onPress={useLink} busy={busy === 'link'} disabled={!link.trim()} />
            </View>
          ) : (
            <Pressable onPress={() => setShowLink(true)} accessibilityRole="button" hitSlop={8}>
              <Txt v="label" style={{ color: C.sodium }}>The email has a link, not a code</Txt>
            </Pressable>
          )}
          <Row gap={16}>
            <Pressable onPress={() => run('send', async () => { await auth.sendCode(sentTo); setNote('Sent again. Codes last 10 minutes; you can ask once a minute.'); })} accessibilityRole="button" hitSlop={8}>
              <Txt v="label" style={{ color: C.sodium }}>Send it again</Txt>
            </Pressable>
            <Pressable onPress={() => { setSentTo(null); setError(null); setNote(null); }} accessibilityRole="button" hitSlop={8}>
              <Txt v="label" style={{ color: C.sodium }}>Use another email</Txt>
            </Pressable>
          </Row>
        </Section>
      )}

      {error ? (
        <Card accent={C.alert}>
          <Txt accessibilityLiveRegion="polite">{error}</Txt>
        </Card>
      ) : null}
      {note ? <Txt v="muted" accessibilityLiveRegion="polite">{note}</Txt> : null}

      <Card>
        <Txt>Just looking?</Txt>
        <Txt v="muted">Try Nightshift with sample people and events round your area. Nothing leaves your phone, and you can sign in later.</Txt>
        <Button label="Try the demo without an account" kind="ghost" busy={busy === 'demo'} onPress={() => run('demo', () => auth.startDemo())} />
      </Card>
    </ScrollView>
  );
}

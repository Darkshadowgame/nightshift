import { Stack } from 'expo-router';
import { Linking, ScrollView } from 'react-native';
import { Card, LinkText, Section, Txt } from '../components/ui';
import { title } from '../lib/glossary';
import { BRANDS_NOTE, CREDITS } from '../lib/legal';

/** Settings › About and legal › Open data and credits. */
export default function Credits() {
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 20, paddingBottom: 40 }}>
      <Stack.Screen options={{ title: title('Credits') }} />
      <Section title="Open data and credits">
        {CREDITS.map((c) => (
          <Card key={c.what}>
            <Txt v="label">{c.what}</Txt>
            <Txt>{c.who}</Txt>
            {c.licence ? <Txt v="caption">{c.licence}</Txt> : null}
            {c.url ? <LinkText label="Source and licence ›" onPress={() => Linking.openURL(c.url!).catch(() => {})} accessibilityLabel={`${c.what}: source and licence, opens in Safari`} /> : null}
          </Card>
        ))}
      </Section>
      <Txt v="caption">{BRANDS_NOTE}</Txt>
    </ScrollView>
  );
}

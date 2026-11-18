import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { openLegal } from '../components/AboutSection';
import { Button, DsText, Section } from '../components/ds';
import { SCREEN_TITLES } from '../lib/glossary';
import { SPACING } from '../theme';

/** One idea per block, in the order you meet them on a night out. */
const TOPICS: { title: string; lines: string[] }[] = [
  {
    title: 'Tonight',
    lines: [
      "Tonight shows what's on near your home area: live now, later tonight and this week, on the map or as a list.",
      'Tap + New to host your own meet, cruise, rolling meet, show or track day, or to suggest a place.',
    ],
  },
  {
    title: "I'm going",
    lines: [
      "Say you're going with the car or bike you're bringing. Invites are matched to your builds, so add yours in the Garage.",
      "If the invite doesn't cover your build, you can ask to go and a host says yes or no.",
    ],
  },
  {
    title: 'Meet points',
    lines: [
      'Until a meet is close, you only see its area (a circle on the map). The exact meet point is shown to the people going, usually 1 hour before. The event says when ("Location shows at 21:30").',
      'A rolling meet has more than one meet point. The hosts move it on. Everyone going sees the one it is at now, so you can join late; the ones after it stay hidden.',
    ],
  },
  {
    title: 'Check in',
    lines: [
      "When you get there, check in. It needs you to be there: within half a mile of an event's meet point, or 0.2 mi of a photo spot or a drive's checkpoint. Checking in is what lets you vote.",
    ],
  },
  {
    title: 'Trophies and votes',
    lines: [
      'The people who checked in vote for the best builds, from the start until 24 hours after it ends. Winners get trophies, and the best get a cover shoot.',
    ],
  },
  {
    title: 'Classes',
    lines: [
      "Every build has a class from S to D: its power for its weight. Cars and bikes each have their own scale, so a litre superbike and an M4 are both S. Hosts can invite certain classes, for example an S and A meet.",
    ],
  },
  {
    title: 'Levels',
    lines: [
      'One ladder for you: you earn rep points for turning up (150 for each event you check in at), hosting, trophies, drives and places people use, and they move you up the levels.',
      'Newcomer, Regular, Known face, Local name, Scene veteran, then Legend at the top. Class is about your build, not you; trophies are for a build on the night.',
    ],
  },
  {
    title: 'Privacy',
    lines: ['Nobody is shown on the map, ever. Your home area is saved to about 1 km and only used to find what’s near you.'],
  },
];

/** "How Nightshift works": the in-app help (Settings › About and legal, and Me). Short and in the app, for when you're stuck at a meet. */
export default function Help() {
  return (
    <ScrollView contentContainerStyle={st.page}>
      {TOPICS.map((t) => (
        <Section key={t.title} title={t.title} gap="sm">
          {t.lines.map((l) => (
            <DsText key={l} v="body">
              {l}
            </DsText>
          ))}
        </Section>
      ))}
      <View style={{ gap: SPACING.sm }}>
        <DsText v="secondary">Still stuck, or something's wrong?</DsText>
        <Button label={SCREEN_TITLES.feedback} tier="secondary" block onPress={() => router.push({ pathname: '/feedback', params: { from: '/help' } })} />
        <Button label="Support page" tier="tertiary" onPress={() => openLegal('support')} accessibilityHint="Opens in Safari" />
      </View>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  page: { padding: SPACING.screen, gap: SPACING.section, paddingBottom: SPACING.xxxl },
});

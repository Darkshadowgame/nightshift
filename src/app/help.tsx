import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { openLegal } from '../components/AboutSection';
import { DsText, ListRow, RowDivider, Section } from '../components/ds';
import { CLASS_EXPLAINER, SCREEN_TITLES } from '../lib/glossary';
import { useStore } from '../lib/store';
import { SPACING } from '../theme';

const VOTES_TOPIC = 'Votes and trophies';
/** What the demo does differently, said where voting is explained (Review 17): the event page matches it. */
const DEMO_VOTING = "In the demo, voting ends for you once you've voted for every trophy or tapped Done, and the results show straight away.";

/** One idea per block, in the order you meet them on a night out. */
const TOPICS: { title: string; lines: string[] }[] = [
  {
    title: 'Tonight',
    lines: [
      "Tonight shows what's on near you: live now, later tonight and this week, on the map or as a list.",
      'Tap + on Tonight to host a meet, a cruise or a rolling meet.',
    ],
  },
  {
    title: "I'm going",
    lines: [
      "Say you're going with the car or bike you're bringing. Some meets are only open to certain cars; those say \"Not open to your car\", and you can ask a host to let you in.",
    ],
  },
  {
    title: 'The meet point',
    lines: [
      'Before a meet, you see the area around it. The meet point shows to the people going, usually 1 hour before; the meet says when ("Location shows at 21:30").',
      'A rolling meet moves on during the night. Everyone going sees where it is now, so you can join late.',
    ],
  },
  {
    title: 'Check in',
    lines: ["When you get there, check in on the meet's page. Checking in is what lets you vote and add photos from the meet."],
  },
  {
    title: VOTES_TOPIC,
    lines: ['The people who checked in vote for Best in show, and for Best car and Best bike when both turn up. Voting runs until 24 hours after the end. Winners get a magazine cover.'],
  },
  {
    title: 'Class',
    // The one class explanation (C5), word for word as on the build form and Power and dyno.
    lines: [CLASS_EXPLAINER, 'A dyno run with its sheet photo gets the ✓ Dyno badge.'],
  },
  {
    title: 'On the road',
    lines: [
      'Tap Report in the driving view to warn other drivers about traffic, a police check, a hazard, a crash, roadworks or a closure. Police checks only ever show while driving and go after 30 minutes.',
      'Finishing a trip with directions and sending reports both count on Me; tap your line there to see how.',
    ],
  },
  {
    title: 'Privacy',
    lines: ['Nobody is shown on the map, ever. Your home area is saved to about half a mile and only used to show what’s near you.'],
  },
];

/** "How Nightshift works" (T5): the in-app help, from Me and Settings › About. Short and in the app, for when you're stuck at a meet. */
export default function Help() {
  const demo = useStore().backend === 'local';
  return (
    <ScrollView contentContainerStyle={st.page} showsVerticalScrollIndicator={false}>
      {TOPICS.map((t) => (
        <Section key={t.title} title={t.title} gap="sm">
          {[...t.lines, ...(demo && t.title === VOTES_TOPIC ? [DEMO_VOTING] : [])].map((l) => (
            <DsText key={l} v="body">
              {l}
            </DsText>
          ))}
        </Section>
      ))}
      <Section title="Still stuck?" gap="sm">
        <View>
          <ListRow title={SCREEN_TITLES.feedback} onPress={() => router.push({ pathname: '/feedback', params: { from: '/help' } })} />
          <RowDivider />
          <ListRow title="Support page" onPress={() => openLegal('support')} accessibilityHint="Opens in Safari" />
        </View>
      </Section>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  page: { padding: SPACING.screen, gap: SPACING.section, paddingBottom: SPACING.xxxl },
});

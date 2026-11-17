import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FadeUp, PulseRing } from '../components/motion';
import { Pin, type Glyph } from '../components/Pin';
import { ProfileForm } from '../components/ProfileForm';
import { Row, Txt } from '../components/ui';
import { DEMO_HOME, DEMO_REGION } from '../data/seed';
import { useStore } from '../lib/store';
import { C } from '../theme';

const PITCH: { glyph: Glyph; colour: string; text: string }[] = [
  { glyph: 'locked', colour: C.sodium, text: 'Meets and cruises that unlock for the people going, on the night.' },
  { glyph: 'track', colour: C.lime, text: 'Your garage, classed S to D on power-to-weight. Win covers and trophies.' },
  { glyph: 'drive', colour: C.neon, text: 'Great roads to drive and photo spots, rated by the scene. Never timed.' },
];

/** First run: the person sets up their own profile. The guard in _layout moves on once it's saved. */
export default function Welcome() {
  const { saveProfile } = useStore();
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      contentContainerStyle={{ padding: 16, paddingTop: insets.top + 28, paddingBottom: insets.bottom + 40, gap: 28 }}
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
        <Txt v="label">18+ only · Set up your profile to get invites near you</Txt>
      </View>
      <ProfileForm initial={{ handle: '', name: '', region: DEMO_REGION, home: DEMO_HOME }} submitLabel="Let's go" onSubmit={saveProfile} />
    </ScrollView>
  );
}

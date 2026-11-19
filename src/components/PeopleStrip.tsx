import { ScrollView, View } from 'react-native';
import type { User } from '../lib/types';
import { SPACING } from '../theme';
import { at, openProfile, personMark } from './Community';
import { Avatar, DsText, Press } from './ds';

const ITEM = 92;

/**
 * A row of people as car-photo avatars with their @handle (Review 19 #54): who's at your meets on
 * People, your connections under Chats. Scrolls sideways; a tap opens their profile.
 */
export function PeopleStrip({ people, label }: { people: readonly User[]; label: string }) {
  if (!people.length) return null;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      accessibilityLabel={label}
      style={{ marginHorizontal: -SPACING.screen }}
      contentContainerStyle={{ paddingHorizontal: SPACING.screen, gap: SPACING.sm }}
    >
      {people.map((u) => (
        <Press key={u.id} onPress={() => openProfile(u.id)} feedback="card" role="link" label={`${at(u)}'s profile`} style={{ width: ITEM, alignItems: 'center', gap: SPACING.xs }}>
          <Avatar {...personMark(u)} size="lg" />
          <View style={{ width: ITEM }}>
            <DsText v="meta" style={{ textAlign: 'center', wordBreak: 'break-word' } as never}>
              {at(u)}
            </DsText>
          </View>
        </Press>
      ))}
    </ScrollView>
  );
}

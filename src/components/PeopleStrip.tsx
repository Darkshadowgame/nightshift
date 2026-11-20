import { useState } from 'react';
import { View } from 'react-native';
import { ownBuilds } from '../lib/bringing';
import { useStore } from '../lib/store';
import type { User } from '../lib/types';
import { mainBuild, openProfile, PersonRow } from './Community';
import { Button, RowDivider } from './ds';

/**
 * People as car-photo rows (Review 20 #27): avatar (their main build's photo), @handle, the build
 * and its class, so who's at your meets on People and your connections under Chats read as cars
 * and fill the screen, not a strip of circles above an empty half. A tap opens their profile.
 * Long lists show the first few, then "Show all".
 */
export function PeopleStrip({ people, label, first = 5 }: { people: readonly User[]; label: string; first?: number }) {
  const { builds } = useStore();
  const [all, setAll] = useState(false);
  if (!people.length) return null;
  const shown = all ? people : people.slice(0, first);
  return (
    <View accessibilityLabel={label}>
      {shown.map((u, i) => (
        <View key={u.id}>
          {i ? <RowDivider inset /> : null}
          <PersonRow user={u} build={mainBuild(ownBuilds(u.id, builds))} onPress={() => openProfile(u.id)} />
        </View>
      ))}
      {people.length > shown.length ? (
        <Button label={`Show all ${people.length}`} tier="tertiary" size="sm" onPress={() => setAll(true)} />
      ) : null}
    </View>
  );
}

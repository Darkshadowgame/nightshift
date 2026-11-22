import { View } from 'react-native';
import type { RecentPlace } from '../lib/recents';
import { RECENTS_PRIVACY } from '../lib/recents';
import { SPACING, SPOT_COLOURS } from '../theme';
import { Button, DsText, IconButton, ListRow, Section, type Leading } from './ds';
import { COLOR } from '../theme';

/** A row with its own small remove control beside it (a pressable row can't hold a button). */
function Removable({ children, label, onRemove }: { children: React.ReactNode; label: string; onRemove: () => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <View style={{ flex: 1 }}>{children}</View>
      <IconButton icon="close" label={label} colour={COLOR.text.secondary} onPress={onRemove} />
    </View>
  );
}

/**
 * "Recent" on Search when nothing is typed: the last places opened (one tap goes straight back)
 * and the last searches (one tap runs it again). Each row can be removed; one quiet Clear recent
 * and one line saying where it is kept. Shown only when there is something to show.
 */
export function RecentSection({
  places,
  searches,
  distance,
  spotKind,
  onPlace,
  onSearch,
  onRemovePlace,
  onRemoveSearch,
  onClear,
}: {
  places: RecentPlace[];
  searches: string[];
  distance: (p: RecentPlace) => string | undefined;
  /** The kind of a Slipstream place, for its pin. */
  spotKind: (spotId: string) => keyof typeof SPOT_COLOURS | undefined;
  onPlace: (p: RecentPlace) => void;
  onSearch: (q: string) => void;
  onRemovePlace: (p: RecentPlace) => void;
  onRemoveSearch: (q: string) => void;
  onClear: () => void;
}) {
  if (!places.length && !searches.length) return null;
  return (
    <Section title="Recent" right={<Button label="Clear recent" tier="tertiary" size="sm" onPress={onClear} />}>
      {places.map((p) => {
        const kind = p.spotId ? spotKind(p.spotId) : undefined;
        const leading: Leading = kind ? { pin: kind, colour: SPOT_COLOURS[kind] } : { pin: 'destination', colour: COLOR.text.secondary };
        return (
          <Removable key={p.id} label={`Remove ${p.name} from recent`} onRemove={() => onRemovePlace(p)}>
            <ListRow leading={leading} title={p.name} subtitle={p.address || undefined} meta={distance(p)} chevron={false} onPress={() => onPlace(p)} accessibilityHint={p.spotId ? 'Opens it again' : 'Shows it here, with Go here'} />
          </Removable>
        );
      })}
      {searches.map((q) => (
        <Removable key={`q:${q}`} label={`Remove ‘${q}’ from recent searches`} onRemove={() => onRemoveSearch(q)}>
          <ListRow leading={{ icon: 'search' }} title={q} chevron={false} onPress={() => onSearch(q)} accessibilityLabel={`Search again for ${q}`} />
        </Removable>
      ))}
      <DsText v="caption">{RECENTS_PRIVACY}</DsText>
    </Section>
  );
}

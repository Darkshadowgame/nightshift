import { View } from 'react-native';
import { FAVOURITES_PRIVACY, MAX_LABEL, removeFavourite, renameFavourite, type Favourite } from '../lib/favourites';
import { SPACING } from '../theme';
import { Button, DsText, EmptyState, Sheet, TextField } from './ds';

/**
 * Manage favourites: rename (Home, Work, Sam's) or remove. Saving a place is the Save to
 * favourites button on a chosen place in Search. One line says where they are kept: this phone only.
 */
export function FavouritesSheet({ visible, favourites, onChange, onClose }: { visible: boolean; favourites: Favourite[]; onChange: (next: Favourite[]) => void; onClose: () => void }) {
  return (
    <Sheet visible={visible} title="Favourite places" onClose={onClose}>
      <DsText v="secondary">{FAVOURITES_PRIVACY}</DsText>
      {favourites.length === 0 ? (
        <EmptyState variant="inline" title="Search a place, then tap Save to favourites." />
      ) : (
        favourites.map((f) => (
          <View key={f.id} style={{ gap: SPACING.xs }}>
            <TextField value={f.label} maxLength={MAX_LABEL} onChangeText={(t) => onChange(renameFavourite(favourites, f.id, t))} accessibilityLabel={`Name for ${f.name}`} />
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: SPACING.sm }}>
              <DsText v="caption" numberOfLines={1} style={{ flex: 1 }}>
                {[f.name, f.address].filter(Boolean).join(', ')}
              </DsText>
              <Button label="Remove" tier="tertiary" size="sm" onPress={() => onChange(removeFavourite(favourites, f.id))} accessibilityLabel={`Remove ${f.label}`} />
            </View>
          </View>
        ))
      )}
    </Sheet>
  );
}

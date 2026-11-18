import { router } from 'expo-router';
import { View } from 'react-native';
import { EmptyState } from '../components/ds';
import { COLOR, SPACING } from '../theme';

/**
 * Any link the app doesn't know (REVIEW-9 decision 6): in the app's own style, with one way on.
 * Replaces Expo's developer "Unmatched Route" page.
 */
export default function NotFound() {
  return (
    <View style={{ flex: 1, backgroundColor: COLOR.surface.bg, padding: SPACING.screen, justifyContent: 'center' }}>
      <EmptyState
        title="This page doesn't exist"
        body="The link may be old, or mistyped."
        action={{ label: "See tonight's meets", onPress: () => router.replace('/') }}
      />
    </View>
  );
}

import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useCommunityQuery } from '../lib/communityStore';
import { COLOR, SPACING } from '../theme';
import { EmptyState, ErrorState, LoadingState } from './ds';

/**
 * Moderation screens are for staff (REVIEW-9 decision 7). Nothing of the screen (not even its
 * queries) runs until the server says this person is staff; everyone else gets "Staff only".
 */
export function StaffOnly({ children }: { children: ReactNode }) {
  const status = useCommunityQuery((s) => s.moderationStatus(), []);
  if (status.error) return <ErrorState variant="block" title={status.error} onRetry={status.reload} />;
  if (!status.data) return <LoadingState />;
  if (!status.data.isStaff) {
    return (
      <View style={{ flex: 1, padding: SPACING.screen, backgroundColor: COLOR.surface.bg, justifyContent: 'center' }}>
        <EmptyState
          title="Staff only"
          body="This page is for the Nightshift team. To report something, use Report on it."
          action={{ label: 'Go to Tonight', onPress: () => router.replace('/') }}
        />
      </View>
    );
  }
  return <>{children}</>;
}

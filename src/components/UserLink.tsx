import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, type StyleProp, type ViewStyle } from 'react-native';

export function openUser(id: string) {
  router.push({ pathname: '/user/[id]', params: { id } });
}

/** Wraps a name, row or card so tapping it opens that person's profile. */
export function UserLink({ id, children, style, label }: { id: string; children: ReactNode; style?: StyleProp<ViewStyle>; label?: string }) {
  return (
    <Pressable
      onPress={() => openUser(id)}
      accessibilityRole="link"
      accessibilityLabel={label}
      hitSlop={4}
      style={({ pressed }) => [style, pressed && { opacity: 0.7 }]}
    >
      {children}
    </Pressable>
  );
}

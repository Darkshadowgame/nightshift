import { useState } from 'react';
import { ActivityIndicator, Platform, TextInput, View } from 'react-native';
import { COLOR, ELEVATION, FONT_SCALE, RADII, SPACING } from '../../theme';
import { Icon } from './Icon';
import { Press } from './Press';
import { DsText, typeStyle } from './Text';

/**
 * The one search box: search icon left, spinner or clear right, 48 tall, pill. One per surface.
 * With `onOpen` (and no `onChangeText`) it's a read-only button that looks the same: the map's
 * search pill, which opens Find.
 */
export function SearchField({
  value = '',
  onChangeText,
  placeholder = 'Search',
  loading,
  onSubmit,
  autoFocus,
  onOpen,
  floating,
  accessibilityLabel,
}: {
  value?: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  loading?: boolean;
  onSubmit?: () => void;
  autoFocus?: boolean;
  /** Read-only: the whole field is a button that opens search. */
  onOpen?: () => void;
  /** Over the map: glass fill and the float shadow. */
  floating?: boolean;
  accessibilityLabel?: string;
}) {
  const [focused, setFocused] = useState(false);
  const shell = [
    {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: SPACING.sm,
      minHeight: 48,
      paddingLeft: SPACING.lg,
      paddingRight: SPACING.xs,
      borderRadius: RADII.pill,
      borderWidth: 1,
      borderColor: focused ? COLOR.action.selected : COLOR.surface.borderStrong,
      backgroundColor: floating ? COLOR.surface.glass : COLOR.surface.card,
    },
    floating ? ELEVATION.float : null,
  ];
  if (onOpen && !onChangeText) {
    return (
      <Press onPress={onOpen} haptic={floating ? 'tap' : 'none'} role="search" label={accessibilityLabel ?? placeholder} hint="Opens search" style={shell}>
        <Icon name="search" size={20} colour={COLOR.text.secondary} />
        <DsText v="input" tone={value ? 'primary' : 'secondary'} numberOfLines={1} style={{ flex: 1, paddingRight: SPACING.md }}>
          {value || placeholder}
        </DsText>
      </Press>
    );
  }
  return (
    <View style={shell}>
      <Icon name="search" size={20} colour={COLOR.text.secondary} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLOR.text.secondary}
        onSubmitEditing={onSubmit}
        autoFocus={autoFocus}
        returnKeyType="search"
        autoCorrect={false}
        clearButtonMode="never"
        accessibilityLabel={accessibilityLabel ?? placeholder}
        accessibilityRole="search"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        maxFontSizeMultiplier={FONT_SCALE.chrome}
        selectionColor={COLOR.action.primary}
        // The pill shows focus itself; the browser's square focus ring would sit inside it (web only).
        style={[typeStyle('input'), { flex: 1, minHeight: 46, paddingVertical: 0 }, Platform.OS === 'web' && { outlineWidth: 0 }]}
      />
      {loading ? (
        <View style={{ width: 44, alignItems: 'center' }} accessibilityLabel="Searching" accessibilityRole="progressbar">
          <ActivityIndicator size="small" color={COLOR.text.secondary} />
        </View>
      ) : value && onChangeText ? (
        <Press onPress={() => onChangeText('')} label="Clear search" style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="close" size={18} colour={COLOR.text.secondary} />
        </Press>
      ) : (
        <View style={{ width: SPACING.md }} />
      )}
    </View>
  );
}

import { useState } from 'react';
import { TextInput, View } from 'react-native';
import { COLOR, RADII, SPACING } from '../theme';
import { Button, DsText, Icon, INPUT, Press } from './ds';

export interface SelectOption {
  key: string;
  title: string;
  detail?: string;
}

/**
 * A searchable dropdown made from plain views (no native picker, so it ships
 * over the air). Closed it looks like a text field; open it shows a search box
 * and the matches. With `allowFree`, whatever was typed can be used as is.
 */
export function SearchSelect({
  label,
  value,
  placeholder,
  search,
  onPick,
  onFree,
  freeLabel = 'Use',
  disabled,
  max = 40,
}: {
  label: string;
  value: string;
  placeholder: string;
  /** Options for the typed query (empty query: the full list). */
  search: (query: string) => SelectOption[];
  onPick: (option: SelectOption) => void;
  /** Called with free text when the person uses what they typed. Omit to only allow listed options. */
  onFree?: (text: string) => void;
  freeLabel?: string;
  disabled?: boolean;
  max?: number;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const options = open ? search(query) : [];
  const shown = options.slice(0, max);
  const typed = query.trim();
  const exact = shown.some((o) => o.title.toLowerCase() === typed.toLowerCase());

  function close() {
    setOpen(false);
    setQuery('');
  }

  if (!open) {
    return (
      <Press
        onPress={() => setOpen(true)}
        disabled={disabled}
        label={`${label}: ${value || 'not set'}`}
        hint="Opens a searchable list"
        style={[INPUT, { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }, disabled && { borderColor: COLOR.surface.border }]}
      >
        <View style={{ flex: 1 }}>
          <DsText v="label">{label}</DsText>
          <DsText v="body" numberOfLines={1} style={{ color: value && !disabled ? COLOR.text.primary : COLOR.text.secondary }}>
            {value || placeholder}
          </DsText>
        </View>
        <View aria-hidden style={{ transform: [{ rotate: '90deg' }] }}>
          <Icon name="chevron" size={16} colour={COLOR.text.secondary} />
        </View>
      </Press>
    );
  }

  return (
    <View style={{ gap: SPACING.xs, borderWidth: 1, borderColor: COLOR.surface.borderStrong, borderRadius: RADII.card, padding: SPACING.sm, backgroundColor: COLOR.surface.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          autoFocus
          placeholder={`Search ${label.toLowerCase()}`}
          placeholderTextColor={COLOR.text.secondary}
          style={[INPUT, { flex: 1 }]}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="done"
          accessibilityLabel={`Search ${label}`}
          onSubmitEditing={() => {
            if (shown.length === 1) { onPick(shown[0]); close(); }
            else if (onFree && typed) { onFree(typed); close(); }
          }}
        />
        <Button label="Close" tier="tertiary" size="sm" onPress={close} accessibilityLabel={`Close ${label} list`} />
      </View>
      {onFree && typed && !exact ? (
        <Row
          title={`${freeLabel} “${typed}”`}
          detail="Not in the list? Use what you typed."
          accent
          onPress={() => { onFree(typed); close(); }}
        />
      ) : null}
      {shown.map((o) => (
        <Row key={o.key} title={o.title} detail={o.detail} on={o.title === value} onPress={() => { onPick(o); close(); }} />
      ))}
      {shown.length === 0 && !(onFree && typed) ? <DsText v="secondary" style={{ padding: SPACING.xs }}>Nothing matches.</DsText> : null}
      {options.length > shown.length ? (
        <DsText v="caption" style={{ padding: SPACING.xs }}>
          {options.length - shown.length} more. Keep typing to narrow it down.
        </DsText>
      ) : null}
    </View>
  );
}

function Row({ title, detail, on, accent, onPress }: { title: string; detail?: string; on?: boolean; accent?: boolean; onPress: () => void }) {
  return (
    <Press
      onPress={onPress}
      haptic="select"
      label={detail ? `${title}, ${detail}` : title}
      state={{ selected: !!on }}
      style={{
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.md,
        minHeight: 44,
        borderRadius: RADII.control,
        backgroundColor: on ? COLOR.action.selectedTint : COLOR.surface.card,
        borderWidth: 1,
        borderColor: on ? COLOR.text.primary : COLOR.surface.border,
      }}
    >
      <DsText v="bodyStrong" tone={accent || on ? 'action' : 'primary'}>
        {title}
      </DsText>
      {detail ? <DsText v="caption">{detail}</DsText> : null}
    </Press>
  );
}

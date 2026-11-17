import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { BRAND, C, F, FONT_SCALE, RADIUS, STATE, TYPE } from '../theme';
import { Txt, s as ui } from './ui';

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
      <Pressable
        onPress={() => !disabled && setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value || 'not set'}`}
        accessibilityHint="Opens a searchable list"
        accessibilityState={{ disabled: !!disabled }}
        style={({ pressed }) => [ui.input, { flexDirection: 'row', alignItems: 'center', gap: 8 }, (pressed || disabled) && { opacity: disabled ? 0.45 : 0.8 }]}
      >
        <View style={{ flex: 1 }}>
          <Text maxFontSizeMultiplier={FONT_SCALE.chrome} style={{ fontFamily: F.label, fontSize: TYPE.micro, letterSpacing: 1.2, color: C.fog, textTransform: 'uppercase' }}>{label}</Text>
          <Text style={{ fontFamily: F.body, fontSize: 16, color: value ? C.chalk : C.fog }} numberOfLines={1}>{value || placeholder}</Text>
        </View>
        <Text style={{ color: C.fog, fontSize: 14 }}>▾</Text>
      </Pressable>
    );
  }

  return (
    <View style={{ gap: 6, borderWidth: 1, borderColor: BRAND, borderRadius: RADIUS.card, padding: 8, backgroundColor: C.asphalt }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          autoFocus
          placeholder={`Search ${label.toLowerCase()}`}
          placeholderTextColor={C.fog}
          style={[ui.input, { flex: 1 }]}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="done"
          accessibilityLabel={`Search ${label}`}
          onSubmitEditing={() => {
            if (shown.length === 1) { onPick(shown[0]); close(); }
            else if (onFree && typed) { onFree(typed); close(); }
          }}
        />
        <Pressable onPress={close} hitSlop={10} accessibilityRole="button" accessibilityLabel={`Close ${label} list`}>
          <Txt v="label" style={{ color: BRAND }}>Close</Txt>
        </Pressable>
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
      {shown.length === 0 && !(onFree && typed) ? <Txt v="muted" style={{ padding: 6 }}>Nothing matches.</Txt> : null}
      {options.length > shown.length ? (
        <Txt v="caption" style={{ padding: 6 }}>{options.length - shown.length} more. Keep typing to narrow it down.</Txt>
      ) : null}
    </View>
  );
}

function Row({ title, detail, on, accent, onPress }: { title: string; detail?: string; on?: boolean; accent?: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={detail ? `${title}, ${detail}` : title}
      accessibilityState={{ selected: !!on }}
      style={({ pressed }) => [
        { paddingVertical: 9, paddingHorizontal: 10, minHeight: 44, borderRadius: RADIUS.card, backgroundColor: on ? `${STATE.selected}1f` : C.tarmac, borderWidth: 1, borderColor: on ? STATE.selected : C.kerb },
        pressed && { opacity: 0.7 },
      ]}
    >
      <Text style={{ fontFamily: F.bodyBold, fontSize: TYPE.body, color: accent || on ? BRAND : C.chalk }}>{title}</Text>
      {detail ? <Text style={{ fontFamily: F.body, fontSize: TYPE.caption, color: C.fog }}>{detail}</Text> : null}
    </Pressable>
  );
}

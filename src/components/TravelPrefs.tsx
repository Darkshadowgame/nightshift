import { useState } from 'react';
import { TextInput, View } from 'react-native';
import { ALERT_HINTS, ALERT_LABELS, parseMiles, TRAVEL_CHOICES, travelProblem, type AlertMode } from '../lib/discover';
import { COLOR, FONT_SCALE, RADII, SPACING } from '../theme';
import { ChoiceGroup, DsText, ErrorState, typeStyle } from './ds';

const MODES: AlertMode[] = ['notify', 'search', 'off'];

/**
 * "Willing to travel" and "New events near you" (Settings › Notifications, and
 * the profile form). Calls onChange only with values that pass the checks in discover.ts.
 */
export function TravelPrefs({
  miles,
  alerts,
  onChange,
}: {
  miles: number;
  alerts: AlertMode;
  onChange: (next: { travelMiles?: number; alerts?: AlertMode }) => void;
}) {
  const preset = (TRAVEL_CHOICES as readonly number[]).includes(miles);
  const [custom, setCustom] = useState(!preset);
  const [text, setText] = useState(preset ? '' : String(miles));
  const [problem, setProblem] = useState<string | null>(null);

  function typed(value: string) {
    setText(value);
    const n = parseMiles(value);
    const p = value.trim() === '' ? null : n === null ? 'Type a number of miles, like 40.' : travelProblem(n);
    setProblem(p);
    if (n !== null && !p) onChange({ travelMiles: n });
  }

  return (
    <View style={{ gap: SPACING.lg }}>
      <View style={{ gap: SPACING.xs }}>
        <ChoiceGroup
          label="Willing to travel"
          value={custom ? 'custom' : String(miles)}
          onChange={(k) => {
            if (k === 'custom') return setCustom(true);
            setCustom(false);
            setProblem(null);
            onChange({ travelMiles: Number(k) });
          }}
          options={[...TRAVEL_CHOICES.map((m) => ({ key: String(m), label: `${m} mi` })), { key: 'custom', label: custom && !problem && text ? `${miles} mi` : 'Custom' }]}
        />
        {custom ? (
          <TextInput
            value={text}
            onChangeText={typed}
            placeholder="Miles, 1 to 300"
            placeholderTextColor={COLOR.text.secondary}
            keyboardType="number-pad"
            returnKeyType="done"
            maxLength={3}
            maxFontSizeMultiplier={FONT_SCALE.chrome}
            style={[typeStyle('input'), { minHeight: 48, paddingHorizontal: SPACING.md, borderRadius: RADII.control, borderWidth: 1, borderColor: COLOR.surface.borderStrong, backgroundColor: COLOR.surface.card }]}
            accessibilityLabel="Willing to travel, in miles"
          />
        ) : null}
        {problem ? <ErrorState title={problem} /> : null}
        <DsText v="caption">How far you'd go for an event: which new events you hear about, and where Search › Events starts. Only you see it.</DsText>
      </View>
      <View style={{ gap: SPACING.xs }}>
        <ChoiceGroup label="New events near you" layout="list" value={alerts} onChange={(m) => onChange({ alerts: m })} options={MODES.map((m) => ({ key: m, label: ALERT_LABELS[m], hint: ALERT_HINTS[m] }))} />
        <DsText v="caption">Only events you can go to: your car or bike fits the invite, it's public, or it's a show or track day.</DsText>
      </View>
    </View>
  );
}

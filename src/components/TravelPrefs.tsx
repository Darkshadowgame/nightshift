import { useState } from 'react';
import { TextInput, View } from 'react-native';
import { ALERT_HINTS, ALERT_LABELS, parseMiles, TRAVEL_CHOICES, travelProblem, type AlertMode } from '../lib/discover';
import { C } from '../theme';
import { Chip, Row, Txt, s as ui } from './ui';

const MODES: AlertMode[] = ['notify', 'search', 'off'];

/**
 * "Willing to travel" and "New events near you". Used on the profile form and
 * on Me. Calls onChange only with values that pass the checks in discover.ts.
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
    <View style={{ gap: 14 }}>
      <View style={{ gap: 8 }}>
        <Txt>Willing to travel</Txt>
        <Txt v="muted">How far you'd go for a meet. It sets which new events you hear about and where Find events starts. Only you can see it.</Txt>
        <Row gap={6}>
          {TRAVEL_CHOICES.map((m) => (
            <Chip
              key={m}
              label={`${m} mi`}
              on={!custom && miles === m}
              onPress={() => {
                setCustom(false);
                setProblem(null);
                onChange({ travelMiles: m });
              }}
            />
          ))}
          <Chip label={custom && !problem && text ? `${miles} mi` : 'Custom'} on={custom} onPress={() => setCustom(true)} />
        </Row>
        {custom ? (
          <View style={{ gap: 4 }}>
            <TextInput
              value={text}
              onChangeText={typed}
              placeholder="Miles, 1 to 300"
              placeholderTextColor={C.fog}
              keyboardType="number-pad"
              returnKeyType="done"
              maxLength={3}
              style={ui.input}
              accessibilityLabel="Willing to travel, in miles"
            />
            {problem ? <Txt v="muted" style={{ color: C.alert }}>{problem}</Txt> : null}
          </View>
        ) : null}
      </View>

      <View style={{ gap: 8 }}>
        <Txt>New events near you</Txt>
        <Row gap={6}>
          {MODES.map((m) => (
            <Chip key={m} label={ALERT_LABELS[m]} on={alerts === m} onPress={() => onChange({ alerts: m })} />
          ))}
        </Row>
        <Txt v="muted">{ALERT_HINTS[alerts]}</Txt>
        <Txt v="muted" style={{ fontSize: 12 }}>
          Only events you can go to: your car or bike fits the invite, it's open to everyone, or it's a show or track day.
        </Txt>
      </View>
    </View>
  );
}

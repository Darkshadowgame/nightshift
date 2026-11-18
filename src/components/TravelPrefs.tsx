import { View } from 'react-native';
import { TRAVEL_CHOICES, type AlertMode } from '../lib/discover';
import { SPACING } from '../theme';
import { ChoiceGroup, SwitchRow } from './ds';

/**
 * "New meets within 25 mi" (Settings › Notifications, and the profile form; Redesign 2, 3.11):
 * one switch for the notification and one choice for how far. Off keeps the quiet mode (new meets
 * still get a tag in Search), so nothing is lost by turning it off.
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
  const choices: number[] = (TRAVEL_CHOICES as readonly number[]).includes(miles) ? [...TRAVEL_CHOICES] : [...TRAVEL_CHOICES, miles].sort((a, b) => a - b);
  return (
    <View style={{ gap: SPACING.md }}>
      <SwitchRow
        label={`New meets within ${miles} mi`}
        hint="When someone posts a meet your car can join."
        value={alerts === 'notify'}
        onValueChange={(on) => onChange({ alerts: on ? 'notify' : 'search' })}
      />
      <ChoiceGroup label="How far" value={String(miles)} onChange={(k) => onChange({ travelMiles: Number(k) })} options={choices.map((m) => ({ key: String(m), label: `${m} mi` }))} />
    </View>
  );
}

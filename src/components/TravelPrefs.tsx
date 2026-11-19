import { useState } from 'react';
import { TRAVEL_CHOICES, type AlertMode } from '../lib/discover';
import { ChoiceGroup, DsText, Sheet, SwitchRow } from './ds';

/**
 * "New meets within 25 mi" (Settings › Notifications; Redesign 2, 3.11): one row, said once
 * (Review 19 #51). The switch turns the notification on or off; the distance is the end of the
 * label, and tapping it opens How far. Off keeps the quiet mode (new meets still get a tag in
 * Search), so nothing is lost by turning it off.
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
  const [picking, setPicking] = useState(false);
  const choices: number[] = (TRAVEL_CHOICES as readonly number[]).includes(miles) ? [...TRAVEL_CHOICES] : [...TRAVEL_CHOICES, miles].sort((a, b) => a - b);
  return (
    <>
      <SwitchRow
        label="New meets within"
        pick={{ text: `${miles} mi`, onPress: () => setPicking(true), accessibilityLabel: `How far: ${miles} mi. Change` }}
        hint="When someone posts a meet your car can join."
        value={alerts === 'notify'}
        onValueChange={(on) => onChange({ alerts: on ? 'notify' : 'search' })}
      />
      {picking ? (
        <Sheet visible title="How far" onClose={() => setPicking(false)}>
          <DsText v="secondary">How far from home you would go for a meet.</DsText>
          <ChoiceGroup label="Distance" value={String(miles)} onChange={(k) => onChange({ travelMiles: Number(k) })} options={choices.map((m) => ({ key: String(m), label: `${m} mi` }))} />
        </Sheet>
      ) : null}
    </>
  );
}

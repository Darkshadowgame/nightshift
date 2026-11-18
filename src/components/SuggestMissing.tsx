import { useState } from 'react';
import { View } from 'react-native';
import { appNow } from '../lib/appClock';
import { makeSuggestion, type FeedbackScreen } from '../lib/feedbackQueue';
import { newId, useStore } from '../lib/store';
import { SPACING } from '../theme';
import { Button, Card, DsText, ErrorState, TextField } from './ds';

/**
 * "Suggest a missing car/bike or mod" (or a shop edit): a link that opens a two-field form and
 * queues the suggestion as feedback (kind idea) to be sent to the backend.
 */
export function SuggestMissing({
  screen,
  label,
  placeholder,
  context,
  notesPlaceholder = 'Notes (optional): year, engine, where to find the specs',
}: {
  screen: FeedbackScreen;
  label: string;
  placeholder: string;
  context?: string;
  notesPlaceholder?: string;
}) {
  const { queueFeedback } = useStore();
  const [open, setOpen] = useState(false);
  const [missing, setMissing] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  function send() {
    try {
      queueFeedback(makeSuggestion({ missing, notes, screen, context }, newId('fb'), appNow()));
      setSent(true);
      setOpen(false);
      setMissing('');
      setNotes('');
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Couldn’t save that.');
    }
  }

  if (!open) {
    return (
      <Button
        label={sent ? 'Thanks, noted. Suggest another' : label}
        tier="tertiary"
        size="sm"
        onPress={() => {
          setOpen(true);
          setSent(false);
        }}
        style={{ alignSelf: 'flex-start' }}
      />
    );
  }

  return (
    <Card>
      <DsText v="title">{label}</DsText>
      <TextField value={missing} onChangeText={setMissing} placeholder={placeholder} accessibilityLabel="What's missing" autoFocus />
      <TextField value={notes} onChangeText={setNotes} placeholder={notesPlaceholder} multiline multilineHeight={64} accessibilityLabel="Notes" />
      <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
        <View style={{ flex: 1 }}>
          <Button label="Send suggestion" tier="secondary" block onPress={send}/>
        </View>
        <Button
          label="Cancel"
          tier="tertiary"
          onPress={() => {
            setOpen(false);
            setError(null);
          }}
        />
      </View>
      {error ? <ErrorState title={error} /> : null}
      <DsText v="caption">It goes to the Nightshift team. With no signal it waits on your phone and goes later.</DsText>
    </Card>
  );
}

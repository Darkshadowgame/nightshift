import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { makeSuggestion, type FeedbackScreen } from '../lib/feedbackQueue';
import { newId, useStore } from '../lib/store';
import { BRAND, C } from '../theme';
import { Button, Card, InlineError, Row, Txt, s as ui } from './ui';

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
      queueFeedback(makeSuggestion({ missing, notes, screen, context }, newId('fb'), new Date()));
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
      <Pressable onPress={() => { setOpen(true); setSent(false); }} hitSlop={8} accessibilityRole="button" style={{ alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center' }}>
        <Txt v="label" style={{ color: BRAND }}>{sent ? 'Thanks, noted. Suggest another ›' : `${label} ›`}</Txt>
      </Pressable>
    );
  }

  return (
    <Card accent={BRAND}>
      <Txt v="h3">{label}</Txt>
      <TextInput value={missing} onChangeText={setMissing} placeholder={placeholder} placeholderTextColor={C.fog} style={ui.input} accessibilityLabel="What's missing" autoFocus />
      <TextInput
        value={notes}
        onChangeText={setNotes}
        placeholder={notesPlaceholder}
        placeholderTextColor={C.fog}
        style={[ui.input, { minHeight: 64, textAlignVertical: 'top' }]}
        multiline
        accessibilityLabel="Notes"
      />

      <Row style={{ flexWrap: 'nowrap' }}>
        <View style={{ flex: 1 }}>
          <Button label="Send suggestion" kind="secondary" onPress={send} />
        </View>
        <Button label="Cancel" kind="secondary" onPress={() => { setOpen(false); setError(null); }} />
      </Row>
      <InlineError message={error} />
      <Txt v="caption">It goes to the Nightshift team. With no signal it waits on your phone and goes later.</Txt>
    </Card>
  );
}

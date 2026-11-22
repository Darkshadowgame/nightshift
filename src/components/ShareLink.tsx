import { useState, type ReactNode } from 'react';
import { View } from 'react-native';
import { shareEnv, shareLink, type SharePayload } from '../lib/share';
import { SPACING } from '../theme';
import { Button, DsText, Sheet, TextField, useToast } from './ds';

/**
 * Share with a next step every time (Review 11, src/lib/share.ts): the share sheet, else "Link
 * copied", else a sheet with the link to copy by hand. Render `sheet` once on the screen.
 *
 *   const sharer = useShareLink();
 *   <Button label="Share" onPress={() => sharer.share(eventSharePayload(ev, when))} />
 *   {sharer.sheet}
 */
export function useShareLink(what: 'meet' | 'build' | 'group drive' = 'meet'): { share: (p: SharePayload) => Promise<void>; sheet: ReactNode } {
  const toast = useToast();
  const [manual, setManual] = useState<SharePayload | null>(null);
  const [copied, setCopied] = useState(false);

  async function share(p: SharePayload) {
    const result = await shareLink(p);
    if (result === 'copied') toast({ message: 'Link copied' });
    else if (result === 'manual') {
      setCopied(false);
      setManual(p);
    }
  }

  async function copyAgain() {
    const copy = manual ? shareEnv().copy : undefined;
    if (!manual || !copy) return;
    try {
      await copy(manual.url);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  const sheet = (
    <Sheet visible={!!manual} title={`Share this ${what}`} onClose={() => setManual(null)}>
      <View style={{ gap: SPACING.md }}>
        <DsText v="secondary">{`Copy the link and send it to people. It opens the ${what} in Slipstream.`}</DsText>
        <TextField value={manual?.url ?? ''} editable={false} selectTextOnFocus accessibilityLabel={`The ${what}'s link`} />
        {shareEnv().copy ? <Button block tier="secondary" label={copied ? 'Copied' : 'Copy link'} onPress={copyAgain} /> : null}
      </View>
    </Sheet>
  );
  return { share, sheet };
}

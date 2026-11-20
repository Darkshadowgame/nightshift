import { useState } from 'react';
import { CLASH_WORDS, goingClash } from '../lib/clash';
import { useNow } from '../lib/clock';
import { useStore } from '../lib/store';
import type { NightEvent } from '../lib/types';
import { ConfirmSheet } from './ds';

/**
 * Hosting at a time you're already going to something (Review 20 problem 2): a ConfirmSheet,
 * "You're going to Sunday coffee and cars then. Host anyway?", with Change time as the primary
 * (safe first, like the meet-ban warning) and Host anyway under it.
 *
 * `check(draft, onHost, onChange)` returns true when it asked (the caller stops there); Host anyway
 * calls `onHost`, Change time calls `onChange`.
 */
export function useClashCheck() {
  const { events, me } = useStore();
  const now = useNow();
  const [ask, setAsk] = useState<{ event: NightEvent; onHost: () => void; onChange: () => void } | null>(null);
  function check(draft: { start: Date; end?: Date | null; selfId?: string }, onHost: () => void, onChange: () => void): boolean {
    const event = goingClash(events, me, draft, now);
    if (!event) return false;
    setAsk({ event, onHost, onChange });
    return true;
  }
  const sheet = (
    <ConfirmSheet
      visible={ask !== null}
      title={CLASH_WORDS.title}
      message={ask ? CLASH_WORDS.message(ask.event.title) : ''}
      verb="Host"
      confirmLabel={CLASH_WORDS.confirm}
      cancelLabel={CLASH_WORDS.change}
      destructive={false}
      safeFirst
      onConfirm={() => {
        const a = ask;
        setAsk(null);
        a?.onHost();
      }}
      onCancel={() => {
        const a = ask;
        setAsk(null);
        a?.onChange();
      }}
      onDismiss={() => setAsk(null)}
    />
  );
  return { check, sheet };
}

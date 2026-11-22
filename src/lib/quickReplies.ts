/**
 * One-tap replies above a chat's keyboard. Plain words for the things people say on the way to a meet.
 * One calm row; it steps away as soon as you start typing, and when you can't send.
 */
export const QUICK_REPLIES: readonly string[] = ['On my way', 'Where are you parked?', 'Running late'];

/** Show the row only on an empty box in a chat you can send in. */
export function showQuickReplies(text: string, canSend: boolean): boolean {
  return canSend && text.trim().length === 0;
}

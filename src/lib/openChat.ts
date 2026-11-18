import { router } from 'expo-router';

/** The people screens a chat is started from: a profile, and the going list it was picked from. */
const PEOPLE = new Set(['user/[id]', 'event/going']);

type StackState = { index: number; routes: readonly { name: string; params?: object }[] };

/**
 * Open a 1-to-1 chat started from a profile (Review 15 decision 3). The profile, and the going list
 * it was opened from, are closed first, so the chat sits on the screen the journey started from (an
 * event page, Community, Search, Connections): one back returns there, and the tab is at most two
 * backs away, never four (event, going list, profile, chat). If that screen is already this chat
 * (its "View @handle" opened the profile), it just goes back to it.
 *
 * `state` is the root stack's state (`useNavigation().getState()` on a root screen).
 */
export function openChat(chatId: string, state: StackState | undefined): void {
  const href = { pathname: '/chat/[id]' as const, params: { id: chatId } };
  if (!state) return router.push(href);
  const n = screensClosed(state);
  const under = state.routes[state.index - n];
  if (n > 0) router.dismiss(n);
  const sameChat = under?.name === 'chat/[id]' && (under.params as { id?: string } | undefined)?.id === chatId;
  if (!sameChat) router.push(href);
}

/** How many screens `openChat` closes before opening the chat (for tests). */
export function screensClosed(state: StackState): number {
  let n = 0;
  while (state.index - n > 0 && PEOPLE.has(state.routes[state.index - n].name)) n++;
  return n;
}

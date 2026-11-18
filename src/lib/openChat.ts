import { router } from 'expo-router';

type StackState = { index: number; routes: readonly { name: string; params?: object }[] };

/**
 * Open a 1-to-1 chat started from a profile (Reviews 15 and 16). Only the profile closes first, so
 * the chat sits on the screen you picked the person from (the going list, Community, Search,
 * Connections): back from the chat goes there, never past it. The deepest path, event › going list
 * › chat, is three backs from its tab. If the screen under the profile is already this chat (its
 * "View @handle" opened the profile), it just goes back to it.
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

/** How many screens `openChat` closes before opening the chat (for tests): the profile, if it's on top. */
export function screensClosed(state: StackState): number {
  return state.index > 0 && state.routes[state.index].name === 'user/[id]' ? 1 : 0;
}

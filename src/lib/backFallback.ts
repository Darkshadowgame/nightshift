/**
 * Where Back goes on a screen with nothing behind it: opened from a link, a notification or the
 * web address bar (REVIEW-8 problem 2). Every pushed screen always has a back arrow; with no
 * history it goes to the tab the screen belongs to.
 *
 * - Events and places (event, drive or photo spot, shop, ban zone) → Tonight.
 * - People and what they post (profile, post, forum thread, chat, crew) → Community.
 * - Builds and rating builds → Garage.
 * - Your own settings, help and credits → Me.
 */
export type TabHref = '/' | '/community' | '/garage' | '/me';

const BY_ROUTE: Record<string, TabHref> = {
  // Who's going belongs to the meet, on Tonight.
  'event/going': '/',
  'user/[id]': '/community',
  'post/[id]': '/community',
  'post/new': '/community',
  'forum/index': '/community',
  'forum/[id]': '/community',
  'forum/new': '/community',
  'chat/[id]': '/community',
  'chat/new': '/community',
  'chat/info': '/community',
  'crew/[id]': '/community',
  'crew/new': '/community',
  crews: '/community',
  connections: '/community',
  'build/[id]': '/garage',
  'build/edit': '/garage',
  'build/power': '/garage',
  rate: '/garage',
  settings: '/me',
  account: '/me',
  help: '/me',
  credits: '/me',
  profile: '/me',
  feedback: '/me',
  moderation: '/me',
  'moderation-team': '/me',
  'moderation-log': '/me',
  'member/[id]': '/me',
};

/** The tab Back goes to when there's no screen to go back to. Anything not listed: Tonight. */
export function fallbackTab(routeName: string): TabHref {
  return BY_ROUTE[routeName] ?? '/';
}

/**
 * Routes that never get a back arrow: the entry screens and the tabs themselves. The driving view
 * hides its header (End leaves it); its not-found and "needs the app" pages show the header, so
 * they get the one back arrow, to Tonight with nothing behind (Review 11: no dead end).
 */
export const NO_BACK = new Set(['signin', 'welcome', '(tabs)', 'events']);

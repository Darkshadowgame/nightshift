/**
 * Expo Router adds a sitemap of every screen file at /_sitemap unless the app has its own. Ours is
 * the not-found screen, so no list of screens is reachable in any build (REVIEW-9 decision 6).
 */
export { default } from './+not-found';

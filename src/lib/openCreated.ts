import { router, type Href } from 'expo-router';

/**
 * After making something in a modal (a post, a thread, a chat, a crew, a place, an event): close
 * the modal and push the new thing, so Back returns to the list it was made from (REVIEW-8
 * problem 2). Replacing the modal left the new screen with no back arrow.
 */
export function openCreated(href: Href): void {
  if (router.canGoBack()) router.back();
  router.push(href);
}

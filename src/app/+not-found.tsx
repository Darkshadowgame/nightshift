import { NotFoundState } from '../components/Detail';

/**
 * Any link the app doesn't know (REVIEW-9 decision 6): in the app's own style, with one way on.
 * Replaces Expo's developer "Unmatched Route" page. The same block, glyph and position as every
 * other not-found screen (Review 16).
 */
export default function NotFound() {
  return <NotFoundState title="This page doesn't exist" message="The link may be old, or mistyped." />;
}

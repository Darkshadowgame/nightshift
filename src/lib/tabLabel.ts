import { typeStyle } from '../components/ds/Text';

/**
 * The label's text style without a colour. The bar paints each label with its tint (active or
 * inactive); a `color` key in the style, even `color: undefined`, overrides that tint, and on iOS an
 * undefined colour falls back to black, which vanished on the dark bar.
 */
export function tabLabelStyle() {
  const { color: _tint, ...rest } = typeStyle('tag');
  return { ...rest, lineHeight: 12 };
}

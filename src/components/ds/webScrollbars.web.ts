/**
 * The web preview's scroll bars (Review 12 decision 3). A desktop browser draws a classic scroll
 * bar down every scrolling page, over the right edge of hero photos, maps and cards (the event
 * page, a profile, Settings, the host form). The phone app's indicators are thin overlays that
 * fade; on web nothing may draw over a photo, so every scroll bar is hidden. Pages still scroll
 * with the wheel, the trackpad, touch and the keyboard.
 *
 * Imported once by the design system's index, so every screen gets it.
 */
export const WEB_SCROLLBAR_CSS = [
  '* { scrollbar-width: none; -ms-overflow-style: none; }',
  '*::-webkit-scrollbar { display: none; width: 0; height: 0; }',
].join('\n');

if (typeof document !== 'undefined' && !document.getElementById('ns-scrollbars')) {
  const el = document.createElement('style');
  el.id = 'ns-scrollbars';
  el.textContent = WEB_SCROLLBAR_CSS;
  document.head.appendChild(el);
}

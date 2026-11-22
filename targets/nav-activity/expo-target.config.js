/**
 * The lock screen and Dynamic Island turn-by-turn directions (an iOS Live Activity).
 * A widget extension made by @bacons/apple-targets at prebuild. No App Group, no push:
 * the app starts and updates it locally (modules/nav-live-activity), so it signs with any Apple ID.
 * @type {import('@bacons/apple-targets/app.plugin').Config}
 */
module.exports = {
  type: 'widget',
  name: 'SlipstreamDirections',
  displayName: 'Slipstream directions',
  // Live Activities need 16.1; this matches the app's own deployment target (checked at prebuild).
  deploymentTarget: '16.4',
  frameworks: ['SwiftUI', 'ActivityKit', 'WidgetKit'],
};

// Learn more: https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Big datasets ship as assets, not code (assets/data/*.nsdata, JSON inside), so an
// over-the-air update only downloads them again when the data changes.
config.resolver.assetExts.push('nsdata');

module.exports = config;

const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Disable Watchman to prevent macOS Downloads folder TCC permissions crash
config.resolver = {
  ...config.resolver,
  useWatchman: false,
};

module.exports = config;

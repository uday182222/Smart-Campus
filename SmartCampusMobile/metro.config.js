const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts = [
  ...(config.resolver.sourceExts || []),
  "js",
  "jsx",
  "ts",
  "tsx",
  "json",
  "mjs",
  "cjs",
];
config.resolver.unstable_enablePackageExports = false;

module.exports = withNativeWind(config, { input: "./global.css" });

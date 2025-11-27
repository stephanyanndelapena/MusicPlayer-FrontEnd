// metro.config.cjs
// CommonJS version for Expo projects that removes svg from assetExts
// and adds svg to sourceExts for react-native-svg-transformer.
// Use this file if you have "type": "module" in package.json or if metro.config.js
// causes "could not be loaded with Node.js" errors.

const { getDefaultConfig } = require('@expo/metro-config');

module.exports = (() => {
  const config = getDefaultConfig(__dirname);

  // Defensive: ensure resolver shape exists
  config.resolver = config.resolver || {};
  const assetExts = (config.resolver.assetExts || []).slice();
  const sourceExts = (config.resolver.sourceExts || []).slice();

  // Remove svg from assets and add to sources
  const svgIndex = assetExts.indexOf('svg');
  if (svgIndex !== -1) {
    assetExts.splice(svgIndex, 1);
  }
  if (!sourceExts.includes('svg')) {
    sourceExts.push('svg');
  }

  config.resolver.assetExts = assetExts;
  config.resolver.sourceExts = sourceExts;

  config.transformer = {
    ...(config.transformer || {}),
    babelTransformerPath: require.resolve('react-native-svg-transformer'),
  };

  return config;
})();
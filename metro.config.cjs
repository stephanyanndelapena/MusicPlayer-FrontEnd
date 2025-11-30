const { getDefaultConfig } = require('@expo/metro-config');

module.exports = (() => {
  const config = getDefaultConfig(__dirname);

  config.resolver = config.resolver || {};
  const assetExts = (config.resolver.assetExts || []).slice();
  const sourceExts = (config.resolver.sourceExts || []).slice();

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
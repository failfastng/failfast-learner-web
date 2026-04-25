module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // react-native-worklets-core/plugin MUST be listed last (SDK 54 requirement)
      'react-native-worklets-core/plugin',
    ],
  };
};

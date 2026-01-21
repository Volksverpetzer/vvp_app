module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      "babel-preset-expo",
      "@babel/preset-flow",
      "@babel/preset-typescript",
    ],
    plugins: [
      "react-native-reanimated/plugin",
      "@babel/plugin-transform-flow-strip-types",
    ],
  };
};

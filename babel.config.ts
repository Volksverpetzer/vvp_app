import type { ConfigAPI } from "@babel/core";

const createBabelConfig = (api: ConfigAPI) => {
  api.cache.forever();

  return {
    presets: [
      "babel-preset-expo",
      "@babel/preset-flow",
      "@babel/preset-typescript",
    ],
    plugins: [
      "@babel/plugin-transform-flow-strip-types",
      [
        "module-resolver",
        {
          root: ["./"],
          alias: {
            "#assets": "./assets",
            "#tests": "./__tests__",
            "#": "./src",
          },
        },
      ],
      "react-native-reanimated/plugin",
    ],
  };
};

export default createBabelConfig;

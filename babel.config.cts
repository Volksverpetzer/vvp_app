import type { ConfigAPI } from "@babel/core";

module.exports = (api: ConfigAPI) => {
  api.cache.forever();

  return {
    presets: ["babel-preset-expo"],
    plugins: [
      [
        "module-resolver",
        {
          root: ["./"],
          alias: {
            "#assets": "./assets",
            "#tests": "./__tests__",
            "#plugins": "./plugins",
            "#": "./src",
          },
        },
      ],
      "react-native-reanimated/plugin",
    ],
  };
};

import { getDefaultConfig } from "expo/metro-config";
import { resolve } from "metro-resolver";

const config = getDefaultConfig(__dirname);
const defaultResolveRequest = config.resolver.resolveRequest;

config.resolver = {
  ...config.resolver,
  resolveRequest: (context, moduleName, platform) => {
    if (platform === "web") {
      if (
        moduleName.startsWith("@stripe/stripe-react-native") ||
        moduleName === "@stripe/stripe-react-native"
      ) {
        return { type: "empty" };
      }

      if (
        moduleName.startsWith("expo-share-intent") ||
        moduleName === "expo-share-intent"
      ) {
        return { type: "empty" };
      }

      if (
        moduleName.includes(
          "react-native/Libraries/Utilities/codegenNativeCommands",
        )
      ) {
        return { type: "empty" };
      }

      if (
        moduleName.startsWith("rive-react-native") ||
        moduleName === "rive-react-native"
      ) {
        return { type: "empty" };
      }
    }

    if (defaultResolveRequest) {
      return defaultResolveRequest(context, moduleName, platform);
    }

    return resolve(context as never, moduleName, platform);
  },
};

export default config;

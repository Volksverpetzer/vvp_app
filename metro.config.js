const { getDefaultConfig } = require("expo/metro-config.js");

const config = getDefaultConfig(__dirname);

// Add web-specific resolver to handle native-only modules
config.resolver = {
  ...config.resolver,
  resolveRequest: (context, moduleName, platform) => {
    // If platform is web and the module is a native-only module, return an empty module
    if (platform === "web") {
      // Handle native-only Stripe SDK on web
      if (
        moduleName.startsWith("@stripe/stripe-react-native") ||
        moduleName === "@stripe/stripe-react-native"
      ) {
        return {
          type: "empty",
        };
      }

      // Handle native-only expo-share-intent on web
      if (
        moduleName.startsWith("expo-share-intent") ||
        moduleName === "expo-share-intent"
      ) {
        return {
          type: "empty",
        };
      }

      // Handle React Native native codegen commands
      if (
        moduleName.includes(
          "react-native/Libraries/Utilities/codegenNativeCommands",
        )
      ) {
        return {
          type: "empty",
        };
      }

      // Handle native-only Rive animations on web
      if (
        moduleName.startsWith("rive-react-native") ||
        moduleName === "rive-react-native"
      ) {
        return {
          type: "empty",
        };
      }
    }

    // Use default resolution for everything else
    return context.resolveRequest(context, moduleName, platform);
  },
};

module.exports = config;

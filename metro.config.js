const { getDefaultConfig } = require("expo/metro-config.js");
const { resolve } = require("metro-resolver");

const config = getDefaultConfig(__dirname);

// Capture the default resolver before overriding
const defaultResolveRequest = config.resolver.resolveRequest;

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

    // Use the captured default resolver if it exists, otherwise fall back to metro-resolver's resolve
    if (defaultResolveRequest) {
      return defaultResolveRequest(context, moduleName, platform);
    }
    return resolve(context, moduleName, platform);
  },
};

module.exports = config;

module.exports = {
  dependencies: {
    ...(process.env.BUILD_FLAVOR === "fdroid" && {
      "@stripe/stripe-react-native": {
        platforms: { android: null },
      },
      "expo-notifications": {
        platforms: { android: null },
      },
    }),
  },
};

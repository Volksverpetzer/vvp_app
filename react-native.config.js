module.exports = {
  dependencies: {
    ...(process.env.BUILD_FOSS_ONLY === "true" && {
      "@stripe/stripe-react-native": {
        platforms: { android: null },
      },
      "expo-notifications": {
        platforms: { android: null },
      },
    }),
  },
};

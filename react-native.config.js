module.exports = {
  dependencies: {
    ...(process.env.IS_FOSS === "true" && {
      "@stripe/stripe-react-native": {
        platforms: { android: null },
      },
      "expo-notifications": {
        platforms: { android: null },
      },
    }),
  },
};

module.exports = {
  preset: "jest-expo",
  testEnvironment: "node",
  testEnvironmentOptions: {},
  transformIgnorePatterns: [], // transform everything to strip Flow types
  transform: {
    "^.+\\.(js|jsx|ts|tsx)$": "babel-jest",
  },
  setupFilesAfterEnv: ["<rootDir>/jest-setup.js"],
  testPathIgnorePatterns: ["<rootDir>/__tests__/mocks/"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  collectCoverage: true,
  collectCoverageFrom: [
    "**/*.{ts,tsx}",
    "!**/coverage/**",
    "!**/node_modules/**",
    "!**/babel.config.js",
    "!**/jest.setup.js",
  ],
  moduleNameMapper: {
    // Maps '@/' to the root directory
    "^#/(.*)$": "<rootDir>/$1",
  },
};

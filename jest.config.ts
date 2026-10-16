import type { Config } from "@jest/types";

const config: Config.InitialOptions = {
  preset: "jest-expo",
  testEnvironment: "node",
  testEnvironmentOptions: {},
  transformIgnorePatterns: [],
  transform: {
    "^.+\\.(js|jsx|ts|tsx)$": "babel-jest",
  },
  setupFilesAfterEnv: ["<rootDir>/jest-setup.ts"],
  // The first test in a file also pays for babel-transforming its imports; on
  // a cold cache and the 1-vCPU ubuntu-slim release runner that alone can
  // exceed the default 5 s.
  testTimeout: 15000,
  testPathIgnorePatterns: ["<rootDir>/__tests__/mocks/"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  collectCoverage: true,
  collectCoverageFrom: [
    "**/*.{ts,tsx}",
    "!**/coverage/**",
    "!**/node_modules/**",
    "!**/babel.config.cts",
    "!**/jest-setup.ts",
  ],
  moduleNameMapper: {
    "^#/constants/GlobalStyles$":
      "<rootDir>/__tests__/mocks/GlobalStylesMock.ts",
    "^#/(.*)$": "<rootDir>/src/$1",
  },
};

export default config;

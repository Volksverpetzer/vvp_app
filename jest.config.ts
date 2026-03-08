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
  testPathIgnorePatterns: ["<rootDir>/__tests__/mocks/"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  collectCoverage: true,
  collectCoverageFrom: [
    "**/*.{ts,tsx}",
    "!**/coverage/**",
    "!**/node_modules/**",
    "!**/babel.config.ts",
    "!**/jest-setup.ts",
  ],
  moduleNameMapper: {
    "^#/(.*)$": "<rootDir>/$1",
  },
};

export default config;

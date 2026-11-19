import type { Config } from "@jest/types";

const config: Config.InitialOptions = {
  preset: "jest-expo",
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
  // Claude Code sessions keep git worktrees (each a full checkout with its own
  // __tests__ and node_modules) under .claude/worktrees/. Without these
  // ignores, `pnpm test` in the main checkout also runs every worktree's
  // copy of the suite, which fails against the wrong node_modules.
  testPathIgnorePatterns: ["<rootDir>/__tests__/mocks/", "<rootDir>/.claude/"],
  modulePathIgnorePatterns: ["<rootDir>/.claude/"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  collectCoverage: true,
  collectCoverageFrom: [
    "**/*.{ts,tsx}",
    "!**/coverage/**",
    "!**/node_modules/**",
    "!**/.claude/**",
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

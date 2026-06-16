import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";

// Prevent ts-node from registering TypeScript hooks in the Jest environment
jest.mock("ts-node/register", () => ({}));

type ConfigFn = (ctx: { config: object }) => { extra: Record<string, unknown> };

describe("app.config extra", () => {
  beforeEach(() => {
    jest.resetModules();
    process.env.APP = "volksverpetzer";
  });

  afterEach(() => {
    delete process.env.BUILD_FOSS_ONLY;
    delete process.env.APP;
  });

  function loadConfig(): { extra: Record<string, unknown> } {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { default: fn } = require("../app.config") as { default: ConfigFn };
    return fn({ config: {} });
  }

  describe("FOSS build (BUILD_FOSS_ONLY=true)", () => {
    beforeEach(() => {
      process.env.BUILD_FOSS_ONLY = "true";
    });

    it("disables analytics", () => {
      expect(loadConfig().extra.enableAnalytics).toBe(false);
    });

    it("marks build as FOSS", () => {
      expect(loadConfig().extra.isFoss).toBe(true);
    });
  });

  describe("non-FOSS build (BUILD_FOSS_ONLY unset)", () => {
    it("preserves enableAnalytics from variant config", () => {
      expect(loadConfig().extra.enableAnalytics).toBe(true);
    });

    it("marks build as non-FOSS", () => {
      expect(loadConfig().extra.isFoss).toBe(false);
    });
  });
});

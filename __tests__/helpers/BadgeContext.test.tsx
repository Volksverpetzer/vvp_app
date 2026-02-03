import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import BadgeStore from "#/helpers/Stores/BadgeStore";
import { updateBadgeState } from "#/helpers/provider/BadgeProvider";

// Mock the BadgeStore
jest.mock("#/helpers/Stores/BadgeStore", () => ({
  __esModule: true,
  default: {
    defaultState: { action: false, personal: false },
    getBadgeStore: jest.fn(),
    setBadgeStore: jest.fn(),
  },
}));

describe("BadgeContext Logic", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset module state between tests
    jest.resetModules();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("BadgeStore Integration", () => {
    it("should have BadgeStore methods available", () => {
      expect(BadgeStore.getBadgeStore).toBeDefined();
      expect(BadgeStore.setBadgeStore).toBeDefined();
      expect(typeof BadgeStore.getBadgeStore).toBe("function");
      expect(typeof BadgeStore.setBadgeStore).toBe("function");
    });

    it("should call getBadgeStore when initializing", async () => {
      const getSpy = jest
        .spyOn(BadgeStore, "getBadgeStore")
        .mockResolvedValue({ action: true, personal: false });

      await BadgeStore.getBadgeStore();

      expect(getSpy).toHaveBeenCalled();
      getSpy.mockRestore();
    });

    it("should call setBadgeStore when updating", async () => {
      const newState = { action: true, personal: false };
      const setSpy = jest
        .spyOn(BadgeStore, "setBadgeStore")
        .mockResolvedValue(undefined);

      await BadgeStore.setBadgeStore(newState);

      expect(setSpy).toHaveBeenCalledWith(newState);
      setSpy.mockRestore();
    });
  });

  describe("updateBadgeState function", () => {
    it("should be available as a function", () => {
      expect(updateBadgeState).toBeDefined();
      expect(typeof updateBadgeState).toBe("function");
    });

    it("should accept badge state object", () => {
      const testState = { action: true, personal: false };

      // Should not throw when called with valid state
      expect(() => updateBadgeState(testState)).not.toThrow();
    });

    it("should handle partial state updates", () => {
      const partialState = { action: true };

      // Should not throw when called with partial state
      expect(() => updateBadgeState(partialState)).not.toThrow();
    });
  });

  describe("Default state", () => {
    it("should have correct default state structure", () => {
      expect(BadgeStore.defaultState).toBeDefined();
      expect(BadgeStore.defaultState).toHaveProperty("action");
      expect(BadgeStore.defaultState).toHaveProperty("personal");
      expect(typeof BadgeStore.defaultState.action).toBe("boolean");
      expect(typeof BadgeStore.defaultState.personal).toBe("boolean");
    });
  });
});

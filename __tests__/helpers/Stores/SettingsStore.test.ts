import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import BaseStore from "#/helpers/Storage";
import SettingsStore from "#/helpers/Stores/SettingsStore";

jest.mock("#/helpers/Storage", () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    parseJSON: jest.fn(),
  },
}));

describe("SettingsStore", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("defaultAdvancedSettings", () => {
    it("should include Plausible analytics toggle and default it to enabled", () => {
      expect(SettingsStore.defaultAdvancedSettings).toHaveProperty(
        "plausibleAnalytics",
      );
      expect(
        SettingsStore.defaultAdvancedSettings.plausibleAnalytics.value,
      ).toBe(true);
    });
  });

  describe("getAdvancedSettings", () => {
    it("should backfill plausibleAnalytics when older settings are loaded", async () => {
      const oldAdvancedSettings = {
        advancedReporting: { value: false, name: "Erweitertes Reporting" },
        alwaysDarkMode: { value: true, name: "Immer Dark Mode" },
      };

      jest.spyOn(BaseStore, "getItem").mockResolvedValue("{}");
      jest
        .spyOn(BaseStore, "parseJSON")
        .mockReturnValue(oldAdvancedSettings as never);

      const result = await SettingsStore.getAdvancedSettings();

      expect(BaseStore.getItem).toHaveBeenCalledWith("advancedSettings");
      expect(result.plausibleAnalytics.value).toBe(true);
    });
  });
});

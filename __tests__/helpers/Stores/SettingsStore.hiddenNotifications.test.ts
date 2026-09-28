import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import BaseStore from "#/helpers/Storage";
import SettingsStore from "#/helpers/Stores/SettingsStore";

jest.mock("#/constants/Config", () => ({
  __esModule: true,
  default: {
    feeds: {},
    hiddenNotifications: ["new_fact_check", "new_pruefpunkt"],
  },
}));

jest.mock("#/helpers/Storage", () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    parseJSON: jest.fn(),
  },
}));

describe("SettingsStore with hidden notification types", () => {
  beforeEach(() => jest.clearAllMocks());

  it("defaults hidden types to off and visible ones to on", () => {
    const defaults = SettingsStore.defaultNotificationSettings;
    expect(defaults.new_post.value).toBe(true);
    expect(defaults.new_fact_check.value).toBe(false);
    expect(defaults.new_pruefpunkt.value).toBe(false);
  });

  it("forces hidden types off even when an earlier build stored true", async () => {
    const stored = {
      new_post: { value: true, name: "Neuer Artikel" },
      new_fact_check: { value: true, name: "Neuer Faktencheck" },
      new_pruefpunkt: { value: true, name: "Neuer Prüfpunkt Artikel" },
    };
    jest.spyOn(BaseStore, "getItem").mockResolvedValue(JSON.stringify(stored));
    jest.spyOn(BaseStore, "parseJSON").mockReturnValue(stored);

    const result = await SettingsStore.getNotificationSettings();

    expect(result.new_post.value).toBe(true);
    expect(result.new_fact_check.value).toBe(false);
    expect(result.new_pruefpunkt.value).toBe(false);
  });
});

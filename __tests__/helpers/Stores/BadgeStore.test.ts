import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import BaseStore from "#/helpers/Storage";
import BadgeStore from "#/helpers/Stores/BadgeStore";

jest.mock("#/helpers/Storage", () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    parseJSON: jest.fn(),
  },
}));

describe("BadgeStore", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("setBadgeStore", () => {
    it("saves badge state as JSON string", async () => {
      const state = { action: true, personal: false };
      await BadgeStore.setBadgeStore(state);
      expect(BaseStore.setItem).toHaveBeenCalledWith(
        "badge",
        JSON.stringify(state),
      );
    });

    it("handles errors gracefully", async () => {
      jest
        .spyOn(BaseStore, "setItem")
        .mockRejectedValue(new Error("Storage error"));
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      await BadgeStore.setBadgeStore({ action: true, personal: true });
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error saving badge state:",
        expect.any(Error),
      );
      consoleSpy.mockRestore();
    });
  });

  describe("getBadgeStore", () => {
    it("returns parsed badge state", async () => {
      const stored = { action: true, personal: false };
      jest
        .spyOn(BaseStore, "getItem")
        .mockResolvedValue(JSON.stringify(stored));
      jest.spyOn(BaseStore, "parseJSON").mockReturnValue(stored);

      const result = await BadgeStore.getBadgeStore();

      expect(BaseStore.getItem).toHaveBeenCalledWith("badge");
      expect(result).toEqual(stored);
    });

    it("returns default state when storage is empty", async () => {
      jest.spyOn(BaseStore, "getItem").mockResolvedValue(null);
      jest
        .spyOn(BaseStore, "parseJSON")
        .mockReturnValue({ action: false, personal: false });

      const result = await BadgeStore.getBadgeStore();

      expect(result).toEqual({ action: false, personal: false });
    });

    it("returns default state on error", async () => {
      jest
        .spyOn(BaseStore, "getItem")
        .mockRejectedValue(new Error("Storage error"));
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const result = await BadgeStore.getBadgeStore();

      expect(result).toEqual({ action: false, personal: false });
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error retrieving badge state:",
        expect.any(Error),
      );
      consoleSpy.mockRestore();
    });
  });
});

import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import BaseStore from "#/helpers/Storage";
import StatisticsStore from "#/helpers/Stores/StatisticsStore";

jest.mock("#/helpers/Storage", () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    parseJSON: jest.fn(),
  },
}));

const defaultStats = { streak: 0, lastDate: 0, count: 0 };

describe("StatisticsStore", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("getStatistics", () => {
    it("retrieves statistics for a given key", async () => {
      const stats = { streak: 5, lastDate: 1700000000, count: 42 };
      jest.spyOn(BaseStore, "getItem").mockResolvedValue(JSON.stringify(stats));
      jest.spyOn(BaseStore, "parseJSON").mockReturnValue(stats);

      const result = await StatisticsStore.getStatistics("articlesRead");

      expect(BaseStore.getItem).toHaveBeenCalledWith("articlesRead");
      expect(result).toEqual(stats);
    });

    it("returns default stats when storage is empty", async () => {
      jest.spyOn(BaseStore, "getItem").mockResolvedValue(null);
      jest.spyOn(BaseStore, "parseJSON").mockReturnValue(defaultStats);

      const result = await StatisticsStore.getStatistics("appOpened");

      expect(result).toEqual(defaultStats);
    });

    it("returns default stats on error", async () => {
      jest
        .spyOn(BaseStore, "getItem")
        .mockRejectedValue(new Error("Storage error"));
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const result = await StatisticsStore.getStatistics("articlesShared");

      expect(result).toEqual(defaultStats);
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error retrieving statistics:",
        expect.any(Error),
      );
      consoleSpy.mockRestore();
    });
  });

  describe("setStatistics", () => {
    it("stores statistics as JSON for the given key", async () => {
      const stats = { streak: 3, lastDate: 1700000000, count: 10 };
      await StatisticsStore.setStatistics("sourcesChecked", stats);
      expect(BaseStore.setItem).toHaveBeenCalledWith(
        "sourcesChecked",
        JSON.stringify(stats),
      );
    });

    it("handles errors gracefully", async () => {
      jest
        .spyOn(BaseStore, "setItem")
        .mockRejectedValue(new Error("Storage error"));
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      await StatisticsStore.setStatistics("articlesRead", defaultStats);

      expect(consoleSpy).toHaveBeenCalledWith(
        "Error saving statistics:",
        expect.any(Error),
      );
      consoleSpy.mockRestore();
    });
  });
});

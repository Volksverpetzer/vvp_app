import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import { Achievements } from "#/helpers/Achievements";
import Statistics from "#/helpers/Statistics";
import StatisticsStore from "#/helpers/Stores/StatisticsStore";

// Mock dependencies
jest.mock("../../src/helpers/Stores/StatisticsStore", () => ({
  __esModule: true,
  default: {
    getStatistics: jest.fn(),
    setStatistics: jest.fn(),
    keys: {
      appOpened: "appOpened",
      articlesRead: "articlesRead",
      articlesShared: "articlesShared",
      sourcesChecked: "sourcesChecked",
    },
  },
}));

jest.mock("../../src/helpers/Achievements", () => ({
  __esModule: true,
  Achievements: {
    setAchievementValue: jest.fn(),
  },
}));

describe("Statistics", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset date mocking
    jest.useRealTimers();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("updateData", () => {
    it("should increment streak count", async () => {
      // Setup
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 8); // just over a week ago

      const mockStreak = {
        count: 5,
        streak: 2,
        lastDate: oldDate.getTime(),
      };
      jest
        .spyOn(StatisticsStore, "getStatistics")
        .mockResolvedValue({ ...mockStreak });

      // Execute
      await Statistics.countArticleRead();

      // Assert
      expect(StatisticsStore.getStatistics).toHaveBeenCalledWith(
        StatisticsStore.keys.articlesRead,
      );
      expect(StatisticsStore.setStatistics).toHaveBeenCalledWith(
        StatisticsStore.keys.articlesRead,
        expect.objectContaining({
          count: 6, // Incremented
          streak: 3, // Incremented because over a week
        }),
      );
    });

    it("should reset streak if last date is more than two weeks ago", async () => {
      // Setup
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 15); // more than two weeks ago

      const mockStreak = {
        count: 5,
        streak: 10,
        lastDate: oldDate.getTime(),
      };
      jest
        .spyOn(StatisticsStore, "getStatistics")
        .mockResolvedValue({ ...mockStreak });

      // Execute
      await Statistics.countArticleRead();

      // Assert
      expect(StatisticsStore.setStatistics).toHaveBeenCalledWith(
        StatisticsStore.keys.articlesRead,
        expect.objectContaining({
          count: 6, // Incremented
          streak: 1, // Reset to 1
        }),
      );
    });

    it("should trigger achievement when app opened streak reaches 4", async () => {
      // Setup
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 8); // just over a week ago
      const mockStreak = {
        count: 10,
        streak: 3,
        lastDate: oldDate.getTime(),
      };
      jest
        .spyOn(StatisticsStore, "getStatistics")
        .mockResolvedValue({ ...mockStreak });

      // Execute
      await Statistics.countAppOpened();

      // Assert
      expect(StatisticsStore.setStatistics).toHaveBeenCalledWith(
        StatisticsStore.keys.appOpened,
        expect.objectContaining({
          streak: 4,
        }),
      );
      expect(Achievements.setAchievementValue).toHaveBeenCalledWith(
        "connaisseur",
      );
    });

    it("should not trigger achievement for non-app opened streaks", async () => {
      // Setup
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 8); // just over a week ago
      const mockStreak = {
        count: 10,
        streak: 3,
        lastDate: oldDate.getTime(),
      };
      jest
        .spyOn(StatisticsStore, "getStatistics")
        .mockResolvedValue({ ...mockStreak });

      // Execute
      await Statistics.countArticleRead();

      // Assert
      expect(Achievements.setAchievementValue).not.toHaveBeenCalled();
    });

    it("should not trigger achievement if app opened streak is not exactly 4", async () => {
      // Setup
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 8); // just over a week ago
      const mockStreak = {
        count: 10,
        streak: 4, // Already at 4, will become 5
        lastDate: oldDate.getTime(),
      };
      jest
        .spyOn(StatisticsStore, "getStatistics")
        .mockResolvedValue({ ...mockStreak });

      // Execute
      await Statistics.countAppOpened();

      // Assert
      expect(StatisticsStore.setStatistics).toHaveBeenCalledWith(
        StatisticsStore.keys.appOpened,
        expect.objectContaining({
          streak: 5,
        }),
      );
      expect(Achievements.setAchievementValue).not.toHaveBeenCalled();
    });
  });

  describe("countArticleRead", () => {
    it("should call updateData with articlesRead key", async () => {
      // Setup
      const updateDataSpy = jest
        .spyOn(Statistics, "updateData")
        .mockResolvedValue(undefined);

      // Execute
      await Statistics.countArticleRead();

      // Assert
      expect(updateDataSpy).toHaveBeenCalledWith(
        StatisticsStore.keys.articlesRead,
      );
    });
  });

  describe("countArticleShared", () => {
    it("should call updateData with articlesShared key", async () => {
      // Setup
      const updateDataSpy = jest
        .spyOn(Statistics, "updateData")
        .mockResolvedValue(undefined);

      // Execute
      await Statistics.countArticleShared();

      // Assert
      expect(updateDataSpy).toHaveBeenCalledWith(
        StatisticsStore.keys.articlesShared,
      );
    });
  });

  describe("countSourceChecked", () => {
    it("should call updateData with sourcesChecked key", async () => {
      // Setup
      const updateDataSpy = jest
        .spyOn(Statistics, "updateData")
        .mockResolvedValue(undefined);

      // Execute
      await Statistics.countSourceChecked();

      // Assert
      expect(updateDataSpy).toHaveBeenCalledWith(
        StatisticsStore.keys.sourcesChecked,
      );
    });
  });

  describe("countAppOpened", () => {
    it("should call updateData with appOpened key and a condition function", async () => {
      // Setup
      const updateDataSpy = jest
        .spyOn(Statistics, "updateData")
        .mockResolvedValue(undefined);

      // Execute
      await Statistics.countAppOpened();

      // Assert
      expect(updateDataSpy).toHaveBeenCalledWith(
        StatisticsStore.keys.appOpened,
        expect.any(Function),
      );
    });
  });

  describe("getAllStatistics", () => {
    it("should retrieve all statistics and return them as an object", async () => {
      // Setup
      const mockStreaks = {
        [StatisticsStore.keys.appOpened]: {
          count: 10,
          streak: 5,
          lastDate: new Date().getTime(),
        },
        [StatisticsStore.keys.articlesRead]: {
          count: 20,
          streak: 3,
          lastDate: new Date().getTime(),
        },
        [StatisticsStore.keys.articlesShared]: {
          count: 5,
          streak: 1,
          lastDate: new Date().getTime(),
        },
        [StatisticsStore.keys.sourcesChecked]: {
          count: 15,
          streak: 2,
          lastDate: new Date().getTime(),
        },
      };

      // Mock getStatistics to return the appropriate statistic based on the key
      jest
        .spyOn(StatisticsStore, "getStatistics")
        .mockImplementation((key) => Promise.resolve(mockStreaks[key]));

      // Execute
      const result = await Statistics.getAllStatistics();

      // Assert
      expect(StatisticsStore.getStatistics).toHaveBeenCalledTimes(4);
      expect(StatisticsStore.getStatistics).toHaveBeenCalledWith(
        StatisticsStore.keys.appOpened,
      );
      expect(StatisticsStore.getStatistics).toHaveBeenCalledWith(
        StatisticsStore.keys.articlesRead,
      );
      expect(StatisticsStore.getStatistics).toHaveBeenCalledWith(
        StatisticsStore.keys.articlesShared,
      );
      expect(StatisticsStore.getStatistics).toHaveBeenCalledWith(
        StatisticsStore.keys.sourcesChecked,
      );

      // Check that the result matches our mock data
      expect(result).toEqual(mockStreaks);
    });
  });
});

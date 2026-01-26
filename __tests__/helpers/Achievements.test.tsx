import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import * as Haptics from "expo-haptics";
import Toast from "react-native-toast-message";

import { AchievementConfig, Achievements } from "#/helpers/Achievements";
import { updateBadgeState } from "#/helpers/BadgeContext";
import AchievementStore from "#/helpers/Stores/AchievementStore";

jest.mock("../../src/helpers/Stores/AchievementStore", () => ({
  __esModule: true,
  default: {
    getLevel: jest.fn(),
    getAchievementValue: jest.fn(),
    setLevel: jest.fn(),
    setAchievementValue: jest.fn(),
  },
}));

jest.mock("react-native-toast-message", () => ({
  __esModule: true,
  default: {
    show: jest.fn(),
  },
}));

jest.mock("expo-haptics", () => ({
  __esModule: true,
  notificationAsync: jest.fn(),
}));

jest.mock("../../src/helpers/BadgeContext", () => ({
  __esModule: true,
  updateBadgeState: jest.fn(),
}));

describe("Achievements", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getCurrentAchievements", () => {
    it("returns current achievements without leveling up when not all tasks are completed", async () => {
      const taskKeys = Object.keys(AchievementConfig[0].tasks);
      jest.spyOn(AchievementStore, "getLevel").mockResolvedValue(0);
      jest
        .spyOn(AchievementStore, "getAchievementValue")
        .mockResolvedValue(false);

      const result = await Achievements.getCurrentAchievements();

      expect(AchievementStore.getLevel).toHaveBeenCalled();
      expect(AchievementStore.setLevel).not.toHaveBeenCalled();
      expect(result.level).toBe(0);
      for (const key of taskKeys) {
        expect(result.tasks[key].value).toBe(false);
      }
    });

    it("levels up when all tasks are completed", async () => {
      const nextLevel = 1;
      jest.spyOn(AchievementStore, "getLevel").mockResolvedValue(0);
      jest
        .spyOn(AchievementStore, "getAchievementValue")
        .mockResolvedValue(true);

      jest.useFakeTimers();
      const promise = Achievements.getCurrentAchievements();
      jest.runAllTimers();
      const result = await promise;

      expect(AchievementStore.setLevel).toHaveBeenCalledWith(nextLevel);
      expect(result.level).toBe(nextLevel);
      jest.useRealTimers();
    });
  });

  describe("setAchievementValue", () => {
    it("sets a new achievement, shows toast and updates badge", async () => {
      const key = Object.keys(AchievementConfig[0].tasks)[0];
      jest.spyOn(AchievementStore, "getLevel").mockResolvedValue(0);
      jest
        .spyOn(AchievementStore, "getAchievementValue")
        .mockResolvedValue(false);

      await Achievements.setAchievementValue(key);

      expect(AchievementStore.setAchievementValue).toHaveBeenCalledWith(
        key,
        true,
      );
      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "achievement",
          text1: AchievementConfig[0].tasks[key].name,
          text2: AchievementConfig[0].tasks[key].verbose,
        }),
      );
      expect(updateBadgeState).toHaveBeenCalledWith({ action: true });
    });

    it("does nothing if achievement already set", async () => {
      const key = Object.keys(AchievementConfig[0].tasks)[0];
      jest.spyOn(AchievementStore, "getLevel").mockResolvedValue(0);
      jest
        .spyOn(AchievementStore, "getAchievementValue")
        .mockResolvedValue(true);

      await Achievements.setAchievementValue(key);

      expect(AchievementStore.setAchievementValue).not.toHaveBeenCalled();
      expect(Toast.show).not.toHaveBeenCalled();
    });
  });

  describe("progressPercent", () => {
    it("calculates correct percentage", async () => {
      const fakeTasks = {
        a: { value: true },
        b: { value: false },
        c: { value: true },
      };
      jest
        .spyOn(Achievements, "getCurrentAchievements")
        .mockResolvedValue({ tasks: fakeTasks } as any);

      const percent = await Achievements.progressPercent();

      expect(percent).toBe(Math.round((2 / 3) * 100));
    });
  });

  describe("resetEverything", () => {
    it("resets all levels and achievements", async () => {
      const mergedTasks: Record<string, any> = {};
      for (const lvl of AchievementConfig) {
        Object.assign(mergedTasks, lvl.tasks);
      }
      const allKeys = Object.keys(mergedTasks);
      await Achievements.resetEverything();

      expect(AchievementStore.setLevel).toHaveBeenCalledWith(0);
      for (const key of allKeys) {
        expect(AchievementStore.setAchievementValue).toHaveBeenCalledWith(
          key,
          false,
        );
      }
    });
  });

  describe("fullFillLevel0", () => {
    it("completes level 0 tasks and triggers haptics", async () => {
      const level0Keys = Object.keys(AchievementConfig[0].tasks);
      await Achievements.fullFillLevel0();

      expect(AchievementStore.setLevel).toHaveBeenCalledWith(0);
      for (const key of level0Keys) {
        expect(AchievementStore.setAchievementValue).toHaveBeenCalledWith(
          key,
          true,
        );
      }
      expect(Haptics.notificationAsync).toHaveBeenCalled();
    });
  });
});

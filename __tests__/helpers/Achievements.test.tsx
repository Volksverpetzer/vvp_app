import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import * as Haptics from "expo-haptics";
import Toast from "react-native-toast-message";

import { AchievementConfig, Achievements } from "#/helpers/Achievements";
import AchievementStore from "#/helpers/Stores/AchievementStore";
import { updateBadgeState } from "#/helpers/provider/BadgeProvider";

let mockEnableActions = true;
jest.mock("#/constants/Config", () => ({
  __esModule: true,
  default: {
    get enableActions() {
      return mockEnableActions;
    },
  },
}));

jest.mock("#/helpers/Stores/AchievementStore", () => ({
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

jest.mock("#/helpers/provider/BadgeProvider", () => ({
  __esModule: true,
  updateBadgeState: jest.fn(),
}));

describe("Achievements", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockEnableActions = true;
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

    it("does not level up beyond max level", async () => {
      const maxLevel = AchievementConfig.length - 1;
      jest.spyOn(AchievementStore, "getLevel").mockResolvedValue(maxLevel);
      jest
        .spyOn(AchievementStore, "getAchievementValue")
        .mockResolvedValue(true);

      const result = await Achievements.getCurrentAchievements();

      expect(AchievementStore.setLevel).not.toHaveBeenCalled();
      expect(result.level).toBe(maxLevel);
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

    it("does nothing when enableActions is false", async () => {
      mockEnableActions = false;
      const key = Object.keys(AchievementConfig[0].tasks)[0];

      await Achievements.setAchievementValue(key);

      expect(AchievementStore.getLevel).not.toHaveBeenCalled();
      expect(AchievementStore.setAchievementValue).not.toHaveBeenCalled();
    });

    it("does nothing when key belongs to a different level", async () => {
      const level1Key = Object.keys(AchievementConfig[1].tasks)[0];
      jest.spyOn(AchievementStore, "getLevel").mockResolvedValue(0);

      await Achievements.setAchievementValue(level1Key);

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

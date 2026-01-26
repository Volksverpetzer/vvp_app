import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import BaseStore from "#/helpers/Storage";
import AchievementStore from "#/helpers/Stores/AchievementStore";

// Mock the BaseStore
jest.mock("../../../src/helpers/Storage", () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
  },
}));

describe("AchievementStore", () => {
  let getItemSpy: ReturnType<typeof jest.spyOn>;

  beforeEach(() => {
    jest.clearAllMocks();
    getItemSpy = jest.spyOn(BaseStore, "getItem");
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("getAchievementValue", () => {
    it('should return true when stored value is "true"', async () => {
      // Setup
      getItemSpy.mockResolvedValue("true");

      // Execute
      const result = await AchievementStore.getAchievementValue("testKey");

      // Assert
      expect(BaseStore.getItem).toHaveBeenCalledWith("testKey");
      expect(result).toBe(true);
    });

    it('should return false when stored value is "false"', async () => {
      // Setup
      getItemSpy.mockResolvedValue("false");

      // Execute
      const result = await AchievementStore.getAchievementValue("testKey");

      // Assert
      expect(BaseStore.getItem).toHaveBeenCalledWith("testKey");
      expect(result).toBe(false);
    });

    it("should return false when stored value is null", async () => {
      // Setup
      getItemSpy.mockResolvedValue(null);

      // Execute
      const result = await AchievementStore.getAchievementValue("testKey");

      // Assert
      expect(BaseStore.getItem).toHaveBeenCalledWith("testKey");
      expect(result).toBe(false);
    });

    it("should return false when stored value is undefined", async () => {
      // Setup
      getItemSpy.mockResolvedValue(undefined);

      // Execute
      const result = await AchievementStore.getAchievementValue("testKey");

      // Assert
      expect(BaseStore.getItem).toHaveBeenCalledWith("testKey");
      expect(result).toBe(false);
    });
  });

  describe("setAchievementValue", () => {
    it('should store "true" when value is true', async () => {
      // Execute
      await AchievementStore.setAchievementValue("testKey", true);

      // Assert
      expect(BaseStore.setItem).toHaveBeenCalledWith("testKey", "true");
    });

    it('should store "false" when value is false', async () => {
      // Execute
      await AchievementStore.setAchievementValue("testKey", false);

      // Assert
      expect(BaseStore.setItem).toHaveBeenCalledWith("testKey", "false");
    });
  });

  describe("setLevel", () => {
    it("should store level as string", async () => {
      // Execute
      await AchievementStore.setLevel(5);

      // Assert
      expect(BaseStore.setItem).toHaveBeenCalledWith("level", "5");
    });

    it("should handle level 0", async () => {
      // Execute
      await AchievementStore.setLevel(0);

      // Assert
      expect(BaseStore.setItem).toHaveBeenCalledWith("level", "0");
    });
  });

  describe("getLevel", () => {
    it("should return parsed level when valid number is stored", async () => {
      // Setup
      getItemSpy.mockResolvedValue("3");

      // Execute
      const result = await AchievementStore.getLevel();

      // Assert
      expect(BaseStore.getItem).toHaveBeenCalledWith("level");
      expect(result).toBe(3);
    });

    it("should return 0 when stored value is null", async () => {
      // Setup
      getItemSpy.mockResolvedValue(null);

      // Execute
      const result = await AchievementStore.getLevel();

      // Assert
      expect(BaseStore.getItem).toHaveBeenCalledWith("level");
      expect(result).toBe(0);
    });

    it("should return 0 when stored value is undefined", async () => {
      // Setup
      getItemSpy.mockResolvedValue(undefined);

      // Execute
      const result = await AchievementStore.getLevel();

      // Assert
      expect(BaseStore.getItem).toHaveBeenCalledWith("level");
      expect(result).toBe(0);
    });

    it("should return 0 when stored value is not a valid number", async () => {
      // Setup
      getItemSpy.mockResolvedValue("invalid");

      // Execute
      const result = await AchievementStore.getLevel();

      // Assert
      expect(BaseStore.getItem).toHaveBeenCalledWith("level");
      expect(result).toBe(0);
    });

    it("should return 0 when stored value is empty string", async () => {
      // Setup
      getItemSpy.mockResolvedValue("");

      // Execute
      const result = await AchievementStore.getLevel();

      // Assert
      expect(BaseStore.getItem).toHaveBeenCalledWith("level");
      expect(result).toBe(0);
    });
  });
});

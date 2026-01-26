import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import BaseStore from "#/helpers/Storage";
import PersonalStore from "#/helpers/Stores/PersonalStore";

// Mock the BaseStore
jest.mock("../../../src/helpers/Storage", () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    parseJSON: jest.fn(),
  },
}));

describe("PersonalStore", () => {
  let getItemSpy: ReturnType<typeof jest.spyOn>;
  let consoleErrorSpy: ReturnType<typeof jest.spyOn>;

  beforeEach(() => {
    jest.clearAllMocks();
    getItemSpy = jest.spyOn(BaseStore, "getItem");
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("getScrollKey", () => {
    it("should construct correct scroll key", () => {
      // Execute
      const result = PersonalStore.getScrollKey("test-slug");

      // Assert
      expect(result).toBe("scrollPosition_test-slug");
    });

    it("should handle empty slug", () => {
      // Execute
      const result = PersonalStore.getScrollKey("");

      // Assert
      expect(result).toBe("scrollPosition_");
    });
  });

  describe("isOnboardingDone", () => {
    it("should return true when onboarding is done", async () => {
      // Setup
      getItemSpy.mockResolvedValue("true");

      // Execute
      const result = await PersonalStore.isOnboardingDone();

      // Assert
      expect(getItemSpy).toHaveBeenCalledWith("onboarded");
      expect(result).toBe(true);
    });

    it("should return false when onboarding is not done", async () => {
      // Setup
      getItemSpy.mockResolvedValue("false");

      // Execute
      const result = await PersonalStore.isOnboardingDone();

      // Assert
      expect(getItemSpy).toHaveBeenCalledWith("onboarded");
      expect(result).toBe(false);
    });

    it("should return false when no value is stored", async () => {
      // Setup
      getItemSpy.mockResolvedValue(null);

      // Execute
      const result = await PersonalStore.isOnboardingDone();

      // Assert
      expect(getItemSpy).toHaveBeenCalledWith("onboarded");
      expect(result).toBe(false);
    });

    it("should handle errors and return false", async () => {
      // Setup
      getItemSpy.mockRejectedValue(new Error("Storage error"));

      // Execute
      const result = await PersonalStore.isOnboardingDone();

      // Assert
      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error checking onboarding status:",
        expect.any(Error),
      );

      // Cleanup
      consoleErrorSpy.mockRestore();
    });
  });

  describe("setOnboardingDone", () => {
    it("should set onboarding to true by default", async () => {
      // Execute
      await PersonalStore.setOnboardingDone();

      // Assert
      expect(BaseStore.setItem).toHaveBeenCalledWith("onboarded", "true");
    });

    it("should set onboarding to false when specified", async () => {
      // Execute
      await PersonalStore.setOnboardingDone(false);

      // Assert
      expect(BaseStore.setItem).toHaveBeenCalledWith("onboarded", "false");
    });

    it("should handle errors gracefully", async () => {
      // Setup
      jest
        .spyOn(BaseStore, "setItem")
        .mockRejectedValue(new Error("Storage error"));

      // Execute
      await PersonalStore.setOnboardingDone();

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error setting onboarding status:",
        expect.any(Error),
      );

      // Cleanup
      consoleErrorSpy.mockRestore();
    });
  });

  describe("setReports", () => {
    it("should store reports as JSON string", async () => {
      // Setup
      const mockReports = [
        { id: "1", title: "Report 1", status: "pending" },
        { id: "2", title: "Report 2", status: "completed" },
      ];

      // Execute
      await PersonalStore.setReports(mockReports);

      // Assert
      expect(BaseStore.setItem).toHaveBeenCalledWith(
        "reports",
        JSON.stringify(mockReports),
      );
    });

    it("should handle empty reports array", async () => {
      // Execute
      await PersonalStore.setReports([]);

      // Assert
      expect(BaseStore.setItem).toHaveBeenCalledWith("reports", "[]");
    });

    it("should handle errors gracefully", async () => {
      // Setup
      jest
        .spyOn(BaseStore, "setItem")
        .mockRejectedValue(new Error("Storage error"));

      // Execute
      await PersonalStore.setReports([]);

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error saving reports:",
        expect.any(Error),
      );

      // Cleanup
      consoleErrorSpy.mockRestore();
    });
  });

  describe("getReports", () => {
    it("should return parsed reports when data exists", async () => {
      // Setup
      const mockReports = [{ id: "1", title: "Report 1", status: "pending" }];
      getItemSpy.mockResolvedValue(
        '[{"id":"1","title":"Report 1","status":"pending"}]',
      );
      jest.spyOn(BaseStore, "parseJSON").mockReturnValue(mockReports);

      // Execute
      const result = await PersonalStore.getReports();

      // Assert
      expect(getItemSpy).toHaveBeenCalledWith("reports");
      expect(BaseStore.parseJSON).toHaveBeenCalledWith(
        '[{"id":"1","title":"Report 1","status":"pending"}]',
        [],
      );
      expect(result).toEqual(mockReports);
    });

    it("should return empty array when no data exists", async () => {
      // Setup
      getItemSpy.mockResolvedValue(null);
      jest.spyOn(BaseStore, "parseJSON").mockReturnValue([]);

      // Execute
      const result = await PersonalStore.getReports();

      // Assert
      expect(result).toEqual([]);
    });

    it("should handle errors and return empty array", async () => {
      // Setup
      getItemSpy.mockRejectedValue(new Error("Storage error"));

      // Execute
      const result = await PersonalStore.getReports();

      // Assert
      expect(result).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error retrieving reports:",
        expect.any(Error),
      );

      // Cleanup
      consoleErrorSpy.mockRestore();
    });
  });

  describe("setScrollPosition", () => {
    it("should store scroll position with correct key", async () => {
      // Execute
      await PersonalStore.setScrollPosition(150, "test-article");

      // Assert
      expect(BaseStore.setItem).toHaveBeenCalledWith(
        "scrollPosition_test-article",
        "150",
      );
    });

    it("should handle zero position", async () => {
      // Execute
      await PersonalStore.setScrollPosition(0, "test-article");

      // Assert
      expect(BaseStore.setItem).toHaveBeenCalledWith(
        "scrollPosition_test-article",
        "0",
      );
    });

    it("should handle errors gracefully", async () => {
      // Setup
      jest
        .spyOn(BaseStore, "setItem")
        .mockRejectedValue(new Error("Storage error"));

      // Execute
      await PersonalStore.setScrollPosition(150, "test-article");

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error setting scroll position:",
        expect.any(Error),
      );

      // Cleanup
      consoleErrorSpy.mockRestore();
    });
  });

  describe("getScrollPosition", () => {
    it("should return parsed scroll position when data exists", async () => {
      // Setup
      getItemSpy.mockResolvedValue("150");
      jest.spyOn(BaseStore, "parseJSON").mockReturnValue(150);

      // Execute
      const result = await PersonalStore.getScrollPosition("test-article");

      // Assert
      expect(getItemSpy).toHaveBeenCalledWith("scrollPosition_test-article");
      expect(BaseStore.parseJSON).toHaveBeenCalledWith("150", 0);
      expect(result).toBe(150);
    });

    it("should return 0 when no data exists", async () => {
      // Setup
      getItemSpy.mockResolvedValue(null);
      jest.spyOn(BaseStore, "parseJSON").mockReturnValue(0);

      // Execute
      const result = await PersonalStore.getScrollPosition("test-article");

      // Assert
      expect(result).toBe(0);
    });

    it("should handle errors and return 0", async () => {
      // Setup
      getItemSpy.mockRejectedValue(new Error("Storage error"));

      // Execute
      const result = await PersonalStore.getScrollPosition("test-article");

      // Assert
      expect(result).toBe(0);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error retrieving scroll position:",
        expect.any(Error),
      );

      // Cleanup
      consoleErrorSpy.mockRestore();
    });
  });
});

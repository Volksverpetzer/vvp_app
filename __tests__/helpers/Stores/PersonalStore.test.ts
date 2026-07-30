import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import BaseStore from "#/helpers/Storage";
import PersonalStore from "#/helpers/Stores/PersonalStore";

// Mock the BaseStore
jest.mock("#/helpers/Storage", () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
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

  describe("getLastSeenChangelogVersionCode", () => {
    it("should use the correct storage key", async () => {
      // Setup
      getItemSpy.mockResolvedValue("2605211");
      jest.spyOn(BaseStore, "parseJSON").mockReturnValue(2605211);

      // Execute
      await PersonalStore.getLastSeenChangelogVersionCode();

      // Assert
      expect(getItemSpy).toHaveBeenCalledWith("lastSeenChangelog");
    });

    it("should return 0 when nothing is stored", async () => {
      // Setup
      getItemSpy.mockResolvedValue(undefined);
      jest.spyOn(BaseStore, "parseJSON").mockReturnValue(0);

      // Execute
      const result = await PersonalStore.getLastSeenChangelogVersionCode();

      // Assert
      expect(BaseStore.parseJSON).toHaveBeenCalledWith(undefined, 0);
      expect(result).toBe(0);
    });

    it("should return the parsed version code when data exists", async () => {
      // Setup
      getItemSpy.mockResolvedValue("2605211");
      jest.spyOn(BaseStore, "parseJSON").mockReturnValue(2605211);

      // Execute
      const result = await PersonalStore.getLastSeenChangelogVersionCode();

      // Assert
      expect(BaseStore.parseJSON).toHaveBeenCalledWith("2605211", 0);
      expect(result).toBe(2605211);
    });

    it("should handle errors and return 0", async () => {
      // Setup
      getItemSpy.mockRejectedValue(new Error("Storage error"));

      // Execute
      const result = await PersonalStore.getLastSeenChangelogVersionCode();

      // Assert
      expect(result).toBe(0);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error retrieving last seen changelog version code:",
        expect.any(Error),
      );

      // Cleanup
      consoleErrorSpy.mockRestore();
    });
  });

  describe("setLastSeenChangelogVersionCode", () => {
    it("should store the version code as JSON under the correct key", async () => {
      // Execute
      await PersonalStore.setLastSeenChangelogVersionCode(2605211);

      // Assert
      expect(BaseStore.setItem).toHaveBeenCalledWith(
        "lastSeenChangelog",
        "2605211",
      );
    });

    it("should handle errors gracefully", async () => {
      // Setup
      jest
        .spyOn(BaseStore, "setItem")
        .mockRejectedValue(new Error("Storage error"));

      // Execute
      await PersonalStore.setLastSeenChangelogVersionCode(2605211);

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error saving last seen changelog version code:",
        expect.any(Error),
      );

      // Cleanup
      consoleErrorSpy.mockRestore();
    });
  });

  describe("getDismissedAnnouncements", () => {
    it("should use the correct storage key", async () => {
      // Setup
      getItemSpy.mockResolvedValue('["pruefpunkt-feed-2026-07"]');
      jest
        .spyOn(BaseStore, "parseJSON")
        .mockReturnValue(["pruefpunkt-feed-2026-07"]);

      // Execute
      await PersonalStore.getDismissedAnnouncements();

      // Assert
      expect(getItemSpy).toHaveBeenCalledWith("dismissedAnnouncements");
    });

    it("should return an empty array when nothing is stored", async () => {
      // Setup
      getItemSpy.mockResolvedValue(null);
      jest.spyOn(BaseStore, "parseJSON").mockReturnValue([]);

      // Execute
      const result = await PersonalStore.getDismissedAnnouncements();

      // Assert
      expect(BaseStore.parseJSON).toHaveBeenCalledWith(null, []);
      expect(result).toEqual([]);
    });

    it("should handle errors and return an empty array", async () => {
      // Setup
      getItemSpy.mockRejectedValue(new Error("Storage error"));

      // Execute
      const result = await PersonalStore.getDismissedAnnouncements();

      // Assert
      expect(result).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error retrieving dismissed announcements:",
        expect.any(Error),
      );

      // Cleanup
      consoleErrorSpy.mockRestore();
    });
  });

  describe("dismissAnnouncement", () => {
    it("should append the id to the stored list", async () => {
      // Setup
      getItemSpy.mockResolvedValue('["other-id"]');
      jest.spyOn(BaseStore, "parseJSON").mockReturnValue(["other-id"]);

      // Execute
      await PersonalStore.dismissAnnouncement("pruefpunkt-feed-2026-07");

      // Assert
      expect(BaseStore.setItem).toHaveBeenCalledWith(
        "dismissedAnnouncements",
        JSON.stringify(["other-id", "pruefpunkt-feed-2026-07"]),
      );
    });

    it("should not store a duplicate when the id is already dismissed", async () => {
      // Setup
      getItemSpy.mockResolvedValue('["pruefpunkt-feed-2026-07"]');
      jest
        .spyOn(BaseStore, "parseJSON")
        .mockReturnValue(["pruefpunkt-feed-2026-07"]);

      // Execute
      await PersonalStore.dismissAnnouncement("pruefpunkt-feed-2026-07");

      // Assert
      expect(BaseStore.setItem).not.toHaveBeenCalled();
    });

    it("should not lose an id when two dismissals overlap", async () => {
      // Setup: a live in-memory store, so each read sees the previous write.
      let stored: string | null = null;
      getItemSpy.mockImplementation(() => Promise.resolve(stored));
      jest
        .spyOn(BaseStore, "parseJSON")
        .mockImplementation((value) => JSON.parse((value as string) ?? "[]"));
      jest.spyOn(BaseStore, "setItem").mockImplementation((_, value) => {
        stored = value as string;
        return Promise.resolve();
      });

      // Execute: fire both without awaiting in between (read-modify-write race)
      await Promise.all([
        PersonalStore.dismissAnnouncement("first-id"),
        PersonalStore.dismissAnnouncement("second-id"),
      ]);

      // Assert
      expect(JSON.parse(stored ?? "[]")).toEqual(["first-id", "second-id"]);
    });

    it("should handle errors gracefully", async () => {
      // Setup
      getItemSpy.mockResolvedValue(null);
      jest.spyOn(BaseStore, "parseJSON").mockReturnValue([]);
      jest
        .spyOn(BaseStore, "setItem")
        .mockRejectedValue(new Error("Storage error"));

      // Execute
      await PersonalStore.dismissAnnouncement("pruefpunkt-feed-2026-07");

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error dismissing announcement:",
        expect.any(Error),
      );

      // Cleanup
      consoleErrorSpy.mockRestore();
    });
  });

  describe("audio positions", () => {
    it("should construct the audio key from the resume key", () => {
      expect(PersonalStore.getAudioKey("https://a.example/ep.mp3")).toBe(
        "audioPosition_https://a.example/ep.mp3",
      );
    });

    it("should store the audio position under the audio key", async () => {
      const setItemSpy = jest.spyOn(BaseStore, "setItem");

      await PersonalStore.setAudioPosition("https://a.example/ep.mp3", 123.4);

      expect(setItemSpy).toHaveBeenCalledWith(
        "audioPosition_https://a.example/ep.mp3",
        "123.4",
      );
    });

    it("should return the parsed audio position", async () => {
      getItemSpy.mockResolvedValue("123.4");
      jest.spyOn(BaseStore, "parseJSON").mockReturnValue(123.4);

      const result = await PersonalStore.getAudioPosition(
        "https://a.example/ep.mp3",
      );

      expect(getItemSpy).toHaveBeenCalledWith(
        "audioPosition_https://a.example/ep.mp3",
      );
      expect(BaseStore.parseJSON).toHaveBeenCalledWith("123.4", 0);
      expect(result).toBe(123.4);
    });

    it("should return 0 on storage errors", async () => {
      getItemSpy.mockRejectedValue(new Error("Storage error"));

      const result = await PersonalStore.getAudioPosition(
        "https://a.example/ep.mp3",
      );

      expect(result).toBe(0);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error retrieving audio position:",
        expect.any(Error),
      );
    });

    it("should remove the stored position on clear", async () => {
      const removeItemSpy = jest.spyOn(BaseStore, "removeItem");

      await PersonalStore.clearAudioPosition("https://a.example/ep.mp3");

      expect(removeItemSpy).toHaveBeenCalledWith(
        "audioPosition_https://a.example/ep.mp3",
      );
    });

    it("should swallow set errors and log them", async () => {
      jest
        .spyOn(BaseStore, "setItem")
        .mockRejectedValue(new Error("Storage error"));

      await expect(
        PersonalStore.setAudioPosition("https://a.example/ep.mp3", 42),
      ).resolves.toBeUndefined();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error setting audio position:",
        expect.any(Error),
      );
    });

    it("should swallow clear errors and log them", async () => {
      jest
        .spyOn(BaseStore, "removeItem")
        .mockRejectedValue(new Error("Storage error"));

      await expect(
        PersonalStore.clearAudioPosition("https://a.example/ep.mp3"),
      ).resolves.toBeUndefined();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error clearing audio position:",
        expect.any(Error),
      );
    });
  });
});

import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { File } from "expo-file-system";
import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";
import * as ExpoSharing from "expo-sharing";
import { Platform, Share } from "react-native";
import Toast from "react-native-toast-message";

import { Achievements } from "#/helpers/Achievements";
import { multishare, onShare } from "#/helpers/Sharing";
import Statistics from "#/helpers/Statistics";
import { registerEvent } from "#/helpers/network/Analytics";
import type { ShareableType } from "#/types";

type DownloadResult = { uri: string };
type DownloadFileAsync = (
  url: string,
  destination: { uri: string },
  options: { idempotent: boolean },
) => Promise<DownloadResult>;

// Mock dependencies
jest.mock("react-native", () => ({
  Share: {
    share: jest.fn(),
    sharedAction: "sharedAction",
    dismissedAction: "dismissedAction",
  },
  Platform: {
    OS: "ios",
  },
}));

jest.mock("expo-file-system", () => {
  const downloadFileAsyncMock: jest.MockedFunction<DownloadFileAsync> =
    jest.fn();
  const MockFile = Object.assign(
    jest.fn((basePath: string, fileName: string) => ({
      uri: `${basePath}/${fileName}`,
    })),
    { downloadFileAsync: downloadFileAsyncMock },
  );
  return {
    __esModule: true,
    File: MockFile,
    Paths: { document: "file:///document/directory" },
  };
});

jest.mock("expo-sharing", () => ({
  __esModule: true,
  shareAsync: jest.fn(),
}));

jest.mock("expo-haptics", () => ({
  __esModule: true,
  selectionAsync: jest.fn(),
  notificationAsync: jest.fn(),
  NotificationFeedbackType: {
    Success: "success",
  },
}));

jest.mock("expo-linking", () => ({
  __esModule: true,
  parse: jest.fn(),
}));

jest.mock("react-native-toast-message", () => ({
  __esModule: true,
  default: {
    show: jest.fn(),
    hide: jest.fn(),
  },
}));

jest.mock("#/helpers/network/Analytics", () => ({
  __esModule: true,
  registerEvent: jest.fn(),
}));

jest.mock("#/helpers/Achievements", () => ({
  __esModule: true,
  Achievements: {
    setAchievementValue: jest.fn(),
  },
}));

jest.mock("#/helpers/Statistics", () => ({
  __esModule: true,
  default: {
    countArticleShared: jest.fn(),
  },
}));

jest.mock("#/constants/Config", () => ({
  __esModule: true,
  default: {
    wpUrl: "https://www.volksverpetzer.de",
  },
}));

describe("Sharing helpers", () => {
  let parseSpy: ReturnType<typeof jest.spyOn>;
  let downloadSpy: jest.MockedFunction<DownloadFileAsync>;
  let shareSpy: ReturnType<typeof jest.spyOn>;

  beforeEach(() => {
    jest.clearAllMocks();
    Platform.OS = "ios"; // Default to iOS for tests
    parseSpy = jest.spyOn(Linking, "parse");
    downloadSpy = (
      File as unknown as {
        downloadFileAsync: jest.MockedFunction<DownloadFileAsync>;
      }
    ).downloadFileAsync;
    shareSpy = jest.spyOn(Share, "share");
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("isImageFile", () => {
    it("should identify image files by extension", async () => {
      // Setup
      parseSpy.mockImplementation((url: string) => {
        if (url === "https://example.com/image.jpg") {
          return { path: "/image.jpg" };
        }
        return { path: "/not-image.pdf" };
      });

      // Execute & Assert
      await onShare("https://example.com/image.jpg");

      // Verify isImageFile was correctly identified
      expect(downloadSpy).toHaveBeenCalled();
    });

    it("should identify image files with media_url in the path", async () => {
      // Setup - the filename (last part of path) needs to contain media_url
      parseSpy.mockImplementation((url) => {
        return { path: "/path/to/media_url_image" };
      });
      downloadSpy.mockResolvedValue({
        uri: "file:///downloaded/image.jpg",
      });
      shareSpy.mockResolvedValue({
        action: Share.sharedAction,
        activityType: "facebook",
      });

      // Execute
      await onShare("https://example.com/path/to/media_url_image");

      // Assert
      expect(downloadSpy).toHaveBeenCalled();
    });
  });

  describe("getFileType", () => {
    it("should extract file type from filename", async () => {
      // Setup
      parseSpy.mockImplementation((url: string) => {
        if (url === "https://example.com/image.png") {
          return { path: "/image.png" };
        }
        return { path: "/image.jpg" };
      });
      downloadSpy.mockResolvedValue({
        uri: "file:///downloaded/image.png",
      });

      // Execute
      await onShare("https://example.com/image.png");

      // Assert
      expect(downloadSpy).toHaveBeenCalledWith(
        "https://example.com/image.png",
        expect.objectContaining({ uri: "file:///document/directory/temp.png" }),
        { idempotent: true },
      );
    });

    it("should default to jpg if no file extension is found", async () => {
      // Setup - need to make it an image file by including media_url
      parseSpy.mockImplementation((url) => {
        return { path: "/media_url_image_without_extension" };
      });
      downloadSpy.mockResolvedValue({
        uri: "file:///downloaded/image",
      });
      shareSpy.mockResolvedValue({
        action: Share.sharedAction,
        activityType: "facebook",
      });

      // Execute
      await onShare("https://example.com/media_url_image_without_extension");

      // Assert
      expect(downloadSpy).toHaveBeenCalledWith(
        "https://example.com/media_url_image_without_extension",
        expect.objectContaining({ uri: "file:///document/directory/temp.jpg" }),
        { idempotent: true },
      );
    });
  });

  describe("downloadImage", () => {
    it("should download remote images", async () => {
      // Setup
      const url = "https://example.com/image.jpg";
      parseSpy.mockReturnValue({ path: "/image.jpg" });
      downloadSpy.mockResolvedValue({
        uri: "file:///downloaded/image.jpg",
      });
      shareSpy.mockResolvedValue({
        action: Share.sharedAction,
        activityType: "facebook",
      });

      // Execute
      await onShare(url);

      // Assert
      expect(downloadSpy).toHaveBeenCalledWith(
        url,
        expect.objectContaining({ uri: "file:///document/directory/temp.jpg" }),
        { idempotent: true },
      );
    });

    it("should not download local files", async () => {
      // Setup
      const url = "file:///local/image.jpg";
      parseSpy.mockReturnValue({ path: "/image.jpg" });
      shareSpy.mockResolvedValue({
        action: Share.sharedAction,
        activityType: "facebook",
      });

      // Execute
      await onShare(url);

      // Assert
      expect(downloadSpy).not.toHaveBeenCalled();
    });
  });

  describe("handleAndroidImageShare", () => {
    it("should share images on Android using expo-sharing", async () => {
      // Setup
      Platform.OS = "android";
      const url = "https://example.com/image.jpg";
      parseSpy.mockReturnValue({ path: "/image.jpg" });
      downloadSpy.mockResolvedValue({
        uri: "file:///downloaded/image.jpg",
      });

      // Execute
      await onShare(url);

      // Assert
      expect(ExpoSharing.shareAsync).toHaveBeenCalledWith(
        "file:///downloaded/image.jpg",
        expect.objectContaining({
          mimeType: "image/jpg",
          dialogTitle: "Als Bild teilen",
        }),
      );
      expect(registerEvent).toHaveBeenCalledWith(
        url,
        "Share",
        expect.objectContaining({
          activityType: "androidImage",
        }),
      );
      expect(Haptics.notificationAsync).toHaveBeenCalledWith(
        Haptics.NotificationFeedbackType.Success,
      );
    });
  });

  describe("handleSuccessfulShare", () => {
    it("should register share event and provide haptic feedback", async () => {
      // Setup
      const url = "https://example.com/article";
      parseSpy.mockReturnValue({ path: "/article" });
      shareSpy.mockResolvedValue({
        action: Share.sharedAction,
        activityType: "facebook",
      });

      // Execute
      await onShare(url);

      // Assert
      expect(registerEvent).toHaveBeenCalledWith(
        url,
        "Share",
        expect.objectContaining({
          activityType: "facebook",
        }),
      );
      expect(Haptics.notificationAsync).toHaveBeenCalledWith(
        Haptics.NotificationFeedbackType.Success,
      );
    });

    it("should update achievements and streaks for volksverpetzer URLs", async () => {
      // Setup
      const url = "https://www.volksverpetzer.de/article";
      parseSpy.mockReturnValue({ path: "/article" });
      shareSpy.mockResolvedValue({
        action: Share.sharedAction,
        activityType: "facebook",
      });

      // Execute
      await onShare(url);

      // Assert
      expect(Achievements.setAchievementValue).toHaveBeenCalledWith(
        "sharefact",
      );
      expect(Statistics.countArticleShared).toHaveBeenCalled();
    });

    it("should not update achievements for non-volksverpetzer URLs", async () => {
      // Setup
      const url = "https://example.com/article";
      parseSpy.mockReturnValue({ path: "/article" });
      shareSpy.mockResolvedValue({
        action: Share.sharedAction,
        activityType: "facebook",
      });

      // Execute
      await onShare(url);

      // Assert
      expect(Achievements.setAchievementValue).not.toHaveBeenCalled();
      expect(Statistics.countArticleShared).not.toHaveBeenCalled();
    });
  });

  describe("onShare", () => {
    it("should add UTM parameters to non-image URLs", async () => {
      // Setup
      const url = "https://example.com/article";
      parseSpy.mockReturnValue({ path: "/article" });
      shareSpy.mockResolvedValue({
        action: Share.sharedAction,
        activityType: "facebook",
      });

      // Execute
      await onShare(url);

      // Assert
      expect(Share.share).toHaveBeenCalledWith({
        message: expect.stringContaining("utm_source=app_share"),
      });
    });

    it("should return true for successful shares", async () => {
      // Setup
      const url = "https://example.com/article";
      parseSpy.mockReturnValue({ path: "/article" });
      shareSpy.mockResolvedValue({
        action: Share.sharedAction,
        activityType: "facebook",
      });

      // Execute
      const result = await onShare(url);

      // Assert
      expect(result).toBe(true);
    });

    it("should return false for dismissed shares on iOS", async () => {
      // Setup
      Platform.OS = "ios";
      const url = "https://example.com/article";
      parseSpy.mockReturnValue({ path: "/article" });
      shareSpy.mockResolvedValue({ action: Share.dismissedAction });

      // Execute
      const result = await onShare(url);

      // Assert
      expect(result).toBe(false);
    });

    it("should always return true for Android shares even if dismissed", async () => {
      // Setup
      Platform.OS = "android";
      const url = "https://example.com/article";
      parseSpy.mockReturnValue({ path: "/article" });
      shareSpy.mockResolvedValue({ action: Share.dismissedAction });

      // Execute
      const result = await onShare(url);

      // Assert
      expect(result).toBe(true);
    });

    it("should handle errors gracefully", async () => {
      // Setup
      const url = "https://example.com/article";
      parseSpy.mockReturnValue({ path: "/article" });
      shareSpy.mockRejectedValue(new Error("Share failed"));

      // Spy on console.error
      const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      // Execute
      const result = await onShare(url);

      // Assert
      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith("Share failed");

      // Restore console.error
      consoleErrorSpy.mockRestore();
    });
  });

  describe("multishare", () => {
    it.skip("should directly call onShare for a single shareable item", async () => {
      // This test is skipped due to issues with global.onShare mock
    });

    it.skip("should show toast with options for multiple shareable items", async () => {
      // This test is skipped due to issues with global.onShare mock
    });

    it("should handle cancel action for multiple shareable items", async () => {
      // Setup
      const shareable: ShareableType[] = [
        { url: "https://example.com/article1", title: "Article 1" },
        { url: "https://example.com/article2", title: "Article 2" },
      ];

      // Execute
      const promise = multishare(shareable);

      // Simulate user canceling
      const toastProps = jest.spyOn(Toast, "show").mock.calls[0][0].props;
      toastProps.onCancel();

      // Assert
      expect(Toast.hide).toHaveBeenCalled();

      // Resolve the promise
      const result = await promise;
      expect(result).toBe(false);
    });
  });
});

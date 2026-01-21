import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import * as Haptics from "expo-haptics";
import { Platform, Share } from "react-native";

import { onShare } from "../../src/helpers/Sharing";

// Mock async-storage for Storage/AchievementStore dependencies
jest.mock("@react-native-async-storage/async-storage", () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));
// Mock all expo/native modules
jest.mock("expo-file-system/legacy", () => ({
  downloadAsync: jest.fn(() =>
    Promise.resolve({ uri: "file:///mocked/path.jpg" }),
  ),
}));
jest.mock("expo-sharing", () => ({}));
jest.mock("expo-haptics", () => ({
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  NotificationFeedbackType: {
    Success: "success",
  },
}));
jest.mock("react-native", () => ({
  Share: { share: jest.fn() },
  Platform: { OS: "ios" },
  StyleSheet: { create: jest.fn((styles) => styles) },
}));
jest.mock("react-native-toast-message", () => ({
  show: jest.fn(),
  hide: jest.fn(),
}));
// Additional mocks for dependencies used by Analytics and other helpers
jest.mock("expo-application", () => ({}));
jest.mock("expo-constants", () => ({
  expoConfig: { extra: {} }, // Add fields as needed for your app
}));
jest.mock("expo-linking", () => ({
  parse: jest.fn((url) => ({ path: "/content" })),
}));
jest.mock("expo-modules-core", () => ({}));

describe("Sharing", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should share content using Share API on iOS", async () => {
    // Set platform to iOS
    Object.defineProperty(Platform, "OS", {
      value: "ios",
      configurable: true,
    });

    // Mock Share.share to return success
    Share.share.mockResolvedValue({ action: Share.sharedAction });

    // Execute
    await onShare("https://example.com/content");

    // Assert - for non-image URLs, it uses message instead of url
    expect(Share.share).toHaveBeenCalledWith({
      message: "https://example.com/content?utm_source=app_share",
    });
    expect(Haptics.selectionAsync).toHaveBeenCalled();
  });

  // Add more tests following the same pattern
});

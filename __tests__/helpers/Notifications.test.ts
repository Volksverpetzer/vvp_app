import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import * as Notifications from "expo-notifications";

import NotificationManager from "#/helpers/Notifications";

// Mock dependencies
jest.mock("react-native", () => ({
  Platform: {
    OS: "ios",
  },
}));

jest.mock("expo-notifications", () => ({
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  setNotificationHandler: jest.fn(),
  PermissionStatus: {
    GRANTED: "granted",
    DENIED: "denied",
    UNDETERMINED: "undetermined",
  },
  AndroidImportance: {
    HIGH: 4,
    DEFAULT: 3,
  },
}));

jest.mock("expo-device", () => ({
  isDevice: true,
}));

jest.mock("expo-application", () => ({
  nativeBuildVersion: "1.0.0",
}));

jest.mock("#/helpers/network/ServerAPI", () => ({
  __esModule: true,
  default: {
    registerNotifications: jest.fn(),
  },
}));

jest.mock("#/helpers/Stores/SettingsStore", () => ({
  __esModule: true,
  default: {
    getNotificationSettings: jest.fn(),
    setNotificationSettings: jest.fn(),
    defaultNotificationSettings: {
      new_post: { value: true, name: "New Posts" },
    },
  },
}));

jest.mock("#/constants/Config", () => ({
  eas: {
    projectId: "test-project-id",
  },
}));

jest.mock("#/constants/Colors", () => ({
  light: {
    corporate: "#ff0000",
  },
}));

describe("NotificationManager", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getPermissions", () => {
    it("should return notification permissions", async () => {
      // Setup
      const mockPermissions = { status: "granted" };
      jest
        .spyOn(Notifications, "getPermissionsAsync")
        .mockResolvedValue(mockPermissions as any);

      // Execute
      const result = await NotificationManager.getPermissions();

      // Assert
      expect(Notifications.getPermissionsAsync).toHaveBeenCalled();
      expect(result).toEqual(mockPermissions);
    });
  });

  describe("getToken", () => {
    it("should return push token when successful", async () => {
      // Setup
      const mockToken = "ExponentPushToken[test-token]";
      jest
        .spyOn(Notifications, "getExpoPushTokenAsync")
        .mockResolvedValue({ data: mockToken } as any);

      // Execute
      const result = await NotificationManager.getToken();

      // Assert
      expect(Notifications.getExpoPushTokenAsync).toHaveBeenCalledWith({
        projectId: "test-project-id",
      });
      expect(result).toBe(mockToken);
    });

    it("should throw error when token retrieval fails", async () => {
      // Setup
      const error = new Error("Token retrieval failed");
      jest
        .spyOn(Notifications, "getExpoPushTokenAsync")
        .mockRejectedValue(error);
      const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      // Execute & Assert
      await expect(NotificationManager.getToken()).rejects.toThrow(
        "Token retrieval failed",
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error getting push token:",
        error,
      );

      // Cleanup
      consoleErrorSpy.mockRestore();
    });
  });

  describe("checkAndRequestOnLaunch", () => {
    it("should refresh server when permissions are granted", async () => {
      jest
        .spyOn(Notifications, "getPermissionsAsync")
        .mockResolvedValue({ status: "granted" } as any);

      const refreshSpy = jest
        .spyOn(NotificationManager, "refreshServer")
        .mockResolvedValue(undefined as any);

      await NotificationManager.checkAndRequestOnLaunch();

      expect(refreshSpy).toHaveBeenCalled();
    });

    it("should request permissions when undetermined", async () => {
      jest
        .spyOn(Notifications, "getPermissionsAsync")
        .mockResolvedValue({ status: "undetermined" } as any);

      const registerSpy = jest
        .spyOn(NotificationManager, "registerForPushNotifications")
        .mockResolvedValue({ status: "ok", notificationSettings: {} } as any);

      await NotificationManager.checkAndRequestOnLaunch();

      expect(registerSpy).toHaveBeenCalled();
    });

    it("should request again when denied but canAskAgain and user grants", async () => {
      jest
        .spyOn(Notifications, "getPermissionsAsync")
        .mockResolvedValue({ status: "denied", canAskAgain: true } as any);

      const requestSpy = jest
        .spyOn(Notifications, "requestPermissionsAsync")
        .mockResolvedValue({ status: "granted" } as any);

      const registerSpy = jest
        .spyOn(NotificationManager, "registerForPushNotifications")
        .mockResolvedValue({ status: "ok", notificationSettings: {} } as any);

      await NotificationManager.checkAndRequestOnLaunch();

      expect(requestSpy).toHaveBeenCalled();
      expect(registerSpy).toHaveBeenCalled();
    });

    it("should not request when denied and cannot ask again", async () => {
      jest
        .spyOn(Notifications, "getPermissionsAsync")
        .mockResolvedValue({ status: "denied", canAskAgain: false } as any);

      const requestSpy = jest.spyOn(Notifications, "requestPermissionsAsync");
      const registerSpy = jest.spyOn(
        NotificationManager,
        "registerForPushNotifications",
      );

      await NotificationManager.checkAndRequestOnLaunch();

      expect(requestSpy).not.toHaveBeenCalled();
      expect(registerSpy).not.toHaveBeenCalled();
    });
  });
});

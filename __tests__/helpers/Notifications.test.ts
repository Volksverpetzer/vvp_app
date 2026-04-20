import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import * as Notifications from "expo-notifications";

import NotificationManager from "#/helpers/Notifications";
import SettingsStore from "#/helpers/Stores/SettingsStore";

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
  scheduleNotificationAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  setNotificationHandler: jest.fn(),
  PermissionStatus: {
    GRANTED: "granted",
    DENIED: "denied",
    UNDETERMINED: "undetermined",
  },
  SchedulableTriggerInputTypes: {
    DATE: "date",
  },
  AndroidImportance: {
    HIGH: 4,
    DEFAULT: 3,
  },
}));

// Use a closure variable and setter to control the mocked device flag safely
let mockIsDeviceValue = true;
jest.mock("expo-device", () => ({
  get isDevice() {
    return mockIsDeviceValue;
  },
  // helper to change the mocked value from tests
  __setIsDeviceValue(value: boolean) {
    mockIsDeviceValue = value;
  },
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

let mockIsFoss = false;
jest.mock("#/constants/Config", () => ({
  eas: { projectId: "test-project-id" },
  get isFoss() {
    return mockIsFoss;
  },
}));

jest.mock("#/constants/Colors", () => ({
  light: {
    primary: "#ff0000",
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
    afterEach(() => {
      // Restore Device.isDevice after each test via the setter
      const Device = jest.requireMock("expo-device") as any;
      Device.__setIsDeviceValue(true);
    });

    it("should skip simulators/emulators and return early", async () => {
      // Mock Device to simulate running on a simulator
      const Device = jest.requireMock("expo-device") as any;
      Device.__setIsDeviceValue(false);

      const getPermissionsSpy = jest.spyOn(
        Notifications,
        "getPermissionsAsync",
      );
      const refreshSpy = jest.spyOn(NotificationManager, "refreshServer");
      const registerSpy = jest.spyOn(
        NotificationManager,
        "registerForPushNotifications",
      );

      await NotificationManager.checkAndRequestOnLaunch();

      // Should return early without checking permissions or making any requests
      expect(getPermissionsSpy).not.toHaveBeenCalled();
      expect(refreshSpy).not.toHaveBeenCalled();
      expect(registerSpy).not.toHaveBeenCalled();
    });

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

  describe("scheduleDonationReminder", () => {
    it("calls scheduleNotificationAsync with the correct content and DATE trigger", async () => {
      const date = new Date("2026-05-01T10:00:00.000Z");
      jest
        .spyOn(Notifications, "scheduleNotificationAsync")
        .mockResolvedValue("notification-id" as any);

      await NotificationManager.scheduleDonationReminder(date);

      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
        content: {
          title: "Danke für deine Spende! 📬",
          body: "Wir haben uns sehr gefreut, dass du uns im letzten Monat unterstützt hast.",
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date,
        },
      });
    });

    it("is a no-op when notifications are unavailable (web platform)", async () => {
      const platform = (jest.requireMock("react-native") as any).Platform;
      platform.OS = "web";
      try {
        await NotificationManager.scheduleDonationReminder(new Date());
        expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
      } finally {
        platform.OS = "ios";
      }
    });
  });

  describe("FOSS mode (Config.isFoss = true)", () => {
    beforeEach(() => {
      jest.restoreAllMocks(); // clear any lingering spies from checkAndRequestOnLaunch tests
      mockIsFoss = true;
    });

    afterEach(() => {
      mockIsFoss = false;
    });

    describe("getPermissions", () => {
      it("returns DENIED without calling the system API", async () => {
        const spy = jest.spyOn(Notifications, "getPermissionsAsync");

        const result = await NotificationManager.getPermissions();

        expect(spy).not.toHaveBeenCalled();
        expect(result.status).toBe(Notifications.PermissionStatus.DENIED);
        expect(result.canAskAgain).toBe(false);
      });
    });

    describe("getToken", () => {
      it("returns an empty string without calling the push token API", async () => {
        const spy = jest.spyOn(Notifications, "getExpoPushTokenAsync");

        const result = await NotificationManager.getToken();

        expect(spy).not.toHaveBeenCalled();
        expect(result).toBe("");
      });
    });

    describe("refreshServer", () => {
      it("returns early without checking permissions or calling the API", async () => {
        const permissionsSpy = jest.spyOn(
          NotificationManager,
          "getPermissions",
        );

        await NotificationManager.refreshServer();

        expect(permissionsSpy).not.toHaveBeenCalled();
      });
    });

    describe("registerForPushNotifications", () => {
      it("returns stored settings with status 'foss' without registering", async () => {
        const mockSettings = {
          new_post: { value: true, name: "Neue Artikel" },
        };
        (
          SettingsStore.getNotificationSettings as jest.MockedFunction<
            () => Promise<any>
          >
        ).mockResolvedValue(mockSettings);
        const permissionsSpy = jest.spyOn(Notifications, "getPermissionsAsync");

        const result = await NotificationManager.registerForPushNotifications();

        expect(permissionsSpy).not.toHaveBeenCalled();
        expect(result.status).toBe("foss");
        expect(result.notificationSettings).toEqual(mockSettings);
      });
    });

    describe("checkAndRequestOnLaunch", () => {
      it("returns early without checking permissions", async () => {
        const spy = jest.spyOn(Notifications, "getPermissionsAsync");

        await NotificationManager.checkAndRequestOnLaunch();

        expect(spy).not.toHaveBeenCalled();
      });
    });

    describe("scheduleDonationReminder", () => {
      it("is a no-op in FOSS mode", async () => {
        await NotificationManager.scheduleDonationReminder(new Date());

        expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
      });
    });
  });
});

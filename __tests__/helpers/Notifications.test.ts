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

  describe("registerForPushNotifications", () => {
    afterEach(() => {
      // Restore spied implementations (getPermissionsAsync, console.warn,
      // etc.) so they don't leak into later tests — the file only runs
      // clearAllMocks() globally, which doesn't undo spyOn implementations.
      jest.restoreAllMocks();
      // Restore Device.isDevice after each test via the setter
      const Device = jest.requireMock("expo-device") as any;
      Device.__setIsDeviceValue(true);
    });

    it("persists the merged settings before checking permissions or fetching a token", async () => {
      (
        SettingsStore.getNotificationSettings as jest.MockedFunction<
          () => Promise<any>
        >
      ).mockResolvedValue({ new_post: { value: true, name: "New Posts" } });
      const getPermissionsSpy = jest
        .spyOn(Notifications, "getPermissionsAsync")
        .mockResolvedValue({ status: "granted" } as any);
      jest
        .spyOn(Notifications, "getExpoPushTokenAsync")
        .mockResolvedValue({ data: "ExponentPushToken[test]" } as any);
      const API = (jest.requireMock("#/helpers/network/ServerAPI") as any)
        .default;
      API.registerNotifications.mockResolvedValue({ status: "ok" });

      await NotificationManager.registerForPushNotifications({
        new_post: { value: false, name: "New Posts" },
      });

      expect(SettingsStore.setNotificationSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          new_post: { value: false, name: "New Posts" },
        }),
      );
      const setOrder = (SettingsStore.setNotificationSettings as jest.Mock).mock
        .invocationCallOrder[0];
      const permissionsOrder = getPermissionsSpy.mock.invocationCallOrder[0];
      expect(setOrder).toBeLessThan(permissionsOrder);
    });

    it("persists a toggle immediately while an earlier sync is still fetching its token", async () => {
      // Regression test for the onboarding bug: the permission grant kicks
      // off an all-on registration whose token fetch takes seconds; a
      // toggle made during that window must reach storage right away, not
      // queue behind the network work — otherwise the settings tab reads
      // stale all-on values.
      let storage: Record<string, unknown> = {};
      (
        SettingsStore.getNotificationSettings as jest.MockedFunction<
          () => Promise<any>
        >
      ).mockImplementation(() => Promise.resolve({ ...storage } as any));
      (
        SettingsStore.setNotificationSettings as jest.MockedFunction<
          (s: any) => Promise<void>
        >
      ).mockImplementation((s: any) => {
        storage = s;
        return Promise.resolve();
      });
      jest
        .spyOn(Notifications, "getPermissionsAsync")
        .mockResolvedValue({ status: "granted" } as any);
      let resolveToken: () => void = () => {};
      jest
        .spyOn(Notifications, "getExpoPushTokenAsync")
        .mockImplementationOnce(
          () =>
            new Promise((resolve) => {
              resolveToken = () =>
                resolve({ data: "ExponentPushToken[slow]" } as any);
            }),
        )
        .mockResolvedValue({ data: "ExponentPushToken[fast]" } as any);
      const API = (jest.requireMock("#/helpers/network/ServerAPI") as any)
        .default;
      API.registerNotifications.mockResolvedValue({ status: "ok" });

      // All-on registration (permission grant) — token fetch hangs.
      const first = NotificationManager.registerForPushNotifications({
        new_post: { value: true, name: "New Posts" },
      } as any);
      // User toggles off while the first sync is stuck on its token.
      const second = NotificationManager.registerForPushNotifications({
        new_post: { value: false, name: "New Posts" },
      } as any);

      // Let the persist chain flush without resolving the token.
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect((storage as any).new_post.value).toBe(false);

      resolveToken();
      await Promise.all([first, second]);
      expect((storage as any).new_post.value).toBe(false);
      // Every POST carries the latest settings, including the first sync
      // whose own snapshot was outdated by the time it reached the server.
      for (const call of API.registerNotifications.mock.calls) {
        expect((call[0] as any).settings.new_post.value).toBe(false);
      }
      expect(API.registerNotifications).toHaveBeenCalledTimes(2);
    });

    it("persists and returns the merged settings on simulators/emulators without registering a token", async () => {
      const Device = jest.requireMock("expo-device") as any;
      Device.__setIsDeviceValue(false);
      (
        SettingsStore.getNotificationSettings as jest.MockedFunction<
          () => Promise<any>
        >
      ).mockResolvedValue({ new_post: { value: true, name: "New Posts" } });

      const result = await NotificationManager.registerForPushNotifications({
        new_post: { value: false, name: "New Posts" },
      });

      expect(result.status).toBe("ok");
      expect(result.notificationSettings.new_post.value).toBe(false);
      expect(SettingsStore.setNotificationSettings).toHaveBeenCalledTimes(1);
      expect(SettingsStore.setNotificationSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          new_post: { value: false, name: "New Posts" },
        }),
      );
    });

    it("returns the merged settings, not the stale stored ones, when permission is denied", async () => {
      (
        SettingsStore.getNotificationSettings as jest.MockedFunction<
          () => Promise<any>
        >
      ).mockResolvedValue({ new_post: { value: true, name: "New Posts" } });
      jest
        .spyOn(Notifications, "getPermissionsAsync")
        .mockResolvedValue({ status: "denied" } as any);
      jest
        .spyOn(Notifications, "requestPermissionsAsync")
        .mockResolvedValue({ status: "denied" } as any);
      jest.spyOn(console, "warn").mockImplementation(() => {});

      const result = await NotificationManager.registerForPushNotifications({
        new_post: { value: false, name: "New Posts" },
      });

      expect(result.notificationSettings.new_post.value).toBe(false);
    });

    it("returns the merged settings, not the stale stored ones, when notifications are unavailable (e.g. web)", async () => {
      const platform = (jest.requireMock("react-native") as any).Platform;
      platform.OS = "web";
      try {
        (
          SettingsStore.getNotificationSettings as jest.MockedFunction<
            () => Promise<any>
          >
        ).mockResolvedValue({ new_post: { value: true, name: "New Posts" } });

        const result = await NotificationManager.registerForPushNotifications({
          new_post: { value: false, name: "New Posts" },
        });

        expect(result.status).toBe("unavailable");
        expect(result.notificationSettings.new_post.value).toBe(false);
        expect(SettingsStore.setNotificationSettings).toHaveBeenCalledWith(
          expect.objectContaining({
            new_post: { value: false, name: "New Posts" },
          }),
        );
      } finally {
        platform.OS = "ios";
      }
    });

    it("returns the merged settings, not the stale stored ones, when fetching the token throws", async () => {
      (
        SettingsStore.getNotificationSettings as jest.MockedFunction<
          () => Promise<any>
        >
      ).mockResolvedValue({ new_post: { value: true, name: "New Posts" } });
      jest
        .spyOn(Notifications, "getPermissionsAsync")
        .mockResolvedValue({ status: "granted" } as any);
      jest
        .spyOn(Notifications, "getExpoPushTokenAsync")
        .mockRejectedValue(new Error("token fetch failed"));
      jest.spyOn(console, "error").mockImplementation(() => {});

      const result = await NotificationManager.registerForPushNotifications({
        new_post: { value: false, name: "New Posts" },
      });

      expect(result.notificationSettings.new_post.value).toBe(false);
    });

    it("returns the merged settings, not the stale stored ones, when no token is returned", async () => {
      (
        SettingsStore.getNotificationSettings as jest.MockedFunction<
          () => Promise<any>
        >
      ).mockResolvedValue({ new_post: { value: true, name: "New Posts" } });
      jest
        .spyOn(Notifications, "getPermissionsAsync")
        .mockResolvedValue({ status: "granted" } as any);
      jest
        .spyOn(Notifications, "getExpoPushTokenAsync")
        .mockResolvedValue({ data: "" } as any);

      const result = await NotificationManager.registerForPushNotifications({
        new_post: { value: false, name: "New Posts" },
      });

      expect(result.notificationSettings.new_post.value).toBe(false);
    });
  });

  describe("requestPermissionAndApplyDefaults", () => {
    afterEach(() => {
      jest.restoreAllMocks();
      const Device = jest.requireMock("expo-device") as any;
      Device.__setIsDeviceValue(true);
    });

    it("requests permission and turns every switch on when granted", async () => {
      (
        SettingsStore.getNotificationSettings as jest.MockedFunction<
          () => Promise<any>
        >
      ).mockResolvedValue({
        new_post: { value: false, name: "New Posts" },
        new_fact_check: { value: false, name: "New Fact Check" },
      });
      jest
        .spyOn(Notifications, "getPermissionsAsync")
        .mockResolvedValue({ status: "undetermined" } as any);
      const requestSpy = jest
        .spyOn(Notifications, "requestPermissionsAsync")
        .mockResolvedValue({ status: "granted" } as any);
      jest
        .spyOn(Notifications, "getExpoPushTokenAsync")
        .mockResolvedValue({ data: "ExponentPushToken[test]" } as any);
      const API = (jest.requireMock("#/helpers/network/ServerAPI") as any)
        .default;
      API.registerNotifications.mockResolvedValue({ status: "ok" });

      const result =
        await NotificationManager.requestPermissionAndApplyDefaults();

      expect(requestSpy).toHaveBeenCalled();
      expect(result.notificationSettings.new_post.value).toBe(true);
      expect(result.notificationSettings.new_fact_check.value).toBe(true);
    });

    it("requests permission and turns every switch off when denied", async () => {
      (
        SettingsStore.getNotificationSettings as jest.MockedFunction<
          () => Promise<any>
        >
      ).mockResolvedValue({
        new_post: { value: true, name: "New Posts" },
        new_fact_check: { value: true, name: "New Fact Check" },
      });
      jest
        .spyOn(Notifications, "getPermissionsAsync")
        .mockResolvedValue({ status: "undetermined" } as any);
      const requestSpy = jest
        .spyOn(Notifications, "requestPermissionsAsync")
        .mockResolvedValue({ status: "denied" } as any);
      jest.spyOn(console, "warn").mockImplementation(() => {});
      const API = (jest.requireMock("#/helpers/network/ServerAPI") as any)
        .default;

      const result =
        await NotificationManager.requestPermissionAndApplyDefaults();

      expect(result.notificationSettings.new_post.value).toBe(false);
      expect(result.notificationSettings.new_fact_check.value).toBe(false);
      // The denied path must not fall through to registerForPushNotifications,
      // which would trigger a second permission request and a server call.
      expect(requestSpy).toHaveBeenCalledTimes(1);
      expect(API.registerNotifications).not.toHaveBeenCalled();
      expect(SettingsStore.setNotificationSettings).toHaveBeenCalledWith(
        result.notificationSettings,
      );
    });

    it("does not re-prompt and keeps stored switch values when permission is already granted", async () => {
      (
        SettingsStore.getNotificationSettings as jest.MockedFunction<
          () => Promise<any>
        >
      ).mockResolvedValue({ new_post: { value: false, name: "New Posts" } });
      jest
        .spyOn(Notifications, "getPermissionsAsync")
        .mockResolvedValue({ status: "granted" } as any);
      const requestSpy = jest.spyOn(Notifications, "requestPermissionsAsync");
      jest
        .spyOn(Notifications, "getExpoPushTokenAsync")
        .mockResolvedValue({ data: "ExponentPushToken[test]" } as any);
      const API = (jest.requireMock("#/helpers/network/ServerAPI") as any)
        .default;
      API.registerNotifications.mockResolvedValue({ status: "ok" });

      const result =
        await NotificationManager.requestPermissionAndApplyDefaults();

      expect(requestSpy).not.toHaveBeenCalled();
      // No prompt was shown, so the user's stored choice (off) must survive
      // instead of being overwritten by the all-on grant defaults — e.g.
      // when onboarding is re-entered after the user customized settings.
      expect(result.notificationSettings.new_post.value).toBe(false);
    });

    it("returns unavailable on simulators without requesting permission", async () => {
      const Device = jest.requireMock("expo-device") as any;
      Device.__setIsDeviceValue(false);
      (
        SettingsStore.getNotificationSettings as jest.MockedFunction<
          () => Promise<any>
        >
      ).mockResolvedValue({ new_post: { value: true, name: "New Posts" } });
      const requestSpy = jest.spyOn(Notifications, "requestPermissionsAsync");

      const result =
        await NotificationManager.requestPermissionAndApplyDefaults();

      expect(requestSpy).not.toHaveBeenCalled();
      expect(result.status).toBe("unavailable");
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
        expect(result.notificationSettings).toEqual({
          ...SettingsStore.defaultNotificationSettings,
          ...mockSettings,
        });
      });
    });

    describe("checkAndRequestOnLaunch", () => {
      it("returns early without checking permissions", async () => {
        const spy = jest.spyOn(Notifications, "getPermissionsAsync");

        await NotificationManager.checkAndRequestOnLaunch();

        expect(spy).not.toHaveBeenCalled();
      });
    });

    describe("requestPermissionAndApplyDefaults", () => {
      it("returns stored settings with status 'foss' without requesting permission", async () => {
        const mockSettings = {
          new_post: { value: true, name: "Neue Artikel" },
        };
        (
          SettingsStore.getNotificationSettings as jest.MockedFunction<
            () => Promise<any>
          >
        ).mockResolvedValue(mockSettings);
        const permissionsSpy = jest.spyOn(Notifications, "getPermissionsAsync");

        const result =
          await NotificationManager.requestPermissionAndApplyDefaults();

        expect(permissionsSpy).not.toHaveBeenCalled();
        expect(result.status).toBe("foss");
        expect(result.notificationSettings).toEqual({
          ...SettingsStore.defaultNotificationSettings,
          ...mockSettings,
        });
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

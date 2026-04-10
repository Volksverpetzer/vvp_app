import * as Application from "expo-application";
import * as Device from "expo-device";
import type * as ExpoNotifications from "expo-notifications";
import { Platform } from "react-native";

import Colors from "#/constants/Colors";
import Config from "#/constants/Config";
import API from "#/helpers/network/ServerAPI";
import type { NotificationSettingType } from "#/types";

import SettingsStore from "./Stores/SettingsStore";

let cachedNotifications: typeof ExpoNotifications | null = null;
let notificationsConfigured = false;

const getNotifications = (): typeof ExpoNotifications | null => {
  if (Config.isFoss) return null;
  if (Platform.OS === "web") return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cachedNotifications ??= require("expo-notifications");
    return cachedNotifications;
  } catch {
    return null;
  }
};

const ensureNotificationsConfigured = () => {
  if (notificationsConfigured) return;
  const Notifications = getNotifications();
  if (!Notifications) return;
  Notifications.setNotificationHandler({
    handleNotification: () =>
      Promise.resolve({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
  });
  notificationsConfigured = true;
};

const NotificationManager = {
  /**
   * Gets the current notification permissions.
   * @returns A promise that resolves to the current notification permissions.
   */
  async getPermissions(): Promise<ExpoNotifications.NotificationPermissionsStatus> {
    ensureNotificationsConfigured();
    const Notifications = getNotifications();
    if (!Notifications) {
      return {
        status: "denied" as ExpoNotifications.PermissionStatus,
        canAskAgain: false,
        granted: false,
        expires: "never",
        ios: undefined,
        android: undefined,
      } satisfies ExpoNotifications.NotificationPermissionsStatus;
    }
    return await Notifications.getPermissionsAsync();
  },

  /**
   * Gets the current notification token.
   * @returns A promise that resolves to the current notification token.
   */
  async getToken(): Promise<string> {
    try {
      // Skip on web and FOSS builds — FCM is not available
      if (Platform.OS === "web" || Config.isFoss) return "";
      ensureNotificationsConfigured();
      const Notifications = getNotifications();
      if (!Notifications) return "";

      const { data } = await Notifications.getExpoPushTokenAsync({
        projectId: Config.eas.projectId,
      });
      return data;
    } catch (error) {
      console.error("Error getting push token:", error);
      throw error;
    }
  },

  /**
   * Refreshes the server with the current notification settings.
   */
  async refreshServer() {
    if (Config.isFoss) return;
    try {
      const Notifications = getNotifications();
      if (!Notifications) return;

      const permissions = await NotificationManager.getPermissions();
      if (permissions.status === Notifications.PermissionStatus.UNDETERMINED) {
        await NotificationManager.registerForPushNotifications();
      }

      // Only proceed if we have permission
      if (permissions.status !== Notifications.PermissionStatus.GRANTED) {
        console.warn("Notification permissions not granted");
        return;
      }

      const storedSettings = await SettingsStore.getNotificationSettings();
      const token = await NotificationManager.getToken();

      if (!token) {
        console.warn("No push token available");
        return;
      }

      const body = {
        expo_token: token,
        settings: storedSettings,
        os: Platform.OS,
        version: Application?.nativeBuildVersion ?? "dev",
      };

      await API.registerNotifications(body);
    } catch (error) {
      console.error("Error refreshing notification settings on server:", error);
    }
  },

  /**
   * Registers the device for push notifications and sends the token along with settings.
   * @param newSettings - Optional new notification settings to be sent to the server.
   * @returns A promise that resolves to an object containing the status and notification settings.
   */
  async registerForPushNotifications(
    newSettings?: Partial<NotificationSettingType>,
  ): Promise<{
    status: string;
    notificationSettings: NotificationSettingType;
  }> {
    if (Config.isFoss) {
      const storedSettings = await SettingsStore.getNotificationSettings();
      return { status: "foss", notificationSettings: storedSettings };
    }
    ensureNotificationsConfigured();
    const Notifications = getNotifications();
    if (!Notifications) {
      const storedSettings = await SettingsStore.getNotificationSettings();
      return { status: "unavailable", notificationSettings: storedSettings };
    }

    let token: string;

    const storedSettings = await SettingsStore.getNotificationSettings();

    const notificationSettings = {
      ...SettingsStore.defaultNotificationSettings,
      ...storedSettings,
      ...newSettings,
    };

    if (Platform.OS === "android") {
      // Create a default channel for general notifications
      await Notifications.setNotificationChannelAsync("default", {
        name: "Default Notifications",
        description: "Default channel for all notifications",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: Colors.light.corporate,
        enableLights: true,
        enableVibrate: true,
        showBadge: true,
      });

      // Create a channel for news notifications
      await Notifications.setNotificationChannelAsync("news", {
        name: "News Notifications",
        description: "Notifications for new articles and updates",
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: Colors.light.corporate,
        enableLights: true,
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== "granted") {
        console.warn("Notification permission not granted");
        return { status: finalStatus, notificationSettings: storedSettings };
      }
      try {
        token = await NotificationManager.getToken();
      } catch (error) {
        console.error(error);
        return {
          status: "error getting token" + error,
          notificationSettings: storedSettings,
        };
      }
      if (!token) {
        return { status: "No Token", notificationSettings: storedSettings };
      }
    } else {
      return { status: "ok", notificationSettings };
    }

    /** Merge default, stored, and new settings. */

    const body = {
      expo_token: token,
      settings: notificationSettings,
      os: Platform.OS,
      version: Application?.nativeBuildVersion,
    };
    await SettingsStore.setNotificationSettings(notificationSettings);
    const response = await API.registerNotifications(body);
    return { status: response.status, notificationSettings };
  },

  /**
   * On app launch check current permissions and request them when appropriate.
   * - If status is UNDETERMINED -> request permissions
   * - If status is DENIED but canAskAgain -> request permissions
   * - If granted -> refresh server registration
   * This function is safe on simulators and will not attempt requests there.
   */
  async checkAndRequestOnLaunch(): Promise<void> {
    if (Config.isFoss) return;
    try {
      // Don't request on simulators/emulators
      if (!Device.isDevice) {
        return;
      }

      ensureNotificationsConfigured();
      const Notifications = getNotifications();
      if (!Notifications) return;

      const permissions = await Notifications.getPermissionsAsync();

      if (permissions.status === Notifications.PermissionStatus.GRANTED) {
        // Ensure server is up-to-date
        await NotificationManager.refreshServer();
        return;
      }

      // If undetermined, ask right away
      if (permissions.status === Notifications.PermissionStatus.UNDETERMINED) {
        await NotificationManager.registerForPushNotifications();
        return;
      }

      // permissions.status === DENIED (or other) — ask again only if the platform
      // indicates we can ask again.
      const canAskAgain = permissions?.canAskAgain;
      if (canAskAgain) {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status === Notifications.PermissionStatus.GRANTED) {
          await NotificationManager.registerForPushNotifications();
        }
      } else {
        // Final denial — we could optionally surface a UI hint to open settings.
        console.info("Notifications: permission denied and cannot ask again");
      }
    } catch (error) {
      console.error("Error during checkAndRequestOnLaunch:", error);
    }
  },

  /**
   * Schedules a local "donation reminder" notification (best-effort).
   * No-op for FOSS builds or when notifications aren't available.
   */
  async scheduleDonationReminder(date: Date): Promise<void> {
    try {
      if (Config.isFoss) return;
      ensureNotificationsConfigured();
      const Notifications = getNotifications();
      if (!Notifications) return;
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Danke für deine Spende! 📬",
          body: "Wir haben uns sehr gefreut, dass du uns im letzten Monat unterstützt hast.",
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date,
        },
      });
    } catch (error) {
      console.info("Notifications: failed to schedule reminder", error);
    }
  },
};

export default NotificationManager;

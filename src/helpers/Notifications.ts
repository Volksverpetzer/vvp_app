import * as Application from "expo-application";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import Colors from "#/constants/Colors";
import Config from "#/constants/Config";
import { NotificationSettingType } from "#/types";

import API from "./Networking/ServerAPI";
import SettingsStore from "./Stores/SettingsStore";

// Configure the notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const NotificationManager = {
  /**
   * Gets the current notification permissions.
   * @returns A promise that resolves to the current notification permissions.
   */
  async getPermissions(): Promise<Notifications.NotificationPermissionsStatus> {
    return Notifications.getPermissionsAsync();
  },

  /**
   * Gets the current notification token.
   * @returns A promise that resolves to the current notification token.
   */
  async getToken(): Promise<string> {
    try {
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
   * Checks if push notifications are properly configured on the device.
   * @returns A promise that resolves to a boolean indicating if notifications are properly configured.
   */
  async checkNotificationsConfigured(): Promise<boolean> {
    // Check if we're on a physical device
    if (!Device.isDevice) {
      console.warn("Push notifications are not supported in the simulator");
      return false;
    }

    // Check permissions
    const { status } = await Notifications.getPermissionsAsync();
    return status === "granted";
  },

  /**
   * Refreshes the server with the current notification settings.
   */
  async refreshServer() {
    try {
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
};

export default NotificationManager;

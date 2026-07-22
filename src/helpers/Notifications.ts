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
// Serializes registerForPushNotifications calls (see its doc comment).
let registrationChain: Promise<void> = Promise.resolve();
// Android notification channels only need to be created once per process;
// re-creating them on every registration adds two awaits to each settings
// toggle for nothing (Android freezes channel config after first creation).
let channelsConfigured = false;

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
   *
   * Calls are serialized through a shared promise chain: each registration
   * reads stored settings, merges its own keys, and writes/POSTs the full
   * object, so two concurrent calls could otherwise resurrect each other's
   * stale values (read-merge-write race).
   * @param newSettings - Optional new notification settings to be sent to the server.
   * @returns A promise that resolves to an object containing the status and notification settings.
   */
  registerForPushNotifications(
    newSettings?: Partial<NotificationSettingType>,
  ): Promise<{
    status: string;
    notificationSettings: NotificationSettingType;
  }> {
    const run = registrationChain.then(() =>
      this.performRegistration(newSettings),
    );
    // Keep the chain alive after failures so the next call still runs.
    registrationChain = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  },

  /** Inner implementation of registerForPushNotifications — do not call
   * directly, it must only run serialized through the chain above. */
  async performRegistration(
    newSettings?: Partial<NotificationSettingType>,
  ): Promise<{
    status: string;
    notificationSettings: NotificationSettingType;
  }> {
    const storedSettings = await SettingsStore.getNotificationSettings();
    const notificationSettings = {
      ...SettingsStore.defaultNotificationSettings,
      ...storedSettings,
      ...newSettings,
    };
    // Persist locally right away so settings survive even if push
    // registration below fails or is unavailable (FOSS build, web, no
    // permission, no device).
    await SettingsStore.setNotificationSettings(notificationSettings);

    if (Config.isFoss) {
      return { status: "foss", notificationSettings };
    }
    ensureNotificationsConfigured();
    const Notifications = getNotifications();
    if (!Notifications) {
      return { status: "unavailable", notificationSettings };
    }

    let token: string;

    if (Platform.OS === "android" && !channelsConfigured) {
      channelsConfigured = true;
      // Create a default channel for general notifications
      await Notifications.setNotificationChannelAsync("default", {
        name: "Default Notifications",
        description: "Default channel for all notifications",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: Colors.light.primary,
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
        lightColor: Colors.light.primary,
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
        return { status: finalStatus, notificationSettings };
      }
      try {
        token = await NotificationManager.getToken();
      } catch (error) {
        console.error(error);
        return {
          status: `error getting token: ${error}`,
          notificationSettings,
        };
      }
      if (!token) {
        return { status: "No Token", notificationSettings };
      }
    } else {
      return { status: "ok", notificationSettings };
    }

    const body = {
      expo_token: token,
      settings: notificationSettings,
      os: Platform.OS,
      version: Application?.nativeBuildVersion,
    };
    const response = await API.registerNotifications(body);
    return { status: response.status, notificationSettings };
  },

  /**
   * Requests OS notification permission when it is not already granted and
   * syncs all notification-category switches to the outcome of that request:
   * freshly granted -> all on, denied/dismissed -> all off. When permission
   * was already granted beforehand (no prompt shown, e.g. onboarding was
   * re-entered), the stored switch values are kept as-is and only the
   * token/server registration is refreshed. The OS only actually shows a
   * dialog while it may still ask (undetermined, or denied with canAskAgain
   * on Android); otherwise the request resolves silently with the existing
   * denial.
   * Used by the onboarding notification step, which wants the OS prompt to
   * appear as soon as the step is shown rather than per-switch.
   */
  async requestPermissionAndApplyDefaults(): Promise<{
    status: string;
    notificationSettings: NotificationSettingType;
  }> {
    const storedSettings = await SettingsStore.getNotificationSettings();
    const currentSettings = {
      ...SettingsStore.defaultNotificationSettings,
      ...storedSettings,
    };

    if (Config.isFoss) {
      return { status: "foss", notificationSettings: currentSettings };
    }
    ensureNotificationsConfigured();
    const Notifications = getNotifications();
    if (!Notifications || !Device.isDevice) {
      return { status: "unavailable", notificationSettings: currentSettings };
    }

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();

    if (existingStatus === "granted") {
      // Permission was already granted before this step — no prompt was
      // shown, so don't force the all-on defaults over switch values the
      // user may have customized; just refresh token/server registration.
      return await NotificationManager.registerForPushNotifications();
    }

    const { status: finalStatus } =
      await Notifications.requestPermissionsAsync();
    const granted = finalStatus === "granted";
    const notificationSettings = Object.fromEntries(
      Object.entries(currentSettings).map(([key, setting]) => [
        key,
        { ...setting, value: granted },
      ]),
    ) as NotificationSettingType;

    if (!granted) {
      // Persist the all-off settings locally, but skip
      // registerForPushNotifications: its own permission check would call
      // requestPermissionsAsync a second time (re-prompting on platforms
      // where canAskAgain is still true), and without permission there is
      // no token to register anyway.
      await SettingsStore.setNotificationSettings(notificationSettings);
      return { status: finalStatus, notificationSettings };
    }

    return await NotificationManager.registerForPushNotifications(
      notificationSettings,
    );
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

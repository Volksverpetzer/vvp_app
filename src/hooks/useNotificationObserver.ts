import * as Linking from "expo-linking";
import type { Href } from "expo-router";
import { router } from "expo-router";
import { useEffect } from "react";
import { Platform } from "react-native";

import Config from "#/constants/Config";

/**
 * Hook to handle initial and response-based notification redirects.
 * On mount, checks last notification response and listens for new ones.
 * Note: This hook is a no-op on web as notifications are not fully supported.
 */
export const useNotificationObserver = () => {
  useEffect(() => {
    // Skip on web and FOSS builds — FCM is not available
    if (Platform.OS === "web" || Config.isFoss) return;

    let isMounted = true;
    let Notifications: typeof import("expo-notifications") | null = null;
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      Notifications = require("expo-notifications");
    } catch {
      return;
    }

    /**
     * Redirects to the URL from the notification response.
     * @param response - The notification response containing the URL.
     */
    const redirect = (
      response: import("expo-notifications").NotificationResponse,
    ) => {
      const url = response.notification.request.content.data?.url;
      if (!url || typeof url !== "string") return;
      // delay redirect to allow router to be mounted
      setTimeout(() => {
        const { path } = Linking.parse(url);
        if (path) router.push(path as Href);
      }, 2000);
    };

    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!isMounted || !response) return;
      redirect(response);
    });

    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => redirect(response),
    );
    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, []);
};

import * as Linking from "expo-linking";
import type * as ExpoNotifications from "expo-notifications";
import type { Href } from "expo-router";
import { router } from "expo-router";
import { useEffect } from "react";
import { Platform } from "react-native";

import { redirectSystemPath } from "#/app/+native-intent";
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
    let Notifications: typeof ExpoNotifications | null = null;
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
    const redirect = (response: ExpoNotifications.NotificationResponse) => {
      const url = response.notification.request.content.data?.url;
      if (!url || typeof url !== "string") return;
      // delay redirect to allow router to be mounted
      setTimeout(() => {
        // Route like an opened link: articles from a secondary WordPress feed
        // (e.g. pruefpunkt.org) need originalUrl, otherwise the article route
        // looks the slug up on the primary site and falls back to a 404 page.
        // Unrecognized URLs come back unchanged; keep their plain path.
        const target = redirectSystemPath({ path: url });
        const href = target === url ? Linking.parse(url).path : target;
        if (href) router.push(href as Href);
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

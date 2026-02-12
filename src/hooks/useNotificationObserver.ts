import * as Linking from "expo-linking";
import * as Notifications from "expo-notifications";
import { Href, router } from "expo-router";
import { useEffect } from "react";

/**
 * Hook to handle initial and response-based notification redirects.
 * On mount, checks last notification response and listens for new ones.
 */
export const useNotificationObserver = () => {
  useEffect(() => {
    let isMounted = true;

    /**
     * Redirects to the URL from the notification response.
     * @param response - The notification response containing the URL.
     */
    const redirect = (response: Notifications.NotificationResponse) => {
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

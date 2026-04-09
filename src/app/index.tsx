import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";

import UiSpinner from "#/components/ui/UiSpinner";
import Config from "#/constants/Config";
import { shouldExcludeFromDeepLink } from "#/helpers/DeepLinkFilter";
import NotificationManager from "#/helpers/Notifications";
import Statistics from "#/helpers/Statistics";
import ContentStore from "#/helpers/Stores/ContentStore";
import PersonalStore from "#/helpers/Stores/PersonalStore";

/**
 * This is the entry point of the app.
 * It loads the onboarding or the home screen based on whether the user has finished the onboarding or not.
 */
const Index = () => {
  const router = useRouter();
  const didNavigate = useRef(false);

  const appOpenRoutine = () => {
    Statistics.countAppOpened();
    NotificationManager.refreshServer();
    ContentStore.clear();
  };

  useEffect(() => {
    if (didNavigate.current) return;
    didNavigate.current = true;

    // If the app was launched via a deep/universal link, let Expo Router handle it.
    // Avoid overriding the initial URL by redirecting to onboarding/home here.
    (async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        const { hostname, path } = Linking.parse(initialUrl);
        const { hostname: baseHost } = Linking.parse(Config.wpUrl);

        const hasPath =
          typeof path === "string" && path.replace(/\//g, "").length > 0;
        if (
          hostname === baseHost &&
          hasPath &&
          !shouldExcludeFromDeepLink(path)
        ) {
          // Launched via a Volksverpetzer article URL. Let Expo Router handle it.
          appOpenRoutine();
          return;
        }
      }

      // No initial URL: proceed with normal first-screen decision
      appOpenRoutine();
      PersonalStore.isOnboardingDone().then((onboarded) => {
        if (onboarded) {
          router.dismissTo("/home");
        } else {
          router.replace("/onboarding");
        }
      });
    })();
  }, [router]);
  return <UiSpinner size="large" />;
};

export default Index;

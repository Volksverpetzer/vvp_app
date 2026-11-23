import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";

import UiSpinner from "#/components/ui/UiSpinner";
import Config from "#/constants/Config";
import { claimAppLaunch } from "#/helpers/AppStart";
import { shouldExcludeFromDeepLink } from "#/helpers/DeepLinkFilter";
import Statistics from "#/helpers/Statistics";
import ContentStore from "#/helpers/Stores/ContentStore";
import PersonalStore from "#/helpers/Stores/PersonalStore";
import { normalizeHost } from "#/helpers/utils/host";

/**
 * This is the entry point of the app.
 * It loads the onboarding or the home screen based on whether the user has finished the onboarding or not.
 */
const Index = () => {
  const router = useRouter();
  const didNavigate = useRef(false);

  // Notification registration is not refreshed here: _layout's
  // checkAndRequestOnLaunch does it once onboarding is done. Calling it here
  // too ran before the onboarding check (prompting fresh installs at launch)
  // and sent a second /register for everyone else.
  const appOpenRoutine = () => {
    Statistics.countAppOpened();
    ContentStore.clear();
  };

  useEffect(() => {
    if (didNavigate.current) return;
    didNavigate.current = true;

    // If the app was launched via a deep/universal link, let Expo Router handle it.
    // Avoid overriding the initial URL by redirecting to onboarding/home here.
    (async () => {
      try {
        // Index remounts whenever something navigates to "/" later on, but
        // getInitialURL() keeps returning the cold-start URL for the whole
        // process. Only the first mount handles the launch; later ones just
        // go to home/onboarding.
        if (!claimAppLaunch()) {
          const onboarded = await PersonalStore.isOnboardingDone();
          router.dismissTo(onboarded ? "/home" : "/onboarding");
          return;
        }

        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) {
          const { hostname, path } = Linking.parse(initialUrl);
          const { hostname: baseHost } = Linking.parse(Config.wpUrl);
          const isBaseHost =
            normalizeHost(hostname) === normalizeHost(baseHost);

          if (isBaseHost && shouldExcludeFromDeepLink(path)) {
            await Linking.openURL(initialUrl);
            appOpenRoutine();
            const onboarded = await PersonalStore.isOnboardingDone();
            router.dismissTo(onboarded ? "/home" : "/onboarding");
            return;
          }

          const hasPath =
            typeof path === "string" && path.replaceAll("/", "").length > 0;
          if (isBaseHost && hasPath) {
            appOpenRoutine();
            return;
          }
        }

        appOpenRoutine();
        const onboarded = await PersonalStore.isOnboardingDone();
        router.dismissTo(onboarded ? "/home" : "/onboarding");
      } catch (error) {
        console.error("App open error:", error);
        appOpenRoutine();
        router.replace("/onboarding");
      }
    })();
  }, [router]);
  return <UiSpinner size="large" />;
};

export default Index;

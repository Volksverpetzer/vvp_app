import * as Linking from "expo-linking";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef } from "react";

import UiSpinner from "#/components/ui/UiSpinner";
import Config from "#/constants/Config";
import { shouldExcludeFromDeepLink } from "#/helpers/DeepLinkFilter";
import { outBoundLinkPress } from "#/helpers/Linking";
import PersonalStore from "#/helpers/Stores/PersonalStore";
import { isHttpsUrl } from "#/helpers/utils/networking";

/**
 * Intermediate screen for URLs that the app should not handle itself
 * (e.g. /wp-content/uploads/ PDFs). Opens the URL with the OS default
 * handler, then navigates the user to the appropriate home screen.
 *
 * Reached via redirectSystemPath in +native-intent.tsx when an excluded
 * URL is opened as a universal/app link. Using a dedicated route (rather
 * than relying on index.tsx + getInitialURL) ensures the URL is always
 * available via params regardless of navigation initialisation order.
 */
const External = () => {
  const router = useRouter();
  const { url } = useLocalSearchParams<{ url?: string }>();
  const didOpen = useRef(false);

  useEffect(() => {
    if (didOpen.current) return;
    didOpen.current = true;

    (async () => {
      if (typeof url === "string") {
        try {
          const { hostname, path } = Linking.parse(url);
          const { hostname: baseHost } = Linking.parse(Config.wpUrl);
          if (
            isHttpsUrl(url) &&
            hostname === baseHost &&
            shouldExcludeFromDeepLink(path)
          ) {
            outBoundLinkPress(url);
          }
        } catch {
          // Malformed URL — ignore, fall through to home
        }
      }

      const onboarded = await PersonalStore.isOnboardingDone();
      router.replace(onboarded ? "/(tabs)/home" : "/onboarding");
    })();
  }, [router, url]);

  return <UiSpinner size="large" />;
};

export default External;

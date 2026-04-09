import * as Linking from "expo-linking";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef } from "react";

import UiSpinner from "#/components/ui/UiSpinner";
import Config from "#/constants/Config";
import { shouldExcludeFromDeepLink } from "#/helpers/DeepLinkFilter";
import { outBoundLinkPress } from "#/helpers/Linking";
import { isHttpsUrl } from "#/helpers/utils/networking";

const External = () => {
  const router = useRouter();
  const { url } = useLocalSearchParams<{ url?: string }>();
  const didOpen = useRef(false);

  useEffect(() => {
    if (didOpen.current) return;
    didOpen.current = true;

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
        // Malformed URL — ignore and fall through to router.replace("/")
      }
    }

    // Return user to the app shell. If they come back from the OS handler,
    // they should not be stuck on an intermediate screen.
    router.replace("/");
  }, [router, url]);

  return <UiSpinner size="large" />;
};

export default External;

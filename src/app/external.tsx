import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef } from "react";

import UiSpinner from "#/components/ui/UiSpinner";
import { outBoundLinkPress } from "#/helpers/Linking";
import type { HttpsUrl } from "#/types";

const External = () => {
  const router = useRouter();
  const { url } = useLocalSearchParams<{ url?: string }>();
  const didOpen = useRef(false);

  useEffect(() => {
    if (didOpen.current) return;
    didOpen.current = true;

    if (typeof url === "string" && /^https:\/\//.test(url)) {
      outBoundLinkPress(url as HttpsUrl);
    }

    // Return user to the app shell. If they come back from the OS handler,
    // they should not be stuck on an intermediate screen.
    router.replace("/");
  }, [router, url]);

  return <UiSpinner size="large" />;
};

export default External;

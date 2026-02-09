import * as Linking from "expo-linking";
import { Href, useRouter } from "expo-router";
import { useShareIntentContext } from "expo-share-intent";
import { useEffect } from "react";

import Config from "#/constants/Config";

/**
 * Hook that routes incoming share intents. Call this inside a component mounted
 * under `ShareIntentProvider` (e.g. a small wrapper in `_layout.tsx`).
 */
export const useHandleShareIntent = () => {
  const router = useRouter();
  const { shareIntent, hasShareIntent } = useShareIntentContext();

  useEffect(() => {
    if (!hasShareIntent || !shareIntent) return;

    // Delay routing to allow root layout to finish mounting
    const t = setTimeout(() => {
      if (shareIntent?.type === "weburl") {
        try {
          const { path } = Linking.parse(shareIntent.webUrl);
          if (!shareIntent.webUrl.includes(Config.wpUrl)) {
            router.push(
              `/search?tag=${encodeURIComponent(shareIntent.webUrl)}` as unknown as Href,
            );
            return;
          }

          router.push(path as Href);
        } catch {
          // swallow malformed urls
        }
      }
    }, 0);

    return () => clearTimeout(t);
  }, [hasShareIntent, router, shareIntent]);
};

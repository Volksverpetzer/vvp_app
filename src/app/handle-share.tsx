import * as Linking from "expo-linking";
import type { Href } from "expo-router";
import { useRouter } from "expo-router";
import type { SharePayload, ShareType } from "expo-sharing";
import { clearSharedPayloads, useIncomingShare } from "expo-sharing";
import { useEffect } from "react";
import { Button, View } from "react-native";

import UiSpinner from "#/components/ui/UiSpinner";
import UiText from "#/components/ui/UiText";
import Config from "#/constants/Config";
import { spacing } from "#/constants/Spacing";
import { shouldExcludeFromDeepLink } from "#/helpers/DeepLinkFilter";
import { openExternalDownload } from "#/helpers/Linking";
import { markShareIntentUrl } from "#/helpers/ShareIntent";
import { findSecondaryWpFeed } from "#/helpers/utils/feeds";
import { isSameHost } from "#/helpers/utils/host";
import { isHttpsUrl } from "#/helpers/utils/networking";

const URL_SHARE_TYPE: ShareType = "url";
const TEXT_SHARE_TYPE: ShareType = "text";

const HandleShare = () => {
  const router = useRouter();
  const { error, isResolving, sharedPayloads } = useIncomingShare();
  const firstPayload: SharePayload | undefined = sharedPayloads[0];
  const hasShareIntent = sharedPayloads.length > 0;

  useEffect(() => {
    if (!hasShareIntent || !firstPayload) {
      return;
    }

    if (firstPayload.shareType === URL_SHARE_TYPE) {
      const sharedUrl = firstPayload.value;

      try {
        const { path } = Linking.parse(sharedUrl);
        // Open in-app when the shared URL is the primary site or a configured
        // WordPress feed (e.g. pruefpunkt.org); otherwise treat it as a search.
        const secondary = findSecondaryWpFeed(
          sharedUrl,
          Config.wpUrl,
          Config.feeds?.wp,
        );
        const isInternal = isSameHost(sharedUrl, Config.wpUrl) || !!secondary;

        if (!isInternal) {
          markShareIntentUrl(sharedUrl);
          router.replace({
            pathname: "/search",
            params: { tag: sharedUrl },
          });
          clearSharedPayloads();
          return;
        }

        if (shouldExcludeFromDeepLink(path)) {
          // openExternalDownload requires an https URL; fall back to the OS
          // handler for the (unexpected) non-https case rather than casting.
          const openExternally = isHttpsUrl(sharedUrl)
            ? openExternalDownload(sharedUrl)
            : Linking.openURL(sharedUrl);
          openExternally
            .catch((linkError) => {
              console.warn(
                "Failed to open excluded URL:",
                sharedUrl,
                linkError,
              );
            })
            .finally(() => {
              clearSharedPayloads();
              router.replace("/");
            });
          return;
        }

        const href =
          typeof path === "string" && path.length > 0
            ? path.startsWith("/")
              ? path
              : `/${path}`
            : "/search";

        // Linking.parse drops the URL fragment; carry it over from the raw
        // URL so anchored shares (…/article/#quellen) still jump to their
        // section. Expo Router exposes it to the route as the `#` param.
        let fragment = "";
        try {
          fragment = new URL(sharedUrl).hash;
        } catch {
          // Not an absolute URL — no fragment to carry over.
        }

        // Secondary-site articles need originalUrl so the article route fetches
        // from the right WordPress API. Build a string href (query before the
        // fragment, like +native-intent does) — the object form must not be
        // used here: expo-router's resolveHref does not encode a `#` param
        // key, so `params: { "#": … }` corrupts both the anchor and any
        // params serialized after it.
        if (secondary && href !== "/search") {
          const search = `?originalUrl=${encodeURIComponent(sharedUrl)}`;
          router.replace(`${href}${search}${fragment}` as Href);
        } else {
          const anchoredHref = href === "/search" ? href : `${href}${fragment}`;
          router.replace(anchoredHref as Href);
        }
        clearSharedPayloads();
        return;
      } catch {
        markShareIntentUrl(sharedUrl);
        router.replace({
          pathname: "/search",
          params: { tag: sharedUrl },
        });
        clearSharedPayloads();
        return;
      }
    }

    if (firstPayload.shareType === TEXT_SHARE_TYPE) {
      markShareIntentUrl(firstPayload.value);
      router.replace({
        pathname: "/search",
        params: { tag: firstPayload.value },
      });
      clearSharedPayloads();
      return;
    }

    clearSharedPayloads();
    router.replace("/");
  }, [firstPayload, hasShareIntent, router]);

  if (isResolving) {
    return (
      <UiSpinner
        size="large"
        text="Share wird verarbeitet..."
        containerStyle={{ padding: spacing.xxl }}
      />
    );
  }

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: spacing.xxl,
        gap: spacing.md,
      }}
    >
      {!hasShareIntent ? (
        <UiText>Kein geteilter Inhalt gefunden.</UiText>
      ) : null}
      {error ? <UiText>{error.message}</UiText> : null}
      {!hasShareIntent || error ? (
        <Button onPress={() => router.replace("/")} title="Go home" />
      ) : null}
    </View>
  );
};

export default HandleShare;

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
import { shouldExcludeFromDeepLink } from "#/helpers/DeepLinkFilter";
import { openExternalDownload } from "#/helpers/Linking";
import { findSecondaryWpFeed } from "#/helpers/utils/feeds";
import { isSameHost } from "#/helpers/utils/host";
import type { HttpsUrl } from "#/types";

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
          router.replace({
            pathname: "/search",
            params: { tag: sharedUrl },
          });
          clearSharedPayloads();
          return;
        }

        if (shouldExcludeFromDeepLink(path)) {
          openExternalDownload(sharedUrl as HttpsUrl)
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

        // Secondary-site articles need originalUrl so the article route fetches
        // from the right WordPress API.
        if (secondary && href !== "/search") {
          router.replace({
            pathname: href,
            params: { originalUrl: sharedUrl },
          } as unknown as Href);
        } else {
          router.replace(href as Href);
        }
        clearSharedPayloads();
        return;
      } catch {
        router.replace({
          pathname: "/search",
          params: { tag: sharedUrl },
        });
        clearSharedPayloads();
        return;
      }
    }

    if (firstPayload.shareType === TEXT_SHARE_TYPE) {
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
        containerStyle={{ padding: 24 }}
      />
    );
  }

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        gap: 12,
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

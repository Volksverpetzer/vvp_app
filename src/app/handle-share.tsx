import * as Linking from "expo-linking";
import type { Href } from "expo-router";
import { useRouter } from "expo-router";
import type { SharePayload, ShareType } from "expo-sharing";
import { clearSharedPayloads, useIncomingShare } from "expo-sharing";
import { useEffect } from "react";
import { Button, Text, View } from "react-native";

import UiSpinner from "#/components/animations/UiSpinner";
import Config from "#/constants/Config";
import { shouldExcludeFromDeepLink } from "#/helpers/DeepLinkFilter";

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
        const { hostname, path } = Linking.parse(sharedUrl);
        const { hostname: baseHostname } = Linking.parse(Config.wpUrl);

        if (hostname !== baseHostname) {
          router.replace({
            pathname: "/search",
            params: { tag: sharedUrl },
          });
          clearSharedPayloads();
          return;
        }

        if (shouldExcludeFromDeepLink(path)) {
          Linking.openURL(sharedUrl)
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

        router.replace(href as Href);
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
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          gap: 12,
        }}
      >
        <UiSpinner size={"large"} />
        <Text>Share wird verarbeitet...</Text>
      </View>
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
      {!hasShareIntent ? <Text>Kein geteilter Inhalt gefunden.</Text> : null}
      {error ? <Text>{error.message}</Text> : null}
      {!hasShareIntent || error ? (
        <Button onPress={() => router.replace("/")} title="Go home" />
      ) : null}
    </View>
  );
};

export default HandleShare;

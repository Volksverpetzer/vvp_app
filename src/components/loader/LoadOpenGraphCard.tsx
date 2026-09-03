import { Image } from "expo-image";
import { useEffect, useState } from "react";
import { View } from "react-native";

import { ExternalLinkIcon } from "#/components/Icons";
import UiCard from "#/components/ui/UiCard";
import UiPressable from "#/components/ui/UiPressable";
import UiSpinner from "#/components/ui/UiSpinner";
import UiText from "#/components/ui/UiText";
import Colors from "#/constants/Colors";
import { spacing } from "#/constants/Spacing";
import type { OpenGraphPreview } from "#/helpers/utils/openGraph";
import { fetchOpenGraphPreview } from "#/helpers/utils/openGraph";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";
import type { HttpsUrl } from "#/types";

export interface LoadOpenGraphCardProperties {
  url: HttpsUrl;
  /** Shown while the preview is loading and if it comes back without a title. */
  fallbackTitle: string;
  onPress: (event: unknown) => void;
}

/**
 * A small link-out card for `url`, previewed via its Open Graph
 * title/description/image. Used where the real content can't be loaded
 * natively as an article (e.g. a WordPress "project" page, whose REST
 * endpoint isn't public) but is otherwise a normal public page worth
 * showing a proper preview for, not a bare error.
 */
const LoadOpenGraphCard = ({
  url,
  fallbackTitle,
  onPress,
}: LoadOpenGraphCardProperties) => {
  const colorScheme = useAppColorScheme();
  const [preview, setPreview] = useState<OpenGraphPreview | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    setIsLoading(true);
    fetchOpenGraphPreview(url, controller.signal).then((result) => {
      if (!isMounted) return;
      setPreview(result);
      setIsLoading(false);
    });
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [url]);

  if (isLoading) {
    return (
      <View
        style={{
          marginHorizontal: spacing.md,
          minHeight: 100,
          justifyContent: "center",
        }}
      >
        <UiSpinner />
      </View>
    );
  }

  return (
    <UiPressable
      accessibilityRole="link"
      onPress={onPress}
      style={{ marginHorizontal: spacing.md }}
    >
      <UiCard style={{ padding: 0, overflow: "hidden" }}>
        {preview?.image && (
          <Image
            source={{ uri: preview.image }}
            style={{ width: "100%", aspectRatio: 1200 / 630 }}
            contentFit="cover"
          />
        )}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.md,
            padding: spacing.md,
          }}
        >
          <View style={{ flex: 1, gap: spacing.xs }}>
            <UiText bold numberOfLines={2}>
              {preview?.title ?? fallbackTitle}
            </UiText>
            {preview?.description && (
              <UiText
                size="sm"
                numberOfLines={2}
                style={{ color: Colors[colorScheme].textMuted }}
              >
                {preview.description}
              </UiText>
            )}
          </View>
          <ExternalLinkIcon color={Colors[colorScheme].textMuted} />
        </View>
      </UiCard>
    </UiPressable>
  );
};

export default LoadOpenGraphCard;

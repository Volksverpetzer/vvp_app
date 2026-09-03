import { Image } from "expo-image";
import { useEffect, useMemo, useState } from "react";
import { View } from "react-native";

import UiCard from "#/components/ui/UiCard";
import UiPressable from "#/components/ui/UiPressable";
import UiSpinner from "#/components/ui/UiSpinner";
import UiText from "#/components/ui/UiText";
import { radii } from "#/constants/BorderRadius";
import Colors from "#/constants/Colors";
import { elevation } from "#/constants/Elevation";
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

  // Matches ArticlePost's `elevated` card look, so an embed preview reads as
  // the same kind of card as a resolved article embed right above/below it.
  const shadowWrapperStyle = useMemo(() => {
    const isDark = colorScheme === "dark";
    const shadowRgb = isDark ? "255, 255, 255" : "0, 0, 0";
    const shadowOpacity = isDark ? 0.12 : elevation.xs.opacity;
    return {
      borderRadius: radii.lg,
      boxShadow: `0px ${elevation.xs.offsetY}px ${elevation.xs.blur}px rgba(${shadowRgb}, ${shadowOpacity})`,
      elevation: elevation.xs.android,
    };
  }, [colorScheme]);

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
    <View style={[{ marginHorizontal: spacing.md }, shadowWrapperStyle]}>
      <UiPressable accessibilityRole="link" onPress={onPress}>
        <UiCard
          style={{
            padding: 0,
            overflow: "hidden",
            borderRadius: radii.lg,
            borderWidth: 1,
            borderColor: Colors[colorScheme].surface,
          }}
        >
          {preview?.image && (
            <Image
              source={{ uri: preview.image }}
              style={{ width: "100%", aspectRatio: 1200 / 630 }}
              contentFit="cover"
            />
          )}
          <View style={{ gap: spacing.xs, padding: spacing.md }}>
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
        </UiCard>
      </UiPressable>
    </View>
  );
};

export default LoadOpenGraphCard;

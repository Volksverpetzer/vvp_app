import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { DimensionValue, TextStyle } from "react-native";
import { View } from "react-native";

import ViewCounter from "#/components/counter/ViewCounter";
import Typography from "#/components/ui/Typography";
import UiBadge from "#/components/ui/UiBadge";
import UiPressable from "#/components/ui/UiPressable";
import UiSpace from "#/components/ui/UiSpace";
import UiSpinner from "#/components/ui/UiSpinner";
import UiText from "#/components/ui/UiText";
import { radii } from "#/constants/BorderRadius";
import Colors from "#/constants/Colors";
import Config from "#/constants/Config";
import { elevation } from "#/constants/Elevation";
import {
  CARD_CONTENT_GAP,
  DEFAULT_IMAGE_ASPECT_RATIO,
  POST_PADDING_HORIZONTAL,
  globalStyles,
} from "#/constants/GlobalStyles";
import { iconSizes } from "#/constants/IconSizes";
import { layers } from "#/constants/Layers";
import { spacing } from "#/constants/Spacing";
import { AppImages } from "#/helpers/AppImages";
import { onLinkPress } from "#/helpers/Linking";
import { onShare } from "#/helpers/Sharing";
import ContentStore from "#/helpers/Stores/ContentStore";
import PersonalStore from "#/helpers/Stores/PersonalStore";
import WordPressAPI from "#/helpers/network/WordPressAPI";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";
import { useFeedDimensions } from "#/hooks/useFeedDimensions";
import type { ArticleProperties, ImageCredit } from "#/types";

import ImageCreditBadge from "./ImageCreditBadge";

// Define the component props type.
interface ArticlePostScreenProperties {
  article: ArticleProperties;
  inView?: boolean;
  elevated?: boolean;
}

/**
 * ArticlePost renders a short preview of an article fetched from a WordPress API.
 *
 * Optimizations applied:
 * - All hooks (useMemo, useCallback, useEffect) are called unconditionally.
 * - Computed styles, text values and dimensions are memoized.
 * - Event handlers are wrapped in useCallback.
 * - The component is wrapped with React.memo to prevent unnecessary re-renders.
 */
const ArticlePost = (properties: ArticlePostScreenProperties) => {
  const { article, inView, elevated = false } = properties;

  // Local state.
  const [imageUrl, setImgURL] = useState("");
  const [imageCredit, setImageCredit] = useState<ImageCredit | undefined>();
  const [scrollProgress, setScrollProgress] = useState<DimensionValue>("0%");
  const [viewCount, setViewCount] = useState<number | null>(null);

  // Hooks and derived values.
  const colorScheme = useAppColorScheme();
  const corporate = Colors[colorScheme].primary;
  const { width } = useFeedDimensions();
  const router = useRouter();
  const height = useMemo(() => DEFAULT_IMAGE_ASPECT_RATIO * width, [width]);

  // Memoize importantCats mapping (optional, here we rely on the static outside mapping).
  const importantCats = useMemo(() => Config.importantCats, []);

  // Format date.
  const d = new Date(article.date);
  const date = `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`;

  // Retrieve and set scroll progress when inView.
  useEffect(() => {
    if (!inView) return;
    PersonalStore.getScrollPosition(article.slug).then((progress) => {
      if (progress !== null) {
        const dimValue = progress * 100 + "%";
        setScrollProgress(dimValue as DimensionValue);
      }
    });
  }, [inView, article.slug]);

  // Fetch the feature image when the article is in view.
  const getImages = useCallback(async () => {
    try {
      const { image, credit } = await WordPressAPI.getFeatureImage(
        article._links["wp:featuredmedia"][0].href,
      );
      setImgURL(image);
      setImageCredit(credit);
      ContentStore.setStoredArticle(article.slug, {
        imageUrl: image,
        imageCredit: credit,
        ...article,
      });
    } catch (error) {
      console.error(error);
    }
  }, [article]);

  useEffect(() => {
    if (inView) {
      getImages();
    }
  }, [inView, getImages]);

  // Reset per-article state when this row is recycled for a different article,
  // so a previously-hidden (0-view) badge re-mounts and refetches, and the old
  // article's image credit can't linger on the new one until its fetch lands.
  useEffect(() => {
    setViewCount(null);
    setImageCredit(undefined);
  }, [article.link]);

  // Memoize computed texts.
  const authorDateText = useMemo(() => {
    const authors =
      article?.authors?.map((author) => author.display_name).join(", ") || "";
    const readingTime = article.reading_time
      ? ` | ${article.reading_time} Min.`
      : "";
    return authors
      ? `${authors} | ${date}${readingTime}`
      : `${date}${readingTime}`;
  }, [article.authors, article.reading_time, date]);

  const excerpt = useMemo(
    () => article.description || "",
    [article.description],
  );

  const categoryText = useMemo(() => {
    return (
      article.categories
        .map((cat) => importantCats[cat] || "")
        .find((text) => text !== "") || ""
    );
  }, [article.categories, importantCats]);

  // Handlers wrapped in useCallback.
  const handlePress = useCallback(() => {
    onLinkPress(article.link, router);
  }, [article.link, router]);

  const handleLongPress = useCallback(() => {
    onShare(article.link, { location: "longPressPost" });
  }, [article.link]);

  // Memoized style objects.
  const containerStyle = useMemo(
    () => ({
      paddingBottom: excerpt ? spacing.xl : spacing.md,
      backgroundColor: Colors[colorScheme].background,
      ...(elevated && {
        borderRadius: radii.lg,
        overflow: "hidden" as const,
        borderWidth: 1,
        borderColor: Colors[colorScheme].surface,
      }),
    }),
    [colorScheme, elevated, excerpt],
  );

  const elevatedWrapperStyle = useMemo(() => {
    if (!elevated) return;
    const isDark = colorScheme === "dark";
    const shadowRgb = isDark ? "255, 255, 255" : "0, 0, 0";
    const shadowOpacity = isDark ? 0.12 : elevation.xs.opacity;
    return {
      borderRadius: radii.lg,
      boxShadow: `0px ${elevation.xs.offsetY}px ${elevation.xs.blur}px rgba(${shadowRgb}, ${shadowOpacity})`,
      elevation: elevation.xs.android,
    };
  }, [elevated, colorScheme]);
  const imageStyle = useMemo(
    () => ({
      left: 0,
      top: 0,
      width: "100%" as const,
      height,
    }),
    [height],
  );
  const progressBarStyle = useMemo(
    () => ({
      zIndex: layers.raised,
      height: 3,
      width: scrollProgress,
      backgroundColor: corporate,
    }),
    [scrollProgress, corporate],
  );
  const categoryTextStyle: TextStyle[] = [
    globalStyles.pillLabel,
    globalStyles.whiteText,
    { textAlign: "right" },
  ];

  const content = (
    <UiPressable
      accessibilityRole="button"
      style={{ padding: 0, flex: 1 }}
      onPress={handlePress}
      onLongPress={handleLongPress}
    >
      <View style={containerStyle}>
        {/* Relative wrapper so the credit badge anchors to the thumbnail
            rather than the bottom of the whole card. */}
        <View style={{ position: "relative" }}>
          <Image
            style={imageStyle}
            source={{ uri: imageUrl }}
            placeholder={AppImages.loadingAnimation}
            contentFit="cover"
          />
          {!imageUrl && !AppImages.loadingAnimation && (
            <UiSpinner
              containerStyle={{
                position: "absolute",
                height,
                top: 0,
                left: 0,
              }}
            />
          )}
          <ImageCreditBadge credit={imageCredit} position="bottomRight" />
        </View>
        <View style={progressBarStyle} />
        <UiSpace size={spacing.md} />
        <View
          style={{
            gap: CARD_CONTENT_GAP,
            paddingHorizontal: POST_PADDING_HORIZONTAL,
          }}
        >
          <Typography type="cardTitle">{article.title}</Typography>
          <Typography type="meta">{authorDateText}</Typography>
        </View>
        <UiSpace size={spacing.md} />
        {(article.sourceName || categoryText) && (
          <UiBadge
            position="topLeft"
            variant={
              article.sourceName === "Prüfpunkt" ? "pruefpunkt" : "primary"
            }
          >
            <UiText style={categoryTextStyle}>
              {article.sourceName || categoryText}
            </UiText>
          </UiBadge>
        )}
        {inView && Config.enableEngagement && viewCount !== 0 && (
          <UiBadge position="topRight" variant="accent">
            <ViewCounter
              url={article.link}
              size={iconSizes.xs}
              onLoad={setViewCount}
              style={globalStyles.pillLabel}
            />
          </UiBadge>
        )}
        {excerpt && (
          <UiText
            size="base"
            style={{
              paddingHorizontal: POST_PADDING_HORIZONTAL,
            }}
          >
            {excerpt}
          </UiText>
        )}
      </View>
    </UiPressable>
  );

  if (elevated) {
    return <View style={elevatedWrapperStyle}>{content}</View>;
  }

  return content;
};

export default React.memo(ArticlePost);

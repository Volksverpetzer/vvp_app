import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { DimensionValue, TextStyle } from "react-native";
import { View } from "react-native";

import ViewCounter from "#/components/counter/ViewCounter";
import UiPressable from "#/components/ui/UiPressable";
import UiSpace from "#/components/ui/UiSpace";
import UiSpinner from "#/components/ui/UiSpinner";
import UiText from "#/components/ui/UiText";
import Colors from "#/constants/Colors";
import Config from "#/constants/Config";
import {
  POST_PADDING_HORIZONTAL,
  globalStyles,
} from "#/constants/GlobalStyles";
import { AppImages } from "#/helpers/AppImages";
import { onLinkPress } from "#/helpers/Linking";
import { onShare } from "#/helpers/Sharing";
import ContentStore from "#/helpers/Stores/ContentStore";
import PersonalStore from "#/helpers/Stores/PersonalStore";
import WordPressAPI from "#/helpers/network/WordPressAPI";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";
import { useFeedDimensions } from "#/hooks/useFeedDimensions";
import type { ArticleProperties } from "#/types";

import Badge from "./Badge";

const titleStyle: TextStyle = {
  fontFamily: "SourceSansProBold",
  paddingHorizontal: POST_PADDING_HORIZONTAL,
  fontSize: 20,
  lineHeight: 26,
  textAlign: "left",
};

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
  const [scrollProgress, setScrollProgress] = useState<DimensionValue>("0%");
  const [viewCount, setViewCount] = useState<number | null>(null);

  // Hooks and derived values.
  const colorScheme = useAppColorScheme();
  const corporate = Colors[colorScheme].primary;
  const greyText = Colors[colorScheme].textMuted;
  const { width } = useFeedDimensions();
  const router = useRouter();
  const height = useMemo(() => 0.5125 * (width - 26), [width]);

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
      const { image } = await WordPressAPI.getFeatureImage(
        article._links["wp:featuredmedia"][0].href,
      );
      setImgURL(image);
      ContentStore.setStoredArticle(article.slug, {
        imageUrl: image,
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
      paddingBottom: 0,
      backgroundColor: Colors[colorScheme].background,
      ...(elevated && { borderRadius: 15, overflow: "hidden" as const }),
    }),
    [colorScheme, elevated],
  );

  const elevatedWrapperStyle = useMemo(() => {
    if (!elevated) return undefined;
    const isDark = colorScheme === "dark";
    return {
      borderRadius: 15,
      shadowColor: isDark ? "#fff" : "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0.12 : 0.2,
      shadowRadius: 1.41,
      elevation: 2,
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
      zIndex: 30,
      height: 3,
      width: scrollProgress,
      backgroundColor: corporate,
    }),
    [scrollProgress, corporate],
  );
  const authorDateStyle = useMemo(
    () => ({
      paddingHorizontal: POST_PADDING_HORIZONTAL,
      textAlign: "left" as const,
      color: greyText,
      fontSize: 16,
    }),
    [greyText],
  );
  const categoryTextStyle: TextStyle[] = [
    globalStyles.whiteText,
    { textAlign: "right", fontSize: 14 },
  ];

  const content = (
    <UiPressable
      accessibilityRole="button"
      style={{ padding: 0, flex: 1 }}
      onPress={handlePress}
      onLongPress={handleLongPress}
    >
      <View style={containerStyle}>
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
        <View style={progressBarStyle} />
        <UiSpace size={10} />
        <UiText style={titleStyle}>{article.title}</UiText>
        <UiSpace size={10} />
        <UiText style={authorDateStyle}>{authorDateText}</UiText>
        <UiSpace size={10} />
        {(article.sourceName || categoryText) && (
          <Badge position="topLeft" color={corporate}>
            <UiText style={categoryTextStyle}>
              {article.sourceName || categoryText}
            </UiText>
          </Badge>
        )}
        {inView && viewCount !== 0 && (
          <Badge position="topRight" color={Colors[colorScheme].accent}>
            <ViewCounter url={article.link} size={16} onLoad={setViewCount} />
          </Badge>
        )}
        {excerpt ? (
          <>
            <UiText
              style={{
                paddingHorizontal: POST_PADDING_HORIZONTAL,
                fontSize: 16,
              }}
            >
              {excerpt}
            </UiText>
            <UiSpace size={20} />
          </>
        ) : (
          <UiSpace size={10} />
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

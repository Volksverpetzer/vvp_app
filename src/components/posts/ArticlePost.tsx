import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { DimensionValue } from "react-native";
import { TouchableOpacity } from "react-native";

import ViewCounter from "#/components/counter/ViewCounter";
import Space from "#/components/design/Space";
import Text from "#/components/design/Text";
import View from "#/components/design/View";
import UiSpinner from "#/components/ui/UiSpinner";
import Colors from "#/constants/Colors";
import Config from "#/constants/Config";
import { styles } from "#/constants/Styles";
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

// Define the component props type.
type ArticlePostScreenProperties = {
  article: ArticleProperties;
  inView?: boolean;
  backgroundVariant?: "primary" | "secondary";
};

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
  const { article, inView, backgroundVariant = "primary" } = properties;

  // Local state.
  const [imageUrl, setImgURL] = useState("");
  const [scrollProgress, setScrollProgress] = useState<DimensionValue>("0%");

  // Hooks and derived values.
  const colorScheme = useAppColorScheme();
  const corporate = Colors[colorScheme].corporate;
  const greyText = Colors[colorScheme].grayedOutText;
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
    return `${authors} | ${date}`;
  }, [article.authors, date]);

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
      backgroundColor:
        backgroundVariant === "secondary"
          ? Colors[colorScheme].secondaryBackground
          : Colors[colorScheme].background,
    }),
    [backgroundVariant, colorScheme],
  );
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
  const titleStyle = useMemo(
    () => ({
      fontFamily: "SourceSansProBold",
      paddingHorizontal: 30,
      fontSize: 20,
      fontWeight: "bold" as const,
      textAlign: "left" as const,
    }),
    [],
  );
  const authorDateStyle = useMemo(
    () => ({
      paddingHorizontal: 30,
      textAlign: "left" as const,
      color: greyText,
      fontSize: 16,
    }),
    [greyText],
  );
  const categoryTextStyle = useMemo(
    () => ({ ...styles.whiteText, textAlign: "right" as const, fontSize: 14 }),
    [],
  );

  return (
    <TouchableOpacity
      accessibilityRole="button"
      style={{ padding: 0, flex: 1 }}
      activeOpacity={0.8}
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
        <Space size={10} />
        <Text style={titleStyle}>{article.title}</Text>
        <Space size={10} />
        <Text style={authorDateStyle}>{authorDateText}</Text>
        <Space size={10} />
        {categoryText && (
          <Badge position="topLeft" color={corporate}>
            <Text style={categoryTextStyle}>{categoryText}</Text>
          </Badge>
        )}
        {inView && (
          <Badge position="topRight" color={Colors[colorScheme].highlight}>
            <ViewCounter url={article.link} size={16} />
          </Badge>
        )}
        <Text style={{ paddingHorizontal: 30, fontSize: 16 }}>{excerpt}</Text>
        <Space size={20} />
      </View>
    </TouchableOpacity>
  );
};

export default React.memo(ArticlePost);

import { Image } from "expo-image";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { DimensionValue, TextStyle } from "react-native";
import { View } from "react-native";

import ViewCounter from "#/components/counter/ViewCounter";
import ReadingProgressBar from "#/components/progress/ReadingProgressBar";
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
  // Matches --vvp-accent, the progress-bar color used on the crowdfunding site.
  const progressColor = Colors[colorScheme].accent;
  const { width } = useFeedDimensions();
  const router = useRouter();
  const height = useMemo(() => DEFAULT_IMAGE_ASPECT_RATIO * width, [width]);

  // Memoize importantCats mapping (optional, here we rely on the static outside mapping).
  const importantCats = useMemo(() => Config.importantCats, []);

  // Format date.
  const d = new Date(article.date);
  const date = `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`;

  // Reset when this row is recycled for a different article, so it never
  // shows the previous article's progress. Deliberately not done on refocus:
  // that would flash the bar to 0 before the stored value comes back.
  useEffect(() => {
    setScrollProgress("0%");
  }, [article.slug]);

  // Retrieve and set scroll progress when inView. Runs on every screen focus
  // (not just once) so the bar catches up after reading an article and
  // navigating back to the feed.
  useFocusEffect(
    useCallback(() => {
      if (!inView) return;
      let cancelled = false;
      PersonalStore.getScrollPosition(article.slug).then((progress) => {
        if (cancelled || progress === null) return;
        setScrollProgress((progress * 100 + "%") as DimensionValue);
      });
      return () => {
        cancelled = true;
      };
    }, [inView, article.slug]),
  );

  // Fetch the feature image when the article is in view.
  const getImages = useCallback(async () => {
    // Clear immediately rather than leave stale: this row may be recycled
    // from a previous article, so without this its thumbnail would keep
    // showing until (or if) the new fetch resolves.
    setImgURL("");
    setImageCredit(undefined);

    // The featured-media link can be absent even when featured_media is set
    // — e.g. WordPress omits it when the attachment isn't readable via the
    // REST API. Just skip the image fetch rather than throwing.
    const featuredMediaHref = article._links["wp:featuredmedia"]?.[0]?.href;
    if (!featuredMediaHref) return;
    try {
      const { image, credit } =
        await WordPressAPI.getFeatureImage(featuredMediaHref);
      setImgURL(image ?? "");
      setImageCredit(credit);
      ContentStore.setStoredArticle(article.slug, {
        ...article,
        imageUrl: image,
        imageCredit: credit,
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
        <ReadingProgressBar
          testID="article-progress-bar"
          progress={scrollProgress}
          height={4}
          color={progressColor}
        />
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

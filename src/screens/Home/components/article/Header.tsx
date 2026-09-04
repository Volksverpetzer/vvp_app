import * as Clipboard from "expo-clipboard";
import { Image } from "expo-image";
import type { Href } from "expo-router";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AppState,
  Modal,
  Platform,
  View,
  useWindowDimensions,
} from "react-native";
import ViewShot, { type ViewShotRef } from "react-native-view-shot";

import AudioPlayer from "#/components/audio/AudioPlayer";
import ImageCreditBadge from "#/components/posts/ImageCreditBadge";
import Typography from "#/components/ui/Typography";
import UiPressable from "#/components/ui/UiPressable";
import UiSpace from "#/components/ui/UiSpace";
import UiText from "#/components/ui/UiText";
import Colors from "#/constants/Colors";
import Config from "#/constants/Config";
import {
  CONTENT_HORIZONTAL_PADDING,
  DEFAULT_IMAGE_ASPECT_RATIO,
} from "#/constants/GlobalStyles";
import { spacing } from "#/constants/Spacing";
import { outBoundLinkPress } from "#/helpers/Linking";
import { onShare } from "#/helpers/Sharing";
import { useCorporateColor } from "#/hooks/useAppColorScheme";
import { useAudioAvailability } from "#/hooks/useAudioAvailability";
import type { ArticleProperties, HttpsUrl } from "#/types";

import LoadingImage from "#assets/images/logo_animated.gif";
import logoPike from "#assets/images/logo_pike.webp";

import { ArticleSourceList } from "./ArticleSourceList";
import ArticleStats from "./ArticleStats";

interface HeaderProperties {
  article: ArticleProperties;
  article_image: string;
  article_title: string;
  article_link: HttpsUrl;
  date: string;
  slug: string;
}

/**
 *
 * @param properties
 * @returns
 */
const Header = (properties: HeaderProperties) => {
  const { article, article_image, article_link, article_title, date, slug } =
    properties;
  const [visible, setVisible] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageLoaded2, setImageLoaded2] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);
  const { width } = useWindowDimensions();
  // Reference to the ViewShot component for image capture
  const reference = useRef<ViewShotRef>(null);
  const router = useRouter();
  const corporate = useCorporateColor();

  const audioUrl = Config.audioCdnUrl
    ? `${Config.audioCdnUrl.replace(/\/$/, "")}/${encodeURIComponent(slug)}.mp3`
    : undefined;
  const audioAvailability = useAudioAvailability(audioUrl);

  const appState = useRef(AppState.currentState);

  /**
   * Copies the url link to the clipboard based on platform support.
   */
  const copyToClipboard = useCallback(async (url: string) => {
    if (Platform.OS === "android") await Clipboard.setStringAsync(url);
    else await Clipboard.setUrlAsync(url);
  }, []);

  /**
   * Captures the header view and shares it to Instagram Story if available,
   * otherwise falls back to generic sharing.
   */
  const captureAndShare = useCallback(async () => {
    setVisible(true);
    const current = reference.current;
    if (!current) {
      setVisible(false);
      setImageLoaded(false);
      return;
    }
    const uri = await current.capture();
    await copyToClipboard(article_link);
    await onShare(uri, { location: "ArticleTop" });
    setVisible(false);
    setImageLoaded(false);
  }, [article_link, copyToClipboard]);

  useEffect(() => {
    if (imageLoaded && imageLoaded2) {
      captureAndShare();
    }
  }, [imageLoaded, imageLoaded2, captureAndShare]);

  useEffect(() => {
    // copy article url in case of insta share
    const subscription = AppState.addEventListener(
      "change",
      async (nextAppState) => {
        if (/inactive|background/.test(appState.current) && !urlCopied) {
          await copyToClipboard(article_link);
          setUrlCopied(true);
        }
        appState.current = nextAppState;
      },
    );
    return () => {
      subscription.remove();
    };
  }, [article_link, copyToClipboard, urlCopied]);

  return (
    <>
      {/* Pull the hero image edge-to-edge: the article ScrollView pads its
          content by CONTENT_HORIZONTAL_PADDING, which would otherwise leave a
          horizontal gutter around the image. */}
      <View
        style={{
          position: "relative",
          marginHorizontal: -CONTENT_HORIZONTAL_PADDING,
        }}
      >
        <UiPressable
          accessibilityRole="button"
          onLongPress={() => setVisible(true)}
        >
          <Image
            style={{
              margin: "auto",
              width: "100%",
              aspectRatio: 1 / DEFAULT_IMAGE_ASPECT_RATIO,
            }}
            source={{ uri: article_image }}
            placeholder={LoadingImage}
          />
        </UiPressable>
        <ImageCreditBadge credit={article.imageCredit} position="bottomRight" />
      </View>
      <UiSpace size={spacing.lg} />
      <Typography type="title" style={{ paddingHorizontal: spacing.xl }}>
        {article_title}
      </Typography>
      <Typography
        type="meta"
        style={{
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.xl,
        }}
      >
        {article.authors?.length ? (
          <>
            von&nbsp;
            {article.authors.map((author, index, array) => (
              <UiText
                key={author.slug}
                onPress={() =>
                  outBoundLinkPress(
                    `${Config.wpUrl}/author/${author.slug}/`,
                    article_link,
                  )
                }
                style={{ color: corporate }}
              >
                {author.display_name}
                {index < array.length - 1 ? ", " : ""}
              </UiText>
            ))}
            &nbsp;|{" "}
          </>
        ) : null}
        {date} |
        {
          article.categories.map((cat) => {
            return Config.importantCats[cat]
              ? " " + Config.importantCats[cat]
              : "";
          })[0]
        }
      </Typography>
      <ArticleStats
        article_link={article_link}
        reading_time={article.reading_time}
      />
      {audioUrl && audioAvailability === "available" && (
        <AudioPlayer
          audioUrl={audioUrl}
          title={article_title}
          artworkUrl={article_image}
        />
      )}
      {audioUrl && audioAvailability === "unavailable" && (
        // Visually hidden: sighted users see nothing where the player would
        // have been, but screen readers still announce that there's no
        // audio here rather than silently skipping past it.
        <View
          accessible
          accessibilityRole="text"
          accessibilityLabel="Für diesen Artikel ist noch keine Audioversion verfügbar."
          pointerEvents="none"
          style={{
            position: "absolute",
            width: 1,
            height: 1,
            overflow: "hidden",
          }}
        />
      )}
      <ArticleSourceList
        article_link={article_link}
        article_title={article_title}
        slug={slug}
      />
      <UiSpace size={spacing.sm} />
      <Modal visible={visible}>
        <ViewShot ref={reference} options={{ fileName: article_title }}>
          <View
            style={{
              width: width,
              aspectRatio: 16 / 9,
              backgroundColor: Colors.dark.background,
              paddingTop: ((width * 16) / 9) * 0.2,
              gap: spacing.xl,
            }}
          >
            <Image
              style={{
                position: "absolute",
                right: 0,
                top: 0,
                width: 85,
                height: 80,
              }}
              source={logoPike}
              onLoad={() => setImageLoaded2(true)}
            />
            <Image
              style={{
                left: 0,
                width: width,
                aspectRatio: 1 / DEFAULT_IMAGE_ASPECT_RATIO,
              }}
              source={{ uri: article_image }}
              onLoad={() => setImageLoaded(true)}
            />
            <Typography
              type="title"
              style={{ color: Colors.dark.text, paddingHorizontal: spacing.xl }}
            >
              {article_title}
            </Typography>
            {/* The share card is always rendered on the dark background, so it
                pins the light-on-dark colors instead of following the theme. */}
            <Typography
              type="meta"
              style={{
                color: Colors.dark.textMuted,
                paddingHorizontal: spacing.xl,
              }}
            >
              {article.authors?.length ? (
                <>
                  von&nbsp;
                  {article.authors.map((author, index, array) => (
                    <UiText
                      key={author.slug}
                      onPress={() =>
                        router.push(`/author/${author.slug}` as Href)
                      }
                      style={{ color: corporate }}
                    >
                      {author.display_name}
                      {index < array.length - 1 ? ", " : ""}
                    </UiText>
                  ))}
                  &nbsp;|{" "}
                </>
              ) : null}
              {date} |
              {
                article.categories.map((cat) => {
                  return Config.importantCats[cat]
                    ? " " + Config.importantCats[cat]
                    : "";
                })[0]
              }
            </Typography>
          </View>
        </ViewShot>
      </Modal>
    </>
  );
};

export default Header;

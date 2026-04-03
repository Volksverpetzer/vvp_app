import * as Clipboard from "expo-clipboard";
import { Image } from "expo-image";
import type { Href } from "expo-router";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import type { LayoutChangeEvent } from "react-native";
import {
  AppState,
  Modal,
  Platform,
  Pressable,
  useWindowDimensions,
} from "react-native";
import ViewShot from "react-native-view-shot";

import Space from "#/components/design/Space";
import View from "#/components/design/View";
import UiText from "#/components/ui/UiText";
import Colors from "#/constants/Colors";
import Config from "#/constants/Config";
import { outBoundLinkPress } from "#/helpers/Linking";
import { onShare } from "#/helpers/Sharing";
import { useCorporateColor } from "#/hooks/useAppColorScheme";
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
  const [height, setHeight] = useState(Math.round(0.5125 * width));
  // Reference to the ViewShot component for image capture
  const reference = useRef<ViewShot>(null);
  const router = useRouter();
  const corporate = useCorporateColor();

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

  const onLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setHeight(Math.round(0.5125 * width));
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        onLongPress={() => setVisible(true)}
        onLayout={onLayout}
      >
        <Image
          style={{ margin: "auto", height, width: "100%" }}
          source={{ uri: article_image }}
          placeholder={LoadingImage}
        />
      </Pressable>
      <Space size={30} />
      <UiText
        style={{
          paddingHorizontal: 20,
          fontSize: 26,
          fontWeight: "bold",
          textAlign: "left",
          fontFamily: "SourceSansProSemiBold",
        }}
      >
        {article_title}
      </UiText>
      <UiText
        style={{
          fontSize: 18,
          textAlign: "left",
          paddingVertical: 10,
          paddingHorizontal: 20,
        }}
      >
        von&nbsp;
        {article?.authors.map((author, index, array) => (
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
        &nbsp;| {date} |
        {
          article.categories.map((cat) => {
            return Config.importantCats[cat]
              ? " " + Config.importantCats[cat]
              : "";
          })[0]
        }
      </UiText>
      <ArticleStats article_link={article_link} />
      <Space size={10} />
      <ArticleSourceList
        article_link={article_link}
        article_title={article_title}
        slug={slug}
      />
      <Space size={20} />
      <Modal visible={visible}>
        <ViewShot ref={reference} options={{ fileName: article_title }}>
          <View
            style={{
              width: width,
              height: (16 / 9) * width,
              backgroundColor: Colors.dark.background,
              paddingTop: ((width * 16) / 9) * 0.2,
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
                height: Math.round(0.5125 * width),
              }}
              source={{ uri: article_image }}
              onLoad={() => setImageLoaded(true)}
            />
            <Space size={20} />
            <UiText
              style={{
                color: Colors.dark.text,
                paddingHorizontal: 20,
                fontSize: 26,
                fontWeight: "bold",
                textAlign: "left",
                fontFamily: "SourceSansProSemiBold",
              }}
            >
              {article_title}
            </UiText>
            <Space size={20} />
            <UiText
              style={{
                color: Colors.dark.text,
                paddingHorizontal: 20,
                fontSize: 18,
                textAlign: "left",
              }}
            >
              von&nbsp;
              {article?.authors?.map((author, index, array) => (
                <UiText
                  key={author.slug}
                  onPress={() => router.push(`/author/${author.slug}` as Href)}
                  style={{ color: corporate }}
                >
                  {author.display_name}
                  {index < array.length - 1 ? ", " : ""}
                </UiText>
              ))}
              &nbsp;| {date} |
              {
                article.categories.map((cat) => {
                  return Config.importantCats[cat]
                    ? " " + Config.importantCats[cat]
                    : "";
                })[0]
              }
            </UiText>
          </View>
        </ViewShot>
      </Modal>
    </>
  );
};

export default Header;

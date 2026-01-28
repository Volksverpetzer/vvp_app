import { MaterialIcons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { Image } from "expo-image";
import { Href, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  AppState,
  LayoutChangeEvent,
  Modal,
  Platform,
  Pressable,
  useWindowDimensions,
} from "react-native";
import ViewShot from "react-native-view-shot";

import Space from "#/components/design/Space";
import Text from "#/components/design/Text";
import View from "#/components/design/View";
import { ArticleProperties } from "#/components/posts/ArticlePost";
import Colors from "#/constants/Colors";
import Config from "#/constants/Config";
import { outBoundLinkPress } from "#/helpers/Linking";
import { onShare } from "#/helpers/Sharing";
import { useCorporateColor } from "#/hooks/useAppColorScheme";

import logoPike from "#assets/images/logo_pike.png";

import { ArticleSourceList } from "./ArticleSourceList";
import ArticleStats from "./ArticleStats";

interface HeaderProperties {
  article: ArticleProperties;
  article_image: string;
  article_title: string;
  article_link: string;
  date: string;
}

/**
 *
 * @param properties
 * @returns
 */
const Header = (properties: HeaderProperties) => {
  const [visible, setVisible] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageLoaded2, setImageLoaded2] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);
  const { width } = useWindowDimensions();
  const [height, setHeight] = useState(Math.round(0.5125 * width));
  const { article_link } = properties;
  // Reference to the ViewShot component for image capture
  const reference = useRef<ViewShot>(null);
  const router = useRouter();
  const corporate = useCorporateColor();

  useEffect(() => {
    if (imageLoaded && imageLoaded2) {
      captureAndShare();
    }
  }, [imageLoaded, imageLoaded2]);

  const appState = useRef(AppState.currentState);

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
  }, [urlCopied]);

  /**
   * Copies the url link to the clipboard based on platform support.
   */
  async function copyToClipboard(url) {
    if (Platform.OS === "android") await Clipboard.setStringAsync(url);
    else await Clipboard.setUrlAsync(url);
  }

  /**
   * Captures the header view and shares it to Instagram Story if available,
   * otherwise falls back to generic sharing.
   */
  const captureAndShare = async () => {
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
  };

  const onLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setHeight(Math.round(0.5125 * width));
  };

  const { article, article_image, article_title, date } = properties;
  return (
    <>
      <MaterialIcons
        name="touch-app"
        size={25}
        color={corporate}
        style={{
          zIndex: 20,
          position: "absolute",
          alignSelf: "flex-end",
          marginTop: Math.round(0.5125 * width) - 28,
          marginRight: 10,
        }}
      />
      <Pressable
        accessibilityRole="button"
        onLongPress={() => setVisible(true)}
        onLayout={onLayout}
      >
        <Image
          style={{ margin: "auto", height, width: "100%" }}
          source={{ uri: article_image }}
        />
      </Pressable>
      <Space size={30} />
      <Text
        style={{
          paddingHorizontal: 20,
          fontSize: 26,
          fontWeight: "bold",
          textAlign: "left",
          fontFamily: "SourceSansProSemiBold",
        }}
      >
        {article_title}
      </Text>
      <Text
        style={{
          fontSize: 18,
          textAlign: "left",
          paddingVertical: 10,
          paddingHorizontal: 20,
        }}
      >
        von&nbsp;
        {article?.authors.map((author, index, array) => (
          <Text
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
          </Text>
        ))}
        &nbsp;| {date} |
        {
          article.categories.map((cat) => {
            return Config.importantCats[cat]
              ? " " + Config.importantCats[cat]
              : "";
          })[0]
        }
      </Text>
      <ArticleStats article_link={article_link} />
      <Space size={10} />
      <ArticleSourceList article_link={article_link} />
      <Space size={20} />
      <Modal visible={visible}>
        <ViewShot ref={reference} options={{ fileName: article_title }}>
          <View
            style={{
              width: width,
              height: (16 / 9) * width,
              backgroundColor: Colors["dark"].background,
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
            <Text
              style={{
                color: Colors["dark"].text,
                paddingHorizontal: 20,
                fontSize: 26,
                fontWeight: "bold",
                textAlign: "left",
                fontFamily: "SourceSansProSemiBold",
              }}
            >
              {article_title}
            </Text>
            <Space size={20} />
            <Text
              style={{
                color: Colors["dark"].text,
                paddingHorizontal: 20,
                fontSize: 18,
                textAlign: "left",
              }}
            >
              von&nbsp;
              {article?.authors?.map((author, index, array) => (
                <Text
                  key={author.slug}
                  onPress={() => router.push(`/author/${author.slug}` as Href)}
                  style={{ color: corporate }}
                >
                  {author.display_name}
                  {index < array.length - 1 ? ", " : ""}
                </Text>
              ))}
              &nbsp;| {date} |
              {
                article.categories.map((cat) => {
                  return Config.importantCats[cat]
                    ? " " + Config.importantCats[cat]
                    : "";
                })[0]
              }
            </Text>
          </View>
        </ViewShot>
      </Modal>
    </>
  );
};

export default Header;

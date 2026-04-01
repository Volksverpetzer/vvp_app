import { Zoomable } from "@likashefqet/react-native-image-zoom";
import type { ImageLoadEventData } from "expo-image";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useRef, useState } from "react";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import {
  Animated,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";
import { Hyperlink } from "react-native-hyperlink";

import View from "#/components/design/View";
import UiText from "#/components/ui/UiText";
import Config from "#/constants/Config";
import { styles } from "#/constants/Styles";
import { Achievements } from "#/helpers/Achievements";
import { onLinkPress } from "#/helpers/Linking";
import { onShare } from "#/helpers/Sharing";
import ContentStore from "#/helpers/Stores/ContentStore";
import { registerViews } from "#/helpers/network/Engagement";
import { useCorporateColor } from "#/hooks/useAppColorScheme";
import { useFeedDimensions } from "#/hooks/useFeedDimensions";
import {
  DISPLAY_TEXT_EXCERPT,
  DISPLAY_TEXT_FULL,
  type HttpsUrl,
  type InstaPostProperties,
} from "#/types";

type InstaPostScreenProperties = InstaPostProperties & {
  inView?: boolean;
};

/**
 * Renders a short Insta Post with a horizontal scroll of images and a link to the InstaScreen.
 * Optimizations:
 * - Handlers are memoized with useCallback.
 * - Inline styles are memoized with useMemo.
 * - Dot indicator mapping is memoized.
 */
const InstaPost = (properties: InstaPostScreenProperties) => {
  const [ratio, setRatio] = useState(1.33333);
  const [page, setPage] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [registered, setRegistered] = useState(false);
  const router = useRouter();
  const scrollX = useRef(new Animated.Value(0)).current;

  const wpUrl = Config.wpUrl;
  const {
    id,
    permalink,
    media_url,
    caption,
    children,
    disableLink,
    inView,
    displayText = DISPLAY_TEXT_EXCERPT,
  } = properties;
  const corporate = useCorporateColor();
  const windowDims = useWindowDimensions();
  const feedDims = useFeedDimensions();
  const { width } = displayText === DISPLAY_TEXT_FULL ? windowDims : feedDims;

  // Determine photos array. If children exists, map its data for media_url; fallback to media_url.
  const photos = useMemo(
    () => children?.data?.map((p) => p.media_url) ?? [media_url],
    [children, media_url],
  );
  const excerpt = useMemo(() => caption?.slice(0, 70) ?? "", [caption]);

  // Compute the "transformed" permalink once data is available.
  // This value is reused by the analytics call and hyperlink handler.
  const computedPermalink = useMemo(() => {
    return permalink
      ? permalink.replace("https://www.instagram.com/p/", `${wpUrl}/insta/`)
      : "";
  }, [permalink, wpUrl]);

  // Memoize the onPress callback to avoid re-creation on each render.
  const handleLinkPress = useCallback(
    (url: HttpsUrl, _text: string) => {
      onLinkPress(url, router, computedPermalink);
    },
    [router, computedPermalink],
  );

  const handleSelectPost = useCallback(() => {
    if (disableLink) return;
    router.push(`/insta/${id}`);
  }, [disableLink, id, router]);

  const onLongPressHandler = useCallback((source) => {
    onShare(source, { location: "longPressImage" });
    Achievements.setAchievementValue("instashare", true);
  }, []);

  const onLoadHandler = useCallback(
    async (event: ImageLoadEventData) => {
      if (loaded) return;
      // We update stored post asynchronously.
      await ContentStore.setStoredInstaPost(id, properties);
      const { width: w, height: h } = event.source;
      setRatio(Math.round((h / w) * 100) / 100);
      setLoaded(true);
    },
    [loaded, id, properties],
  );

  const onScrollListener = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const contentOffsetX = event.nativeEvent.contentOffset.x;
      const _page = Math.round(contentOffsetX / Math.max(width, 1));
      if (page !== _page) {
        if (!registered) {
          registerViews(
            permalink.replace(
              "https://www.instagram.com/p/",
              `${wpUrl}/insta/`,
            ),
          );
          setRegistered(true);
        }
        setPage(_page);
      }
    },
    [page, registered, permalink, wpUrl, width],
  );

  // Memoize image style to avoid re-creating the object.
  const imageStyle = useMemo(
    () => ({
      width,
      height: width * ratio,
    }),
    [width, ratio],
  );

  // Animated event for scrolling.
  const onScrollEvent = useMemo(
    () =>
      Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
        listener: onScrollListener,
        useNativeDriver: false, // Cannot use native driver if a listener is provided.
      }),
    [onScrollListener, scrollX],
  );

  // Memoize pagination dots so they are recalculated only when photos, width, or corporate color change.
  const dots = useMemo(
    () =>
      photos.map((_, index) => {
        const inputRange = [
          (index - 1) * width,
          index * width,
          (index + 1) * width,
        ];
        const opacity = scrollX.interpolate({
          inputRange,
          outputRange: [0.3, 1, 0.3],
          extrapolate: "clamp",
        });
        const dotStyle = {
          opacity,
          height: 5,
          width: 5,
          backgroundColor: corporate,
          marginHorizontal: 3,
          marginVertical: 10,
          borderRadius: 5,
        };
        return <Animated.View key={index} style={dotStyle} />;
      }),
    [photos, scrollX, width, corporate],
  );

  return (
    <View>
      <View style={{ backgroundColor: corporate }}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          bounces={false}
          onScroll={onScrollEvent}
          scrollEventThrottle={16}
        >
          {photos.map((source, index) => (
            <TouchableOpacity
              accessibilityRole="button"
              key={index * 163 + id}
              activeOpacity={0.95}
              onPress={handleSelectPost}
              onLongPress={() => onLongPressHandler(source)}
            >
              <Zoomable doubleTapScale={2} maxScale={3} minScale={1}>
                <Image
                  onLoad={onLoadHandler}
                  contentFit="cover"
                  source={
                    page >= index - 1 && inView
                      ? {
                          uri: source,
                          headers: { "Cache-Control": "max-age=604000" },
                        }
                      : undefined
                  }
                  style={imageStyle}
                />
              </Zoomable>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={{ flexDirection: "row", ...styles.centered }}>{dots}</View>

      {displayText === DISPLAY_TEXT_FULL && (
        <Hyperlink linkStyle={{ color: corporate }} onPress={handleLinkPress}>
          <UiText
            style={{
              paddingHorizontal: 10,
              paddingBottom: 50,
              fontSize: 18,
              lineHeight: 25,
            }}
          >
            {caption}
          </UiText>
        </Hyperlink>
      )}
      {displayText === DISPLAY_TEXT_EXCERPT && (
        <TouchableOpacity
          accessibilityRole="button"
          onPress={handleSelectPost}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={1}
          style={{ paddingHorizontal: 30 }}
        >
          <UiText style={{ fontSize: 16, textAlign: "left" }}>
            {excerpt}
            {"... "}
            <UiText style={{ color: corporate, fontSize: 16 }}>mehr</UiText>
          </UiText>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default React.memo(InstaPost);

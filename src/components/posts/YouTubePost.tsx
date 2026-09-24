import { Image } from "expo-image";
import { useState } from "react";
import { View, useWindowDimensions } from "react-native";
import { WebView } from "react-native-webview";

import { ArticleViewIcon, PlayIcon } from "#/components/Icons";
import Typography from "#/components/ui/Typography";
import UiBadge from "#/components/ui/UiBadge";
import UiPressable from "#/components/ui/UiPressable";
import UiSpace from "#/components/ui/UiSpace";
import UiText from "#/components/ui/UiText";
import Config from "#/constants/Config";
import {
  CARD_CONTENT_GAP,
  POST_PADDING_HORIZONTAL,
  globalStyles,
} from "#/constants/GlobalStyles";
import { iconSizes } from "#/constants/IconSizes";
import { spacing } from "#/constants/Spacing";
import { registerPostInteraction } from "#/helpers/network/Analytics";
import { useCorporateColor } from "#/hooks/useAppColorScheme";
import type { YouTubePostProperties } from "#/types";

const YOUTUBE_BRAND_COLOR = "#FF0000";

/**
 * Renders a YouTube Post
 */
const YouTubePost = (properties: YouTubePostProperties) => {
  const { id, snippet, inView, player, statistics } = properties;
  const dims = {
    width: Number.parseInt(player.embedWidth),
    height: Number.parseInt(player.embedHeight),
  };
  const [loaded, setLoaded] = useState(false);
  const ratio = 16 / 9;
  const { width } = useWindowDimensions();
  const corporate = useCorporateColor();
  const height = (width - 24) / ratio;
  const uri = `https://www.youtube.com/embed/${id}?autoplay=1&width=${dims.width}`;
  const preview = inView
    ? snippet.thumbnails.high.url
    : snippet.thumbnails.default.url;
  const published = new Date(snippet.publishedAt);
  const date = `${published.getDate()}.${published.getMonth() + 1}.${published.getFullYear()}`;

  const viewCount = Number.parseInt(statistics?.viewCount ?? "", 10);
  const formattedViews = viewCount
    .toString()
    .replaceAll(/\B(?=(\d{3})+(?!\d))/g, ".");

  const info = (
    <View style={{ paddingHorizontal: POST_PADDING_HORIZONTAL }}>
      <UiSpace size={CARD_CONTENT_GAP} />
      <View style={{ gap: CARD_CONTENT_GAP }}>
        <Typography type="cardTitle">{snippet.title}</Typography>
        <Typography type="meta">{date}</Typography>
      </View>
    </View>
  );

  if (!loaded)
    return (
      <View>
        <View style={{ flex: 1, overflow: "hidden", width: "100%", height }}>
          <UiPressable
            accessibilityRole="button"
            accessibilityLabel={`YouTube Video abspielen: ${snippet.title}`}
            accessibilityHint="Startet die Wiedergabe des Videos"
            onPress={() => {
              registerPostInteraction(
                `https://youtu.be/${id}`,
                "youtube",
                "play",
              );
              setLoaded(true);
            }}
            style={{ width: "100%", height, backgroundColor: corporate }}
          >
            <Image
              style={{
                flex: 1,
                width: "100%",
                backgroundColor: corporate,
              }}
              source={{ uri: preview }}
            />
            <View
              style={[globalStyles.centeredAbsolute, { pointerEvents: "none" }]}
            >
              <PlayIcon size={56} color={YOUTUBE_BRAND_COLOR} />
            </View>
            <UiBadge position="topLeft" variant="primary">
              <UiText style={[globalStyles.pillLabel, globalStyles.whiteText]}>
                Video
              </UiText>
            </UiBadge>
            {inView && Config.enableEngagement && viewCount > 0 && (
              <UiBadge position="topRight" variant="accent">
                {/* eslint-disable-next-line @volksverpetzer/react-native-a11y/has-accessibility-hint -- non-interactive status view: the label already fully describes the content ("X views"), and there's no action for a hint to explain. */}
                <View
                  accessible
                  accessibilityLabel={`${formattedViews} Aufrufe`}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: spacing.xs,
                  }}
                >
                  <ArticleViewIcon size={iconSizes.xs} color="#fff" />
                  <UiText style={[{ color: "#fff" }, globalStyles.pillLabel]}>
                    {formattedViews}
                  </UiText>
                </View>
              </UiBadge>
            )}
          </UiPressable>
        </View>
        {info}
      </View>
    );

  return (
    <View>
      <View
        renderToHardwareTextureAndroid={true}
        style={{ flex: 1, overflow: "hidden", width: "100%", height }}
      >
        <WebView
          source={{
            uri,
            headers: { Referer: Config.wpUrl },
          }}
          style={{ width: "100%", height }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={loaded}
          allowsFullscreenVideo={true}
          scalesPageToFit={false}
          scrollEnabled={false}
        />
      </View>
      {info}
    </View>
  );
};

export default YouTubePost;

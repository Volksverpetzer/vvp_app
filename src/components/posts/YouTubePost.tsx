import { Image } from "expo-image";
import { useState } from "react";
import { View, useWindowDimensions } from "react-native";
import { WebView } from "react-native-webview";

import { PlayIcon } from "#/components/Icons";
import Typography from "#/components/ui/Typography";
import UiPressable from "#/components/ui/UiPressable";
import UiSpace from "#/components/ui/UiSpace";
import Config from "#/constants/Config";
import {
  CARD_CONTENT_GAP,
  POST_PADDING_HORIZONTAL,
  globalStyles,
} from "#/constants/GlobalStyles";
import { registerPostInteraction } from "#/helpers/network/Analytics";
import { useCorporateColor } from "#/hooks/useAppColorScheme";
import type { YouTubePostProperties } from "#/types";

const YOUTUBE_BRAND_COLOR = "#FF0000";

/**
 * Renders a YouTube Post
 */
const YouTubePost = (properties: YouTubePostProperties) => {
  const { id, snippet, inView, player } = properties;
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
                width: width - 24,
                backgroundColor: corporate,
              }}
              source={{ uri: preview }}
            />
            <View
              style={[globalStyles.centeredAbsolute, { pointerEvents: "none" }]}
            >
              <PlayIcon size={56} color={YOUTUBE_BRAND_COLOR} />
            </View>
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

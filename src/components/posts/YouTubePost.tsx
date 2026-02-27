import { Image } from "expo-image";
import { useState } from "react";
import { TouchableOpacity, useWindowDimensions } from "react-native";
import WebView from "react-native-webview";

import { PlayIcon } from "#/components/Icons";
import View from "#/components/design/View";
import Config from "#/constants/Config";
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

  if (!loaded)
    return (
      <View style={{ flex: 1, overflow: "hidden", width: "100%", height }}>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => setLoaded(true)}
          style={{ width: "100%", height, backgroundColor: corporate }}
        >
          <Image
            style={{ flex: 1, width: width - 24, backgroundColor: corporate }}
            source={{ uri: preview }}
          />
          <PlayIcon
            style={{ position: "absolute", top: "45%", left: "45%" }}
            size={50}
            color={YOUTUBE_BRAND_COLOR}
          />
        </TouchableOpacity>
      </View>
    );

  return (
    <>
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
    </>
  );
};

export default YouTubePost;

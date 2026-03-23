import { Image } from "expo-image";
import { useState } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import WebView from "react-native-webview";

import { PlayIcon } from "#/components/Icons";
import UiSpinner from "#/components/ui/UiSpinner";
import type { TiktokPostProperties } from "#/types";

const TIKTOK_BRAND_COLOR = "#FF0050";
const BLACK = "#000";

/**
 * A component that displays a TikTok video with a playable thumbnail
 * @param {TiktokPostProperties} properties - The component properties
 * @returns
 */
const TiktokPost = (properties: TiktokPostProperties) => {
  const {
    title,
    cover_image_url,
    embed_link,
    width: videoWidth,
    height: videoHeight,
  } = properties;

  const { width: windowWidth } = useWindowDimensions();
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const ratio = videoWidth / videoHeight;
  const height = windowWidth / (ratio * 1.5);

  // Accessibility labels
  const playButtonLabel = title ? `Play video: ${title}` : "Play TikTok video";
  const playButtonHint = "Tap to load and play the TikTok video";

  if (!isVideoLoaded) {
    return (
      <View style={[styles.container, { height }]}>
        <TouchableOpacity
          onPress={() => setIsVideoLoaded(true)}
          style={styles.thumbnailContainer}
          accessibilityRole="button"
          accessibilityLabel={playButtonLabel}
          accessibilityHint={playButtonHint}
          accessibilityElementsHidden={false}
        >
          <Image
            style={styles.thumbnailImage}
            source={{ uri: cover_image_url }}
            contentFit="cover"
            accessibilityIgnoresInvertColors
            accessibilityLabel="Video thumbnail"
            accessibilityHint="Thumbnail for the TikTok video"
            importantForAccessibility="yes"
          />
          <PlayIcon
            style={styles.playButton}
            size={56}
            color={TIKTOK_BRAND_COLOR}
            accessibilityElementsHidden
          />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.videoContainer, { height }]}>
      <WebView
        source={{ uri: embed_link }}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        renderLoading={() => <UiSpinner size={"large"} />}
        mediaPlaybackRequiresUserAction={false}
        allowsFullscreenVideo
        scrollEnabled={false}
        overScrollMode="never"
        bounces={false}
        allowsInlineMediaPlayback
        userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1"
        allowsBackForwardNavigationGestures={false}
        accessibilityLabel={title || "TikTok video player"}
        accessibilityHint="TikTok video player. Video is now loading."
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    overflow: "hidden",
    backgroundColor: BLACK,
  },
  thumbnailContainer: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BLACK,
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
    opacity: 0.9,
  },
  playButton: {
    position: "absolute",
    opacity: 0.9,
  },
  videoContainer: {
    width: "100%",
    backgroundColor: BLACK,
  },
  webview: {
    width: "100%",
    height: "100%",
  },
});

export default TiktokPost;

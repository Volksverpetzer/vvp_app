import { useHtmlIframeProps } from "@native-html/iframe-plugin";
import * as Linking from "expo-linking";
import { useCallback, useState } from "react";
import { ScrollView, View } from "react-native";
import { CustomRendererProps, TBlock } from "react-native-render-html";
import WebView from "react-native-webview";
import {
  WebViewErrorEvent,
  WebViewMessageEvent,
} from "react-native-webview/lib/WebViewTypes";

import AnimatedLoading from "#/components/animations/AnimatedLoading";
import Text from "#/components/design/Text";
import LoadArticlePost from "#/components/posts/LoadArticlePost";
import Config from "#/constants/Config";
import { styles } from "#/constants/Styles";

export interface IframeRendererProperties {
  renderProps: CustomRendererProps<TBlock>;
  width: number;
  maxWidth: number;
  onLinkPress: (event: unknown, href: string) => void;
}

// Injected JS constants for WebView
const INJECT_BEFORE = `
  document.querySelectorAll("video").forEach(video => video.removeAttribute("autoplay"));
`;
const INJECT_AFTER = `
  window.ReactNativeWebView.postMessage(document.body.scrollHeight);
  const meta = document.createElement('meta');
  meta.name = 'viewport';
  meta.content = 'width=device-width, initial-scale=1, maximum-scale=1';
  document.head.appendChild(meta);
`;

/**
 * Extract slug from wp-embedded-content src
 */
const extractSlug = (source: string): string => {
  try {
    const { path } = Linking.parse(source);
    const slug = path?.split("/")[1];
    return slug || "";
  } catch (error) {
    console.error("Error extracting slug:", error, "from src:", source);
    return "";
  }
};

type WebViewRequest = {
  url?: string;
  isTopFrame?: boolean;
  navigationType?: string;
};

/**
 * Prepare the source configuration for a WebView, with special handling for YouTube embeds.
 *
 * For YouTube URLs, this function disables autoplay in the query parameters and
 * adds a Referer header based on the WordPress site URL. Non-YouTube URLs are
 * returned unchanged without additional headers.
 *
 * @param url - The iframe source URL to be loaded in the WebView.
 * @returns An object containing the (possibly modified) `uri` and optional
 * `headers` to be passed to the WebView `source` prop.
 */
const prepareWebViewSource = (
  url: string,
): { uri: string; headers?: { Referer: string } } => {
  const { hostname } = Linking.parse(url);
  const isYouTube =
    !!hostname &&
    (hostname.includes("youtube.com") ||
      hostname.includes("youtube-nocookie.com") ||
      hostname.includes("youtu.be"));
  if (!isYouTube) return { uri: url };

  let uri: string;
  try {
    const parsed = new URL(url);
    parsed.searchParams.set("autoplay", "0");
    uri = parsed.toString();
  } catch {
    uri = url.replace(/([?&])autoplay=1\b/g, "$1autoplay=0");
    const queryPrefix = uri.includes("?") ? "&" : "?";
    if (!/[?&]autoplay=/.test(uri)) {
      uri = `${uri}${queryPrefix}autoplay=0`;
    }
  }

  return {
    uri,
    headers: { Referer: Config.wpUrl },
  };
};

const shouldStartRequest = (
  request: WebViewRequest,
  iframeSource: string,
  onLinkPress: (event: unknown, href: string) => void,
): boolean => {
  const requestUrl = request.url;
  if (!requestUrl) return true;
  if (requestUrl.startsWith("about:") || requestUrl.startsWith("data:")) {
    return true;
  }
  if (request.isTopFrame === false) return true;
  const isUserNavigation =
    request.navigationType === "click" ||
    request.navigationType === "formsubmit";
  if (!isUserNavigation) return true;

  const { hostname: requestHost } = Linking.parse(requestUrl);
  const { hostname: frameHost } = Linking.parse(iframeSource);
  const requestParts = requestHost?.split(".") || [];
  const frameParts = frameHost?.split(".") || [];
  if (requestHost && requestHost?.includes("platform.twitter")) return true;
  if (requestParts.at(-2) !== frameParts.at(-2)) {
    onLinkPress(undefined, requestUrl);
    return false;
  }
  return true;
};

/**
 *
 */
const IframeRenderer = ({
  renderProps,
  width,
  maxWidth,
  onLinkPress,
}: IframeRendererProperties) => {
  const [scroll, setScroll] = useState(false);
  const { htmlAttribs } = useHtmlIframeProps(renderProps);
  const source = htmlAttribs.src;
  const webViewSource = prepareWebViewSource(source);

  const onMessage = useCallback((event: WebViewMessageEvent) => {
    const h = Number.parseInt(event.nativeEvent.data, 10);
    if (h > 400) setScroll(true);
  }, []);

  if (htmlAttribs.class?.includes("wp-embedded-content")) {
    const slug = extractSlug(source);

    // If slug is empty, show a debug message instead of nothing
    if (!slug) {
      return (
        <View
          style={{
            maxWidth: 500,
            padding: 16,
            backgroundColor: "#ffeeee",
            borderRadius: 8,
          }}
        >
          <Text>Debug: Empty slug extracted from src: {source}</Text>
        </View>
      );
    }

    return (
      <View
        style={{
          maxWidth: 500,
          minHeight: 450,
          marginLeft: width > 500 ? (maxWidth - 500) / 2 : 0,
          overflow: "visible",
        }}
      >
        <View style={{ ...styles.roundEdges, margin: 12 }}>
          <LoadArticlePost slug={slug} />
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      renderToHardwareTextureAndroid
      contentContainerStyle={styles.centered}
    >
      <WebView
        source={webViewSource}
        style={{ width, maxWidth: maxWidth + 40, height: Math.min(width, 400) }}
        nestedScrollEnabled={scroll}
        thirdPartyCookiesEnabled={false}
        injectedJavaScriptBeforeContentLoaded={INJECT_BEFORE}
        injectedJavaScript={INJECT_AFTER}
        onMessage={onMessage}
        onError={(event: WebViewErrorEvent) =>
          console.error("Error", event.nativeEvent.title)
        }
        allowsFullscreenVideo
        incognito
        mediaPlaybackRequiresUserAction
        allowsInlineMediaPlayback
        renderError={() => <Text>Render Error</Text>}
        scalesPageToFit={false}
        overScrollMode="never"
        scrollEnabled={scroll}
        bounces={false}
        renderLoading={() => <AnimatedLoading />}
        onShouldStartLoadWithRequest={(request) =>
          shouldStartRequest(request, source, onLinkPress)
        }
      />
    </ScrollView>
  );
};

export default IframeRenderer;

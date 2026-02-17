import { useHtmlIframeProps } from "@native-html/iframe-plugin";
import * as Linking from "expo-linking";
import { useCallback, useState } from "react";
import { View } from "react-native";
import { CustomRendererProps, TBlock } from "react-native-render-html";
import WebView from "react-native-webview";
import {
  WebViewErrorEvent,
  WebViewMessageEvent,
} from "react-native-webview/lib/WebViewTypes";

import AnimatedLoading from "#/components/animations/AnimatedLoading";
import ErrorCard from "#/components/design/ErrorCard";
import Text from "#/components/design/Text";
import LoadArticlePost from "#/components/posts/LoadArticlePost";
import Config from "#/constants/Config";
import { styles } from "#/constants/Styles";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";

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
  const postHeight = () => {
    const bodyHeight = document.body ? document.body.scrollHeight : 0;
    const docHeight = document.documentElement ? document.documentElement.scrollHeight : 0;
    window.ReactNativeWebView.postMessage(String(Math.max(bodyHeight, docHeight)));
  };
  postHeight();
  window.addEventListener("load", postHeight);
  window.addEventListener("resize", postHeight);
  if (window.MutationObserver) {
    const setupObserver = () => {
      if (!document.body) {
        return;
      }
      const observer = new MutationObserver(postHeight);
      observer.observe(document.body, { attributes: true, childList: true, subtree: true });
    };
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", setupObserver);
    } else {
      setupObserver();
    }
  }
  if (document.head) {
    const meta = document.createElement('meta');
    meta.name = 'viewport';
    meta.content = 'width=device-width, initial-scale=1, maximum-scale=1';
    document.head.appendChild(meta);
  }
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
 * @param colorScheme - The current color scheme ("light" or "dark") used to configure iframe appearance (e.g., Datawrapper embeds).
 * @returns An object containing the (possibly modified) `uri` and optional
 * `headers` to be passed to the WebView `source` prop.
 */
const prepareWebViewSource = (
  url: string,
  colorScheme: "light" | "dark",
): { uri: string; headers?: { Referer: string } } | null => {
  // Linking.parse is tolerant, but it doesn't give us a URL object we can mutate.
  // We'll use it to detect the host, then rebuild the URL with the standard URL API.
  const parsed = Linking.parse(url);

  const hostname = parsed.hostname ?? "";
  if (!hostname) {
    return null;
  }

  const isYouTube =
    hostname.includes("youtube.com") ||
    hostname.includes("youtube-nocookie.com") ||
    hostname.includes("youtu.be");

  const isDatawrapper = hostname.includes("datawrapper.dwcdn.net");

  if (!isYouTube && !isDatawrapper) return { uri: url };

  // Rebuild & mutate query params safely
  let u: URL;
  try {
    // Ensure absolute URL for the constructor
    u = new URL(url);
  } catch {
    return { uri: url };
  }

  if (isYouTube) {
    u.searchParams.set("autoplay", "0");
    return {
      uri: u.toString(),
      headers: { Referer: Config.wpUrl },
    };
  }

  if (isDatawrapper) {
    u.searchParams.set("dark", colorScheme === "dark" ? "true" : "false");
  }

  return { uri: u.toString() };
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
  const fallbackHeight = Math.min(width, 400);
  const colorScheme = useAppColorScheme();
  const [webViewHeight, setWebViewHeight] = useState(fallbackHeight);
  const { htmlAttribs } = useHtmlIframeProps(renderProps);
  const source = htmlAttribs.src;
  const webViewSource = prepareWebViewSource(source, colorScheme);

  const onMessage = useCallback((event: WebViewMessageEvent) => {
    const parsedHeight = Number.parseInt(event.nativeEvent.data, 10);
    if (Number.isNaN(parsedHeight) || parsedHeight <= 0) return;
    setWebViewHeight(parsedHeight);
  }, []);

  if (!webViewSource)
    return (
      <ErrorCard
        style={{ marginHorizontal: 10 }}
        text={"Error rendering iframe"}
      />
    );

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
    <View style={{ alignItems: "center" }}>
      <WebView
        source={webViewSource}
        style={{
          width,
          maxWidth: maxWidth + 40,
          height: webViewHeight,
          backgroundColor: "transparent",
        }}
        nestedScrollEnabled={false}
        accessibilityLabel={`Embedded content from ${new URL(webViewSource.uri).hostname}`}
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
        scrollEnabled={false}
        bounces={false}
        renderLoading={() => <AnimatedLoading />}
        onShouldStartLoadWithRequest={(request) =>
          shouldStartRequest(request, source, onLinkPress)
        }
      />
    </View>
  );
};

export default IframeRenderer;

import { useHtmlIframeProps } from "@native-html/iframe-plugin";
import * as Linking from "expo-linking";
import { useCallback, useState } from "react";
import { Dimensions, View } from "react-native";
import type { CustomRendererProps, TBlock } from "react-native-render-html";
import { WebView } from "react-native-webview";
import type {
  WebViewErrorEvent,
  WebViewMessageEvent,
} from "react-native-webview/lib/WebViewTypes";

import LoadArticlePost from "#/components/loader/LoadArticlePost";
import UiErrorCard from "#/components/ui/UiErrorCard";
import UiSpinner from "#/components/ui/UiSpinner";
import UiText from "#/components/ui/UiText";
import { radii } from "#/constants/BorderRadius";
import Colors from "#/constants/Colors";
import Config from "#/constants/Config";
import { isDarkMode } from "#/helpers/utils/color";
import { findSecondaryWpFeed } from "#/helpers/utils/feeds";
import { isHttpsUrl } from "#/helpers/utils/networking";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";
import type { AppColorScheme } from "#/hooks/useAppColorScheme";
import type { HttpsUrl } from "#/types";

export interface IframeRendererProperties {
  renderProps: CustomRendererProps<TBlock>;
  width: number;
  maxWidth: number;
  onLinkPress: (event: unknown, href: HttpsUrl) => void;
}

// Injected JS constants for WebView
const INJECT_BEFORE = `
  document.querySelectorAll("video").forEach(video => video.removeAttribute("autoplay"));
  // The default UA stylesheet gives body an 8px margin, which inflates
  // scrollHeight beyond the actual content. Left in place, that inflated
  // height gets reported to RN, which resizes the WebView, which resizes
  // this document, which reports an inflated height again — an unbounded
  // growth loop (visible as an embed that keeps growing while in view).
  if (document.documentElement) document.documentElement.style.height = "auto";
  if (document.body) { document.body.style.margin = "0"; document.body.style.height = "auto"; }
`;
const INJECT_AFTER = `
  const postHeight = () => {
    const bodyHeight = document.body ? document.body.scrollHeight : 0;
    const docHeight = document.documentElement ? document.documentElement.scrollHeight : 0;
    window.ReactNativeWebView.postMessage(String(Math.max(bodyHeight, docHeight)));
  };
  postHeight();
  window.addEventListener("load", postHeight);
  // Deliberately not listening for "resize" here: resizing the WebView's
  // native view (which is exactly what happens every time we report a new
  // height to RN) fires this event inside the document too, so a resize
  // listener re-measures on the very change it caused — the other half of
  // the feedback loop described above. The MutationObserver below still
  // catches genuine content growth (e.g. a player injecting elements after
  // load) without re-triggering on our own height updates.
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

interface WebViewRequest {
  url?: string;
  isTopFrame?: boolean;
  navigationType?: string;
}

/**
 * Prepare the source configuration for a WebView, with special handling for YouTube and Datawrapper embeds.
 *
 * For YouTube URLs, this function disables autoplay in the query parameters and
 * adds a Referer header based on the WordPress site URL. For Datawrapper URLs,
 * this function sets the dark mode parameter based on the current color scheme.
 * Other URLs are returned unchanged without additional headers.
 *
 * @param url - The iframe source URL to be loaded in the WebView.
 * @param colorScheme - The current color scheme ("light" or "dark") used to configure iframe appearance (e.g., Datawrapper embeds).
 * @returns An object containing the (possibly modified) `uri` and optional
 * `headers` to be passed to the WebView `source` prop.
 */
const prepareWebViewSource = (
  url: string,
  colorScheme: AppColorScheme,
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
    u.searchParams.set("dark", isDarkMode(colorScheme) ? "true" : "false");
  }

  return { uri: u.toString() };
};

const shouldStartRequest = (
  request: WebViewRequest,
  iframeSource: string,
  onLinkPress: (event: unknown, href: HttpsUrl) => void,
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
    if (isHttpsUrl(requestUrl)) {
      onLinkPress(undefined, requestUrl);
    }
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
    // Safety net against any remaining resize/measure feedback loop (see the
    // injected JS comments above): no legitimate embed needs to be taller
    // than the screen, so cap it there instead of letting a loop grow it
    // without bounds.
    const maxHeight = Dimensions.get("window").height;
    setWebViewHeight(Math.min(parsedHeight, maxHeight));
  }, []);

  if (!webViewSource)
    return (
      <UiErrorCard
        style={{ marginHorizontal: 10 }}
        text="Error rendering iframe"
      />
    );

  if (htmlAttribs.class?.includes("wp-embedded-content")) {
    const slug = extractSlug(source);
    // A WordPress embed points at the site it lives on. When that's a
    // configured secondary feed (e.g. Prüfpunkt), load the related article
    // from that site's API rather than the primary one, which wouldn't have
    // the slug and would throw "Article not found".
    const secondaryWp = findSecondaryWpFeed(
      source,
      Config.wpUrl,
      Config.feeds?.wp,
    );

    // If slug is empty, show a debug message instead of nothing
    if (!slug) {
      return (
        <View
          style={{
            maxWidth: 500,
            padding: 16,
            backgroundColor: Colors[colorScheme].surfaceError,
            borderRadius: radii.sm,
          }}
        >
          <UiText style={{ color: Colors[colorScheme].onError }}>
            Debug: Empty slug extracted from src: {source}
          </UiText>
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
        <View style={{ margin: 12 }}>
          <LoadArticlePost slug={slug} baseUrl={secondaryWp?.handle} elevated />
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
        accessibilityLabel={`Embedded content from ${Linking.parse(webViewSource.uri).hostname ?? "external source"}`}
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
        renderError={() => <UiText>Render Error</UiText>}
        scalesPageToFit={false}
        overScrollMode="never"
        scrollEnabled={false}
        bounces={false}
        renderLoading={() => <UiSpinner size="large" />}
        onShouldStartLoadWithRequest={(request) =>
          shouldStartRequest(request, source, onLinkPress)
        }
      />
    </View>
  );
};

export default IframeRenderer;

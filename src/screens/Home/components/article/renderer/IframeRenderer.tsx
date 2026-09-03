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

import LoadArticlePost, {
  ArticleNotFoundError,
} from "#/components/loader/LoadArticlePost";
import LoadOpenGraphCard from "#/components/loader/LoadOpenGraphCard";
import UiErrorCard from "#/components/ui/UiErrorCard";
import UiSpinner from "#/components/ui/UiSpinner";
import UiText from "#/components/ui/UiText";
import { radii } from "#/constants/BorderRadius";
import Colors from "#/constants/Colors";
import Config from "#/constants/Config";
import { spacing } from "#/constants/Spacing";
import { safeParseHostname } from "#/helpers/Linking";
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
  const postHeight = (height) => {
    if (typeof height === "number" && height > 0) {
      window.ReactNativeWebView.postMessage(String(Math.round(height)));
    }
  };

  if (/(^|\\.)(youtube\\.com|youtube-nocookie\\.com|youtu\\.be|vimeo\\.com)$/i.test(window.location.hostname)) {
    // Video embeds are sized directly from the article width on the RN side
    // (fixed 16:9, see isVideoEmbedHost) and RN ignores any postMessage
    // height for them, so skip the measurement/observer setup entirely
    // instead of doing pointless work on every DOM mutation.
  } else if (/(^|\\.)dwcdn\\.net$/i.test(window.location.hostname)) {
    // Datawrapper posts its own authoritative height via postMessage
    // whenever its chart layout actually changes (see its vendor bundle:
    // window.parent.postMessage({"datawrapper-height": {[chartId]: height}}, "*")).
    // Since this WebView has no real parent frame, window.parent === window,
    // so a plain "message" listener on this same window catches the self-post.
    // Relaying that value straight through is both more accurate than
    // guessing from scrollHeight and structurally immune to the resize
    // feedback loop below, since Datawrapper only sends it in response to
    // genuine content changes, never in response to us resizing the WebView.
    window.addEventListener("message", (event) => {
      const heights = event && event.data && event.data["datawrapper-height"];
      if (!heights) return;
      const values = Object.values(heights);
      if (values.length) postHeight(Number(values[0]));
    });
  } else {
    const measure = () => {
      const bodyHeight = document.body ? document.body.scrollHeight : 0;
      const docHeight = document.documentElement ? document.documentElement.scrollHeight : 0;
      postHeight(Math.max(bodyHeight, docHeight));
    };
    let debounceTimer = null;
    const scheduleMeasure = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(measure, 50);
    };
    measure();
    window.addEventListener("load", scheduleMeasure);
    // Deliberately not listening for window "resize" here: resizing the
    // WebView's native view (which is exactly what happens every time we
    // report a new height to RN) fires this event inside the document too,
    // so a resize listener re-measures on the very change it caused — a
    // feedback loop. ResizeObserver on the body's own content box sidesteps
    // this: it fires on genuine content-driven size changes (e.g. a player
    // injecting elements after load), not on us changing the WebView's
    // height, since that alone doesn't alter the body's content box.
    if (window.ResizeObserver && document.body) {
      new ResizeObserver(scheduleMeasure).observe(document.body);
    } else if (window.MutationObserver) {
      const setupObserver = () => {
        if (!document.body) return;
        new MutationObserver(scheduleMeasure).observe(document.body, {
          attributes: true,
          childList: true,
          subtree: true,
        });
      };
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", setupObserver);
      } else {
        setupObserver();
      }
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

/**
 * Derives the canonical (non-embed) page URL from a wp-embedded-content
 * iframe's src, e.g. ".../project/foo/embed/#?secret=xyz" becomes
 * ".../project/foo/". Used to link out to content LoadArticlePost can't
 * fetch as a regular post (e.g. a "project" custom-post-type page, whose
 * REST endpoint isn't public).
 */
const embedSourceToPageUrl = (source: string): HttpsUrl | null => {
  try {
    const url = new URL(source);
    url.hash = "";
    url.search = "";
    url.pathname = url.pathname.replace(/\/embed\/?$/, "/");
    const page = url.toString();
    return isHttpsUrl(page) ? page : null;
  } catch {
    return null;
  }
};

/**
 * Turns a slug like "landtagswahl-sachsen-anhalt" into "Landtagswahl Sachsen
 * Anhalt", for LoadOpenGraphCard's fallback title while its preview fetch is
 * in flight (or if that fetch can't find an og:title either).
 */
const humanizeSlug = (slug: string): string =>
  slug
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

interface EmbedFallbackCardProperties {
  slug: string;
  source: string;
  onLinkPress: (event: unknown, href: HttpsUrl) => void;
}

/**
 * Shown in place of an embedded article when LoadArticlePost can't fetch it
 * as a post (deleted/renamed slug, or content of a type other than "post",
 * e.g. a WordPress "project" page). Rather than a bare "couldn't load"
 * error, this previews the real page the same way an ArticlePost previews a
 * regular post — title, image, excerpt — sourced from that page's own Open
 * Graph tags, since its REST data isn't reachable.
 */
const EmbedFallbackCard = ({
  slug,
  source,
  onLinkPress,
}: EmbedFallbackCardProperties) => {
  const pageUrl = embedSourceToPageUrl(source);
  if (!pageUrl) return null;

  return (
    <LoadOpenGraphCard
      url={pageUrl}
      fallbackTitle={humanizeSlug(slug)}
      onPress={(event) => onLinkPress(event, pageUrl)}
    />
  );
};

/**
 * True when `hostname` is `base` itself or a subdomain of it. Plain
 * `hostname.includes(base)` (the previous check here and in
 * prepareWebViewSource below) also matches unrelated hosts that merely
 * contain `base` as a substring, e.g. "notyoutube.com".includes("youtube.com")
 * is true — which would wrongly force 16:9 video sizing (or Datawrapper's
 * autoplay/dark-mode query params) onto an unrelated embed. Hostnames are
 * case-insensitive, so both sides are lowercased before comparing.
 */
const hostMatches = (hostname: string, base: string): boolean => {
  const normalizedHost = hostname.toLowerCase();
  const normalizedBase = base.toLowerCase();
  return (
    normalizedHost === normalizedBase ||
    normalizedHost.endsWith(`.${normalizedBase}`)
  );
};

const hostMatchesAny = (hostname: string, bases: string[]): boolean =>
  bases.some((base) => hostMatches(hostname, base));

const YOUTUBE_HOSTS = ["youtube.com", "youtube-nocookie.com", "youtu.be"];
const VIMEO_HOSTS = ["vimeo.com"];

/**
 * True when `hostname` is a video-embed provider with a fixed 16:9 aspect
 * ratio. Used to size the embed from the article width instead of trusting
 * the WebView's self-reported content height, which for a video player is
 * fragile (see the height-measurement feedback-loop notes above) and not
 * actually meaningful — a video's height should track its width, not its
 * (often WebView-viewport-dependent) DOM content height.
 */
const isVideoEmbedHost = (hostname: string): boolean =>
  hostMatchesAny(hostname, [...YOUTUBE_HOSTS, ...VIMEO_HOSTS]);

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
  url: string | undefined,
  colorScheme: AppColorScheme,
): { uri: string; headers?: { Referer: string } } | null => {
  // safeParseHostname tolerates a missing/empty/unparseable url; we still
  // detect the host via Linking.parse, then rebuild the URL with the
  // standard URL API below since Linking.parse doesn't give us a mutable
  // URL object.
  const hostname = safeParseHostname(url);
  if (!hostname || !url) {
    return null;
  }

  const isYouTube = hostMatchesAny(hostname, YOUTUBE_HOSTS);

  const isDatawrapper = hostMatches(hostname, "datawrapper.dwcdn.net");

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
  // htmlAttribs is typed as Record<string, string>, but a malformed
  // <iframe> with no src attribute genuinely yields undefined at runtime.
  const source = htmlAttribs.src as string | undefined;
  const webViewSource = prepareWebViewSource(source, colorScheme);
  const isVideo = isVideoEmbedHost(safeParseHostname(source));
  // Video players get a fixed 16:9 height derived from the WebView's actual
  // rendered width instead of the WebView's self-reported content height.
  // The WebView's own style caps its width at maxWidth + 40 (see below), so
  // on wide screens where width exceeds that cap, deriving the height from
  // the uncapped `width` would make the video too tall for its actual
  // (capped) rendered width.
  const renderedWidth = Math.min(width, maxWidth + 40);
  const videoHeight = Math.round(renderedWidth * (9 / 16));

  const onMessage = useCallback(
    (event: WebViewMessageEvent) => {
      if (isVideo) return;
      const parsedHeight = Number.parseInt(event.nativeEvent.data, 10);
      if (Number.isNaN(parsedHeight) || parsedHeight <= 0) return;
      // Safety net against any remaining resize/measure feedback loop (see
      // the injected JS comments above), not a bound on legitimate content:
      // this WebView renders with scrollEnabled={false}, so anything beyond
      // the cap becomes permanently inaccessible rather than just requiring
      // a scroll. A genuinely tall embed (e.g. a detailed Datawrapper map)
      // can reasonably exceed one screen's height, so the cap is several
      // screens tall — generous enough for real content, while still
      // bounding runaway growth, which historically reached far more than
      // that within a few iterations.
      const maxHeight = Dimensions.get("window").height * 4;
      setWebViewHeight(Math.min(parsedHeight, maxHeight));
    },
    [isVideo],
  );

  if (!webViewSource)
    return (
      <UiErrorCard
        style={{ marginHorizontal: spacing.md }}
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
            padding: spacing.lg,
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
        <View style={{ margin: spacing.md }}>
          <LoadArticlePost
            slug={slug}
            baseUrl={secondaryWp?.handle}
            elevated
            // Only fall back to the preview card for a genuinely missing
            // slug (renamed/deleted, or content of a type other than "post"
            // such as a "project" page) — not for a transient network/server
            // error, where the article might well exist and the default
            // error card's "try again later" is the more honest message.
            renderError={(error) =>
              error instanceof ArticleNotFoundError ? (
                <EmbedFallbackCard
                  slug={slug}
                  source={source ?? ""}
                  onLinkPress={onLinkPress}
                />
              ) : (
                <UiErrorCard
                  style={{ marginHorizontal: spacing.md }}
                  text="Beitrag konnte nicht geladen werden. Bitte später erneut versuchen."
                />
              )
            }
          />
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
          height: isVideo ? videoHeight : webViewHeight,
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

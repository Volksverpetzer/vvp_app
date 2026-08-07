import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import type {
  WebViewErrorEvent,
  WebViewHttpErrorEvent,
} from "react-native-webview/lib/WebViewTypes";

import NavBar from "#/components/bars/NavBar";
import Colors from "#/constants/Colors";
import { onLinkPress, parsePath } from "#/helpers/Linking";
import { isHttpsUrl } from "#/helpers/utils/networking";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";

// Static — hoisted so it isn't a fresh array (and thus a changed prop) on
// every render. Unlike `source`, this specific prop doesn't itself trigger
// a reload, but it's the same footgun so it's fixed alongside it.
const ORIGIN_WHITELIST = ["*"];

// The in-app WebView never shows a cookie-consent UI of its own, so
// Complianz's banner script serves no purpose here — and on some pages its
// own init code crashes (an unguarded cmplz_banner.querySelector(...) call)
// when it defaults to "show" the banner for a fresh, cookie-less visitor,
// which it then "recovers" from via its own location.reload(), forever,
// since the crash means the reload never establishes any different state
// either. That crash is confirmed to live entirely inside
// complianz.min.js's own execution (its sibling inline config/helper
// scripts on the page don't reference the crashing code path), so removing
// just that one script tag before it can run avoids the crash without
// touching anything else WordPress renders on the page. Runs via
// injectedJavaScriptBeforeContentLoaded (before any of the page's own
// scripts execute) so it's in place before the deferred complianz.min.js
// tag — already present in the initial HTML, not inserted later — reaches
// its execution point at the end of parsing.
const BLOCK_COMPLIANZ_SCRIPT = `
  (function () {
    var isComplianzScript = function (node) {
      return (
        node &&
        node.tagName === "SCRIPT" &&
        typeof node.src === "string" &&
        node.src.indexOf("complianz-gdpr/cookiebanner/js/complianz") !== -1
      );
    };
    var removeComplianzScripts = function (root) {
      if (!root || !root.querySelectorAll) return;
      var scripts = root.querySelectorAll(
        'script[src*="complianz-gdpr/cookiebanner/js/complianz"]',
      );
      for (var i = 0; i < scripts.length; i++) scripts[i].remove();
    };
    removeComplianzScripts(document);
    if (window.MutationObserver) {
      new MutationObserver(function (mutations) {
        for (var i = 0; i < mutations.length; i++) {
          var added = mutations[i].addedNodes;
          for (var j = 0; j < added.length; j++) {
            if (isComplianzScript(added[j])) added[j].remove();
          }
        }
      }).observe(document, { childList: true, subtree: true });
    }
  })();
  true;
`;

/**
 * Toggles the trailing slash on `url`'s pathname only, preserving any query
 * string or fragment. Deep links can carry a fragment (e.g. the anchored
 * /project/10fakten/#quellen form built in [category]/[slug].tsx), and
 * naively appending/stripping "/" on the full URL string would corrupt it
 * (e.g. produce "…#quellen/" instead of "…/#quellen"). Falls back to the
 * unmodified url if it isn't a parseable absolute URL.
 */
const toggleTrailingSlash = (url: string): string => {
  try {
    const parsed = new URL(url);
    parsed.pathname = parsed.pathname.endsWith("/")
      ? parsed.pathname.replace(/\/+$/, "")
      : `${parsed.pathname}/`;
    return parsed.toString();
  } catch {
    return url;
  }
};

interface EdgelessWebviewProperties {
  /**
   * The URI to load in the WebView
   */
  uri: string;
  /**
   * Callback function when the WebView starts loading
   */
  onLoadStart?: () => void;
  /**
   * Callback function when the WebView finishes loading
   */
  onLoadEnd?: () => void;
  /**
   * Callback function when there's an error loading the WebView
   */
  onError?: (error: WebViewErrorEvent) => void;
  /**
   * Custom styles for the WebView container
   */
  style?: object;
  /**
   * Whether to show the navigation bar
   * @default true
   */
  showNavBar?: boolean;
}

/**
 * A full-screen WebView component with an optional navigation bar at the bottom.
 * The WebView takes up the full screen with the navigation bar fixed at the bottom.
 * The component handles safe area insets for proper display on devices with notches.
 */
const EdgelessWebview = ({
  uri,
  onLoadStart,
  onLoadEnd,
  onError,
  style,
  showNavBar = true,
}: EdgelessWebviewProperties) => {
  const insets = useSafeAreaInsets();
  const webViewReference = useRef<WebView>(null);
  // Whether a given WordPress path 404s or redirects on its slashless form
  // is inconsistent site-wide: some pages hard-404 without a trailing slash
  // and redirect fine with one (e.g. /stellenausschreibung-redaktion/), while
  // some Redirection-plugin shortlinks are exact-path matches that redirect
  // correctly without a slash but 404 when one is appended (e.g. /ltw-lsa).
  // Callers can't know in advance which case a given URL is, so rather than
  // guessing, retry once with the trailing slash toggled if the very first
  // request 404s.
  const hasRetriedSlash = useRef(false);
  const [effectiveUri, setEffectiveUri] = useState(uri);
  useEffect(() => {
    setEffectiveUri(uri);
    hasRetriedSlash.current = false;
  }, [uri]);
  const router = useRouter();
  const colorScheme = useAppColorScheme();
  const backgroundColor = Colors[colorScheme].background;
  const navLink = isHttpsUrl(effectiveUri) ? effectiveUri : undefined;
  // react-native-webview treats a new `source` object as a signal to
  // reload, even when its `uri` value is unchanged — an inline object
  // literal here would recreate `source` (and reload the page) on every
  // re-render of this component for any reason at all (a theme change, a
  // parent re-render, anything), independent of the actual URI. On pages
  // where the site's own script crashes and reloads on its own (see
  // toggleTrailingSlash/hasRetriedSlash above for one such case), every one
  // of those unrelated re-renders was its own extra, unnecessary reload —
  // compounding rather than recovering from the underlying page issue.
  const source = useMemo(() => ({ uri: effectiveUri }), [effectiveUri]);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor },
        { paddingBottom: showNavBar ? 0 : insets.bottom },
        style,
      ]}
    >
      <WebView
        ref={webViewReference}
        source={source}
        style={[styles.webview, { backgroundColor }]}
        onLoadStart={onLoadStart}
        onLoadEnd={onLoadEnd}
        onError={onError}
        onHttpError={(syntheticEvent: WebViewHttpErrorEvent) => {
          // See hasRetriedSlash above. onHttpError also fires for failed
          // sub-resources (images, scripts, …), not just the top document,
          // so only react when the failing URL's path matches the page
          // we're actually trying to load.
          const { nativeEvent } = syntheticEvent;
          if (
            nativeEvent.statusCode === 404 &&
            !hasRetriedSlash.current &&
            parsePath(nativeEvent.url) === parsePath(effectiveUri)
          ) {
            hasRetriedSlash.current = true;
            setEffectiveUri(toggleTrailingSlash(effectiveUri));
          }
        }}
        onShouldStartLoadWithRequest={({ url, isTopFrame }) => {
          // Allow the first load of the provided URI. parsePath normalizes
          // leading/trailing slashes so a WordPress canonical redirect that
          // only toggles the trailing slash is treated as the same page
          // instead of looping back into native navigation.
          if (
            !isHttpsUrl(url) ||
            !isTopFrame ||
            !url ||
            parsePath(url) === parsePath(effectiveUri)
          )
            return true;
          // Route natively instead
          onLinkPress(url, router, effectiveUri);
          return false;
        }}
        injectedJavaScriptBeforeContentLoaded={BLOCK_COMPLIANZ_SCRIPT}
        allowsBackForwardNavigationGestures={true}
        startInLoadingState={true}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        sharedCookiesEnabled={true}
        decelerationRate={0.998} // Normal scroll deceleration rate
        originWhitelist={ORIGIN_WHITELIST}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={Platform.OS !== "android"}
        allowsFullscreenVideo={true}
        pullToRefreshEnabled={true}
        bounces={true}
        scrollEnabled={true}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        overScrollMode="always"
        containerStyle={{ backgroundColor }}
      />
      {showNavBar && <NavBar link={navLink} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
});

export default EdgelessWebview;

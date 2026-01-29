import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { useCallback, useRef } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView, WebViewNavigation } from "react-native-webview";

import NavBar from "#/components/bars/NavBar";
import { onLinkPress } from "#/helpers/Linking";
import { HttpsUrl } from "#/types";

interface Cookie {
  name: string;
  value: string;
  domain: string;
  path?: string;
  expires?: string;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: "Strict" | "Lax" | "None";
}

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
  onError?: (error: any) => void;
  /**
   * Custom styles for the WebView container
   */
  style?: object;
  /**
   * Whether to show the navigation bar
   * @default true
   */
  showNavBar?: boolean;
  /**
   * Array of cookies to set in the WebView
   */
  cookies?: Cookie[];
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
  cookies = [
    {
      name: "cmplz_banner-status",
      value: "dismissed",
      domain: "www.volksverpetzer.de",
      path: "/",
      sameSite: "Lax",
    },
    {
      name: "cmplz_consented_services",
      value: "",
      domain: "www.volksverpetzer.de",
      path: "/",
      sameSite: "Lax",
    },
    {
      name: "cmplz_functional",
      value: "allow",
      domain: "www.volksverpetzer.de",
      path: "/",
      sameSite: "Lax",
    },
    {
      name: "cmplz_marketing",
      value: "allow",
      domain: "www.volksverpetzer.de",
      path: "/",
      sameSite: "Lax",
    },
    {
      name: "cmplz_policy_id",
      value: "24",
      domain: "www.volksverpetzer.de",
      path: "/",
      sameSite: "Lax",
    },
    {
      name: "cmplz_preferences",
      value: "allow",
      domain: "www.volksverpetzer.de",
      path: "/",
      sameSite: "Lax",
    },
    {
      name: "cmplz_statistics",
      value: "allow",
      domain: "www.volksverpetzer.de",
      path: "/",
      sameSite: "Lax",
    },
  ],
}: EdgelessWebviewProperties) => {
  const insets = useSafeAreaInsets();
  const webViewReference = useRef<WebView>(null);
  const router = useRouter();
  // Function to convert cookies to cookie string
  const getCookieString = useCallback((cookie: Cookie) => {
    const parts = [
      `${cookie.name}=${encodeURIComponent(cookie.value)}`,
      `Domain=${cookie.domain}`,
      `Path=${cookie.path || "/"}`,
    ];

    if (cookie.expires) parts.push(`Expires=${cookie.expires}`);
    if (cookie.secure) parts.push("Secure");
    if (cookie.httpOnly) parts.push("HttpOnly");
    if (cookie.sameSite) parts.push(`SameSite=${cookie.sameSite}`);

    return parts.join("; ");
  }, []);

  /**
   * Handles navigation state changes in the WebView
   * @param navState - The new navigation state
   */
  const handleNavigationStateChange = useCallback(
    (navState: WebViewNavigation) => {
      // Navigation state changes can be handled here if needed
      // console.warn is used instead of console.log as per linting rules
      console.warn("Navigation state changed:", navState);
    },
    [],
  );

  return (
    <View
      style={[
        styles.container,
        { paddingBottom: showNavBar ? 0 : insets.bottom },
        style,
      ]}
    >
      <WebView
        ref={webViewReference}
        source={{
          uri,
          headers: {
            // Set cookies in the headers
            Cookie: cookies
              .map(
                (cookie) =>
                  `${cookie.name}=${encodeURIComponent(cookie.value)}`,
              )
              .join("; "),
          },
        }}
        style={styles.webview}
        onLoadStart={(syntheticEvent) => {
          // Set cookies when the WebView starts loading
          const { nativeEvent } = syntheticEvent;
          if (nativeEvent.url === uri) {
            for (const cookie of cookies) {
              const cookieString = getCookieString(cookie);
              // @ts-ignore - setCookie is not in the type definition but exists
              webViewReference.current?.injectJavaScript(
                `document.cookie = '${cookieString}'; true;`,
              );
            }
          }
          onLoadStart?.();
        }}
        onLoadEnd={onLoadEnd}
        onError={onError}
        onNavigationStateChange={handleNavigationStateChange}
        onShouldStartLoadWithRequest={({ url, isTopFrame }) => {
          // Allow the first load of the provided URI
          const { path } = Linking.parse(url);
          const { path: origPath } = Linking.parse(uri);
          if (
            !isTopFrame ||
            !url ||
            path.replace("/", "") === origPath.replace("/", "")
          )
            return true;
          // Route natively instead
          onLinkPress(url as HttpsUrl, router, uri);
          return false;
        }}
        allowsBackForwardNavigationGestures={true}
        startInLoadingState={true}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        sharedCookiesEnabled={true}
        decelerationRate={0.998} // Normal scroll deceleration rate
        originWhitelist={["*"]}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={Platform.OS !== "android"}
        allowsFullscreenVideo={true}
        pullToRefreshEnabled={true}
        bounces={true}
        scrollEnabled={true}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        overScrollMode="always"
      />
      {showNavBar && <NavBar link={uri} />}
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

import * as Linking from "expo-linking";
import type { Href, Router } from "expo-router";
import * as WebBrowser from "expo-web-browser";

import Config from "#/constants/Config";
import { registerEvent } from "#/helpers/network/Analytics";
import type { HttpsUrl } from "#/types";

import { shouldExcludeFromDeepLink } from "./DeepLinkFilter";

/**
 * Handles in-app navigation for links. Internal links (same hostname)
 * are pushed to the router; external links open in the browser.
 * Links under /wp-content/uploads/ are treated as external and opened
 * with the OS default handler.
 * @param href - The URL to handle.
 * @param router - Expo Router instance for navigation.
 * @param article_link - Optional article URL for analytics context.
 */
const onLinkPress = (href: HttpsUrl, router: Router, article_link?: string) => {
  const { hostname, path } = Linking.parse(href);
  const { hostname: baseHostname } = Linking.parse(Config.wpUrl);

  // Check if the path should be excluded from deep linking
  if (hostname === baseHostname && shouldExcludeFromDeepLink(path)) {
    // Treat excluded paths as external links
    outBoundLinkPress(href, article_link);
    return;
  }

  if (hostname === baseHostname) {
    if (path) {
      const cleanPath = path.replace(/^\//, "").replace(/\/$/, "");
      router.push(`/${cleanPath}` as Href);
      return;
    }
    router.push(hostname as Href);
    return;
  }
  outBoundLinkPress(href, article_link);
};

/**
 * Opens an external URL and logs an analytics event.
 * @param href - The outbound URL to open.
 * @param article_link - Optional article URL for analytics context.
 */
const outBoundLinkPress = (href: HttpsUrl, article_link?: string) => {
  registerEvent(article_link, "Outbound Link: Click", { url: href });

  const { hostname, path } = Linking.parse(href);
  const { hostname: baseHostname } = Linking.parse(Config.wpUrl);

  // Upload links on our own domain should open in a browser context.
  // Using Linking.openURL here can recurse into app links on Android.
  if (hostname === baseHostname && shouldExcludeFromDeepLink(path)) {
    void WebBrowser.openBrowserAsync(href);
    return;
  }

  Linking.openURL(href);
};

export { onLinkPress, outBoundLinkPress };

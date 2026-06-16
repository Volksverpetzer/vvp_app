import * as Linking from "expo-linking";
import type { Href, ImperativeRouter } from "expo-router";

import Config from "#/constants/Config";
import { registerEvent } from "#/helpers/network/Analytics";
import type { HttpsUrl } from "#/types";

import { shouldExcludeFromDeepLink } from "./DeepLinkFilter";

const parsePath = (url: string): string => {
  const path = (Linking.parse(url).path ?? "").replace(/^\/+/, "");
  if (!path) return "";
  return path.endsWith("/") ? path : `${path}/`;
};

/**
 * Strips leading and trailing slashes from a URL path.
 * Use this for path comparisons and building Expo Router routes, where
 * `/foo/bar`, `/foo/bar/`, and `foo/bar` should all be treated as equal.
 *
 * Note: distinct from `parsePath`, which intentionally adds a trailing slash
 * for server API endpoint construction.
 */
const normalizePath = (path: string): string => path.replace(/^\/|\/$/g, "");

/**
 * Handles in-app navigation for links. Internal links (same hostname)
 * are pushed to the router; external links open in the browser.
 * Links under /wp-content/uploads/ are treated as external and opened
 * with the OS default handler.
 * @param href - The URL to handle.
 * @param router - Expo Router instance for navigation.
 * @param article_link - Optional article URL for analytics context.
 */
const onLinkPress = (
  href: HttpsUrl,
  router: ImperativeRouter,
  article_link?: string,
) => {
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
      router.push(`/${normalizePath(path)}` as Href);
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
  Linking.openURL(href);
};

export { normalizePath, onLinkPress, outBoundLinkPress, parsePath };

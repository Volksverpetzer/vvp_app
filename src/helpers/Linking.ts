import * as Linking from "expo-linking";
import type { Href, ImperativeRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";

import Config from "#/constants/Config";
import { registerEvent } from "#/helpers/network/Analytics";
import { getInternalWpHosts } from "#/helpers/utils/feeds";
import { normalizeHost } from "#/helpers/utils/host";
import type { HttpsUrl } from "#/types";

import { shouldExcludeFromDeepLink } from "./DeepLinkFilter";

const parsePath = (url: string): string => {
  const path = (Linking.parse(url).path ?? "").replace(/^\/+/, "");
  if (!path) return "";
  return path.endsWith("/") ? path : `${path}/`;
};

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
  const internalHostnames = getInternalWpHosts(Config.wpUrl, Config.feeds?.wp);
  const normalizedHostname = normalizeHost(hostname);

  if (
    internalHostnames.includes(normalizedHostname) &&
    shouldExcludeFromDeepLink(path)
  ) {
    openExternalDownload(href, article_link);
    return;
  }

  if (internalHostnames.includes(normalizedHostname)) {
    if (path) {
      const cleanPath = path.replace(/^\//, "").replace(/\/$/, "");
      router.push({
        pathname: `/${cleanPath}`,
        params: { originalUrl: href },
      } as unknown as Href);
      return;
    }
    // Bare-domain internal link (no path) — open the app home instead of
    // pushing the raw hostname as a route, which never matches.
    router.push("/");
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

/**
 * Opens an upload/download URL (e.g. /wp-content/uploads/…) outside the app.
 *
 * Uses a Chrome Custom Tab / SFSafariViewController via expo-web-browser rather
 * than `Linking.openURL`: on Android versions where our app still claims the
 * upload URL (API < 31, where the manifest's `pathAdvancedPattern` exclude is
 * ignored), `Linking.openURL` would re-dispatch the URL back into our app and
 * loop. A Custom Tab never re-triggers the owning app's deep links, so the file
 * downloads/opens in the browser. Falls back to `openURL` if the browser call
 * fails.
 * @param href - The upload/download URL to open.
 * @param article_link - Optional article URL for analytics context.
 */
const openExternalDownload = async (href: HttpsUrl, article_link?: string) => {
  registerEvent(article_link, "Outbound Link: Click", { url: href });
  try {
    await WebBrowser.openBrowserAsync(href);
  } catch {
    await Linking.openURL(href);
  }
};

export { onLinkPress, openExternalDownload, outBoundLinkPress, parsePath };

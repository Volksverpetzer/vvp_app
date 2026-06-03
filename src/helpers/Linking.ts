import * as Linking from "expo-linking";
import type { Href, ImperativeRouter } from "expo-router";

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
// Strip www. prefix so that pruefpunkt.org and www.pruefpunkt.org both match.
const normalizeHost = (host: string | null): string =>
  (host ?? "").replace(/^www\./, "");

const onLinkPress = (
  href: HttpsUrl,
  router: ImperativeRouter,
  article_link?: string,
) => {
  const { hostname, path } = Linking.parse(href);
  const internalHostnames = [Config.wpUrl, Config.wp2Url]
    .filter(Boolean)
    .map((url) => normalizeHost(Linking.parse(url!).hostname));
  const normalizedHostname = normalizeHost(hostname);

  if (
    internalHostnames.includes(normalizedHostname) &&
    shouldExcludeFromDeepLink(path)
  ) {
    outBoundLinkPress(href, article_link);
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

export { onLinkPress, outBoundLinkPress };

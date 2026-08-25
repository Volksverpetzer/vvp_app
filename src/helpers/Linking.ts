import * as Linking from "expo-linking";
import type { Href, ImperativeRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";

import Config from "#/constants/Config";
import { registerEvent } from "#/helpers/network/Analytics";
import { getInternalWpHosts } from "#/helpers/utils/feeds";
import { normalizeHost } from "#/helpers/utils/host";
import type { HttpsUrl } from "#/types";

import { shouldExcludeFromDeepLink } from "./DeepLinkFilter";

/**
 * A URL accepted by {@link onLinkPress}: either already `https://`, or
 * `http://` for callers relaying auto-linkified text (see onLinkPress) that
 * defaults schema-less matches to that scheme. onLinkPress upgrades the
 * latter to https before use, so this only widens the *input* contract —
 * everything downstream still deals exclusively in `HttpsUrl`.
 */
type LinkHref = HttpsUrl | `http://${string}`;

/**
 * Linking.parse throws for empty/unparseable input (confirmed against the
 * real expo-linking implementation, not just a test mock) rather than
 * returning a tolerant fallback. Callers include WebView event handlers
 * (e.g. EdgelessWebview's onHttpError, fired for every failed request
 * including sub-resources, or IframeRenderer's video-host detection) where
 * an unexpected url value shouldn't be able to crash the screen.
 */
const safeParse = (
  url: string | undefined,
): ReturnType<typeof Linking.parse> | null => {
  if (!url) return null;
  try {
    return Linking.parse(url);
  } catch {
    return null;
  }
};

const parsePath = (url: string): string => {
  const path = (safeParse(url)?.path ?? "").replace(/^\/+/, "");
  if (!path) return "";
  return path.endsWith("/") ? path : `${path}/`;
};

const safeParseHostname = (url: string | undefined): string =>
  safeParse(url)?.hostname ?? "";

/**
 * Handles in-app navigation for links. Internal links (same hostname)
 * are pushed to the router; external links open in the browser.
 * Links under /wp-content/uploads/ are treated as external and opened
 * with the OS default handler.
 *
 * `href` may arrive as `http://`: auto-linkified text (e.g.
 * react-native-hyperlink parsing an Instagram caption's bare
 * "volksverpetzer.de/..." mention) defaults to that scheme for schema-less
 * matches. An `http://` URL reaching the WebView trips Android's
 * cleartext-traffic block in release builds (debug builds allow it via
 * usesCleartextTraffic, masking the bug there and on iOS, which has no such
 * restriction) - so upgrade the scheme here, the single chokepoint shared by
 * every in-app link tap.
 * @param href - The URL to handle; `http://` is upgraded to `https://`.
 * @param router - Expo Router instance for navigation.
 * @param article_link - Optional article URL for analytics context.
 */
const onLinkPress = (
  href: LinkHref,
  router: ImperativeRouter,
  article_link?: string,
) => {
  const normalizedHref = href.replace(/^http:\/\//, "https://") as HttpsUrl;
  const parsed = safeParse(normalizedHref);
  if (!parsed) {
    outBoundLinkPress(normalizedHref, article_link);
    return;
  }
  const { hostname, path } = parsed;
  const internalHostnames = getInternalWpHosts(Config.wpUrl, Config.feeds?.wp);
  const normalizedHostname = normalizeHost(hostname);

  if (
    internalHostnames.includes(normalizedHostname) &&
    shouldExcludeFromDeepLink(path)
  ) {
    openExternalDownload(normalizedHref, article_link);
    return;
  }

  if (internalHostnames.includes(normalizedHostname)) {
    if (path) {
      const cleanPath = path.replace(/^\//, "").replace(/\/$/, "");
      router.push({
        pathname: `/${cleanPath}`,
        params: { originalUrl: normalizedHref },
      } as unknown as Href);
      return;
    }
    // Bare-domain internal link (no path) — open the app home instead of
    // pushing the raw hostname as a route, which never matches.
    router.push("/");
    return;
  }
  outBoundLinkPress(normalizedHref, article_link);
};

/**
 * Opens `href` in an in-app browser tab (Chrome Custom Tab /
 * SFSafariViewController) via expo-web-browser rather than `Linking.openURL`,
 * and logs an analytics event.
 *
 * A Custom Tab never re-dispatches the URL back into an app that claims it as an
 * App Link / Universal Link, so an outbound link can't loop back into our own
 * app. This matters on Android ≤ 11 (API < 31), where the manifest's
 * `pathAdvancedPattern` filters are ignored and our app claims every path on a
 * deep-link host (e.g. volksverpetzer.de, pruefpunkt.org). Falls back to
 * `openURL` — which also covers non-http schemes such as mailto: — if the
 * browser call fails. Never rejects, so callers can safely fire-and-forget it.
 * @param href - The URL to open.
 * @param article_link - Optional article URL for analytics context.
 */
const openInAppBrowser = async (href: string, article_link?: string) => {
  // Fire-and-forget; the catch keeps a failing analytics call from surfacing
  // as an unhandled rejection (it can never block the link from opening).
  registerEvent(article_link, "Outbound Link: Click", { url: href }).catch(
    (error) => console.warn("Failed to register outbound click:", error),
  );
  try {
    await WebBrowser.openBrowserAsync(href);
  } catch {
    try {
      await Linking.openURL(href);
    } catch (error) {
      console.warn("Failed to open link:", href, error);
    }
  }
};

/**
 * Opens an external (outbound) URL outside the app. See {@link openInAppBrowser}.
 * @param href - The outbound URL to open.
 * @param article_link - Optional article URL for analytics context.
 */
const outBoundLinkPress = (href: HttpsUrl, article_link?: string) =>
  openInAppBrowser(href, article_link);

/**
 * Opens an upload/download URL (e.g. /wp-content/uploads/…) outside the app.
 * See {@link openInAppBrowser}.
 * @param href - The upload/download URL to open.
 * @param article_link - Optional article URL for analytics context.
 */
const openExternalDownload = (href: HttpsUrl, article_link?: string) =>
  openInAppBrowser(href, article_link);

/**
 * True when `href` is an https URL on one of our WordPress hosts pointing at a
 * `/wp-content/uploads/` file — i.e. exactly the URLs the external-link screen
 * is meant to open. Used to reject arbitrary URLs passed via the
 * `/external-link?url=` deep link (open-redirect hardening). A `true` result
 * also narrows `href` to `HttpsUrl`, since the scheme is checked here.
 * @param href - The candidate URL.
 */
const isInternalUploadUrl = (href: string): href is HttpsUrl => {
  try {
    const parsed = new URL(href);
    if (parsed.protocol !== "https:") return false;
    const internalHostnames = getInternalWpHosts(
      Config.wpUrl,
      Config.feeds?.wp,
    );
    return (
      internalHostnames.includes(normalizeHost(parsed.hostname)) &&
      shouldExcludeFromDeepLink(parsed.pathname)
    );
  } catch {
    return false;
  }
};

export type { LinkHref };
export {
  isInternalUploadUrl,
  onLinkPress,
  openExternalDownload,
  outBoundLinkPress,
  parsePath,
  safeParseHostname,
};

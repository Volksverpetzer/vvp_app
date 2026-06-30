import Config from "#/constants/Config";
import { shouldExcludeFromDeepLink } from "#/helpers/DeepLinkFilter";
import { findSecondaryWpFeed } from "#/helpers/utils/feeds";
import { isSameHost } from "#/helpers/utils/host";

export function redirectSystemPath({ path }: { path: string }) {
  const wpUrl = Config.wpUrl;

  // 1. Option: the URL is from the share extension/intent
  try {
    const parsedUrl = new URL(path);
    if (parsedUrl.hostname === "expo-sharing") {
      return "/handle-share";
    }
  } catch {
    // Ignore parse errors and continue with the normal deep-link handling below.
  }

  // 2. Option: the URL is from our registered url handler. Match on host
  // (ignoring a www. prefix) rather than a literal wpUrl prefix, so links
  // arrive the same whether or not they carry www. Both the primary site and
  // every configured WordPress feed (e.g. pruefpunkt.org) are registered.
  try {
    const parsedUrl = new URL(path);
    const isPrimary = isSameHost(parsedUrl.href, wpUrl);
    const secondary = isPrimary
      ? undefined
      : findSecondaryWpFeed(parsedUrl.href, wpUrl, Config.feeds?.wp);
    if (isPrimary || secondary) {
      const urlPath = parsedUrl.pathname + parsedUrl.search + parsedUrl.hash;
      // Upload links (/wp-content/uploads/…) must not render in the app — they
      // are files to download. On Android < 31 the manifest can't exclude them,
      // so the OS still hands us the URL here; route to the external-link screen,
      // which opens it in the browser and pops back. (On iOS, and Android 12+,
      // the site-association / intent-filter exclude usually prevents the app
      // from opening at all, so this is the fallback path.)
      if (shouldExcludeFromDeepLink(urlPath)) {
        return `/external-link?url=${encodeURIComponent(parsedUrl.href)}`;
      }
      // Secondary-site links must carry originalUrl so the article route
      // fetches from the right WordPress API; primary links use the default.
      // Insert originalUrl into the query string (before any #hash) so
      // expo-router parses it as a param rather than part of the fragment.
      if (secondary) {
        const originalUrlParam = `originalUrl=${encodeURIComponent(parsedUrl.href)}`;
        const search = parsedUrl.search
          ? `${parsedUrl.search}&${originalUrlParam}`
          : `?${originalUrlParam}`;
        return `${parsedUrl.pathname}${search}${parsedUrl.hash}`;
      }
      return urlPath;
    }
  } catch {
    // Not an absolute URL (e.g. an already-relative in-app path); fall through.
  }

  // 3. Option: Profit
  return path;
}

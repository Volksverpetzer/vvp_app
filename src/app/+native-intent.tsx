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
      // Check if path should be excluded from deep linking
      if (shouldExcludeFromDeepLink(urlPath)) {
        // Return undefined to prevent routing for excluded paths
        // The app will not handle this path and it will be opened by OS
        return undefined;
      }
      // Secondary-site links must carry originalUrl so the article route
      // fetches from the right WordPress API; primary links use the default.
      if (secondary) {
        const separator = urlPath.includes("?") ? "&" : "?";
        return `${urlPath}${separator}originalUrl=${encodeURIComponent(parsedUrl.href)}`;
      }
      return urlPath;
    }
  } catch {
    // Not an absolute URL (e.g. an already-relative in-app path); fall through.
  }

  // 3. Option: Profit
  return path;
}

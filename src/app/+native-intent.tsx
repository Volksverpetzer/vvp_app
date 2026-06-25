import Config from "#/constants/Config";
import { shouldExcludeFromDeepLink } from "#/helpers/DeepLinkFilter";
import { normalizeHost } from "#/helpers/utils/host";

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
  // arrive the same whether or not they carry www.
  try {
    const parsedUrl = new URL(path);
    const wpHost = new URL(wpUrl).hostname;
    if (normalizeHost(parsedUrl.hostname) === normalizeHost(wpHost)) {
      const urlPath = parsedUrl.pathname + parsedUrl.search + parsedUrl.hash;
      // Check if path should be excluded from deep linking
      if (shouldExcludeFromDeepLink(urlPath)) {
        // Return undefined to prevent routing for excluded paths
        // The app will not handle this path and it will be opened by OS
        return undefined;
      }
      return urlPath;
    }
  } catch {
    // Not an absolute URL (e.g. an already-relative in-app path); fall through.
  }

  // 3. Option: Profit
  return path;
}

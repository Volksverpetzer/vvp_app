import Config from "#/constants/Config";
import { shouldExcludeFromDeepLink } from "#/helpers/DeepLinkFilter";

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

  // 2. Option: the URL is from our registered url handler
  if (path.startsWith(wpUrl)) {
    const urlPath = path.replace(wpUrl, "").replace(/\/$/, "");
    // Check if path should be excluded from deep linking.
    // Route to /external with the URL as a param so the dedicated screen can
    // open it with the OS default handler. Returning undefined here gives Expo
    // Router no valid route and the URL is silently dropped.
    if (shouldExcludeFromDeepLink(urlPath)) {
      return `/external?url=${encodeURIComponent(path)}`;
    }
    return urlPath;
  }

  // 3. Option: Profit
  return path;
}

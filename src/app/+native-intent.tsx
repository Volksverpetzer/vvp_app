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
    // Route to "/" so index.tsx renders and can call Linking.openURL to hand
    // the URL off to the OS. Returning undefined here leaves no valid route
    // for Expo Router and the URL is silently dropped.
    if (shouldExcludeFromDeepLink(urlPath)) {
      return "/";
    }
    return urlPath;
  }

  // 3. Option: Profit
  return path;
}

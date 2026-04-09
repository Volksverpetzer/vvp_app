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
    const urlPath = path.replace(wpUrl, "");
    // Check if path should be excluded from deep linking
    if (shouldExcludeFromDeepLink(urlPath)) {
      // Route excluded paths through `+not-found`, which will forward them
      // to the OS handler (and then return the user to the home screen).
      return urlPath;
    }
    return urlPath;
  }

  // 3. Option: Profit
  return path;
}

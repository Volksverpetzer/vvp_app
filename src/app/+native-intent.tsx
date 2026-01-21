import { getShareExtensionKey } from "expo-share-intent";

import Config from "../constants/Config";
import { shouldExcludeFromDeepLink } from "../helpers/DeepLinkFilter";

export function redirectSystemPath({ path }) {
  const wpUrl = Config.wpUrl;
  if (path.includes(`dataUrl=${getShareExtensionKey()}`)) {
    return "/shareintent";
  }

  // Check if the path should be excluded from deep linking
  if (path.startsWith(wpUrl)) {
    const urlPath = path.replace(wpUrl, "");
    if (shouldExcludeFromDeepLink(urlPath)) {
      // Return undefined to prevent routing for excluded paths
      // The app will not handle this path and it will be opened by OS
      return undefined;
    }
    return urlPath;
  }
  return path;
}

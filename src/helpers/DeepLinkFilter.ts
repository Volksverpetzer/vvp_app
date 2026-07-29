/**
 * Utility functions to determine if a URL should be excluded from deep linking.
 * URLs under /wp-content/uploads/ and WordPress RSS feed URLs (e.g. /feed/,
 * /category/x/feed/, /comments/feed/) should be opened by the OS default
 * handler instead of being handled by the app.
 */

// Matches a "feed" path segment on its own, e.g. /feed, /feed/, /feed/rss2/,
// /category/politik/feed/, /comments/feed/ - but not slugs like /feed-my-family.
const FEED_PATH_REGEX = /(^|\/)feed(\/|$)/;

/**
 * Checks if a path should be excluded from deep linking.
 * @param path - The URL path to check.
 * @returns True if the path should be excluded from app handling.
 */
export const shouldExcludeFromDeepLink = (
  path: string | null | undefined,
): boolean => {
  if (!path || typeof path !== "string") {
    return false;
  }

  // Exclude paths that start with /wp-content/uploads/
  // This ensures we only match actual upload paths and not paths that merely contain this string
  if (path.startsWith("/wp-content/uploads/")) {
    return true;
  }

  // Exclude WordPress RSS feed paths so they open in the browser/feed reader
  // instead of being routed as an in-app article path that can't render them.
  const [pathname] = path.split(/[?#]/);
  return FEED_PATH_REGEX.test(pathname);
};

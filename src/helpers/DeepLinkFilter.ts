/**
 * Utility functions to determine if a URL should be excluded from deep linking.
 * URLs under these prefixes should be opened by the OS default handler
 * instead of being handled by the app.
 */

const EXCLUDED_PATH_PREFIXES = ["/wp-content/uploads/", "/wp-admin/"];

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

  return EXCLUDED_PATH_PREFIXES.some((prefix) => path.startsWith(prefix));
};

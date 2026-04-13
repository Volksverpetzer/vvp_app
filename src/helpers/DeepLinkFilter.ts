/**
 * Utility functions to determine if a URL should be excluded from deep linking.
 * URLs under /wp-content/uploads/ should be opened by the OS default handler
 * instead of being handled by the app.
 */

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
  return path.startsWith("/wp-content/uploads/");
};

/**
 * Normalizes a hostname for comparison: lower-cased and without a leading
 * `www.`, so that `www.volksverpetzer.de` and `volksverpetzer.de` are treated
 * as the same host.
 *
 * Article and share links can arrive with or without the `www.` prefix
 * depending on the source (WordPress output, user-shared links, OS deep
 * links), so host matching must not depend on the prefix.
 */
export const normalizeHost = (host?: string | null): string =>
  (host ?? "").replace(/^www\./i, "").toLowerCase();

/**
 * Extracts the normalized host from a full URL string, returning "" when the
 * value is missing or not a parseable absolute URL.
 */
export const normalizedHostOf = (url?: string | null): string => {
  if (!url) return "";
  try {
    return normalizeHost(new URL(url).hostname);
  } catch {
    return "";
  }
};

/**
 * True when both URLs resolve to the same host, ignoring the `www.` prefix.
 * Returns false if either host cannot be determined.
 */
export const isSameHost = (a?: string | null, b?: string | null): boolean => {
  const hostA = normalizedHostOf(a);
  return hostA.length > 0 && hostA === normalizedHostOf(b);
};

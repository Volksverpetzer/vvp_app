import type {
  FeedKey,
  FeedType,
  FeedsConfig,
  InstaFeedEntry,
  InstaFeedKey,
  WpFeedEntry,
  WpFeedKey,
} from "#/types";

/**
 * Liefert den Settings-/Fetcher-Key eines WordPress-Feeds,
 * z. B. "wp:pruefpunkt.org" für https://www.pruefpunkt.org.
 */
export const getWpFeedKey = (entry: WpFeedEntry): WpFeedKey =>
  `wp:${entry.handle
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "")}`;

/**
 * Liefert den Settings-/Fetcher-Key eines Instagram-Feeds,
 * z. B. "insta:pruefpunkt" für den Account @pruefpunkt.
 */
export const getInstaFeedKey = (entry: InstaFeedEntry): InstaFeedKey =>
  `insta:${entry.handle}`;

/**
 * Liefert die aktivierten Feed‑Keys als `FeedKey[]`.
 * WordPress- und Instagram-Feeds werden pro Eintrag mit ihrem eigenen Key
 * aufgelöst.
 */
export const getEnabledFeeds = (feeds: FeedsConfig): FeedKey[] => {
  const { wp, insta, ...rest } = feeds;
  return [
    ...(wp ?? []).filter((entry) => !!entry.enabled).map(getWpFeedKey),
    ...(insta ?? []).filter((entry) => !!entry.enabled).map(getInstaFeedKey),
    ...Object.entries(rest)
      .filter(([, entry]) => !!entry?.enabled)
      .map(([key]) => key as Exclude<FeedType, "wp" | "insta">),
  ];
};

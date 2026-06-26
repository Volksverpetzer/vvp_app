import type {
  FeedKey,
  FeedType,
  FeedsConfig,
  InstaFeedEntry,
  InstaFeedKey,
  WpFeedEntry,
  WpFeedKey,
} from "#/types";

import { normalizedHostOf } from "./host";

/**
 * Liefert den Settings-/Fetcher-Key eines WordPress-Feeds,
 * z. B. "wp:pruefpunkt.org" für https://www.pruefpunkt.org.
 */
export const getWpFeedKey = (entry: WpFeedEntry): WpFeedKey =>
  `wp:${normalizedHostOf(entry.handle)}`;

/**
 * Normalized hosts treated as in-app/internal: the primary WordPress site plus
 * every configured WordPress feed. Used by the deep-link, share and in-app
 * link handlers to decide whether a URL should open inside the app.
 */
export const getInternalWpHosts = (
  primaryWpUrl: string,
  wp?: WpFeedEntry[],
): string[] =>
  [primaryWpUrl, ...(wp ?? []).map((entry) => entry.handle)]
    .map(normalizedHostOf)
    .filter(Boolean);

/**
 * The configured secondary WordPress feed whose host matches `url`, or
 * undefined when `url` is the primary site or not a configured feed. Secondary
 * feeds need their own WordPress API and an `originalUrl` so the article route
 * fetches from the right site.
 */
export const findSecondaryWpFeed = (
  url: string | undefined,
  primaryWpUrl: string,
  wp?: WpFeedEntry[],
): WpFeedEntry | undefined => {
  const host = normalizedHostOf(url);
  if (!host || host === normalizedHostOf(primaryWpUrl)) return undefined;
  return (wp ?? []).find((entry) => normalizedHostOf(entry.handle) === host);
};

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

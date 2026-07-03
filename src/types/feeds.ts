import type { HttpsUrl } from "./config";

export type FeedType =
  "reddit" | "wp" | "insta" | "yt" | "tiktok" | "bsky" | "bot";

export type FeedEntry = {
  handle?: string;
  enabled?: boolean;
};

export type WpFeedEntry = {
  handle: HttpsUrl; // base URL of the WordPress site
  label: string; // name shown for this feed's content setting
  enabled?: boolean;
  sourceName?: string; // stamped on articles so the post card shows the source
};

export type InstaFeedEntry = {
  handle: string; // Instagram account name, e.g. "pruefpunkt"
  label: string; // name shown for this feed's content setting
  enabled?: boolean;
};

/** Settings/fetcher key of a WordPress feed entry, e.g. "wp:pruefpunkt.org" */
export type WpFeedKey = `wp:${string}`;

/** Settings/fetcher key of an Instagram feed entry, e.g. "insta:pruefpunkt" */
export type InstaFeedKey = `insta:${string}`;

/** Key of an enabled feed: either a plain feed type or a per-account key */
export type FeedKey =
  Exclude<FeedType, "wp" | "insta"> | WpFeedKey | InstaFeedKey;

export type FeedsConfig = Partial<
  Record<Exclude<FeedType, "wp" | "insta">, FeedEntry>
> & {
  wp?: WpFeedEntry[];
  insta?: InstaFeedEntry[];
};

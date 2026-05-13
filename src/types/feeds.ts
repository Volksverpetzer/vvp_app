export type FeedType =
  | "reddit"
  | "wp"
  | "insta"
  | "yt"
  | "tiktok"
  | "bsky"
  | "bot"
  | "wp2";

export type FeedEntry = {
  handle?: string;
  enabled?: boolean;
};

export type FeedsConfig = Partial<Record<FeedType, FeedEntry>>;

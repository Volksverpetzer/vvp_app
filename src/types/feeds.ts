export type FeedType =
  | "reddit"
  | "wp"
  | "insta"
  | "yt"
  | "tiktok"
  | "bsky"
  | "bot"
  | "pruefpunkt";

export type FeedEntry = {
  handle?: string;
  enabled?: boolean;
};

export type FeedsConfig = Partial<Record<FeedType, FeedEntry>>;

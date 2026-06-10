import Config from "#/constants/Config";
import WordPressAPI from "#/helpers/network/WordPressAPI";
import { getInstaFeedKey, getWpFeedKey } from "#/helpers/utils/feeds";
import type { FeedFetcherType, FeedType } from "#/types";

import { BlueskyFetcher } from "./BlueskyFetcher";
import { BotFetcher } from "./BotFetcher";
import { InstagramFetcher } from "./InstagramFetcher";
import { TikTokFetcher } from "./TikTokFetcher";
import { WordPressFetcher } from "./WordPressFetcher";
import { YouTubeFetcher } from "./YouTubeFetcher";

// One fetcher per configured WordPress site (feed/search pair, search under
// "<key>:search") and per configured Instagram account, keyed by
// getWpFeedKey() / getInstaFeedKey().
const perFeedFetcherMap: Record<string, FeedFetcherType<unknown>> = {};
for (const entry of Config.feeds?.wp ?? []) {
  const { feedFetcher, searchFetcher } = WordPressFetcher.createFetchers(
    WordPressAPI.create(entry.handle),
    entry.sourceName,
  );
  const key = getWpFeedKey(entry);
  perFeedFetcherMap[key] = feedFetcher;
  perFeedFetcherMap[`${key}:search`] = searchFetcher;
}
for (const entry of Config.feeds?.insta ?? []) {
  perFeedFetcherMap[getInstaFeedKey(entry)] =
    InstagramFetcher.createFeedFetcher(entry.handle);
}

/**
 * FeedFetcher is responsible for fetching data from different sources
 * and returning an array of Post objects, each containing claim details and metadata.
 */
export class FeedFetcher {
  static readonly fetchers: Record<
    Exclude<FeedType, "wp" | "insta">,
    FeedFetcherType<unknown>
  > & {
    [key: string]: FeedFetcherType<unknown>;
  } = {
    reddit: InstagramFetcher.memeFetcher,
    yt: YouTubeFetcher.feedFetcher,
    tiktok: TikTokFetcher.feedFetcher,
    bsky: BlueskyFetcher.feedFetcher,
    bot: BotFetcher.feedFetcher,
    ...perFeedFetcherMap,
  };
}

export default FeedFetcher.fetchers;

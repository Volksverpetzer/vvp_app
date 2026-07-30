import Config from "#/constants/Config";
import WordPressAPI from "#/helpers/network/WordPressAPI";
import { getInstaFeedKey, getWpFeedKey } from "#/helpers/utils/feeds";
import type { FeedFetcherType, FeedType } from "#/types";

import { BlueskyFetcher } from "./BlueskyFetcher";
import { BotFetcher } from "./BotFetcher";
import { InstagramFetcher } from "./InstagramFetcher";
import { PodcastFetcher } from "./PodcastFetcher";
import { TikTokFetcher } from "./TikTokFetcher";
import { WordPressFetcher } from "./WordPressFetcher";
import { YouTubeFetcher } from "./YouTubeFetcher";

// One fetcher per *enabled* configured WordPress site (feed/search pair,
// search under "<key>:search") and per enabled Instagram account, keyed by
// getWpFeedKey() / getInstaFeedKey(). Only enabled entries are built — matching
// getEnabledFeeds(), which gates the home feed by the same flag — so disabled
// entries don't eagerly create unused API clients or crash module load on a
// misconfigured handle.
const perFeedFetcherMap: Record<string, FeedFetcherType<unknown>> = {};
for (const entry of (Config.feeds?.wp ?? []).filter((e) => !!e.enabled)) {
  const { feedFetcher, searchFetcher } = WordPressFetcher.createFetchers(
    WordPressAPI.create(entry.handle),
    entry.sourceName,
  );
  const key = getWpFeedKey(entry);
  perFeedFetcherMap[key] = feedFetcher;
  perFeedFetcherMap[`${key}:search`] = searchFetcher;
}
for (const entry of (Config.feeds?.insta ?? []).filter((e) => !!e.enabled)) {
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
    podcast: PodcastFetcher.feedFetcher,
    ...perFeedFetcherMap,
  };
}

export default FeedFetcher.fetchers;

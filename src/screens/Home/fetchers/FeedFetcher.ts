import Config from "#/constants/Config";
import WordPressAPI from "#/helpers/network/WordPressAPI";
import type { ContentSettingType, FeedFetcherType } from "#/types";

import { BlueskyFetcher } from "./BlueskyFetcher";
import { BotFetcher } from "./BotFetcher";
import { InstagramFetcher } from "./InstagramFetcher";
import { TikTokFetcher } from "./TikTokFetcher";
import { WordPressFetcher } from "./WordPressFetcher";
import { YouTubeFetcher } from "./YouTubeFetcher";

const wpFetchers = WordPressFetcher.createFetchers(WordPressAPI);
const wp2Fetchers = WordPressFetcher.createFetchers(
  WordPressAPI.create(Config.wp2Url ?? "https://www.pruefpunkt.org"),
  "Prüfpunkt",
);

/**
 * FeedFetcher is responsible for fetching data from different sources
 * and returning an array of Post objects, each containing claim details and metadata.
 */
export class FeedFetcher {
  static readonly fetchers: Record<
    keyof ContentSettingType,
    FeedFetcherType<unknown>
  > & {
    [key: string]: FeedFetcherType<unknown>;
  } = {
    wp: wpFetchers.feedFetcher,
    wpSearch: wpFetchers.searchFetcher,
    insta: InstagramFetcher.feedFetcher,
    reddit: InstagramFetcher.memeFetcher,
    yt: YouTubeFetcher.feedFetcher,
    tiktok: TikTokFetcher.feedFetcher,
    bsky: BlueskyFetcher.feedFetcher,
    bot: BotFetcher.feedFetcher,
    wp2: wp2Fetchers.feedFetcher,
    wp2Search: wp2Fetchers.searchFetcher,
  };
}

export default FeedFetcher.fetchers;

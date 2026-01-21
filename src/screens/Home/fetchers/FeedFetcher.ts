import { ContentSettingType, FeedFetcherType } from "../../../types";
import { BlueskyFetcher } from "./BlueskyFetcher";
import { BotFetcher } from "./BotFetcher";
import { InstagramFetcher } from "./InstagramFetcher";
import { TikTokFetcher } from "./TikTokFetcher";
import { WordPressFetcher } from "./WordPressFetcher";
import { YouTubeFetcher } from "./YouTubeFetcher";

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
    wp: WordPressFetcher.feedFetcher,
    wpSearch: WordPressFetcher.searchFetcher,
    insta: InstagramFetcher.feedFetcher,
    reddit: InstagramFetcher.memeFetcher,
    yt: YouTubeFetcher.feedFetcher,
    tiktok: TikTokFetcher.feedFetcher,
    bsky: BlueskyFetcher.feedFetcher,
    bot: BotFetcher.feedFetcher,
  };
}

export default FeedFetcher.fetchers;

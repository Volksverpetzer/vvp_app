import PodcastPost from "#/components/posts/PodcastPost";
import Post from "#/helpers/Post";
import API from "#/helpers/network/ServerAPI";
import type { PodcastEpisodeProperties } from "#/types";
import { FAV_TYPE_PODCAST } from "#/types";

import FetcherUtilities from "./FetcherUtilities";

/**
 * Maps a podcast episode to a feed Post (or null if it can't be shown). Shared
 * by the feed fetcher and MyFavs so a favorited episode rebuilds identically.
 */
export const mapPodcastEpisode = (
  episode: PodcastEpisodeProperties,
): Post<PodcastEpisodeProperties> | null => {
  if (!episode.audio_url) return null;
  const datetime = FetcherUtilities.toFeedDatetime(episode.published_at);
  if (!datetime) return null;
  return new Post<PodcastEpisodeProperties>(
    datetime,
    episode.id,
    PodcastPost,
    episode,
    FetcherUtilities.shareLink(episode.link, "Podcast Folge teilen"),
    1,
    episode.id,
    FAV_TYPE_PODCAST,
  );
};

export const PodcastFetcher = {
  feedFetcher: async ({ signal }: { signal?: AbortSignal } = {}) => {
    const episodes = await FetcherUtilities.safeFetch(
      () => API.getPodcastFeed(signal),
      "podcast",
    );
    return FetcherUtilities.mapItems(episodes, "podcast", mapPodcastEpisode);
  },
};

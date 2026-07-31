import PodcastPost from "#/components/posts/PodcastPost";
import Post from "#/helpers/Post";
import API from "#/helpers/network/ServerAPI";
import { isHttpsUrl } from "#/helpers/utils/networking";
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
  if (!episode.audio_url || !episode.published_at) return null;
  // Guard against unparseable dates: a throw here would propagate past
  // safeFetch and blank the whole combined feed, not just this episode.
  const parsedDate = new Date(episode.published_at);
  if (Number.isNaN(parsedDate.getTime())) return null;
  // Normalize to the naive-UTC ISO shape the other fetchers use so the
  // string-based datetime sort in FetcherUtilities stays consistent.
  const datetime = parsedDate.toISOString().replace("Z", "");
  return new Post<PodcastEpisodeProperties>(
    datetime,
    episode.id,
    PodcastPost,
    episode,
    isHttpsUrl(episode.link)
      ? [{ url: episode.link, title: "Podcast Folge teilen" }]
      : undefined,
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
    return episodes.flatMap((episode) => {
      const post = mapPodcastEpisode(episode);
      return post ? [post] : [];
    });
  },
};

import PodcastPost from "#/components/posts/PodcastPost";
import Post from "#/helpers/Post";
import API from "#/helpers/network/ServerAPI";
import { isHttpsUrl } from "#/helpers/utils/networking";
import type { PodcastEpisodeProperties } from "#/types";

import FetcherUtilities from "./FetcherUtilities";

export const PodcastFetcher = {
  feedFetcher: async ({ signal }: { signal?: AbortSignal } = {}) => {
    const episodes = await FetcherUtilities.safeFetch(
      () => API.getPodcastFeed(signal),
      "podcast",
    );
    return episodes.flatMap((episode) => {
      if (!episode.audio_url || !episode.published_at) return [];
      // Guard against unparseable dates: a throw here would propagate past
      // safeFetch and blank the whole combined feed, not just this episode.
      const parsedDate = new Date(episode.published_at);
      if (Number.isNaN(parsedDate.getTime())) return [];
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
      );
    });
  },
};

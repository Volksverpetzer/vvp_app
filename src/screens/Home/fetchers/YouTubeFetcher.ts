import YouTubePost from "#/components/posts/YouTubePost";
import Post from "#/helpers/Post";
import API from "#/helpers/network/ServerAPI";

import FetcherUtilities from "./FetcherUtilities";

export const YouTubeFetcher = {
  feedFetcher: async ({ signal }: { signal?: AbortSignal } = {}) => {
    const data = await FetcherUtilities.safeFetch(
      () => API.getYouTubeFeed(signal),
      "yt",
    );
    return FetcherUtilities.mapItems(data, "yt", (post) => {
      const datetime = FetcherUtilities.toFeedDatetime(
        post.snippet?.publishedAt,
      );
      if (!datetime) return null;
      return new Post(
        datetime,
        post.id,
        YouTubePost,
        post,
        FetcherUtilities.shareLink(
          `https://www.youtube.com/watch/${post.id}`,
          "YouTube Video teilen",
        ),
      );
    });
  },
};

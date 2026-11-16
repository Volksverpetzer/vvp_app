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
    return data.flatMap((post) => {
      // Skip malformed items instead of throwing on the missing snippet.
      const publishedAt = post?.snippet?.publishedAt;
      if (!post?.id || typeof publishedAt !== "string") return [];
      return [
        new Post(publishedAt.replace("Z", ""), post.id, YouTubePost, post, [
          {
            url: `https://www.youtube.com/watch/${post.id}`,
            title: "YouTube Video teilen",
          },
        ]),
      ];
    });
  },
};

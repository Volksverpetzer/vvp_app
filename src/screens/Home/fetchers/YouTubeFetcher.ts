import YTPost from "#/components/posts/YTPost";
import Post from "#/helpers/Post";
import API from "#/helpers/network/ServerAPI";

import FetcherUtilities from "./FetcherUtilities";

export const YouTubeFetcher = {
  feedFetcher: async () => {
    const data = await FetcherUtilities.safeFetch(
      () => API.getYouTubeFeed(),
      "yt",
    );
    return data.map(
      (post) =>
        new Post(
          post.snippet.publishedAt.replace("Z", ""),
          post.id,
          YTPost,
          post,
          [
            {
              url: `https://www.youtube.com/watch/${post.id}`,
              title: "YouTube Video teilen",
            },
          ],
        ),
    );
  },
};

import InstaPostCard from "#/components/posts/insta/InstaPostCard";
import Post from "#/helpers/Post";
import API from "#/helpers/network/ServerAPI";

import FetcherUtilities from "./FetcherUtilities";

export const InstagramFetcher = {
  /**
   * Fetches the feed from Instagram.
   * @returns An array of posts.
   */
  feedFetcher: async ({ signal }: { signal?: AbortSignal } = {}) => {
    const data = await FetcherUtilities.safeFetch(
      () => API.getInstaFeed(signal),
      "insta",
    );
    return data
      .filter(
        (post) =>
          post.media_type === "IMAGE" || post.media_type === "CAROUSEL_ALBUM",
      )
      .map(
        (post) =>
          new Post(
            post.timestamp,
            post.id,
            InstaPostCard,
            post,
            [{ url: post.permalink, title: "Instagram Post teilen" }],
            1,
            post.id,
            "insta",
          ),
      );
  },

  memeFetcher: async ({ signal }: { signal?: AbortSignal } = {}) => {
    const data = await FetcherUtilities.safeFetch(
      () => API.getInstaMemeFeed(signal),
      "meme",
    );
    return data
      .filter(
        (post) =>
          post.media_type === "IMAGE" || post.media_type === "CAROUSEL_ALBUM",
      )
      .map(
        (post) =>
          new Post(post.timestamp, post.id, InstaPostCard, post, [
            { url: post.permalink, title: "Instagram Post teilen" },
          ]),
      );
  },
};

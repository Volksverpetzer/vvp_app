import InstaPost from "#/components/posts/InstaPost";
import Post from "#/helpers/Post";
import API from "#/helpers/network/ServerAPI";

import FetcherUtilities from "./FetcherUtilities";

export const InstagramFetcher = {
  /**
   * Fetches the feed from Instagram.
   * @returns An array of posts.
   */
  feedFetcher: async () => {
    const data = await FetcherUtilities.safeFetch(
      () => API.getInstaFeed(),
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
            InstaPost,
            post,
            [{ url: post.permalink, title: "Instagram Post teilen" }],
            1,
            post.id,
            "insta",
          ),
      );
  },

  memeFetcher: async () => {
    const data = await FetcherUtilities.safeFetch(
      () => API.getInstaMemeFeed(),
      "meme",
    );
    return data
      .filter(
        (post) =>
          post.media_type === "IMAGE" || post.media_type === "CAROUSEL_ALBUM",
      )
      .map(
        (post) =>
          new Post(post.timestamp, post.id, InstaPost, post, [
            { url: post.permalink, title: "Instagram Post teilen" },
          ]),
      );
  },
};

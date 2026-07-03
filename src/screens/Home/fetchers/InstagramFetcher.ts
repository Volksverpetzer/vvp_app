import InstaPostCard from "#/components/posts/insta/InstaPostCard";
import Post from "#/helpers/Post";
import API from "#/helpers/network/ServerAPI";
import type { InstaPostProperties } from "#/types";

import FetcherUtilities from "./FetcherUtilities";

const displayablePosts = (data: InstaPostProperties[]) =>
  data.filter(
    (post) =>
      post.media_type === "IMAGE" || post.media_type === "CAROUSEL_ALBUM",
  );

export const InstagramFetcher = {
  /**
   * Creates a feed fetcher for the given Instagram account.
   * @param account - Instagram account name, e.g. "pruefpunkt".
   * @returns A fetcher returning an array of posts.
   */
  createFeedFetcher(account: string) {
    return async ({ signal }: { signal?: AbortSignal } = {}) => {
      const data = await FetcherUtilities.safeFetch(
        () => API.getInstaFeed(account, signal),
        `insta:${account}`,
      );
      return displayablePosts(data).map(
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
    };
  },

  memeFetcher: async ({ signal }: { signal?: AbortSignal } = {}) => {
    const data = await FetcherUtilities.safeFetch(
      () => API.getInstaMemeFeed(signal),
      "meme",
    );
    return displayablePosts(data).map(
      (post) =>
        new Post(post.timestamp, post.id, InstaPostCard, post, [
          { url: post.permalink, title: "Instagram Post teilen" },
        ]),
    );
  },
};

import InstaPostCard from "#/components/posts/insta/InstaPostCard";
import Post from "#/helpers/Post";
import API from "#/helpers/network/ServerAPI";
import type { InstaPostProperties } from "#/types";

import FetcherUtilities from "./FetcherUtilities";

// Videos and reels aren't shown; filtered before mapping so they don't count
// as skipped items.
const displayablePosts = (data: InstaPostProperties[]) =>
  data.filter(
    (post) =>
      post?.media_type === "IMAGE" || post?.media_type === "CAROUSEL_ALBUM",
  );

// The meme feed is registered under the historic "reddit" key in FeedFetcher;
// log under that key so failures match the feed name.
const MEME_FEED_KEY = "reddit";

const share = (post: InstaPostProperties) =>
  FetcherUtilities.shareLink(post.permalink, "Instagram Post teilen");

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
      return FetcherUtilities.mapItems(
        displayablePosts(data),
        `insta:${account}`,
        (post) => {
          const datetime = FetcherUtilities.toFeedDatetime(post.timestamp);
          if (!datetime) return null;
          return new Post(
            datetime,
            post.id,
            InstaPostCard,
            post,
            share(post),
            1,
            post.id,
            "insta",
          );
        },
      );
    };
  },

  memeFetcher: async ({ signal }: { signal?: AbortSignal } = {}) => {
    const data = await FetcherUtilities.safeFetch(
      () => API.getInstaMemeFeed(signal),
      MEME_FEED_KEY,
    );
    return FetcherUtilities.mapItems(
      displayablePosts(data),
      MEME_FEED_KEY,
      (post) => {
        const datetime = FetcherUtilities.toFeedDatetime(post.timestamp);
        if (!datetime) return null;
        return new Post(datetime, post.id, InstaPostCard, post, share(post));
      },
    );
  },
};

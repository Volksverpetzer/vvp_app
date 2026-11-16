import TiktokPost from "#/components/posts/TiktokPost";
import Post from "#/helpers/Post";
import API from "#/helpers/network/ServerAPI";

import FetcherUtilities from "./FetcherUtilities";

export const TikTokFetcher = {
  /**
   * Fetches the feed from TikTok.
   * @returns An array of posts.
   */
  feedFetcher: async ({ signal }: { signal?: AbortSignal } = {}) => {
    const data = await FetcherUtilities.safeFetch(
      () => API.getTikTokFeed(signal),
      "tiktok",
    );
    return FetcherUtilities.mapItems(data, "tiktok", (post) => {
      const datetime = FetcherUtilities.toFeedDatetime(post.create_time * 1000);
      if (!datetime) return null;
      const shareUrl =
        typeof post.share_url === "string"
          ? post.share_url.split("?")[0]
          : undefined;
      return new Post(
        datetime,
        post.id,
        TiktokPost,
        post,
        FetcherUtilities.shareLink(shareUrl, "TikTok Video teilen"),
      );
    });
  },
};

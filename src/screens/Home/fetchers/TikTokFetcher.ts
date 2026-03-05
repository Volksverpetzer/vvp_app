import TiktokPost from "#/components/posts/TiktokPost";
import Post from "#/helpers/Post";
import API from "#/helpers/network/ServerAPI";
import { isHttpsUrl } from "#/helpers/utils/networking";

import FetcherUtilities from "./FetcherUtilities";

export const TikTokFetcher = {
  /**
   * Fetches the feed from TikTok.
   * @returns An array of posts.
   */
  feedFetcher: async () => {
    const data = await FetcherUtilities.safeFetch(
      () => API.getTikTokFeed(),
      "tiktok",
    );
    return data.map((post) => {
      const shareUrl = post.share_url.split("?")[0];
      const shareable = isHttpsUrl(shareUrl)
        ? [{ url: shareUrl, title: "TikTok Video teilen" }]
        : undefined;
      return new Post(
        new Date(post.create_time * 1000).toISOString().replace(".000Z", ""),
        post.id,
        TiktokPost,
        post,
        shareable,
      );
    });
  },
};

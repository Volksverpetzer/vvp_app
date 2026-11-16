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
  feedFetcher: async ({ signal }: { signal?: AbortSignal } = {}) => {
    const data = await FetcherUtilities.safeFetch(
      () => API.getTikTokFeed(signal),
      "tiktok",
    );
    return data.flatMap((post) => {
      // Skip items without a usable timestamp: new Date(NaN).toISOString()
      // throws and would take the whole TikTok feed down with it.
      const created = new Date(post?.create_time * 1000);
      if (!post?.id || Number.isNaN(created.getTime())) return [];
      const shareUrl =
        typeof post.share_url === "string"
          ? post.share_url.split("?")[0]
          : undefined;
      const shareable =
        shareUrl && isHttpsUrl(shareUrl)
          ? [{ url: shareUrl, title: "TikTok Video teilen" }]
          : undefined;
      return [
        new Post(
          created.toISOString().replace(".000Z", ""),
          post.id,
          TiktokPost,
          post,
          shareable,
        ),
      ];
    });
  },
};

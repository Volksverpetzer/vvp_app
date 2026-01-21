import TiktokPost from "../../../components/posts/TiktokPost";
import API from "../../../helpers/Networking/ServerAPI";
import Post from "../../../helpers/Post";
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
    return data.map(
      (post) =>
        new Post(
          new Date(post.create_time * 1000).toISOString().replace(".000Z", ""),
          post.id,
          TiktokPost,
          post,
          [{ url: post.share_url.split("?")[0], title: "TikTok Video teilen" }],
        ),
    );
  },
};

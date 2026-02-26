import { FeedViewPost } from "@atproto/api/dist/client/types/app/bsky/feed/defs";

import BlueskyPost, {
  BlueskyPostProperties,
} from "#/components/posts/BlueskyPost";
import Config from "#/constants/Config";
import Post from "#/helpers/Post";
import API from "#/helpers/network/ServerAPI";

import FetcherUtilities from "./FetcherUtilities";

export const BotFetcher = {
  /**
   * Fetches the feed from Bluesky.
   * @returns An array of posts.
   */
  feedFetcher: async ({ signal }: { signal?: AbortSignal } = {}) => {
    const feed = await FetcherUtilities.safeFetch(
      () => API.getBotFeed(signal),
      "bot",
    );
    const postsByUri: {
      [uri: string]: {
        post: FeedViewPost;
        uri: string;
        replies: FeedViewPost[];
      };
    } = {};
    const allReplies = new Set<string>();

    for (const item of feed) {
      const post = item;
      const uri = item.post.uri;
      postsByUri[uri] = {
        post,
        uri,
        replies: [],
      };
    }

    for (const item of feed) {
      const uri = item.post.uri;
      const replyParentUri =
        item.reply?.parent && "uri" in item.reply.parent
          ? item.reply.parent.uri
          : undefined;
      if (replyParentUri && postsByUri[replyParentUri]) {
        postsByUri[replyParentUri].replies.push(postsByUri[uri].post);
        allReplies.add(uri);
      }
    }

    const topLevelPosts = Object.values(postsByUri).filter((post) => {
      return (
        !allReplies.has(post.uri) &&
        // don't show embedded posts which SHOULD be the ones
        // that contain an external link to our own site
        // 3rd party links SHOULD always be in the thread as replies
        post.post.post?.embed === null &&
        // make sure it's us that is posting here
        post.post.post.author.handle === Config.feeds.bot.handle &&
        post.post.reply === null
      );
    });

    return topLevelPosts.map((item) => {
      const postId = item.uri.split("/app.bsky.feed.post/")[1];
      const handle = item.post.post.author.handle;
      const url = `https://bsky.app/profile/${handle}/post/${postId}`;
      return new Post<BlueskyPostProperties>(
        (item.post.post.record.created_at as string).replace("Z", ""),
        item.uri,
        BlueskyPost,
        item,
        [{ url: url, title: "Bot Feed Post teilen" }],
      );
    });
  },
};

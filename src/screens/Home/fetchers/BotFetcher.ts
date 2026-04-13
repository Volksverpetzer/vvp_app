import type { FeedViewPost } from "@atproto/api/dist/client/types/app/bsky/feed/defs";

import BlueskyPostCard from "#/components/posts/BlueskyPostCard";
import Config from "#/constants/Config";
import Post from "#/helpers/Post";
import API from "#/helpers/network/ServerAPI";
import { hasCreatedAt, hasUri } from "#/helpers/utils/typePredicates";
import type { BlueskyPostProperties, HttpsUrl } from "#/types";

import FetcherUtilities from "./FetcherUtilities";

export const BotFetcher = {
  /**
   * Fetches the feed from Bluesky.
   * @returns An array of posts.
   */
  feedFetcher: async () => {
    const feed = await FetcherUtilities.safeFetch(
      () => API.getBotFeed(),
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
      const replyParentUri = hasUri(item.reply?.parent)
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

    return topLevelPosts.flatMap((item) => {
      if (!hasCreatedAt(item.post.post.record)) return [];
      const postId = item.uri.split("/app.bsky.feed.post/")[1];
      const handle = item.post.post.author.handle;
      const url =
        `https://bsky.app/profile/${handle}/post/${postId}` satisfies HttpsUrl;
      const createdAt = item.post.post.record.created_at;
      return new Post<BlueskyPostProperties>(
        createdAt.replace("Z", ""),
        item.uri,
        BlueskyPostCard,
        item,
        [{ url: url, title: "Bot Feed Post teilen" }],
      );
    });
  },
};

import type { AppBskyFeedDefs } from "@atproto/api";

import BlueskyPostCard from "#/components/posts/bsky/BlueskyPostCard";
import Config from "#/constants/Config";
import Post from "#/helpers/Post";
import API from "#/helpers/network/ServerAPI";
import { hasCreatedAt, hasUri } from "#/helpers/utils/typePredicates";
import type { BlueskyPostProperties } from "#/types";

import FetcherUtilities from "./FetcherUtilities";

export const BotFetcher = {
  /**
   * Fetches the feed from Bluesky.
   * @returns An array of posts.
   */
  feedFetcher: async ({ signal }: { signal?: AbortSignal } = {}) => {
    const rawFeed = await FetcherUtilities.safeFetch(
      () => API.getBotFeed(signal),
      "bot",
    );
    // The threading below indexes items by post.uri; drop anything without
    // one instead of throwing on it.
    const feed = rawFeed.filter((item) => typeof item?.post?.uri === "string");
    const postsByUri: {
      [uri: string]: {
        post: AppBskyFeedDefs.FeedViewPost;
        uri: string;
        replies: AppBskyFeedDefs.FeedViewPost[];
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
        post.post.post.author?.handle === Config.feeds.bot.handle &&
        post.post.reply === null
      );
    });

    return FetcherUtilities.mapItems(topLevelPosts, "bot", (item) => {
      if (!hasCreatedAt(item.post.post.record)) return null;
      const datetime = FetcherUtilities.toFeedDatetime(
        item.post.post.record.created_at,
      );
      if (!datetime) return null;
      const postId = item.uri.split("/app.bsky.feed.post/")[1];
      const handle = item.post.post.author.handle;
      const url = `https://bsky.app/profile/${handle}/post/${postId}`;
      return new Post<BlueskyPostProperties>(
        datetime,
        item.uri,
        BlueskyPostCard,
        item,
        FetcherUtilities.shareLink(url, "Bot Feed Post teilen"),
      );
    });
  },
};

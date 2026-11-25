import type { AppBskyFeedDefs } from "@atproto/api";

import BlueskyPostCard from "#/components/posts/bsky/BlueskyPostCard";
import Config from "#/constants/Config";
import Post from "#/helpers/Post";
import API from "#/helpers/network/ServerAPI";
import { getBskyPostUrl } from "#/helpers/utils/bskyPost";
import { hasCreatedAt, hasUri } from "#/helpers/utils/typePredicates";
import type { BlueskyPostProperties } from "#/types";

import FetcherUtilities from "./FetcherUtilities";

export const BlueskyFetcher = {
  /**
   * Fetches the feed from Bluesky.
   * @returns An array of posts.
   */
  feedFetcher: async ({ signal }: { signal?: AbortSignal } = {}) => {
    const rawFeed = await FetcherUtilities.safeFetch(
      () => API.getBskyFeed(signal),
      "bsky",
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
      // Current item uri
      const itemUri = item.post.uri;

      // Get uri of the parent post if this is a reply
      const replyParentUri = hasUri(item.reply?.parent)
        ? item.reply.parent.uri
        : undefined;

      // Check if it's a reply and the parent exists in our posts
      if (replyParentUri && postsByUri[replyParentUri]) {
        // Add it to the parent's replies
        postsByUri[replyParentUri].replies.push(postsByUri[itemUri].post);

        // If it already has replies in postsByUri[itemUri].replies
        for (const reply of postsByUri[itemUri].replies) {
          // Also add the child replies to the parent
          postsByUri[replyParentUri].replies.push(reply);
        }

        // Add to allReplies set
        allReplies.add(itemUri);
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
        post.post.post.author?.handle === Config.feeds.bsky.handle &&
        post.post.reply === null
      );
    });

    return FetcherUtilities.mapItems(topLevelPosts, "bsky", (item) => {
      if (!hasCreatedAt(item.post.post.record)) return null;
      const datetime = FetcherUtilities.toFeedDatetime(
        item.post.post.record.created_at,
      );
      if (!datetime) return null;
      const url = getBskyPostUrl(item.post.post.author.handle, item.uri);
      return new Post<BlueskyPostProperties>(
        datetime,
        item.uri,
        BlueskyPostCard,
        item,
        FetcherUtilities.shareLink(url, "Bluesky Post teilen"),
      );
    });
  },
};

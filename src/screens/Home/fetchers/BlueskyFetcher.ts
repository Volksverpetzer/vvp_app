import type { FeedViewPost } from "@atproto/api/dist/client/types/app/bsky/feed/defs";

import BlueskyPost from "#/components/posts/BlueskyPost";
import Config from "#/constants/Config";
import Post from "#/helpers/Post";
import API from "#/helpers/network/ServerAPI";
import { hasCreatedAt, hasUri } from "#/helpers/utils/typePredicates";
import type { BlueskyPostProperties, HttpsUrl } from "#/types";

import FetcherUtilities from "./FetcherUtilities";

export const BlueskyFetcher = {
  /**
   * Fetches the feed from Bluesky.
   * @returns An array of posts.
   */
  feedFetcher: async () => {
    const feed = await FetcherUtilities.safeFetch(
      () => API.getBskyFeed(),
      "bsky",
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
        post.post.post.author.handle === Config.feeds.bsky.handle &&
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
        BlueskyPost,
        item,
        [{ url: url, title: "Bluesky Post teilen" }],
      );
    });
  },
};

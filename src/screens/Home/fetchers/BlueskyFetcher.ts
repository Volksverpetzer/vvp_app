import { FeedViewPost } from "@atproto/api/dist/client/types/app/bsky/feed/defs";

import BlueskyPost, {
  BlueskyPostProperties,
} from "#/components/posts/BlueskyPost";
import Config from "#/constants/Config";
import Post from "#/helpers/Post";
import API from "#/helpers/network/ServerAPI";

import FetcherUtilities from "./FetcherUtilities";

export const BlueskyFetcher = {
  /**
   * Fetches the feed from Bluesky.
   * @returns An array of posts.
   */
  feedFetcher: async ({ signal }: { signal?: AbortSignal } = {}) => {
    const feed = await FetcherUtilities.safeFetch(
      () => API.getBskyFeed(signal),
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
      // @ts-ignore
      const replyParentUri = item.reply?.parent?.uri;

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

    return topLevelPosts.map((item) => {
      const postId = item.uri.split("/app.bsky.feed.post/")[1];
      const handle = item.post.post.author.handle;
      const url = `https://bsky.app/profile/${handle}/post/${postId}`;
      return new Post<BlueskyPostProperties>(
        (item.post.post.record.created_at as string).replace("Z", ""),
        item.uri,
        BlueskyPost,
        item,
        [{ url: url, title: "Bluesky Post teilen" }],
      );
    });
  },
};

import type { HttpsUrl } from "#/types";

/**
 * The record key of a Bluesky post, i.e. the part of its AT-protocol URI
 * (`at://did:.../app.bsky.feed.post/<postId>`) after the collection name.
 */
export const getBskyPostId = (atUri: string): string =>
  atUri.split("/app.bsky.feed.post/")[1];

/**
 * The public web URL of a Bluesky post
 * (`https://bsky.app/profile/<handle>/post/<postId>`), built from the
 * author's handle and the post's AT-protocol URI. Use it wherever a post
 * needs a real https link, e.g. as the page URL of analytics events — the
 * `at://` URI is not a page Plausible (or a browser) can resolve.
 */
export const getBskyPostUrl = (handle: string, atUri: string): HttpsUrl =>
  `https://bsky.app/profile/${handle}/post/${getBskyPostId(atUri)}`;

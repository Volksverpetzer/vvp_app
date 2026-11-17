import { isHttpsUrl } from "#/helpers/utils/networking";
import type { Post, SafeFetchFunction, ShareableType } from "#/types";

// A trailing timezone designator: Z, +02:00 or +0200.
const TIMEZONE_SUFFIX = /(Z|[+-]\d{2}:?\d{2})$/i;

// Marks an error safeFetch already logged, so fetchAndProcessPosts counts the
// failed feed without logging it a second time.
const FEED_FETCH_ERROR = "FeedFetchError";

const feedFetchError = (fetcher: string, cause?: unknown) =>
  Object.assign(new Error(`Fetch failed in ${fetcher}`), {
    name: FEED_FETCH_ERROR,
    cause,
  });

const FetcherUtilities = {
  isAbortError(error: unknown): boolean {
    if (!error || typeof error !== "object") return false;
    const maybeError = error as { name?: string; code?: string };
    return (
      maybeError.name === "AbortError" ||
      maybeError.name === "CanceledError" ||
      maybeError.code === "ERR_CANCELED"
    );
  },

  /**
   * Safely fetches data from a fetch function. Every feed fetcher goes
   * through this, so all sources treat errors the same way.
   * @param fetchFunction The fetch function to use.
   * @param fetcher The name of the fetcher, used in log messages.
   * @returns The fetched data.
   * @throws The abort error for an aborted request, so the caller can keep
   *   the posts it already has. Any other failure, or a response that isn't
   *   a list, is logged and rethrown as a FeedFetchError, so
   *   fetchAndProcessPosts can tell a failed feed apart from an empty one.
   */
  async safeFetch<T>(
    fetchFunction: SafeFetchFunction<T>,
    fetcher: string,
  ): Promise<T[]> {
    let data: T[];
    try {
      data = await fetchFunction();
    } catch (error) {
      if (FetcherUtilities.isAbortError(error)) throw error;
      console.error(`Fetch error in ${fetcher}:`, error);
      throw feedFetchError(fetcher, error);
    }
    if (!Array.isArray(data)) {
      console.error(`Fetch error in ${fetcher}: response is not a list`);
      throw feedFetchError(fetcher);
    }
    return data;
  },

  isFeedFetchError(error: unknown): boolean {
    return (
      !!error &&
      typeof error === "object" &&
      (error as { name?: string }).name === FEED_FETCH_ERROR
    );
  },

  /**
   * Maps raw feed items to posts one by one. An item whose mapping throws
   * or returns nothing, or a post without a non-empty id or datetime, is
   * skipped and
   * logged, so one malformed item never drops the rest of its feed.
   * @param items The raw items from the API.
   * @param fetcher The name of the fetcher, used in log messages.
   * @param map Builds the post for one item, or returns null to skip it.
   */
  mapItems<T, R extends Post<unknown>>(
    items: T[],
    fetcher: string,
    map: (item: T, index: number) => R | null | undefined,
  ): R[] {
    const posts: R[] = [];
    let skipped = 0;
    items.forEach((item, index) => {
      try {
        const post = map(item, index);
        // Runtime data can carry null/"" despite the types; those posts have
        // no usable identity (dedupe, list keys) or sort position.
        const hasId =
          post?.id !== undefined && post.id !== null && post.id !== "";
        const hasDatetime =
          typeof post?.datetime === "string" && post.datetime !== "";
        if (hasId && hasDatetime) {
          posts.push(post);
        } else {
          skipped++;
        }
      } catch (error) {
        skipped++;
        console.warn(`Skipping malformed item in ${fetcher}:`, error);
      }
    });
    if (skipped > 0) {
      console.warn(`Skipped ${skipped} unusable item(s) in ${fetcher}`);
    }
    return posts;
  },

  /**
   * Normalizes a timestamp to the one datetime format all feed posts use:
   * UTC without a suffix or milliseconds, e.g. "2026-11-01T10:00:00". The
   * feed is sorted by comparing these strings, so every source must use it.
   * A string without a timezone (WordPress date_gmt) is read as UTC.
   * @returns The normalized datetime, or undefined if it can't be parsed.
   */
  toFeedDatetime(value: string | number | Date | undefined | null) {
    if (value === undefined || value === null || value === "") return;
    let date: Date;
    if (value instanceof Date || typeof value === "number") {
      date = new Date(value);
    } else if (typeof value === "string") {
      const withZone = TIMEZONE_SUFFIX.test(value)
        ? // Hermes only parses offsets with a colon (+02:00, not +0200).
          value.replace(/([+-]\d{2})(\d{2})$/, "$1:$2")
        : `${value}Z`;
      date = new Date(withZone);
    } else {
      return;
    }
    if (Number.isNaN(date.getTime())) return;
    return date.toISOString().replace(/\.\d{3}Z$/, "");
  },

  /**
   * The share entry for a post, or undefined when the URL isn't https.
   */
  shareLink(url: unknown, title: string): ShareableType[] | undefined {
    return typeof url === "string" && isHttpsUrl(url)
      ? [{ url, title }]
      : undefined;
  },

  /**
   * Sorts posts by datetime.
   * @param a The first post to compare.
   * @param b The second post to compare.
   * @returns A negative number if the first post is older than the second post, a positive number if the first post is newer than the second post, or zero if the posts are equal.
   */
  sortByDatetime(a: Post<unknown>, b: Post<unknown>): number {
    return b.datetime?.localeCompare(a.datetime);
  },

  /**
   * Sorts posts by priority.
   * @param a The first post to compare.
   * @param b The second post to compare.
   * @returns The difference in priority between the two posts, or the result of sortByDatetime if the priorities are equal.
   */
  sortByPriority(a: Post<unknown>, b: Post<unknown>): number {
    return b.priority - a.priority || FetcherUtilities.sortByDatetime(a, b);
  },

  /**
   * Removes duplicate posts from an array of posts.
   * @param _posts The array of posts to remove duplicates from.
   * @returns The array of posts with duplicates removed.
   */
  removeDuplicates(_posts: Post<unknown>[]): Post<unknown>[] {
    const ids = new Set();
    return _posts.filter((post: Post<unknown>) => {
      if (post?.id === undefined || post.datetime === undefined) {
        console.warn("Post without id or datetime", post);
        return false;
      }
      const id = post.id;
      return ids.has(id) ? false : ids.add(id);
    });
  },

  async fetchAndProcessPosts(
    fetchers: {
      fetcher: (
        properties: Record<string, unknown>,
      ) => Promise<Post<unknown>[]>;
      props?: Record<string, unknown>;
      /** Feed key, used in log messages. */
      name?: string;
    }[],
    fetcherProperties: {
      page?: number;
      param?: string;
      signal?: AbortSignal;
    } = {},
    oldPosts: Post<unknown>[] = [],
    options: {
      prioSort?: boolean;
      cutoffDate?: boolean;
      /**
       * Receives the posts the cutoff hid, so a caller that pages can show
       * them on the next load-more instead of losing them.
       */
      onCutoff?: (dropped: Post<unknown>[]) => void;
      /**
       * Called when a feed failed to load (or processing failed), so a
       * caller can tell "nothing new" apart from "couldn't load". The
       * returned list then only holds what the other feeds delivered.
       */
      onFetchError?: () => void;
    } = {},
  ): Promise<Post<unknown>[]> {
    try {
      // Isolate each fetcher: one feed throwing (e.g. a malformed item in
      // its mapping) must only drop that feed, not blank the whole feed.
      // Aborts still propagate so the caller keeps its old posts.
      let failed = false;
      const data = await Promise.all(
        fetchers.map(async (item, index) => {
          const itemProperties = { ...item.props, ...fetcherProperties };
          try {
            return await item.fetcher(itemProperties);
          } catch (error) {
            if (FetcherUtilities.isAbortError(error)) throw error;
            failed = true;
            if (!FetcherUtilities.isFeedFetchError(error)) {
              console.error(
                `Error in feed fetcher ${item.name ?? `#${index}`}:`,
                error,
              );
            }
            return [];
          }
        }),
      );
      if (failed) options.onFetchError?.();

      let allPosts = data.flat();

      if (options.cutoffDate !== false) {
        const sortedFeeds = data
          .filter((_posts) => _posts.sort !== undefined && _posts.length > 0)
          .map((_posts) => _posts.sort(FetcherUtilities.sortByDatetime));

        const minDate =
          sortedFeeds
            .map((_posts) => _posts[_posts.length - 1])
            .sort(FetcherUtilities.sortByDatetime)[0]?.datetime ??
          "1970-01-01T00:00:00+0000";

        // Always keep each feed's newest post so that low-frequency feeds
        // (e.g. Prüfpunkt) are not entirely hidden by the cutoff of busier feeds.
        const newestPerFeed = new Set(sortedFeeds.map((_posts) => _posts[0]));

        const kept: Post<unknown>[] = [];
        const dropped: Post<unknown>[] = [];
        for (const post of allPosts) {
          if (
            newestPerFeed.has(post) ||
            post.datetime?.localeCompare(minDate) >= 0
          ) {
            kept.push(post);
          } else {
            dropped.push(post);
          }
        }
        allPosts = kept;
        options.onCutoff?.(dropped);
      }

      return FetcherUtilities.removeDuplicates([...allPosts, ...oldPosts]).sort(
        options.prioSort
          ? FetcherUtilities.sortByPriority
          : FetcherUtilities.sortByDatetime,
      );
    } catch (error) {
      if (FetcherUtilities.isAbortError(error)) {
        return oldPosts;
      }
      console.error("Error processing posts:", error);
      options.onFetchError?.();
      // Keep what is already on screen rather than wiping it.
      return oldPosts;
    }
  },
};

export default FetcherUtilities;

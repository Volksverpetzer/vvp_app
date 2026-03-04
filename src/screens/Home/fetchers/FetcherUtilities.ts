import type { Post, SafeFetchFunction } from "#/types";

const FetcherUtilities = {
  /**
   * Safely fetches data from a fetch function.
   * @param fetchFunction The fetch function to use.
   * @param fetcher The name of the fetcher.
   * @returns The fetched data, or an empty array if an error occurs.
   */
  async safeFetch<T>(
    fetchFunction: SafeFetchFunction<T>,
    fetcher: string,
  ): Promise<T[]> {
    try {
      return await fetchFunction();
    } catch (error) {
      console.error("Fetch error in " + fetcher + " :", error);
      return [];
    }
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
      fetcher: (properties: object) => Promise<Post<unknown>[]>;
      props?: object;
    }[],
    fetcherProperties: { page?: number; param?: string } = {},
    oldPosts: Post<unknown>[] = [],
    options: { prioSort?: boolean; cutoffDate?: boolean } = {},
  ): Promise<Post<unknown>[]> {
    try {
      const data = await Promise.all(
        fetchers.map((item) => {
          const itemProperties = { ...item.props, ...fetcherProperties };
          return item.fetcher(itemProperties);
        }),
      );

      let allPosts = data.flat();

      if (options.cutoffDate !== false) {
        const minDate =
          data
            .map((_posts: Post<unknown>[]): Post<unknown> | undefined => {
              if (_posts.sort === undefined) return undefined;
              return _posts.sort(FetcherUtilities.sortByDatetime)[
                _posts.length - 1
              ];
            })
            .sort(FetcherUtilities.sortByDatetime)[0]?.datetime ??
          "1970-01-01T00:00:00+0000";

        allPosts = allPosts.filter(
          (post) => post.datetime?.localeCompare(minDate) >= 0,
        );
      }

      return FetcherUtilities.removeDuplicates([...allPosts, ...oldPosts]).sort(
        options.prioSort
          ? FetcherUtilities.sortByPriority
          : FetcherUtilities.sortByDatetime,
      );
    } catch (error) {
      console.error("Error processing posts:", error);
      return [];
    }
  },
};

export default FetcherUtilities;

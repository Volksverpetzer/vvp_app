import type { FeedFetcherProperties } from "#/screens/Home/components/Feed";
import type { Post } from "#/types";

export type FeedFetcherType<T> = (
  properties: FeedFetcherProperties,
  url?: string,
) => Promise<Post<T>[]>;

export type SafeFetchFunction<T> = () => Promise<T[]>;

import Post from "../helpers/Post";
import { FeedFetcherProperties } from "../screens/Home/components/Feed";

export type FeedFetcherType<T> = (
  properties: FeedFetcherProperties,
  url?: string,
) => Promise<Post<T>[]>;

export type SafeFetchFunction<T> = () => Promise<T[]>;

import { FeedType, FeedsConfig } from "#/types";

/**
 * Liefert die aktivierten Feed‑Keys als `FeedType[]`.
 */
export const getEnabledFeeds = (feeds: FeedsConfig): FeedType[] => {
  return Object.entries(feeds)
    .filter(([, entry]) => !!entry?.enabled)
    .map(([key]) => key as FeedType);
};

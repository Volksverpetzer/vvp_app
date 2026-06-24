import { useCallback, useEffect, useState } from "react";

import Config from "#/constants/Config";
import type { HttpsUrl, ShareableType } from "#/types";

/**
 * Sums an engagement metric (favorites, shares, …) across a list of shareable
 * URLs. Shared by FavCounter and ShareCounter, which otherwise duplicated the
 * same fetch-and-sum loop and `Config.enableEngagement` gate.
 *
 * @param shareable The items whose counts should be summed
 * @param fetcher Engagement getter for a single URL (e.g. getFavs, getShares)
 * @param enabled Skip fetching when false (e.g. ShareCounter's hidden count)
 */
export const useEngagementCount = (
  shareable: ShareableType[],
  fetcher: (url?: HttpsUrl) => Promise<number | undefined>,
  enabled = true,
) => {
  const [count, setCount] = useState(0);

  const loadCount = useCallback(async () => {
    let total = 0;
    for (const item of shareable) {
      total += (await fetcher(item.url)) ?? 0;
    }
    setCount(total);
  }, [shareable, fetcher]);

  useEffect(() => {
    if (Config.enableEngagement && enabled) loadCount();
  }, [loadCount, enabled]);

  return count;
};

export default useEngagementCount;

import { useEffect, useState } from "react";

import WordPressAPI from "#/helpers/network/WordPressAPI";
import type { ImageCredit } from "#/types";

/**
 * Fetches the Image Source Control credit for a media attachment.
 * Pass undefined for either argument to skip fetching.
 */
export const useImageCredit = (
  mediaId?: string,
  articleUrl?: string,
): ImageCredit | undefined => {
  const [credit, setCredit] = useState<ImageCredit | undefined>();

  useEffect(() => {
    if (!mediaId || !articleUrl) return;
    const controller = new AbortController();

    WordPressAPI.getMediaCredit(mediaId, articleUrl, controller.signal)
      .then((_credit) => {
        if (!controller.signal.aborted) setCredit(_credit);
      })
      .catch(() => {
        // The image just renders without a credit badge.
      });

    return () => {
      controller.abort();
    };
  }, [mediaId, articleUrl]);

  return credit;
};

import { useEffect, useState } from "react";

import WordPressAPI from "#/helpers/network/WordPressAPI";
import type { HttpsUrl, ImageCredit } from "#/types";

/**
 * Fetches the Image Source Control credit for a media attachment.
 * Pass undefined for either argument to skip fetching.
 */
export const useImageCredit = (
  mediaId?: string,
  articleUrl?: HttpsUrl,
): ImageCredit | undefined => {
  const [credit, setCredit] = useState<ImageCredit | undefined>();

  useEffect(() => {
    // Reset first so a changed/removed input can't leave a previous image's
    // credit badge showing for the wrong image.
    setCredit(undefined);
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

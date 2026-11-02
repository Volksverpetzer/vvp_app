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
    // Batched and shared with other images, so the request itself isn't
    // cancelled — only this image stops listening for its result.
    let cancelled = false;

    WordPressAPI.getMediaCredit(mediaId, articleUrl)
      .then((_credit) => {
        if (!cancelled) setCredit(_credit);
      })
      .catch(() => {
        // The image just renders without a credit badge.
      });

    return () => {
      cancelled = true;
    };
  }, [mediaId, articleUrl]);

  return credit;
};

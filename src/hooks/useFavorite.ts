import { useEffect, useRef, useState } from "react";

import { Achievements } from "#/helpers/Achievements";
import FavoritesStore from "#/helpers/Stores/FavoritesStore";
import { registerFav } from "#/helpers/network/Engagement";
import { updateBadgeState } from "#/helpers/provider/BadgeProvider";
import type { FavPayload, FaveableType, HttpsUrl } from "#/types";
import { FAV_TYPE_ARTICLE, FAV_TYPE_INSTA, FAV_TYPE_PODCAST } from "#/types";

/**
 * Encapsulates the "is this content saved as a favorite" state and the toggle behavior
 * shared between FavCounter and the native article toolbar.
 *
 * @param contentFavIdentifier Local-storage identifier for the favorite (e.g. slug)
 * @param contentType The type of content being saved as a favorite
 * @param registerUrl URL reported to the engagement backend when a favorite is added
 * @param favPayload Instagram post to snapshot into the favorite, so it can be
 *   rebuilt without the account-scoped by-id proxy
 */
export const useFavorite = (
  contentFavIdentifier?: string,
  contentType?: FaveableType,
  registerUrl?: HttpsUrl,
  favPayload?: FavPayload,
) => {
  const [isFav, setIsFav] = useState(false);
  // Mirrors isFav for toggleFavorite, so a tap that lands before the re-render
  // still sees the latest value instead of a stale closure.
  const isFavRef = useRef(false);
  // Drops taps while a toggle is still being written, so a quick double tap
  // can't leave the icon out of sync with what is stored.
  const isTogglingRef = useRef(false);

  const updateIsFav = (value: boolean) => {
    isFavRef.current = value;
    setIsFav(value);
  };

  useEffect(() => {
    if (contentFavIdentifier) {
      FavoritesStore.isFavorite(contentFavIdentifier).then(updateIsFav);
    }
  }, [contentFavIdentifier]);

  const toggleFavorite = async () => {
    if (!contentFavIdentifier || isTogglingRef.current) return;

    if (isFavRef.current) {
      isTogglingRef.current = true;
      try {
        await FavoritesStore.removeFavorite(contentFavIdentifier);
        updateIsFav(false);
      } finally {
        isTogglingRef.current = false;
      }
    } else {
      // A favorite without a content type would be persisted as an invalid
      // StoredFav (contentType is required) and fail isValidStoredFav, which
      // can discard the entire favorites set on the next read. Skip the add
      // when the type is missing rather than corrupting storage.
      if (!contentType) return;
      isTogglingRef.current = true;
      try {
        updateIsFav(true);
        Achievements.setAchievementValue("favorite");
        // Articles are re-fetched by URL, so persist the source URL to reload
        // them from the right site (e.g. a secondary Prüfpunkt feed). Instagram
        // posts can't be re-fetched by id across accounts, so snapshot the
        // post instead.
        await FavoritesStore.addFavorite(
          contentFavIdentifier,
          contentType,
          contentType === FAV_TYPE_ARTICLE ? registerUrl : undefined,
          contentType === FAV_TYPE_INSTA || contentType === FAV_TYPE_PODCAST
            ? favPayload
            : undefined,
        );
      } finally {
        isTogglingRef.current = false;
      }
      updateBadgeState({ personal: true });
      if (registerUrl) await registerFav(registerUrl);
    }
  };

  return { isFav, toggleFavorite };
};

export default useFavorite;

import { useEffect, useState } from "react";

import { Achievements } from "#/helpers/Achievements";
import FavoritesStore from "#/helpers/Stores/FavoritesStore";
import { registerFav } from "#/helpers/network/Engagement";
import { updateBadgeState } from "#/helpers/provider/BadgeProvider";
import type { FaveableType } from "#/types";

/**
 * Encapsulates the "is this content saved as a favorite" state and the toggle behavior
 * shared between FavCounter and the native article toolbar.
 *
 * @param contentFavIdentifier Local-storage identifier for the favorite (e.g. slug)
 * @param contentType The type of content being saved as a favorite
 * @param registerUrl URL reported to the engagement backend when a favorite is added
 */
export const useFavorite = (
  contentFavIdentifier?: string,
  contentType?: FaveableType,
  registerUrl?: string,
) => {
  const [isFav, setIsFav] = useState(false);

  useEffect(() => {
    if (contentFavIdentifier) {
      FavoritesStore.isFavorite(contentFavIdentifier).then(setIsFav);
    }
  }, [contentFavIdentifier]);

  const toggleFavorite = async () => {
    if (!contentFavIdentifier) return;

    if (isFav) {
      await FavoritesStore.removeFavorite(contentFavIdentifier);
      setIsFav(false);
    } else {
      setIsFav(true);
      Achievements.setAchievementValue("favorite");
      FavoritesStore.addFavorite(contentFavIdentifier, contentType);
      updateBadgeState({ personal: true });
      if (registerUrl) await registerFav(registerUrl);
    }
  };

  return { isFav, toggleFavorite };
};

export default useFavorite;

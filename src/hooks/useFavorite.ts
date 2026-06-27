import { useEffect, useState } from "react";

import { Achievements } from "#/helpers/Achievements";
import ContentStore from "#/helpers/Stores/ContentStore";
import FavoritesStore from "#/helpers/Stores/FavoritesStore";
import { registerFav } from "#/helpers/network/Engagement";
import { updateBadgeState } from "#/helpers/provider/BadgeProvider";
import type { FaveableType, HttpsUrl } from "#/types";
import { FAV_TYPE_INSTA } from "#/types";

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
  registerUrl?: HttpsUrl,
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
      // A favorite without a content type would be persisted as an invalid
      // StoredFav (contentType is required) and fail isValidStoredFav, which
      // can discard the entire favorites set on the next read. Skip the add
      // when the type is missing rather than corrupting storage.
      if (!contentType) return;
      setIsFav(true);
      Achievements.setAchievementValue("favorite");
      // Instagram posts can't be re-fetched by id across accounts (the by-id
      // proxy only serves the default account), so snapshot the post — it is in
      // ContentStore because the user just viewed it — and store it with the fav.
      const payload =
        contentType === FAV_TYPE_INSTA
          ? await ContentStore.getStoredInstaPost(contentFavIdentifier)
          : undefined;
      // registerUrl is the content's own source URL; persist it so favorites
      // from a secondary WP feed (Prüfpunkt) reload from the right site.
      await FavoritesStore.addFavorite(
        contentFavIdentifier,
        contentType,
        registerUrl,
        payload,
      );
      updateBadgeState({ personal: true });
      if (registerUrl) await registerFav(registerUrl);
    }
  };

  return { isFav, toggleFavorite };
};

export default useFavorite;

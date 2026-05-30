import { useCallback, useEffect, useState } from "react";
import type { TextStyle } from "react-native";

import { StarIcon } from "#/components/Icons";
import View from "#/components/design/View";
import UiPressable from "#/components/ui/UiPressable";
import UiText from "#/components/ui/UiText";
import { Achievements } from "#/helpers/Achievements";
import FavoritesStore from "#/helpers/Stores/FavoritesStore";
import { getFavs, registerFav } from "#/helpers/network/Engagement";
import { updateBadgeState } from "#/helpers/provider/BadgeProvider";
import useAnalyticsEnabled from "#/hooks/useAnalyticsEnabled";
import { useCorporateColor } from "#/hooks/useAppColorScheme";
import type { FaveableType, ShareableType } from "#/types";

interface FavCounterProperties {
  shareable: ShareableType[];
  size?: number;
  style: TextStyle;
  contentFavIdentifier?: string;
  contentType?: FaveableType;
}

const FavCounter = (properties: FavCounterProperties) => {
  const [favs, setFavs] = useState(0);
  const [isFav, setIsFav] = useState(false);
  const color = useCorporateColor();
  const analyticsEnabled = useAnalyticsEnabled();
  const {
    contentFavIdentifier,
    contentType,
    shareable,
    size = 20,
  } = properties;

  const getAllFavs = useCallback(async () => {
    let _favs = 0;
    for (const item of shareable) {
      _favs = _favs + ((await getFavs(item.url)) ?? 0);
    }
    setFavs(_favs);
  }, [shareable]);

  useEffect(() => {
    if (analyticsEnabled) getAllFavs();
    if (contentFavIdentifier) {
      FavoritesStore.isFavorite(contentFavIdentifier).then(setIsFav);
    }
  }, [analyticsEnabled, contentFavIdentifier, getAllFavs]);

  if (!analyticsEnabled) return <View />;

  const handleFav = async () => {
    if (contentFavIdentifier) {
      if (isFav) {
        await FavoritesStore.removeFavorite(contentFavIdentifier);
        setIsFav(false);
      } else {
        setIsFav(true);
        Achievements.setAchievementValue("favorite");
        FavoritesStore.addFavorite(contentFavIdentifier, contentType);
        updateBadgeState({ personal: true });
        await registerFav(shareable[0].url);
      }
    }
  };

  return (
    <UiPressable
      accessibilityRole="button"
      onPress={handleFav}
      hitSlop={20}
      style={{
        flexDirection: "row",
        justifyContent: "space-evenly",
        alignItems: "center",
        gap: 5,
      }}
    >
      <StarIcon filled={isFav} color={color} size={size} />
      <UiText style={properties.style}>{(isFav ? 1 : 0) + favs}</UiText>
    </UiPressable>
  );
};

export default FavCounter;

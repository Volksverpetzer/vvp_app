import { useCallback, useEffect, useState } from "react";
import type { TextStyle } from "react-native";
import { Pressable } from "react-native";

import { StarIcon } from "#/components/Icons";
import Text from "#/components/design/Text";
import View from "#/components/design/View";
import Config from "#/constants/Config";
import { Achievements } from "#/helpers/Achievements";
import FavoritesStore from "#/helpers/Stores/FavoritesStore";
import { getFavs, registerFav } from "#/helpers/network/Engagement";
import { updateBadgeState } from "#/helpers/provider/BadgeProvider";
import { useCorporateColor } from "#/hooks/useAppColorScheme";
import type { FaveableType, ShareableType } from "#/types";

interface FavCounterProperties {
  shareable: ShareableType[];
  style: TextStyle;
  contentFavIdentifier?: string;
  contentType?: FaveableType;
}

const FavCounter = (properties: FavCounterProperties) => {
  const [favs, setFavs] = useState(0);
  const [isFav, setIsFav] = useState(false);
  const color = useCorporateColor();
  const { contentFavIdentifier, contentType, shareable } = properties;

  const getAllFavs = useCallback(async () => {
    let _favs = 0;
    for (const item of shareable) {
      _favs = _favs + ((await getFavs(item.url)) ?? 0);
    }
    setFavs(_favs);
  }, [shareable]);

  useEffect(() => {
    if (Config.enableEngagement) getAllFavs();
    if (contentFavIdentifier) {
      FavoritesStore.isFavorite(contentFavIdentifier).then(setIsFav);
    }
  }, [contentFavIdentifier, getAllFavs]);

  if (!Config.enableEngagement) return <View />;

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
    <Pressable
      accessibilityRole="button"
      onPress={handleFav}
      hitSlop={20}
      style={({ pressed }) => {
        return {
          flexDirection: "row",
          justifyContent: "space-evenly",
          alignItems: "center",
          backgroundColor: pressed ? "rgba(120,120,120,0.6)" : undefined,
          margin: 0,
        };
      }}
    >
      <View>
        <StarIcon filled={isFav} color={color} size={24} />
      </View>
      <View style={{ width: 5 }} />
      <Text style={properties.style}>{(isFav ? 1 : 0) + favs}</Text>
    </Pressable>
  );
};

export default FavCounter;

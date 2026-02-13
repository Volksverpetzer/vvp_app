import { useEffect, useState } from "react";
import { Pressable, TextStyle } from "react-native";

import { EmptyStar, FilledStar } from "#/components/Icons";
import Text from "#/components/design/Text";
import View from "#/components/design/View";
import Config from "#/constants/Config";
import { Achievements } from "#/helpers/Achievements";
import { ShareableType } from "#/helpers/Sharing";
import FavoritesStore from "#/helpers/Stores/FavoritesStore";
import { getFavs, registerFav } from "#/helpers/network/Analytics";
import { updateBadgeState } from "#/helpers/provider/BadgeProvider";
import { useCorporateColor } from "#/hooks/useAppColorScheme";
import { FaveableType } from "#/types";

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
  useEffect(() => {
    if (Config.analytics) getAllFavs();
    if (contentFavIdentifier) {
      FavoritesStore.isFavorite(contentFavIdentifier).then(setIsFav);
    }
  }, []);

  if (!Config.analytics) return <View />;

  const getAllFavs = async () => {
    let _favs = 0;
    for (const _shareable of properties.shareable) {
      _favs = _favs + ((await getFavs(_shareable.url)) ?? 0);
    }
    setFavs(_favs);
  };

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
      <View
        style={{
          height: 20,
          width: 20,
          overflow: "hidden",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {isFav ? (
          <FilledStar color={color} size={35} />
        ) : (
          <EmptyStar color={color} size={35} />
        )}
      </View>
      <View style={{ width: 5 }} />
      <Text style={properties.style}>{(isFav ? 1 : 0) + favs}</Text>
    </Pressable>
  );
};

export default FavCounter;

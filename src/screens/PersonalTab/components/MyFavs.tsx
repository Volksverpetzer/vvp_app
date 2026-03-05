import { useIsFocused } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { View } from "react-native";

import { StarIcon } from "#/components/Icons";
import ShareBar from "#/components/bars/ShareBar";
import Space from "#/components/design/Space";
import Text from "#/components/design/Text";
import LoadArticlePost from "#/components/loader/LoadArticlePost";
import LoadInstaPost from "#/components/loader/LoadInstaPost";
import Config from "#/constants/Config";
import { styles } from "#/constants/Styles";
import FavoritesStore from "#/helpers/Stores/FavoritesStore";
import { registerViews } from "#/helpers/network/Engagement";
import { updateBadgeState } from "#/helpers/provider/BadgeProvider";
import { useCorporateColor } from "#/hooks/useAppColorScheme";
import type { HttpsUrl, ShareableType, StoredFavs } from "#/types";
import { FAV_TYPE_ARTICLE, FAV_TYPE_INSTA } from "#/types";

const MyFavs = () => {
  const [favs, setFavs] = useState<StoredFavs>({});
  const focused = useIsFocused();

  useEffect(() => {
    if (focused) {
      updateBadgeState({ personal: false });
      // Register page view for /favs
      registerViews(`${Config.wpUrl}/favs`);
    }
    FavoritesStore.getAllFavorites().then(setFavs);
  }, [focused]);

  const corporate = useCorporateColor();
  return (
    <>
      {Object.keys(favs)
        .reverse()
        .map((fav) => {
          const { contentType } = favs[fav];
          switch (contentType) {
            case FAV_TYPE_ARTICLE: {
              const url = `${Config.wpUrl}/redirect/${fav}` satisfies HttpsUrl;
              const shareable: ShareableType[] = [{ title: fav, url }];
              return (
                <View style={{ ...styles.roundEdges }} key={fav}>
                  <LoadArticlePost inView={true} slug={fav} />
                  {shareable ? (
                    <ShareBar
                      shareable={shareable}
                      contentFavIdentifier={fav}
                      contentType={contentType}
                    />
                  ) : (
                    <View
                      style={{ paddingHorizontal: 30, height: 40, margin: 0 }}
                    />
                  )}
                </View>
              );
            }
            case FAV_TYPE_INSTA: {
              return (
                <View style={{ ...styles.roundEdges }} key={fav}>
                  <LoadInstaPost inView={true} id={fav} />
                  <ShareBar
                    shareable={[
                      {
                        title: fav,
                        url: `https://instagram.com/p/${fav}` satisfies HttpsUrl,
                      },
                    ]}
                    contentFavIdentifier={fav}
                    contentType={contentType}
                  />
                </View>
              );
            }
          }
        })}
      <Space size={100} />
      <View style={{ ...styles.centered }}>
        <StarIcon color={corporate} />
        <Text style={{ textAlign: "center", fontSize: 18 }}>
          Klick den Stern, um zu den Favoriten hinzuzufügen
        </Text>
      </View>
      <Space size={100} />
    </>
  );
};

export default MyFavs;

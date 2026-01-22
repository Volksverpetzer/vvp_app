import { useIsFocused } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { View } from "react-native";

import { EmptyStar } from "#/components/Icons";
import ShareBar from "#/components/bars/ShareBar";
import Space from "#/components/design/Space";
import Text from "#/components/design/Text";
import LoadArticlePost from "#/components/posts/LoadArticlePost";
import LoadInstaPost from "#/components/posts/LoadInstaPost";
import Config from "#/constants/Config";
import { styles } from "#/constants/Styles";
import { updateBadgeState } from "#/helpers/BadgeContext";
import { registerViews } from "#/helpers/Networking/Analytics";
import { ShareableType } from "#/helpers/Sharing";
import FavoritesStore from "#/helpers/Stores/FavoritesStore";
import { useCorporateColor } from "#/hooks/useColorScheme";
import { StoredFav } from "#/types";

const MyFavs = () => {
  const [favs, setFavs] = useState<StoredFav>({});
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
            case "article": {
              const url = Config.wpUrl + "/redirect/" + fav;
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
            case "insta": {
              return (
                <View style={{ ...styles.roundEdges }} key={fav}>
                  <LoadInstaPost inView={true} id={fav} />
                  <ShareBar
                    shareable={[
                      { title: fav, url: "https://instagram.com/p/" + fav },
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
        <EmptyStar color={corporate} width={50} />
        <Text style={{ textAlign: "center" }}>
          Klick den Stern, um zu den Favoriten hinzuzufügen
        </Text>
      </View>
      <Space size={300} />
    </>
  );
};

export default MyFavs;

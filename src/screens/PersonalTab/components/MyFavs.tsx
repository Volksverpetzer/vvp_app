import { useIsFocused } from "@react-navigation/native";
import { useCallback, useEffect, useState } from "react";
import { View } from "react-native";

import { StarIcon } from "#/components/Icons";
import ShareBar from "#/components/bars/ShareBar";
import Space from "#/components/design/Space";
import Text from "#/components/design/Text";
import Loader from "#/components/loader/Loader";
import ArticlePost from "#/components/posts/ArticlePost";
import InstaPost from "#/components/posts/InstaPost";
import Config from "#/constants/Config";
import { styles } from "#/constants/Styles";
import ContentStore from "#/helpers/Stores/ContentStore";
import FavoritesStore from "#/helpers/Stores/FavoritesStore";
import { registerViews } from "#/helpers/network/Engagement";
import API from "#/helpers/network/ServerAPI";
import WordPressAPI from "#/helpers/network/WordPressAPI";
import { updateBadgeState } from "#/helpers/provider/BadgeProvider";
import { useCorporateColor } from "#/hooks/useAppColorScheme";
import type {
  ArticleProperties,
  InstaPostProperties,
  StoredFavs,
} from "#/types";
import { FAV_TYPE_ARTICLE, FAV_TYPE_INSTA } from "#/types";

type FavoriteArticleCardProperties = {
  slug: string;
};

const FavoriteArticleCard = (properties: FavoriteArticleCardProperties) => {
  const { slug } = properties;

  const loadArticle = useCallback((articleSlug: string) => {
    return WordPressAPI.getPost(articleSlug).then((data) => {
      if (!data) {
        return Promise.reject(
          new Error(`Article not found for slug: ${articleSlug}`),
        );
      }

      return WordPressAPI.convertLoadProps(data);
    });
  }, []);

  const renderArticle = useCallback(
    (article: ArticleProperties) => (
      <>
        <ArticlePost inView={true} article={article} />
        <ShareBar
          shareable={[{ title: article.title, url: article.link }]}
          contentFavIdentifier={slug}
          contentType={FAV_TYPE_ARTICLE}
        />
      </>
    ),
    [slug],
  );

  return (
    <Loader
      keyValue={slug}
      load={loadArticle}
      render={renderArticle}
      loadingText={"Lade Artikel..."}
    />
  );
};

type FavoriteInstaCardProperties = {
  id: string;
};

const FavoriteInstaCard = (properties: FavoriteInstaCardProperties) => {
  const { id } = properties;

  const loadInstaPost = useCallback(
    (postId: string) => API.getInstaPost(postId),
    [],
  );

  const handleLoaded = useCallback(
    (post: InstaPostProperties) => {
      ContentStore.setStoredInstaPost(id, post);
    },
    [id],
  );

  const renderPost = useCallback(
    (post: InstaPostProperties) => (
      <>
        <InstaPost inView={true} {...post} />
        <ShareBar
          shareable={[{ title: post.caption, url: post.permalink }]}
          contentFavIdentifier={id}
          contentType={FAV_TYPE_INSTA}
        />
      </>
    ),
    [id],
  );

  return (
    <Loader
      keyValue={id}
      load={loadInstaPost}
      onLoaded={handleLoaded}
      render={renderPost}
      loadingText={"Lade Instagram Beitrag..."}
    />
  );
};

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
              return (
                <View style={{ ...styles.roundEdges }} key={fav}>
                  <FavoriteArticleCard slug={fav} />
                </View>
              );
            }
            case FAV_TYPE_INSTA: {
              return (
                <View style={{ ...styles.roundEdges }} key={fav}>
                  <FavoriteInstaCard id={fav} />
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

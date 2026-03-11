import { useIsFocused } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { View } from "react-native";

import { StarIcon } from "#/components/Icons";
import LoadingFallback from "#/components/animations/LoadingFallback";
import Space from "#/components/design/Space";
import Text from "#/components/design/Text";
import GenericPost from "#/components/posts/GenericPost";
import InstaPost from "#/components/posts/InstaPost";
import Config from "#/constants/Config";
import { styles } from "#/constants/Styles";
import Post from "#/helpers/Post";
import FavoritesStore from "#/helpers/Stores/FavoritesStore";
import { registerViews } from "#/helpers/network/Engagement";
import API from "#/helpers/network/ServerAPI";
import WordPressAPI from "#/helpers/network/WordPressAPI";
import { updateBadgeState } from "#/helpers/provider/BadgeProvider";
import { useCorporateColor } from "#/hooks/useAppColorScheme";
import { WordPressFetcher } from "#/screens/Home/fetchers/WordPressFetcher";
import type { ArticleProperties, InstaPostProperties } from "#/types";
import { FAV_TYPE_ARTICLE, FAV_TYPE_INSTA } from "#/types";

type FavoritePost =
  | Post<{ article: ArticleProperties }>
  | Post<InstaPostProperties>;

const loadFavoriteArticlePost = async (
  slug: string,
): Promise<Post<{ article: ArticleProperties }> | undefined> => {
  const article = await WordPressAPI.getPost(slug);
  if (!article) {
    console.error(`Article not found for slug: ${slug}`);
    return undefined;
  }

  return WordPressFetcher.mapArticleToPost(article, 1);
};

const loadFavoriteInstaPost = async (
  id: string,
): Promise<Post<InstaPostProperties> | undefined> => {
  try {
    const post = await API.getInstaPost(id);
    if (post.media_type !== "IMAGE" && post.media_type !== "CAROUSEL_ALBUM") {
      return undefined;
    }

    return new Post<InstaPostProperties>(
      post.timestamp,
      post.id,
      InstaPost,
      post,
      [{ url: post.permalink, title: "Instagram Post teilen" }],
      1,
      false,
      post.id,
      FAV_TYPE_INSTA,
    );
  } catch (error) {
    console.error(`Failed to load Instagram favorite ${id}:`, error);
    return undefined;
  }
};

const MyFavs = () => {
  const [posts, setPosts] = useState<FavoritePost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const focused = useIsFocused();

  useEffect(() => {
    let isMounted = true;

    const loadFavorites = async () => {
      setIsLoading(true);
      const favs = await FavoritesStore.getAllFavorites();
      const results = await Promise.allSettled(
        Object.entries(favs)
          .reverse()
          .map(async ([fav, { contentType }]) => {
            try {
              switch (contentType) {
                case FAV_TYPE_ARTICLE:
                  return await loadFavoriteArticlePost(fav);
                case FAV_TYPE_INSTA:
                  return await loadFavoriteInstaPost(fav);
              }
            } catch (error) {
              console.error(
                `Failed to load favorite "${fav}" (${contentType}):`,
                error,
              );
            }
          }),
      );

      if (!isMounted) {
        return;
      }

      setPosts(
        results
          .filter(
            (result): result is PromiseFulfilledResult<FavoritePost> =>
              result.status === "fulfilled" && result.value !== undefined,
          )
          .map((result) => result.value),
      );
      setIsLoading(false);
    };

    if (focused) {
      updateBadgeState({ personal: false });
      // Register page view for /favs
      registerViews(`${Config.wpUrl}/favs`);
    }

    loadFavorites().catch((error) => {
      console.error("Failed to load favorites:", error);
      if (isMounted) {
        setPosts([]);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [focused]);

  const corporate = useCorporateColor();

  return (
    <>
      {isLoading ? (
        <LoadingFallback text={"Lade Favoriten..."} />
      ) : (
        posts.map((post) => (
          <GenericPost
            key={post.id}
            component={post.component}
            data={post.data}
            contentFavIdentifier={post.contentFavIdentifier}
            contentType={post.contentType}
            shareable={post.shareable}
            hideShareCount={post.hideShareCount}
            inView={true}
          />
        ))
      )}
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

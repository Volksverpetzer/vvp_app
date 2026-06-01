import { useIsFocused } from "expo-router/react-navigation";
import { useEffect, useRef, useState } from "react";
import { View } from "react-native";

import { StarIcon } from "#/components/Icons";
import GenericPost from "#/components/posts/GenericPost";
import InstaPostCard from "#/components/posts/insta/InstaPostCard";
import UiCard from "#/components/ui/UiCard";
import UiEmptyState from "#/components/ui/UiEmptyState";
import UiSpace from "#/components/ui/UiSpace";
import UiSpinner from "#/components/ui/UiSpinner";
import Config from "#/constants/Config";
import Post from "#/helpers/Post";
import FavoritesStore from "#/helpers/Stores/FavoritesStore";
import { registerViews } from "#/helpers/network/Engagement";
import API from "#/helpers/network/ServerAPI";
import WordPressAPI from "#/helpers/network/WordPressAPI";
import { updateBadgeState } from "#/helpers/provider/BadgeProvider";
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
      InstaPostCard,
      post,
      [{ url: post.permalink, title: "Instagram Post teilen" }],
      1,
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
  const requestIdRef = useRef(0);

  useEffect(() => {
    let isMounted = true;
    const currentRequestId = ++requestIdRef.current;

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

      if (!isMounted || currentRequestId !== requestIdRef.current) {
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
      loadFavorites().catch((error) => {
        console.error("Failed to load favorites:", error);
        if (isMounted && currentRequestId === requestIdRef.current) {
          setIsLoading(false);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [focused]);

  return (
    <View style={{ flex: 1, gap: 20 }}>
      {isLoading ? (
        <UiCard>
          <UiSpinner text="Lade Favoriten..." />
        </UiCard>
      ) : (
        posts.map((post) => (
          <GenericPost
            key={post.id}
            component={post.component}
            data={post.data}
            contentFavIdentifier={post.contentFavIdentifier}
            contentType={post.contentType}
            shareable={post.shareable}
            inView={true}
          />
        ))
      )}
      <UiSpace size={50} />
      <UiEmptyState icon={<StarIcon />}>
        Klicke auf den Stern bei Artikeln und Posts, um sie zu den Favoriten
        hinzuzufügen
      </UiEmptyState>
      <UiSpace size={100} />
    </View>
  );
};

export default MyFavs;

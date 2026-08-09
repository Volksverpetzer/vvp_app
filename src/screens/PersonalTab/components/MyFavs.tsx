import { useIsFocused } from "expo-router/react-navigation";
import { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { StarIcon } from "#/components/Icons";
import GenericPost from "#/components/posts/GenericPost";
import InstaPostCard from "#/components/posts/insta/InstaPostCard";
import UiEmptyState from "#/components/ui/UiEmptyState";
import UiSpace from "#/components/ui/UiSpace";
import UiSpinner from "#/components/ui/UiSpinner";
import Config from "#/constants/Config";
import { spacing } from "#/constants/Spacing";
import Post from "#/helpers/Post";
import FavoritesStore from "#/helpers/Stores/FavoritesStore";
import { registerViews } from "#/helpers/network/Engagement";
import API from "#/helpers/network/ServerAPI";
import WordPressAPI from "#/helpers/network/WordPressAPI";
import { updateBadgeState } from "#/helpers/provider/BadgeProvider";
import { findSecondaryWpFeed } from "#/helpers/utils/feeds";
import { mapPodcastEpisode } from "#/screens/Home/fetchers/PodcastFetcher";
import { WordPressFetcher } from "#/screens/Home/fetchers/WordPressFetcher";
import type {
  ArticleProperties,
  HttpsUrl,
  InstaPostProperties,
  PodcastEpisodeProperties,
} from "#/types";
import { FAV_TYPE_ARTICLE, FAV_TYPE_INSTA, FAV_TYPE_PODCAST } from "#/types";

type FavoritePost =
  | Post<{ article: ArticleProperties }>
  | Post<InstaPostProperties>
  | Post<PodcastEpisodeProperties>;

// Reuse one API client per secondary site instead of rebuilding it for every
// favorite on every load.
const secondaryApiCache = new Map<
  HttpsUrl,
  ReturnType<typeof WordPressAPI.create>
>();
const secondaryApiFor = (handle: HttpsUrl) => {
  let api = secondaryApiCache.get(handle);
  if (!api) {
    api = WordPressAPI.create(handle);
    secondaryApiCache.set(handle, api);
  }
  return api;
};

const loadFavoriteArticlePost = async (
  slug: string,
  originalUrl?: HttpsUrl,
): Promise<Post<{ article: ArticleProperties }> | undefined> => {
  // Articles from a secondary WordPress feed (e.g. Prüfpunkt) live on their own
  // site, so reload them from that site's API instead of the primary one — which
  // would 404 and purge the favorite below.
  const secondaryWp = findSecondaryWpFeed(
    originalUrl,
    Config.wpUrl,
    Config.feeds?.wp,
  );
  const api = secondaryWp ? secondaryApiFor(secondaryWp.handle) : null;
  const article = api
    ? await api.getPost(slug)
    : await WordPressAPI.getPost(slug);
  if (!article) {
    console.warn(
      `Article not found for slug: ${slug}, removing from favorites`,
    );
    await FavoritesStore.removeFavorite(slug);
    return undefined;
  }

  return WordPressFetcher.mapArticleToPost(article, 1);
};

const loadFavoriteInstaPost = async (
  id: string,
  payload?: InstaPostProperties,
): Promise<Post<InstaPostProperties> | undefined> => {
  try {
    // Prefer the snapshot stored with the favorite (works for any account and
    // without the backend); otherwise re-fetch from the by-id proxy.
    const post = payload ?? (await API.getInstaPost(id));
    if (
      !post ||
      (post.media_type !== "IMAGE" && post.media_type !== "CAROUSEL_ALBUM")
    ) {
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

const loadFavoritePodcast = async (
  id: string,
  payload?: PodcastEpisodeProperties,
): Promise<Post<PodcastEpisodeProperties> | undefined> => {
  try {
    // Prefer the snapshot stored with the favorite; Podigee has no by-id
    // endpoint, so otherwise search the (server-cached) feed for the episode.
    const episode =
      payload ?? (await API.getPodcastFeed()).find((e) => e.id === id);
    if (!episode) {
      await FavoritesStore.removeFavorite(id);
      return undefined;
    }
    return mapPodcastEpisode(episode) ?? undefined;
  } catch (error) {
    console.error(`Failed to load podcast favorite ${id}:`, error);
    return undefined;
  }
};

const MyFavs = () => {
  const [posts, setPosts] = useState<FavoritePost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const focused = useIsFocused();
  const requestIdRef = useRef(0);
  // insets.bottom already includes the native tab bar's height (it's a real
  // TabView, not a JS-rendered overlay, so iOS/Android propagate it as part
  // of the safe area) — no separate tab-bar-height constant needed.
  const { bottom: tabBarClearance } = useSafeAreaInsets();

  useEffect(() => {
    let isMounted = true;
    const currentRequestId = ++requestIdRef.current;

    const loadFavorites = async () => {
      setIsLoading(true);
      const favs = await FavoritesStore.getAllFavorites();
      const results = await Promise.allSettled(
        Object.entries(favs)
          .reverse()
          .map(async ([fav, { contentType, originalUrl, payload }]) => {
            try {
              switch (contentType) {
                case FAV_TYPE_ARTICLE:
                  return await loadFavoriteArticlePost(fav, originalUrl);
                case FAV_TYPE_INSTA:
                  return await loadFavoriteInstaPost(
                    fav,
                    payload as InstaPostProperties | undefined,
                  );
                case FAV_TYPE_PODCAST:
                  return await loadFavoritePodcast(
                    fav,
                    payload as PodcastEpisodeProperties | undefined,
                  );
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
    <View
      style={{
        flex: 1,
        gap: spacing.xl,
        paddingBottom: tabBarClearance + spacing.xl,
      }}
    >
      {isLoading ? (
        <UiSpinner text="Lade Favoriten..." />
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
    </View>
  );
};

export default MyFavs;

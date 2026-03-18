import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  ListRenderItem,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ViewStyle,
} from "react-native";
import { FlatList, Pressable, RefreshControl } from "react-native";

import { SearchIcon, SettingsIcon } from "#/components/Icons";
import LoadingFallback from "#/components/animations/LoadingFallback";
import EmptyComponent from "#/components/design/EmptyComponent";
import Text from "#/components/design/Text";
import View from "#/components/design/View";
import GenericPost from "#/components/posts/GenericPost";
import UiSpinner from "#/components/ui/UiSpinner";
import Colors from "#/constants/Colors";
import { styles } from "#/constants/Styles";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";
import FetcherUtilities from "#/screens/Home/fetchers/FetcherUtilities";
import type { Post } from "#/types";

export type FeedFetcherProperties = {
  page?: number;
  param?: string;
};

export interface FeedProperties {
  fetchers: {
    fetcher: (properties: FeedFetcherProperties) => Promise<Post<unknown>[]>;
    props?: FeedFetcherProperties;
  }[];
  prioSort?: boolean;
  cutoffDate?: boolean;
  style?: ViewStyle;
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
}

/**
 * Generic Feed Takes Fetchers and Renders a Feed of their Posts in chronological order
 */
const Feed = (properties: FeedProperties) => {
  const [posts, setPosts] = useState<Post<unknown>[]>([]);
  const [inView, setInView] = useState(new Set<string>());
  const [rerender, setRerender] = useState(0);
  const [initialLoad, setInitialLoad] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(true);
  const [page, setPage] = useState(1);
  const router = useRouter();
  const colorScheme = useAppColorScheme();
  const corporate = Colors[colorScheme].corporate;
  const [loadmore, setLoadmore] = useState(false);
  const [refreshing, setRefresh] = useState(false);

  const updateLoadingStates = useCallback(() => {
    setRefresh(false);
    setLoadmore(false);
    setInitialLoad(true);
  }, []);

  const getPosts = useCallback(
    async (
      fetcherProperties?: { page?: number; param?: string },
      oldPosts: Post<unknown>[] = [],
    ) => {
      try {
        const newPosts = await FetcherUtilities.fetchAndProcessPosts(
          properties.fetchers,
          fetcherProperties,
          oldPosts,
          { prioSort: properties.prioSort, cutoffDate: properties.cutoffDate },
        );
        setPosts(newPosts);
        updateLoadingStates();
        return oldPosts.length < newPosts.length;
      } catch (error) {
        console.error("Error fetching posts:", error);
        updateLoadingStates();
      }
    },
    [
      properties.fetchers,
      properties.prioSort,
      properties.cutoffDate,
      updateLoadingStates,
    ],
  );

  useEffect(() => {
    if (properties.fetchers.length === 0) {
      updateLoadingStates();
      return;
    }
    getPosts(undefined, []);
    setInitialLoad(false);
    setRefresh(true);
  }, [properties.fetchers.length, getPosts, updateLoadingStates]);

  const onRefresh = useCallback(() => {
    if (refreshing) return;
    setInitialLoad(false);
    setRefresh(true);
    setPage(1);
    setPosts([]);
    getPosts(undefined, []);
  }, [refreshing, getPosts]);

  // Load-more handler: wrapped in useCallback.
  const onLoadMore = useCallback(async () => {
    if (loadmore) return;
    setLoadmore(true);
    const nextPage = page + 1;
    const received = await getPosts({ page: nextPage }, posts);
    if (received) setPage(nextPage);
    else setIsLoadingMore(false);
  }, [loadmore, page, getPosts, posts]);

  // Update inView set immutably – do not mutate state directly.
  const onViewableItemsChanged = useCallback(({ viewableItems }) => {
    setInView((previous) => {
      const newSet = new Set(previous);
      for (const item of viewableItems) {
        if (item.isViewable) {
          newSet.add(item.item.id);
        }
      }
      setRerender(newSet.size);
      return newSet;
    });
  }, []);

  const viewabilityConfigCallbackPairs = useRef([
    {
      onViewableItemsChanged,
      viewabilityConfig: { itemVisiblePercentThreshold: 0 },
    },
  ]);

  const renderItem: ListRenderItem<Post<unknown>> = useCallback(
    ({ item }) => {
      // Skip rendering if item.data is not an object.
      if (typeof item.data !== "object") return undefined;
      return (
        <GenericPost
          key={item.id}
          component={item.component}
          data={item.data}
          contentFavIdentifier={item.contentFavIdentifier}
          contentType={item.contentType}
          shareable={item.shareable}
          inView={inView.has(item.id)}
          hideShareCount={item.hideShareCount}
        />
      );
    },
    [inView],
  );

  const contentContainerStyle = useMemo(
    () => ({
      ...properties?.style,
      ...styles.feed,
    }),
    [properties?.style],
  );

  if (!initialLoad) {
    return (
      <LoadingFallback
        text={"Lade Feed..."}
        containerStyle={properties?.style}
        spinnerProps={{ size: "large" }}
      />
    );
  }

  if (properties.fetchers.length === 0) {
    // show centered link to settings and remind user to choose content:
    return (
      <View
        style={{
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
          ...properties?.style,
        }}
      >
        <Text style={styles.heading}>Bitte wähle mindestens ein Feed aus:</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/settings")}
        >
          <SettingsIcon color={corporate} />
        </Pressable>
      </View>
    );
  }

  return (
    <View
      style={{ ...styles.centered, flexDirection: "row" }}
      lightColor={Colors.light.secondaryBackground}
      darkColor={Colors.dark.secondaryBackground}
    >
      <FlatList
        onScroll={properties.onScroll}
        viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs.current}
        initialNumToRender={3}
        maxToRenderPerBatch={3}
        onEndReachedThreshold={0.7}
        windowSize={100}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        data={posts}
        extraData={rerender}
        renderItem={renderItem}
        onEndReached={posts.length > 0 ? onLoadMore : undefined}
        ListFooterComponent={
          posts.length > 0 &&
          (isLoadingMore ? (
            <UiSpinner size={"large"} />
          ) : (
            <Pressable
              accessibilityRole="button"
              style={styles.centered}
              onPress={() => router.push("/search")}
            >
              <SearchIcon color={corporate} />
            </Pressable>
          ))
        }
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<EmptyComponent reload={onRefresh} />}
        contentContainerStyle={contentContainerStyle}
      />
    </View>
  );
};

export default Feed;

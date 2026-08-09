import { useRouter, useScrollToTop } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  ListRenderItem,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ViewStyle,
  ViewToken,
} from "react-native";
import { FlatList, RefreshControl, View } from "react-native";

import { SearchIcon, SettingsIcon, WorldIcon } from "#/components/Icons";
import AnnouncementCard from "#/components/posts/AnnouncementCard";
import GenericPost from "#/components/posts/GenericPost";
import UiEmptyState from "#/components/ui/UiEmptyState";
import UiPressable from "#/components/ui/UiPressable";
import UiSpinner from "#/components/ui/UiSpinner";
import UiText from "#/components/ui/UiText";
import EmptyComponent from "#/components/views/EmptyComponent";
import Announcements from "#/constants/Announcements";
import Colors from "#/constants/Colors";
import { globalStyles } from "#/constants/GlobalStyles";
import { spacing } from "#/constants/Spacing";
import PersonalStore from "#/helpers/Stores/PersonalStore";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";
import FetcherUtilities from "#/screens/Home/fetchers/FetcherUtilities";
import type { Post } from "#/types";

export type FeedFetcherProperties = {
  page?: number;
  param?: string;
  signal?: AbortSignal;
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
  /** Show the one-time in-feed announcement cards (see #/constants/Announcements). */
  showAnnouncements?: boolean;
}

/**
 * Generic Feed Takes Fetchers and Renders a Feed of their Posts in chronological order
 */
const Feed = (properties: FeedProperties) => {
  const [posts, setPosts] = useState<Post<unknown>[]>([]);
  const flatListRef = useRef<FlatList>(null);
  useScrollToTop(flatListRef);
  const inViewRef = useRef(new Set<string>());
  const [rerender, setRerender] = useState(0);
  const [initialLoad, setInitialLoad] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(true);
  const [page, setPage] = useState(1);
  const router = useRouter();
  const colorScheme = useAppColorScheme();
  const corporate = Colors[colorScheme].primary;
  const [loadmore, setLoadmore] = useState(false);
  const [refreshing, setRefresh] = useState(false);
  const fetchControllerRef = useRef<AbortController | null>(null);
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState<
    string[]
  >([]);
  const [dismissedLoaded, setDismissedLoaded] = useState(false);

  useEffect(() => {
    if (!properties.showAnnouncements) return;
    let cancelled = false;
    PersonalStore.getDismissedAnnouncements().then((stored) => {
      if (cancelled) return;
      // Merge instead of replace: a dismissal made while this load was in
      // flight must not be reverted by the (stale) stored value.
      setDismissedAnnouncements((previous) => [
        ...new Set([...previous, ...stored]),
      ]);
      setDismissedLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [properties.showAnnouncements]);

  // Gate on dismissedLoaded so an already-dismissed announcement never flashes
  // on first render before the stored dismissal state has been read.
  const activeAnnouncement =
    properties.showAnnouncements && dismissedLoaded
      ? Announcements.find((a) => !dismissedAnnouncements.includes(a.id))
      : undefined;

  const dismissAnnouncement = useCallback((id: string) => {
    setDismissedAnnouncements((previous) =>
      previous.includes(id) ? previous : [...previous, id],
    );
    void PersonalStore.dismissAnnouncement(id);
  }, []);

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
      const controller = new AbortController();
      fetchControllerRef.current?.abort();
      fetchControllerRef.current = controller;

      try {
        const newPosts = await FetcherUtilities.fetchAndProcessPosts(
          properties.fetchers,
          { ...fetcherProperties, signal: controller.signal },
          oldPosts,
          { prioSort: properties.prioSort, cutoffDate: properties.cutoffDate },
        );
        if (controller.signal.aborted) return false;
        setPosts(newPosts);
        updateLoadingStates();
        return oldPosts.length < newPosts.length;
      } catch (error) {
        if (controller.signal.aborted) return false;
        console.error("Error fetching posts:", error);
        updateLoadingStates();
      } finally {
        if (fetchControllerRef.current === controller) {
          fetchControllerRef.current = null;
        }
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

    return () => {
      fetchControllerRef.current?.abort();
      fetchControllerRef.current = null;
    };
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

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      let changed = false;
      for (const item of viewableItems) {
        if (item.isViewable && !inViewRef.current.has(item.item.id)) {
          inViewRef.current.add(item.item.id);
          changed = true;
        }
      }
      if (changed) setRerender((n) => n + 1);
    },
    [],
  );

  const viewabilityConfigCallbackPairs = useRef([
    {
      onViewableItemsChanged,
      viewabilityConfig: { itemVisiblePercentThreshold: 0 },
    },
  ]);

  const renderItem: ListRenderItem<Post<unknown>> = useCallback(({ item }) => {
    if (typeof item.data !== "object") return null;
    return (
      <GenericPost
        key={item.id}
        component={item.component}
        data={item.data}
        contentFavIdentifier={item.contentFavIdentifier}
        contentType={item.contentType}
        shareable={item.shareable}
        inView={inViewRef.current.has(item.id)}
      />
    );
  }, []);

  const contentContainerStyle = useMemo(
    () => [properties.style, globalStyles.content],
    [properties.style],
  );

  if (!initialLoad) {
    return (
      <UiSpinner
        text="Lade Feed..."
        size="large"
        containerStyle={properties.style}
      />
    );
  }

  if (properties.fetchers.length === 0) {
    return (
      <View
        style={{
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
          paddingHorizontal: spacing.xl,
          ...properties.style,
        }}
      >
        <UiEmptyState
          icon={<SettingsIcon />}
          onPress={() => router.push("/settings")}
        >
          Bitte wähle mindestens ein Feed in den Einstellungen aus, um Inhalte
          zu sehen.
        </UiEmptyState>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        ref={flatListRef}
        onScroll={properties.onScroll}
        scrollEventThrottle={16}
        viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs.current}
        initialNumToRender={3}
        maxToRenderPerBatch={3}
        onEndReachedThreshold={0.7}
        windowSize={10}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        data={posts}
        extraData={rerender}
        renderItem={renderItem}
        onEndReached={posts.length > 0 ? onLoadMore : undefined}
        // Rendered as header (not a data item) so ListEmptyComponent still
        // appears when the feed itself is empty.
        ListHeaderComponent={
          activeAnnouncement && (
            <AnnouncementCard
              announcement={activeAnnouncement}
              onDismiss={dismissAnnouncement}
            />
          )
        }
        ListFooterComponent={
          posts.length > 0 &&
          (isLoadingMore ? (
            <UiSpinner size="large" />
          ) : (
            <View style={{ paddingBottom: spacing.xxxl, alignItems: "center" }}>
              <UiPressable
                accessibilityRole="button"
                style={globalStyles.centered}
                onPress={() => router.push("/search")}
              >
                <UiText
                  size="lg"
                  style={{
                    textAlign: "center",
                    paddingVertical: spacing.xxxl,
                    color: corporate,
                  }}
                >
                  Nicht gefunden, wonach du gesucht hast? Probiere die Suche
                  aus!
                </UiText>
                <SearchIcon color={corporate} size={24} />
              </UiPressable>
            </View>
          ))
        }
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <EmptyComponent
            text="Keine Ergebnisse. Versuche es später erneut oder erweitere deine Feeds in den Einstellungen."
            icon={<WorldIcon size={60} />}
            onPress={onRefresh}
          />
        }
        contentContainerStyle={contentContainerStyle}
      />
    </View>
  );
};

export default Feed;

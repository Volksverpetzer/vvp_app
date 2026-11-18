import { useRouter, useScrollToTop } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  ListRenderItem,
  ListViewToken,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleProp,
  ViewStyle,
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
import { iconSizes } from "#/constants/IconSizes";
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
    /** Feed key, used in log messages. */
    name?: string;
  }[];
  prioSort?: boolean;
  cutoffDate?: boolean;
  style?: StyleProp<ViewStyle>;
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
  // The last load-more failed (e.g. network down): show a retry instead of
  // the end-of-feed prompt, which would claim there are no more posts.
  const [loadMoreFailed, setLoadMoreFailed] = useState(false);
  const [page, setPage] = useState(1);
  const router = useRouter();
  const colorScheme = useAppColorScheme();
  const corporate = Colors[colorScheme].primary;
  const [loadmore, setLoadmore] = useState(false);
  const [refreshing, setRefresh] = useState(false);
  const fetchControllerRef = useRef<AbortController | null>(null);
  // Synchronous guard against a second onEndReached firing before the
  // `loadmore` state update has re-rendered.
  const loadingMoreRef = useRef(false);
  // Bumped by every load-more and by reload(), so a superseded load-more that
  // settles late (e.g. a fetcher ignoring the abort signal) does not clear the
  // guard of the request that replaced it.
  const loadMoreGenerationRef = useRef(0);
  // Posts the date cutoff hid on the first page. Non-paginated feeds
  // (Bluesky, YouTube, …) return the same list on every page, so applying the
  // cutoff again on load-more would keep discarding older WordPress articles;
  // instead load-more skips the cutoff and releases these held-back posts.
  const heldBackRef = useRef<Post<unknown>[]>([]);
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
    /**
     * @returns "grew" if the list grew, "unchanged" if every feed loaded but
     *   brought nothing new, "failed" if nothing new came because a feed
     *   failed to load, and undefined if the request was aborted
     *   (superseded). Only "unchanged" means the feed is exhausted.
     */
    async (
      fetcherProperties?: { page?: number; param?: string },
      oldPosts: Post<unknown>[] = [],
      { loadMore = false }: { loadMore?: boolean } = {},
    ): Promise<"grew" | "unchanged" | "failed" | undefined> => {
      const controller = new AbortController();
      fetchControllerRef.current?.abort();
      fetchControllerRef.current = controller;

      let heldBack: Post<unknown>[] = [];
      let fetchFailed = false;
      try {
        const newPosts = await FetcherUtilities.fetchAndProcessPosts(
          properties.fetchers,
          { ...fetcherProperties, signal: controller.signal },
          loadMore ? [...oldPosts, ...heldBackRef.current] : oldPosts,
          {
            prioSort: properties.prioSort,
            cutoffDate: loadMore ? false : properties.cutoffDate,
            onCutoff: (dropped) => {
              heldBack = dropped;
            },
            onFetchError: () => {
              fetchFailed = true;
            },
          },
        );
        if (controller.signal.aborted) return undefined;
        heldBackRef.current = heldBack;
        setPosts(newPosts);
        updateLoadingStates();
        if (oldPosts.length < newPosts.length) return "grew";
        return fetchFailed ? "failed" : "unchanged";
      } catch (error) {
        if (controller.signal.aborted) return undefined;
        console.error("Error fetching posts:", error);
        updateLoadingStates();
        return "failed";
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

  // Start over from page 1: used for the initial load, for a reload after the
  // fetchers changed (e.g. a content setting was toggled) and for
  // pull-to-refresh. Without resetting the page, the next load-more after a
  // settings change skipped straight to the old page + 1.
  const reload = useCallback(() => {
    setInitialLoad(false);
    setRefresh(true);
    setPage(1);
    setIsLoadingMore(true);
    setLoadMoreFailed(false);
    setPosts([]);
    heldBackRef.current = [];
    loadingMoreRef.current = false;
    loadMoreGenerationRef.current += 1;
    getPosts(undefined, []);
  }, [getPosts]);

  useEffect(() => {
    if (properties.fetchers.length === 0) {
      updateLoadingStates();
      return;
    }
    reload();

    return () => {
      fetchControllerRef.current?.abort();
      fetchControllerRef.current = null;
    };
  }, [properties.fetchers.length, reload, updateLoadingStates]);

  const onRefresh = useCallback(() => {
    if (refreshing) return;
    reload();
  }, [refreshing, reload]);

  // Load-more handler: wrapped in useCallback.
  const onLoadMore = useCallback(async () => {
    if (loadmore || loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    const generation = ++loadMoreGenerationRef.current;
    setLoadmore(true);
    const nextPage = page + 1;
    try {
      const received = await getPosts({ page: nextPage }, posts, {
        loadMore: true,
      });
      // Only an actual "nothing new" ends the feed. An aborted load (e.g.
      // superseded by pull-to-refresh) keeps the spinner footer, and a failed
      // one keeps the page so the retry asks for it again.
      if (received === "grew") {
        setPage(nextPage);
        setLoadMoreFailed(false);
      } else if (received === "failed") {
        setLoadMoreFailed(true);
      } else if (received === "unchanged") {
        setLoadMoreFailed(false);
        setIsLoadingMore(false);
      }
    } finally {
      if (loadMoreGenerationRef.current === generation) {
        loadingMoreRef.current = false;
      }
    }
  }, [loadmore, page, getPosts, posts]);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ListViewToken[] }) => {
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
        style={[
          {
            justifyContent: "center",
            alignItems: "center",
            height: "100%",
            paddingHorizontal: spacing.xl,
          },
          properties.style,
        ]}
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
        // After a failed load-more only the retry footer retries. Swapping the
        // spinner for the retry text changes the content height while the
        // list is still within the threshold, which re-fires onEndReached:
        // with a feed that keeps failing that looped spinner → retry text →
        // spinner forever.
        onEndReached={
          posts.length > 0 && !loadMoreFailed ? onLoadMore : undefined
        }
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
          (loadMoreFailed && !loadmore ? (
            <View style={{ paddingBottom: spacing.xxxl, alignItems: "center" }}>
              <UiPressable
                accessibilityRole="button"
                style={globalStyles.centered}
                onPress={onLoadMore}
              >
                <UiText
                  size="lg"
                  style={{
                    textAlign: "center",
                    paddingVertical: spacing.xxxl,
                    color: corporate,
                  }}
                >
                  Weitere Beiträge konnten nicht geladen werden. Tippe, um es
                  erneut zu versuchen.
                </UiText>
              </UiPressable>
            </View>
          ) : isLoadingMore ? (
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
                <SearchIcon color={corporate} size={iconSizes.md} />
              </UiPressable>
            </View>
          ))
        }
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <EmptyComponent
            text="Keine Ergebnisse. Versuche es später erneut oder erweitere deine Feeds in den Einstellungen."
            icon={<WorldIcon size={iconSizes.xl} />}
            onPress={onRefresh}
          />
        }
        contentContainerStyle={contentContainerStyle}
      />
    </View>
  );
};

export default Feed;

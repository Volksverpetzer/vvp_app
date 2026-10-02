import { searchClient } from "@algolia/client-search";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import type {
  Animated,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from "react-native";

import { SearchIcon } from "#/components/Icons";
import BackToTopButton from "#/components/buttons/BackToTopButton";
import UiEmptyState from "#/components/ui/UiEmptyState";
import UiErrorCard from "#/components/ui/UiErrorCard";
import UiSpinner from "#/components/ui/UiSpinner";
import UiText from "#/components/ui/UiText";
import Config from "#/constants/Config";
import { globalStyles } from "#/constants/GlobalStyles";
import { spacing } from "#/constants/Spacing";
import { onLinkPress } from "#/helpers/Linking";
import { useBackToTop } from "#/hooks/useBackToTop";
import SearchResultItem from "#/screens/Search/components/SearchResultItem";

// Created lazily: variants without an Algolia config use WpSearch instead.
let algoliaClient: ReturnType<typeof searchClient> | undefined;
const getAlgoliaClient = () => {
  algoliaClient ??= searchClient(
    Config.algolia.appId,
    Config.algolia.searchKey,
  );
  return algoliaClient;
};

interface AlgoliaSearchProperties {
  searchString: string;
  maxResults?: number;
  onResultsLength?: (
    count: number,
  ) => void; /** Receives the list's scroll offset so the search header can collapse. */
  scrollOffsetY?: Animated.Value;
}

const AlgoliaSearchResults = ({
  searchString,
  maxResults = 10,
  onResultsLength,
  scrollOffsetY,
}: AlgoliaSearchProperties) => {
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const router = useRouter();
  const listReference = useRef<FlatList>(null);
  const backToTop = useBackToTop();

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      backToTop.onScroll(event);
      scrollOffsetY?.setValue(event.nativeEvent.contentOffset.y);
    },
    [backToTop, scrollOffsetY],
  );

  useEffect(() => {
    if (!searchString || searchString.length < 2) {
      setResults([]);
      setHasError(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setHasError(false);
    let cancelled = false;

    const timer = setTimeout(async () => {
      try {
        const { hits } = await getAlgoliaClient().searchSingleIndex({
          indexName: Config.algolia.indexName,
          searchParams: { query: searchString, hitsPerPage: maxResults },
        });
        if (!cancelled) {
          setResults(hits);
          onResultsLength?.(hits.length);
          setIsLoading(false);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Algolia search error:", error);
          setResults([]);
          setHasError(true);
          setIsLoading(false);
        }
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchString, maxResults, onResultsLength]);

  const handleResultPress = useCallback(
    (item) => {
      onLinkPress(item.permalink, router);
    },
    [router],
  );

  const renderItem = useCallback(
    ({ item }) => {
      const _date = new Date(item.post_date * 1000);
      const date =
        _date.getDate() +
        "." +
        (_date.getMonth() + 1) +
        "." +
        _date.getFullYear();
      return (
        <SearchResultItem
          title={item.post_title}
          text={`<div>${item._highlightResult?.content?.value?.slice(0, 200) || ""}...</div>`}
          subtitle={<UiText style={{ textAlign: "right" }}>{date}</UiText>}
          onPress={() => handleResultPress(item)}
        />
      );
    },
    [handleResultPress],
  );

  if (isLoading) {
    return <UiSpinner text="Artikel werden gesucht …" />;
  }

  if (hasError) {
    return (
      <View style={itemStyles.emptyContainer}>
        <UiErrorCard text="Suche fehlgeschlagen. Bitte versuche es erneut." />
      </View>
    );
  }

  if (results.length === 0 && searchString.length >= 2) {
    return (
      <View style={itemStyles.emptyContainer}>
        <UiEmptyState icon={<SearchIcon />}>
          Keine Ergebnisse gefunden
        </UiEmptyState>
      </View>
    );
  }

  return (
    <View style={globalStyles.container}>
      <FlatList
        ref={listReference}
        data={results}
        contentContainerStyle={{
          paddingBottom: 100,
          gap: spacing.xl,
        }}
        keyExtractor={(item) => item.objectID}
        renderItem={renderItem}
        initialNumToRender={5}
        maxToRenderPerBatch={10}
        windowSize={5}
        keyboardDismissMode="on-drag"
        onScroll={handleScroll}
        scrollEventThrottle={16}
      />
      <BackToTopButton
        visible={backToTop.visible}
        onPress={() =>
          listReference.current?.scrollToOffset({ offset: 0, animated: true })
        }
      />
    </View>
  );
};

const itemStyles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
});

export default AlgoliaSearchResults;

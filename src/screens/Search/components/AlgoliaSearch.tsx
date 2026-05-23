import { searchClient } from "@algolia/client-search";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { FlatList, StyleSheet } from "react-native";

import ErrorCard from "#/components/design/ErrorCard";
import View from "#/components/design/View";
import UiSpinner from "#/components/ui/UiSpinner";
import UiText from "#/components/ui/UiText";
import {
  ALGOLIA_APP_ID,
  ALGOLIA_INDEX_NAME,
  ALGOLIA_SEARCH_KEY,
} from "#/constants/Search";
import { onLinkPress } from "#/helpers/Linking";
import SearchResultItem from "#/screens/Search/components/SearchResultItem";

const algoliaClient = searchClient(ALGOLIA_APP_ID, ALGOLIA_SEARCH_KEY);

interface AlgoliaSearchProperties {
  searchString: string;
  maxResults?: number;
  onResultsLength?: (count: number) => void;
}

const AlgoliaSearchResults = ({
  searchString,
  maxResults = 10,
  onResultsLength,
}: AlgoliaSearchProperties) => {
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const router = useRouter();

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
        const { hits } = await algoliaClient.searchSingleIndex({
          indexName: ALGOLIA_INDEX_NAME,
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
        <ErrorCard text="Suche fehlgeschlagen. Bitte versuche es erneut." />
      </View>
    );
  }

  if (results.length === 0 && searchString.length >= 2) {
    return (
      <View style={itemStyles.emptyContainer}>
        <UiText>Keine Ergebnisse gefunden</UiText>
      </View>
    );
  }

  return (
    <FlatList
      data={results}
      contentContainerStyle={{
        paddingBottom: 100,
        paddingHorizontal: 20,
        gap: 20,
      }}
      keyExtractor={(item) => item.objectID}
      renderItem={renderItem}
      initialNumToRender={5}
      maxToRenderPerBatch={10}
      windowSize={5}
      keyboardDismissMode="on-drag"
    />
  );
};

const itemStyles = StyleSheet.create({
  emptyContainer: {
    alignItems: "center",
    padding: 20,
  },
});

export default AlgoliaSearchResults;

import { searchClient } from "@algolia/client-search";
import { useRouter } from "expo-router";
import debounce from "lodash/debounce";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet } from "react-native";

import Text from "#/components/design/Text";
import View from "#/components/design/View";
import Colors from "#/constants/Colors";
import { onLinkPress } from "#/helpers/Linking";
import useAppColorScheme from "#/hooks/useAppColorScheme";
import SearchResultItem from "#/screens/Search/components/SearchResultItem";

interface AlgoliaSearchProperties {
  searchString: string;
  maxResults?: number;
}

const AlgoliaSearchResults = ({
  searchString,
  maxResults = 10,
}: AlgoliaSearchProperties) => {
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Initialize Algolia client
  const client = searchClient("W8YO8C6SIN", "f8211e7620b2d30da0d73f451fe36634");
  const colorScheme = useAppColorScheme();
  const highlightColor = Colors[colorScheme].corporate;

  // Create a debounced search function to avoid too many API calls
  const debouncedSearch = useRef(
    debounce(async (query: string) => {
      if (!query || query.length < 2) {
        setResults([]);
        setIsLoading(false);
        return;
      }

      try {
        // Search across multiple indices
        const { hits } = await client.searchSingleIndex({
          indexName: "wp_searchable_posts",
          searchParams: {
            query,
            hitsPerPage: maxResults,
          },
        });
        setResults(hits);
      } catch (error) {
        console.error("Algolia search error:", error);
      } finally {
        setIsLoading(false);
      }
    }, 300),
  ).current;

  useEffect(() => {
    // If there's no search string, clear the results
    if (!searchString) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    debouncedSearch(searchString);

    // Cleanup function to cancel debounced search on unmount
    return () => {
      debouncedSearch.cancel();
    };
  }, [searchString, debouncedSearch]);

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
          subtitle={<Text style={{ textAlign: "right" }}>{date}</Text>}
          onPress={() => handleResultPress(item)}
        />
      );
    },
    [handleResultPress],
  );

  if (isLoading) {
    return (
      <View style={itemStyles.loadingContainer}>
        <ActivityIndicator size="small" color={highlightColor} />
      </View>
    );
  }

  if (results.length === 0 && searchString.length >= 2) {
    return (
      <View style={itemStyles.emptyContainer}>
        <Text>Keine Ergebnisse gefunden</Text>
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
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
});

export default AlgoliaSearchResults;

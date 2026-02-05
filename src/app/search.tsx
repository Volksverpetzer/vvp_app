import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { useShareIntentContext } from "expo-share-intent";
import { useCallback, useRef } from "react";
import { StyleProp, TextInput, TextStyle } from "react-native";

import NavBar from "#/components/bars/NavBar";
import View from "#/components/design/View";
import Colors from "#/constants/Colors";
import useAppColorScheme from "#/hooks/useAppColorScheme";
import AISearch from "#/screens/Search/components/AISearch";
import AlgoliaSearchResults from "#/screens/Search/components/AlgoliaSearch";
import SearchHeader from "#/screens/Search/components/SearchHeader";
import SearchManager from "#/screens/Search/components/SearchManager";
import SearchTutorial from "#/screens/Search/components/SearchTutorial";

const SearchScreen = () => {
  const { shareIntent } = useShareIntentContext();
  const parameters = useLocalSearchParams<{ tag: string }>();
  const tag: string | undefined = parameters?.tag ?? shareIntent?.webUrl;
  const searchReference = useRef<TextInput>(null);
  const colorScheme = useAppColorScheme();
  const backgroundColor = Colors[colorScheme].background;

  // Focus the search input when the screen is focused (unless there's a tag)
  useFocusEffect(
    useCallback(() => {
      if (tag) return;
      const timer = setTimeout(() => {
        searchReference.current?.focus();
      }, 300);
      return () => clearTimeout(timer);
    }, [tag]),
  );

  const textStyle: StyleProp<TextStyle> = { fontSize: 17, textAlign: "left" };

  return (
    <SearchManager initialSearch={tag}>
      {({
        search,
        searchParams,
        resultsLength,
        isLoading,
        setSearch,
        setSearchParams,
        setResultsLength,
        setIsLoading,
      }) => {
        return (
          <View style={{ flex: 1, backgroundColor }}>
            <SearchHeader
              search={search}
              setSearch={setSearch}
              setSearchParams={setSearchParams}
              searchRef={searchReference}
              resultsLength={resultsLength}
              isLoading={isLoading}
              showFaktenbot={true}
            />

            {/* Show Algolia results while typing */}
            {search !== searchParams && search.length > 0 && (
              <AlgoliaSearchResults searchString={search} />
            )}

            {/* Show tutorial when no search is active */}
            {searchParams === "" && search === "" && (
              <SearchTutorial textStyle={textStyle} />
            )}

            {/* Show search results when search is active */}
            {searchParams !== "" && (
              <AISearch
                setIsLoading={setIsLoading}
                search={searchParams}
                setResultsLength={setResultsLength}
                showFaktenbot={true}
              />
            )}

            {/* NavBar at the bottom */}
            <NavBar />
          </View>
        );
      }}
    </SearchManager>
  );
};

export default SearchScreen;

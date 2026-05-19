import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import { View } from "react-native";
import type { TextInput } from "react-native";

import { SafetyIcon, SearchIcon } from "#/components/Icons";
import NavBar from "#/components/bars/NavBar";
import UiTabIconLabel from "#/components/ui/UiTabIconLabel";
import UiTabView from "#/components/ui/UiTabView";
import Colors from "#/constants/Colors";
import { globalStyles } from "#/constants/GlobalStyles";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";
import AISearch from "#/screens/Search/components/AISearch";
import AlgoliaSearchResults from "#/screens/Search/components/AlgoliaSearch";
import SearchHeader from "#/screens/Search/components/SearchHeader";
import SearchManager from "#/screens/Search/components/SearchManager";
import SearchTutorial from "#/screens/Search/components/SearchTutorial";

type SearchTab = "artikel" | "ai";

interface SearchContentProperties {
  search: string;
  searchParams: string;
  resultsLength: number | undefined;
  isLoading: boolean;
  setSearch: (value: string) => void;
  setSearchParams: (value: string) => void;
  setResultsLength: (length: number) => void;
  setIsLoading: (loading: boolean) => void;
  searchRef: RefObject<TextInput>;
}

const SearchContent = ({
  search,
  searchParams,
  resultsLength,
  isLoading,
  setSearch,
  setSearchParams,
  setResultsLength,
  setIsLoading,
  searchRef,
}: SearchContentProperties) => {
  const [activeTab, setActiveTab] = useState<SearchTab>("artikel");
  const [debouncedAISearch, setDebouncedAISearch] = useState(
    searchParams || "",
  );

  const colorScheme = useAppColorScheme();
  const backgroundColor = Colors[colorScheme].surface;

  // Debounce AI search while typing (800ms — AI calls are expensive)
  useEffect(() => {
    if (!search || search.length < 2) {
      setDebouncedAISearch("");
      return;
    }
    const timer = setTimeout(() => setDebouncedAISearch(search), 800);
    return () => clearTimeout(timer);
  }, [search]);

  // On submit: bypass debounce and trigger AI search immediately
  const handleSubmit = useCallback(() => {
    if (search.length >= 2) {
      setDebouncedAISearch(search);
    }
  }, [search]);

  const isAlgoliaActive = search.length >= 2;
  const isAIActive = debouncedAISearch.length >= 2;

  return (
    <View style={[globalStyles.container, { backgroundColor }]}>
      <View style={[globalStyles.content, { flex: 1 }]}>
        <SearchHeader
          search={search}
          setSearch={setSearch}
          setSearchParams={setSearchParams}
          searchRef={searchRef}
          resultsLength={resultsLength}
          isLoading={isLoading}
          showFaktenBot={activeTab === "ai"}
          onSubmit={handleSubmit}
        />

        {/* Tab toggle */}
        <View
          style={{
            alignItems: "center",
            marginTop: -30,
            marginBottom: 16,
          }}
        >
          <UiTabView width={240}>
            <UiTabIconLabel
              icon={(color) => <SearchIcon size={24} color={color} />}
              label="Artikel"
              isActive={activeTab === "artikel"}
              onPress={() => setActiveTab("artikel")}
              style={{ paddingVertical: 10 }}
            />
            <UiTabIconLabel
              icon={(color) => <SafetyIcon size={24} color={color} />}
              label="KI-Faktenbot"
              isActive={activeTab === "ai"}
              onPress={() => setActiveTab("ai")}
              style={{ paddingVertical: 10 }}
            />
          </UiTabView>
        </View>

        {/* Artikel tab — Algolia search while typing */}
        {activeTab === "artikel" &&
          (isAlgoliaActive ? (
            <AlgoliaSearchResults searchString={search} />
          ) : (
            <SearchTutorial tab="artikel" />
          ))}

        {/* KI-Faktenbot tab — AI search while typing (debounced) */}
        {activeTab === "ai" &&
          (isAIActive ? (
            <AISearch
              setIsLoading={setIsLoading}
              search={debouncedAISearch}
              setResultsLength={setResultsLength}
              showFaktenBot={true}
            />
          ) : (
            <SearchTutorial tab="ai" />
          ))}
      </View>

      <NavBar />
    </View>
  );
};

const SearchScreen = () => {
  const parameters = useLocalSearchParams<{ tag: string }>();
  const tag: string | undefined = parameters?.tag;
  const searchReference = useRef<TextInput>(null);

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
      }) => (
        <SearchContent
          search={search}
          searchParams={searchParams}
          resultsLength={resultsLength}
          isLoading={isLoading}
          setSearch={setSearch}
          setSearchParams={setSearchParams}
          setResultsLength={setResultsLength}
          setIsLoading={setIsLoading}
          searchRef={searchReference}
        />
      )}
    </SearchManager>
  );
};

export default SearchScreen;

import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import { View } from "react-native";
import type { TextInput } from "react-native";

import { SafetyIcon, SearchIcon } from "#/components/Icons";
import NavBar from "#/components/bars/NavBar";
import UiEmptyState from "#/components/ui/UiEmptyState";
import UiTabIconLabel from "#/components/ui/UiTabIconLabel";
import UiTabView from "#/components/ui/UiTabView";
import Colors from "#/constants/Colors";
import { globalStyles } from "#/constants/GlobalStyles";
import { iconSizes } from "#/constants/IconSizes";
import { spacing } from "#/constants/Spacing";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";
import AISearch from "#/screens/Search/components/AISearch";
import AlgoliaSearchResults from "#/screens/Search/components/AlgoliaSearch";
import SearchHeader from "#/screens/Search/components/SearchHeader";
import SearchManager from "#/screens/Search/components/SearchManager";

type SearchTab = "artikel" | "ai";

interface SearchContentProperties {
  search: string;
  searchParams: string;
  resultsLength: number | undefined;
  isLoading: boolean;
  setSearch: (value: string) => void;
  setSearchParams: (value: string) => void;
  setResultsLength: (length: number | undefined) => void;
  setIsLoading: (loading: boolean) => void;
  setSearchType: (type: "ai" | "artikel") => void;
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
  setSearchType,
  searchRef,
}: SearchContentProperties) => {
  const [activeTab, setActiveTab] = useState<SearchTab>(
    searchParams.includes("://") ? "ai" : "artikel",
  );

  const handleTabChange = useCallback(
    (tab: SearchTab) => {
      setActiveTab(tab);
      setSearchType(tab);
      // Clear URL-based searchParams when switching to Artikel so effectiveTab
      // resolves to the new activeTab instead of being locked to "ai".
      if (tab === "artikel" && searchParams.includes("://")) {
        setSearchParams("");
      }
    },
    [searchParams, setSearchType, setSearchParams],
  );

  useEffect(() => {
    if (searchParams.includes("://")) {
      setActiveTab("ai");
      setSearchType("ai");
    }
  }, [searchParams, setSearchType]);

  const colorScheme = useAppColorScheme();
  const backgroundColor = Colors[colorScheme].surface;
  const corporate = Colors[colorScheme].primary;

  const hasResults = searchParams.length >= 2;
  // Derive the rendered tab synchronously so URL submissions never flash the
  // Artikel branch before the useEffect fires and updates activeTab.
  const effectiveTab: SearchTab = searchParams.includes("://")
    ? "ai"
    : activeTab;

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
          showFaktenBot={effectiveTab === "ai"}
        />

        {/* Tab toggle */}
        <View
          style={{
            alignItems: "center",
            marginTop: -30,
            marginBottom: spacing.lg,
          }}
        >
          <UiTabView width={240}>
            <UiTabIconLabel
              icon={(color) => <SearchIcon color={color} size={iconSizes.md} />}
              label="Artikel"
              isActive={effectiveTab === "artikel"}
              onPress={() => handleTabChange("artikel")}
              style={{ paddingVertical: spacing.md }}
            />
            <UiTabIconLabel
              icon={(color) => <SafetyIcon color={color} size={iconSizes.md} />}
              label="KI-Faktenbot"
              isActive={effectiveTab === "ai"}
              onPress={() => handleTabChange("ai")}
              style={{ paddingVertical: spacing.md }}
            />
          </UiTabView>
        </View>

        {effectiveTab === "artikel" &&
          (hasResults ? (
            <AlgoliaSearchResults
              searchString={searchParams}
              onResultsLength={setResultsLength}
            />
          ) : (
            <View style={{ flex: 1, justifyContent: "center" }}>
              <UiEmptyState
                testID="tutorial-artikel"
                icon={<SearchIcon color={corporate} />}
              >
                Suchbegriff eingeben, um Artikel zu finden
              </UiEmptyState>
            </View>
          ))}

        {effectiveTab === "ai" &&
          (hasResults ? (
            <AISearch
              setIsLoading={setIsLoading}
              search={searchParams}
              setResultsLength={setResultsLength}
              showFaktenBot={true}
            />
          ) : (
            <View style={{ flex: 1, justifyContent: "center" }}>
              <UiEmptyState
                testID="tutorial-ai"
                icon={<SafetyIcon color={corporate} />}
              >
                Frage, Begriff oder URL eingeben
              </UiEmptyState>
            </View>
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
        setSearchType,
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
          setSearchType={setSearchType}
          searchRef={searchReference}
        />
      )}
    </SearchManager>
  );
};

export default SearchScreen;

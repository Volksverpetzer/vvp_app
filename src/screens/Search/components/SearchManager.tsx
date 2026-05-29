import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";

import Config from "#/constants/Config";
import { Achievements } from "#/helpers/Achievements";
import { registerEvent } from "#/helpers/network/Analytics";

interface SearchManagerProperties {
  initialSearch?: string;
  children: (
    properties: SearchManagerState & SearchManagerActions,
  ) => ReactNode;
}

interface SearchManagerState {
  search: string;
  searchParams: string;
  resultsLength: number | undefined;
  isLoading: boolean;
  isAISearch: boolean;
}

interface SearchManagerActions {
  setSearch: (value: string) => void;
  setSearchParams: (value: string) => void;
  setResultsLength: (length: number | undefined) => void;
  setIsLoading: (loading: boolean) => void;
  setSearchType: (type: "ai" | "artikel") => void;
}

/**
 * SearchManager - Centralized component to manage search state and logic
 * Handles search state, achievements, and analytics
 */
const SearchManager = ({
  initialSearch = "",
  children,
}: SearchManagerProperties) => {
  // Search state
  // Ensure initialSearch is a string, fallback to '' on null/undefined
  const [search, setSearch] = useState<string>(initialSearch || "");
  const [searchParameters, setSearchParameters] =
    useState<string>(initialSearch);
  const [resultsLength, setResultsLength] = useState<number | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [searchType, setSearchType] = useState<"ai" | "artikel">(
    initialSearch?.includes("://") ? "ai" : "artikel",
  );
  const isAISearch = searchType === "ai";

  // Reset resultsLength synchronously so the analytics effect never sees a
  // stale count paired with a new query (useEffect-based reset fires too late).
  const handleSetSearchParams = useCallback((value: string) => {
    setResultsLength(undefined);
    setSearchParameters(value);
  }, []);

  // Clear resultsLength on tab switch so the analytics effect doesn't re-fire
  // with a stale count under the new searchType. Also reset isLoading when
  // switching away from AI: useAISearch skips setIsLoading(false) on abort,
  // which would leave the spinner stuck if the tab is switched mid-request.
  const handleSetSearchType = useCallback((type: "ai" | "artikel") => {
    setResultsLength(undefined);
    setSearchType(type);
    if (type === "artikel") {
      setIsLoading(false);
    }
  }, []);

  // Set search achievement when search is performed
  useEffect(() => {
    if (!searchParameters || searchParameters === "") return;

    Achievements.setAchievementValue("search");

    // Register search analytics event when results are available
    if (resultsLength !== undefined) {
      registerEvent(Config.wpUrl, "search", {
        search: searchParameters,
        results: resultsLength,
        type: isAISearch ? "ai" : "standard",
      });
    }
  }, [resultsLength, searchParameters, isAISearch]);

  // Set rechercheur achievement if Algolia search contains a URL (not AI search)
  useEffect(() => {
    if (!isAISearch && searchParameters && searchParameters.includes("://")) {
      Achievements.setAchievementValue("rechercheur");
    }
  }, [isAISearch, searchParameters]);

  // Update search when initialSearch changes (for shareIntent)
  useEffect(() => {
    if (initialSearch) {
      setSearch(initialSearch);
      setResultsLength(undefined);
      setSearchParameters(initialSearch);
      setSearchType(initialSearch.includes("://") ? "ai" : "artikel");
    }
  }, [initialSearch]);

  return (
    <>
      {children({
        search,
        searchParams: searchParameters,
        resultsLength,
        isLoading,
        isAISearch,
        setSearch,
        setSearchParams: handleSetSearchParams,
        setResultsLength,
        setIsLoading,
        setSearchType: handleSetSearchType,
      })}
    </>
  );
};

export default SearchManager;

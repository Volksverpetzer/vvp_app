import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";

import Config from "#/constants/Config";
import { Achievements } from "#/helpers/Achievements";
import { consumeShareIntentUrl } from "#/helpers/ShareIntent";
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
        search_source: "app",
        search_type: isAISearch ? "ai" : "standard",
        result_count: resultsLength,
      });
    }
  }, [resultsLength, searchParameters, isAISearch]);

  // Update search when initialSearch changes (for shareIntent). Routed
  // through handleSetSearchType/handleSetSearchParams (rather than the raw
  // setters) so a share arriving mid-AI-request also clears a stuck spinner.
  useEffect(() => {
    if (initialSearch) {
      setSearch(initialSearch);
      const type = initialSearch.includes("://") ? "ai" : "artikel";
      handleSetSearchType(type);
      handleSetSearchParams(initialSearch);

      // rechercheur rewards sharing a link into the app via the OS share
      // sheet specifically, not just pasting/typing a URL into the search
      // field — consumeShareIntentUrl only returns true for a URL that was
      // just marked by handle-share.tsx.
      if (type === "ai" && consumeShareIntentUrl(initialSearch)) {
        Achievements.setAchievementValue("rechercheur");
      }
    }
  }, [initialSearch, handleSetSearchType, handleSetSearchParams]);

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

// Using the buffer package that's available through expo dependencies
import { Buffer } from "buffer/";
import { useCallback, useEffect, useState } from "react";

import Config from "#/constants/Config";
import { registerEvent } from "#/helpers/network/Analytics";
import IntelligenceAPI from "#/helpers/network/IntelligenceAPI";
import { AISearchResponse } from "#/types";

export interface UseAISearchProperties {
  search: string;
  setResultsLength: (n: number) => void;
  setIsLoading: (b: boolean) => void;
}

/**
 * Custom hook to manage the AI search functionality.
 *
 * This hook fetches the search results from the API and stores them in the component state.
 * It also updates the search results length and loading state.
 * In case of an error, it sets the error message and resets the search results length to 0.
 * It also handles scrolling to the next or previous result.
 *
 * @param {UseAISearchProperties} props
 * @returns {{ results: AISearchResponse[], error: string, loadingMessage: string, currentIndex: number, flatListRef: React.RefObject<FlatList<AISearchResponse>>, reactionValue: number }}
 */
export function useAISearch({
  search,
  setResultsLength,
  setIsLoading,
}: UseAISearchProperties) {
  const [results, setResults] = useState<AISearchResponse[]>([]);
  const [error, setError] = useState<string>("");
  const [loadingMessage, setLoadingMessage] = useState<string>("");

  const fetchResults = async () => {
    setError("");
    setResults([]);
    setIsLoading(true);
    setLoadingMessage("KI-Suche aktiviert - kann kurz dauern");
    let queryText = search;
    registerEvent(Config.wpUrl, "search", { query: search });
    if (search.includes("x.com")) {
      setLoadingMessage("Lade Vorschau von x.com...");
      try {
        const r = await fetch(`https://publish.x.com/oembed?url=${search}`);
        const json = await r.json();
        const html_p = json.html || "";
        queryText = html_p.replaceAll(/<[^>]+>/g, " ");
      } catch {
        setError("Fehler beim Laden der Vorschau");
        setResultsLength(0);
        setIsLoading(false);
        return;
      }
      setLoadingMessage("KI-Suche aktiviert - kann kurz dauern");
    } else if (search.startsWith("http")) {
      try {
        const response = await fetch(search);
        let html = await response.text();
        html = html.replaceAll(/<script[\s\S]*?<\/script>/gi, "");
        html = html.replaceAll(/<style[\s\S]*?<\/style>/gi, "");
        queryText = html.replaceAll(/<[^>]+>/g, " "); //
      } catch {
        setError("Fehler beim Laden der Seite");
        setResultsLength(0);
        setIsLoading(false);
        return;
      }
    }
    setLoadingMessage("KI-Suche aktiviert - kann kurz dauern");
    try {
      const data = await IntelligenceAPI.vectorSearch(queryText);
      // decode only if mis-encoded
      const decoded = data.map((item) => {
        let text = item.text;
        if (/Ã/.test(text)) {
          try {
            text = Buffer.from(text, "latin1").toString("utf8");
          } catch (error_) {
            console.warn("Buffer conversion error:", error_);
          }
        }
        return { ...item, text };
      });
      const count = decoded.length;
      setResultsLength(count);
      if (count > 0) {
        setResults(decoded);
      } else {
        setError("Keine passenden Ergebnisse gefunden");
      }
    } catch {
      setError("Fehler bei der Suche");
      setResultsLength(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [search]);

  // Determine reaction value based on error state and results length
  let reactionValue = 0;

  if (!error && results.length > 0) {
    reactionValue = results.length <= 3 ? 5 : 10;
  }

  const reload = useCallback(() => {
    setResults([]);
    setResultsLength(0);
    setIsLoading(true);
    fetchResults();
  }, []);

  return { results, error, loadingMessage, reactionValue, reload };
}

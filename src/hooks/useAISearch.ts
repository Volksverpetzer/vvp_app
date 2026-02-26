import { Buffer } from "buffer";
import { useCallback, useEffect, useRef, useState } from "react";

import { FaktenbotReaction } from "#/components/animations/Faktenbot";
import Config from "#/constants/Config";
import { registerEvent } from "#/helpers/network/Analytics";
import IntelligenceAPI from "#/helpers/network/IntelligenceAPI";
import { AISearchResponse } from "#/types";

interface UseAISearchProperties {
  search: string;
  setResultsLength: (n: number) => void;
  setIsLoading: (b: boolean) => void;
}

interface UseAISearchResultProperties {
  results: AISearchResponse[];
  error: string;
  loadingMessage: string;
  reactionValue: FaktenbotReaction;
  reload: () => void;
}

/**
 * Custom hook to manage the AI search functionality.
 *
 * This hook fetches the search results from the API and stores them in the component state.
 * It also updates the search results length and loading state.
 * In case of an error, it sets the error message and resets the search results length to 0.
 * It also handles scrolling to the next or previous result.
 */
export const useAISearch = ({
  search,
  setResultsLength,
  setIsLoading,
}: UseAISearchProperties): UseAISearchResultProperties => {
  const [results, setResults] = useState<AISearchResponse[]>([]);
  const [error, setError] = useState<string>("");
  const [loadingMessage, setLoadingMessage] = useState<string>("");
  const activeControllerRef = useRef<AbortController | null>(null);

  const fetchResults = useCallback(
    async (signal?: AbortSignal) => {
      setError("");
      setResults([]);
      setIsLoading(true);
      setLoadingMessage("KI-Suche aktiviert - kann kurz dauern");
      let queryText = search;
      registerEvent(Config.wpUrl, "search", { query: search });
      if (search.includes("x.com")) {
        setLoadingMessage("Lade Vorschau von x.com...");
        try {
          const r = await fetch(`https://publish.x.com/oembed?url=${search}`, {
            signal,
          });
          const json = await r.json();
          if (signal?.aborted) return;
          const html_p = json.html || "";
          queryText = html_p.replaceAll(/<[^>]+>/g, " ");
        } catch {
          if (signal?.aborted) return;
          setError("Fehler beim Laden der Vorschau");
          setResultsLength(0);
          setIsLoading(false);
          return;
        }
        setLoadingMessage("KI-Suche aktiviert - kann kurz dauern");
      } else if (search.startsWith("http")) {
        try {
          const response = await fetch(search, { signal });
          let html = await response.text();
          if (signal?.aborted) return;
          html = html.replaceAll(/<script[\s\S]*?<\/script>/gi, "");
          html = html.replaceAll(/<style[\s\S]*?<\/style>/gi, "");
          queryText = html.replaceAll(/<[^>]+>/g, " "); //
        } catch {
          if (signal?.aborted) return;
          setError("Fehler beim Laden der Seite");
          setResultsLength(0);
          setIsLoading(false);
          return;
        }
      }
      setLoadingMessage("KI-Suche aktiviert - kann kurz dauern");
      try {
        const data = await IntelligenceAPI.vectorSearch(queryText, signal);
        if (signal?.aborted) return;
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
        if (signal?.aborted) return;
        setError("Fehler bei der Suche");
        setResultsLength(0);
      } finally {
        if (signal?.aborted) return;
        setIsLoading(false);
      }
    },
    [search, setIsLoading, setResultsLength],
  );

  useEffect(() => {
    const controller = new AbortController();
    activeControllerRef.current?.abort();
    activeControllerRef.current = controller;
    void fetchResults(controller.signal);

    return () => {
      controller.abort();
      if (activeControllerRef.current === controller) {
        activeControllerRef.current = null;
      }
    };
  }, [fetchResults]);

  // Determine reaction value based on error state and results length
  let reactionValue: FaktenbotReaction = 0;

  if (!error && results.length > 0) {
    reactionValue = results.length <= 3 ? 5 : 10;
  }

  const reload = useCallback(() => {
    const controller = new AbortController();
    activeControllerRef.current?.abort();
    activeControllerRef.current = controller;
    setResults([]);
    setResultsLength(0);
    setIsLoading(true);
    void fetchResults(controller.signal);
  }, [fetchResults, setIsLoading, setResultsLength]);

  return { results, error, loadingMessage, reactionValue, reload };
};

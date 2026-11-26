import { Buffer } from "buffer";
import { useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";

import type { FaktenBotReaction } from "#/components/animations/FaktenBot";
import IntelligenceAPI from "#/helpers/network/IntelligenceAPI";
import type { AISearchResponse } from "#/types";

interface UseAISearchProperties {
  search: string;
  setResultsLength: (n: number) => void;
  setIsLoading: (b: boolean) => void;
}

interface UseAISearchResultProperties {
  results: AISearchResponse[];
  error: string;
  noResults: boolean;
  loadingMessage: string;
  reactionValue: FaktenBotReaction;
  reload: () => void;
}

/**
 * Upper bound for the text sent to the vector search. Pasted links used to
 * send the whole page (menus, footers, often hundreds of KB); the article
 * topic is well covered by the first few thousand characters.
 */
export const MAX_QUERY_LENGTH = 4000;

/** Collapses whitespace and cuts the text to {@link MAX_QUERY_LENGTH}. */
export const limitQueryText = (text: string): string =>
  text.replaceAll(/\s+/g, " ").trim().slice(0, MAX_QUERY_LENGTH);

/** Strips scripts, styles and tags from a page and returns its plain text. */
export const htmlToQueryText = (html: string): string =>
  limitQueryText(
    html
      .replaceAll(/<script[\s\S]*?<\/script>/gi, "")
      .replaceAll(/<style[\s\S]*?<\/style>/gi, "")
      .replaceAll(/<[^>]+>/g, " "),
  );

/**
 * Turns a URL into search words without loading the page: the host name
 * (minus "www.") and the words of its path slug. Used on web, where the
 * browser can't fetch foreign news sites because of CORS. The query string
 * and fragment are never used, as they can hold tokens or personal data. A
 * URL whose path has no usable words gives just the host name; input that
 * can't be parsed as a URL is used as typed.
 */
export const urlToQueryText = (url: string): string => {
  try {
    const { hostname, pathname } = new URL(url);
    const words = pathname
      .split("/")
      .map((segment) => {
        try {
          return decodeURIComponent(segment);
        } catch {
          return segment;
        }
      })
      .map((segment) => segment.replace(/\.[a-z0-9]+$/i, ""))
      .flatMap((segment) => segment.split(/[-_+\s]+/))
      .filter((word) => word && !/^\d+$/.test(word));
    const host = hostname.replace(/^www\./, "");
    return limitQueryText([host, ...words].join(" "));
  } catch {
    return limitQueryText(url);
  }
};

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
  const [noResults, setNoResults] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string>("");
  const activeControllerRef = useRef<AbortController | null>(null);

  const fetchResults = useCallback(
    async (signal?: AbortSignal) => {
      setError("");
      setNoResults(false);
      setResults([]);
      setIsLoading(true);
      setLoadingMessage("KI-Suche aktiviert - kann kurz dauern");
      let queryText = search;
      // Case-insensitive, so "HTTPS://…" also goes through a URL branch below
      // and never reaches vectorSearch with its query string.
      const isHttpUrl = /^https?:\/\//i.test(search.trim());
      if (search.includes("x.com")) {
        setLoadingMessage("Lade Vorschau von x.com...");
        try {
          const r = await fetch(`https://publish.x.com/oembed?url=${search}`, {
            signal,
          });
          const json = await r.json();
          if (signal?.aborted) return;
          const html_p = json.html || "";
          queryText = limitQueryText(html_p.replaceAll(/<[^>]+>/g, " "));
        } catch {
          if (signal?.aborted) return;
          setError("Fehler beim Laden der Vorschau");
          setResultsLength(0);
          setIsLoading(false);
          return;
        }
        setLoadingMessage("KI-Suche aktiviert - kann kurz dauern");
      } else if (isHttpUrl && Platform.OS === "web") {
        // Browsers block cross-origin page loads (CORS), so search on the
        // words in the URL instead of failing.
        queryText = urlToQueryText(search);
      } else if (isHttpUrl) {
        try {
          const response = await fetch(search, { signal });
          const html = await response.text();
          if (signal?.aborted) return;
          queryText = htmlToQueryText(html);
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
          setNoResults(true);
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
  let reactionValue: FaktenBotReaction = 0;

  if (!error && results.length > 0) {
    reactionValue = results.length <= 3 ? 5 : 10;
  }

  const reload = useCallback(() => {
    const controller = new AbortController();
    activeControllerRef.current?.abort();
    activeControllerRef.current = controller;
    setResults([]);
    setNoResults(false);
    setResultsLength(0);
    setIsLoading(true);
    void fetchResults(controller.signal);
  }, [fetchResults, setIsLoading, setResultsLength]);

  return { results, error, noResults, loadingMessage, reactionValue, reload };
};

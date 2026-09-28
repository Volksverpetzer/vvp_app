import { useRouter } from "expo-router";
import { decode } from "html-entities";
import { useCallback, useEffect, useRef, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";

import { SearchIcon } from "#/components/Icons";
import BackToTopButton from "#/components/buttons/BackToTopButton";
import UiEmptyState from "#/components/ui/UiEmptyState";
import UiErrorCard from "#/components/ui/UiErrorCard";
import UiSpinner from "#/components/ui/UiSpinner";
import UiText from "#/components/ui/UiText";
import { globalStyles } from "#/constants/GlobalStyles";
import { spacing } from "#/constants/Spacing";
import { onLinkPress } from "#/helpers/Linking";
import WordPressAPI from "#/helpers/network/WordPressAPI";
import { useBackToTop } from "#/hooks/useBackToTop";
import SearchResultItem from "#/screens/Search/components/SearchResultItem";
import type { LoadArticlePostProperties } from "#/types";

interface WpSearchProperties {
  searchString: string;
  onResultsLength?: (count: number) => void;
}

const EXCERPT_LINES = 5;
// Same budget VVP's Algolia results use; keeps the text within EXCERPT_LINES
// on typical phone widths so the trailing "..." isn't clipped by the clamp.
const EXCERPT_MAX_CHARS = 200;

const stripHtml = (html: string) =>
  decode(html.replaceAll(/<[^>]*>/g, " "))
    .replaceAll(/\s+/g, " ")
    .trim();

// WordPress' own excerpt is always present; Yoast's description is only a
// fallback for posts whose excerpt is empty. Always ends in "..." (WordPress
// excerpts are already truncated), replacing WordPress' own "[…]" marker.
const getExcerptHtml = (item: LoadArticlePostProperties) => {
  const plain = stripHtml(
    item.excerpt?.rendered || item.yoast_head_json?.description || "",
  ).replace(/\s*(\[…\]|\[&hellip;\]|…|\.{3})$/, "");
  if (!plain) return "<p></p>";
  const truncated = plain.length > EXCERPT_MAX_CHARS;
  const cut = truncated
    ? plain.slice(0, EXCERPT_MAX_CHARS).replace(/\s+\S*$/, "")
    : plain;
  return `<p>${escapeHtml(cut)}...</p>`;
};

const escapeHtml = (text: string) =>
  text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

const formatDate = (iso: string) => {
  const date = new Date(iso);
  return `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`;
};

/**
 * Article search against the WordPress REST API of the app's own site
 * (Config.wpUrl). Used by variants without an Algolia index.
 */
const WpSearchResults = ({
  searchString,
  onResultsLength,
}: WpSearchProperties) => {
  const [results, setResults] = useState<LoadArticlePostProperties[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const router = useRouter();
  const listReference = useRef<FlatList>(null);
  const backToTop = useBackToTop();

  useEffect(() => {
    if (!searchString || searchString.length < 2) {
      setResults([]);
      setHasError(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setHasError(false);
    const controller = new AbortController();

    const timer = setTimeout(async () => {
      try {
        const posts = await WordPressAPI.searchPosts(
          searchString,
          1,
          controller.signal,
        );
        if (controller.signal.aborted) return;
        setResults(posts);
        onResultsLength?.(posts.length);
        setIsLoading(false);
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("WordPress search error:", error);
        setResults([]);
        setHasError(true);
        setIsLoading(false);
      }
    }, 300);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [searchString, onResultsLength]);

  const renderItem = useCallback(
    ({ item }: { item: LoadArticlePostProperties }) => (
      <SearchResultItem
        title={decode(item.title?.rendered ?? "")}
        text={getExcerptHtml(item)}
        maxLines={EXCERPT_LINES}
        subtitle={
          <UiText style={{ textAlign: "right" }}>
            {formatDate(item.date_gmt)}
          </UiText>
        }
        onPress={() => onLinkPress(item.link, router)}
      />
    ),
    [router],
  );

  if (isLoading) {
    return <UiSpinner text="Artikel werden gesucht …" />;
  }

  if (hasError) {
    return (
      <View style={styles.emptyContainer}>
        <UiErrorCard text="Suche fehlgeschlagen. Bitte versuche es erneut." />
      </View>
    );
  }

  if (results.length === 0 && searchString.length >= 2) {
    return (
      <View style={styles.emptyContainer}>
        <UiEmptyState icon={<SearchIcon />}>
          Keine Ergebnisse gefunden
        </UiEmptyState>
      </View>
    );
  }

  return (
    <View style={globalStyles.container}>
      <FlatList
        ref={listReference}
        data={results}
        contentContainerStyle={{ paddingBottom: 100, gap: spacing.xl }}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        initialNumToRender={5}
        maxToRenderPerBatch={10}
        windowSize={5}
        keyboardDismissMode="on-drag"
        onScroll={backToTop.onScroll}
        scrollEventThrottle={16}
      />
      <BackToTopButton
        visible={backToTop.visible}
        onPress={() =>
          listReference.current?.scrollToOffset({ offset: 0, animated: true })
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
});

export default WpSearchResults;

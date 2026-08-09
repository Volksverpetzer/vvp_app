import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { decode } from "html-entities";
import { useCallback, useRef } from "react";
import { FlatList, StyleSheet, View } from "react-native";

import { SafetyIcon } from "#/components/Icons";
import FaktenBot from "#/components/animations/FaktenBot";
import BackToTopButton from "#/components/buttons/BackToTopButton";
import Typography from "#/components/ui/Typography";
import UiEmptyState from "#/components/ui/UiEmptyState";
import UiPressable from "#/components/ui/UiPressable";
import UiSpinner from "#/components/ui/UiSpinner";
import UiText from "#/components/ui/UiText";
import { radii } from "#/constants/BorderRadius";
import Colors from "#/constants/Colors";
import { globalStyles } from "#/constants/GlobalStyles";
import { spacing } from "#/constants/Spacing";
import { onLinkPress } from "#/helpers/Linking";
import { useAISearch } from "#/hooks/useAISearch";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";
import { useBackToTop } from "#/hooks/useBackToTop";
import SearchResultItem from "#/screens/Search/components/SearchResultItem";
import type { AISearchResponse } from "#/types";

interface AISearchProperties {
  search: string;
  setResultsLength: (results: number) => void;
  setIsLoading: (loading: boolean) => void;
  showFaktenBot?: boolean;
}

const AISearch = ({
  search,
  setResultsLength,
  setIsLoading,
  showFaktenBot = false,
}: AISearchProperties) => {
  const { results, error, noResults, loadingMessage, reactionValue, reload } =
    useAISearch({ search, setResultsLength, setIsLoading });
  const router = useRouter();
  const colorScheme = useAppColorScheme();
  const corporate = Colors[colorScheme].primary;
  const listReference = useRef<FlatList>(null);
  const backToTop = useBackToTop();

  const renderItem = useCallback(
    ({ item }: { item: AISearchResponse }) => {
      const hostname = Linking.parse(item.url).hostname;
      return (
        <SearchResultItem
          title={decode(item.title)}
          onPress={() => onLinkPress(item.url, router)}
          text={item.text}
          collapsible
          subtitle={<Typography type="meta">{hostname ?? item.url}</Typography>}
        />
      );
    },
    [router],
  );

  if (results.length === 0 && !error && !noResults) {
    return (
      <View style={globalStyles.centered}>
        <UiSpinner
          text={loadingMessage || "KI-Suche aktiviert - kann kurz dauern"}
        />
        {showFaktenBot && (
          <View style={{ position: "absolute", top: 20, right: 20 }}>
            <FaktenBot search={true} reaction={reactionValue} />
          </View>
        )}
      </View>
    );
  }

  if (noResults) {
    return (
      <View style={globalStyles.centered}>
        <UiEmptyState icon={<SafetyIcon />}>
          Keine passenden Ergebnisse gefunden
        </UiEmptyState>
      </View>
    );
  }

  if (error) {
    return (
      <View style={globalStyles.centered}>
        <UiText>{error}</UiText>
        <UiText>Melde uns den Fake hier:</UiText>
        <UiPressable
          accessibilityRole="button"
          onPress={() => {
            router.navigate({
              pathname: "/contact",
              params: { category: "app_feedback", url: search },
            });
          }}
          style={[
            globalStyles.row,
            styles.reportButton,
            { backgroundColor: corporate },
          ]}
        >
          <UiText style={globalStyles.whiteText}>Jetzt melden</UiText>
        </UiPressable>
        <UiPressable
          accessibilityRole="button"
          onPress={() => {
            reload();
          }}
          style={[
            globalStyles.row,
            styles.reportButton,
            { backgroundColor: corporate, marginTop: spacing.md },
          ]}
        >
          <UiText style={globalStyles.whiteText}>Neu Laden</UiText>
        </UiPressable>
        {showFaktenBot && (
          <View style={{ position: "absolute", top: 20, right: 20 }}>
            <FaktenBot search={false} reaction={reactionValue} />
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={{ flex: 1, height: "100%", paddingTop: spacing.xl }}>
      {showFaktenBot && (
        <View style={{ position: "absolute", top: 20, right: 20, zIndex: 10 }}>
          <FaktenBot search={false} reaction={reactionValue} />
        </View>
      )}
      <FlatList
        ref={listReference}
        data={results}
        keyExtractor={(_, index) => index.toString()}
        contentContainerStyle={{
          paddingBottom: 100,
          gap: spacing.xl,
        }}
        renderItem={renderItem}
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
  counterText: {
    textAlign: "center",
  },
  reportButton: {
    borderRadius: radii.md,
    justifyContent: "center",
    margin: spacing.md,
    padding: spacing.md,
    width: "50%",
  },
  urlButton: {
    borderRadius: radii.md,
    justifyContent: "center",
    margin: spacing.md,
    padding: spacing.md,
  },
});

export default AISearch;

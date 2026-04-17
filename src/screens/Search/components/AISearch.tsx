import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { decode } from "html-entities";
import { useCallback } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";

import Faktenbot from "#/components/animations/Faktenbot";
import UiSpinner from "#/components/ui/UiSpinner";
import UiText from "#/components/ui/UiText";
import Colors from "#/constants/Colors";
import { styles as globalStyles } from "#/constants/Styles";
import { onLinkPress } from "#/helpers/Linking";
import { useAISearch } from "#/hooks/useAISearch";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";
import SearchResultItem from "#/screens/Search/components/SearchResultItem";
import type { AISearchResponse } from "#/types";

interface AISearchProperties {
  search: string;
  setResultsLength: (results: number) => void;
  setIsLoading: (loading: boolean) => void;
  showFaktenbot?: boolean;
}

const AISearch = ({
  search,
  setResultsLength,
  setIsLoading,
  showFaktenbot = false,
}: AISearchProperties) => {
  const { results, error, loadingMessage, reactionValue, reload } = useAISearch(
    { search, setResultsLength, setIsLoading },
  );
  const router = useRouter();
  const colorScheme = useAppColorScheme();
  const corporate = Colors[colorScheme].primary;
  const textColor = Colors[colorScheme].text;

  const renderItem = useCallback(
    ({ item }: { item: AISearchResponse }) => {
      const hostname = Linking.parse(item.url).hostname;
      return (
        <SearchResultItem
          title={decode(item.title)}
          onPress={() => onLinkPress(item.url, router)}
          text={item.text}
          subtitle={
            <UiText
              style={{ fontWeight: "bold", color: textColor, fontSize: 16 }}
            >
              {hostname ?? item.url}
            </UiText>
          }
        />
      );
    },
    [textColor, router],
  );

  if (results.length === 0 && !error) {
    return (
      <View style={[localStyles.centeredContainer, { paddingTop: 100 }]}>
        <UiText>
          {loadingMessage || "KI-Suche aktiviert - kann kurz dauern"}
        </UiText>
        <UiSpinner size="large" />
        {showFaktenbot && (
          <View style={{ position: "absolute", top: 20, right: 20 }}>
            <Faktenbot search={true} reaction={reactionValue} />
          </View>
        )}
      </View>
    );
  }

  if (error) {
    return (
      <View style={[localStyles.centeredContainer, { paddingTop: 100 }]}>
        <UiText>{error}</UiText>
        <UiText>Melde uns den Fake hier:</UiText>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            router.navigate({ pathname: "/report", params: { url: search } });
          }}
          style={[
            globalStyles.row,
            localStyles.reportButton,
            { backgroundColor: corporate },
          ]}
        >
          <UiText style={globalStyles.whiteText}>Jetzt melden</UiText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            reload();
          }}
          style={[
            globalStyles.row,
            localStyles.reportButton,
            { backgroundColor: corporate, marginTop: 10 },
          ]}
        >
          <UiText style={globalStyles.whiteText}>Neu Laden</UiText>
        </Pressable>
        {showFaktenbot && (
          <View style={{ position: "absolute", top: 20, right: 20 }}>
            <Faktenbot search={false} reaction={reactionValue} />
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={{ flex: 1, height: "100%", paddingTop: 20 }}>
      {showFaktenbot && (
        <View style={{ position: "absolute", top: 20, right: 20, zIndex: 10 }}>
          <Faktenbot search={false} reaction={reactionValue} />
        </View>
      )}
      <FlatList
        data={results}
        keyExtractor={(_, index) => index.toString()}
        contentContainerStyle={{
          paddingBottom: 200,
          paddingHorizontal: 20,
          gap: 20,
        }}
        ListHeaderComponent={
          <UiText style={{ textAlign: "center", marginVertical: 10 }}>
            Ergebnisse der KI-Suche
          </UiText>
        }
        renderItem={renderItem}
      />
    </View>
  );
};

const localStyles = StyleSheet.create({
  centeredContainer: {
    ...globalStyles.centered,
  },
  counterText: {
    textAlign: "center",
  },
  reportButton: {
    borderRadius: 10,
    justifyContent: "center",
    margin: 10,
    padding: 10,
    width: "50%",
  },
  urlButton: {
    borderRadius: 10,
    justifyContent: "center",
    margin: 10,
    padding: 10,
  },
});

export default AISearch;

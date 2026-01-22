import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { decode } from "html-entities";
import { useCallback, useMemo } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import RenderHtml from "react-native-render-html";

import AnimatedLoading from "#/components/animations/AnimatedLoading";
import Faktenbot from "#/components/animations/Faktenbot";
import Text from "#/components/design/Text";
import Colors from "#/constants/Colors";
import { styles as globalStyles } from "#/constants/Styles";
import { onLinkPress } from "#/helpers/Linking";
import { useAISearch } from "#/hooks/useAISearch";
import useColorScheme from "#/hooks/useColorScheme";
import { AISearchResponse } from "#/types";

type FaktenbotReaction = 0 | 5 | 10;

interface AISearchProperties {
  search: string;
  setResultsLength: (results: number) => void;
  setIsLoading: (loading: boolean) => void;
  showFaktenbot?: boolean;
}

/**
 *
 */
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
  const { width } = useWindowDimensions();
  const colorScheme = useColorScheme();
  const corporate = Colors[colorScheme].corporate;
  const textColor = Colors[colorScheme].text;

  const tagStyles = useMemo(
    () => ({
      a: {
        color: corporate,
        textDecorationLine: "underline" as const,
        textDecorationColor: corporate,
      },
      p: { color: textColor },
    }),
    [corporate, textColor],
  );

  const renderItem = useCallback(
    ({ item }: { item: AISearchResponse }) => {
      const hostname = Linking.parse(item.url).hostname;
      return (
        <Pressable
          accessibilityRole="button"
          style={[
            globalStyles.centered,
            { padding: 30, borderBottomWidth: 1, borderBottomColor: textColor },
          ]}
          onPress={() => onLinkPress(item.url, router)}
        >
          {item.title && (
            <Text
              style={{ fontWeight: "bold", color: textColor, fontSize: 16 }}
            >
              {decode(item.title)}
            </Text>
          )}
          <RenderHtml
            source={{ html: item.text }}
            tagsStyles={tagStyles}
            contentWidth={width - 60}
            baseStyle={{
              color: textColor,
              width: width - 60,
              maxHeight: 200,
              overflow: "hidden",
            }}
            ignoredDomTags={["img", "script", "iframe", "style"]}
          />
          <Text style={{ fontWeight: "bold", color: textColor, fontSize: 16 }}>
            {hostname ?? item.url}
          </Text>
        </Pressable>
      );
    },
    [width, tagStyles, textColor, router],
  );

  if (results.length === 0 && !error) {
    return (
      <View style={[localStyles.centeredContainer, { paddingTop: 100 }]}>
        <Text>{loadingMessage || "KI-Suche aktiviert - kann kurz dauern"}</Text>
        <AnimatedLoading />
        {showFaktenbot && (
          <View style={{ position: "absolute", top: 20, right: 20 }}>
            <Faktenbot
              search={true}
              reaction={reactionValue as FaktenbotReaction}
            />
          </View>
        )}
      </View>
    );
  }

  if (error) {
    return (
      <View style={[localStyles.centeredContainer, { paddingTop: 100 }]}>
        <Text>{error}</Text>
        <Text>Melde uns den Fake hier:</Text>
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
          <Text style={globalStyles.whiteText}>Jetzt melden</Text>
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
          <Text style={globalStyles.whiteText}>Neu Laden</Text>
        </Pressable>
        {showFaktenbot && (
          <View style={{ position: "absolute", top: 20, right: 20 }}>
            <Faktenbot search={false} reaction={reactionValue as 0 | 5 | 10} />
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={{ flex: 1, height: "100%", paddingTop: 20 }}>
      {showFaktenbot && (
        <View style={{ position: "absolute", top: 20, right: 20, zIndex: 10 }}>
          <Faktenbot search={false} reaction={reactionValue as 0 | 5 | 10} />
        </View>
      )}
      <FlatList
        data={results}
        keyExtractor={(_, index) => index.toString()}
        contentContainerStyle={{ paddingBottom: 200 }}
        ListHeaderComponent={
          <Text style={{ textAlign: "center", marginVertical: 10 }}>
            Ergebnisse der KI-Suche
          </Text>
        }
        renderItem={renderItem}
      />
    </View>
  );
};

const localStyles = StyleSheet.create({
  centeredContainer: {
    flex: 1,
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

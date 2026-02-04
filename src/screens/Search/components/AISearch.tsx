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
import Card from "#/components/design/Card";
import Text from "#/components/design/Text";
import Colors from "#/constants/Colors";
import { styles as globalStyles, styles } from "#/constants/Styles";
import { onLinkPress } from "#/helpers/Linking";
import { useAISearch } from "#/hooks/useAISearch";
import useAppColorScheme from "#/hooks/useAppColorScheme";
import { AISearchResponse } from "#/types";

interface AISearchProperties {
  search: string;
  setResultsLength: (results: number) => void;
  setIsLoading: (loading: boolean) => void;
  showFaktenbot?: boolean;
}

// Konstanten außerhalb der Komponente sind immer stabil
const IGNORED_DOM_TAGS = ["img", "script", "iframe", "style"];

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
  const colorScheme = useAppColorScheme();
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

  // Memoize baseStyle so it isn't recreated every render
  const renderHtmlBaseStyle = useMemo(
    () => ({
      color: textColor,
      width: width - 60,
      maxHeight: 200,
      overflow: "hidden" as const,
    }),
    [textColor, width],
  );

  // Memoize Pressable item container style array
  const itemContainerStyle = useMemo(
    () => [
      globalStyles.centered,
      { padding: 30, borderBottomWidth: 1, borderBottomColor: textColor },
    ],
    [textColor],
  );

  const renderItem = useCallback(
    ({ item }: { item: AISearchResponse }) => {
      const hostname = Linking.parse(item.url).hostname;
      return (
        <Card>
          <Pressable
            accessibilityRole="button"
            style={itemContainerStyle}
            onPress={() => onLinkPress(item.url, router)}
          >
            {item.title && (
              <Text
                style={{
                  ...styles.heading,
                  padding: 0,
                  paddingBottom: 30,
                }}
              >
                {decode(item.title)}
              </Text>
            )}
            <RenderHtml
              source={{ html: item.text }}
              tagsStyles={tagStyles}
              contentWidth={width - 60}
              baseStyle={renderHtmlBaseStyle}
              ignoredDomTags={IGNORED_DOM_TAGS}
            />
            <Text
              style={{ fontWeight: "bold", color: textColor, fontSize: 16 }}
            >
              {hostname ?? item.url}
            </Text>
          </Pressable>
        </Card>
      );
    },
    [
      width,
      tagStyles,
      textColor,
      router,
      itemContainerStyle,
      renderHtmlBaseStyle,
    ],
  );

  if (results.length === 0 && !error) {
    return (
      <View style={[localStyles.centeredContainer, { paddingTop: 100 }]}>
        <Text>{loadingMessage || "KI-Suche aktiviert - kann kurz dauern"}</Text>
        <AnimatedLoading />
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

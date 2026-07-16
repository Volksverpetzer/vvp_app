import type { RefObject } from "react";
import { useCallback } from "react";
import { Keyboard, TextInput, View } from "react-native";

import { SearchIcon } from "#/components/Icons";
import FaktenBot from "#/components/animations/FaktenBot";
import { fontSizes } from "#/components/typography/fontSizes";
import UiHeaderGradient from "#/components/ui/UiHeaderGradient";
import UiPressable from "#/components/ui/UiPressable";
import UiText from "#/components/ui/UiText";
import Colors from "#/constants/Colors";
import { INPUT_FONT_SIZE, globalStyles } from "#/constants/GlobalStyles";
import { toast } from "#/helpers/toast";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";

interface SearchHeaderProperties {
  search: string;
  setSearch: (value: string) => void;
  setSearchParams: (value: string) => void;
  searchRef: RefObject<TextInput>;
  resultsLength?: number;
  isLoading: boolean;
  showFaktenBot?: boolean;
  onSubmit?: () => void;
}

const SearchHeader = ({
  search,
  setSearch,
  setSearchParams,
  searchRef,
  resultsLength,
  isLoading,
  showFaktenBot = true,
  onSubmit,
}: SearchHeaderProperties) => {
  const colorScheme = useAppColorScheme();
  const corporate = Colors[colorScheme].primary;

  // Show no reaction while loading so we don't display a stale previous result
  const faktenBotReaction =
    !isLoading && resultsLength !== undefined
      ? resultsLength > 0
        ? 10
        : 0
      : undefined;

  const handleSubmit = useCallback(() => {
    const trimmed = search.trim();
    if (trimmed.length < 2) {
      toast.info("Bitte mindestens 2 Zeichen eingeben");
      return;
    }
    if (trimmed !== search) setSearch(trimmed);
    setSearchParams(trimmed);
    Keyboard.dismiss();
    if (onSubmit) {
      onSubmit();
    }
  }, [search, setSearch, setSearchParams, onSubmit]);

  return (
    <>
      <UiHeaderGradient
        style={[
          globalStyles.row,
          {
            height: 100,
            justifyContent: "flex-end",
            paddingRight: 20,
          },
        ]}
      >
        <UiText
          style={{
            paddingTop: 20,
            fontFamily: "SourceSansProBold",
            fontSize: fontSizes.xxl,
            color: corporate,
            flex: 1,
            textAlign: "center",
          }}
        >
          {showFaktenBot ? "Fact Check" : "Artikel-Suche"}
        </UiText>
        {showFaktenBot && (
          <View
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              right: 0,
              justifyContent: "center",
            }}
          >
            <FaktenBot reaction={faktenBotReaction} search={isLoading} />
          </View>
        )}
      </UiHeaderGradient>
      <View
        style={[
          globalStyles.row,
          globalStyles.input,
          {
            height: 50,
            paddingRight: 40,
            backgroundColor: corporate,
            marginBottom: 40,
          },
        ]}
      >
        <TextInput
          accessibilityLabel="Text input field"
          accessibilityHint="Füge Text ein und drücke Enter um zu suchen"
          clearButtonMode="always"
          value={search}
          ref={searchRef}
          placeholder="Suche ..."
          placeholderTextColor="white"
          onSubmitEditing={handleSubmit}
          style={[
            globalStyles.whiteText,
            {
              fontFamily: "SourceSansPro",
              fontSize: INPUT_FONT_SIZE,
              width: "100%",
            },
          ]}
          onChangeText={setSearch}
          returnKeyType="search"
        />
        <UiPressable accessibilityRole="button" onPress={handleSubmit}>
          <SearchIcon color="white" size={24} />
        </UiPressable>
      </View>
    </>
  );
};

export default SearchHeader;

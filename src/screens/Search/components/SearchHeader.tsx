import type { RefObject } from "react";
import { useCallback } from "react";
import { Keyboard, Pressable, TextInput } from "react-native";

import { SearchIcon } from "#/components/Icons";
import FaktenBot from "#/components/animations/FaktenBot";
import View from "#/components/design/View";
import UiText from "#/components/ui/UiText";
import Colors from "#/constants/Colors";
import { styles } from "#/constants/Styles";
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
  const backgroundColor = Colors[colorScheme].surface;
  const corporate = Colors[colorScheme].primary;

  // Extract the nested ternary operation into an independent variable
  let faktenBotReaction;
  if (resultsLength === undefined) {
    faktenBotReaction = undefined;
  } else {
    faktenBotReaction = resultsLength > 0 ? 10 : 0;
  }

  const handleSubmit = useCallback(() => {
    setSearchParams(search);
    Keyboard.dismiss();
    if (onSubmit) {
      onSubmit();
    }
  }, [search, setSearchParams, onSubmit]);

  return (
    <>
      <View
        style={{
          ...styles.row,
          height: 100,
          justifyContent: "flex-end",
          paddingRight: 20,
          backgroundColor,
        }}
      >
        <UiText
          style={{
            paddingTop: 20,
            fontFamily: "SourceSansProBold",
            fontSize: 22,
            color: corporate,
          }}
        >
          Fact Check
        </UiText>
        {showFaktenBot && (
          <FaktenBot reaction={faktenBotReaction} search={isLoading} />
        )}
      </View>
      <View
        style={{
          ...styles.row,
          ...styles.input,
          ...styles.feed,
          height: 50,
          paddingRight: 40,
          backgroundColor: corporate,
          marginBottom: 40,
        }}
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
          style={{ ...styles.whiteText, width: "100%" }}
          onChangeText={setSearch}
          returnKeyType="search"
        />
        <Pressable accessibilityRole="button" onPress={handleSubmit}>
          <SearchIcon color="white" size={24} />
        </Pressable>
      </View>
    </>
  );
};

export default SearchHeader;

import { RefObject, useCallback } from "react";
import { Keyboard, Pressable, TextInput } from "react-native";

import { Search } from "#/components/Icons";
import Faktenbot from "#/components/animations/Faktenbot";
import Text from "#/components/design/Text";
import View from "#/components/design/View";
import Colors from "#/constants/Colors";
import { styles } from "#/constants/Styles";
import useAppColorScheme from "#/hooks/useAppColorScheme";

interface SearchHeaderProperties {
  search: string;
  setSearch: (value: string) => void;
  setSearchParams: (value: string) => void;
  searchRef: RefObject<TextInput>;
  resultsLength?: number;
  isLoading: boolean;
  showFaktenbot?: boolean;
  onSubmit?: () => void;
}

const SearchHeader = ({
  search,
  setSearch,
  setSearchParams,
  searchRef,
  resultsLength,
  isLoading,
  showFaktenbot = true,
  onSubmit,
}: SearchHeaderProperties) => {
  const colorScheme = useAppColorScheme();
  const corporate = Colors[colorScheme].corporate;

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
        }}
      >
        <Text
          style={{
            paddingTop: 20,
            fontFamily: "SourceSansProBold",
            fontSize: 22,
            color: corporate,
          }}
        >
          Fact Check
        </Text>
        {showFaktenbot && (
          <Faktenbot reaction={faktenBotReaction} search={isLoading} />
        )}
      </View>
      <View
        style={{
          ...styles.row,
          ...styles.input,
          marginTop: -10,
          height: 50,
          paddingRight: 40,
          backgroundColor: corporate,
          alignSelf: "center",
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
          <Search color="white" width={20} />
        </Pressable>
      </View>
    </>
  );
};

export default SearchHeader;

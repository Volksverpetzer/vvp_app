import { View } from "react-native";

import { SafetyIcon, SearchIcon } from "#/components/Icons";
import UiText from "#/components/ui/UiText";
import Colors from "#/constants/Colors";
import { globalStyles } from "#/constants/GlobalStyles";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";

interface SearchTutorialProperties {
  tab?: "artikel" | "ai";
}

const SearchTutorial = ({ tab = "artikel" }: SearchTutorialProperties) => {
  const colorScheme = useAppColorScheme();
  const corporate = Colors[colorScheme].primary;

  return (
    <View style={[globalStyles.centered, { gap: 12 }]}>
      {tab === "artikel" ? (
        <SearchIcon size={48} color={corporate} />
      ) : (
        <SafetyIcon size={48} color={corporate} />
      )}
      <UiText style={{ textAlign: "center", fontSize: 18 }}>
        {tab === "artikel"
          ? "Gib einen Suchbegriff ein und drücke „Suchen“"
          : "Gib eine Frage, einen Begriff oder eine URL ein und drücke „Suchen“"}
      </UiText>
    </View>
  );
};

export default SearchTutorial;

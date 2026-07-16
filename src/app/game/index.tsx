import { Link } from "expo-router";
import { StyleSheet, View } from "react-native";

import UiPressable from "#/components/ui/UiPressable";
import UiText from "#/components/ui/UiText";
import Colors from "#/constants/Colors";
import { fontSizes } from "#/constants/FontSizes";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";

const HomeScreen = () => {
  const colorScheme = useAppColorScheme();
  return (
    <View
      style={[
        styles.container,
        { backgroundColor: Colors[colorScheme].background },
      ]}
    >
      <UiText size="xxl" style={styles.title}>
        Willkommen zum Memory-Spiel
      </UiText>
      <UiText size="base" style={styles.description}>
        Erlebe verschiedene Memory-Spiele, bei denen du z. B.
        Desinformationstechniken und zugehörige Falschinformationen kennenlernen
        kannst. Wähle ein Spiel aus, um zu beginnen.
      </UiText>
      <UiPressable accessibilityRole="button" style={styles.button}>
        <Link href="/game/DesinformationMemory" style={styles.link}>
          Desinformation Memory
        </Link>
      </UiPressable>
      {/* Weitere Spiele können hier hinzugefügt werden */}
    </View>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#007bff",
    borderRadius: 5,
    marginBottom: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  container: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  description: { marginBottom: 30, textAlign: "center" },
  link: {
    color: "#fff",
    fontFamily: "SourceSansPro",
    fontSize: fontSizes.base,
  },
  title: { fontFamily: "SourceSansProBold", marginBottom: 20 },
});

export default HomeScreen;

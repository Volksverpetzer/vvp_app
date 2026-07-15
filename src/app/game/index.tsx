import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import UiPressable from "#/components/ui/UiPressable";
import Colors from "#/constants/Colors";
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
      <Text style={styles.title}>Willkommen zum Memory-Spiel</Text>
      <Text style={styles.description}>
        Erleben Sie verschiedene Memory-Spiele, bei denen Sie z. B.
        Desinformationstechniken und zugehörige Falschinformationen kennenlernen
        können. Wählen Sie ein Spiel aus, um zu beginnen.
      </Text>
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
  description: {
    fontFamily: "SourceSansPro",
    fontSize: 16,
    marginBottom: 30,
    textAlign: "center",
  },
  link: { color: "#fff", fontFamily: "SourceSansPro", fontSize: 16 },
  title: { fontSize: 24, fontFamily: "SourceSansProBold", marginBottom: 20 },
});

export default HomeScreen;

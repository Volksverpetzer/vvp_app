import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";

import UiButton from "#/components/ui/UiButton";
import UiText from "#/components/ui/UiText";
import Colors from "#/constants/Colors";
import { spacing } from "#/constants/Spacing";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";

const HomeScreen = () => {
  const colorScheme = useAppColorScheme();
  const router = useRouter();
  return (
    <View
      style={[
        styles.container,
        { backgroundColor: Colors[colorScheme].background },
      ]}
    >
      <UiText size="xxl" bold style={styles.title}>
        Willkommen zum Memory-Spiel
      </UiText>
      <UiText size="base" style={styles.description}>
        Erlebe verschiedene Memory-Spiele, bei denen du z. B.
        Desinformationstechniken und zugehörige Falschinformationen kennenlernen
        kannst. Wähle ein Spiel aus, um zu beginnen.
      </UiText>
      <UiButton
        label="Desinformation Memory"
        onPress={() => router.push("/game/DesinformationMemory")}
        style={styles.button}
      />
      {/* Weitere Spiele können hier hinzugefügt werden */}
    </View>
  );
};

const styles = StyleSheet.create({
  button: {
    marginBottom: spacing.md,
  },
  container: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: spacing.xl,
  },
  description: { marginBottom: spacing.xxxl, textAlign: "center" },
  title: { marginBottom: spacing.xl },
});

export default HomeScreen;

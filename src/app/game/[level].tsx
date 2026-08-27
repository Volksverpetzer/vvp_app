import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

import UiButton from "#/components/ui/UiButton";
import UiPressable from "#/components/ui/UiPressable";
import UiText from "#/components/ui/UiText";
import { radii } from "#/constants/BorderRadius";
import Colors from "#/constants/Colors";
import { spacing } from "#/constants/Spacing";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";
import MemoryGame from "#/screens/Games/Memory";
import type { DisinfoPair } from "#/types";

type GameParameters = {
  gameId: string;
};

const GameScreen = () => {
  const colorScheme = useAppColorScheme();
  const router = useRouter();
  const { gameId } = useLocalSearchParams<GameParameters>();
  const [level, setLevel] = useState<number>(1);

  // Für Demo: Nur für 'DesinformationMemory'
  let memoryPairs: DisinfoPair[] = [];
  if (gameId === "DesinformationMemory") {
    const allPairs = [
      {
        pairId: "1",
        technique: "Whataboutism",
        misinfo:
          "Anstatt politische Fehlleistungen anzusprechen, fragt der Redner: 'Was ist mit den Problemen in Ihrem Land?', um Verantwortung zu vermeiden.",
        factCheck: "Faktencheck: Whataboutism lenkt vom eigentlichen Thema ab.",
      },
      {
        pairId: "2",
        technique: "Strohmann-Argument",
        misinfo:
          "Das Argument wird verzerrt: 'Sie wollen die Meinungsfreiheit abschaffen', was die tatsächliche Position übertreibt.",
        factCheck:
          "Faktencheck: Ein Strohmann-Argument verzerrt die Position, um sie leichter anzugreifen.",
      },
      {
        pairId: "3",
        technique: "Appell an Emotionen",
        misinfo:
          "Ein Redner sagt: 'Wenn wir jetzt nicht handeln, werden unsere Kinder für immer leiden!', um von sachlichen Argumenten abzulenken.",
        factCheck:
          "Faktencheck: Appelle an Emotionen manipulieren Gefühle statt logischer Beweise.",
      },
      {
        pairId: "4",
        technique: "Falsches Dilemma",
        misinfo:
          "Mit 'Entweder sind Sie für uns oder gegen uns' wird fälschlicherweise nur eine Option dargestellt.",
        factCheck:
          "Faktencheck: Ein falsches Dilemma vereinfacht komplexe Themen auf zwei Extreme.",
      },
      {
        pairId: "5",
        technique: "Ad Hominem",
        misinfo:
          "Der Redner sagt: 'Du bist ein Lügner!', anstatt sachlich zu argumentieren.",
        factCheck:
          "Faktencheck: Ad Hominem-Angriffe zielen auf die Person statt auf das Argument.",
      },
      {
        pairId: "6",
        technique: "Ablenkungsmanöver",
        misinfo:
          "Auf eine Frage zu politischen Fehlern antwortet der Redner: 'Unsere Wirtschaft boomt!', wodurch abgelenkt wird.",
        factCheck:
          "Faktencheck: Ablenkungsmanöver lenken vom eigentlichen Thema ab.",
      },
    ];
    // Level 1: einfach (nur 3 Paare)
    memoryPairs = level === 1 ? allPairs.slice(0, 3) : allPairs;
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: Colors[colorScheme].background },
      ]}
    >
      <UiText size="xl" bold style={styles.title}>
        Memory-Spiel: {gameId}
      </UiText>
      <View style={styles.levelContainer}>
        <UiText size="base" style={styles.levelText}>
          Wähle dein Level:
        </UiText>
        <UiPressable
          accessibilityRole="button"
          style={[
            styles.levelButton,
            level === 1 && styles.levelButtonSelected,
          ]}
          onPress={() => setLevel(1)}
        >
          <UiText style={styles.levelButtonText}>Level 1 (einfach)</UiText>
        </UiPressable>
        <UiPressable
          accessibilityRole="button"
          style={[
            styles.levelButton,
            level === 2 && styles.levelButtonSelected,
          ]}
          onPress={() => setLevel(2)}
        >
          <UiText style={styles.levelButtonText}>Level 2 (schwer)</UiText>
        </UiPressable>
      </View>
      <MemoryGame pairs={memoryPairs} />
      <UiButton
        label="Zurück zur Übersicht"
        onPress={() => router.push("/")}
        style={styles.backButton}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  backButton: {
    marginTop: spacing.xl,
  },
  container: {
    alignItems: "center",
    flex: 1,
    padding: spacing.md,
  },
  levelButton: {
    backgroundColor: "#007bff",
    borderRadius: radii.xs,
    marginHorizontal: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  levelButtonSelected: { backgroundColor: "#0056b3" },
  levelButtonText: { color: "#fff" },
  levelContainer: {
    alignItems: "center",
    flexDirection: "row",
    marginBottom: spacing.xl,
  },
  levelText: { marginRight: spacing.md },
  title: { marginBottom: spacing.xl },
});

export default GameScreen;

import { Link, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import MemoryGame from "#/screens/Games/Memory";
import type { DisinfoPair } from "#/types";

type GameParameters = {
  gameId: string;
};

const GameScreen = () => {
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
    <View style={styles.container}>
      <Text style={styles.title}>Memory-Spiel: {gameId}</Text>
      <View style={styles.levelContainer}>
        <Text style={styles.levelText}>Wählen Sie Ihr Level:</Text>
        <TouchableOpacity
          accessibilityRole="button"
          style={[
            styles.levelButton,
            level === 1 && styles.levelButtonSelected,
          ]}
          onPress={() => setLevel(1)}
        >
          <Text style={styles.levelButtonText}>Level 1 (einfach)</Text>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          style={[
            styles.levelButton,
            level === 2 && styles.levelButtonSelected,
          ]}
          onPress={() => setLevel(2)}
        >
          <Text style={styles.levelButtonText}>Level 2 (schwer)</Text>
        </TouchableOpacity>
      </View>
      <MemoryGame pairs={memoryPairs} />
      <TouchableOpacity accessibilityRole="button" style={styles.backButton}>
        <Link href="/" style={styles.backLink}>
          Zurück zur Übersicht
        </Link>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  backButton: {
    backgroundColor: "#007bff",
    borderRadius: 5,
    marginTop: 20,
    padding: 10,
  },
  backLink: { color: "#fff", fontSize: 16 },
  container: {
    alignItems: "center",
    backgroundColor: "#fff",
    flex: 1,
    padding: 10,
  },
  levelButton: {
    backgroundColor: "#007bff",
    borderRadius: 5,
    marginHorizontal: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  levelButtonSelected: { backgroundColor: "#0056b3" },
  levelButtonText: { color: "#fff" },
  levelContainer: {
    alignItems: "center",
    flexDirection: "row",
    marginBottom: 20,
  },
  levelText: { fontSize: 16, marginRight: 10 },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 20 },
});

export default GameScreen;

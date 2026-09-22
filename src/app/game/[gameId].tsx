import { useLocalSearchParams } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";

import UnicornEasterEgg from "#/components/animations/UnicornEasterEgg";
import NavBar from "#/components/bars/NavBar";
import UiText from "#/components/ui/UiText";
import Colors from "#/constants/Colors";
import { globalStyles } from "#/constants/GlobalStyles";
import { spacing } from "#/constants/Spacing";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";
import MemoryGame from "#/screens/Games/Memory";
import type { DisinfoPair } from "#/types";

type GameParameters = {
  gameId: string;
};

const MAX_LEVEL = 2;

const GameScreen = () => {
  const colorScheme = useAppColorScheme();
  const { gameId } = useLocalSearchParams<GameParameters>();
  const [level, setLevel] = useState(1);
  const [showLevelComplete, setShowLevelComplete] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  // Für Demo: Nur für 'DesinformationMemory'
  const memoryPairs = useMemo<DisinfoPair[]>(() => {
    if (gameId !== "DesinformationMemory") return [];
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
    return level === 1 ? allPairs.slice(0, 3) : allPairs;
  }, [gameId, level]);

  const handleAllMatched = useCallback(() => {
    setShowLevelComplete(true);
  }, []);

  // Advance to the next level only once the celebration popup has finished
  // hiding itself, so the completed board stays visible underneath it
  // instead of reshuffling out from under the popup. Finishing the last
  // level shows a "more to come" screen instead of advancing further.
  const handleLevelCompleteHide = useCallback(() => {
    setShowLevelComplete(false);
    setLevel((current) => {
      if (current >= MAX_LEVEL) {
        setIsFinished(true);
        return current;
      }
      return current + 1;
    });
  }, []);

  return (
    <View
      style={[
        globalStyles.container,
        { backgroundColor: Colors[colorScheme].background },
      ]}
    >
      <NavBar />
      <ScrollView contentContainerStyle={styles.container}>
        <UiText size="xl" bold style={styles.title}>
          Memory-Spiel: {gameId}
        </UiText>
        {isFinished ? (
          <UiText size="lg" bold style={styles.finishedText}>
            Weitere Level folgen bald!
          </UiText>
        ) : (
          <MemoryGame pairs={memoryPairs} onAllMatched={handleAllMatched} />
        )}
      </ScrollView>
      <UnicornEasterEgg
        visible={showLevelComplete}
        onHide={handleLevelCompleteHide}
        message="Juhu, Level geschafft!"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    padding: spacing.md,
  },
  finishedText: {
    marginTop: spacing.xxxl,
    textAlign: "center",
  },
  title: { marginBottom: spacing.xl, textAlign: "center" },
});

export default GameScreen;

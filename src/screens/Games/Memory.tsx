import { useEffect, useRef, useState } from "react";
import type { ViewStyle } from "react-native";
import { Dimensions, StyleSheet, View } from "react-native";
import Toast from "react-native-toast-message";

import UiText from "#/components/ui/UiText";
import { radii } from "#/constants/BorderRadius";
import Colors from "#/constants/Colors";
import { spacing } from "#/constants/Spacing";
import { toast } from "#/helpers/toast";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";
import type { DisinfoPair, MemoryCard } from "#/types";

import CardComponent from "./CardComponent";
import { generateDeck } from "./GameHelper";

interface MemoryGameProperties {
  pairs: DisinfoPair[];
  /** Fired once, the moment the last pair is matched. */
  onAllMatched?: () => void;
}

const MemoryGame = ({ pairs, onAllMatched }: MemoryGameProperties) => {
  const colorScheme = useAppColorScheme();
  const { accent, background, error, surfaceInput, text } = Colors[colorScheme];
  const [deck, setDeck] = useState<MemoryCard[]>([]);
  const [firstCard, setFirstCard] = useState<MemoryCard | undefined>();
  const [secondCard, setSecondCard] = useState<MemoryCard | undefined>();
  // Guards against firing onAllMatched more than once for the same deck —
  // reset whenever a new set of pairs (e.g. the next level) comes in.
  const hasCompletedRef = useRef(false);

  useEffect(() => {
    hasCompletedRef.current = false;
    setDeck(generateDeck(pairs));
    // A new set of pairs (e.g. the next level) starts with a clean
    // selection — otherwise the header would still show the previous
    // level's last (matched) pair until the player tapped a new card.
    setFirstCard(undefined);
    setSecondCard(undefined);
  }, [pairs]);

  useEffect(() => {
    if (
      deck.length > 0 &&
      !hasCompletedRef.current &&
      deck.every((card) => card.isMatched)
    ) {
      hasCompletedRef.current = true;
      onAllMatched?.();
    }
  }, [deck, onAllMatched]);

  useEffect(() => {
    if (firstCard && secondCard && firstCard.pairId === secondCard.pairId) {
      // Mark both cards as matched.
      setDeck((previous) =>
        previous.map((card) =>
          card.pairId === firstCard.pairId
            ? { ...card, isMatched: true }
            : card,
        ),
      );
      // Show toast with the desired format.
      toast.success("Richtig", firstCard.factCheck);
    }
  }, [firstCard, secondCard]);

  const resetSelection = () => {
    if (firstCard && secondCard && firstCard.pairId !== secondCard.pairId) {
      setDeck((previous) =>
        previous.map((card) =>
          card.instanceId === firstCard.instanceId ||
          card.instanceId === secondCard.instanceId
            ? { ...card, isFlipped: false }
            : card,
        ),
      );
    }
    setFirstCard(undefined);
    setSecondCard(undefined);
  };

  const handleCardPress = (card: MemoryCard) => {
    if (card.isFlipped || card.isMatched) return;
    // Falls bereits zwei Karten ausgewählt sind, Auswahl zurücksetzen.
    if (firstCard && secondCard) {
      resetSelection();
      return;
    }
    setDeck((previous) =>
      previous.map((c) =>
        c.instanceId === card.instanceId ? { ...c, isFlipped: true } : c,
      ),
    );
    if (!firstCard) {
      setFirstCard({ ...card, isFlipped: true });
    } else if (!secondCard) {
      setSecondCard({ ...card, isFlipped: true });
    }
  };

  const renderHeader = () => {
    const headerStyle: ViewStyle[] = [
      styles.headerContent,
      { backgroundColor: surfaceInput },
    ];
    let cardsToRender: MemoryCard[] = [];
    if (firstCard && secondCard) {
      const isMatch = firstCard.pairId === secondCard.pairId;
      headerStyle.push({ backgroundColor: isMatch ? accent : error });
      cardsToRender = [firstCard, secondCard];
    } else if (firstCard) {
      cardsToRender = [firstCard];
    }
    const headerTextColor =
      firstCard && secondCard ? Colors[colorScheme].onPrimary : text;
    if (cardsToRender.length > 0) {
      return (
        <View style={headerStyle}>
          <View style={styles.headerCardsContainer}>
            {cardsToRender.map((card) => (
              <View
                style={[styles.headerCard, { borderColor: headerTextColor }]}
                key={card.instanceId}
              >
                <UiText
                  size="sm"
                  style={[styles.headerCardText, { color: headerTextColor }]}
                >
                  {card.cardType === "misinfo" && card.fullContent
                    ? card.fullContent
                    : card.content}
                </UiText>
              </View>
            ))}
          </View>
        </View>
      );
    }
    return (
      <View style={headerStyle}>
        <UiText size="base" style={styles.headerText}>
          Tippe auf eine Karte, um deren Inhalt anzuzeigen.
        </UiText>
      </View>
    );
  };

  return (
    <View style={[styles.gameContainer, { backgroundColor: background }]}>
      <View style={styles.headerContainer}>{renderHeader()}</View>
      <View style={styles.grid}>
        {deck.map((card) => (
          <CardComponent
            key={card.instanceId}
            card={card}
            onPress={handleCardPress}
          />
        ))}
      </View>
      <Toast />
    </View>
  );
};

const screenWidth = Dimensions.get("window").width;

const styles = StyleSheet.create({
  gameContainer: { alignItems: "center" },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    justifyContent: "center",
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    width: screenWidth,
  },
  headerCard: {
    borderRadius: radii.xs,
    borderWidth: 1,
    flex: 1,
    marginHorizontal: spacing.xs,
    padding: spacing.xs,
  },
  headerCardText: { textAlign: "center" },
  headerCardsContainer: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    width: "100%",
  },
  headerContainer: {
    height: 180,
    width: screenWidth,
  },
  headerContent: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  },
  headerText: { textAlign: "center" },
});

export default MemoryGame;

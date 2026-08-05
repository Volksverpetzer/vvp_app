import { useEffect, useState } from "react";
import type { ViewStyle } from "react-native";
import { Dimensions, StyleSheet, View } from "react-native";
import Toast from "react-native-toast-message";

import UiText from "#/components/ui/UiText";
import { radii } from "#/constants/BorderRadius";
import Colors from "#/constants/Colors";
import { fontSizes } from "#/constants/FontSizes";
import { toast } from "#/helpers/toast";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";
import type { DisinfoPair, MemoryCard } from "#/types";

import CardComponent from "./CardComponent";
import { generateDeck } from "./GameHelper";

interface MemoryGameProperties {
  pairs: DisinfoPair[];
}

const MemoryGame = ({ pairs }: MemoryGameProperties) => {
  const colorScheme = useAppColorScheme();
  const [deck, setDeck] = useState<MemoryCard[]>([]);
  const [firstCard, setFirstCard] = useState<MemoryCard | undefined>();
  const [secondCard, setSecondCard] = useState<MemoryCard | undefined>();

  useEffect(() => {
    setDeck(generateDeck(pairs));
  }, [pairs]);

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
    const headerStyle: ViewStyle[] = [styles.headerContent];
    let cardsToRender: MemoryCard[] = [];
    if (firstCard && secondCard) {
      headerStyle.push(
        firstCard.pairId === secondCard.pairId
          ? styles.headerSuccess
          : styles.headerError,
      );
      cardsToRender = [firstCard, secondCard];
    } else if (firstCard) {
      cardsToRender = [firstCard];
    }
    if (cardsToRender.length > 0) {
      return (
        <View style={headerStyle}>
          <View style={styles.headerCardsContainer}>
            {cardsToRender.map((card) => (
              <View style={styles.headerCard} key={card.instanceId}>
                <UiText size="sm" style={styles.headerCardText}>
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
    <View
      style={[
        styles.gameContainer,
        { backgroundColor: Colors[colorScheme].background },
      ]}
    >
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
const cardSize = screenWidth / 3;

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    backgroundColor: "#eee",
    borderColor: "#eee",
    borderRadius: radii.xs,
    borderWidth: 2,
    height: cardSize - 10,
    justifyContent: "center",
    margin: 5,
    width: cardSize - 10,
  },
  cardInner: { alignItems: "center", justifyContent: "center" },
  cardText: { fontSize: fontSizes.base, textAlign: "center" },
  gameContainer: { alignItems: "center", flex: 1 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: 10,
    width: screenWidth,
  },
  headerCard: {
    borderColor: "#999",
    borderRadius: radii.xs,
    borderWidth: 1,
    flex: 1,
    marginHorizontal: 5,
    padding: 5,
  },
  headerCardText: { textAlign: "center" },
  headerCardsContainer: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    width: "100%",
  },
  headerContainer: {
    backgroundColor: "#f0f0f0",
    height: 180,
    width: screenWidth,
  },
  headerContent: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  headerError: { backgroundColor: "#f8d7da" },
  headerSuccess: { backgroundColor: "#d4edda" },
  headerText: { textAlign: "center" },
  matchedCard: { borderColor: "#28a745" },
  selectedCard: { borderColor: "#ffa500" },
});

export default MemoryGame;

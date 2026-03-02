import { useEffect, useState } from "react";
import type { ViewStyle } from "react-native";
import { Dimensions, StyleSheet } from "react-native";
import Toast from "react-native-toast-message";

import Text from "#/components/design/Text";
import View from "#/components/design/View";
import type { DisinfoPair, MemoryCard } from "#/types";

import CardComponent from "./CardComponent";
import { generateDeck } from "./GameHelper";

interface MemoryGameProperties {
  pairs: DisinfoPair[];
}

const MemoryGame = ({ pairs }: MemoryGameProperties) => {
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
      Toast.show({
        type: "success",
        text1: "Richtig",
        text2: firstCard.factCheck,
        position: "bottom",
      });
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
                <Text style={styles.headerCardText}>
                  {card.cardType === "misinfo" && card.fullContent
                    ? card.fullContent
                    : card.content}
                </Text>
              </View>
            ))}
          </View>
        </View>
      );
    }
    return (
      <View style={headerStyle}>
        <Text style={styles.headerText}>
          Tippen Sie auf eine Karte, um deren Inhalt anzuzeigen.
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.gameContainer}>
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
    borderRadius: 5,
    borderWidth: 2,
    height: cardSize - 10,
    justifyContent: "center",
    margin: 5,
    width: cardSize - 10,
  },
  cardInner: { alignItems: "center", justifyContent: "center" },
  cardText: { fontSize: 16, textAlign: "center" },
  gameContainer: { alignItems: "center", backgroundColor: "#fff", flex: 1 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: 10,
    width: screenWidth,
  },
  headerCard: {
    borderColor: "#999",
    borderRadius: 5,
    borderWidth: 1,
    flex: 1,
    marginHorizontal: 5,
    padding: 5,
  },
  headerCardText: { fontSize: 14, textAlign: "center" },
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
  headerText: { fontSize: 16, textAlign: "center" },
  matchedCard: { borderColor: "#28a745" },
  selectedCard: { borderColor: "#ffa500" },
});

export default MemoryGame;

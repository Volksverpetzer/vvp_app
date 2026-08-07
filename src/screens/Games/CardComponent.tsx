import type { ViewStyle } from "react-native";
import { Dimensions, StyleSheet, View } from "react-native";

import UiPressable from "#/components/ui/UiPressable";
import UiText from "#/components/ui/UiText";
import { radii } from "#/constants/BorderRadius";
import type { MemoryCard } from "#/types";

interface CardComponentProperties {
  card: MemoryCard;
  onPress: (card: MemoryCard) => void;
}

const CardComponent = ({ card, onPress }: CardComponentProperties) => {
  const getCardStyle = () => {
    const styleArray: ViewStyle[] = [cardStyles.card];
    if (card.isMatched) {
      styleArray.push(cardStyles.matchedCard);
    } else if (card.isFlipped) {
      styleArray.push(cardStyles.selectedCard);
    }
    return styleArray;
  };

  return (
    <UiPressable
      accessibilityRole="button"
      style={getCardStyle()}
      onPress={() => onPress(card)}
    >
      <View style={cardStyles.cardInner}>
        <UiText size="base" style={cardStyles.cardText}>
          {card.isFlipped || card.isMatched ? card.content : "?"}
        </UiText>
      </View>
    </UiPressable>
  );
};

const screenWidth = Dimensions.get("window").width;
const cardSize = screenWidth / 3;

const cardStyles = StyleSheet.create({
  card: {
    alignItems: "center",
    borderRadius: radii.xs,
    borderWidth: 2,
    height: cardSize - 10,
    justifyContent: "center",
    margin: 5,
    width: cardSize - 10,
  },
  cardInner: { alignItems: "center", justifyContent: "center" },
  cardText: { textAlign: "center" },
  matchedCard: { borderColor: "#28a745" },
  selectedCard: { borderColor: "#ffa500" },
});

export default CardComponent;

import {
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from "react-native";

import Text from "#/components/design/Text";
import View from "#/components/design/View";
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
    <TouchableOpacity
      accessibilityRole="button"
      style={getCardStyle()}
      onPress={() => onPress(card)}
    >
      <View style={cardStyles.cardInner}>
        <Text style={cardStyles.cardText}>
          {card.isFlipped || card.isMatched ? card.content : "?"}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const screenWidth = Dimensions.get("window").width;
const cardSize = screenWidth / 3;

const cardStyles = StyleSheet.create({
  card: {
    alignItems: "center",
    borderRadius: 5,
    borderWidth: 2,
    height: cardSize - 10,
    justifyContent: "center",
    margin: 5,
    width: cardSize - 10,
  },
  cardInner: { alignItems: "center", justifyContent: "center" },
  cardText: { fontSize: 16, textAlign: "center" },
  matchedCard: { borderColor: "#28a745" as const },
  selectedCard: { borderColor: "#ffa500" as const },
});

export default CardComponent;

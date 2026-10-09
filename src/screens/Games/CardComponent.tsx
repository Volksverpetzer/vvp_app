import type { ViewStyle } from "react-native";
import { Dimensions, StyleSheet, View } from "react-native";

import UiPressable from "#/components/ui/UiPressable";
import UiText from "#/components/ui/UiText";
import { radii } from "#/constants/BorderRadius";
import Colors from "#/constants/Colors";
import { spacing } from "#/constants/Spacing";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";
import type { MemoryCard } from "#/types";

interface CardComponentProperties {
  card: MemoryCard;
  onPress: (card: MemoryCard) => void;
}

const CardComponent = ({ card, onPress }: CardComponentProperties) => {
  const colorScheme = useAppColorScheme();
  const { accent, primary, surface, text, textMuted } = Colors[colorScheme];

  const getCardStyle = (): ViewStyle => {
    if (card.isMatched) {
      return { backgroundColor: surface, borderColor: primary };
    }
    if (card.isFlipped) {
      return { backgroundColor: surface, borderColor: accent };
    }
    return { backgroundColor: surface, borderColor: surface };
  };

  return (
    <UiPressable
      accessibilityRole="button"
      style={[cardStyles.card, getCardStyle()]}
      onPress={() => onPress(card)}
    >
      <View style={cardStyles.cardInner}>
        <UiText
          size="sm"
          bold={card.isFlipped || card.isMatched}
          style={[
            cardStyles.cardText,
            { color: card.isFlipped || card.isMatched ? text : textMuted },
          ]}
        >
          {card.isFlipped || card.isMatched ? card.content : "?"}
        </UiText>
      </View>
    </UiPressable>
  );
};

const screenWidth = Dimensions.get("window").width;
const cardSize = (screenWidth - spacing.md * 4) / 3;

const cardStyles = StyleSheet.create({
  card: {
    alignItems: "center",
    borderRadius: radii.md,
    borderWidth: 2,
    height: cardSize,
    justifyContent: "center",
    width: cardSize,
  },
  cardInner: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xs,
  },
  cardText: { textAlign: "center" },
});

export default CardComponent;

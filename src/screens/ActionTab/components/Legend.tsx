import type { ColorValue } from "react-native";
import { StyleSheet, View } from "react-native";

import UiText from "#/components/ui/UiText";
import { globalStyles } from "#/constants/GlobalStyles";

interface LegendProperties {
  text: string;
  color: ColorValue;
}

/**
 * Legend - kleines Farbfeld mit beschreibendem Text.
 * Props:
 * - text: Anzuzeigender Text
 * - color: Hintergrundfarbe des Legenden-Quadrats
 */
const Legend = ({ text, color }: LegendProperties) => {
  return (
    <View style={styles.legend}>
      <View style={{ backgroundColor: color, ...styles.dot }} />
      <UiText style={[styles.text, globalStyles.whiteText]}>{text}</UiText>
    </View>
  );
};

const styles = StyleSheet.create({
  legend: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dot: {
    borderColor: "white",
    borderRadius: 9,
    borderWidth: 1,
    height: 17,
    width: 17,
  },
  text: {
    flex: 1,
    flexWrap: "wrap",
  },
});

export default Legend;

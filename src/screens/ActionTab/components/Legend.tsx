import { StyleSheet, Text, View } from "react-native";

interface LegendProperties {
  text: string;
  color: string;
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
      <Text style={styles.text}>{text}</Text>
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
    color: "white",
  },
});

export default Legend;

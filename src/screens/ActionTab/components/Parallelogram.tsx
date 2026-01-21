import { ReactNode } from "react";
import { StyleSheet, Text, TextStyle, View, ViewStyle } from "react-native";

interface Properties {
  children: ReactNode;
  backgroundColor?: ViewStyle["backgroundColor"];
  color?: TextStyle["color"];
  containerStyle?: ViewStyle;
  textStyle?: TextStyle;
}

const Parallelogram = (properties: Properties) => {
  const { backgroundColor, color, children, containerStyle, textStyle } =
    properties;
  return (
    <View style={[styles.container, containerStyle]}>
      <View style={{ ...styles.parallelogram, backgroundColor }}>
        <Text style={{ ...styles.parallelogramText, color, ...textStyle }}>
          {children}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  parallelogram: {
    alignItems: "center",
    height: "100%",
    justifyContent: "center",
    paddingHorizontal: 20,
    transform: [{ skewX: "-10deg" }],
  },
  parallelogramText: {
    fontSize: 16,
    transform: [{ skewX: "10deg" }],
  },
});

export default Parallelogram;

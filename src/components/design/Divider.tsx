import { StyleSheet, View, ViewStyle } from "react-native";

import Colors from "#/constants/Colors";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";

type DividerProps = {
  paddingHorizontal?: number;
  paddingVertical?: number;
  thickness?: number;
  color?: string;
  style?: ViewStyle;
};

const Divider = ({
  paddingHorizontal = 0,
  paddingVertical = 0,
  thickness = StyleSheet.hairlineWidth,
  style,
}: DividerProps) => {
  const colorScheme = useAppColorScheme();
  const color = Colors[colorScheme].corporate;
  return (
    <View
      style={[
        styles.container,
        {
          paddingHorizontal,
          paddingVertical,
        },
        style,
      ]}
    >
      <View
        style={[styles.line, { height: thickness, backgroundColor: color }]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  line: {
    width: "100%",
  },
});

export default Divider;

import type { StyleProp, ViewStyle } from "react-native";
import { StyleSheet, View } from "react-native";

import Colors from "#/constants/Colors";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";

interface UiDividerProps {
  paddingHorizontal?: number;
  paddingVertical?: number;
  thickness?: number;
  style?: StyleProp<ViewStyle>;
}

const UiDivider = ({
  paddingHorizontal = 0,
  paddingVertical = 0,
  thickness = StyleSheet.hairlineWidth,
  style,
}: UiDividerProps) => {
  const colorScheme = useAppColorScheme();
  const color = Colors[colorScheme].primary;
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

export default UiDivider;

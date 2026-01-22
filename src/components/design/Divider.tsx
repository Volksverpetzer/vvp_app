import { StyleSheet, View, ViewStyle } from "react-native";

import Colors from "#/constants/Colors";
import useColorScheme from "#/hooks/useColorScheme";

type DividerProps = {
  padding?: number;
  thickness?: number;
  color?: string;
  style?: ViewStyle;
};

const Divider = ({
  padding = 0,
  thickness = StyleSheet.hairlineWidth,
  style,
}: DividerProps) => {
  const colorScheme = useColorScheme();
  const color = Colors[colorScheme].corporate;
  return (
    <View
      style={[
        styles.container,
        {
          paddingLeft: padding,
          paddingRight: padding,
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

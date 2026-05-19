import type { ReactElement } from "react";
import { Animated, Pressable } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";

import Colors from "#/constants/Colors";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";

interface TabIconLabelProps {
  icon: (color: string) => ReactElement;
  label: string;
  isActive: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  animatedLabelHeight?: Animated.AnimatedInterpolation<number>;
  animatedLabelOpacity?: Animated.AnimatedInterpolation<number>;
}

const labelBaseStyle = {
  alignSelf: "center" as const,
  fontFamily: "SourceSansProBold",
  fontSize: 12,
};

const TabIconLabel = ({
  icon,
  label,
  isActive,
  onPress,
  style,
  animatedLabelHeight,
  animatedLabelOpacity,
}: TabIconLabelProps) => {
  const colorScheme = useAppColorScheme();
  const primaryColor = Colors[colorScheme].primary;
  const mutedColor = Colors[colorScheme].iconMuted;
  const textColor = Colors[colorScheme].text;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[
        {
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: isActive ? primaryColor : mutedColor,
          paddingVertical: 10,
        },
        style,
      ]}
    >
      {icon(textColor)}
      {animatedLabelHeight != null ? (
        <Animated.View
          style={{ height: animatedLabelHeight, overflow: "hidden" }}
        >
          <Animated.Text
            style={[
              labelBaseStyle,
              { color: textColor, opacity: animatedLabelOpacity },
            ]}
          >
            {label}
          </Animated.Text>
        </Animated.View>
      ) : (
        <Animated.Text style={[labelBaseStyle, { color: textColor }]}>
          {label}
        </Animated.Text>
      )}
    </Pressable>
  );
};

export default TabIconLabel;

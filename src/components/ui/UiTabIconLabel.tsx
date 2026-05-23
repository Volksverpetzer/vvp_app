import type { ReactElement } from "react";
import { Animated } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";

import UiPressable from "#/components/ui/UiPressable";
import Colors from "#/constants/Colors";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";

interface UiTabIconLabelProps {
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
  lineHeight: 17,
};

const UiTabIconLabel = ({
  icon,
  label,
  isActive,
  onPress,
  style,
  animatedLabelHeight,
  animatedLabelOpacity,
}: UiTabIconLabelProps) => {
  const colorScheme = useAppColorScheme();
  const contentColor = isActive
    ? Colors[colorScheme].iconOnPrimary
    : Colors[colorScheme].iconMuted;
  const backgroundColor = isActive
    ? Colors[colorScheme].primary
    : Colors[colorScheme].muted;

  return (
    <UiPressable
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: isActive }}
      onPress={onPress}
      style={[
        {
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: backgroundColor,
        },
        style,
      ]}
    >
      {icon(contentColor)}
      {animatedLabelHeight != null ? (
        <Animated.View
          style={{ height: animatedLabelHeight, overflow: "hidden" }}
        >
          <Animated.Text
            style={[
              labelBaseStyle,
              { color: contentColor, opacity: animatedLabelOpacity },
            ]}
          >
            {label}
          </Animated.Text>
        </Animated.View>
      ) : (
        <Animated.Text style={[labelBaseStyle, { color: contentColor }]}>
          {label}
        </Animated.Text>
      )}
    </UiPressable>
  );
};

export default UiTabIconLabel;

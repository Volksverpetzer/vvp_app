import type { FC, ReactElement } from "react";
import type { ColorValue } from "react-native";
import { View as RNView } from "react-native";
import type { SwipeableMethods } from "react-native-gesture-handler/ReanimatedSwipeable";
import type { SharedValue } from "react-native-reanimated";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";

import UiPressable from "#/components/ui/UiPressable";
import UiText from "#/components/ui/UiText";
import Colors from "#/constants/Colors";
import { spacing } from "#/constants/Spacing";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";

interface RightActionProps {
  progress: SharedValue<number>;
  drag: SharedValue<number>;
  swipeable: SwipeableMethods;
  onAction: () => Promise<void> | void;
  label?: string;
  hint?: string;
  icon?: ReactElement;
  color?: ColorValue;
  backgroundColor?: ColorValue;
}

const RightAction: FC<RightActionProps> = ({
  drag,
  swipeable,
  onAction,
  label,
  hint,
  icon,
  color,
  backgroundColor,
}) => {
  const colorScheme = useAppColorScheme();
  const fg = color ?? "white";
  const bg = backgroundColor ?? Colors[colorScheme].accent;

  const actionStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      drag.value,
      [-120, 0],
      [0, 120],
      Extrapolation.CLAMP,
    );
    const opacity = interpolate(
      drag.value,
      [-120, -60, 0],
      [1, 1, 0],
      Extrapolation.CLAMP,
    );
    return { transform: [{ translateX }], opacity };
  });

  return (
    <RNView style={{ justifyContent: "center" }}>
      <UiPressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={hint}
        onPress={async () => {
          await onAction();
          swipeable.close();
        }}
      >
        <Animated.View
          style={[
            {
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: bg,
              paddingHorizontal: spacing.xl,
              height: "100%",
              gap: spacing.xs,
            },
            actionStyle,
          ]}
        >
          {icon}
          {label && <UiText style={{ color: fg }}>{label}</UiText>}
        </Animated.View>
      </UiPressable>
    </RNView>
  );
};

export default RightAction;

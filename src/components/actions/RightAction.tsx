import type { FC, ReactElement } from "react";
import { Pressable, Text as RNText, View as RNView } from "react-native";
import type { SwipeableMethods } from "react-native-gesture-handler/ReanimatedSwipeable";
import Animated, {
  Extrapolation,
  SharedValue,
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";

import Colors from "#/constants/Colors";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";

interface RightActionProps {
  progress: SharedValue<number>;
  drag: SharedValue<number>;
  swipeable: SwipeableMethods;
  onAction: () => Promise<void> | void;
  label?: string;
  hint?: string;
  icon?: ReactElement;
  color?: string;
  backgroundColor?: string;
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
  const bg = backgroundColor ?? Colors[colorScheme].highlight;

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
      <Pressable
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
              paddingHorizontal: 20,
              height: "100%",
              gap: 5,
            },
            actionStyle,
          ]}
        >
          {icon}
          {label && (
            <RNText style={{ color: fg, fontWeight: "bold" }}>{label}</RNText>
          )}
        </Animated.View>
      </Pressable>
    </RNView>
  );
};

export default RightAction;

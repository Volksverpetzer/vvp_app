import type { ReactNode } from "react";
import type { ColorValue, ViewStyle } from "react-native";
import { View } from "react-native";

import UiPressable from "#/components/ui/UiPressable";

export type BadgePosition =
  "topLeft" | "topRight" | "bottomLeft" | "bottomRight";

// Minimum touch target per Apple HIG (44pt) / Material (48dp) guidance.
export const MIN_TOUCH_TARGET = 44;

interface BadgeProperties {
  children: ReactNode;
  position: BadgePosition;
  color: ColorValue;
  onPress?: () => void;
  accessibilityLabel?: string;
}

const Badge = ({
  children,
  position,
  color,
  onPress,
  accessibilityLabel,
}: BadgeProperties) => {
  const isTop = position === "topLeft" || position === "topRight";
  const isLeft = position === "topLeft" || position === "bottomLeft";

  const style: ViewStyle = {
    backgroundColor: color,
    paddingVertical: 3,
    paddingHorizontal: 10,
    position: "absolute",
    ...(isTop ? { top: 0 } : { bottom: 0 }),
    ...(isLeft
      ? {
          left: 0,
          [isTop ? "borderBottomRightRadius" : "borderTopRightRadius"]: 5,
        }
      : {
          right: 0,
          [isTop ? "borderBottomLeftRadius" : "borderTopLeftRadius"]: 5,
        }),
  };

  if (onPress) {
    return (
      <UiPressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        hitSlop={8}
        onPress={onPress}
        style={[
          style,
          {
            minWidth: MIN_TOUCH_TARGET,
            minHeight: MIN_TOUCH_TARGET,
            alignItems: "center",
            justifyContent: "center",
          },
        ]}
      >
        {children}
      </UiPressable>
    );
  }

  return <View style={style}>{children}</View>;
};

export default Badge;

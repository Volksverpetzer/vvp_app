import type { ReactNode } from "react";
import type { ColorValue, ViewStyle } from "react-native";
import { View } from "react-native";

import UiPressable from "#/components/ui/UiPressable";
import { radii } from "#/constants/BorderRadius";
import { MIN_TOUCH_TARGET } from "#/constants/IconSizes";
import { spacing } from "#/constants/Spacing";

export type BadgePosition =
  "topLeft" | "topRight" | "bottomLeft" | "bottomRight";

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
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    position: "absolute",
    ...(isTop ? { top: 0 } : { bottom: 0 }),
    ...(isLeft
      ? {
          left: 0,
          [isTop ? "borderBottomRightRadius" : "borderTopRightRadius"]:
            radii.xs,
        }
      : {
          right: 0,
          [isTop ? "borderBottomLeftRadius" : "borderTopLeftRadius"]: radii.xs,
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
            // Keep the visible glyph anchored to the badge's own corner while
            // the (larger) touch target grows inward — otherwise a centered
            // icon floats toward the image middle and, on our title images,
            // lifts off the white footer strip onto the artwork.
            alignItems: isLeft ? "flex-start" : "flex-end",
            justifyContent: isTop ? "flex-start" : "flex-end",
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

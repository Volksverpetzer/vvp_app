import type { ReactNode } from "react";
import type { ViewStyle } from "react-native";
import { View } from "react-native";

import UiPressable from "#/components/ui/UiPressable";
import { radii } from "#/constants/BorderRadius";
import Colors from "#/constants/Colors";
import { MIN_TOUCH_TARGET } from "#/constants/IconSizes";
import { spacing } from "#/constants/Spacing";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";

export type BadgePosition =
  "topLeft" | "topRight" | "bottomLeft" | "bottomRight";

export type UiBadgeVariant = "primary" | "accent" | "transparent";

interface UiBadgeProperties {
  children: ReactNode;
  position: BadgePosition;
  /**
   * `primary` (default) — corporate color, for a category/type tag.
   * `accent` — brand accent color, for a highlighted stat or callout.
   * `transparent` — no background, for a badge whose content (e.g. an
   * icon) provides its own contrast.
   */
  variant?: UiBadgeVariant;
  onPress?: () => void;
  accessibilityLabel?: string;
}

/**
 * Small tag overlaid on a corner of an image or card (category label,
 * "Podcast" tag, view counter, image-credit info icon).
 */
const UiBadge = ({
  children,
  position,
  variant = "primary",
  onPress,
  accessibilityLabel,
}: UiBadgeProperties) => {
  const colorScheme = useAppColorScheme();
  const { accent, primary } = Colors[colorScheme];
  const backgroundColor =
    variant === "transparent"
      ? "transparent"
      : variant === "accent"
        ? accent
        : primary;

  const isTop = position === "topLeft" || position === "topRight";
  const isLeft = position === "topLeft" || position === "bottomLeft";

  const style: ViewStyle = {
    backgroundColor,
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

export default UiBadge;

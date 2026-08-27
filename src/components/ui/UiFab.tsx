import type { ReactNode } from "react";
import type { PressableProps, StyleProp, ViewStyle } from "react-native";

import UiPressable from "#/components/ui/UiPressable";
import Colors from "#/constants/Colors";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";

interface UiFabProperties {
  children: ReactNode;
  onPress: PressableProps["onPress"];
  /**
   * Diameter in px. The corner radius is always half of it, not a `radii`
   * token — per the note on `radii` in constants/BorderRadius.ts, a circle
   * sizes its own corner rather than coming from the radius scale.
   */
  size?: number;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Circular, icon-only pressable: a solid disc sized to its own diameter,
 * centering a single icon child. Used both for floating controls (e.g.
 * back-to-top) and standalone circular CTAs (e.g. the article footer's
 * share button) — position/elevation for a floating placement is the
 * caller's concern via `style`. For a button with a text label, use
 * {@link UiButton} instead.
 */
const UiFab = ({
  children,
  onPress,
  size = 48,
  accessibilityLabel,
  accessibilityHint,
  style,
}: UiFabProperties) => {
  const colorScheme = useAppColorScheme();
  const backgroundColor = Colors[colorScheme].primary;

  return (
    <UiPressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      onPress={onPress}
      style={[
        {
          alignItems: "center",
          justifyContent: "center",
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor,
          overflow: "hidden",
        },
        style,
      ]}
    >
      {children}
    </UiPressable>
  );
};

export default UiFab;
